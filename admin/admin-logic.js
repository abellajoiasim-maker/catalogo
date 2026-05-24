// IMPORTAÇÃO CONECTIVA DO FIREBASE CENTRAL
import { db as firebaseDB } from '../images/js/firebase/firebase.js';

// CACHES GLOBAIS DE OPERAÇÃO OPERACIONAL
window.todosPedidosLocal = {};

// GLOBALIZAÇÃO CRÍTICA DIRECIONADA PARA O NÓ 'ABELLA'
window.db = firebaseDB; 

// Sincronização em Tempo Real com a árvore de pedidos mapeada em abella/orders
if (window.db) {
    console.log("🔥 [Firebase] Conexão estabelecida com sucesso na raiz '/abella'.");
    
    // Leitura instantânea de segurança para carga inicial sob o novo nó estrutural
    window.db.ref('abella/orders').once('value').then(snapshot => {
        window.todosPedidosLocal = snapshot.val() || {};
        console.log("📦 [Abella] Pedidos iniciais carregados da subpasta:", Object.keys(window.todosPedidosLocal).length);
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });

    // Escuta ativa em tempo real para novos pedidos ou alterações de status
    window.db.ref('abella/orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
        if (document.getElementById('listaPedidos')) {
            if (typeof window.renderizarTabelaPedidosVisivel === 'function') window.renderizarTabelaPedidosVisivel();
            if (typeof window.carregarPedidos === "function") window.carregarPedidos();
        }
    });
} else {
    console.error("❌ [Firebase] A importação de '../images/js/firebase/firebase.js' retornou indefinida.");
}

// =========================================================================
// SISTEMA DE NAVEGAÇÃO INTELIGENTE COM ROTA DE CONTINGÊNCIA (FALLBACK 404)
// =========================================================================
window.mudarAbaDinamica = function(aba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;
    
    // 1. Alternador de Classes Estilizadas no Menu Lateral
    document.querySelectorAll('#menu-navegacao button').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const idBotao = (aba === 'categories' || aba === 'categorias') ? 'btn-categories' : `btn-${aba}`;
    const btnAtivo = document.getElementById(idBotao);
    if(btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-600 italic text-xs font-mono animate-pulse">Carregando módulo [${aba.toUpperCase()}]...</div>`;

    // Mapeamento preciso do arquivo físico na pasta modulo/
    const pathAba = (aba === 'categories') ? 'categorias' : aba;
    
    // Rotas Dinâmicas para Prevenir Erros de Localização de Diretório
    let urlTentativa1 = `../modulo/${pathAba}.html`;
    let urlTentativa2 = `modulo/${pathAba}.html`;

    fetch(urlTentativa1)
        .then(res => {
            if(!res.ok) return fetch(urlTentativa2);
            return res;
        })
        .then(res => {
            if(!res.ok) throw new Error(`Não foi possível localizar o arquivo HTML do módulo.`);
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
            setTimeout(() => {
                executarMapeamentoFallback(aba);
            }, 80);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<div class="p-4 bg-red-950/30 border border-red-900 text-red-400 text-xs font-mono rounded-xl">
                ❌ Erro ao renderizar interface: ${err.message}<br>Certifique-se de que o arquivo existe em <b>modulo/${pathAba}.html</b>
            </div>`;
        });
};

// =========================================================================
// MAPEAMENTO DE INICIALIZAÇÃO ESPECÍFICA DE CADA SUBMÓDULO
// =========================================================================
function executarMapeamentoFallback(aba) {
    switch(aba) {
        case 'pedidos':
            if (typeof window.carregarPedidos === "function") window.carregarPedidos();
            else if (typeof window.renderizarTabelaPedidosVisivel === 'function') window.renderizarTabelaPedidosVisivel();
            else if (typeof window.inicializarPainelPedidos === "function") window.inicializarPainelPedidos();
            break;

        case 'produtos':
            if (typeof window.carregarProdutos === "function") window.carregarProdutos();
            else if (typeof window.listarProdutos === "function") window.listarProdutos();
            break;

        case 'ofertas':
            if (typeof window.carregarOfertas === "function") window.carregarOfertas();
            break;

        case 'galvanicas':
            if (typeof window.carregarGalvanicas === "function") window.carregarGalvanicas();
            break;

        case 'categories':
        case 'categorias':
            if (typeof window.carregarCategorias === "function") window.carregarCategorias();
            break;

        case 'config':
            if (typeof window.carregarConfiguracoes === "function") window.carregarConfiguracoes();
            break;
    }
}

// GATILHO DE INICIALIZAÇÃO (PADRÃO: ABA PEDIDOS RECEBIDOS)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => window.mudarAbaDinamica('pedidos'), 200);
    });
} else {
    setTimeout(() => window.mudarAbaDinamica('pedidos'), 200);
}
