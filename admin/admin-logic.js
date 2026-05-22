// =========================================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE COLETIVO
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// CACHES GLOBAIS DE OPERAÇÃO DO EDITOR IA
var _PRODUTOS_LOTE_CACHE = {};
var _FILA_PROCESSAMENTO = [];
var _INDICE_ATUAL_FILA = 0;

// =========================================================================
// INTERCEPTADOR DE ABAS: COMPATIBILIDADE TOTAL COM SCRIPTS NATIVOS ANTERIORES
// =========================================================================
(function() {
    // Preserva a função antiga completa que já existia na memória (se houver)
    const funcaoMudarAbaOriginal = window.mudarAbaDinamica;

    window.mudarAbaDinamica = function(aba) {
        const container = document.getElementById('conteudo-dinamico');
        if (!container) return;
        
        // 1. Gerenciamento Visual Ativo/Inativo do Menu Lateral
        document.querySelectorAll('#menu-navegacao button').forEach(btn => {
            btn.classList.remove('bg-[#caa85c]', 'text-black');
            btn.classList.add('bg-zinc-900', 'text-gray-400');
        });
        
        const btnAtivo = document.getElementById(`btn-${aba}`);
        if(btnAtivo) {
            btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
            btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
        }

        // 2. Roteador de Módulos
        if (aba === 'editor') {
            container.classList.remove('p-8'); // Abre espaço total para o Editor IA
            carregarTemplateEditorIA(container);
        } else {
            if(!container.classList.contains('p-8')) container.classList.add('p-8');

            // Se o seu script antigo de Pedidos/Produtos possuía a função, executa-a integralmente
            if (typeof funcaoMudarAbaOriginal === "function" && funcaoMudarAbaOriginal !== window.mudarAbaDinamica) {
                funcaoMudarAbaOriginal(aba);
            } else {
                // Rota de contingência direta vinculada ao ecossistema do Firebase
                executarMapeamentoFallback(aba, container);
            }
        }
    };
})();

// =========================================================================
// ROUTER DE CONTINGÊNCIA (FALLBACK DOS MÓDULOS DO BANCO)
// =========================================================================
function ejecutarMapeamentoFallback(aba, container) {
    switch(aba) {
        case 'pedidos':
            if (typeof window.carregarPedidos === "function") window.carregarPedidos();
            else if (typeof window.listarPedidos === "function") window.listarPedidos();
            else {
                container.innerHTML = `<div class="space-y-4">
                    <h2 class="text-xl font-bold text-white flex items-center gap-2">📦 Pedidos Recebidos</h2>
                    <div id="tabela-pedidos-container" class="text-zinc-500 italic text-xs animate-pulse">Sincronizando com Firebase real...</div>
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
            // Dispara a leitura assíncrona das coleções do Firebase para alimentar o Lote
            if(typeof window.inicializarMapeamentoLote === "function") {
                window.inicializarMapeamentoLote();
            }
        })
        .catch(err => {
            console.error(err);
            targetContainer.innerHTML = `<div class="p-6 bg-red-950/20 border border-red-900 text-red-400 rounded-xl text-xs font-mono">
                ❌ Falha ao carregar do servidor: ${err.message}<br>Verifique se o arquivo está commitado exatamente em: <b>catalogo/modulo/image-editor.html</b>
            </div>`;
        });
}

// =========================================================================
// GATILHO AUTOMÁTICO INICIAL (CICLO DE VIDA CONCLUÍDO)
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Inicializa o painel abrindo por padrão o fluxo de monitoramento de pedidos
    if (typeof window.mudarAbaDinamica === "function") {
        window.mudarAbaDinamica('pedidos');
    }
});
