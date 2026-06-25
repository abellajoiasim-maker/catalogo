/* ======================================================================
   IMAGENS CENTRALIZADAS ABELLA JOIAS - v3.1 (Anti-Quebra / Segura)
   ====================================================================== */

const STORAGE_ROOT = 'gs://catalogo-abella-joias.firebasestorage.app/images';

/* ======================================================================
   HELPERS DE RESOLUÇÃO SEGURO (Previne erros caso ImageHelper demore a carregar)
   ====================================================================== */
function obterPlaceholderSeguro() {
    if (window.ImageHelper && window.ImageHelper.PLACEHOLDER) {
        return window.ImageHelper.PLACEHOLDER;
    }
    if (window.StorageUtils && window.StorageUtils.PLACEHOLDER) {
        return window.StorageUtils.PLACEHOLDER;
    }
    // Fallback estrito final absoluto
    return 'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA';
}

function resolverImagemFirebase(path) {
    try {
        if (!path) return obterPlaceholderSeguro();

        // Verifica dinamicamente se o ImageHelper já está disponível no window
        const helper = window.ImageHelper || window.imageHelper;
        
        if (helper && typeof helper.converterGsUrl === 'function') {
            return helper.converterGsUrl(path);
        }
        
        // Segundo Fallback dinâmico usando o StorageUtils se disponível
        if (window.StorageUtils && typeof window.StorageUtils.converterUrlStorage === 'function') {
            return window.StorageUtils.converterUrlStorage(path);
        }

        // Se nenhum helper foi carregado no DOM ainda, devolve o path ou o placeholder
        return obterPlaceholderSeguro();
    } catch (error) {
        console.error('[Imagens:resolverImagemFirebase] Erro ao converter URL:', error);
        return obterPlaceholderSeguro();
    }
}

/* ======================================================================
   NORMALIZAÇÃO
   ====================================================================== */
function normalizarSlug(valor) {
    return String(valor || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
}

/* ======================================================================
   FALLBACK
   ====================================================================== */
function obterImagemFallback() {
    return resolverImagemFirebase(`${STORAGE_ROOT}/fallback.jpg`);
}

/* ======================================================================
   LOGO
   ====================================================================== */
function obterLogo() {
    return resolverImagemFirebase(`${STORAGE_ROOT}/logo/logo.png`);
}

/* ======================================================================
   CATEGORIAS - HERO E GRID
   ====================================================================== */
function obterImagemCategoria(slug) {
    const cleanSlug = normalizarSlug(slug);
    if (!cleanSlug) return obterImagemFallback();
    return resolverImagemFirebase(`${STORAGE_ROOT}/categorias/${cleanSlug}.jpg`);
}

function obterImagemCategoriaGrid(slug) {
    const cleanSlug = normalizarSlug(slug);
    if (!cleanSlug) return obterImagemFallback();
    return resolverImagemFirebase(`${STORAGE_ROOT}/categoria-grid/${cleanSlug}.jpg`);
}

/* ======================================================================
   SUBCATEGORIAS - HERO E GRID
   ====================================================================== */
function obterImagemSubcategoria(slug) {
    const cleanSlug = normalizarSlug(slug);
    if (!cleanSlug) return obterImagemFallback();
    return resolverImagemFirebase(`${STORAGE_ROOT}/subcategorias/${cleanSlug}.jpg`);
}

function obterImagemSubcategoriaGrid(slug) {
    const cleanSlug = normalizarSlug(slug);
    if (!cleanSlug) return obterImagemFallback();
    return resolverImagemFirebase(`${STORAGE_ROOT}/subcategoria-grid/${cleanSlug}.jpg`);
}

/* ======================================================================
   PRODUTOS
   ====================================================================== */
function obterImagemProduto(nomeArquivo) {
    if (!nomeArquivo) return obterImagemFallback();
    
    // Se o nome do arquivo já vier com o caminho completo gs:// ou http, não interpola
    if (String(nomeArquivo).startsWith('gs://') || String(nomeArquivo).startsWith('http')) {
        return resolverImagemFirebase(nomeArquivo);
    }
    
    return resolverImagemFirebase(`${STORAGE_ROOT}/produtos/${nomeArquivo}`);
}

// Vincula as funções ao escopo global explicitamente para isolamento seguro
window.obterImagemProduto = obterImagemProduto;
window.obterImagemCategoria = obterImagemCategoria;
window.obterImagemCategoriaGrid = obterImagemCategoriaGrid;
window.obterImagemSubcategoria = obterImagemSubcategoria;
window.obterImagemSubcategoriaGrid = obterImagemSubcategoriaGrid;
window.obterLogo = obterLogo;
window.obterImagemFallback = obterImagemFallback;
