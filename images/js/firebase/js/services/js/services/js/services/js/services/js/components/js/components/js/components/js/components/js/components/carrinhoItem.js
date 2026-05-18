// FILE: /js/components/carrinhoItem.js

import { formatarMoeda } from '../utils/money.js';

/**
 * Componente que renderiza a linha do item inserido na listagem do carrinho.
 * Controla inputs numéricos com data-attributes estruturados de alteração de estado.
 * @param {Object} item - Item contendo id, nome, preco, imagem, codigo e quantidade.
 * @returns {string} String HTML estruturada.
 */
export function CarrinhoItem(item) {
    if (!item) return '';

    const id = item.id;
    const nome = item.nome || 'Produto';
    const codigo = item.codigo || 'N/A';
    const preco = Number(item.preco) || 0;
    const quantidade = parseInt(item.quantidade, 10) || 1;
    const totalItem = preco * quantidade;
    const imagem = item.imagem || 'assets/images/placeholder.jpg';

    return `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-950 border border-gray-900 rounded-xl gap-4 shadow" data-cart-item="${id}">
            <div class="flex items-center space-x-4 w-full sm:w-auto">
                <img src="${imagem}" alt="${nome}" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg bg-gray-900 border border-gray-800 shrink-0">
                <div class="min-w-0 flex-1">
                    <span class="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">COD: ${codigo}</span>
                    <h4 class="text-sm font-semibold text-white truncate pr-2">${nome}</h4>
                    <span class="block text-xs font-mono text-[#caa85c] mt-1">${formatarMoeda(preco)} <span class="text-[9px] text-gray-500 font-sans uppercase">pç</span></span>
                </div>
            </div>

            <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 border-t border-gray-900 pt-3 sm:pt-0 sm:border-0">
                <div class="flex items-center bg-black border border-gray-800 rounded-lg p-0.5">
                    <button 
                        data-action="decrementar-qtd" 
                        data-id="${id}" 
                        class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white font-bold transition focus:outline-none"
                    >
                        -
                    </button>
                    <span class="w-10 text-center text-sm font-mono font-semibold text-white selection:bg-transparent">
                        ${quantidade}
                    </span>
                    <button 
                        data-action="incrementar-qtd" 
                        data-id="${id}" 
                        class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white font-bold transition focus:outline-none"
                    >
                        +
                    </button>
                </div>

                <div class="flex items-center space-x-4">
                    <span class="text-sm font-bold font-mono text-white min-w-[80px] text-right">
                        ${formatarMoeda(totalItem)}
                    </span>
                    <button 
                        data-action="remover-carrinho" 
                        data-id="${id}" 
                        class="text-gray-500 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/5 transition focus:outline-none" 
                        aria-label="Excluir item"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v6m-4-6h4m-6 0h8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}