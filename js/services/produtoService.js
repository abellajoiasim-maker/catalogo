// ======================================================================
// js/services/produtoService.js
// Abella Joias - Versão Refatorada
// ======================================================================

const ProdutoService = {

    _cache: {},
    _cacheTimestamp: 0,
    _cacheTTL: 60000,

    // ==========================================================
    // Helpers
    // ==========================================================

    _db() {
        if (!window.db) {
            throw new Error("Firebase Database não inicializado.");
        }
        return window.db;
    },

    _isCacheValid() {
        return (
            Object.keys(this._cache).length > 0 &&
            (Date.now() - this._cacheTimestamp) < this._cacheTTL
        );
    },

    // ==========================================================
    // Normalização
    // ==========================================================

    normalizarProduto(id, rawData = {}) {

        return {
            id,

            sku: rawData.sku || '',

            name:
                rawData.name ||
                rawData.nome ||
                '',

            category:
                rawData.category ||
                rawData.categoria ||
                '',

            subcategory:
                rawData.subcategory ||
                rawData.subcategoria ||
                '',

            image:
                rawData.image ||
                rawData.imagem ||
                '',

            price: Number(
                rawData.price ??
                rawData.precoFinal ??
                rawData.preco ??
                0
            ),

            weight: Number(
                rawData.weight ??
                rawData.peso ??
                0
            ),

            active:
                rawData.active !== false &&
                rawData.paused !== true,

            variacaoTipo:
                rawData.variacaoTipo ||
                'Padrão',

            opcoesPersonalizadas:
                rawData.opcoesPersonalizadas ||
                ''
        };
    },

    // ==========================================================
    // Listagem
    // ==========================================================

    async getAll(forceRefresh = false) {

        try {

            if (
                !forceRefresh &&
                this._isCacheValid()
            ) {
                return Object.values(this._cache);
            }

            const snapshot = await this
                ._db()
                .ref('abella/products')
                .once('value');

            const data =
                snapshot.val() || {};

            this._cache = {};

            Object.entries(data).forEach(
                ([id, raw]) => {

                    const produto =
                        this.normalizarProduto(
                            id,
                            raw
                        );

                    this._cache[id] =
                        produto;
                }
            );

            this._cacheTimestamp =
                Date.now();

            return Object.values(
                this._cache
            );

        } catch (error) {

            console.error(
                '[ProdutoService:getAll]',
                error
            );

            return [];
        }
    },

    // ==========================================================
    // Buscar por ID
    // ==========================================================

    async getById(id) {

        if (!id) return null;

        try {

            if (
                this._cache[id]
            ) {
                return this._cache[id];
            }

            const snapshot =
                await this
                    ._db()
                    .ref(
                        `abella/products/${id}`
                    )
                    .once('value');

            const data =
                snapshot.val();

            if (!data) {
                return null;
            }

            const produto =
                this.normalizarProduto(
                    id,
                    data
                );

            this._cache[id] =
                produto;

            return produto;

        } catch (error) {

            console.error(
                '[ProdutoService:getById]',
                error
            );

            return null;
        }
    },

    // ==========================================================
    // Paginação
    // ==========================================================

    async getPaginated(
        page = 1,
        limit = 15,
        filters = {}
    ) {

        limit =
            Math.max(
                1,
                Number(limit) || 15
            );

        page =
            Math.max(
                1,
                Number(page) || 1
            );

        let list =
            await this.getAll();

        if (filters.text) {

            const termo =
                String(filters.text)
                    .toUpperCase();

            list = list.filter(p => {

                const sku =
                    (p.sku || '')
                    .toUpperCase();

                const nome =
                    (p.name || '')
                    .toUpperCase();

                return (
                    sku.includes(termo) ||
                    nome.includes(termo)
                );
            });
        }

        if (filters.category) {

            list = list.filter(
                p =>
                    p.category ===
                    filters.category
            );
        }

        if (filters.subcategory) {

            list = list.filter(
                p =>
                    p.subcategory ===
                    filters.subcategory
            );
        }

        if (filters.onlyActive) {

            list = list.filter(
                p => p.active
            );
        }

        const totalItems =
            list.length;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalItems / limit
                )
            );

        const start =
            (page - 1) * limit;

        return {

            items:
                list.slice(
                    start,
                    start + limit
                ),

            totalItems,

            totalPages,

            currentPage:
                page
        };
    },

    // ==========================================================
    // Salvar
    // ==========================================================

    async save(id, itemData = {}) {

        try {

            const name =
                (
                    itemData.name ||
                    itemData.nome ||
                    ''
                ).trim();

            if (!name) {
                throw new Error(
                    'Nome obrigatório.'
                );
            }

            const normalized = {

                sku:
                    itemData.sku || '',

                name,

                category:
                    itemData.category ||
                    itemData.categoria ||
                    '',

                subcategory:
                    itemData.subcategory ||
                    itemData.subcategoria ||
                    '',

                image:
                    itemData.image ||
                    itemData.imagem ||
                    '',

                price: Number(
                    itemData.price ??
                    itemData.precoFinal ??
                    0
                ),

                weight: Number(
                    itemData.weight ??
                    itemData.peso ??
                    0
                ),

                paused:
                    itemData.active === false ||
                    itemData.paused === true,

                variacaoTipo:
                    itemData.variacaoTipo ||
                    'Padrão',

                opcoesPersonalizadas:
                    itemData.opcoesPersonalizadas ||
                    ''
            };

            if (
                Number.isNaN(
                    normalized.price
                )
            ) {
                normalized.price = 0;
            }

            if (
                Number.isNaN(
                    normalized.weight
                )
            ) {
                normalized.weight = 0;
            }

            if (id) {

                await this
                    ._db()
                    .ref(
                        `abella/products/${id}`
                    )
                    .update(normalized);

                this._cache[id] = {
                    id,
                    ...normalized,
                    active:
                        !normalized.paused
                };

                return id;
            }

            const ref =
                this
                    ._db()
                    .ref(
                        'abella/products'
                    )
                    .push();

            await ref.set(
                normalized
            );

            this._cache[ref.key] = {
                id: ref.key,
                ...normalized,
                active:
                    !normalized.paused
            };

            return ref.key;

        } catch (error) {

            console.error(
                '[ProdutoService:save]',
                error
            );

            throw error;
        }
    },

    // ==========================================================
    // Ativar / Pausar
    // ==========================================================

    async toggleStatus(id) {

        try {

            const produto =
                await this.getById(id);

            if (!produto) {
                throw new Error(
                    'Produto não encontrado.'
                );
            }

            const novoStatus =
                produto.active;

            await this
                ._db()
                .ref(
                    `abella/products/${id}`
                )
                .update({
                    paused: novoStatus
                });

            if (
                this._cache[id]
            ) {
                this._cache[id].active =
                    !novoStatus;
            }

            return true;

        } catch (error) {

            console.error(
                '[ProdutoService:toggleStatus]',
                error
            );

            return false;
        }
    },

    // ==========================================================
    // Excluir
    // ==========================================================

    async delete(id) {

        try {

            await this
                ._db()
                .ref(
                    `abella/products/${id}`
                )
                .remove();

            delete this._cache[id];

            return true;

        } catch (error) {

            console.error(
                '[ProdutoService:delete]',
                error
            );

            return false;
        }
    },

    // ==========================================================
    // Realtime Listener
    // ==========================================================

    subscribe(callback) {

        try {

            return this
                ._db()
                .ref(
                    'abella/products'
                )
                .on(
                    'value',
                    snapshot => {

                        const data =
                            snapshot.val() || {};

                        this._cache = {};

                        Object.entries(data)
                            .forEach(
                                ([id, raw]) => {

                                    this._cache[id] =
                                        this.normalizarProduto(
                                            id,
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
                                Object.values(
                                    this._cache
                                )
                            );
                        }
                    }
                );

        } catch (error) {

            console.error(
                '[ProdutoService:subscribe]',
                error
            );
        }
    }
};

window.ProdutoService =
    ProdutoService;


// ==========================================================
// Compatibilidade Legado
// ==========================================================

window.produtoService =
    ProdutoService;

ProdutoService.listarTodos =
    ProdutoService.getAll;

ProdutoService.buscarPorId =
    ProdutoService.getById;

ProdutoService.salvarProduto =
    ProdutoService.save;

ProdutoService.excluirProduto =
    ProdutoService.delete;
