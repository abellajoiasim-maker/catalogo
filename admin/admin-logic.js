// =========================================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE COLETIVO (MANTIDA INTEGRALMENTE)
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

// CACHES GLOBAIS DE OPERAÇÃO DO EDITOR
var _PRODUTOS_LOTE_CACHE = {};
var _FILA_PROCESSAMENTO = [];
var _INDICE_ATUAL_FILA = 0;

// =========================================================================
// INTERCEPTADOR DE ABAS BLINDADO (SALVA E PRESERVA TODA A SUA LÓGICA ANTIGA)
// =========================================================================
(function() {
    // Captura e guarda na memória o motor antigo de abas que já funcionava no seu painel
    const funcaoMudarAbaOriginal = window.mudarAbaDinamica;

    window.mudarAbaDinamica = function(aba) {
        const container = document.getElementById('conteudo-dinamico');
        if (!container) return;
        
        // 1. Atualiza o estado visual de seleção do menu lateral (Garante o destaque dourado)
        document.querySelectorAll('#menu-navegacao button').forEach(btn => {
            btn.classList.remove('bg-[#caa85c]', 'text-black');
            btn.classList.add('bg-zinc-900', 'text-gray-400');
        });
        
        const btnAtivo = document.getElementById(`btn-${aba}`);
        if(btnAtivo) {
            btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
            btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
        }

        // 2. Roteamento Inteligente
        if (aba === 'editor') {
            // Remove margens para dar espaço máximo à mesa de renderização de fotos
            container.classList.remove('p-8'); 
            carregarTemplateEditorIA(container);
        } else {
            // Restaura o espaçamento padrão de layout (p-8) para os outros módulos
            if(!container.classList.contains('p-8')) container.classList.add('p-8');

            // DEVOLUÇÃO SEGURA: Executa o seu código nativo original para Pedidos, Ofertas, Produtos, etc.
            if (typeof funcaoMudarAbaOriginal === "function") {
                funcaoMudarAbaOriginal(aba);
            } else {
                // Caso não encontre a cópia, executa o mapeamento de retaguarda padrão do ecossistema
                executarMapeamentoFallback(aba, container);
            }
        }
    };
})();

// =========================================================================
// INTERRUPTOR DE RETAGUARDA (FALLBACK CASO AS FUNÇÕES COPIADAS SE PERCAM)
// =========================================================================
function ejecutarMapeamentoFallback(aba, container) {
    switch(aba) {
        case 'pedidos':
            if (typeof window.carregarPedidos === "function") window.carregarPedidos();
            else if (typeof window.listarPedidos === "function") window.listarPedidos();
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
            container.innerHTML = `<div class="flex items-center justify-center h-48 text-zinc-500 italic text-xs">Módulo [${aba.toUpperCase()}] carregando dados do Firebase...</div>`;
    }
}

// =========================================================================
// INJETOR DO TEMPLATE NATIVO DO EDITOR (RESOLVE ERROS 404 DE SUBPASTAS DO GITHUB)
// =========================================================================
function carregarTemplateEditorIA(targetContainer) {
    // URL absoluta e imutável para não errar o caminho caso o painel esteja na pasta /admin/
    fetch('https://abellajoiasim-maker.github.io/catalogo/modulo/image-editor.html')
        .then(response => {
            if(!response.ok) throw new Error("Não foi possível ler o arquivo image-editor.html no repositório GitHub.");
            return response.text();
        })
        .then(html => {
            targetContainer.innerHTML = html;
            // Dispara o gatilho assíncrono interno para preencher o select de categorias
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
// GATILHO AUTOMÁTICO INICIAL
// =========================================================================
document.addEventListener("DOMContentLoaded", function() {
    // Inicializa abrindo a tela de pedidos padrão do catálogo
    if (typeof window.mudarAbaDinamica === "function") {
        window.mudarAbaDinamica('pedidos');
    }
});
