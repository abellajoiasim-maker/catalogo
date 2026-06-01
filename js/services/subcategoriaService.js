// ======================================================================
// js/firebase/services/subcategoriaService.js
// Abella Joias - SubcategoriaService v3.0
// ======================================================================

const SubcategoriaService = {

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

    normalizarSubcategoria(
        slug,
        raw = {}
    ) {

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

            paused:
                raw.paused === true,

            active:
                raw.paused !== true,

            order: Number(
                raw.order ?? 0
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
    // Buscar todas de uma categoria
    // ==========================================================

    async getByCategory(catSlug) {

        try {

            if (!catSlug) {
                return {};
            }

            const categoria =
                await window
                    .CategoriaService
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
    // Lista ordenada
    // ==========================================================

    async getList(catSlug) {

        const subcategorias =
            await this.getByCategory(
                catSlug
            );

        return Object.values(
            subcategorias
        ).sort(
            (a, b) =>
                (a.order || 0) -
                (b.order || 0)
        );
    },

    // ==========================================================
    // Buscar por slug
    // ==========================================================

    async getBySlug(
        catSlug,
        subSlug
    ) {

        try {

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
    // Verificar existência
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
    // Salvar
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
                    'Slug da subcategoria obrigatório.'
                );
            }

            const name =
                (
                    subcatData.name ||
                    subcatData.nome ||
                    ''
                ).trim();

            if (!name) {

                throw new Error(
                    'Nome da subcategoria obrigatório.'
                );
            }

            const existente =
                await this.getBySlug(
                    catSlug,
                    subSlug
                );

            const node = {

                name,

                image:
                    subcatData.image ||
                    subcatData.imagem ||
                    '',

                paused:
                    subcatData.paused === true,

                order: Number(
                    subcatData.order ?? 0
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
                    `abella/categories/${catSlug}/subcategories/${subSlug}`
                )
                .update(node);

            window
                .CategoriaService
                .invalidateCache();

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
    // Ativar / Pausar
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

            const novoStatus =
                !subcategoria.active;

            await this
                ._db()
                .ref(
                    `abella/categories/${catSlug}/subcategories/${subSlug}`
                )
                .update({

                    paused:
                        !novoStatus,

                    updatedAt:
                        Date.now()
                });

            window
                .CategoriaService
                .invalidateCache();

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
    // Excluir
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
                    `abella/categories/${catSlug}/subcategories/${subSlug}`
                )
                .remove();

            window
                .CategoriaService
                .invalidateCache();

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
    // Listener realtime
    // ==========================================================

    subscribe(
        catSlug,
        callback
    ) {

        try {

            const ref =
                this
                    ._db()
                    .ref(
                        `abella/categories/${catSlug}/subcategories`
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

                    if (
                        typeof callback ===
                        'function'
                    ) {

                        callback(
                            resultado
                        );
                    }
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
    // Remover listener
    // ==========================================================

    unsubscribe(ref) {

        try {

            if (ref) {
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

window.SubcategoriaService =
    SubcategoriaService;

// ==========================================================
// Compatibilidade Legado
// ==========================================================

window.subcategoriaService =
    SubcategoriaService;

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
