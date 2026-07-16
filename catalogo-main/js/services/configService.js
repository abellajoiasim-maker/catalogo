// ======================================================================
// js/services/configService.js
// Abella Joias - ConfigService v8.2 (Edição Exclusiva e Estática)
// Autoridade Suprema Exclusiva sobre: abella/settings e dados corporativos
// Arquitetura Homologada PMA V8 - Arquivo Completo, Simplificado e Selado
// ======================================================================

(function () {
    'use strict';

    // ROTA ESTÁTICA E EXCLUSIVA - ZERO ABSTRAÇÃO PARA EVITAR ERROS
    const SETTINGS_PATH = 'abella/settings';

    // FALLBACKS OPERACIONAIS INSTITUCIONAIS DEFENSIVOS
    const DEFAULT_SETTINGS = Object.freeze({
        nomeEmpresa: 'Abella Joias',
        slogan: 'Atacado de Joias no Bruto e Semi-joias',
        logo: '',
        banner: '',
        whatsEmpresa: '5519988207658',
        email: '',
        instagram: '',
        endereco: '',
        parcelasMax: 6,
        pixDesc: 5,
        theme: 'dark',
        descontos: Object.freeze({
            ativo: false,
            porcentagem: 0,
            regrasCategoria: {}
        }),
        cores: Object.freeze({
            primaria: '#caa85c',
            secundaria: '#000000',
            fundo: '#000000',
            texto: '#ffffff'
        })
    });

    // ESTADO MUTÁVEL DE CACHE (fora do objeto selado, para permitir escrita em modo estrito)
    let _cache = null;
    let _cacheTimestamp = 0;

    const ConfigService = {
        _cacheTTL: 60000,

        // CONEXÃO COM A ABSTRAÇÃO DE BASE DE DADOS
        _db() {
            if (!window.db) {
                throw new Error('[PMA V8] [ConfigService] Infraestrutura Firebase Realtime Database indisponível.');
            }
            return window.db;
        },

        // ATALHO EXCLUSIVO DE ACESSO AO NÓ DE SETTINGS DA ABELLA JOIAS
        _ref() {
            return this._db().ref(SETTINGS_PATH);
        },

        // VALIDAÇÃO CRONOLÓGICA DO CACHE EM MEMÓRIA
        _isCacheValid() {
            return Boolean(
                _cache && 
                (Date.now() - _cacheTimestamp) < this._cacheTTL
            );
        },

        // INVALIDAÇÃO FORÇADA DE INFRAESTRUTURA DE DADOS
        invalidateCache() {
            _cache = null;
            _cacheTimestamp = 0;
        },

        // MONITOR DE COMPATIBILIDADE E SANEAMENTO DE ENTRADAS
        normalizarConfiguracoes(raw = {}) {
            const empresa = raw.empresa || {};
            const coresCruas = raw.cores || empresa.cores || {};
            const descontosCruos = raw.descontos || empresa.descontos || {};

            return {
                nomeEmpresa: String(
                    raw.nomeEmpresa ?? raw.nome ?? empresa.nomeEmpresa ?? empresa.nome ?? DEFAULT_SETTINGS.nomeEmpresa
                ).trim(),
                
                slogan: String(
                    raw.slogan ?? empresa.slogan ?? DEFAULT_SETTINGS.slogan
                ).trim(),
                
                logo: String(
                    raw.logo ?? empresa.logo ?? DEFAULT_SETTINGS.logo
                ).trim(),
                
                banner: String(
                    raw.banner ?? empresa.banner ?? DEFAULT_SETTINGS.banner
                ).trim(),
                
                whatsEmpresa: String(
                    raw.whatsEmpresa ?? raw.whatsapp ?? empresa.whatsEmpresa ?? empresa.whatsapp ?? DEFAULT_SETTINGS.whatsEmpresa
                ).replace(/\D/g, ''),
                
                email: String(
                    raw.email ?? empresa.email ?? DEFAULT_SETTINGS.email
                ).trim(),
                
                instagram: String(
                    raw.instagram ?? empresa.instagram ?? DEFAULT_SETTINGS.instagram
                ).trim(),
                
                endereco: String(
                    raw.endereco ?? empresa.endereco ?? DEFAULT_SETTINGS.endereco
                ).trim(),
                
                parcelasMax: Number(
                    raw.parcelasMax ?? raw.parcelas ?? empresa.parcelasMax ?? empresa.parcelas ?? DEFAULT_SETTINGS.parcelasMax
                ),
                
                pixDesc: Number(
                    raw.pixDesc ?? raw.pix ?? empresa.pixDesc ?? empresa.pix ?? DEFAULT_SETTINGS.pixDesc
                ),

                theme: String(
                    raw.theme ?? empresa.theme ?? DEFAULT_SETTINGS.theme
                ).trim(),

                descontos: {
                    ativo: Boolean(descontosCruos.ativo ?? DEFAULT_SETTINGS.descontos.ativo),
                    porcentagem: Number(descontosCruos.porcentagem ?? descontosCruos.valor ?? 0),
                    regrasCategoria: descontosCruos.regrasCategoria || {}
                },

                cores: {
                    primaria: String(coresCruas.primaria ?? coresCruas.primary ?? DEFAULT_SETTINGS.cores.primaria),
                    secundaria: String(coresCruas.secundaria ?? coresCruas.secondary ?? DEFAULT_SETTINGS.cores.secundaria),
                    fundo: String(coresCruas.fundo ?? coresCruas.background ?? DEFAULT_SETTINGS.cores.fundo),
                    texto: String(coresCruas.texto ?? coresCruas.text ?? DEFAULT_SETTINGS.cores.texto)
                }
            };
        },

        // RESOLUÇÃO DE LEITURA COM EXPULSÃO DE PARALELISMO DE REFERÊNCIAS
        async getSettings(forceRefresh = false) {
            try {
                if (!forceRefresh && this._isCacheValid()) {
                    return structuredClone(_cache);
                }

                const snapshot = await this._ref().once('value');
                const data = snapshot.val() || {};

                _cache = this.normalizarConfiguracoes(data);
                _cacheTimestamp = Date.now();

                return structuredClone(_cache);
            } catch (error) {
                console.error('[PMA V8] [ConfigService] Falha ao recuperar parametrização da Abella Joias:', error);
                return structuredClone(DEFAULT_SETTINGS);
            }
        },

        // ESCRITA ATÔMICA CENTRALIZADA EM ESPELHO SIMÉTRICO
        async saveSettings(settingsData = {}) {
            try {
                const normalized = this.normalizarConfiguracoes(settingsData);

                const payload = {
                    nomeEmpresa: normalized.nomeEmpresa,
                    slogan: normalized.slogan,
                    logo: normalized.logo,
                    banner: normalized.banner,
                    whatsEmpresa: normalized.whatsEmpresa,
                    whatsapp: normalized.whatsEmpresa,
                    email: normalized.email,
                    instagram: normalized.instagram,
                    endereco: normalized.endereco,
                    parcelasMax: normalized.parcelasMax,
                    parcelas: normalized.parcelasMax,
                    pixDesc: normalized.pixDesc,
                    pix: normalized.pixDesc,
                    theme: normalized.theme,
                    descontos: normalized.descontos,
                    cores: normalized.cores
                };

                await this._ref().update(payload);

                _cache = normalized;
                _cacheTimestamp = Date.now();
                return true;
            } catch (error) {
                console.error('[PMA V8] [ConfigService] Falha ao gravar parametrização no Firebase:', error);
                return false;
            }
        },

        // ATUALIZAÇÃO PARCIAL PARADIGMÁTICA DE INFRAESTRUTURA
        async update(partialData = {}) {
            try {
                const current = await this.getSettings(true);
                
                const merged = {
                    ...current,
                    ...partialData,
                    descontos: partialData.descontos ? { ...current.descontos, ...partialData.descontos } : current.descontos,
                    cores: partialData.cores ? { ...current.cores, ...partialData.cores } : current.cores
                };

                return await this.saveSettings(merged);
            } catch (error) {
                console.error('[PMA V8] [ConfigService] Escrita parcial abortada por inconsistência:', error);
                return false;
            }
        },

        // ASSINATURA REATIVA PÚBLICA EM STREAM DE DADOS
        subscribe(callback) {
            try {
                const ref = this._ref();
                
                ref.on('value', (snapshot) => {
                    const data = snapshot.val() || {};
                    _cache = this.normalizarConfiguracoes(data);
                    _cacheTimestamp = Date.now();

                    if (typeof callback === 'function') {
                        callback(structuredClone(_cache));
                    }
                });

                return ref;
            } catch (error) {
                console.error('[PMA V8] [ConfigService] Assinatura reativa falhou:', error);
                return null;
            }
        },

        // REMOÇÃO DESACOPLADA DE ASSINATURA EM TEMPO REAL
        unsubscribe(ref) {
            try {
                if (ref && typeof ref.off === 'function') {
                    ref.off('value');
                }
            } catch (error) {
                console.error('[PMA V8] [ConfigService] Desconexão de listener interceptada:', error);
            }
        }
    };

    // CONGELAMENTO FINAL PARA PROTEÇÃO E ISOLAMENTO DA ARQUITETURA
    Object.defineProperty(window, 'ConfigService', {
        value: Object.freeze(ConfigService),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] ⚙️ ConfigService v8.2 exclusivo Abella Joias selado.');
})();
