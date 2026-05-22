// CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE COLETIVO
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

// CACHES GLOBAIS DE OPERAÇÃO
var _PRODUTOS_LOTE_CACHE = {};
var _FILA_PROCESSAMENTO = [];
var _INDICE_ATUAL_FILA = 0;

// ==========================================
// SISTEMA DE NAVEGAÇÃO INTEGRADO E SEGURO
// ==========================================
window.mudarAbaDinamica = function(aba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;
    
    // 1. Gerencia o visual dos botões no menu lateral (Efeito Ativo/Inativo)
    document.querySelectorAll('#menu-navegacao button').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if(btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // 2. Roteamento Avançado das Telas
    if (aba === 'editor') {
        // Remove preenchimentos excessivos para o editor de imagens ocupar bem o espaço
        container.classList.remove('p-8'); 
        carregarTemplateEditorIA(container);
    } else {
        // Devolve o espaçamento padrão (p-8) para os seus outros módulos nativos
        if(!container.classList.contains('p-8')) container.classList.add('p-8');

        // CHAMA A SUA LÓGICA ORIGINAL DO SEU PAINEL (Pedidos, Produtos, Galvânicas, etc.)
        // Se você já tinha um switch-case ou funções como renderizarPedidos() e carregarProdutos(), coloque-as aqui:
        switch(aba) {
            case 'pedidos':
                // Se a sua função antiga de listar pedidos se chamava, por exemplo, 'carregarPedidos()', chame-a aqui.
                if (typeof window.carregarPedidos === "function") {
                    window.carregarPedidos();
                } else if (typeof window.listarPedidos === "function") {
                    window.listarPedidos();
                } else {
                    // Caso a renderização dos pedidos estivesse solta na função antiga,
                    // certifique-se de que o seu script antigo de renderizar a tabela de pedidos seja executado aqui.
                    container.innerHTML = `<div class="space-y-4">
                        <h2 class="text-xl font-bold text-white flex items-center gap-2">📦 Pedidos Recebidos</h2>
                        <div id="tabela-pedidos-container"></div>
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
                // Se a sua função antiga gerenciava as abas por uma lógica genérica, tentamos mantê-la viva
                if (typeof window.carregarAbaNativaOriginal === "function") {
                    window.carregarAbaNativaOriginal(aba);
                } else {
                    container.innerHTML = `<div class="flex items-center justify-center h-48 text-zinc-500 italic text-xs">Módulo [${aba.toUpperCase()}] carregando...</div>`;
                }
        }
    }
}

// INJETOR DO TEMPLATE NATIVO DO EDITOR MASTER IA (URL ABSOLUTA INFALÍVEL)
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
                ❌ Falha ao carregar do servidor: ${err.message}<br>Verifique se o arquivo está commitado exatamente em: <b>catalogo/modulo/image-editor.html</b>
            </div>`;
        });
}
// GATILHO AUTOMÁTICO INICIAL
document.addEventListener("DOMContentLoaded", function() {
    mudarAbaDinamica('pedidos');
});
