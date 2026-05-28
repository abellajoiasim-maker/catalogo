const ComponenteCategoriaCard = {
    render(categoria) {
        return `
            <div class="border rounded-lg p-4 text-center cursor-pointer hover:shadow-lg transition bg-white" onclick="filtrarPorCategoria('${categoria.id}')">
                <img src="${categoria.imagem || 'images/default-cat.jpg'}" alt="${categoria.nome}" class="w-16 h-16 mx-auto object-contain mb-2">
                <h3 class="font-semibold text-gray-700 text-sm">${categoria.nome}</h3>
            </div>
        `;
    }
};
