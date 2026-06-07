/* ==========================================================
   IMAGENS CENTRALIZADAS ABELLA JOIAS
   ========================================================== */

const STORAGE_ROOT =
    'gs://catalogo-abella-joias.firebasestorage.app/images';

/* ==========================================================
   FALLBACK
   ========================================================== */

function obterImagemFallback() {
    return resolverImagemFirebase(
        `${STORAGE_ROOT}/fallback.jpg`
    );
}

/* ==========================================================
   LOGO
   ========================================================== */

function obterLogo() {
    return resolverImagemFirebase(
        `${STORAGE_ROOT}/logo/logo.png`
    );
}

/* ==========================================================
   CATEGORIAS
   HERO GRANDE (AMBIENTADA)
   ========================================================== */

function obterImagemCategoria(slug) {
    if (!slug) return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/categorias/${slug}.jpg`
    );
}

/* ==========================================================
   CATEGORIAS
   CARD DO GRID
   ========================================================== */

function obterImagemCategoriaGrid(slug) {
    if (!slug) return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/categoria-grid/${slug}.jpg`
    );
}

/* ==========================================================
   SUBCATEGORIAS
   HERO GRANDE (AMBIENTADA)
   ========================================================== */

function obterImagemSubcategoria(slug) {
    if (!slug) return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/subcategorias/${slug}.jpg`
    );
}

/* ==========================================================
   SUBCATEGORIAS
   CARD DO GRID
   ========================================================== */

function obterImagemSubcategoriaGrid(slug) {
    if (!slug) return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/subcategoria-grid/${slug}.jpg`
    );
}

/* ==========================================================
   PRODUTOS
   IMAGEM CATÁLOGO
   ========================================================== */

function obterImagemProduto(nomeArquivo) {
    if (!nomeArquivo) return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/produtos/${nomeArquivo}`
    );
}
