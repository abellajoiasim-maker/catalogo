// ======================================================================
// js/firebase/services/pedidoService.js
// Abella Joias - PedidoService Premium v6.0
// ======================================================================

const PedidoService = {

    _cache: {},
    _cacheTimestamp: 0,
    _cacheTTL: 30000,

    // ==========================================================
    // FIREBASE
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
    // PATH CENTRALIZADO
    // ==========================================================

    _getPath() {

        return getAbellaPath(
            'orders'
        );

    },

    // ==========================================================
    // CACHE
    // ==========================================================

    _isCacheValid() {

        return (

            Object.keys(
                this._cache
            ).length > 0 &&

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

    _safeArray(valor) {

        return Array.isArray(valor)
            ? valor
            : [];

    },

    // ==========================================================
    // NORMALIZADOR
    // ==========================================================

    normalizarPedido(
        id,
        raw = {}
    ) {

        return {

            // ==================================================
            // IDENTIFICAÇÃO
            // ==================================================

            id,

            numeroPedido:
                this._safeString(
                    raw.numeroPedido
                ),

            // ==================================================
            // DATAS
            // ==================================================

            createdAt:
                this._safeNumber(
                    raw.createdAt
                ),

            updatedAt:
                this._safeNumber(
                    raw.updatedAt
                ),

            // ==================================================
            // CLIENTE
            // ==================================================

            cliente:
                this._safeString(
                    raw.cliente
                ),

            whats:
                this._safeString(
                    raw.whats
                ),

            cidade:
                this._safeString(
                    raw.cidade
                ),

            // ==================================================
            // PAGAMENTO
            // ==================================================

            formaPagamento:
                this._safeString(
                    raw.formaPagamento
                ) || "PIX",

            observacoes:
                this._safeString(
                    raw.observacoes
                ),

            // ==================================================
            // VALORES
            // ==================================================

            subtotal:
                this._safeNumber(
                    raw.subtotal
                ),

            desconto:
                this._safeNumber(
                    raw.desconto
                ),

            frete:
                this._safeNumber(
                    raw.frete
                ),

            total:
                this._safeNumber(
                    raw.total
                ),

            totalPix:
                this._safeNumber(
                    raw.totalPix
                ),

            pesoTotal:
                this._safeNumber(
                    raw.pesoTotal
                ),

            totalPecas:
                this._safeNumber(
                    raw.totalPecas
                ),

            // ==================================================
            // STATUS
            // ==================================================

            status:
                this._safeString(
                    raw.status
                ) || "Recebido",

            // ==================================================
            // ENTREGA
            // ==================================================

            entrega: {

                nome:
                    this._safeString(
                        raw.entrega?.nome
                    ),

                endereco:
                    this._safeString(
                        raw.entrega?.endereco
                    ),

                numero:
                    this._safeString(
                        raw.entrega?.numero
                    ),

                bairro:
                    this._safeString(
                        raw.entrega?.bairro
                    ),

                cidade:
                    this._safeString(
                        raw.entrega?.cidade
                    )

            },

            // ==================================================
            // ROMANEIO
            // ==================================================

            romaneio: {

                subtotal:
                    this._safeNumber(
                        raw.romaneio?.subtotal
                    ),

                desconto:
                    this._safeNumber(
                        raw.romaneio?.desconto
                    ),

                totalPix:
                    this._safeNumber(
                        raw.romaneio?.totalPix
                    ),

                pesoTotal:
                    this._safeNumber(
                        raw.romaneio?.pesoTotal
                    ),

                totalPecas:
                    this._safeNumber(
                        raw.romaneio?.totalPecas
                    )

            },

            // ==================================================
            // ITENS
            // ==================================================

            itens:
                this._safeArray(
                    raw.itens
                )

        };

    },

    // ==========================================================
    // CRIAR PEDIDO
    // ==========================================================

    async create(
        pedidoData = {}
    ) {

        try {

            const ref =
                this
                    ._db()
                    .ref(
                        this._getPath()
                    )
                    .push();

            const numeroPedido =

                "AB" +

                Date.now()
                    .toString()
                    .slice(-8);

            const payload =
                this.normalizarPedido(
                    ref.key,
                    {

                        numeroPedido,

                        createdAt:
                            Date.now(),

                        updatedAt:
                            Date.now(),

                        cliente:
                            pedidoData.cliente,

                        whats:
                            pedidoData.whats,

                        cidade:
                            pedidoData.cidade,

                        formaPagamento:
                            pedidoData.formaPagamento,

                        observacoes:
                            pedidoData.observacoes,

                        subtotal:
                            pedidoData.subtotal,

                        desconto:
                            pedidoData.desconto,

                        frete:
                            pedidoData.frete,

                        total:
                            pedidoData.total,

                        totalPix:
                            pedidoData.totalPix,

                        pesoTotal:
                            pedidoData.pesoTotal,

                        totalPecas:
                            pedidoData.totalPecas,

                        status:
                            pedidoData.status ||
                            "Recebido",

                        entrega:
                            pedidoData.entrega || {},

                        romaneio: {

                            subtotal:
                                pedidoData.subtotal,

                            desconto:
                                pedidoData.desconto,

                            totalPix:
                                pedidoData.totalPix,

                            pesoTotal:
                                pedidoData.pesoTotal,

                            totalPecas:
                                pedidoData.totalPecas

                        },

                        itens:
                            pedidoData.itens || []

                    }
                );

            await ref.set(
                payload
            );

            this._cache[
                ref.key
            ] = payload;

            return {

                success: true,

                id:
                    ref.key,

                numeroPedido

            };

        } catch (error) {

            console.error(
                "[PedidoService:create]",
                error
            );

            return {

                success: false,

                error:
                    error.message

            };

        }

    },

    // ==========================================================
    // LISTAR TODOS
    // ==========================================================

    async getAll(
        forceRefresh = false
    ) {

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
                    .ref(
                        this._getPath()
                    )
                    .once(
                        "value"
                    );

            const data =
                snapshot.val() || {};

            this._cache = {};

            Object.entries(
                data
            ).forEach(

                ([id, raw]) => {

                    this._cache[id] =

                        this.normalizarPedido(
                            id,
                            raw
                        );

                }

            );

            this._cacheTimestamp =
                Date.now();

            return this._cache;

        } catch (error) {

            console.error(
                "[PedidoService:getAll]",
                error
            );

            return {};

        }

    },

    // ==========================================================
    // BUSCAR POR ID
    // ==========================================================

    async getById(id) {

        try {

            if (!id) {

                return null;

            }

            if (
                this._cache[id]
            ) {

                return this._cache[id];

            }

            const snapshot =

                await this
                    ._db()
                    .ref(
                        `${this._getPath()}/${id}`
                    )
                    .once(
                        "value"
                    );

            const data =
                snapshot.val();

            if (!data) {

                return null;

            }

            const pedido =

                this.normalizarPedido(
                    id,
                    data
                );

            this._cache[id] =
                pedido;

            return pedido;

        } catch (error) {

            console.error(
                "[PedidoService:getById]",
                error
            );

            return null;

        }

    },

    // ==========================================================
    // ATUALIZAR STATUS
    // ==========================================================

    async updateStatus(
        id,
        status
    ) {

        try {

            if (!id) {

                throw new Error(
                    "ID do pedido obrigatório."
                );

            }

            await this
                ._db()
                .ref(
                    `${this._getPath()}/${id}`
                )
                .update({

                    status:
                        this._safeString(
                            status
                        ),

                    updatedAt:
                        Date.now()

                });

            if (
                this._cache[id]
            ) {

                this._cache[id].status =
                    status;

                this._cache[id].updatedAt =
                    Date.now();

            }

            return true;

        } catch (error) {

            console.error(
                "[PedidoService:updateStatus]",
                error
            );

            return false;

        }

    },

    // ==========================================================
    // ATUALIZAR PEDIDO
    // ==========================================================

    async update(
        id,
        partialData = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "ID obrigatório."
                );

            }

            const payload = {

                ...partialData,

                updatedAt:
                    Date.now()

            };

            await this
                ._db()
                .ref(
                    `${this._getPath()}/${id}`
                )
                .update(
                    payload
                );

            if (
                this._cache[id]
            ) {

                this._cache[id] = {

                    ...this._cache[id],

                    ...payload

                };

            }

            return true;

        } catch (error) {

            console.error(
                "[PedidoService:update]",
                error
            );

            return false;

        }

    },

    // ==========================================================
    // EXCLUIR
    // ==========================================================

    async delete(id) {

        try {

            if (!id) {

                return false;

            }

            await this
                ._db()
                .ref(
                    `${this._getPath()}/${id}`
                )
                .remove();

            delete this._cache[id];

            return true;

        } catch (error) {

            console.error(
                "[PedidoService:delete]",
                error
            );

            return false;

        }

    },

    // ==========================================================
    // REALTIME
    // ==========================================================

    subscribe(callback) {

        try {

            const ref =

                this
                    ._db()
                    .ref(
                        this._getPath()
                    );

            ref.on(

                "value",

                snapshot => {

                    const data =
                        snapshot.val() || {};

                    this._cache = {};

                    Object.entries(
                        data
                    ).forEach(

                        ([id, raw]) => {

                            this._cache[id] =

                                this.normalizarPedido(
                                    id,
                                    raw
                                );

                        }

                    );

                    this._cacheTimestamp =
                        Date.now();

                    if (
                        typeof callback ===
                        "function"
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
                "[PedidoService:subscribe]",
                error
            );

        }

    },

    // ==========================================================
    // REMOVER LISTENER
    // ==========================================================

    unsubscribe(ref) {

        try {

            if (ref) {

                ref.off();

            }

        } catch (error) {

            console.error(
                "[PedidoService:unsubscribe]",
                error
            );

        }

    }

};

// ==========================================================
// EXPORTS
// ==========================================================

window.PedidoService =
    PedidoService;

window.pedidoService =
    PedidoService;

console.log(
    "📦 PedidoService Premium v6.0 carregado."
);
