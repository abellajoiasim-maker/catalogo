// components/produtoCard.js
export const ProdutoCard = {
    render(produto) {
        if (!produto || !produto.id) return '';
        
        // Regra Absoluta Nº 3: Uso exclusivo do ImageHelper
        const imagemPrincipal = ImageHelper.getPrimary(produto);
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco);
        
        const precoFinal = DescontoService.calcularPrecoFinal(produto);
        const temPromo = produto.precoPromocional && produto.precoPromocional < produto.preco;
        const precoFinalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoFinal);

        return `
            <div class="produto-card bg-card p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between h-full" data-id="${produto.id}">
                <div class="relative overflow-hidden rounded-xl bg-zinc-900 aspect-square mb-3">
                    <img src="${imagemPrincipal}" alt="${produto.nome}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='../images/placeholder.jpg'">
                    ${temPromo ? `<span class="absolute top-2 right-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Oferta</span>` : ''}
                    ${produto.destaque ? `<span class="absolute top-2 left-2 bg-[#caa85c] text-black font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Destaque</span>` : ''}
                </div>
                <div class="flex-1 min-w-0 mb-3">
                    <div class="text-[10px] uppercase text-zinc-500 tracking-wider font-bold mb-1">${produto.categoria}</div>
                    <h3 class="text-sm font-semibold text-white tracking-wide truncate">${produto.nome}</h3>
                    <p class="text-xs text-zinc-400 font-mono mt-0.5">SKU: ${produto.codigo || ''}</p>
                </div>
                <div>
                    <div class="mb-3">
                        ${temPromo ? `<span class="text-xs text-zinc-500 line-through mr-1.5">${precoFormatado}</span>` : ''}
                        <span class="text-base font-black text-[#caa85c]">${precoFinalFormatado}</span>
                    </div>
                    <!-- Regra Absoluta Nº 2: Passa o objeto completo buscando de um mapa ou estado global -->
                    <button onclick="window.abrirModalProduto('${produto.id}')" class="w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#caa85c]/40 text-white text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-widest">
                        Visualizar Detalhes
                    </button>
                </div>
            </div>
        `;
    }
};
