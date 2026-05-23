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
        // Se o módulo interno de pedidos estiver ativo e renderizado na DOM, força a atualização visual
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });
}

// =========================================================================
// SISTEMA DE NAVEGAÇÃO INTERCEPTADOR E BLINDADO
// =========================================================================
(function() {
    const funcaoMudarAbaOriginal = window.mudarAbaDinamica;

    window.mudarAbaDinamica = function(aba) {
        const container = document.getElementById('conteudo-dinamico');
        if (!container) return;
        
        // 1. Alternador de Classes Estilizadas no Menu Lateral
        document.querySelectorAll('#menu-navegacao button').forEach(btn => {
            btn.classList.remove('bg-[#caa85c]', 'text-black');
            btn.classList.add('bg-zinc-900', 'text-gray-400');
        });
        
        const btnAtivo = document.getElementById(`btn-${aba}`);
        if(btnAtivo) {
            btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
            btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
        }

        // 2. Roteamento Avançado de Módulos
        if (aba === 'editor') {
            container.classList.remove('p-8'); // Remove preenchimento para tela cheia de edição
            carregarTemplateEditorIA(container);
        } else {
            if(!container.classList.contains('p-8')) container.classList.add('p-8');

            // Devolve o controle para o comportamento nativo de abas
            if (typeof funcaoMudarAbaOriginal === "function" && funcaoMudarAbaOriginal !== window.mudarAbaDinamica) {
                funcaoMudarAbaOriginal(aba);
            } else {
                executarMapeamentoFallback(aba, container);
            }
        }
    };
})();

// =========================================================================
// MAPEAMENTO DE CONTINGÊNCIA (FALLBACK DE ABAS DO FIREBASE)
// =========================================================================
function ejecutarMapeamentoFallback(aba, container) {
    switch(aba) {
        case 'pedidos':
            if (typeof window.carregarPedidos === "function") window.carregarPedidos();
            else if (typeof window.listarPedidos === "function") window.listarPedidos();
            else {
                container.innerHTML = `<div class="space-y-4">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">📦 Pedidos Recebidos</h2>
                    <div id="tabela-pedidos-container" class="text-zinc-500 italic text-xs">Sincronizando com árvore de dados real...</div>
                </div>`;
                if (typeof window.inicializarPainelPedidos === "function") window.inicializarPainelPedidos();
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

        case 'categorias':
            if (typeof window.carregarCategorias === "function") window.carregarCategorias();
            break;

        case 'config':
            if (typeof window.carregarConfiguracoes === "function") window.carregarConfiguracoes();
            break;

        default:
            container.innerHTML = `<div class="flex items-center justify-center h-48 text-zinc-500 italic text-xs">Módulo [${aba.toUpperCase()}] inicializando...</div>`;
    }
}

// =========================================================================
// INJETOR DO TEMPLATE NATIVO DO EDITOR MASTER IA (URL ABSOLUTA CONTRA 404)
// =========================================================================
function carregarTemplateEditorIA(targetContainer) {
    fetch('https://abellajoiasim-maker.github.io/catalogo/modulo/image-editor.html')
        .then(response => {
            if(!response.ok) throw new Error("Módulo image-editor.html não localizado no servidor GitHub.");
            return response.text();
        })
        .then(html => {
            targetContainer.innerHTML = html;
            if(typeof window.inicializarMapeamentoLote === "function") {
                window.inicializarMapeamentoLote();
            }
        })
        .catch(err => {
            console.error(err);
            targetContainer.innerHTML = `<div class="p-6 bg-red-950/20 border border-red-900 text-red-400 rounded-xl text-xs font-mono">
                ❌ Falha crítica ao carregar interface do Editor: ${err.message}<br>Verifique se o arquivo está commitado em: <b>catalogo/modulo/image-editor.html</b>
            </div>`;
        });
}

// GATILHO DE FLUXO INICIAL
document.addEventListener("DOMContentLoaded", function() {
    if (typeof window.mudarAbaDinamica === "function") {
        window.mudarAbaDinamica('pedidos');
    }
});
