// =========================================================================
// CONFIGURAÇÃO OFICIAL DO FIREBASE (COMPARTILHADA POR TODOS OS MÓDULOS)
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

// Cache em memória para evitar requisições desnecessárias de rede ao alternar abas
const cacheModulos = {};
let listenersAtivos = {};

// =========================================================================
// MÁSCARA DE CARREGAMENTO DINÂMICO DE MÓDULOS (ABAS)
// =========================================================================
async function mudarAbaDinamica(nomeAba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // 1. Atualização visual dos botões da Sidebar
    document.querySelectorAll('#menu-navegacao .tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const btnAtivo = document.getElementById(`btn-${nomeAba}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // 2. Destruição segura de ouvintes antigos em tempo real para evitar vazamento de memória e travamentos
    if (listenersAtivos['orders']) {
        db.ref('orders').off();
        delete listenersAtivos['orders'];
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 font-mono text-xs animate-pulse">Injetando componente ${nomeAba}.html...</div>`;

    try {
        // 3. Busca o arquivo HTML correspondente
        if (!cacheModulos[nomeAba]) {
            const resposta = await fetch(`${nomeAba}.html`);
            if (!resposta.ok) throw new Error(`Arquivo ${nomeAba}.html não localizado na raiz.`);
            cacheModulos[nomeAba] = await resposta.text();
        }

        // 4. Injeta o código do arquivo modular na tela
        container.innerHTML = cacheModulos[nomeAba];

        // 5. Executa scripts injetados dinamicamente no módulo, se existirem
        const scripts = container.querySelectorAll("script");
        scripts.forEach(script Antigo => {
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
            <div class="bg-red-950/20 border border-red-900 text-red-400 p-4 rounded-xl text-xs space-y-2">
                <p class="font-bold">⚠️ Falha Crítica de Carregamento Modular</p>
                <p class="font-mono">${erro.message}</p>
                <p class="text-[11px] text-gray-500">Certifique-se de criar o arquivo <span class="text-white font-bold">${nomeAba}.html</span> no seu repositório.</p>
            </div>
        `;
    }
}

// Inicialização automática padrão na primeira carga do painel administrativo
document.addEventListener("DOMContentLoaded", () => {
    mudarAbaDinamica('pedidos');
});
