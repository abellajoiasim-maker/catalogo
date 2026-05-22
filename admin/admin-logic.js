// ==========================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================================
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

// ==========================================================
// CONVERSOR GLOBAL (GS:// -> HTTPS://)
// ==========================================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try { return await storage.refFromURL(caminhoGS).getDownloadURL(); }
        catch (e) { return null; }
    }
    return caminhoGS;
}

// ==========================================================
// GERENCIADOR DE ABAS (ROTEADOR COMPLETO)
// ==========================================================
function mudarAbaDinamica(aba) {
    const main = document.getElementById('conteudo-dinamico');
    
    // Reset visual dos botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black', 'font-bold');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) btnAtivo.classList.add('bg-[#caa85c]', 'text-black', 'font-bold');

    // Módulos
    switch (aba) {
        case 'pedidos': renderPedidos(main); break;
        case 'editor': renderEditor(main); break;
        case 'ofertas': renderOfertas(main); break;
        case 'galvanicas': renderGalvanicas(main); break;
        case 'produtos': renderProdutos(main); break;
        case 'categorias': renderCategorias(main); break;
        case 'configuracoes': renderConfig(main); break;
        default: main.innerHTML = `<div class="p-10 text-zinc-500">Módulo ${aba} em construção.</div>`;
    }
}

// ==========================================================
// RENDERIZADORES DE MÓDULOS
// ==========================================================

function renderPedidos(container) { container.innerHTML = `<h2 class="text-white p-6">📦 Pedidos Recebidos</h2>`; }
function renderEditor(container) { container.innerHTML = `<h2 class="text-white p-6">⚡ Editor Full Master</h2>`; }
function renderOfertas(container) { container.innerHTML = `<h2 class="text-white p-6">🏷️ Painel de Ofertas</h2>`; }
function renderGalvanicas(container) { container.innerHTML = `<h2 class="text-white p-6">🚚 Galvânicas Parceiras</h2>`; }
function renderConfig(container) { container.innerHTML = `<h2 class="text-white p-6">⚙️ Configurações</h2>`; }

async function renderProdutos(container) {
    container.innerHTML = `<h2 class="text-white p-6">💍 Gestão de Produtos</h2><div id="grid-prod" class="grid grid-cols-4 gap-4 p-6"></div>`;
    db.ref('products').on('value', async (snap) => {
        const grid = document.getElementById('grid-prod');
        grid.innerHTML = '';
        const data = snap.val() || {};
        for (let id in data) {
            const url = await obterLinkPublico(data[id].imagem);
            grid.innerHTML += `<div class="bg-[#111] p-2 rounded"><img src="${url}" class="w-full h-32 object-cover"></div>`;
        }
    });
}

async function renderCategorias(container) {
    container.innerHTML = `<h2 class="text-white p-6">📁 Coleções / Categorias</h2><div id="grid-cat" class="grid grid-cols-4 gap-4 p-6"></div>`;
    db.ref('categories').on('value', async (snap) => {
        const grid = document.getElementById('grid-cat');
        grid.innerHTML = '';
        const data = snap.val() || {};
        for (let id in data) {
            const url = await obterLinkPublico(data[id].image || data[id].urlImagem);
            grid.innerHTML += `<div class="bg-[#111] p-2 rounded"><img src="${url}" class="w-full h-32 object-cover"></div>`;
        }
    });
}

// Inicialização padrão
window.onload = () => mudarAbaDinamica('pedidos');
