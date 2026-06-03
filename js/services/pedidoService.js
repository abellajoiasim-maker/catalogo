// ======================================================================
// js/firebase/services/pedidoService.js
// Catálogo Multi-Lojas - PedidoService v4.0 (Dinâmico)
// ======================================================================

const PedidoService = {

    _cache: {},
    _cacheTimestamp: 0,
    _cacheTTL: 30000,

    // ==========================================================
    // Firebase e Definição de Caminho Dinâmico
    // ==========================================================
    _db() {
        if (!window.db) {
            throw new Error("Firebase Database não inicializado.");
        }
        return window.db;
    },

    // Retorna a rota correta baseada no inquilino ativo (Tenant)
    _getPath() {
        // Usa o caminho dinâmico detectado ou faz fallback seguro
        const basePath = window.dbTenantPath || "lojas/abella_joias";
        return `${basePath}/orders`;
    },

    // ==========================================================
    // Cache
    // ==========================================================
    _isCacheValid() {
        return (
            Object.keys(this._cache).length > 0 &&
            (Date.now() - this._cacheTimestamp) < this._cacheTTL
        );
    },

    invalidateCache() {
        this._cache = {};
        this._cacheTimestamp = 0;
    },

    // ==========================================================
    // Normalização dos Dados
    // ==========================================================
    normalizarPedido(id, raw = {}) {
        return {
            id,
            numeroPedido: raw.numeroPedido || "",
            cliente: raw.cliente || "",
            whats: raw.whats || "",
            cidade: raw.cidade || "",
            formaPagamento: raw.formaPagamento || "PIX",
            observacoes: raw.observacoes || "",
            subtotal: Number(raw.subtotal ?? 0),
            desconto: Number(raw.desconto ?? 0),
            frete: Number(raw.frete ?? 0),
            total: Number(raw.total ?? 0),
            pesoTotal: Number(raw.pesoTotal ?? 0),
            totalPecas: Number(raw.totalPecas ?? 0),
            status: raw.status || "Novo",
            entrega: {
                nome: raw.entrega?.nome || "",
                endereco: raw.entrega?.endereco || "",
                numero: raw.entrega?.numero || "",
                bairro: raw.entrega?.bairro || ""
            },
            itens: Array.isArray(raw.itens) ? raw.itens : []
        };
    },

    // ==========================================================
    // Criar Pedido
    // ==========================================================
    async create(pedidoData = {}) {
        try {
            const path = this._getPath();
            const ref = this._db().ref(path).push();

            const payload = {
                numeroPedido: pedidoData.numeroPedido || "",
                cliente: pedidoData.cliente || "",
                whats: pedidoData.whats || "",
                cidade: pedidoData.cidade || "",
                formaPagamento: pedidoData.formaPagamento || "PIX",
                observacoes: pedidoData.observacoes || "",
                subtotal: Number(pedidoData.subtotal ?? 0),
                desconto: Number(pedidoData.desconto ?? 0),
                frete: Number(pedidoData.frete ?? 0),
                total: Number(pedidoData.total ?? 0),
                pesoTotal: Number(pedidoData.pesoTotal ?? 0),
                totalPecas: Number(pedidoData.totalPecas ?? 0),
                status: pedidoData.status || "Novo",
                entrega: {
                    nome: pedidoData.entrega?.nome || "",
                    endereco: pedidoData.entrega?.endereco || "",
                    numero: pedidoData.entrega?.numero || "",
                    bairro: pedidoData.entrega?.bairro || ""
                },
                itens: Array.isArray(pedidoData.itens) ? pedidoData.itens : []
            };

            delete payload.id;

            await ref.set(payload);

            this._cache[ref.key] = {
                id: ref.key,
                ...payload
            };

            return ref.key;
        } catch (error) {
            console.error("[PedidoService:create]", error);
            throw error;
        }
    },

    // ==========================================================
    // Buscar Todos (Carrega a lista de compras do painel)
    // ==========================================================
    async getAll(forceRefresh = false) {
        try {
            if (!forceRefresh && this._isCacheValid()) {
                return this._cache;
            }

            const path = this._getPath();
            const snapshot = await this._db().ref(path).once("value");
            const data = snapshot.val() || {};

            this._cache = {};

            Object.entries(data).forEach(([id, raw]) => {
                this._cache[id] = this.normalizarPedido(id, raw);
            });

            this._cacheTimestamp = Date.now();
            return this._cache;
        } catch (error) {
            console.error("[PedidoService:getAll]", error);
            return {};
        }
    },

    // ==========================================================
    // Buscar Pedido por ID
    // ==========================================================
    async getById(id) {
        if (!id) return null;

        try {
            if (this._cache[id]) {
                return this._cache[id];
            }

            const path = this._getPath();
            const snapshot = await this._db().ref(`${path}/${id}`).once("value");
            const data = snapshot.val();

            if (!data) return null;

            const pedido = this.normalizarPedido(id, data);
            this._cache[id] = pedido;

            return pedido;
        } catch (error) {
            console.error("[PedidoService:getById]", error);
            return null;
        }
    },

    // ==========================================================
    // Atualizar Status
    // ==========================================================
    async updateStatus(id, novoStatus) {
        try {
            const path = this._getPath();
            await this._db().ref(`${path}/${id}`).update({
                status: novoStatus
            });

            if (this._cache[id]) {
                this._cache[id].status = novoStatus;
            }

            return true;
        } catch (error) {
            console.error("[PedidoService:updateStatus]", error);
            return false;
        }
    },

    // ==========================================================
    // Atualizar Dados Gerais do Pedido
    // ==========================================================
    async update(id, dados = {}) {
        try {
            if (!id) throw new Error("ID inválido.");

            const path = this._getPath();
            await this._db().ref(`${path}/${id}`).update(dados);

            if (this._cache[id]) {
                this._cache[id] = {
                    ...this._cache[id],
                    ...dados
                };
            }

            return true;
        } catch (error) {
            console.error("[PedidoService:update]", error);
            return false;
        }
    },

    // ==========================================================
    // Excluir Pedido
    // ==========================================================
    async delete(id) {
        try {
            const path = this._getPath();
            await this._db().ref(`${path}/${id}`).remove();

            delete this._cache[id];
            return true;
        } catch (error) {
            console.error("[PedidoService:delete]", error);
            return false;
        }
    },

    // ==========================================================
    // Realtime Listener (Mantém o dashboard atualizado ao vivo)
    // ==========================================================
    subscribe(callback) {
        try {
            const path = this._getPath();
            const ref = this._db().ref(path);

            ref.on("value", snapshot => {
                const data = snapshot.val() || {};
                this._cache = {};

                Object.entries(data).forEach(([id, raw]) => {
                    this._cache[id] = this.normalizarPedido(id, raw);
                });

                this._cacheTimestamp = Date.now();

                if (typeof callback === "function") {
                    callback(this._cache);
                }
            });

            return ref;
        } catch (error) {
            console.error("[PedidoService:subscribe]", error);
        }
    },

    // ==========================================================
    // Remover Listener
    // ==========================================================
    unsubscribe(ref) {
        try {
            if (ref) ref.off();
        } catch (error) {
            console.error("[PedidoService:unsubscribe]", error);
        }
    }
};

// Exportação Global Segura
window.PedidoService = PedidoService;
