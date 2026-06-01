// js/services/produtoService.js

const ProdutoService = {
    _cache: {},

    normalizarProduto: function(id, rawData) {
        if (!rawData) return null;
        return {
            id: id,
            sku: rawData.sku || '',
            name: rawData.name || rawData.nome || '',
            category: rawData.category || rawData.categoria || '',
            subcategory: rawData.subcategory || rawData.subcategoria || '',
            image: rawData.image || rawData.imagem || '',
            price: parseFloat(rawData.price || rawData.precoFinal || 0),
            weight: parseFloat(rawData.weight || rawData.peso || 0),
            active: rawData.active !== false && rawData.paused !== true,
            variacaoTipo: rawData.variacaoTipo || 'Padrão',
            opcoesPersonalizadas: rawData.opcoesPersonalizadas || ''
        };
    },

    getAll: async function(forceRefresh = false) {
        if (!forceRefresh && Object.keys(this._cache).length > 0) {
            return Object.values(this._cache);
        }
        
        const snapshot = await window.db.ref('abella/products').once('value');
        const data = snapshot.val() || {};
        this._cache = {};
        
        Object.entries(data).forEach(([key, value]) => {
            this._cache[key] = this.normalizarProduto(key, value);
        });
        
        return Object.values(this._cache);
    },

    getPaginated: async function(page = 1, limit = 15, filters = {}) {
        let list = await this.getAll();
        
        if (filters.text) {
            const t = filters.text.toUpperCase();
            list = list.filter(p => p.sku.toUpperCase().includes(t) || p.name.toUpperCase().includes(t));
        }
        if (filters.category) {
            list = list.filter(p => p.category === filters.category);
        }
        if (filters.subcategory) {
            list = list.filter(p => p.subcategory === filters.subcategory);
        }
        if (filters.onlyActive) {
            list = list.filter(p => p.active);
        }

        const totalItems = list.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const paginatedItems = list.slice(startIndex, startIndex + limit);

        return {
            items: paginatedItems,
            totalItems,
            totalPages,
            currentPage: page
        };
    },

    save: async function(id, itemData) {
        const normalized = {
            sku: itemData.sku || '',
            name: itemData.name || itemData.nome || '',
            category: itemData.category || itemData.categoria || '',
            subcategory: itemData.subcategory || itemData.subcategoria || '',
            image: itemData.image || itemData.imagem || '',
            price: parseFloat(itemData.price || itemData.precoFinal || 0),
            weight: parseFloat(itemData.weight || itemData.peso || 0),
            paused: itemData.active === false || itemData.paused === true,
            variacaoTipo: itemData.variacaoTipo || 'Padrão',
            opcoesPersonalizadas: itemData.opcoesPersonalizadas || ''
        };

        if (id) {
            await window.db.ref(`abella/products/${id}`).set(normalized);
            this._cache[id] = { id, ...normalized, active: !normalized.paused };
            return id;
        } else {
            const newRef = window.db.ref('abella/products').push();
            await newRef.set(normalized);
            this._cache[newRef.key] = { id: newRef.key, ...normalized, active: !normalized.paused };
            return newRef.key;
        }
    },

    delete: async function(id) {
        await window.db.ref(`abella/products/${id}`).remove();
        delete this._cache[id];
    }
};

window.ProdutoService = ProdutoService;
