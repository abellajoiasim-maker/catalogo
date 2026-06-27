// ======================================================================
// js/firebase/services/subcategoriaService.js
// Abella Joias - SubcategoriaService v8.0 (Arquitetura PMA V8)
// CRUD Reativo com Blindagem de Estado e Integração de Ecossistema
// ======================================================================

(function () {
    'use strict';

    const getAbellaPath = (path) => (typeof window.getAbellaPath === 'function' ? window.getAbellaPath(path) : `abella/${path}`);

    const SubcategoriaService = {
        _cache: {},

        _db() {
            if (!window.db) throw new Error('[PMA V8] [SubcategoriaService] Firebase indisponível.');
            return window.db;
        },

        _categoriaService() {
            return window.categoriaService || null;
        },

        _safeString: (valor = '') => String(valor || '').trim(),
        _safeNumber: (valor = 0) => (Number.isFinite(Number(valor)) ? Number(valor) : 0),

        normalizarSubcategoria(slug, raw = {}) {
            const isPaused = raw.paused === true;
            return Object.freeze({
                id: this._safeString(slug),
                slug: this._safeString(slug),
                name: this._safeString(raw.name || raw.nome || 'Subcategoria'),
                image: this._safeString(raw.image || raw.imagem || ''),
                paused: isPaused,
                active: !isPaused,
                order: this._safeNumber(raw.order ?? 0),
                createdAt: raw.createdAt || Date.now(),
                updatedAt: raw.updatedAt || Date.now()
            });
        },

        // INVALIDAÇÃO DE ESTADO COM CASCATA PARA O CATALOGSERVICE
        _triggerReactivity() {
            const catService = this._categoriaService();
            if (catService) catService.invalidateCache();
            
            // Força a atualização do catálogo unificado
            if (window.CatalogService && typeof window.CatalogService.getCatalog === 'function') {
                window.CatalogService.getCatalog(true).then(novoCatalogo => {
                    if (window.StateManager && typeof window.StateManager.setState === 'function') {
                        window.StateManager.setState('catalog', novoCatalogo);
                    }
                });
            }
        },

        async getByCategory(catSlug) {
            try {
                if (!catSlug) return {};
                const catService = this._categoriaService();
                if (!catService) throw new Error('CategoriaService indisponível.');

                const categoria = await catService.getBySlug(catSlug);
                if (!categoria || !categoria.subcategories) return {};

                const resultado = {};
                Object.entries(categoria.subcategories).forEach(([slug, raw]) => {
                    resultado[slug] = this.normalizarSubcategoria(slug, raw);
                });

                this._cache[catSlug] = resultado;
                return resultado;
            } catch (error) {
                console.error('[PMA V8] [SubcategoriaService:getByCategory]', error);
                return {};
            }
        },

        async getList(catSlug) {
            const subcategorias = await this.getByCategory(catSlug);
            return Object.values(subcategorias).sort((a, b) => (a.order || 0) - (b.order || 0));
        },

        async getBySlug(catSlug, subSlug) {
            const subs = await this.getByCategory(catSlug);
            return subs[subSlug] || null;
        },

        async save(catSlug, subSlug, subcatData = {}) {
            try {
                if (!catSlug || !subSlug) throw new Error('Parâmetros obrigatórios ausentes.');
                
                const catService = this._categoriaService();
                if (!catService || !(await catService.exists(catSlug))) throw new Error(`Categoria "${catSlug}" inválida.`);

                const existente = await this.getBySlug(catSlug, subSlug);
                const node = {
                    name: this._safeString(subcatData.name || subcatData.nome),
                    image: this._safeString(subcatData.image || subcatData.imagem),
                    paused: subcatData.paused === true,
                    order: this._safeNumber(subcatData.order ?? 0),
                    createdAt: existente?.createdAt || Date.now(),
                    updatedAt: Date.now()
                };

                await this._db().ref(getAbellaPath(`categories/${catSlug}/subcategories/${subSlug}`)).update(node);
                
                delete this._cache[catSlug];
                this._triggerReactivity();
                return true;
            } catch (error) {
                console.error('[PMA V8] [SubcategoriaService:save]', error);
                throw error;
            }
        },

        async toggleStatus(catSlug, subSlug) {
            try {
                const sub = await this.getBySlug(catSlug, subSlug);
                if (!sub) throw new Error('Subcategoria não encontrada.');

                await this._db().ref(getAbellaPath(`categories/${catSlug}/subcategories/${subSlug}`)).update({
                    paused: !sub.paused,
                    updatedAt: Date.now()
                });

                delete this._cache[catSlug];
                this._triggerReactivity();
                return true;
            } catch (error) {
                console.error('[PMA V8] [SubcategoriaService:toggleStatus]', error);
                return false;
            }
        },

        async delete(catSlug, subSlug) {
            try {
                await this._db().ref(getAbellaPath(`categories/${catSlug}/subcategories/${subSlug}`)).remove();
                delete this._cache[catSlug];
                this._triggerReactivity();
                return true;
            } catch (error) {
                console.error('[PMA V8] [SubcategoriaService:delete]', error);
                return false;
            }
        },

        subscribe(catSlug, callback) {
            const ref = this._db().ref(getAbellaPath(`categories/${catSlug}/subcategories`));
            ref.on('value', snapshot => {
                const data = snapshot.val() || {};
                const res = {};
                Object.entries(data).forEach(([s, r]) => res[s] = this.normalizarSubcategoria(s, r));
                this._cache[catSlug] = res;
                if (typeof callback === 'function') callback(res);
            });
            return ref;
        },

        unsubscribe: (ref) => ref?.off?.()
    };

    // VINCULAÇÃO DE LEGADO E PROTEÇÃO GLOBAL
    SubcategoriaService.listarTodas = SubcategoriaService.getList;
    SubcategoriaService.buscarPorSlug = SubcategoriaService.getBySlug;
    SubcategoriaService.salvarSubcategoria = SubcategoriaService.save;
    SubcategoriaService.excluirSubcategoria = SubcategoriaService.delete;
    SubcategoriaService.existe = (c, s) => SubcategoriaService.getBySlug(c, s).then(r => r !== null);
    SubcategoriaService.inscrever = SubcategoriaService.subscribe;
    SubcategoriaService.removerInscricao = SubcategoriaService.unsubscribe;

    Object.defineProperty(window, 'subcategoriaService', {
        value: Object.freeze(SubcategoriaService),
        writable: false,
        configurable: false
    });
    window.SubcategoriaService = window.subcategoriaService;

    console.info('[PMA V8] [SubcategoriaService] Camada de persistência homologada.');
})();
