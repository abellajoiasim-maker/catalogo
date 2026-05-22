// ==========================================
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================
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
const storage = firebase.storage();

// ==========================================
// 2. CONVERSOR DE IMAGENS (GS -> HTTPS)
// ==========================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try {
            return await storage.refFromURL(caminhoGS).getDownloadURL();
        } catch (error) {
            console.error("Erro ao converter:", error);
            return null;
        }
    }
    return caminhoGS;
}

// ==========================================
// 3. GERENCIADOR DE ABAS (O CÉREBRO)
// ==========================================
function mudarAbaDinamica(aba) {
    const main = document.getElementById('conteudo-dinamico');
    
    // Atualiza estilo dos botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black', 'font-bold');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    const btn = document.getElementById(`btn-${aba}`);
    if (btn) { btn.classList.add('bg-[#caa85c]', 'text-black', 'font-bold'); }

    // Roteador de Módulos
    switch (aba) {
        case 'categorias': renderCategorias(main); break;
        case 'produtos': renderProdutos(main); break;
        case 'pedidos': renderPedidos(main); break;
        default: main.innerHTML = `<div class="p-10 text-zinc-500">Módulo ${aba} ainda não implementado.</div>`;
    }
}

// ==========================================
// 4. MÓDULOS DE RENDERIZAÇÃO
// ==========================================

// --- Módulo: Categorias ---
async function renderCategorias(container) {
    container.innerHTML = `<div class="p-6"><h1 class="text-xl text-white font-bold mb-4">Gestão de Categorias</h1><div id="grid-cat" class="grid grid-cols-4 gap-4"></div></div>`;
    db.ref('categories').on('value', async (snap) => {
        const grid = document.getElementById('grid-cat');
        grid.innerHTML = '';
        const dados = snap.val() || {};
        for (let id in dados) {
            const url = await obterLinkPublico(dados[id].image || dados[id].urlImagem);
            grid.innerHTML += `
                <div class="bg-[#111] p-2 rounded-xl">
                    <img src="${url}" class="w-full aspect-square object-cover rounded-lg">
                    <p class="text-white text-xs mt-2">${dados[id].nome}</p>
                </div>`;
        }
    });
}

// --- Módulo: Produtos ---
async function renderProdutos(container) {
    container.innerHTML = `<div class="p-6"><h1 class="text-xl text-white font-bold mb-4">Gestão de Produtos</h1><div id="grid-prod" class="grid grid-cols-4 gap-4"></div></div>`;
    db.ref('products').on('value', async (snap) => {
        const grid = document.getElementById('grid-prod');
        grid.innerHTML = '';
        const dados = snap.val() || {};
        for (let id in dados) {
            const url = await obterLinkPublico(dados[id].imagem);
            grid.innerHTML += `
                <div class="bg-[#111] p-2 rounded-xl">
                    <img src="${url}" class="w-full aspect-square object-cover rounded-lg">
                    <p class="text-white text-xs mt-2">${dados[id].nome || 'Sem Nome'}</p>
                </div>`;
        }
    });
}

// --- Módulo: Pedidos (Exemplo de estrutura) ---
function renderPedidos(container) {
    container.innerHTML = `<div class="p-6 text-white"><h1 class="text-xl font-bold">Pedidos Recebidos</h1><p>Lista de pedidos aqui...</p></div>`;
}

// Inicialização
window.onload = () => mudarAbaDinamica('pedidos');
