// ======================================================================
// js/utils/image-helper.js
// Abella Joias - ImageHelper v3.0 (Versão Unificada, Final e Corrigida)
// Compatível com GitHub Pages • Resolução de Mapeamentos, Slugs e Storage
// Arquitetura Homologada PMA V8 - Arquivo Completo e Selado
// ======================================================================

const ImageHelper = (() => {
    'use strict';

    // ==========================================================
    // CONFIGURAÇÕES E CONSTANTES
    // ==========================================================
    const PLACEHOLDER = 'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA';
    const FIREBASE_STORAGE_HOST = 'https://firebasestorage.googleapis.com/v0/b';
    const BUCKET_NAME = 'catalogo-abella-joias.firebasestorage.app';
    const STORAGE_ROOT = `gs://${BUCKET_NAME}/images`;
    const CLOUD_FALLBACK = 'https://firebasestorage.googleapis.com/v0/b/catalogo-abella-joias.firebasestorage.app/o/images%2Flogo%2FInCollage_20250630_100544920-01.jpeg?alt=media';

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

    // ==========================================================
    // NÚCLEO: CONVERTER GS:// OU PATH PARA HTTPS URL REAL
    // ==========================================================
    function converterGsUrl(url = '') {
        try {
            let pathOriginal = safeString(url);

            if (!pathOriginal) {
                return CLOUD_FALLBACK;
            }

            if (isHttpUrl(pathOriginal)) {
                return pathOriginal;
            }

            if (
                pathOriginal.startsWith('/images/') || pathOriginal.startsWith('images/') ||
                pathOriginal.startsWith('/storage/') || pathOriginal.startsWith('storage/')
            ) {
                const cleanRelative = pathOriginal.replace(/^\/+/, '');
                pathOriginal = `gs://${BUCKET_NAME}/${cleanRelative}`;
            }

            if (isGsUrl(pathOriginal)) {
                const semGs = pathOriginal.replace('gs://', '');
                const primeiraBarra = semGs.indexOf('/');

                if (primeiraBarra === -1) {
                    return CLOUD_FALLBACK;
                }

                const bucket = semGs.substring(0, primeiraBarra);
                const caminho = semGs.substring(primeiraBarra + 1);

                if (!bucket || !caminho) {
                    return CLOUD_FALLBACK;
                }

                return `${FIREBASE_STORAGE_HOST}/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;
            }

            return `${FIREBASE_STORAGE_HOST}/${BUCKET_NAME}/o/${encodeURIComponent(pathOriginal)}?alt=media`;

        } catch (error) {
            console.error('[PMA V8] [ImageHelper:converterGsUrl]', error);
            return CLOUD_FALLBACK;
        }
    }

    // ==========================================================
    // RESOLUÇÃO DE IMAGENS POR INTERPOLAÇÃO / ESTRUTURA
    // ==========================================================
    function obterImagemFallback() {
        return CLOUD_FALLBACK;
    }

    function obterLogo() {
        return converterGsUrl(`${STORAGE_ROOT}/logo/logo.png`);
    }

    function obterImagemCategoria(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return converterGsUrl(`${STORAGE_ROOT}/categorias/${cleanSlug}.jpg`);
    }

    function obterImagemCategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return converterGsUrl(`${STORAGE_ROOT}/categoria-grid/${cleanSlug}.jpg`);
    }

    function obterImagemSubcategoria(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obterImagemFallback();
        return converterGsUrl(`${STORAGE_ROOT}/subcategorias/${cleanSlug}.jpg`);
    }

    function obterImagemSubcategoriaGrid(slug) {
        const cleanSlug = normalizarSlug(slug);
        if (!cleanSlug) return obtenerImagemFallback();
        return converterGsUrl(`${STORAGE_ROOT}/subcategoria-grid/${cleanSlug}.jpg`);
    }

    function obterImagemProduto(nomeArquivo) {
        if (!nomeArquivo) return obterImagemFallback();
        
        if (String(nomeArquivo).startsWith('gs://') || String(nomeArquivo).startsWith('http')) {
            return converterGsUrl(nomeArquivo);
        }
        
        return converterGsUrl(`${STORAGE_ROOT}/produtos/${nomeArquivo}`);
    }

    function obterImagem(item = {}) {
        if (!item || typeof item !== 'object') return CLOUD_FALLBACK;

        const imagem = item.image || item.imagem || item.foto || item.thumbnail || item.thumb || item.capa ||
            (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
            (Array.isArray(item.imagens) && item.imagens.length > 0 ? item.imagens[0] : null) || 
            CLOUD_FALLBACK;

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
    // EXPORTAÇÃO COMPACTA E CONGELADA
    // ==========================================================
    return Object.freeze({
        PLACEHOLDER,
        STORAGE_ROOT,
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

// Atalhos Globais Corrigidos (Apontando diretamente para as propriedades exportadas e congeladas)
Object.defineProperty(window, 'obterImagemProduto', { value: ImageHelper.obterImagemProduto, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemCategoria', { value: ImageHelper.obterImagemCategoria, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemCategoriaGrid', { value: ImageHelper.obterImagemCategoriaGrid, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemSubcategoria', { value: ImageHelper.obterImagemSubcategoria, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemSubcategoriaGrid', { value: ImageHelper.obterImagemSubcategoriaGrid, writable: false, configurable: false });
Object.defineProperty(window, 'obterLogo', { value: ImageHelper.obterLogo, writable: false, configurable: false });
Object.defineProperty(window, 'obterImagemFallback', { value: ImageHelper.obterImagemFallback, writable: false, configurable: false });

// ==========================================================
// PONTE GLOBAL: resolverImagemFirebase
// Usada pelo engine/render.js e várias páginas (produtos.html,
// carrinho.html, index.html, checkout.html, subcategorias.html)
// para converter o valor salvo no banco (nome de arquivo simples
// como "SKU.png", caminho relativo, gs:// ou URL completa) na
// URL real e carregável do Firebase Storage.
// Antes desta função não existir em lugar nenhum do projeto,
// causando 404 em todas as imagens de produto.
// ==========================================================
function resolverImagemFirebase(valor) {
    const fallbackUrl = (typeof CLOUD_FALLBACK !== 'undefined') ? CLOUD_FALLBACK : '';

    if (typeof valor !== 'string' || !valor.trim()) {
        return fallbackUrl;
    }
    if (ImageHelper.isHttpUrl(valor) || ImageHelper.isGsUrl(valor)) {
        return ImageHelper.converterGsUrl(valor);
    }
    // Sem barra "/" = nome de arquivo de produto (ex: "SKU.png")
    if (!valor.includes('/')) {
        return ImageHelper.obterImagemProduto(valor);
    }
    // Com barra = caminho relativo (categorias, banners, logo, etc.)
    return ImageHelper.converterGsUrl(valor);
}

Object.defineProperty(window, 'resolverImagemFirebase', { value: resolverImagemFirebase, writable: false, configurable: false });

console.info('[PMA V8] 🖼️ ImageHelper v3.0 unificado, fixado e blindado globalmente.');
