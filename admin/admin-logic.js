// =========================================================================
// CONFIGURAÇÃO OFICIAL DO FIREBASE (MÁSCARA CONTROLADORA DA INFRAESTRUTURA)
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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage(); // Inicializado para permitir conversão de imagens

const cacheModulos = {};
let listenersAtivos = {};

// Cache local de segurança para manipulação dinâmica de pedidos inter-abas
window.todosPedidosLocal = window.todosPedidosLocal || {};
window.pedidoEditando = window.pedidoEditando || null;

// Utilitário de Formatação de Uso Geral no Ecossistema BR
window.fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// =========================================================================
// AJUSTE FINAL: CONVERSOR DE IMAGENS (GS:// -> HTTPS://)
// =========================================================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try {
            return await storage.refFromURL(caminhoGS).getDownloadURL();
        } catch (error) {
            console.error("Erro ao converter link GS:", error);
            return null;
        }
    }
    return caminhoGS;
}

// =========================================================================
// INTERRUPÇÃO ASSÍNCRONA E INJEÇÃO DE ESCOPO ISOLADO
// =========================================================================
async function mudarAbaDinamica(nomeAba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // Ajuste Visual da Sidebar
    document.querySelectorAll('#menu-navegacao .tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const btnAtivo = document.getElementById(`btn-${nomeAba}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // Mata conexões globais anteriores do Firebase para evitar concorrência ou lentidão
    if (listenersAtivos['orders']) {
        db.ref('orders').off();
        delete listenersAtivos['orders'];
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 font-mono text-xs animate-pulse">Injetando componente ${nomeAba}.html...</div>`;

    try {
        if (!cacheModulos[nomeAba]) {
            const resposta = await fetch(`${nomeAba}.html`);
            if (!resposta.ok) throw new Error(`Arquivo ${nomeAba}.html não mapeado.`);
            cacheModulos[nomeAba] = await resposta.text();
        }

        container.innerHTML = cacheModulos[nomeAba];

        // Força o Navegador a executar códigos Javascript dentro da página injetada
        const scripts = container.querySelectorAll("script");
        scripts.forEach(scriptAntigo => {
            const scriptNovo = document.createElement("script");
            if (scriptAntigo.src) {
                scriptNovo.src = scriptAntigo.src;
            } else {
                scriptNovo.textContent = scriptAntigo.textContent;
            }
            document.body.appendChild(scriptNovo).parentNode.removeChild(scriptNovo);
        });

    } catch (erro) {
        container.innerHTML = `
            <div class="bg-red-950/20 border border-red-900 text-red-400 p-4 rounded-xl text-xs font-mono">
                <p class="font-bold">⚠️ Falha ao renderizar componente: ${nomeAba}.html</p>
                <p class="text-zinc-500 mt-1">${erro.message}</p>
            </div>
        `;
    }
}

// =========================================================================
// MÓDULO CONTROLADOR COESIVO (Pedidos, Editor, etc.)
// =========================================================================
// [MANTIDO: Sua lógica original de edição, reordenação e persistência de pedidos]
// (Todo o restante da sua lógica de window.abrirEditorPedido, window.salvarPedidoEditado, etc., continua aqui abaixo)
