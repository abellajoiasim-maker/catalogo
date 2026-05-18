import { updateCartHeaderSummary } from './components/cart.js';

// Mapeamento dinâmico de inicializadores baseado na URL da página
const routes = {
    'index.html': () => import('./pages/home.js').then(m => m.initHome()),
    'produtos.html': () => import('./pages/produtos.js').then(m => m.initProdutos()),
    'carrinho.html': () => import('./pages/carrinho.js').then(m => m.initCheckout()),
    'galvanicas.html': () => import('./pages/galvanicas.js').then(m => m.initGalvanicas())
};

async function router() {
    // Fallback inteligente para raiz do site mapear para a home
    let path = window.location.pathname.split('/').pop() || 'index.html';
    
    // Inicializa a renderização de cabeçalhos e resumo global de pedidos
    updateCartHeaderSummary();

    const initPageRule = routes[path];
    if (initPageRule) {
        try {
            await initPageRule();
        } catch (error) {
            console.error(`Falha crítica ao orquestrar a página [${path}]:`, error);
        }
    }
}

// Inicializa o roteador seguro ao carregar a DOM
document.addEventListener('DOMContentLoaded', router);
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error("SW erro:", err));
}