// IMPORTAÇÃO CONECTIVA DO FIREBASE CENTRAL
import { db as firebaseDB } from '../images/js/firebase/firebase.js';

// CACHES GLOBAIS DE OPERAÇÃO DO EDITOR IA
window._PRODUTOS_LOTE_CACHE = {};
window._FILA_PROCESSAMENTO = [];
window._INDICE_ATUAL_FILA = 0;
window.todosPedidosLocal = {};

// GLOBALIZAÇÃO CRÍTICA PARA OS SUBMÓDULOS HTML ENXERGAREM O BANCO
window.db = firebaseDB; 

// Sincronização em Tempo Real com a árvore de pedidos ("orders") no Firebase
if (window.db) {
    console.log("🔥 [Firebase] Conexão estabelecida com sucesso no escopo global.");
    
    // Força uma leitura imediata para garantir que os dados existem antes do "on" ativo
    window.db.ref('orders').once('value').then(snapshot => {
        window.todosPedidosLocal = snapshot.val() || {};
        console.log("📦 [Firebase] Pedidos iniciais carregados:", Object.keys(window.todosPedidosLocal).length);
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });

    window.db.ref('orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
        if (document.getElementById('tabela-pedidos-container') || document.getElementById('listaPedidos')) {
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

    // Ajusta o nome do arquivo se necessário
    const pathAba = (aba === 'categories') ? 'categorias' : aba;
    
    // Rota 1: Tentativa subindo um nível (caso esteja dentro da pasta admin/)
    let urlTentativa1 = `../modulo/${pathAba}.html`;
    // Rota 2: Tentativa partindo da raiz (fallback caso esteja na index principal)
    let urlTentativa2 = `modulo/${pathAba}.html`;

    if (aba === 'editor') {
        container.classList.remove('p-8');
    } else {
        if(!container.classList.contains('p-8')) container.classList.add('p-8');
    }

    fetch(urlTentativa1)
        .then(res => {
            if(!res.ok) return fetch(urlTentativa2); // Se a primeira rota falhar, tenta a segunda
            return res;
        })
        .then(res => {
            if(!res.ok) throw new Error(`Não foi possível localizar o arquivo HTML do módulo em nenhuma das rotas.`);
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
            
        case 'editor':
            if (typeof window.inicializarMapeamentoLote === "function") window.inicializarMapeamentoLote();
            break;
    }
}

// GATILHO DE FLUXO INICIAL ASSÍNCRONO CONECTADO AO READYSTATE
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => window.mudarAbaDinamica('pedidos'), 200);
    });
} else {
    setTimeout(() => window.mudarAbaDinamica('pedidos'), 200);
}
