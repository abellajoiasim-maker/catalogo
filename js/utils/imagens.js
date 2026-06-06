function obterLogo() {
    return resolverImagemFirebase(
        'images/logo/logo.png'
    );
}

function obterImagemCategoria(slug) {
    return resolverImagemFirebase(
        `images/categorias/${slug}.jpg`
    );
}

function obterImagemCategoriaGrid(slug) {
    return resolverImagemFirebase(
        `images/categorias-grid/${slug}.jpg`
    );
}

function obterImagemSubcategoria(slug) {
    return resolverImagemFirebase(
        `images/subcategorias/${slug}.jpg`
    );
}

function obterImagemSubcategoriaGrid(slug) {
    return resolverImagemFirebase(
        `images/subcategorias-grid/${slug}.jpg`
    );
}
