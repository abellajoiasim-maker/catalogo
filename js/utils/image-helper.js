// ======================================================================
// js/utils/image-helper.js
// Abella Joias - ImageHelper v4.1 (CDN jsDelivr / GitHub)
//
// Mantém EXATAMENTE a mesma API pública da v4.0 (nenhuma página precisa
// mudar), mas corrige os pontos que faziam imagens "sumirem":
//
//  1. Caminhos já no layout do CDN ("categories/x.jpg", "products/X.webp",
//     "home/banner.jpg"...) caíam no placeholder. Agora são resolvidos.
//  2. Imagens de subcategoria vindas de gs:// / Firebase eram enviadas para
//     /categories/ (o teste "categoria" vinha antes de "subcategoria").
//  3. extrairSku() cortava qualquer coisa depois do último ponto: um código
//     sem extensão como "BF-01.0001" virava "BF-01". Agora só remove
//     extensões de imagem conhecidas.
//  4. Nomes com espaço, "#", "?", "%" ou acento geravam URL inválida
//     (ex.: "ABC#1.webp" pedia só "ABC"). Agora o nome do arquivo é
//     codificado com encodeURIComponent.
//  5. O placeholder era hospedado no próprio CDN: se o CDN falhasse, a
//     imagem de "fallback" também falhava e o card ficava vazio. Agora há
//     um fallback embutido (SVG data-URI) como último recurso.
//  6. Watchdog global: toda <img> que falhar é registrada
//     (ImageHelper.relatorioFalhas()) e trocada pelo placeholder, mesmo em
//     templates que esqueceram o onerror. Use ?debugImagens=1 na URL para
//     destacar visualmente as imagens que caíram no fallback.
//  7. Carregar este arquivo duas vezes não lança mais erro.
// ======================================================================

(function () {
    'use strict';

    if (typeof window === 'undefined' || window.ImageHelper) return;

    // ==========================================================
    // CONFIGURAÇÃO DO CDN
    // ⚠️ AJUSTE AQUI: usuário/repo/branch reais do repositório de imagens.
    // (Deve ser o MESMO configurado em "⚙️ GitHub" no Migrador de Imagens.)
    // ==========================================================
    const CDN_USER = 'abellajoiasim-maker';
    const CDN_REPO = 'abella-joias-cdn';
    const CDN_REF  = 'main';
    const CDN_BASE = `https://cdn.jsdelivr.net/gh/${CDN_USER}/${CDN_REPO}@${CDN_REF}`;

    // Pastas que existem no repositório do CDN.
    const PASTAS_CDN = ['products', 'categories', 'subcategorias', 'home', 'settings'];

    const PLACEHOLDER = `${CDN_BASE}/settings/placeholder.webp`;
    const CLOUD_FALLBACK = PLACEHOLDER;

    // Último recurso: não depende de rede nem do CDN.
    const FALLBACK_INLINE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
        '<rect width="400" height="400" fill="#f1ede6"/>' +
        '<path d="M200 140l45 45-45 75-45-75z" fill="none" stroke="#caa85c" stroke-width="6" stroke-linejoin="round"/>' +
        '<text x="200" y="320" text-anchor="middle" font-family="Georgia,serif" font-size="22" letter-spacing="6" fill="#b9a67a">ABELLA</text>' +
        '</svg>'
    );

    const EXT_IMAGEM = /\.(png|jpe?g|webp|gif|avif|bmp|svg|tiff?|heic)$/i;

    // ==========================================================
    // HELPERS INTERNOS
    // ==========================================================
    function safeString(valor = '') {
        return String(valor || '').trim();
    }

    function isHttpUrl(url = '') {
        return url.startsWith('http://') || url.startsWith('https://');
    }

    function isGsUrl(url = '') {
        return url.startsWith('gs://');
    }

    function isFirebaseStorageUrl(url = '') {
        return url.includes('firebasestorage.googleapis.com') || url.includes('firebasestorage.app');
    }

    // Extrai o caminho do objeto (ex.: "images/produtos/SKU.png") de uma URL do
    // Firebase Storage: .../v0/b/<bucket>/o/<caminho-codificado>?alt=media
    function caminhoDeUrlFirebase(url = '') {
        try {
            const m = url.match(/\/o\/([^?#]+)/);
            return m ? decodeURIComponent(m[1]) : '';
        } catch (e) {
            return '';
        }
    }

    function normalizarSlug(valor) {
        return safeString(valor)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
    }

    // decodeURIComponent que não explode com "%" solto.
    function decodificarSeguro(valor) {
        const s = safeString(valor);
        if (!/%[0-9a-f]{2}/i.test(s)) return s;
        try { return decodeURIComponent(s); } catch (e) { return s; }
    }

    // Remove SOMENTE extensões de imagem conhecidas.
    // "CJI-3222.png" -> "CJI-3222" | "BF-01.0001" -> "BF-01.0001" (intacto)
    function extrairSku(nomeArquivo) {
        return safeString(nomeArquivo).replace(EXT_IMAGEM, '');
    }

    // Monta a URL final de um arquivo do CDN (codifica o nome do arquivo).
    function cdnUrl(pasta, arquivo) {
        const limpo = decodificarSeguro(arquivo).replace(/^\/+/, '');
        const codificado = limpo.split('/').map(encodeURIComponent).join('/');
        return `${CDN_BASE}/${pasta}/${codificado}`;
    }

    // Produtos: o arquivo é sempre <SKU EM MAIÚSCULAS>.webp
    // (é exatamente o padrão que o Migrador de Imagens grava).
    function urlProdutoPorNome(nome) {
        // Mesma regra do Migrador: sem acento, em maiúsculas.
        const sku = extrairSku(decodificarSeguro(nome))
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase();
        if (!sku) return CLOUD_FALLBACK;
        return cdnUrl('products', `${sku}.webp`);
    }

    // Converte um caminho legado (gs:// ou Firebase) para a pasta equivalente do CDN.
    function mapearCaminhoLegado(caminho) {
        const partes = String(caminho || '').split('/').filter(Boolean);
        const nomeArquivo = partes[partes.length - 1] || '';
        const pastaAntiga = (partes[partes.length - 2] || '').toLowerCase();
        if (!nomeArquivo) return CLOUD_FALLBACK;

        if (pastaAntiga.includes('produto'))      return urlProdutoPorNome(nomeArquivo);
        // ATENÇÃO: "subcategoria" precisa ser testado ANTES de "categoria",
        // porque "subcategorias".includes("categoria") === true.
        if (pastaAntiga.includes('subcategoria')) return cdnUrl('subcategorias', nomeArquivo);
        if (pastaAntiga.includes('categoria'))    return cdnUrl('categories', nomeArquivo);
        if (/logo|home|banner|setting/.test(pastaAntiga)) return cdnUrl('home', nomeArquivo);
        return CLOUD_FALLBACK;
    }

    // ==========================================================
    // NÚCLEO: RESOLVER QUALQUER VALOR PARA UMA URL DO CDN
    // (nome "converterGsUrl" mantido por compatibilidade de API)
    // ==========================================================
    function converterGsUrl(url = '') {
        try {
            const valor = safeString(url);

            if (!valor) return CLOUD_FALLBACK;

            // Logo antiga hospedada no Firebase Storage -> logo do CDN.
            if (valor.includes('InCollage_20250630_100544920')) {
                return obterLogo();
            }

            // URL antiga do Firebase Storage gravada no banco.
            if (isHttpUrl(valor) && isFirebaseStorageUrl(valor)) {
                const caminho = caminhoDeUrlFirebase(valor);
                return caminho ? mapearCaminhoLegado(caminho) : CLOUD_FALLBACK;
            }

            // URL http(s) completa (CDN atual ou link externo) — usa direto.
            // Só garante que espaços não quebrem o atributo/URL.
            if (isHttpUrl(valor)) {
                return valor.replace(/ /g, '%20');
            }

            // gs://bucket/images/<pasta>/ARQUIVO.ext
            if (isGsUrl(valor)) {
                const semGs = valor.replace('gs://', '');
                const primeiraBarra = semGs.indexOf('/');
                if (primeiraBarra === -1) return CLOUD_FALLBACK;
                return mapearCaminhoLegado(semGs.substring(primeiraBarra + 1));
            }

            const semBarraInicial = valor.replace(/^\/+/, '');

            // Caminho legado relativo: "images/produtos/ARQUIVO.ext"
            if (/^images\//i.test(semBarraInicial)) {
                return mapearCaminhoLegado(semBarraInicial);
            }

            // Caminho já no layout do CDN: "categories/x.jpg", "products/X.webp"...
            const [primeiro, ...resto] = semBarraInicial.split('/');
            if (resto.length > 0 && PASTAS_CDN.includes(primeiro.toLowerCase())) {
                const pasta = primeiro.toLowerCase();
                if (pasta === 'products') return urlProdutoPorNome(resto.join('/'));
                return cdnUrl(pasta, resto.join('/'));
            }

            // Sem "/" = nome simples de produto (ex.: "SKU.png" ou "SKU")
            if (!semBarraInicial.includes('/')) {
                return urlProdutoPorNome(semBarraInicial);
            }

            return CLOUD_FALLBACK;

        } catch (error) {
            console.error('[ImageHelper:converterGsUrl]', error);
            return CLOUD_FALLBACK;
        }
    }

    // ==========================================================
    // RESOLUÇÃO DE IMAGENS POR ESTRUTURA (mesma API da v3/v4.0)
    // ==========================================================
    function obterImagemFallback() {
        return CLOUD_FALLBACK;
    }

    function obterLogo() {
        return `${CDN_BASE}/home/logo.webp`;
    }

    function obterImagemCategoria(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return cdnUrl('categories', `${cleanSlug}.jpg`);
    }

    function obterImagemCategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return cdnUrl('categories', `${cleanSlug}-grid.jpg`);
    }

    function obterImagemSubcategoria(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return cdnUrl('subcategorias', `${cleanSlug}.jpg`);
    }

    function obterImagemSubcategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return cdnUrl('subcategorias', `${cleanSlug}-grid.jpg`);
    }

    function obterImagemProduto(nomeArquivo) {
        if (!nomeArquivo) return obterImagemFallback();
        return converterGsUrl(safeString(nomeArquivo));
    }

    function obterImagem(item = {}) {
        if (!item || typeof item !== 'object') return CLOUD_FALLBACK;

        const primeiroDaLista = (lista) => {
            if (!Array.isArray(lista) || lista.length === 0) return null;
            const x = lista[0];
            return (x && typeof x === 'object') ? (x.url || x.src || x.imagem || x.image || null) : x;
        };

        const imagem = item.image || item.imagem || item.foto || item.thumbnail || item.thumb || item.capa ||
            primeiroDaLista(item.images) || primeiroDaLista(item.imagens) || null;

        if (!imagem) return CLOUD_FALLBACK;
        return converterGsUrl(imagem);
    }

    function aplicarFallback(img) {
        if (!img || typeof img !== 'object') return;
        img.onerror = () => {
            img.onerror = null;
            img.src = CLOUD_FALLBACK;
        };
    }

    function aplicarImagem(img, imagem) {
        if (!img) return;
        aplicarFallback(img);
        img.src = obterImagem({ image: imagem });
    }

    function possuiImagem(valor) {
        return typeof valor === 'string' && valor.trim() !== '';
    }

    // ==========================================================
    // WATCHDOG DE IMAGENS QUEBRADAS
    // ==========================================================
    const falhas = new Map(); // url -> { src, alt, pagina, vezes }

    function registrarFalha(img, src) {
        const existente = falhas.get(src);
        if (existente) { existente.vezes++; return; }
        falhas.set(src, {
            src,
            alt: img.getAttribute('alt') || '',
            pagina: location.pathname + location.search,
            vezes: 1
        });
        console.warn('[ImageHelper] Imagem não carregou (404/bloqueada):', src);
    }

    function relatorioFalhas() {
        return Array.from(falhas.values());
    }

    function instalarWatchdog() {
        if (typeof document === 'undefined') return;
        if (window.ABELLA_IMAGE_WATCHDOG === false) return;
        // No painel admin o "quebrado" precisa continuar visível para quem edita.
        if (/\/modulo\//.test(location.pathname)) return;

        if (/[?&]debugImagens=1/.test(location.search)) {
            const st = document.createElement('style');
            st.textContent = 'img[data-img-fallback]{outline:3px dashed #e11d48 !important;outline-offset:-3px}';
            document.head.appendChild(st);
        }

        // Evento "error" de <img> não faz bubble, mas pode ser capturado no document.
        document.addEventListener('error', (ev) => {
            const img = ev.target;
            if (!img || img.tagName !== 'IMG' || img.hasAttribute('data-sem-fallback')) return;

            const atual = img.getAttribute('src') || '';
            if (!atual || atual === FALLBACK_INLINE) return;

            const ehPlaceholder = atual === PLACEHOLDER || atual === window.AURORA_FALLBACK_IMAGE;
            if (ehPlaceholder) {
                // até o placeholder do CDN falhou -> SVG embutido (nunca mais falha)
                img.setAttribute('data-img-fallback', 'inline');
                img.src = FALLBACK_INLINE;
                return;
            }

            registrarFalha(img, atual);
            img.setAttribute('data-img-fallback', 'cdn');
            img.setAttribute('data-img-original', atual);
            img.src = PLACEHOLDER;
        }, true);
    }

    instalarWatchdog();

    // ==========================================================
    // EXPORTAÇÃO COMPACTA E CONGELADA (API pública preservada + novidades)
    // ==========================================================
    const ImageHelper = Object.freeze({
        PLACEHOLDER,
        FALLBACK_INLINE,
        CDN_BASE,
        converterGsUrl,
        obterLogo,
        obterImagemFallback,
        obterImagemCategoria,
        obterImagemCategoriaGrid,
        obterImagemSubcategoria,
        obterImagemSubcategoriaGrid,
        obterImagemProduto,
        obterImagem,
        aplicarFallback,
        aplicarImagem,
        possuiImagem,
        isGsUrl,
        isHttpUrl,
        relatorioFalhas
    });

    // ==========================================================
    // PONTE GLOBAL: resolverImagemFirebase
    // (nome mantido por compatibilidade com engine/render.js e as páginas)
    // ==========================================================
    function resolverImagemFirebase(valor) {
        if (typeof valor !== 'string' || !valor.trim()) return PLACEHOLDER;
        return converterGsUrl(valor);
    }

    const fixar = (nome, valor) =>
        Object.defineProperty(window, nome, { value: valor, writable: false, configurable: false });

    fixar('ImageHelper', ImageHelper);
    fixar('imageHelper', ImageHelper);
    fixar('obterImagemProduto', obterImagemProduto);
    fixar('obterImagemCategoria', obterImagemCategoria);
    fixar('obterImagemCategoriaGrid', obterImagemCategoriaGrid);
    fixar('obterImagemSubcategoria', obterImagemSubcategoria);
    fixar('obterImagemSubcategoriaGrid', obterImagemSubcategoriaGrid);
    fixar('obterLogo', obterLogo);
    fixar('obterImagemFallback', obterImagemFallback);
    fixar('resolverImagemFirebase', resolverImagemFirebase);

    console.info('[ImageHelper v4.1] CDN jsDelivr:', CDN_BASE);
})();
