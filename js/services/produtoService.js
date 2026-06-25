// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v5.1 (Auditado e Corrigido)
// ======================================================================

(function () {
    'use strict';

    const PRODUCTS_PATH = getAbellaPath('products');

    const produtoService = {

        // ======================================================
        // CACHE
        // ======================================================
        _cache: null,
        _cacheTimestamp: 0,
        _cacheTTL: 60000,

        // ======================================================
        // DATABASE
        // ======================================================
        _db() {
            if (!window.db) {
                throw new Error('Firebase Database não inicializado.');
            }
            return window.db;
        },

        // ======================================================
        // REF
        // ======================================================
        _ref() {
            return this._db().ref(PRODUCTS_PATH);
        },

        // ======================================================
        // CACHE VALIDATION
        // ======================================================
        _isCacheValid() {
            return Boolean(
                this._cache &&
                (Date.now() - this._cacheTimestamp) < this._cacheTTL
            );
        },

        invalidateCache() {
            this._cache = null;
            this._cacheTimestamp = 0;
        },

        // ======================================================
        // HELPERS
        // ======================================================
        _safeString(valor = '') {
            return String(valor || '').trim();
        },

        _safeNumber(valor = 0) {
            const n = parseFloat(valor);
            return Number.isFinite(n) ? n : 0;
        },

        _safeArray(valor) {
            if (Array.isArray(valor)) {
                return valor.map(v => String(v).trim()).filter(Boolean);
            }
            if (typeof valor === 'string') {
                return valor.split(',').map(v => v.trim()).filter(Boolean);
            }
            return [];
        },

        _slug(texto = '') {
            return this._safeString(texto)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        // ======================================================
        // NORMALIZADOR UNIFICADO
        // ======================================================
        normalizarProduto(id, produto = {}) {
            if (!id || !produto) return null;

            const nome = this._safeString(produto.name || produto.nome || 'Produto Sem Nome');
            
            // Garante compatibilidade tanto com chaves em inglês quanto em português
            const categoriaOriginal = produto.categoria || produto.category || '';
            const subcategoriaOriginal = produto.subcategoria || produto.subcategory || produto.subCategory || '';

            return {
                id: this._safeString(id || produto.id),
                sku: this._safeString(produto.sku || id),
                nome: nome,
                descricao: this._safeString(produto.description || produto.descricao),
                imagem: this._safeString(produto.imagem || produto.image || produto.img),
                
                // Propriedades nativas e slugs para filtros eficientes
                categoria: this._safeString(categoriaOriginal),
                categorySlug: this._slug(categoriaOriginal),
                
                subcategoria: this._safeString(subcategoriaOriginal),
                subcategorySlug: this._slug(subcategoriaOriginal),
                
                preco: this._safeNumber(produto.precoFinal ?? produto.price ?? produto.preco ?? produto.valor ?? 0),
                precoAntigo: this._safeNumber(produto.oldPrice ?? produto.precoAntigo ?? produto.precoOriginal ?? 0),
                peso: this._safeNumber(produto.peso ?? produto.weight ?? 0),
                variacoes: this._safeArray(produto.variacoes || produto.variantes),
                ativo: produto.ativo !== false,
                createdAt: produto.createdAt || Date.now()
            };
        },

        // ======================================================
        // LISTAR TODOS
        // ======================================================
        async listarTodos() {
            try {
                if (this._isCacheValid()) {
                    return Object.values(this._cache);
                }

                const snapshot = await this._ref().once('value');
                const data = snapshot.val() || {};
                
                this._cache = {};
                Object.keys(data).forEach(id => {
                    const norm = this.normalizarProduto(id, data[id]);
                    if (norm) this._cache[id] = norm;
                });

                this._cacheTimestamp = Date.now();
                return Object.values(this._cache);

            } catch (error) {
                console.error('[produtoService:listarTodos]', error);
                return [];
            }
        },

        // ======================================================
        // BUSCAR POR ID
        // ======================================================
        async buscarPorId(produtoId) {
            try {
                const id = this._safeString(produtoId);
                if (!id) return null;

                if (this._cache && this._cache[id]) {
                    return this._cache[id];
                }

                const snapshot = await this._ref().child(id).once('value');
                const produtoRaw = snapshot.val();
                
                if (!produtoRaw) return null;

                return this.normalizarProduto(id, produtoRaw);
            } catch (error) {
                console.error('[produtoService:buscarPorId]', error);
                return null;
            }
        },

        // ======================================================
        // FILTROS (CORRIGIDOS PARA PEGAR AS CHAVES PADRONIZADAS)
        // ======================================================
        async listarPorCategoria(categoriaSlug) {
            try {
                const slugTarget = this._slug(categoriaSlug);
                if (!slugTarget) return [];

                const produtos = await this.listarTodos();
                return produtos.filter(p => p.categorySlug === slugTarget && p.ativo);
            } catch (error) {
                console.error('[produtoService:listarPorCategoria]', error);
                return [];
            }
        },

        async listarPorSubcategoria(categoriaSlug, subcategoriaSlug) {
            try {
                const catTarget = this._slug(categoriaSlug);
                const subTarget = this._slug(subcategoriaSlug);
                if (!catTarget || !subTarget) return [];

                const produtos = await this.listarTodos();
                return produtos.filter(p => 
                    p.categorySlug === catTarget && 
                    p.subcategorySlug === subTarget && 
                    p.ativo
                );
            } catch (error) {
                console.error('[produtoService:listarPorSubcategoria]', error);
                return [];
            }
        }
    };

    window.produtoService = produtoService;
})();
