// ======================================================================
// js/firebase/services/subcategoriaService.js
// Abella Joias - SubcategoriaService v4.0
// ======================================================================

const SubcategoriaService = {

    // ==========================================================
    // CACHE
    // ==========================================================

    _cache: {},

    // ==========================================================
    // FIREBASE
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
    // PATH HELPER
    // ==========================================================

    _path(path = '') {

        if (
            typeof window.getAbellaPath !== 'function'
        ) {

            console.error(
                '[SubcategoriaService] getAbellaPath() não encontrado.'
            );

            return `abella/${path}`;
        }

        return window.getAbellaPath(path);
    },

    // ==========================================================
    // CATEGORIA SERVICE
    // ==========================================================

    _categoriaService() {

        return (
            window.CategoriaService ||
            window.categoriaService ||
            null
        );
    },

    // ==========================================================
    // UTILIDADES
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

    gerarSlug(texto = '') {

        return this
            ._safeString(texto)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    // ==========================================================
    // NORMALIZAÇÃO
    // ==========================================================

    normalizarSubcategoria(
        slug,
        raw = {}
    ) {

        return {

            id:
                this._safeString(slug),

            slug:
                this._safeString(slug),

            name:
                this._safeString(
                    raw.name ||
                    raw.nome
                ),

            image:
                this._safeString(
                    raw.image ||
                    raw.imagem
                ),

            paused:
                raw.paused === true,

            active:
                raw.paused !== true,

            order:
                this._safeNumber(
                    raw.order
                ),

            createdAt:
                raw.createdAt ||
                null,

            updatedAt:
                raw.updatedAt ||
                null
        };
    },

    // ==========================================================
    // BUSCAR TODAS
    // ==========================================================

    async getByCategory(catSlug) {

        try {

            if (!catSlug) {

                return {};
            }

            const categoriaService =
                this._categoriaService();

            if (!categoriaService) {

                throw new Error(
                    'CategoriaService não encontrado.'
                );
            }

            const categoria =
                await categoriaService
                    .getBySlug(catSlug);

            if (
                !categoria ||
                !categoria.subcategories
            ) {

                return {};
            }

            const resultado = {};

            Object.entries(
                categoria.subcategories
            ).forEach(
                ([slug, raw]) => {

                    resultado[slug] =
                        this.normalizarSubcategoria(
                            slug,
                            raw
                        );
                }
            );

            this._cache[catSlug] =
                resultado;

            return resultado;

        } catch (error) {

            console.error(
                '[SubcategoriaService:getByCategory]',
                error
            );

            return {};
        }
    },

    // ==========================================================
    // LISTA ORDENADA
    // ==========================================================

    async getList(catSlug) {

        try {

            const subcategorias =
                await this.getByCategory(
                    catSlug
                );

            return Object
                .values(subcategorias)
                .sort(
                    (a, b) =>
                        (a.order || 0) -
                        (b.order || 0)
                );

        } catch (error) {

            console.error(
                '[SubcategoriaService:getList]',
                error
            );

            return [];
        }
    },

    // ==========================================================
    // BUSCAR POR SLUG
    // ==========================================================

    async getBySlug(
        catSlug,
        subSlug
    ) {

        try {

            if (
                !catSlug ||
                !subSlug
            ) {

                return null;
            }

            const subcategorias =
                await this.getByCategory(
                    catSlug
                );

            return (
                subcategorias[subSlug] ||
                null
            );

        } catch (error) {

            console.error(
                '[SubcategoriaService:getBySlug]',
                error
            );

            return null;
        }
    },

    // ==========================================================
    // EXISTE
    // ==========================================================

    async exists(
        catSlug,
        subSlug
    ) {

        const subcategoria =
            await this.getBySlug(
                catSlug,
                subSlug
            );

        return subcategoria !== null;
    },

    // ==========================================================
    // SALVAR
    // ==========================================================

    async save(
        catSlug,
        subSlug,
        subcatData = {}
    ) {

        try {

            if (!catSlug) {

                throw new Error(
                    'Categoria obrigatória.'
                );
            }

            if (!subSlug) {

                throw new Error(
                    'Slug obrigatório.'
                );
            }

            const categoriaService =
                this._categoriaService();

            if (!categoriaService) {

                throw new Error(
                    'CategoriaService não encontrado.'
                );
            }

            const categoriaExiste =
                await categoriaService
                    .exists(catSlug);

            if (!categoriaExiste) {

                throw new Error(
                    `Categoria "${catSlug}" inexistente.`
                );
            }

            const existente =
                await this.getBySlug(
                    catSlug,
                    subSlug
                );

            const nome =
                this._safeString(
                    subcatData.name ||
                    subcatData.nome
                );

            if (!nome) {

                throw new Error(
                    'Nome obrigatório.'
                );
            }

            const node = {

                name: nome,

                image:
                    this._safeString(
                        subcatData.image ||
                        subcatData.imagem
                    ),

                paused:
                    subcatData.paused === true,

                order:
                    this._safeNumber(
                        subcatData.order
                    ),

                createdAt:
                    existente?.createdAt ||
                    Date.now(),

                updatedAt:
                    Date.now()
            };

            await this
                ._db()
                .ref(
                    this._path(
                        `categories/${catSlug}/subcategories/${subSlug}`
                    )
                )
                .update(node);

            categoriaService
                .invalidateCache();

            delete this._cache[catSlug];

            return true;

        } catch (error) {

            console.error(
                '[SubcategoriaService:save]',
                error
            );

            throw error;
        }
    },

    // ==========================================================
    // TOGGLE STATUS
    // ==========================================================

    async toggleStatus(
        catSlug,
        subSlug
    ) {

        try {

            const subcategoria =
                await this.getBySlug(
                    catSlug,
                    subSlug
                );

            if (!subcategoria) {

                throw new Error(
                    'Subcategoria não encontrada.'
                );
            }

            await this
                ._db()
                .ref(
                    this._path(
                        `categories/${catSlug}/subcategories/${subSlug}`
                    )
                )
                .update({

                    paused:
                        subcategoria.active,

                    updatedAt:
                        Date.now()
                });

            const categoriaService =
                this._categoriaService();

            if (categoriaService) {

                categoriaService
                    .invalidateCache();
            }

            delete this._cache[catSlug];

            return true;

        } catch (error) {

            console.error(
                '[SubcategoriaService:toggleStatus]',
                error
            );

            return false;
        }
    },

    // ==========================================================
    // DELETE
    // ==========================================================

    async delete(
        catSlug,
        subSlug
    ) {

        try {

            if (
                !catSlug ||
                !subSlug
            ) {

                return false;
            }

            await this
                ._db()
                .ref(
                    this._path(
                        `categories/${catSlug}/subcategories/${subSlug}`
                    )
                )
                .remove();

            const categoriaService =
                this._categoriaService();

            if (categoriaService) {

                categoriaService
                    .invalidateCache();
            }

            delete this._cache[catSlug];

            return true;

        } catch (error) {

            console.error(
                '[SubcategoriaService:delete]',
                error
            );

            return false;
        }
    },

    // ==========================================================
    // SUBSCRIBE
    // ==========================================================

    subscribe(
        catSlug,
        callback
    ) {

        try {

            if (!catSlug) {

                throw new Error(
                    'Categoria obrigatória.'
                );
            }

            const ref =
                this
                    ._db()
                    .ref(
                        this._path(
                            `categories/${catSlug}/subcategories`
                        )
                    );

            ref.on(

                'value',

                snapshot => {

                    const data =
                        snapshot.val() || {};

                    const resultado =
                        {};

                    Object.entries(data)
                        .forEach(
                            ([slug, raw]) => {

                                resultado[slug] =
                                    this.normalizarSubcategoria(
                                        slug,
                                        raw
                                    );
                            }
                        );

                    this._cache[catSlug] =
                        resultado;

                    if (
                        typeof callback ===
                        'function'
                    ) {

                        callback(resultado);
                    }
                },

                error => {

                    console.error(
                        '[SubcategoriaService:subscribe]',
                        error
                    );
                }
            );

            return ref;

        } catch (error) {

            console.error(
                '[SubcategoriaService:subscribe]',
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
                typeof ref.off === 'function'
            ) {

                ref.off();
            }

        } catch (error) {

            console.error(
                '[SubcategoriaService:unsubscribe]',
                error
            );
        }
    }
};

// ==========================================================
// EXPORTS
// ==========================================================

window.SubcategoriaService =
    SubcategoriaService;

window.subcategoriaService =
    SubcategoriaService;

// ==========================================================
// LEGADO
// ==========================================================

SubcategoriaService.listarTodas =
    SubcategoriaService.getList;

SubcategoriaService.buscarPorSlug =
    SubcategoriaService.getBySlug;

SubcategoriaService.salvarSubcategoria =
    SubcategoriaService.save;

SubcategoriaService.excluirSubcategoria =
    SubcategoriaService.delete;

SubcategoriaService.existe =
    SubcategoriaService.exists;

SubcategoriaService.inscrever =
    SubcategoriaService.subscribe;

SubcategoriaService.removerInscricao =
    SubcategoriaService.unsubscribe;

console.log(
    '🧩 SubcategoriaService v4.0 carregado.'
);
