// FILE: /js/components/produtoCard.js

import { formatarMoeda } from '../utils/money.js';

/**
 * Componente que renderiza o Card individual de cada Produto (Bruto/Semijoia).
 * Contém o botão de ação rápida conectado de forma segura com tratamento de eventos modulares.
 * @param {Object} produto - Objeto contendo os dados do produto.
 * @returns {string} String HTML estruturada.
 */
export function ProdutoCard(produto) {
    if (!produto) return '';

    const id = produto.id;
    const nome = produto.nome || 'Sem descrição';
    const codigo = produto.codigo || 'N/A';
    const preco = Number(produto.preco) || 0;
    const imagem = produto.imagem || 'assets/images/placeholder.jpg';

    return `
        <div class="bg-gray-950 border border-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group">
            <div class="relative aspect-square w-full bg-gray-900 overflow-hidden">
                <img src="${imagem}" alt="${nome}" class="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500" loading="lazy">
                <span class="absolute top-2 left-2 bg-black/80 backdrop-blur-xs text-[10px] text-gray-300 font-mono px-2 py-0.5 rounded tracking-wider border border-gray-800">
                    COD: ${codigo}
                </span>
            </div>

            <div class="p-4 flex-1 flex flex-col justify-between">
                <div class="mb-4">
                    <h3 class="text-sm font-medium text-gray-200 line-clamp-2 min-h-[40px] tracking-wide">
                        ${nome}
                    </h3>
                    <div class="mt-2 flex items-baseline space-x-2">
                        <span class="text-base font-bold text-[#caa85c] font-mono">
                            ${formatarMoeda(preco)}
                        </span>
                        <span class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">No Bruto</span>
                    </div>
                </div>

                <button 
                    data-action="adicionar-carrinho" 
                    data-id="${id}"
                    class="w-full bg-[#caa85c] text-black text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-[#bfa054] active:bg-[#a68a45] transition-colors duration-200 flex items-center justify-center space-x-1.5 shadow focus:outline-none focus:ring-2 focus:ring-[#caa85c] focus:ring-offset-2 focus:ring-offset-black"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>ADICIONAR</span>
                </button>
            </div>
        </div>
    `;
}