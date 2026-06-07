/* ==========================================================
   IMAGENS CENTRALIZADAS ABELLA JOIAS
   ========================================================== */

const STORAGE_ROOT =
    'gs://catalogo-abella-joias.firebasestorage.app/images';

/* ==========================================================
   NORMALIZAÇÃO
   ========================================================== */

function normalizarSlug(valor) {

    return String(valor || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');
}

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
   CATEGORIAS - HERO
   ========================================================== */

function obterImagemCategoria(slug) {

    slug = normalizarSlug(slug);

    if (!slug)
        return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/categorias/${slug}.jpg`
    );
}

/* ==========================================================
   CATEGORIAS - GRID
   ========================================================== */

function obterImagemCategoriaGrid(slug) {

    slug = normalizarSlug(slug);

    if (!slug)
        return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/categoria-grid/${slug}.jpg`
    );
}

/* ==========================================================
   SUBCATEGORIAS - HERO
   ========================================================== */

function obterImagemSubcategoria(slug) {

    slug = normalizarSlug(slug);

    if (!slug)
        return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/subcategorias/${slug}.jpg`
    );
}

/* ==========================================================
   SUBCATEGORIAS - GRID
   ========================================================== */

function obterImagemSubcategoriaGrid(slug) {

    slug = normalizarSlug(slug);

    if (!slug)
        return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/subcategoria-grid/${slug}.jpg`
    );
}

/* ==========================================================
   PRODUTOS
   ========================================================== */

function obterImagemProduto(nomeArquivo) {

    if (!nomeArquivo)
        return obterImagemFallback();

    return resolverImagemFirebase(
        `${STORAGE_ROOT}/produtos/${nomeArquivo}`
    );
}

/* ==========================================================
   FIREBASE STORAGE
   ========================================================== */

function resolverImagemFirebase(path) {

    if (!path)
        return obterImagemFallback();

    return ImageHelper.converterGsUrl(path);
}
