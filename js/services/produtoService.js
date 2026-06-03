// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v3.1
// ======================================================================

const produtoService = {

    // ==========================================================
    // HELPERS
    // ==========================================================

    _safeString(valor = '') {

        return String(valor || '')
            .trim();

    },

    _safeNumber(valor = 0) {

        const n = parseFloat(valor);

        return Number.isFinite(n)
            ? n
            : 0;

    },

    _slug(texto = '') {

        return this
            ._safeString(texto)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    },

    _resolverImagem(produto) {

        const imagem =
            produto.image ||
            produto.imagem ||
            produto.foto ||
            produto.img ||
            '';

        if (!imagem) {

            return '';

        }

        if (imagem.startsWith('http')) {

            return imagem;

        }

        if (imagem.startsWith('gs://')) {

            try {

                const semGs =
                    imagem.replace(
                        'gs://',
                        ''
                    );

                const partes =
                    semGs.split('/');

                const bucket =
                    partes.shift();

                const arquivo =
                    partes.join('/');

                return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;

            } catch (e) {

                console.error(
                    'Erro converter imagem:',
                    e
                );

                return '';

            }

        }

        return imagem;

    },

    // ==========================================================
    // NORMALIZADOR
    // ==========================================================

    normalizarProduto(id, produto = {}) {

        const nome =
            this._safeString(
                produto.nome ||
                produto.name
            );

        const categoria =
            this._safeString(
                produto.category ||
                produto.categoria ||
                produto.categoryName
            );

        const subcategoria =
            this._safeString(
                produto.subcategory ||
                produto.subcategoria ||
                produto.subCategory ||
                produto.subcategoryName
            );

        const preco =
            this._safeNumber(
                produto.precoFinal ??
                produto.price ??
                produto.preco ??
                produto.valor ??
                0
            );

        const peso =
            this._safeNumber(
                produto.peso ??
                produto.weight ??
                produto.gramas ??
                0
            );

        let variacoes =
            produto.variacoes ||
            produto.variantes ||
            [];

        if (typeof variacoes === 'string') {

            variacoes =
                variacoes
                    .split(',')
                    .map(v => v.trim())
                    .filter(Boolean);

        }

        if (!Array.isArray(variacoes)) {

            variacoes = [];

        }

        return {

            // ==================================================
            // IDENTIFICAÇÃO
            // ==================================================

            id:
                id ||
                produto.id ||
                crypto.randomUUID(),

            sku:
                this._safeString(
                    produto.sku ||
                    id
                ),

            // ==================================================
            // NOME
            // ==================================================

            nome,
            name: nome,

            // ==================================================
            // CATEGORIAS
            // ==================================================

            categoria,
            category: categoria,

            categorySlug:
                produto.categorySlug ||
                this._slug(categoria),

            subcategoria,
            subcategory: subcategoria,

            subcategorySlug:
                produto.subcategorySlug ||
                this._slug(subcategoria),

            // ==================================================
            // PREÇOS
            // ==================================================

            precoFinal: preco,
            preco: preco,
            price: preco,

            // ==================================================
            // PESO
            // ==================================================

            peso,
            weight: peso,

            // ==================================================
            // DESCRIÇÃO
            // ==================================================

            descricao:
                produto.descricao ||
                produto.description ||
                '',

            description:
                produto.description ||
                produto.descricao ||
                '',

            // ==================================================
            // IMAGEM
            // ==================================================

            image:
                this._resolverImagem(produto),

            imagem:
                this._resolverImagem(produto),

            // ==================================================
            // PROMOÇÃO
            // ==================================================

            promo:
                this._safeNumber(
                    produto.promo
                ),

            badge:
                produto.badge ||
                '',

            // ==================================================
            // ESTOQUE
            // ==================================================

            estoque:
                this._safeNumber(
                    produto.estoque
                ),

            // ==================================================
            // VARIAÇÕES
            // ==================================================

            variacoes,
            variantes: variacoes,

            // ==================================================
            // STATUS
            // ==================================================

            paused:
                produto.paused === true,

            ativo:
                (
                    produto.paused !== true &&
                    produto.ativo !== false
                ),

            // ==================================================
            // DATAS
            // ==================================================

            createdAt:
                produto.createdAt ||
                Date.now(),

            updatedAt:
                produto.updatedAt ||
                produto.createdAt ||
                Date.now()

        };

    },

    // ==========================================================
    // LISTAR TODOS
    // ==========================================================

    async listarTodos() {

        try {

            const snap =
                await firebase
                    .database()
                    .ref('abella/products')
                    .once('value');

            const data =
                snap.val() || {};

            const lista =
                Object.keys(data).map(id => {

                    return this.normalizarProduto(
                        id,
                        data[id]
                    );

                });

            return lista.filter(p => p.ativo);

        } catch (err) {

            console.error(
                '[produtoService] erro listarTodos:',
                err
            );

            return [];

        }

    },

    // ==========================================================
    // BUSCAR POR ID
    // ==========================================================

    async buscarPorId(id) {

        try {

            if (!id) {

                return null;

            }

            const snap =
                await firebase
                    .database()
                    .ref(`abella/products/${id}`)
                    .once('value');

            const produto =
                snap.val();

            if (!produto) {

                return null;

            }

            return this.normalizarProduto(
                id,
                produto
            );

        } catch (err) {

            console.error(
                '[produtoService] erro buscarPorId:',
                err
            );

            return null;

        }

    },

    // ==========================================================
    // LISTAR POR CATEGORIA
    // ==========================================================

    async listarPorCategoria(categoriaSlug) {

        try {

            const todos =
                await this.listarTodos();

            return todos.filter(p =>

                (
                    p.categorySlug || ''
                ).toLowerCase()

                ===

                (
                    categoriaSlug || ''
                ).toLowerCase()

            );

        } catch (err) {

            console.error(
                '[produtoService] erro categoria:',
                err
            );

            return [];

        }

    },

    // ==========================================================
    // LISTAR POR SUBCATEGORIA
    // ==========================================================

    async listarPorSubcategoria(
        categoriaSlug,
        subcategoriaSlug
    ) {

        try {

            const todos =
                await this.listarTodos();

            return todos.filter(p => {

                const categoriaOK =

                    (
                        p.categorySlug || ''
                    ).toLowerCase()

                    ===

                    (
                        categoriaSlug || ''
                    ).toLowerCase();

                const subcategoriaOK =

                    (
                        p.subcategorySlug || ''
                    ).toLowerCase()

                    ===

                    (
                        subcategoriaSlug || ''
                    ).toLowerCase();

                return (
                    categoriaOK &&
                    subcategoriaOK
                );

            });

        } catch (err) {

            console.error(
                '[produtoService] erro subcategoria:',
                err
            );

            return [];

        }

    }

};

// ==========================================================
// EXPORT GLOBAL
// ==========================================================

window.produtoService = produtoService;

console.log(
    '📦 ProdutoService Premium v3.1 carregado.'
);
