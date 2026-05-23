// IMPORTAÇÃO CONECTIVA DO FIREBASE CENTRAL
import { db } from '../images/js/firebase/firebase.js';

// CACHES GLOBAIS DE OPERAÇÃO DO EDITOR IA
window._PRODUTOS_LOTE_CACHE = {};
window._FILA_PROCESSAMENTO = [];
window._INDICE_ATUAL_FILA = 0;
window.todosPedidosLocal = {};

// Sincronização em Tempo Real com a árvore de pedidos ("orders") no Firebase
if (db) {
    db.ref('orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
        // Só força a renderização visual se o elemento container real já existir na DOM
        if (document.getElementById('listaPedidos') && typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });
}

// =========================================================================
// SISTEMA DE NAVEGAÇÃO INTERCEPTADOR E INJETADO NO ESCOPO GLOBAL (WINDOW)
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

    // Limpa listeners antigos pendentes para evitar conflitos entre as abas
    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-600 italic text-xs font-mono animate-pulse">Carregando módulo [${aba.toUpperCase()}]...</div>`;

    // 2. Roteamento Avançado de Módulos (Garante caminhos absolutos corretos)
    if (aba === 'editor') {
        container.classList.remove('p-8'); 
        carregarTemplateEditorIA(container);
    } else {
        if(!container.classList.contains('p-8')) container.classList.add('p-8');
        
        // Determina a rota interna correta para os arquivos HTML parciais
        const pathAba = (aba === 'categories') ? 'categorias' : aba;
        
        fetch(`../modulo/${pathAba}.html`)
            .then(res => {
                if(!res.ok) throw new Error(`Não foi possível carregar o arquivo: modulo/${pathAba}.html`);
                return res.text();
            })
            .then(html => {
                container.innerHTML = html;
                // Executa o script de inicialização específico de cada aba com um delay seguro pós-renderização
                setTimeout(() => {
                    executarMapeamentoFallback(aba);
                }, 50);
            })
            .catch(err => {
                console.error(err);
                container.innerHTML = `<div class="p-4 bg-red-950/30 border border-red-900 text-red-400 text-xs font-mono rounded-xl">❌ Falha ao injetar módulo: ${err.message}</div>`;
            });
    }
};

// =========================================================================
// MAPEAMENTO DE CONTINGÊNCIA (EXECUÇÃO DE FUNÇÕES INTERNAS DE SCRIPT)
// =========================================================================
function ejecutarMapeamentoFallback(aba) {
    switch(aba) {
        case 'pedidos':
            if (typeof window.carregarPedidos === "function") {
                window.carregarPedidos();
            } else if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
                window.renderizarTabelaPedidosVisivel();
            }
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

// =========================================================================
// INJETOR DO TEMPLATE NATIVO DO EDITOR MASTER IA
// =========================================================================
function carregarTemplateEditorIA(targetContainer) {
    fetch('../modulo/image-editor.html')
        .then(response => {
            if(!response.ok) throw new Error("Módulo image-editor.html não localizado localmente.");
            return response.text();
        })
        .then(html => {
            targetContainer.innerHTML = html;
            // Executa os ganchos internos do editor de lote se existirem
            setTimeout(() => {
                if(typeof window.inicializarMapeamentoLote === "function") {
                    window.inicializarMapeamentoLote();
                } else if (typeof window.carregarCategoriasEditor === "function") {
                    window.carregarCategoriasEditor();
                }
            }, 50);
        })
        .catch(err => {
            console.error(err);
            targetContainer.innerHTML = `<div class="p-6 bg-red-950/20 border border-red-900 text-red-400 rounded-xl text-xs font-mono">
                ❌ Falha crítica ao carregar interface do Editor: ${err.message}
            </div>`;
        });
}

// GATILHO DE FLUXO INICIAL ASSÍNCRONO
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.mudarAbaDinamica('pedidos'));
} else {
    window.mudarAbaDinamica('pedidos');
}
