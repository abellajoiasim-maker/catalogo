// FILE: /js/components/header.js

/**
 * Componente de cabeçalho global e persistente do catálogo.
 * Renderiza a identidade visual da marca e o contador dinâmico de itens no carrinho.
 * @param {number} totalItens - Quantidade acumulada de itens no carrinho de compras.
 * @returns {string} String HTML estruturada com Tailwind CSS pronto para renderização.
 */
export function Header(totalItens = 0) {
    return `
        <header class="bg-black text-white sticky top-0 z-50 border-b border-gray-900 shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="index.html" class="flex items-center space-x-2 focus:outline-none">
                    <span class="text-xl font-extrabold tracking-widest text-[#caa85c]">ABELLA JOIAS</span>
                    <span class="text-[9px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded tracking-wider uppercase font-medium">Atacado</span>
                </a>

                <nav class="flex items-center space-x-6">
                    <a href="produtos.html" class="text-sm font-medium hover:text-[#caa85c] transition-colors duration-200">Produtos</a>
                    <a href="galvanicas.html" class="text-sm font-medium hover:text-[#caa85c] transition-colors duration-200 text-gray-300">Galvânicas</a>
                    
                    <a href="carrinho.html" class="relative p-2 text-white hover:text-[#caa85c] transition-colors duration-200 focus:outline-none" aria-label="Carrinho de compras">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        ${totalItens > 0 ? `
                            <span class="absolute -top-1 -right-1 bg-[#caa85c] text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow">
                                ${totalItens}
                            </span>
                        ` : ''}
                    </a>
                </nav>
            </div>
        </header>
    `;
}