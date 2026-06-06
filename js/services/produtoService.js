// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v4.0
// ======================================================================

(function () {

    'use strict';

    const PRODUCTS_PATH =
        getAbellaPath('products');

    const produtoService = {

        // ======================================================
        // CACHE
        // ======================================================

        _cache: null,

        _cacheTimestamp: 0,

        _cacheTTL: 60000,

        // ======================================================
        // DATABASE
        // ======================================================

        _db() {

            if (!window.db) {

                throw new Error(
                    'Firebase Database não inicializado.'
                );
            }

            return window.db;
        },

        // ======================================================
        // REF
        // ======================================================

        _ref() {

            return this
                ._db()
                .ref(PRODUCTS_PATH);
        },

        // ======================================================
        // CACHE VALIDATION
        // ======================================================

        _isCacheValid() {

            return Boolean(

                this._cache &&

                (
                    Date.now() -
                    this._cacheTimestamp
                ) < this._cacheTTL

            );
        },

        invalidateCache() {

            this._cache = null;

            this._cacheTimestamp = 0;
        },

        // ======================================================
        // HELPERS
        // ======================================================

        _safeString(valor = '') {

            return String(valor || '')
                .trim();
        },

        _safeNumber(valor = 0) {

            const n =
                parseFloat(valor);

            return Number.isFinite(n)
                ? n
                : 0;
        },

        _safeArray(valor) {

            if (Array.isArray(valor)) {

                return valor
                    .map(v => String(v).trim())
                    .filter(Boolean);
            }

            if (typeof valor === 'string') {

                return valor
                    .split(',')
                    .map(v => v.trim())
                    .filter(Boolean);
            }

            return [];
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

        // ======================================================
        // STORAGE URL
        // ======================================================

        _resolverImagem(produto = {}) {

            const imagemOriginal =

                produto.image ||

                produto.imagem ||

                produto.foto ||

                produto.img ||

                '';

            const imagem =
                this._safeString(
                    imagemOriginal
                );

            if (!imagem) {

                return '';
            }

            // ==================================================
            // HTTP / HTTPS
            // ==================================================

            if (
                imagem.startsWith('http://') ||
                imagem.startsWith('https://')
            ) {

                return imagem;
            }

            // ==================================================
            // FIREBASE STORAGE GS://
            // ==================================================

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

                    if (
                        !bucket ||
                        !arquivo
                    ) {

                        return '';
                    }

                    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;

                } catch (error) {

                    console.error(
                        '[produtoService] erro imagem:',
                        error
                    );

                    return '';
                }
            }

            return imagem;
        },

        // ======================================================
        // NORMALIZADOR
        // ======================================================

        normalizarProduto(
            id,
            produto = {}
        ) {

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

            const variacoes =
                this._safeArray(

                    produto.variacoes ||

                    produto.variantes ||

                    produto.opcoesPersonalizadas

                );

            const createdAt =

                produto.createdAt ||

                Date.now();

         return {
            }; 

                // ==============================================
                // IDENTIFICAÇÃO
                // ==============================================

                id:
                    this._safeString(
                        id ||
                        produto.id
                    ),

                sku:
                    this._safeString(
                        produto.sku ||
                        id
                    ),

                // ==============================================
                // NOME
                // ==============================================

                nome:
                    nome,

                name:
                    nome,

                // ==============================================
                // CATEGORIA
                // ==============================================

                categoria:
                    categoria,

                category:
                    categoria,

                categorySlug:

                    produto.categorySlug ||

                    this._slug(
                        categoria
                    ),

                subcategoria:
                    subcategoria,

                subcategory:
                    subcategoria,

                subcategorySlug:

                    produto.subcategorySlug ||

                    this._slug(
                        subcategoria
                    ),

                // ==============================================
                // PREÇOS
                // ==============================================

                precoFinal:
                    preco,

                preco:
                    preco,

                price:
                    preco,

                // ==============================================
                // PESO
                // ==============================================

                peso:
                    peso,

                weight:
                    peso,

                // ==============================================
                // DESCRIÇÃO
                // ==============================================

                descricao:

                    produto.descricao ||

                    produto.description ||

                    '',

                description:

                    produto.description ||

                    produto.descricao ||

                    '',

                // ==============================================
                // IMAGENS
                // ==============================================

                image:
                    this._resolverImagem(
                        produto
                    ),

                imagem:
                    this._resolverImagem(
                        produto
                    ),

                imagemOriginal:
                    produto.image ||

                    produto.imagem ||

                    '',

                // ==============================================
                // PROMOÇÃO
                // ==============================================

                promo:
                    this._safeNumber(
                        produto.promo
                    ),

                badge:
                    this._safeString(
                        produto.badge
                    ),

                // ==============================================
                // ESTOQUE
                // ==============================================

                estoque:
                    this._safeNumber(
                        produto.estoque
                    ),

                // ==============================================
                // VARIAÇÕES
                // ==============================================

                variacoes:
                    variacoes,

                variantes:
                    variacoes,

                variacaoTipo:
                    this._safeString(
                        produto.variacaoTipo
                    ),

                opcoesPersonalizadas:
                    this._safeString(
                        produto.opcoesPersonalizadas
                    ),

                // ==============================================
                // STATUS
                // ==============================================

                paused:
                    produto.paused === true,

                ativo:
                    (
                        produto.paused !== true &&
                        produto.ativo !== false
                    ),

                // ==============================================
                // DATAS
                // ==============================================

                createdAt:
                    createdAt,

                updatedAt:

                    produto.updatedAt ||

                    createdAt

            });
        },

        // ======================================================
        // LISTAR TODOS
        // ======================================================

        async listarTodos(
            forceRefresh = false
        ) {

            try {

                if (
                    !forceRefresh &&
                    this._isCacheValid()
                ) {

                    return structuredClone(
                        this._cache
                    );
                }

                const snap =
                    await this
                        ._ref()
                        .once('value');

                const data =
                    snap.val() || {};

                const lista =

                    Object.keys(data)
                        .map(id => {

                            return this
                                .normalizarProduto(
                                    id,
                                    data[id]
                                );

                        })
                        .filter(
                            produto =>
                                produto.ativo
                        );

                this._cache =
                    lista;

                this._cacheTimestamp =
                    Date.now();

                return structuredClone(
                    lista
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarTodos]',
                    error
                );

                return [];
            }
        },

        // ======================================================
        // BUSCAR POR ID
        // ======================================================

        async buscarPorId(id) {

            try {

                const produtoId =
                    this._safeString(id);

                if (!produtoId) {

                    return null;
                }

                const snap =
                    await this
                        ._ref()
                        .child(produtoId)
                        .once('value');

                const produto =
                    snap.val();

                if (!produto) {

                    return null;
                }

                return this
                    .normalizarProduto(
                        produtoId,
                        produto
                    );

            } catch (error) {

                console.error(
                    '[produtoService:buscarPorId]',
                    error
                );

                return null;
            }
        },

        // ======================================================
        // LISTAR POR CATEGORIA
        // ======================================================

        async listarPorCategoria(
            categoriaSlug
        ) {

            try {

                const slug =
                    this._slug(
                        categoriaSlug
                    );

                const produtos =
                    await this
                        .listarTodos();

                return produtos.filter(
                    produto =>

                        produto.categorySlug
                        === slug
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarPorCategoria]',
                    error
                );

                return [];
            }
        },

        // ======================================================
        // LISTAR POR SUBCATEGORIA
        // ======================================================

        async listarPorSubcategoria(
            categoriaSlug,
            subcategoriaSlug
        ) {

            try {

                const categoria =
                    this._slug(
                        categoriaSlug
                    );

                const subcategoria =
                    this._slug(
                        subcategoriaSlug
                    );

                const produtos =
                    await this
                        .listarTodos();

                return produtos.filter(
                    produto => {

                        return (

                            produto.categorySlug
                            === categoria

                            &&

                            produto.subcategorySlug
                            === subcategoria

                        );
                    }
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarPorSubcategoria]',
                    error
                );

                return [];
            }
        }

    };

    // ==========================================================
    // EXPORT GLOBAL
    // ==========================================================

   window.produtoService =
    produtoService;
})();
