// ======================================================================
// js/firebase/services/categoriaService.js
// Abella Joias - CategoriaService v3.0
// ======================================================================

const CategoriaService = {

    _cache: {},
    _cacheTimestamp: 0,
    _cacheTTL: 60000,

    // ==========================================================
    // Firebase
    // ==========================================================

    _db() {

        if (!window.db) {
            throw new Error(
                "Firebase Database não inicializado."
            );
        }

        return window.db;
    },

    // ==========================================================
    // Cache
    // ==========================================================

    _isCacheValid() {

        return (
            Object.keys(this._cache).length > 0 &&
            (Date.now() - this._cacheTimestamp) <
            this._cacheTTL
        );
    },

    invalidateCache() {

        this._cache = {};
        this._cacheTimestamp = 0;
    },

    // ==========================================================
    // Utilidades
    // ==========================================================

    gerarSlug(texto = '') {

        return texto
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    // ==========================================================
    // Normalização
    // ==========================================================

    normalizarCategoria(slug, raw = {}) {

        return {

            slug,

            name:
                raw.name ||
                raw.nome ||
                '',

            image:
                raw.image ||
                raw.imagem ||
                '',

            order: Number(
                raw.order ?? 0
            ),

            active:
                raw.active !== false,

            createdAt:
                raw.createdAt ||
                null,

            updatedAt:
                raw.updatedAt ||
                null,

            subcategories:
                raw.subcategories ||
                {}
        };
    },

    // ==========================================================
    // Buscar Todas
    // ==========================================================

    async getAll(forceRefresh = false) {

        try {

            if (
                !forceRefresh &&
                this._isCacheValid()
            ) {
                return this._cache;
            }

            const snapshot =
                await this
                    ._db()
                    .ref('abella/categories')
                    .once('value');

            const data =
                snapshot.val() || {};

            this._cache = {};

            Object.entries(data)
                .forEach(([slug, raw]) => {

                    this._cache[slug] =
                        this.normalizarCategoria(
                            slug,
                            raw
                        );
                });

            this._cacheTimestamp =
                Date.now();

            return this._cache;

        } catch (error) {

            console.error(
                '[CategoriaService:getAll]',
                error
            );

            return {};
        }
    },

    // ==========================================================
    // Lista Ordenada
    // ==========================================================

    async getList(forceRefresh = false) {

        const categorias =
            await this.getAll(forceRefresh);

        return Object.values(categorias)
            .sort(
                (a, b) =>
                    (a.order || 0) -
                    (b.order || 0)
            );
    },

    // ==========================================================
    // Buscar Categoria
    // ==========================================================

    async getBySlug(slug) {

        if (!slug) return null;

        try {

            if (
                this._cache[slug]
            ) {
                return this._cache[slug];
            }

            const snapshot =
                await this
                    ._db()
                    .ref(
                        `abella/categories/${slug}`
                    )
                    .once('value');

            const data =
                snapshot.val();

            if (!data) {
                return null;
            }

            const categoria =
                this.normalizarCategoria(
                    slug,
                    data
                );

            this._cache[slug] =
                categoria;

            return categoria;

        } catch (error) {

            console.error(
                '[CategoriaService:getBySlug]',
                error
            );

            return null;
        }
    },

    // ==========================================================
    // Verificar Existência
    // ==========================================================

    async exists(slug) {

        const categoria =
            await this.getBySlug(slug);

        return categoria !== null;
    },

    // ==========================================================
    // Salvar
    // ==========================================================

    async save(
        slug,
        categoryData = {}
    ) {

        try {

            if (!slug) {

                throw new Error(
                    'Slug da categoria é obrigatório.'
                );
            }

            const name =
                (
                    categoryData.name ||
                    categoryData.nome ||
                    ''
                ).trim();

            if (!name) {

                throw new Error(
                    'Nome da categoria é obrigatório.'
                );
            }

            const existente =
                await this.getBySlug(slug);

            const node = {

                name,

                image:
                    categoryData.image ||
                    categoryData.imagem ||
                    '',

                order: Number(
                    categoryData.order ?? 0
                ),

                active:
                    categoryData.active !== false,

                subcategories:
                    categoryData.subcategories ||
                    existente?.subcategories ||
                    {},

                createdAt:
                    existente?.createdAt ||
                    Date.now(),

                updatedAt:
                    Date.now()
            };

            await this
                ._db()
                .ref(
                    `abella/categories/${slug}`
                )
                .update(node);

            this._cache[slug] = {

                slug,
                ...node
            };

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
    // Ativar / Desativar
    // ==========================================================

    async toggleStatus(slug) {

        try {

            const categoria =
                await this.getBySlug(slug);

            if (!categoria) {

                throw new Error(
                    'Categoria não encontrada.'
                );
            }

            const novoStatus =
                !categoria.active;

            await this
                ._db()
                .ref(
                    `abella/categories/${slug}`
                )
                .update({
                    active: novoStatus,
                    updatedAt: Date.now()
                });

            if (
                this._cache[slug]
            ) {

                this._cache[slug].active =
                    novoStatus;

                this._cache[slug].updatedAt =
                    Date.now();
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
    // Excluir
    // ==========================================================

    async delete(slug) {

        try {

            if (!slug) return false;

            await this
                ._db()
                .ref(
                    `abella/categories/${slug}`
                )
                .remove();

            delete this._cache[slug];

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
    // Listener Realtime
    // ==========================================================

    subscribe(callback) {

        try {

            const ref =
                this
                    ._db()
                    .ref(
                        'abella/categories'
                    );

            ref.on(
                'value',
                snapshot => {

                    const data =
                        snapshot.val() || {};

                    this._cache = {};

                    Object.entries(data)
                        .forEach(
                            ([slug, raw]) => {

                                this._cache[slug] =
                                    this.normalizarCategoria(
                                        slug,
                                        raw
                                    );
                            }
                        );

                    this._cacheTimestamp =
                        Date.now();

                    if (
                        typeof callback ===
                        'function'
                    ) {

                        callback(
                            this._cache
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
    // Remover Listener
    // ==========================================================

    unsubscribe(ref) {

        try {

            if (ref) {
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

window.categoriaService =
    CategoriaService;

CategoriaService.listarTodas =
    CategoriaService.getList;

CategoriaService.buscarPorSlug =
    CategoriaService.getBySlug;

// Compatibilidade legado
CategoriaService.obterPorId =
    CategoriaService.getBySlug;

CategoriaService.salvarCategoria =
    CategoriaService.save;

CategoriaService.excluirCategoria =
    CategoriaService.delete;
