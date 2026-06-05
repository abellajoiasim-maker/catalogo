// ======================================================================
// js/firebase/services/categoriaService.js
// Abella Joias - CategoriaService Premium v4.0
// ======================================================================

(function () {

    'use strict';

    const CATEGORIES_PATH =
        getAbellaPath('categories');

    const CategoriaService = {

        // ==========================================================
        // CACHE
        // ==========================================================

        _cache: {},

        _cacheTimestamp: 0,

        _cacheTTL: 60000,

        // ==========================================================
        // DATABASE
        // ==========================================================

        _db() {

            if (!window.db) {

                throw new Error(
                    'Firebase Database não inicializado.'
                );
            }

            return window.db;
        },

        // ==========================================================
        // REF
        // ==========================================================

        _ref() {

            return this
                ._db()
                .ref(CATEGORIES_PATH);
        },

        // ==========================================================
        // CACHE
        // ==========================================================

        _isCacheValid() {

            return (

                Object.keys(
                    this._cache
                ).length > 0

                &&

                (
                    Date.now() -
                    this._cacheTimestamp
                ) < this._cacheTTL

            );
        },

        invalidateCache() {

            this._cache = {};

            this._cacheTimestamp = 0;
        },

        // ==========================================================
        // HELPERS
        // ==========================================================

        _safeString(valor = '') {

            return String(valor || '')
                .trim();
        },

        _safeNumber(valor = 0) {

            const numero =
                Number(valor);

            return Number.isFinite(numero)
                ? numero
                : 0;
        },

        _safeObject(valor) {

            return (
                valor &&
                typeof valor === 'object' &&
                !Array.isArray(valor)
            )
                ? valor
                : {};
        },

        // ==========================================================
        // SLUG
        // ==========================================================

        gerarSlug(texto = '') {

            return this
                ._safeString(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        validarSlug(slug = '') {

            return /^[a-z0-9-]+$/.test(slug);
        },

        // ==========================================================
        // IMAGEM
        // ==========================================================

        resolverImagem(url = '') {

            const imagem =
                this._safeString(url);

            if (!imagem) {

                return '';
            }

            if (
                imagem.startsWith('http://') ||
                imagem.startsWith('https://')
            ) {

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

                    if (
                        !bucket ||
                        !arquivo
                    ) {

                        return '';
                    }

                    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;

                } catch (error) {

                    console.error(
                        '[CategoriaService:resolverImagem]',
                        error
                    );

                    return '';
                }
            }

            return imagem;
        },

        // ==========================================================
        // NORMALIZAÇÃO
        // ==========================================================

        normalizarCategoria(
            slug,
            raw = {}
        ) {

            const categoriaSlug =
                this.gerarSlug(slug);

            const nome =
                this._safeString(

                    raw.name ||

                    raw.nome

                );

            const imageOriginal =
                this._safeString(

                    raw.image ||

                    raw.imagem

                );

            const categoria = {

                // ==================================================
                // IDENTIFICAÇÃO
                // ==================================================

                id:
                    categoriaSlug,

                slug:
                    categoriaSlug,

                // ==================================================
                // DADOS
                // ==================================================

                name:
                    nome,

                nome:
                    nome,

                image:
                    this.resolverImagem(
                        imageOriginal
                    ),

                imagem:
                    this.resolverImagem(
                        imageOriginal
                    ),

                imageOriginal:
                    imageOriginal,

                // ==================================================
                // CONFIGURAÇÃO
                // ==================================================

                order:
                    this._safeNumber(
                        raw.order
                    ),

                active:
                    raw.active !== false,

                // ==================================================
                // SUBCATEGORIAS
                // ==================================================

                subcategories:
                    this._safeObject(
                        raw.subcategories
                    ),

                // ==================================================
                // DATAS
                // ==================================================

                createdAt:

                    raw.createdAt ||

                    Date.now(),

                updatedAt:

                    raw.updatedAt ||

                    raw.createdAt ||

                    Date.now()

            };

            return Object.freeze(
                categoria
            );
        },

        // ==========================================================
        // GET ALL
        // ==========================================================

        async getAll(
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

                const snapshot =
                    await this
                        ._ref()
                        .once('value');

                const data =
                    snapshot.val() || {};

                const novoCache = {};

                Object.entries(data)
                    .forEach(
                        ([slug, raw]) => {

                            novoCache[slug] =
                                this.normalizarCategoria(
                                    slug,
                                    raw
                                );
                        }
                    );

                this._cache =
                    novoCache;

                this._cacheTimestamp =
                    Date.now();

                return structuredClone(
                    novoCache
                );

            } catch (error) {

                console.error(
                    '[CategoriaService:getAll]',
                    error
                );

                return {};
            }
        },

        // ==========================================================
        // LISTA ORDENADA
        // ==========================================================

        async getList(
            forceRefresh = false
        ) {

            const categorias =
                await this.getAll(
                    forceRefresh
                );

            return Object.values(
                categorias
            ).sort(
                (a, b) =>

                    (a.order || 0)

                    -

                    (b.order || 0)
            );
        },

        // ==========================================================
        // GET BY SLUG
        // ==========================================================

        async getBySlug(slug) {

            try {

                const categoriaSlug =
                    this.gerarSlug(slug);

                if (
                    !categoriaSlug
                ) {

                    return null;
                }

                if (
                    this._cache[categoriaSlug]
                ) {

                    return structuredClone(
                        this._cache[
                            categoriaSlug
                        ]
                    );
                }

                const snapshot =
                    await this
                        ._ref()
                        .child(categoriaSlug)
                        .once('value');

                const data =
                    snapshot.val();

                if (!data) {

                    return null;
                }

                const categoria =
                    this.normalizarCategoria(
                        categoriaSlug,
                        data
                    );

                this._cache[
                    categoriaSlug
                ] = categoria;

                return structuredClone(
                    categoria
                );

            } catch (error) {

                console.error(
                    '[CategoriaService:getBySlug]',
                    error
                );

                return null;
            }
        },

        // ==========================================================
        // EXISTS
        // ==========================================================

        async exists(slug) {

            const categoria =
                await this.getBySlug(
                    slug
                );

            return categoria !== null;
        },

        // ==========================================================
        // SAVE
        // ==========================================================

        async save(
            slug,
            categoryData = {}
        ) {

            try {

                const categoriaSlug =
                    this.gerarSlug(slug);

                if (
                    !categoriaSlug
                ) {

                    throw new Error(
                        'Slug inválido.'
                    );
                }

                if (
                    !this.validarSlug(
                        categoriaSlug
                    )
                ) {

                    throw new Error(
                        'Slug fora do padrão permitido.'
                    );
                }

                const nome =
                    this._safeString(

                        categoryData.name ||

                        categoryData.nome

                    );

                if (!nome) {

                    throw new Error(
                        'Nome da categoria é obrigatório.'
                    );
                }

                const existente =
                    await this.getBySlug(
                        categoriaSlug
                    );

                const payload = {

                    name:
                        nome,

                    image:
                        this._safeString(

                            categoryData.image ||

                            categoryData.imagem

                        ),

                    order:
                        this._safeNumber(
                            categoryData.order
                        ),

                    active:
                        categoryData.active !== false,

                    subcategories:
                        this._safeObject(

                            categoryData.subcategories ||

                            existente?.subcategories

                        ),

                    createdAt:

                        existente?.createdAt ||

                        Date.now(),

                    updatedAt:
                        Date.now()

                };

                await this
                    ._ref()
                    .child(categoriaSlug)
                    .set(payload);

                this._cache[
                    categoriaSlug
                ] = this.normalizarCategoria(
                    categoriaSlug,
                    payload
                );

                return true;

            } catch (error) {

                console.error(
                    '[CategoriaService:save]',
                    error
                );

                throw error;
            }
        },

        // ==========================================================
        // TOGGLE STATUS
        // ==========================================================

        async toggleStatus(slug) {

            try {

                const categoria =
                    await this.getBySlug(
                        slug
                    );

                if (!categoria) {

                    throw new Error(
                        'Categoria não encontrada.'
                    );
                }

                const novoStatus =
                    !categoria.active;

                await this
                    ._ref()
                    .child(categoria.slug)
                    .update({

                        active:
                            novoStatus,

                        updatedAt:
                            Date.now()

                    });

                if (
                    this._cache[
                        categoria.slug
                    ]
                ) {

                    this._cache[
                        categoria.slug
                    ] = Object.freeze({

                        ...this._cache[
                            categoria.slug
                        ],

                        active:
                            novoStatus,

                        updatedAt:
                            Date.now()

                    });
                }

                return true;

            } catch (error) {

                console.error(
                    '[CategoriaService:toggleStatus]',
                    error
                );

                return false;
            }
        },

        // ==========================================================
        // DELETE
        // ==========================================================

        async delete(slug) {

            try {

                const categoriaSlug =
                    this.gerarSlug(slug);

                if (
                    !categoriaSlug
                ) {

                    return false;
                }

                await this
                    ._ref()
                    .child(categoriaSlug)
                    .remove();

                delete this._cache[
                    categoriaSlug
                ];

                return true;

            } catch (error) {

                console.error(
                    '[CategoriaService:delete]',
                    error
                );

                return false;
            }
        },

        // ==========================================================
        // SUBSCRIBE
        // ==========================================================

        subscribe(callback) {

            try {

                const ref =
                    this._ref();

                ref.on(
                    'value',
                    snapshot => {

                        const data =
                            snapshot.val() || {};

                        const novoCache = {};

                        Object.entries(data)
                            .forEach(
                                ([slug, raw]) => {

                                    novoCache[slug] =
                                        this.normalizarCategoria(
                                            slug,
                                            raw
                                        );
                                }
                            );

                        this._cache =
                            novoCache;

                        this._cacheTimestamp =
                            Date.now();

                        if (
                            typeof callback ===
                            'function'
                        ) {

                            callback(
                                structuredClone(
                                    novoCache
                                )
                            );
                        }
                    }
                );

                return ref;

            } catch (error) {

                console.error(
                    '[CategoriaService:subscribe]',
                    error
                );
            }
        },

        // ==========================================================
        // UNSUBSCRIBE
        // ==========================================================

        unsubscribe(ref) {

            try {

                if (
                    ref &&
                    typeof ref.off ===
                    'function'
                ) {

                    ref.off();
                }

            } catch (error) {

                console.error(
                    '[CategoriaService:unsubscribe]',
                    error
                );
            }
        }

    };

    // ==============================================================
    // EXPORT GLOBAL
    // ==============================================================

    window.categoriaService =
        Object.freeze(
            CategoriaService
        );

    // ==============================================================
    // COMPATIBILIDADE LEGADO
    // ==============================================================

    window.categoriaService
        .listarTodas =
            CategoriaService.getList;

    window.categoriaService
        .buscarPorSlug =
            CategoriaService.getBySlug;

    window.categoriaService
        .obterPorId =
            CategoriaService.getBySlug;

    window.categoriaService
        .salvarCategoria =
            CategoriaService.save;

    window.categoriaService
        .excluirCategoria =
            CategoriaService.delete;

})();
