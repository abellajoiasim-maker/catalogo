// ======================================================================
// js/utils/image-helper.js
// Abella Joias - ImageHelper v4.0 (Migrado para CDN jsDelivr / GitHub)
// Substitui o Firebase Storage (indisponível) por um repositório
// público de imagens servido via jsDelivr.
// Mantém EXATAMENTE a mesma API pública da v3.0 para não exigir
// nenhuma alteração em outras páginas (produtos.html, carrinho.html,
// index.html, checkout.html, subcategorias.html, engine/render.js).
// ======================================================================

const ImageHelper = (() => {
    'use strict';

    // ==========================================================
    // CONFIGURAÇÃO DO CDN
    // ⚠️ AJUSTE AQUI: troque pelo seu usuário/repo/branch reais.
    // ==========================================================
const CDN_USER = 'abellajoiasim-maker';  // seu usuário do GitHub
const CDN_REPO = 'abella-joias-cdn';     // nome do repositório
const CDN_REF  = 'main';                 // branch ou tag (ex: 'main', 'v1')
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${CDN_USER}/${CDN_REPO}@${CDN_REF}`;
    // Placeholder local, servido pelo próprio CDN (evita depender de
    // serviços externos como via.placeholder.com, que podem cair).
    // Suba uma imagem chamada "placeholder.webp" dentro de settings/.
    const PLACEHOLDER = `${CDN_BASE}/settings/placeholder.webp`;
    const CLOUD_FALLBACK = PLACEHOLDER;

    // ==========================================================
    // HELPERS INTERNOS DE SANITIZAÇÃO
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

    function normalizarSlug(valor) {
        return safeString(valor)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
    }

    // Remove a extensão de arquivo (.png, .jpg, .jpeg, .webp...) para
    // extrair só o SKU, já que o banco pode ter salvo o nome com a
    // extensão antiga (ex.: "CJI-3222.png") mas o arquivo real no CDN
    // agora é sempre ".webp".
    function extrairSku(nomeArquivo) {
        return safeString(nomeArquivo).replace(/\.[a-zA-Z0-9]+$/, '');
    }

    // ==========================================================
    // NÚCLEO: RESOLVER QUALQUER VALOR PARA UMA URL DO CDN
    // Mantém o nome "converterGsUrl" por compatibilidade de API,
    // mas agora resolve para o jsDelivr em vez do Firebase.
    // ==========================================================
    function converterGsUrl(url = '') {
        try {
            const valor = safeString(url);

            if (!valor) {
                return CLOUD_FALLBACK;
            }

            // Já é uma URL http(s) completa (ex.: link externo) — usa direto.
            if (isHttpUrl(valor)) {
                return valor;
            }

            // Formato antigo gs://bucket/images/produtos/ARQUIVO.ext
            // ou gs://bucket/images/categorias/slug.jpg etc.
            if (isGsUrl(valor)) {
                const semGs = valor.replace('gs://', '');
                const primeiraBarra = semGs.indexOf('/');
                if (primeiraBarra === -1) return CLOUD_FALLBACK;

                const caminho = semGs.substring(primeiraBarra + 1); // ex: images/produtos/ARQUIVO.ext
                const partes = caminho.split('/').filter(Boolean);

                // pega o último segmento como nome de arquivo e tenta
                // identificar a pasta (produtos, categorias, etc.)
                const nomeArquivo = partes[partes.length - 1] || '';
                const pastaAntiga = (partes[partes.length - 2] || '').toLowerCase();

                if (pastaAntiga.includes('produto')) {
                    return `${CDN_BASE}/products/${extrairSku(nomeArquivo)}.webp`;
                }
                if (pastaAntiga.includes('categoria-grid')) {
                    return `${CDN_BASE}/categories/${nomeArquivo}`;
                }
                if (pastaAntiga.includes('categoria')) {
                    return `${CDN_BASE}/categories/${nomeArquivo}`;
                }
                if (pastaAntiga.includes('subcategoria')) {
                    return `${CDN_BASE}/subcategorias/${nomeArquivo}`;
                }
                if (pastaAntiga.includes('logo') || pastaAntiga.includes('home')) {
                    return `${CDN_BASE}/home/${nomeArquivo}`;
                }
                return CLOUD_FALLBACK;
            }

            // Caminho relativo simples tipo "images/produtos/ARQUIVO.ext"
            if (valor.startsWith('/images/') || valor.startsWith('images/')) {
                return converterGsUrl(`gs://legacy/${valor.replace(/^\/+/, '')}`);
            }

            // Sem "/" = nome de arquivo simples de produto (ex.: "SKU.png")
            if (!valor.includes('/')) {
                return `${CDN_BASE}/products/${extrairSku(valor)}.webp`;
            }

            return CLOUD_FALLBACK;

        } catch (error) {
            console.error('[ImageHelper:converterGsUrl]', error);
            return CLOUD_FALLBACK;
        }
    }

    // ==========================================================
    // RESOLUÇÃO DE IMAGENS POR ESTRUTURA (mesma API da v3.0)
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
        return `${CDN_BASE}/categories/${cleanSlug}.jpg`;
    }

    function obterImagemCategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return `${CDN_BASE}/categories/${cleanSlug}-grid.jpg`;
    }

    function obterImagemSubcategoria(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return `${CDN_BASE}/subcategorias/${cleanSlug}.jpg`;
    }

    function obterImagemSubcategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return `${CDN_BASE}/subcategorias/${cleanSlug}-grid.jpg`;
    }

    function obterImagemProduto(nomeArquivo) {
        if (!nomeArquivo) return obterImagemFallback();

        const valor = safeString(nomeArquivo);

        if (isHttpUrl(valor) || isGsUrl(valor)) {
            return converterGsUrl(valor);
        }

        return `${CDN_BASE}/products/${extrairSku(valor)}.webp`;
    }

    function obterImagem(item = {}) {
        if (!item || typeof item !== 'object') return CLOUD_FALLBACK;

        const imagem = item.image || item.imagem || item.foto || item.thumbnail || item.thumb || item.capa ||
            (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
            (Array.isArray(item.imagens) && item.imagens.length > 0 ? item.imagens[0] : null) ||
            null;

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
    // EXPORTAÇÃO COMPACTA E CONGELADA (mesma API pública da v3.0)
    // ==========================================================
    return Object.freeze({
        PLACEHOLDER,
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
        isHttpUrl
    });
})();

// ==========================================================
// FIXAÇÃO DAS PROPRIEDADES NO ESCOPO GLOBAL (WINDOW)
// ==========================================================
Object.defineProperty(window, 'ImageHelper', { value: ImageHelper, writable: false, configurable: false });
Object.defineProperty(window, 'imageHelper', { value: ImageHelper, writable: false, configurable: false });

Object.defineProperty(window, 'obterImagemProduto', { value: ImageHelper.obterImagemProduto, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemCategoria', { value: ImageHelper.obterImagemCategoria, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemCategoriaGrid', { value: ImageHelper.obterImagemCategoriaGrid, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemSubcategoria', { value: ImageHelper.obterImagemSubcategoria, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemSubcategoriaGrid', { value: ImageHelper.obterImagemSubcategoriaGrid, writable: false, configurable: false });
Object.defineProperty(window, 'obterLogo', { value: ImageHelper.obterLogo, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemFallback', { value: ImageHelper.obterImagemFallback, writable: false, configurable: false });

// ==========================================================
// PONTE GLOBAL: resolverImagemFirebase
// Mantido com o mesmo nome por compatibilidade com engine/render.js
// e as páginas que já chamam essa função — agora resolve para o CDN
// jsDelivr em vez do Firebase Storage.
// ==========================================================
function resolverImagemFirebase(valor) {
    if (typeof valor !== 'string' || !valor.trim()) {
        return ImageHelper.PLACEHOLDER;
    }
    if (ImageHelper.isHttpUrl(valor) || ImageHelper.isGsUrl(valor)) {
        return ImageHelper.converterGsUrl(valor);
    }
    // Sem barra "/" = nome de arquivo de produto (ex: "SKU.png" ou "SKU")
    if (!valor.includes('/')) {
        return ImageHelper.obterImagemProduto(valor);
    }
    // Com barra = caminho relativo (categorias, banners, logo, etc.)
    return ImageHelper.converterGsUrl(valor);
}

Object.defineProperty(window, 'resolverImagemFirebase', { value: resolverImagemFirebase, writable: false, configurable: false });

console.info('[ImageHelper v4.0] Migrado para CDN jsDelivr:', ImageHelper.CDN_BASE);
