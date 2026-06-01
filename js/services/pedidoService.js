// ======================================================================
// js/firebase/services/pedidoService.js
// Abella Joias - PedidoService v3.0
// ======================================================================

const PedidoService = {

    _cache: {},
    _cacheTimestamp: 0,
    _cacheTTL: 30000,

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
    // Normalização
    // ==========================================================

    normalizarPedido(id, raw = {}) {

    return {

        id,

        numeroPedido:
            raw.numeroPedido || "",

        cliente:
            raw.cliente || "",

        whats:
            raw.whats || "",

        cidade:
            raw.cidade || "",

        formaPagamento:
            raw.formaPagamento || "PIX",

        observacoes:
            raw.observacoes || "",

        subtotal:
            Number(raw.subtotal ?? 0),

        desconto:
            Number(raw.desconto ?? 0),

        frete:
            Number(raw.frete ?? 0),

        total:
            Number(raw.total ?? 0),

        pesoTotal:
            Number(raw.pesoTotal ?? 0),

        totalPecas:
            Number(raw.totalPecas ?? 0),

        status:
            raw.status || "Novo",

        entrega: {

            nome:
                raw.entrega?.nome || "",

            endereco:
                raw.entrega?.endereco || "",

            numero:
                raw.entrega?.numero || "",

            bairro:
                raw.entrega?.bairro || ""
        },

        itens:
            Array.isArray(raw.itens)
                ? raw.itens
                : []
    };
}

    // ==========================================================
    // Criar Pedido
    // ==========================================================

    async create(
        pedidoData = {}
    ) {

        try {

            const ref =
                this
                    ._db()
                    .ref(
                        "abella/orders"
                    )
                    .push();

            const payload = {

    numeroPedido:
        pedidoData.numeroPedido || "",

    cliente:
        pedidoData.cliente || "",

    whats:
        pedidoData.whats || "",

    cidade:
        pedidoData.cidade || "",

    formaPagamento:
        pedidoData.formaPagamento || "PIX",

    observacoes:
        pedidoData.observacoes || "",

    subtotal:
        Number(
            pedidoData.subtotal ?? 0
        ),

    desconto:
        Number(
            pedidoData.desconto ?? 0
        ),

    frete:
        Number(
            pedidoData.frete ?? 0
        ),

    total:
        Number(
            pedidoData.total ?? 0
        ),

    pesoTotal:
        Number(
            pedidoData.pesoTotal ?? 0
        ),

    totalPecas:
        Number(
            pedidoData.totalPecas ?? 0
        ),

    status:
        pedidoData.status || "Novo",

    entrega: {

        nome:
            pedidoData.entrega?.nome || "",

        endereco:
            pedidoData.entrega?.endereco || "",

        numero:
            pedidoData.entrega?.numero || "",

        bairro:
            pedidoData.entrega?.bairro || ""
    },

    itens:
        Array.isArray(
            pedidoData.itens
        )
            ? pedidoData.itens
            : []
};

            delete payload.id;

            await ref.set(
                payload
            );

            this._cache[ref.key] = {
                id: ref.key,
                ...payload
            };

            return ref.key;

        } catch (error) {

            console.error(
                "[PedidoService:create]",
                error
            );

            throw error;
        }
    },

    // ==========================================================
    // Buscar Todos
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
                        "abella/orders"
                    )
                    .once("value");

            const data =
                snapshot.val() || {};

            this._cache = {};

            Object.entries(data)
                .forEach(
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
    // Buscar Pedido
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
                        `abella/orders/${id}`
                    )
                    .once("value");

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
    // Atualizar Status
    // ==========================================================

    async updateStatus(
        id,
        novoStatus
    ) {

        try {

            await this
                ._db()
                .ref(
                    `abella/orders/${id}`
                )
                .update({

                    status:
                        novoStatus
                });

            if (
                this._cache[id]
            ) {

                this._cache[id]
                    .status =
                    novoStatus;
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
    // Atualizar Pedido
    // ==========================================================

    async update(
        id,
        dados = {}
    ) {

        try {

            if (!id) {

                throw new Error(
                    "ID inválido."
                );
            }

            await this
                ._db()
                .ref(
                    `abella/orders/${id}`
                )
                .update(
                    dados
                );

            if (
                this._cache[id]
            ) {

                this._cache[id] = {

                    ...this._cache[id],

                    ...dados
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
    // Excluir Pedido
    // ==========================================================

    async delete(id) {

        try {

            await this
                ._db()
                .ref(
                    `abella/orders/${id}`
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
    // Realtime Listener
    // ==========================================================

    subscribe(callback) {

        try {

            const ref =
                this
                    ._db()
                    .ref(
                        "abella/orders"
                    );

            ref.on(
                "value",
                snapshot => {

                    const data =
                        snapshot.val() || {};

                    this._cache = {};

                    Object.entries(data)
                        .forEach(
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
    // Remover Listener
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

window.PedidoService =
    PedidoService;
