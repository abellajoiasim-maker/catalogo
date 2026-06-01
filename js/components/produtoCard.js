// js/components/produtoCard.js

const ProdutoCard = {
    createHTML: function(produto) {
        const img = window.StorageUtils.converterUrlStorage(produto.image);
        const precoFormatado = window.MoneyUtils.format(produto.price);
        
        return `
            <div class="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden p-3 flex flex-col justify-between space-y-3 hover:border-[#caa85c]/40 transition-all group relative">
                <div class="aspect-square w-full bg-zinc-900/40 rounded-xl overflow-hidden relative flex items-center justify-center">
                    <img src="${img}" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                         onerror="this.src='https://via.placeholder.com/300?text=Joia'">
                </div>
                <div class="space-y-1 text-left flex-1 flex flex-col justify-between">
                    <div>
                        <span class="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">
                            SKU: ${produto.sku || 'N/A'}
                        </span>
                        <h3 class="text-white font-bold text-xs leading-tight tracking-wide uppercase mt-1.5 line-clamp-2 min-h-[32px]">
                            ${produto.name}
                        </h3>
                    </div>
                    <div class="pt-2 border-t border-zinc-900 flex justify-between items-end mt-2">
                        <div class="font-mono">
                            <span class="block text-[8px] text-zinc-500 uppercase">Bruto Sem Banho</span>
                            <span class="gold text-sm font-black">${precoFormatado}</span>
                            <span class="block text-[9px] text-zinc-400 mt-0.5">⚖️ ${produto.weight.toFixed(2)}g</span>
                        </div>
                        <button onclick="window.abrirModalCompra('${produto.id}')" 
                                class="bg-[#caa85c] hover:bg-[#bda152] text-black font-black p-2.5 rounded-xl transition-all shadow-md">
                            🛒 +
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

window.ProdutoCard = ProdutoCard;
