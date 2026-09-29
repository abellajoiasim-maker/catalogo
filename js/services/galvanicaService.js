// ======================================================================
// js/firebase/services/galvanicaService.js
// Abella Joias - GalvanicaService v4.1 (SEO Enhanced)
// ======================================================================

const GalvanicaService = {

    // ==========================================================
    // CACHE
    // ==========================================================

    _cache: {},

    _cacheTimestamp: 0,

    _cacheTTL: 60000,

    // ==========================================================
    // FIREBASE
    // ==========================================================

    _db() {
        if (!window.db) {
            throw new Error('Firebase Database não inicializado.');
        }
        return window.db;
    },

    // ==========================================================
    // PATH HELPER
    // ==========================================================

    _path(path = '') {
        if (typeof window.getAbellaPath !== 'function') {
            console.error('[GalvanicaService] getAbellaPath() não encontrado.');
            return `abella/${path}`;
        }
        return window.getAbellaPath(path);
    },

    // ==========================================================
    // HELPERS
    // ==========================================================

    _safeString(valor = '') {
        return String(valor || '').trim();
    },

    _safeNumber(valor = 0) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : 0;
    },

    _onlyNumbers(valor = '') {
        return String(valor || '').replace(/\D/g, '');
    },

    // ==========================================================
    // CACHE MANAGEMENT
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
    // NORMALIZAÇÃO E ENRIQUECIMENTO SEO
    // ==========================================================

    normalizar(id, raw = {}) {
        const idLimpo = this._safeString(id);
        const nome = this._safeString(raw.nome || raw.name || 'Galvânica Parceira');
        const selo = this._safeString(raw.selo || 'PARCEIRO');
        const whatsappNum = this._onlyNumbers(raw.whatsapp);
        const telefoneNum = this._onlyNumbers(raw.telefone);
        const endereco = this._safeString(raw.endereco || 'Limeira-SP');
        const imagem = this._safeString(raw.imagem || raw.image);

        // Texto ALT enriquecido com palavras-chave estratégicas para motores de busca
        const altSeo = raw.altSeo || 
            `${nome} — Galvânica parceira Abella Joias para banho, folheação e galvanoplastia em ${endereco}`;

        // Ligação formatada para o WhatsApp com mensagem de conversão
        const mensagemWhats = encodeURIComponent(
            `Olá ${nome}. Sou cliente da Abella Joias e gostaria de solicitar informações sobre o serviço de banho e folheação de semijoias no bruto. Como podemos prosseguir?`
        );
        const whatsUrl = whatsappNum ? `https://wa.me/${whatsappNum}?text=${mensagemWhats}` : null;

        return {
            id: idLimpo,
            nome,
            selo,
            whatsapp: whatsappNum,
            telefone: telefoneNum,
            descricao: this._safeString(raw.descricao),
            endereco,
            imagem,
            image: imagem,
            active: raw.active !== false && raw.ativo !== false,
            altSeo,
            whatsUrl,
            createdAt: raw.createdAt || null,
            updatedAt: raw.updatedAt || null
        };
    },

    // ==========================================================
    // GET ALL
    // ==========================================================

    async getAll(forceRefresh = false) {
        try {
            if (!forceRefresh && this._isCacheValid()) {
                return this._cache;
            }

            const snapshot = await this._db()
                .ref(this._path('galvanicas'))
                .once('value');

            const data = snapshot.val() || {};
            this._cache = {};

            Object.entries(data).forEach(([id, raw]) => {
                this._cache[id] = this.normalizar(id, raw);
            });

            this._cacheTimestamp = Date.now();
            return this._cache;

        } catch (error) {
            console.error('[GalvanicaService:getAll]', error);
            return {};
        }
    },

    // ==========================================================
    // OBTER PARCEIROS
    // ==========================================================

    async obterParceiros() {
        try {
            const dados = await this.getAll();
            return Object.values(dados).filter(parceiro => parceiro.active);
        } catch (error) {
            console.error('[GalvanicaService:obterParceiros]', error);
            return [];
        }
    },

    // ==========================================================
    // GET BY ID
    // ==========================================================

    async getById(id) {
        try {
            id = this._safeString(id);
            if (!id) return null;

            if (this._cache[id]) {
                return this._cache[id];
            }

            const snapshot = await this._db()
                .ref(this._path(`galvanicas/${id}`))
                .once('value');

            const data = snapshot.val();
            if (!data) return null;

            const parceiro = this.normalizar(id, data);
            this._cache[id] = parceiro;

            return parceiro;

        } catch (error) {
            console.error('[GalvanicaService:getById]', error);
            return null;
        }
    },

    // ==========================================================
    // SAVE
    // ==========================================================

    async save(id, data = {}) {
        try {
            const nome = this._safeString(data.nome);

            if (!nome) {
                throw new Error('Nome obrigatório.');
            }

            const existente = id ? await this.getById(id) : null;

            const record = {
                nome,
                selo: this._safeString(data.selo || 'PARCEIRO'),
                whatsapp: this._onlyNumbers(data.whatsapp),
                telefone: this._onlyNumbers(data.telefone),
                descricao: this._safeString(data.descricao),
                endereco: this._safeString(data.endereco),
                imagem: this._safeString(data.imagem || data.image),
                image: this._safeString(data.image || data.imagem),
                active: data.active !== false && data.ativo !== false,
                createdAt: existente?.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            if (id) {
                await this._db()
                    .ref(this._path(`galvanicas/${id}`))
                    .update(record);

                this._cache[id] = this.normalizar(id, record);
                return id;
            }

            const ref = this._db()
                .ref(this._path('galvanicas'))
                .push();

            await ref.set(record);

            this._cache[ref.key] = this.normalizar(ref.key, record);
            return ref.key;

        } catch (error) {
            console.error('[GalvanicaService:save]', error);
            throw error;
        }
    },

    // ==========================================================
    // TOGGLE STATUS
    // ==========================================================

    async toggleStatus(id) {
        try {
            const parceiro = await this.getById(id);

            if (!parceiro) {
                throw new Error('Parceiro não encontrado.');
            }

            const novoStatus = !parceiro.active;

            await this._db()
                .ref(this._path(`galvanicas/${id}`))
                .update({
                    active: novoStatus,
                    updatedAt: Date.now()
                });

            if (this._cache[id]) {
                this._cache[id].active = novoStatus;
                this._cache[id].updatedAt = Date.now();
            }

            return true;

        } catch (error) {
            console.error('[GalvanicaService:toggleStatus]', error);
            return false;
        }
    },

    // ==========================================================
    // DELETE
    // ==========================================================

    async delete(id) {
        try {
            id = this._safeString(id);
            if (!id) return false;

            await this._db()
                .ref(this._path(`galvanicas/${id}`))
                .remove();

            delete this._cache[id];
            return true;

        } catch (error) {
            console.error('[GalvanicaService:delete]', error);
            return false;
        }
    },

    // ==========================================================
    // REGRA FRETE GRÁTIS
    // ==========================================================

    verificarFreteGratis(totalPedido = 0) {
        return this._safeNumber(totalPedido) >= 100;
    },

    // ==========================================================
    // SUBSCRIBE (SINCRONIZAÇÃO EM TEMPO REAL)
    // ==========================================================

    subscribe(callback) {
        try {
            const ref = this._db().ref(this._path('galvanicas'));

            ref.on('value', snapshot => {
                const data = snapshot.val() || {};
                this._cache = {};

                Object.entries(data).forEach(([id, raw]) => {
                    this._cache[id] = this.normalizar(id, raw);
                });

                this._cacheTimestamp = Date.now();

                if (typeof callback === 'function') {
                    callback(this._cache);
                }
            }, error => {
                console.error('[GalvanicaService:subscribe]', error);
            });

            return ref;

        } catch (error) {
            console.error('[GalvanicaService:subscribe]', error);
        }
    },

    // ==========================================================
    // UNSUBSCRIBE
    // ==========================================================

    unsubscribe(ref) {
        try {
            if (ref && typeof ref.off === 'function') {
                ref.off();
            }
        } catch (error) {
            console.error('[GalvanicaService:unsubscribe]', error);
        }
    }
};

// ==========================================================
// EXPORTS GLOBAIS
// ==========================================================

window.GalvanicaService = GalvanicaService;
window.galvanicaService = GalvanicaService;

// ==========================================================
// ALIASES LEGADOS
// ==========================================================

GalvanicaService.listarTodas = GalvanicaService.getAll;
GalvanicaService.buscarPorId = GalvanicaService.getById;
GalvanicaService.salvar = GalvanicaService.save;
GalvanicaService.excluir = GalvanicaService.delete;

console.log('⚙️ GalvanicaService v4.1 (SEO Enhanced) carregado.');
