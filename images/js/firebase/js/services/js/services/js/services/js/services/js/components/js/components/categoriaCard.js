// FILE: /js/components/categoriaCard.js

import { formatarMoeda } from '../utils/money.js';

/**
 * Componente que renderiza o Card de Categoria na página inicial.
 * @param {Object} categoria - Objeto de dados da categoria vindo do Firebase.
 * @returns {string} String HTML estruturada.
 */
export function CategoriaCard(categoria) {
    if (!categoria) return '';
    
    const nome = categoria.nome || 'Categoria';
    const imagem = categoria.imagem || 'assets/images/placeholder.jpg';
    
    return `
        <a href="produtos.html?categoria=${encodeURIComponent(nome)}" class="group relative block rounded-xl overflow-hidden bg-gray-950 border border-gray-950 hover:border-gray-800 transition-all duration-300 shadow-lg">
            <div class="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-900 h-48 sm:h-64">
                <img src="${imagem}" alt="${nome}" class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 loading="lazy"">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h3 class="text-lg font-bold text-white tracking-wide uppercase group-hover:text-[#caa85c] transition-colors duration-200">
                    ${nome}
                </h3>
                <p class="text-xs text-gray-400 mt-1 flex items-center">
                    Ver coleção 
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </p>
            </div>
        </a>
    `;
}