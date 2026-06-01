// js/services/subcategoriaService.js

const SubcategoriaService = {
    getByCategory: async function(catSlug) {
        const categories = await window.CategoriaService.getAll();
        if (categories[catSlug] && categories[catSlug].subcategories) {
            return categories[catSlug].subcategories;
        }
        return {};
    },

    save: async function(catSlug, subSlug, subcatData) {
        const node = {
            name: subcatData.name || '',
            image: subcatData.image || '',
            paused: subcatData.paused === true || subcatData.paused === "true"
        };
        await window.db.ref(`abella/categories/${catSlug}/subcategories/${subSlug}`).set(node);
        await window.CategoriaService.getAll(true); // Invalida o cache
    },

    delete: async function(catSlug, subSlug) {
        await window.db.ref(`abella/categories/${catSlug}/subcategories/${subSlug}`).remove();
        await window.CategoriaService.getAll(true); // Invalida o cache
    }
};

window.SubcategoriaService = SubcategoriaService;
