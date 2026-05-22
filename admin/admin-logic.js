// ==========================================================
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO
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
// 2. FUNÇÃO MESTRE PARA CONVERSÃO DE IMAGENS (GS -> HTTPS)
// ==========================================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try {
            return await storage.refFromURL(caminhoGS).getDownloadURL();
        } catch (error) {
            console.error("Erro na conversão da imagem:", error);
            return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        }
    }
    return caminhoGS;
}

// ==========================================================
// 3. ROTEADOR DINÂMICO DE MÓDULOS
// ==========================================================
function mudarAbaDinamica(aba) {
    const main = document.getElementById('conteudo-dinamico');
    
    // Atualiza botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black', 'font-bold');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    const btn = document.getElementById(`btn-${aba}`);
    if (btn) btn.classList.add('bg-[#caa85c]', 'text-black', 'font-bold');

    // Limpa o conteúdo
    main.innerHTML = `<div class="p-10 text-center text-gray-500">⏳ Carregando ${aba}...</div>`;

    // Dispara a função do módulo correspondente
    switch (aba) {
        case 'pedidos': renderPedidos(main); break;
        case 'editor': renderEditor(main); break;
        case 'ofertas': renderOfertas(main); break;
        case 'galvanicas': renderGalvanicas(main); break;
        case 'produtos': renderProdutos(main); break;
        case 'categorias': renderCategorias(main); break;
        case 'configuracoes': renderConfiguracoes(main); break;
    }
}

// ==========================================================
// 4. LÓGICA DE RENDERIZAÇÃO DE CADA MÓDULO
// ==========================================================

async function renderProdutos(container) {
    container.innerHTML = `<div class="p-6"><h1 class="text-2xl font-bold text-white mb-6">💍 Gestão de Produtos</h1><div id="grid-prod" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"></div></div>`;
    
    db.ref('products').on('value', async (snap) => {
        const grid = document.getElementById('grid-prod');
        if (!grid) return;
        grid.innerHTML = '';
        const data = snap.val() || {};
        
        for (let id in data) {
            const url = await obterLinkPublico(data[id].imagem);
            grid.innerHTML += `
                <div class="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <img src="${url}" class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="p-3"><p class="text-white font-bold truncate">${data[id].nome || 'Sem Nome'}</p></div>
                </div>`;
        }
    });
}

async function renderCategorias(container) {
    container.innerHTML = `<div class="p-6"><h1 class="text-2xl font-bold text-white mb-6">📁 Coleções / Categorias</h1><div id="grid-cat" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"></div></div>`;
    
    db.ref('categories').on('value', async (snap) => {
        const grid = document.getElementById('grid-cat');
        if (!grid) return;
        grid.innerHTML = '';
        const data = snap.val() || {};
        
        for (let id in data) {
            const url = await obterLinkPublico(data[id].image || data[id].urlImagem);
            grid.innerHTML += `
                <div class="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                    <img src="${url}" class="w-full h-48 object-cover" onerror="this.src='https://via.placeholder.com/150'">
                    <div class="p-3"><p class="text-white font-bold truncate">${data[id].nome || id}</p></div>
                </div>`;
        }
    });
}

// Módulos adicionais (pode preencher com a lógica original que você tinha)
function renderPedidos(container) { container.innerHTML = `<div class="p-6"><h1 class="text-2xl text-white">📦 Pedidos Recebidos</h1></div>`; }
function renderEditor(container) { container.innerHTML = `<div class="p-6"><h1 class="text-2xl text-white">⚡ Editor Full Master</h1></div>`; }
function renderOfertas(container) { container.innerHTML = `<div class="p-6"><h1 class="text-2xl text-white">🏷️ Painel de Ofertas</h1></div>`; }
function renderGalvanicas(container) { container.innerHTML = `<div class="p-6"><h1 class="text-2xl text-white">🚚 Galvânicas Parceiras</h1></div>`; }
function renderConfiguracoes(container) { container.innerHTML = `<div class="p-6"><h1 class="text-2xl text-white">⚙️ Configurações</h1></div>`; }

// Inicialização
window.onload = () => mudarAbaDinamica('categorias');
