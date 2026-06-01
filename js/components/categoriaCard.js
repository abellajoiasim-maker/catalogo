// js/components/categoriaCard.js

const CategoriaCard = {
    createHTML: function(slug, data, isSubcategory = false, parentSlug = '') {
        const name = data.name || data.nome || slug;
        const rawImg = data.image || data.imagem || '';
        const img = window.StorageUtils.converterUrlStorage(rawImg);
        
        const urlDestino = isSubcategory 
            ? `produtos.html?id=${parentSlug}&sub=${slug}` 
            : `subcategorias.html?id=${slug}`;

        return `
            <div class="card cursor-pointer flex flex-col justify-between" onclick="window.location.href='${urlDestino}'">
                <div class="aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center">
                    <img src="${img}" class="w-full h-full object-cover hover:scale-105 transition-all duration-300" 
                         onerror="this.src='https://via.placeholder.com/400/141414/818cf8?text=Sem+Imagem'">
                </div>
                <div class="p-4 bg-zinc-900/20 border-t border-zinc-900/60 flex items-center justify-between">
                    <span class="text-xs font-bold uppercase text-white truncate tracking-wide">${name}</span>
                    <span class="gold text-xs">➔</span>
                </div>
            </div>
        `;
    }
};

window.CategoriaCard = CategoriaCard;
