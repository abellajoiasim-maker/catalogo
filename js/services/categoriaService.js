// js/services/categoriaService.js

const CategoriaService = {
    _cache: null,

    getAll: async function(forceRefresh = false) {
        if (!forceRefresh && this._cache) {
            return this._cache;
        }
        const snapshot = await window.db.ref('abella/categories').once('value');
        this._cache = snapshot.val() || {};
        return this._cache;
    },

    save: async function(slug, categoryData) {
        const node = {
            name: categoryData.name || '',
            image: categoryData.image || '',
            order: parseInt(categoryData.order) || 0,
            subcategories: categoryData.subcategories || {}
        };
        await window.db.ref(`abella/categories/${slug}`).update(node);
        if (this._cache) this._cache[slug] = { ...this._cache[slug], ...node };
    },

    delete: async function(slug) {
        await window.db.ref(`abella/categories/${slug}`).remove();
        if (this._cache) delete this._cache[slug];
    }
};

window.CategoriaService = CategoriaService;
