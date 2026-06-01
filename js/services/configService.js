// ======================================================================
// js/firebase/services/configService.js
// Abella Joias - ConfigService v3.0
// ======================================================================

const ConfigService = {

    _cache: null,
    _cacheTimestamp: 0,
    _cacheTTL: 60000,

    _defaultSettings: {

        pixDesc: 5,

        parcelasMax: 6,

        whatsEmpresa:
            "5519988207658",

        nomeEmpresa:
            "Abella Joias",

        instagram:
            "",

        endereco:
            "",

        email:
            ""
    },

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
            this._cache &&
            (Date.now() - this._cacheTimestamp) <
            this._cacheTTL
        );
    },

    invalidateCache() {

        this._cache = null;
        this._cacheTimestamp = 0;
    },

    // ==========================================================
    // Normalização
    // ==========================================================

    normalizarConfiguracoes(
        raw = {}
    ) {

        const empresa =
            raw.empresa || {};

        return {

            pixDesc: Number(
                raw.pix ??
                empresa.pix ??
                this._defaultSettings.pixDesc
            ),

            parcelasMax: Number(
                raw.parcelas ??
                empresa.parcelas ??
                this._defaultSettings.parcelasMax
            ),

            whatsEmpresa: String(
                raw.whatsapp ??
                empresa.whatsapp ??
                this._defaultSettings.whatsEmpresa
            ).replace(/\D/g, ""),

            nomeEmpresa:
                raw.nomeEmpresa ??
                empresa.nomeEmpresa ??
                this._defaultSettings.nomeEmpresa,

            instagram:
                raw.instagram ??
                empresa.instagram ??
                this._defaultSettings.instagram,

            endereco:
                raw.endereco ??
                empresa.endereco ??
                this._defaultSettings.endereco,

            email:
                raw.email ??
                empresa.email ??
                this._defaultSettings.email
        };
    },

    // ==========================================================
    // Buscar Configurações
    // ==========================================================

    async getSettings(
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
                        "abella/settings"
                    )
                    .once("value");

            const data =
                snapshot.val() || {};

            this._cache =
                this.normalizarConfiguracoes(
                    data
                );

            this._cacheTimestamp =
                Date.now();

            return this._cache;

        } catch (error) {

            console.error(
                "[ConfigService:getSettings]",
                error
            );

            return {
                ...this._defaultSettings
            };
        }
    },

    // ==========================================================
    // Salvar Configurações
    // ==========================================================

    async saveSettings(
        settingsData = {}
    ) {

        try {

            const payload = {

                pix: Number(
                    settingsData.pixDesc ??
                    this._defaultSettings.pixDesc
                ),

                parcelas: Number(
                    settingsData.parcelasMax ??
                    this._defaultSettings.parcelasMax
                ),

                whatsapp: String(
                    settingsData.whatsEmpresa ??
                    this._defaultSettings.whatsEmpresa
                ).replace(/\D/g, ""),

                nomeEmpresa:
                    settingsData.nomeEmpresa || "",

                instagram:
                    settingsData.instagram || "",

                endereco:
                    settingsData.endereco || "",

                email:
                    settingsData.email || ""
            };

            await this
                ._db()
                .ref(
                    "abella/settings"
                )
                .update(
                    payload
                );

            this._cache =
                this.normalizarConfiguracoes(
                    payload
                );

            this._cacheTimestamp =
                Date.now();

            return true;

        } catch (error) {

            console.error(
                "[ConfigService:saveSettings]",
                error
            );

            return false;
        }
    },

    // ==========================================================
    // Atualização Parcial
    // ==========================================================

    async update(
        partialData = {}
    ) {

        try {

            await this
                ._db()
                .ref(
                    "abella/settings"
                )
                .update(
                    partialData
                );

            if (
                this._cache
            ) {

                this._cache = {

                    ...this._cache,

                    ...partialData
                };
            }

            return true;

        } catch (error) {

            console.error(
                "[ConfigService:update]",
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
                        "abella/settings"
                    );

            ref.on(
                "value",
                snapshot => {

                    const data =
                        snapshot.val() || {};

                    this._cache =
                        this.normalizarConfiguracoes(
                            data
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
                "[ConfigService:subscribe]",
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
                "[ConfigService:unsubscribe]",
                error
            );
        }
    }
};

window.ConfigService =
    ConfigService;
