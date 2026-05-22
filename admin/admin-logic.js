// ==========================================
// CONFIGURAÇÃO INICIAL
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

// ==========================================
// CONVERSOR GS:// PARA HTTPS:// (GLOBAL)
// ==========================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try {
            return await firebase.storage().refFromURL(caminhoGS).getDownloadURL();
        } catch (error) {
            console.error("Erro ao converter link GS:", error);
            return null;
        }
    }
    return caminhoGS;
}

// ==========================================
// GERENCIAMENTO DE ABAS
// ==========================================
function mudarAbaDinamica(aba) {
    const conteudoDinamico = document.getElementById('conteudo-dinamico');
    if (!conteudoDinamico) return;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black', 'font-bold');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });

    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black', 'font-bold');
    }

    // Carregamento de módulos
    if (aba === 'categorias') {
        renderizarCategoriasUI();
        escutarCategoriasFirebase();
        configurarPreviewImagem();
    } else {
        conteudoDinamico.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-zinc-500">
                <p class="text-xs italic">O módulo <strong>${aba}</strong> está em desenvolvimento.</p>
                <button onclick="mudarAbaDinamica('categorias')" class="mt-4 text-[#caa85c] underline">Voltar para Categorias</button>
            </div>`;
    }
}

// ==========================================
// MÓDULO CATEGORIAS (CORRIGIDO E UNIFICADO)
// ==========================================
function renderizarCategoriasUI() {
    document.getElementById('conteudo-dinamico').innerHTML = `
        <div class="p-6 max-w-6xl mx-auto space-y-6">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h1 class="text-2xl font-bold text-white">📁 Gestão de Categorias</h1>
                <button onclick="abrirModalCategoria()" class="bg-emerald-600 px-5 py-2 rounded-xl text-sm">➕ Nova Categoria</button>
            </div>
            <div id="grid-categorias" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"></div>
        </div>
        `;
}

async function escutarCategoriasFirebase() {
    db.ref('categories').on('value', async (snapshot) => {
        const grid = document.getElementById('grid-categorias');
        if (!grid) return;
        grid.innerHTML = '';
        const dados = snapshot.val();
        if (!dados) return;

        for (const id in dados) {
            const cat = dados[id];
            const urlFinal = await obterLinkPublico(cat.image || cat.urlImagem);
            
            const card = document.createElement('div');
            card.className = "bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden";
            card.innerHTML = `
                <div class="w-full aspect-square bg-zinc-900">
                    <img src="${urlFinal || ''}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <div class="p-4 text-white font-bold">${cat.nome || id}</div>
            `;
            grid.appendChild(card);
        }
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = () => mudarAbaDinamica('categorias');
