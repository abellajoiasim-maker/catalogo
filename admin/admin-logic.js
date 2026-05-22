// ==========================================
// CONFIGURAÇÃO INICIAL DO FIREBASE (COMPAT)
// ==========================================
// Nota: Substitua as credenciais abaixo pelas chaves oficiais do seu projeto Abella Joias se necessário
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

// Inicializa o Firebase caso ele não tenha sido iniciado em outro script global
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// =========================================================================
// GERENCIAMENTO DE ABAS DINÂMICAS COM CONVERSOR AUTOMÁTICO DE IMAGENS (GS -> HTTPS)
// =========================================================================
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

    if (aba === 'categorias') {
        conteudoDinamico.innerHTML = `
            <div class="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
                <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                        <h1 class="text-2xl font-bold text-white flex items-center gap-2"><span>📁</span> Gestão de Categorias</h1>
                    </div>
                    <button onclick="abrirModalCategoria()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-all text-sm">➕ Nova Categoria</button>
                </div>
                <div id="grid-categorias" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div class="col-span-full text-center py-12 text-gray-400">⏳ Carregando coleções...</div>
                </div>
            </div>
            `;

        // Agora, dentro da função de escuta, chamaremos o conversor
        escutarCategoriasFirebase();
        configurarPreviewImagem();

    } else {
        conteudoDinamico.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 text-xs italic">Módulo ${aba} em desenvolvimento.</div>`;
    }
}

// ATUALIZAÇÃO DA FUNÇÃO DE ESCUTA NO MESMO ARQUIVO
async function escutarCategoriasFirebase() {
    db.ref('categories').on('value', async (snapshot) => {
        const grid = document.getElementById('grid-categorias');
        if (!grid) return;
        
        grid.innerHTML = '';
        const dados = snapshot.val();
        if (!dados) return;

        for (const id in dados) {
            const cat = dados[id];
            // AQUI ESTÁ A MÁGICA: Converte GS para HTTPS antes de renderizar
            const urlFinal = await obterLinkPublico(cat.image || cat.urlImagem);
            
            const card = document.createElement('div');
            card.className = "bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden";
            card.innerHTML = `
                <div class="w-full aspect-square bg-zinc-900 relative">
                    <img src="${urlFinal || ''}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23444%22 stroke-width=%222%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/><circle cx=%228.5%22 cy=%228.5%22 r=%221.5%22/><polyline points=%2221 15 16 10 5 21%22/></svg>'">
                </div>
                <div class="p-4"><h3 class="text-white font-bold">${cat.nome || id}</h3></div>
            `;
            grid.appendChild(card);
        }
    });
}

// ==========================================
// FUNÇÃO DE LEITURA BLINDADA (ANTI-DUPLICIDADE)
// ==========================================
function escutarCategoriasFirebase() {
    db.ref('categories').on('value', (snapshot) => {
        const grid = document.getElementById('grid-categorias');
        if (!grid) return;
        
        // Limpeza primária estrutural do grid
        grid.innerHTML = '';
        const dados = snapshot.val();

        if (!dados) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
                    📦 Nenhuma categoria encontrada no nó 'categories'.
                </div>`;
            return;
        }

        Object.keys(dados).forEach((id) => {
            const cat = dados[id];
            
            const nomeCategoria = (cat.nome || cat.name || id).replace(/-/g, ' '); 
            const imagemCategoria = cat.image || cat.urlImagem || '';
            const estaPausado = cat.status === 'pausado' || cat.status === 'inactive';
            
            const fotoPadrao = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

            // DEPURADOR CRÍTICO: Se o card já existir no DOM por um duplo disparo, elimina o clone antigo
            const cardExistente = document.getElementById(`card-cat-${id}`);
            if (cardExistente) {
                cardExistente.remove();
            }

            const card = document.createElement('div');
            card.id = `card-cat-${id}`; // Trava a identidade do card para evitar sobreposição
            card.className = `bg-[#111] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl flex flex-col justify-between transition-all ${estaPausado ? 'opacity-40 grayscale' : ''}`;
            
            card.innerHTML = `
                <div>
                    <div class="w-full aspect-square bg-zinc-900 relative border-b border-zinc-800 overflow-hidden block">
                        <img src="${imagemCategoria || fotoPadrao}" alt="${nomeCategoria}" class="absolute inset-0 w-full h-full object-cover object-center m-0 p-0" onerror="this.src='${fotoPadrao}'">
                        <div class="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
                            ${estaPausado ? '<span class="bg-amber-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md shadow-md">⏸️ Pausada</span>' : '<span class="bg-emerald-600 text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded-md shadow-md">🟢 Ativa</span>'}
                        </div>
                    </div>
                    
                    <div class="p-4 text-left">
                        <h3 class="font-bold text-white truncate text-base capitalize mb-1">${nomeCategoria}</h3>
                        <p class="text-[10px] text-zinc-500 font-mono bg-black/40 p-1.5 rounded border border-zinc-800/80 truncate" title="${id}">slug: ${id}</p>
                    </div>
                </div>

                <div class="grid grid-cols-3 border-t border-zinc-800 bg-zinc-900/50 divide-x divide-zinc-800 mt-auto">
                    <button onclick="editarCategoria('${id}', '${nomeCategoria.replace(/'/g, "\\'")}', '${imagemCategoria}')" class="py-2.5 text-xs font-semibold text-blue-400 hover:bg-blue-950/30 transition-all flex items-center justify-center gap-1">
                        ✏️ Editar
                    </button>
                    <button onclick="alternarStatusCategoria('${id}', '${cat.status || 'ativo'}')" class="py-2.5 text-xs font-semibold ${estaPausado ? 'text-emerald-400 hover:bg-emerald-950/30' : 'text-amber-400 hover:bg-amber-950/30'} transition-all flex items-center justify-center gap-1">
                        ${estaPausado ? '▶️ Ativar' : '⏸️ Pausar'}
                    </button>
                    <button onclick="deletarCategoria('${id}')" class="py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all flex items-center justify-center gap-1">
                        🗑️ Excluir
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// ==========================================
// OPERAÇÕES COMPLEMENTARES DO MODAL
// ==========================================
function configurarPreviewImagem() {
    const inputUrl = document.getElementById('catUrlImagem');
    if (!inputUrl) return;

    inputUrl.addEventListener('input', function(e) {
        const img = document.getElementById('catPreviewModal');
        const placeholder = document.getElementById('catPreviewPlaceholder');
        if (e.target.value.trim() !== "") {
            img.src = e.target.value.trim();
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            img.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    });
}

function abrirModalCategoria() {
    document.getElementById('modalTitulo').innerText = "Nova Categoria";
    document.getElementById('catId').value = "";
    document.getElementById('catSlug').value = "";
    document.getElementById('catSlug').disabled = false;
    document.getElementById('catNome').value = "";
    document.getElementById('catUrlImagem').value = "";
    document.getElementById('catPreviewModal').classList.add('hidden');
    document.getElementById('catPreviewPlaceholder').classList.remove('hidden');
    document.getElementById('modalCategoria').classList.remove('hidden');
}

function fecharModalCategoria() {
    document.getElementById('modalCategoria').classList.add('hidden');
}

function salvarCategoriaFirebase() {
    const idExistente = document.getElementById('catId').value;
    const slugInformado = document.getElementById('catSlug').value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const nome = document.getElementById('catNome').value.trim();
    const urlImagem = document.getElementById('catUrlImagem').value.trim();

    if (!nome) {
        alert("⚠️ Insira o nome da categoria!");
        return;
    }

    let idFinal = idExistente || slugInformado || nome.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const btn = document.getElementById('btnSalvarCategoria');
    btn.disabled = true;
    btn.innerText = "⏳ Gravando...";

    const dados = {
        nome: nome,
        name: nome,
        image: urlImagem,
        urlImagem: urlImagem
    };

    if (idExistente) {
        db.ref(`categories/${idExistente}`).update(dados)
            .then(() => fecharEAlertar("Categoria atualizada com sucesso!"))
            .catch(erro => tratarErro(erro));
    } else {
        dados.status = "ativo";
        db.ref(`categories/${idFinal}`).set(dados)
            .then(() => fecharEAlertar("Nova categoria adicionada!"))
            .catch(erro => tratarErro(erro));
    }

    function fecharEAlertar(msg) {
        alert(`✅ ${msg}`);
        fecharModalCategoria();
        btn.disabled = false;
        btn.innerHTML = "Salvar Registro";
    }

    function tratarErro(e) {
        alert("❌ Erro ao salvar dados.");
        console.error(e);
        btn.disabled = false;
        btn.innerHTML = "Salvar Registro";
    }
}

function editarCategoria(id, nome, urlImagem) {
    document.getElementById('modalTitulo').innerText = "Editar Categoria";
    document.getElementById('catId').value = id;
    document.getElementById('catSlug').value = id;
    document.getElementById('catSlug').disabled = true;
    document.getElementById('catNome').value = nome;
    document.getElementById('catUrlImagem').value = urlImagem;

    const img = document.getElementById('catPreviewModal');
    const placeholder = document.getElementById('catPreviewPlaceholder');
    
    if (urlImagem && urlImagem !== 'undefined') {
        img.src = urlImagem;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    document.getElementById('modalCategoria').classList.remove('hidden');
}

function alternarStatusCategoria(id, statusAtual) {
    const novoStatus = (statusAtual === 'ativo' || statusAtual === 'active') ? 'pausado' : 'ativo';
    db.ref(`categories/${id}`).update({ status: novoStatus })
        .catch(erro => console.error("Erro ao alternar status:", erro));
}

function deletarCategoria(id) {
    if (confirm(`⚠️ Deseja mesmo excluir permanentemente a categoria '${id}'?\nIsto pode remover a visualização dos produtos associados a ela.`)) {
        db.ref(`categories/${id}`).remove()
            .then(() => alert("✅ Categoria removida."))
            .catch(erro => console.error("Erro ao remover:", erro));
    }
}

// ==========================================
// DISPARO AUTOMÁTICO NA INICIALIZAÇÃO
// ==========================================
window.onload = () => {
    // Inicializa o ecossistema na aba de pedidos por padrão ou categorias
    mudarAbaDinamica('categorias');
};
/**
 * Converte links gs:// em URLs públicas de download do Firebase Storage.
 * Útil para exibir imagens em tempo real no catálogo.
 */
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string') return caminhoGS;
    
    // Se já for um link http, retorna direto
    if (caminhoGS.startsWith('http')) return caminhoGS;

    // Se for o formato gs://, faz a conversão
    if (caminhoGS.startsWith('gs://')) {
        try {
            const storageRef = firebase.storage().refFromURL(caminhoGS);
            return await storageRef.getDownloadURL();
        } catch (error) {
            console.error("Erro ao converter link GS:", error);
            return null; // Retorna nulo se o arquivo não existir
        }
    }
    return caminhoGS;
}
