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

// SISTEMA CENTRALIZADO DE NAVEGAÇÃO DE ABAS
window.mudarAbaDinamica = function(aba) {
    const container = document.getElementById('conteudo-dinamico');
    
    // Altera o estado visual dos botões no menu lateral
    document.querySelectorAll('#menu-navegacao button').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if(btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // DIRECIONAMENTO DE RENDERIZAÇÃO DE ACORDO COM O SELETOR
    switch(aba) {
        case 'editor':
            carregarTemplateEditorIA(container);
            break;
        case 'pedidos':
            container.innerHTML = `<div class="space-y-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">📦 Painel de Pedidos Recebidos</h2>
                <p class="text-xs text-zinc-400">Listagem em tempo real integrada com o checkout.</p>
                <div class="bg-[#111] p-8 rounded-xl border border-[#222] text-center text-zinc-500 italic">Nenhum pedido pendente nas últimas 24h.</div>
            </div>`;
            break;
        case 'ofertas':
            container.innerHTML = `<div class="space-y-4">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">🏷️ Campanhas & Descontos por Categoria</h2>
                <div class="bg-[#111] p-8 rounded-xl border border-[#222] text-center text-zinc-500 italic">Nenhuma promoção ativa no momento.</div>
            </div>`;
            break;
        default:
            container.innerHTML = `<div class="flex items-center justify-center h-48 text-zinc-500 italic text-xs">Módulo [${aba.toUpperCase()}] em desenvolvimento técnico...</div>`;
    }
}

// INJETOR DO TEMPLATE NATIVO DO EDITOR MASTER IA
function carregarTemplateEditorIA(targetContainer) {
    fetch('modulo/image-editor.html')
        .then(response => {
            if(!response.ok) throw new Error("Módulo image-editor.html não localizado na pasta.");
            return response.text();
        })
        .then(html => {
            targetContainer.innerHTML = html;
            // Executa o gatilho de carga das coleções após renderizar os nós visuais
            if(typeof window.inicializarMapeamentoLote === "function") {
                window.inicializarMapeamentoLote();
            }
        })
        .catch(err => {
            console.error(err);
            targetContainer.innerHTML = `<div class="p-6 bg-red-950/20 border border-red-900 text-red-400 rounded-xl text-xs font-mono">
                ❌ Falha crítica ao carregar interface do Editor: ${err.message}<br>Verifique se o arquivo está na pasta correta: <b>modulo/image-editor.html</b>
            </div>`;
        });
}

// GATILHO AUTOMÁTICO INICIAL
document.addEventListener("DOMContentLoaded", function() {
    mudarAbaDinamica('pedidos');
});
