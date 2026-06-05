// ======================================================================
// js/services/configService.js
// Abella Joias - ConfigService v4.0
// ======================================================================

(function () {

    'use strict';

    const SETTINGS_PATH =
        getAbellaPath('settings');

    const DEFAULT_SETTINGS =
        Object.freeze({

            pixDesc: 5,

            parcelasMax: 6,

            whatsEmpresa:
                '5519988207658',

            nomeEmpresa:
                'Abella Joias',

            instagram: '',

            endereco: '',

            email: ''

        });

    const ConfigService = {

        _cache: null,

        _cacheTimestamp: 0,

        _cacheTTL: 60000,

        // ======================================================
        // DATABASE
        // ======================================================

        _db() {

            if (!window.db) {

                throw new Error(
                    'Firebase Database não inicializado.'
                );
            }

            return window.db;
        },

        // ======================================================
        // REF
        // ======================================================

        _ref() {

            return this
                ._db()
                .ref(SETTINGS_PATH);
        },

        // ======================================================
        // CACHE
        // ======================================================

        _isCacheValid() {

            return Boolean(
                this._cache &&
                (Date.now() - this._cacheTimestamp)
                < this._cacheTTL
            );
        },

        invalidateCache() {

            this._cache = null;

            this._cacheTimestamp = 0;
        },

        // ======================================================
        // NORMALIZAÇÃO
        // ======================================================

        normalizarConfiguracoes(
            raw = {}
        ) {

            const empresa =
                raw.empresa || {};

            return Object.freeze({

                pixDesc: Number(
                    raw.pix ??
                    empresa.pix ??
                    DEFAULT_SETTINGS.pixDesc
                ),

                parcelasMax: Number(
                    raw.parcelas ??
                    empresa.parcelas ??
                    DEFAULT_SETTINGS.parcelasMax
                ),

                whatsEmpresa: String(
                    raw.whatsapp ??
                    empresa.whatsapp ??
                    DEFAULT_SETTINGS.whatsEmpresa
                ).replace(/\D/g, ''),

                nomeEmpresa: String(
                    raw.nomeEmpresa ??
                    empresa.nomeEmpresa ??
                    DEFAULT_SETTINGS.nomeEmpresa
                ),

                instagram: String(
                    raw.instagram ??
                    empresa.instagram ??
                    DEFAULT_SETTINGS.instagram
                ),

                endereco: String(
                    raw.endereco ??
                    empresa.endereco ??
                    DEFAULT_SETTINGS.endereco
                ),

                email: String(
                    raw.email ??
                    empresa.email ??
                    DEFAULT_SETTINGS.email
                )
            });
        },

        // ======================================================
        // GET SETTINGS
        // ======================================================

        async getSettings(
            forceRefresh = false
        ) {

            try {

                if (
                    !forceRefresh &&
                    this._isCacheValid()
                ) {

                    return structuredClone(
                        this._cache
                    );
                }

                const snapshot =
                    await this
                        ._ref()
                        .once('value');

                const data =
                    snapshot.val() || {};

                this._cache =
                    this.normalizarConfiguracoes(
                        data
                    );

                this._cacheTimestamp =
                    Date.now();

                return structuredClone(
                    this._cache
                );

            } catch (error) {

                console.error(
                    '[ConfigService:getSettings]',
                    error
                );

                return structuredClone(
                    DEFAULT_SETTINGS
                );
            }
        },

        // ======================================================
        // SAVE SETTINGS
        // ======================================================

        async saveSettings(
            settingsData = {}
        ) {

            try {

                const normalized =
                    this.normalizarConfiguracoes(
                        settingsData
                    );

                const payload = {

                    pix:
                        normalized.pixDesc,

                    parcelas:
                        normalized.parcelasMax,

                    whatsapp:
                        normalized.whatsEmpresa,

                    nomeEmpresa:
                        normalized.nomeEmpresa,

                    instagram:
                        normalized.instagram,

                    endereco:
                        normalized.endereco,

                    email:
                        normalized.email
                };

                await this
                    ._ref()
                    .update(payload);

                this._cache =
                    this.normalizarConfiguracoes(
                        payload
                    );

                this._cacheTimestamp =
                    Date.now();

                return true;

            } catch (error) {

                console.error(
                    '[ConfigService:saveSettings]',
                    error
                );

                return false;
            }
        },

        // ======================================================
        // UPDATE PARCIAL
        // ======================================================

        async update(
            partialData = {}
        ) {

            try {

                const current =
                    await this.getSettings();

                const merged = {

                    ...current,

                    ...partialData
                };

                return await this
                    .saveSettings(merged);

            } catch (error) {

                console.error(
                    '[ConfigService:update]',
                    error
                );

                return false;
            }
        },

        // ======================================================
        // SUBSCRIBE
        // ======================================================

        subscribe(callback) {

            try {

                const ref =
                    this._ref();

                ref.on(
                    'value',
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
                            'function'
                        ) {

                            callback(
                                structuredClone(
                                    this._cache
                                )
                            );
                        }
                    }
                );

                return ref;

            } catch (error) {

                console.error(
                    '[ConfigService:subscribe]',
                    error
                );
            }
        },

        // ======================================================
        // UNSUBSCRIBE
        // ======================================================

        unsubscribe(ref) {

            try {

                if (
                    ref &&
                    typeof ref.off ===
                    'function'
                ) {

                    ref.off();
                }

            } catch (error) {

                console.error(
                    '[ConfigService:unsubscribe]',
                    error
                );
            }
        }
    };

    window.ConfigService =
        Object.freeze(
            ConfigService
        );

})();
