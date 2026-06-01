// ======================================================================
// js/firebase/services/galvanicaService.js
// Abella Joias - GalvanicaService v3.0
// ======================================================================

const GalvanicaService = {

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
    // Normalização
    // ==========================================================

    normalizar(id, raw = {}) {

        return {

            id,

            nome:
                raw.nome || "",

            selo:
                raw.selo || "PARCEIRO",

            whatsapp: String(
                raw.whatsapp || ""
            ).replace(/\D/g, ""),

            telefone: String(
                raw.telefone || ""
            ).replace(/\D/g, ""),

            descricao:
                raw.descricao || "",

            endereco:
                raw.endereco || "",

            imagem:
                raw.imagem ||
                raw.image ||
                "",

            active:
                raw.active !== false
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
                    .ref(
                        "abella/galvanicas"
                    )
                    .once("value");

            const data =
                snapshot.val() || {};

            this._cache = {};

            Object.entries(data)
                .forEach(
                    ([id, raw]) => {

                        this._cache[id] =
                            this.normalizar(
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
                "[GalvanicaService:getAll]",
                error
            );

            return {};
        }
    },

    // ==========================================================
    // Buscar Lista
    // ==========================================================

    async obterParceiros() {

        try {

            const dados =
                await this.getAll();

            return Object.values(
                dados
            );

        } catch (error) {

            console.error(
                "[GalvanicaService:obterParceiros]",
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
                        `abella/galvanicas/${id}`
                    )
                    .once("value");

            const data =
                snapshot.val();

            if (!data) {

                return null;
            }

            const parceiro =
                this.normalizar(
                    id,
                    data
                );

            this._cache[id] =
                parceiro;

            return parceiro;

        } catch (error) {

            console.error(
                "[GalvanicaService:getById]",
                error
            );

            return null;
        }
    },

    // ==========================================================
    // Salvar
    // ==========================================================

    async save(
        id,
        data = {}
    ) {

        try {

            const nome =
                (
                    data.nome || ""
                ).trim();

            if (!nome) {

                throw new Error(
                    "Nome obrigatório."
                );
            }

            const record = {

                nome,

                selo:
                    data.selo ||
                    "PARCEIRO",

                whatsapp: String(
                    data.whatsapp || ""
                ).replace(/\D/g, ""),

                telefone: String(
                    data.telefone || ""
                ).replace(/\D/g, ""),

                descricao:
                    data.descricao || "",

                endereco:
                    data.endereco || "",

                imagem:
                    data.imagem ||
                    data.image ||
                    "",

                active:
                    data.active !== false
            };

            if (id) {

                await this
                    ._db()
                    .ref(
                        `abella/galvanicas/${id}`
                    )
                    .update(
                        record
                    );

                this._cache[id] = {
                    id,
                    ...record
                };

                return id;
            }

            const ref =
                this
                    ._db()
                    .ref(
                        "abella/galvanicas"
                    )
                    .push();

            await ref.set(
                record
            );

            this._cache[ref.key] = {
                id: ref.key,
                ...record
            };

            return ref.key;

        } catch (error) {

            console.error(
                "[GalvanicaService:save]",
                error
            );

            throw error;
        }
    },

    // ==========================================================
    // Ativar / Desativar
    // ==========================================================

    async toggleStatus(id) {

        try {

            const parceiro =
                await this.getById(id);

            if (!parceiro) {

                throw new Error(
                    "Parceiro não encontrado."
                );
            }

            const novoStatus =
                !parceiro.active;

            await this
                ._db()
                .ref(
                    `abella/galvanicas/${id}`
                )
                .update({
                    active:
                        novoStatus
                });

            if (
                this._cache[id]
            ) {

                this._cache[id]
                    .active =
                    novoStatus;
            }

            return true;

        } catch (error) {

            console.error(
                "[GalvanicaService:toggleStatus]",
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
                    `abella/galvanicas/${id}`
                )
                .remove();

            delete this._cache[id];

            return true;

        } catch (error) {

            console.error(
                "[GalvanicaService:delete]",
                error
            );

            return false;
        }
    },

    // ==========================================================
    // Regra Frete Grátis
    // ==========================================================

    verificarFreteGratis(
        totalPedido = 0
    ) {

        return Number(
            totalPedido
        ) >= 100;
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
                        "abella/galvanicas"
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
                                    this.normalizar(
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
                "[GalvanicaService:subscribe]",
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
                "[GalvanicaService:unsubscribe]",
                error
            );
        }
    }
};

window.GalvanicaService =
    GalvanicaService;
