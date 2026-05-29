const ComponenteProdutoCard = {
    render(produto, precoComDesconto = null) {
        const temDesconto = precoComDesconto && precoComDesconto < produto.preco;
        
        return `
            <div class="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition flex flex-col justify-between p-3">
                <img src="${produto.imagem || 'images/default-product.jpg'}" alt="${produto.nome}" class="w-full h-40 object-contain mb-2">
                <div>
                    <span class="text-xs text-gray-400 uppercase tracking-wider block mb-1">${produto.categoria || 'Bruto'}</span>
                    <h2 class="font-medium text-gray-800 text-sm line-clamp-2 h-10 mb-2">${produto.nome}</h2>
                </div>
                <div class="mt-2">
                    ${temDesconto ? `
                        <p class="text-xs text-gray-400 line-through">${MoneyUtils.formatar(produto.preco)}</p>
                        <p class="text-base font-bold text-green-600">${MoneyUtils.formatar(precoComDesconto)}</p>
                    ` : `
                        <p class="text-base font-bold text-gray-900">${MoneyUtils.formatar(produto.preco)}</p>
                    `}
                    <button onclick="CarrinhoService.adicionar(${JSON.stringify(produto).replace(/"/g, '&quot;')})" 
                            class="w-full mt-3 bg-amber-500 text-white py-1.5 rounded text-xs font-semibold hover:bg-amber-600 transition">
                        Adicionar
                    </button>
                </div>
            </div>
        `;
    }
};
