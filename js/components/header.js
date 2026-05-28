const ComponenteHeader = {
    render(containerId, titulo = "Abella Joias") {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <header class="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center">
                <h1 class="text-xl font-bold tracking-wide">${titulo}</h1>
                <nav class="flex gap-4">
                    <a href="index.html" class="hover:text-amber-400 transition">Início</a>
                    <a href="produtos.html" class="hover:text-amber-400 transition">Produtos</a>
                    <a href="carrinho.html" class="hover:text-amber-400 transition">Carrinho</a>
                </nav>
            </header>
        `;
    }
};
