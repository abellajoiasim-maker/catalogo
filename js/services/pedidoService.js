// ======================================================================
// js/firebase/services/pedidoService.js
// Abella Joias - PedidoService Premium v5.0
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
    // CAMINHO FIREBASE
    // ==========================================================

    _getPath() {

        return "abella/orders";

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
    // NORMALIZADOR
    // ==========================================================

    normalizarPedido(
        id,
        raw = {}
    ) {

        return {

            id,

            numeroPedido:
                raw.numeroPedido || "",

            createdAt:
                raw.createdAt || 0,

            updatedAt:
                raw.updatedAt || 0,

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
                Number(
                    raw.subtotal ?? 0
                ),

            desconto:
                Number(
                    raw.desconto ?? 0
                ),

            frete:
                Number(
                    raw.frete ?? 0
                ),

            total:
                Number(
                    raw.total ?? 0
                ),

            totalPix:
                Number(
                    raw.totalPix ?? 0
                ),

            pesoTotal:
                Number(
                    raw.pesoTotal ?? 0
                ),

            totalPecas:
                Number(
                    raw.totalPecas ?? 0
                ),

            status:
                raw.status || "Recebido",

            entrega: {

                nome:
                    raw.entrega?.nome || "",

                endereco:
                    raw.entrega?.endereco || "",

                numero:
                    raw.entrega?.numero || "",

                bairro:
                    raw.entrega?.bairro || "",

                cidade:
                    raw.entrega?.cidade || ""

            },

            romaneio: {

                subtotal:
                    Number(
                        raw.romaneio?.subtotal ?? 0
                    ),

                desconto:
                    Number(
                        raw.romaneio?.desconto ?? 0
                    ),

                totalPix:
                    Number(
                        raw.romaneio?.totalPix ?? 0
                    ),

                pesoTotal:
                    Number(
                        raw.romaneio?.pesoTotal ?? 0
                    ),

                totalPecas:
                    Number(
                        raw.romaneio?.totalPecas ?? 0
                    )

            },

            itens:
                Array.isArray(
                    raw.itens
                )
                ? raw.itens
                : []

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

            const payload = {

                numeroPedido,

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now(),

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

                totalPix:
                    Number(
                        pedidoData.totalPix ?? 0
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
                    pedidoData.status ||
                    "Recebido",

                entrega: {

                    nome:
                        pedidoData.entrega?.nome || "",

                    endereco:
                        pedidoData.entrega?.endereco || "",

                    numero:
                        pedidoData.entrega?.numero || "",

                    bairro:
                        pedidoData.entrega?.bairro || "",

                    cidade:
                        pedidoData.entrega?.cidade || ""

                },

                romaneio: {

                    subtotal:
                        Number(
                            pedidoData.subtotal ?? 0
                        ),

                    desconto:
                        Number(
                            pedidoData.desconto ?? 0
                        ),

                    totalPix:
                        Number(
                            pedidoData.totalPix ?? 0
                        ),

                    pesoTotal:
                        Number(
                            pedidoData.pesoTotal ?? 0
                        ),

                    totalPecas:
                        Number(
                            pedidoData.totalPecas ?? 0
                        )

                },

                itens:

                    Array.isArray(
                        pedidoData.itens
                    )
                    ? pedidoData.itens
                    : []

            };

            await ref.set(
                payload
            );

            this._cache[
                ref.key
            ] = {

                id:
                    ref.key,

                ...payload

            };

            return {

                success:true,

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

                success:false,

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

            await this
                ._db()
                .ref(
                    `${this._getPath()}/${id}`
                )
                .update({

                    status,

                    updatedAt:
                        Date.now()

                });

            if (
                this._cache[id]
            ) {

                this._cache[id].status =
                    status;

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
    // EXCLUIR
    // ==========================================================

    async delete(id) {

        try {

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

            if(ref){

                ref.off();

            }

        } catch(error){

            console.error(
                "[PedidoService:unsubscribe]",
                error
            );

        }

    }

};

// ==========================================================
// EXPORT
// ==========================================================

window.PedidoService =
    PedidoService;

window.pedidoService =
    PedidoService;

console.log(
    "📦 PedidoService Premium v5.0 carregado."
);
