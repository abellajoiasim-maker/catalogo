const ComponenteProgresso = {
    mostrar(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="flex items-center justify-center space-x-2 p-4">
                <div class="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>
                <div class="w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-75"></div>
                <div class="w-4 h-4 bg-amber-500 rounded-full animate-pulse delay-150"></div>
                <span class="text-sm text-gray-500 font-medium pl-2">Carregando dados...</span>
            </div>
        `;
    },
    esconder(containerId) {
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '';
    }
};
