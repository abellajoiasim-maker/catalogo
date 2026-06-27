// ======================================================================
// js/firebase/services/categoriaService.js
// Abella Joias - CategoriaService v8.0 (Arquitetura PMA V8)
// CRUD Especializado de Categorias com Sincronização Unificada em Cascata
// ======================================================================

(function () {
    'use strict';

    const CATEGORIES_PATH = typeof window.getAbellaPath === 'function'
        ? window.getAbellaPath('categories')
        : 'abella/categories';

    const CategoriaService = {
        _cache: {},
        _cacheTimestamp: 0,
        _cacheTTL: 60000,

        // CONEXÃO COM A ABSTRAÇÃO DE BASE DE DADOS
        _db() {
            if (!window.db) {
                throw new Error('[PMA V8] [CategoriaService] Infraestrutura Firebase Realtime Database indisponível.');
            }
            return window.db;
        },

        // ATALHO EXCLUSIVO DE ACESSO AO NÓ DE CATEGORIAS
        _ref() {
            return this._db().ref(CATEGORIES_PATH);
        },

        // VALIDAÇÃO CRONOLÓGICA DO CACHE EM MEMÓRIA
        _isCacheValid() {
            return Boolean(
                Object.keys(this._cache).length > 0 &&
                (Date.now() - this._cacheTimestamp) < this._cacheTTL
            );
        },

        // INVALIDAÇÃO INTEGRAL DE INFRAESTRUTURA DE DADOS
        invalidateCache() {
            this._cache = {};
            this._cacheTimestamp = 0;

            // Alerta o ecossistema central a reconfigurar a árvore reativa unificada de dados
            if (window.CatalogService && typeof window.CatalogService.getCatalog === 'function') {
                window.CatalogService.getCatalog(true).then(novoCatalogo => {
                    if (window.StateManager && typeof window.StateManager.setState === 'function') {
                        window.StateManager.setState('catalog', novoCatalogo);
                    }
                }).catch(err => console.error('[PMA V8] [CategoriaService] Falha na invalidação síncrona do catálogo:', err));
            }
        },

        // HELPERS UTILITÁRIOS E TRATAMENTOS DEFENSIVOS DE PARÂMETROS
        _safeString(valor = '') {
            return String(valor || '').trim();
        },

        _safeNumber(valor = 0) {
            const numero = Number(valor);
            return Number.isFinite(numero) ? numero : 0;
        },

        _safeObject(valor) {
            return (valor && typeof valor === 'object' && !Array.isArray(valor)) ? valor : {};
        },

        gerarSlug(texto = '') {
            return this._safeString(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        validarSlug(slug = '') {
            return /^[a-z0-9-]+$/.test(slug);
        },

        // CONVERSOR DE LINKS CENTRALIZADOS DE ARMAZENAMENTO
        resolverImagem(url = '') {
            const imagem = this._safeString(url);
            if (!imagem) return '';
            if (imagem.startsWith('http://') || imagem.startsWith('https://')) return imagem;

            if (imagem.startsWith('gs://')) {
                try {
                    const semGs = imagem.replace('gs://', '');
                    const partes = semGs.split('/');
                    const bucket = partes.shift();
                    const arquivo = partes.join('/');

                    if (!bucket || !arquivo) return '';
                    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;
                } catch (error) {
                    console.error('[PMA V8] [CategoriaService:resolverImagem] Falha no parser do link gs://:', error);
                    return '';
                }
            }
            return imagem;
        },

        // MONITOR DE COMPATIBILIDADE DE CHAVES E NORMALIZAÇÃO
        normalizarCategoria(slug, raw = {}) {
            const categoriaSlug = this.gerarSlug(slug);
            const nome = this._safeString(raw.nome || raw.name || 'Categoria Sem Nome');
            const imageOriginal = this._safeString(raw.imagem || raw.image || '');

            return Object.freeze({
                id: categoriaSlug,
                slug: categoriaSlug,
                name: nome,
                nome: nome,
                image: this.resolverImagem(imageOriginal),
                imagem: this.resolverImagem(imageOriginal),
                imageOriginal: imageOriginal,
                order: this._safeNumber(raw.order ?? raw.ordem ?? 0),
                ordem: this._safeNumber(raw.ordem ?? raw.order ?? 0),
                active: raw.active !== false && raw.ativo !== false,
                ativo: raw.ativo !== false && raw.active !== false,
                subcategories: this._safeObject(raw.subcategories || raw.subcategorias),
                createdAt: raw.createdAt || Date.now(),
                updatedAt: raw.updatedAt || raw.createdAt || Date.now()
            });
        },

        // ======================================================
        // OPERAÇÕES DE LEITURA (READ)
        // ======================================================

        async getAll(forceRefresh = false) {
            try {
                if (!forceRefresh && this._isCacheValid()) {
                    return structuredClone(this._cache);
                }

                const snapshot = await this._ref().once('value');
                const data = snapshot.val() || {};
                const novoCache = {};

                Object.entries(data).forEach(([slug, raw]) => {
                    novoCache[slug] = this.normalizarCategoria(slug, raw);
                });

                this._cache = novoCache;
                this._cacheTimestamp = Date.now();
                return structuredClone(novoCache);
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:getAll]', error);
                return {};
            }
        },

        async getList(forceRefresh = false) {
            const categorias = await this.getAll(forceRefresh);
            return Object.values(categorias).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        },

        async getBySlug(slug) {
            try {
                const categoriaSlug = this.gerarSlug(slug);
                if (!categoriaSlug) return null;

                if (this._cache && this._cache[categoriaSlug]) {
                    return structuredClone(this._cache[categoriaSlug]);
                }

                const snapshot = await this._ref().child(categoriaSlug).once('value');
                const data = snapshot.val();

                if (!data) return null;

                const categoria = this.normalizarCategoria(categoriaSlug, data);
                this._cache[categoriaSlug] = categoria;
                return structuredClone(categoria);
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:getBySlug]', error);
                return null;
            }
        },

        async exists(slug) {
            const categoria = await this.getBySlug(slug);
            return categoria !== null;
        },

        // ======================================================
        // OPERAÇÕES DE ESCRITA MUTADORA (CUD)
        // ======================================================

        async save(slug, categoryData = {}) {
            try {
                const categoriaSlug = this.gerarSlug(slug);
                if (!categoriaSlug || !this.validarSlug(categoriaSlug)) {
                    throw new Error('Identificador Slug inválido ou fora dos padrões do sistema.');
                }

                const nome = this._safeString(categoryData.nome || categoryData.name);
                if (!nome) throw new Error('Nome identificador da categoria é obrigatório.');

                const existente = await this.getBySlug(categoriaSlug);

                const payload = {
                    nome: nome,
                    name: nome,
                    imagem: this._safeString(categoryData.imagem || categoryData.image),
                    image: this._safeString(categoryData.image || categoryData.imagem),
                    ordem: this._safeNumber(categoryData.ordem ?? categoryData.order ?? 0),
                    order: this._safeNumber(categoryData.order ?? categoryData.ordem ?? 0),
                    ativo: categoryData.ativo !== false && categoryData.active !== false,
                    active: categoryData.active !== false && categoryData.ativo !== false,
                    subcategories: this._safeObject(categoryData.subcategories || categoryData.subcategorias || existente?.subcategories),
                    createdAt: existente?.createdAt || Date.now(),
                    updatedAt: Date.now()
                };

                await this._ref().child(categoriaSlug).set(payload);
                this.invalidateCache();
                return true;
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:save]', error);
                throw error;
            }
        },

        async toggleStatus(slug) {
            try {
                const categoria = await this.getBySlug(slug);
                if (!categoria) throw new Error('Categoria solicitada não localizada.');

                const novoStatus = !categoria.ativo;

                await this._ref().child(categoria.slug).update({
                    ativo: novoStatus,
                    active: novoStatus,
                    updatedAt: Date.now()
                });

                this.invalidateCache();
                return true;
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:toggleStatus]', error);
                return false;
            }
        },

        async delete(slug) {
            try {
                const categoriaSlug = this.gerarSlug(slug);
                if (!categoriaSlug) return false;

                await this._ref().child(categoriaSlug).remove();
                this.invalidateCache();
                return true;
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:delete]', error);
                return false;
            }
        },

        // ======================================================
        // SISTEMA STREAM REATIVO DE MONITOREAMENTO (WEBSOCKET)
        // ======================================================

        subscribe(callback) {
            try {
                const ref = this._ref();
                ref.on('value', snapshot => {
                    const data = snapshot.val() || {};
                    const novoCache = {};

                    Object.entries(data).forEach(([slug, raw]) => {
                        novoCache[slug] = this.normalizarCategoria(slug, raw);
                    });

                    this._cache = novoCache;
                    this._cacheTimestamp = Date.now();

                    if (typeof callback === 'function') {
                        callback(structuredClone(novoCache));
                    }
                });
                return ref;
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:subscribe]', error);
                return null;
            }
        },

        unsubscribe(ref) {
            try {
                if (ref && typeof ref.off === 'function') {
                    ref.off('value');
                }
            } catch (error) {
                console.error('[PMA V8] [CategoriaService:unsubscribe]', error);
            }
        },

        // ======================================================
        // MAPA INTERNO DE COMPATIBILIDADE LEGADA (ANTIFRATURA)
        // ======================================================
        listarTodas: null,
        buscarPorSlug: null,
        obterPorId: null,
        salvarCategoria: null,
        excluirCategoria: null
    };

    // Vinculação explícita de referências antes do congelamento físico do objeto
    CategoriaService.listarTodas = CategoriaService.getList;
    CategoriaService.buscarPorSlug = CategoriaService.getBySlug;
    CategoriaService.obterPorId = CategoriaService.getBySlug;
    CategoriaService.salvarCategoria = CategoriaService.save;
    CategoriaService.excluirCategoria = CategoriaService.delete;

    // FECHAMENTO SEGURO DA CAMADA DE PERSISTÊNCIA NO ESCOPO WINDOW VIA PROPRIEDADE IMUTÁVEL
    Object.defineProperty(window, 'categoriaService', {
        value: Object.freeze(CategoriaService),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] [CategoriaService] Camada de persistência especializada em categorias homologada.');
})();
