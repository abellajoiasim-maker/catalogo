// CONFIGURAÇÃO OFICIAL DO FIREBASE (ABELLA JOIAS)
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); // [cite: 120]
const db = firebase.database();
const fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); // [cite: 120]

// ALTERAÇÃO DE ABAS FLUIDA
function mudarAba(idAba) {
    ['pedidos', 'editor', 'ofertas', 'galvanicas', 'produtos', 'categorias', 'config'].forEach(aba => {
        const elementoAba = document.getElementById(`aba-${aba}`);
        const elementoBtn = document.getElementById(`btn-${aba}`);
        if(elementoAba) elementoAba.classList.add('hidden'); // [cite: 121]
        if(elementoBtn) elementoBtn.classList.remove('active'); // [cite: 121]
    });
    const abaAlvo = document.getElementById(`aba-${idAba}`); // [cite: 122]
    const btnAlvo = document.getElementById(`btn-${idAba}`); // [cite: 122]
    if(abaAlvo) abaAlvo.classList.remove('hidden'); // [cite: 122]
    if(btnAlvo) btnAlvo.classList.add('active'); // [cite: 122]
}

// ==========================================
// 1. SINCRONIZAÇÃO TOTAL DE PEDIDOS RECEBIDOS
// ==========================================
db.ref('orders').on('value', snap => {
    const container = document.getElementById('lista-pedidos');
    const badgeCount = document.getElementById('qtd-pedidos');
    
    if (!snap.exists()) {
        container.innerHTML = '<p class="text-xs text-gray-500 italic col-span-full">Nenhum pedido ativo recebido...</p>';
        badgeCount.innerText = "0 pedidos";
        return;
    }

    let count = 0;
    let stackHtml = []; // Otimização extrema de memória

    snap.forEach(child => {
        const id = child.key;
        const o = child.val() || {};
        count++;

        // Tratamento flexível e seguro para os dados do cliente
        const nomeCliente = (o.cliente?.nome || o.cliente || o.nome || 'Cliente Oculto').toUpperCase();
        const whatsappCliente = o.cliente?.telefone || o.telefone || o.whats || 'Não informado';
        const enderecoCliente = o.entrega?.rua || o.endereco || 'Retirada / Não informado';

        const rawTotal = o.total;
        const totalExibivel = typeof rawTotal === 'number' ? fMoeda(rawTotal) : (rawTotal || 'R$ 0,00');
        const dataPedido = o.criadoEm ? new Date(o.criadoEm).toLocaleString('pt-BR') : (o.data || 'Data Indefinida');

        // Número amigável baseado no ID do Firebase
        const numeroPedido = id.substring(1, 10).toUpperCase();

        stackHtml.push(`
            <div class="card p-4 flex flex-col justify-between border border-zinc-800 hover:border-zinc-700 transition-all text-xs space-y-3">
                <div class="space-y-1">
                    <div class="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                        <span class="font-bold text-white">Pedido #${numeroPedido}</span>
                        <span>${dataPedido}</span>
                    </div>
                    <div class="font-bold text-gray-200 uppercase tracking-wide truncate">${nomeCliente}</div>
                    <div class="text-zinc-400 flex items-center gap-1">
                        <span>📱 WhatsApp:</span>
                        <span class="font-mono text-gray-300">${whatsappCliente}</span>
                    </div>
                    <div class="text-zinc-400 truncate">
                        <span>📍 Endereço:</span>
                        <span class="italic text-zinc-500">${enderecoCliente}</span>
                    </div>
                    <div class="pt-1.5 flex justify-between items-center border-t border-zinc-900/50 mt-1">
                        <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total</span>
                        <span class="text-sm font-black text-[#caa85c] font-mono">${totalExibivel}</span>
                    </div>
                </div>

                <div class="bg-black/40 p-2 rounded-lg border border-zinc-900 space-y-1.5">
                    <div class="flex gap-1.5">
                        <select id="select-romaneio-${id}" class="bg-zinc-900 border border-zinc-800 text-[11px] text-white p-1 rounded flex-1 outline-none">
                            <option value="1">1. Conferência de Pedido</option>
                            <option value="2">2. Romaneio Financeiro</option>
                            <option value="3">3. Catálogo do Pedido</option>
                            <option value="4">4. Grade de Conferência</option>
                            <option value="5">5. Grade Financeira</option>
                            <option value="6">6. Romaneio Completo (Foto/Preço)</option>
                        </select>
                        <button onclick="const tipo = document.getElementById('select-romaneio-${id}').value; imprimirRomaneio('${id}', parseInt(tipo));" class="bg-[#caa85c] text-black font-bold text-[10px] px-2.5 py-1 rounded hover:brightness-110 uppercase tracking-wider">Imprimir</button>
                    </div>
                </div>

                <div class="flex gap-2 pt-2 border-t border-zinc-900">
                    <button onclick="editarPedido('${id}')" class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-1 px-2 rounded transition-all text-center">
                        ✏️ Editar
                    </button>
                    <button onclick="arquivarPedido('${id}')" class="bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 font-medium py-1 px-2 rounded transition-all">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `);
    });

    container.innerHTML = stackHtml.reverse().join(''); // Mais novos sempre em primeiro
    badgeCount.innerText = `${count} ${count === 1 ? 'pedido' : 'pedidos'}`;
});

function arquivarPedido(id) {
    if (confirm("Deseja realmente remover ou arquivar este pedido do painel?")) {
        db.ref('orders/' + id).remove();
    }
}
// ==========================================
// 2. PAINEL DE OFERTAS AVANÇADO (LEQUE DE MARKETING)
// ==========================================
function ajustarCamposOferta() {
    const tipo = document.getElementById('of-tipo').value;
    const campoExtra = document.getElementById('campo-of-extra');
    
    if (tipo === "relampago") {
        campoExtra.innerHTML = `
            <label class="text-[10px] text-gray-400 font-bold block mb-1">Data/Hora Final (Contagem Decrescente)</label>
            <input id="of-data-fim" type="datetime-local" class="input-adm">
        `;
        campoExtra.classList.remove('hidden');
    } else if (tipo === "categoria") {
        campoExtra.innerHTML = `
            <label class="text-[10px] text-gray-400 font-bold block mb-1">ID da Coleção/Categoria Beneficiada</label>
            <input id="of-vinc-cat" class="input-adm" placeholder="Ex: aneis, braceletes">
        `;
        campoExtra.classList.remove('hidden');
    } else if (tipo === "progressivo") {
        campoExtra.innerHTML = `
            <label class="text-[10px] text-gray-400 font-bold block mb-1">Valor Mínimo de Compra Exigido (R$)</label>
            <input id="of-minimo" type="number" class="input-adm" placeholder="Ex: 500">
        `;
        campoExtra.classList.remove('hidden');
    } else if (tipo === "badge") {
        campoExtra.innerHTML = `
            <label class="text-[10px] text-gray-400 font-bold block mb-1">Texto do Crachá/Tarja</label>
            <input id="of-badge-txt" class="input-adm" placeholder="Ex: LANÇAMENTO, BRUTO +">
        `;
        campoExtra.classList.remove('hidden');
    } else {
        campoExtra.innerHTML = '';
        campoExtra.classList.add('hidden');
    }
}

function salvarOferta() {
    const tipo = document.getElementById('of-tipo').value;
    const nome = document.getElementById('of-nome').value.trim().toUpperCase();
    const valor = parseFloat(document.getElementById('of-valor').value) || 0;

    if (!nome) { alert("Diga um nome/identificador para a campanha!"); return; }

    let payload = { tipo, nome, valor, projeto: 'abella_joias', status: 'ativo', criadoEm: Date.now() };

    if (tipo === "relampago") payload.validade = document.getElementById('of-data-fim').value;
    if (tipo === "categoria") payload.categoriaAlvo = document.getElementById('of-vinc-cat').value.trim().toLowerCase();
    if (tipo === "progressivo") payload.valorMinimo = parseFloat(document.getElementById('of-minimo').value) || 0;
    if (tipo === "badge") payload.textoBadge = document.getElementById('of-badge-txt').value.trim();

    db.ref('marketing/' + nome).set(payload).then(() => {
        alert("🏷️ Acção promocional lançada com sucesso no catálogo!");
        document.getElementById('of-nome').value = '';
        document.getElementById('of-valor').value = '';
        ajustarCamposOferta();
    });
}

db.ref('marketing').on('value', snap => {
    const container = document.getElementById('lista-ofertas-ativas');
    if (!snap.exists()) { container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhuma promoção ativa...</p>'; return; }

    let output = [];
    snap.forEach(child => {
        const key = child.key;
        const promo = child.val() || {};
        output.push(`
            <div class="card p-4 flex flex-col justify-between border border-zinc-800">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">${promo.tipo}</span>
                        <button onclick="excluirItem('marketing/${key}')" class="text-gray-500 hover:text-red-400 text-xs font-bold">✕</button>
                    </div>
                    <h4 class="text-sm font-bold text-white font-mono">${promo.nome}</h4>
                    <p class="text-xs text-gray-400 mt-1">Impacto: <span class="text-[#caa85c] font-bold">${promo.valor > 0 ? promo.valor + '%' : 'Visual/Informativo'}</span></p>
                </div>
            </div>
        `);
    });
    container.innerHTML = output.join('');
});

// ==========================================
// 3. GESTÃO E EDIÇÃO DE GALVÂNICAS PARCEIRAS
// ==========================================
function salvarGalvanica() {
    const editId = document.getElementById('galv-edit-id').value;
    const nome = document.getElementById('galv-nome').value.trim();
    const selo = document.getElementById('galv-selo').value.trim();
    const endereco = document.getElementById('galv-endereco').value.trim();
    const telefone = document.getElementById('galv-telefone').value.trim();
    const whatsapp = document.getElementById('galv-whatsapp').value.trim();
    const imagem = document.getElementById('galv-imagem').value.trim();
    const descricao = document.getElementById('galv-descricao').value.trim();

    if(!nome || !whatsapp) { alert("Nome e WhatsApp são obrigatórios!"); return; }

    const idRef = editId ? editId : nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    db.ref('galvanicas/' + idRef).set({
        nome, selo, endereco, telefone, whatsapp, imagem, descricao, projeto: 'abella_joias'
    }).then(() => {
        alert("🚚 Parceiro Galvânico guardado com sucesso!");
        limparFormGalvanica();
    });
}

function carregarGalvanicaParaEdicao(id) {
    db.ref('galvanicas/' + id).once('value', snap => {
        if (!snap.exists()) return;
        const g = snap.val();
        document.getElementById('galv-edit-id').value = id;
        document.getElementById('galv-nome').value = g.nome || '';
        document.getElementById('galv-selo').value = g.selo || '';
        document.getElementById('galv-endereco').value = g.endereco || '';
        document.getElementById('galv-telefone').value = g.telefone || '';
        document.getElementById('galv-whatsapp').value = g.whatsapp || '';
        document.getElementById('galv-imagem').value = g.imagem || '';
        document.getElementById('galv-descricao').value = g.descricao || '';

        document.getElementById('galv-titulo-form').innerText = "📝 Editar Parceiro";
        document.getElementById('btn-cancelar-galv').classList.remove('hidden');
        document.getElementById('galv-nome').focus();
    });
}

function limparFormGalvanica() {
    document.getElementById('galv-edit-id').value = '';
    ['galv-nome','galv-selo','galv-endereco','galv-telefone','galv-whatsapp','galv-imagem','galv-descricao'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('galv-titulo-form').innerText = "Novo Parceiro Galvânico";
    document.getElementById('btn-cancelar-galv').classList.add('hidden');
}

db.ref('galvanicas').on('value', snap => {
    const container = document.getElementById('lista-galvanicas-adm');
    if(!snap.exists()) { container.innerHTML = "<p class='text-xs text-gray-500 italic'>Nenhum parceiro homologado.</p>"; return; }
    
    let parts = [];
    snap.forEach(child => {
        const id = child.key;
        const g = child.val() || {};
        parts.push(`
            <div class="card p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 truncate">
                    <img src="${g.imagem || 'https://via.placeholder.com/60'}" class="w-10 h-10 object-contain rounded bg-black p-0.5 shrink-0">
                    <div class="truncate">
                        <h4 class="text-xs font-bold text-white uppercase truncate">${g.nome}</h4>
                        <p class="text-[10px] text-gray-500 font-mono">WhatsApp: ${g.whatsapp}</p>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button onclick="carregarGalvanicaParaEdicao('${id}')" class="bg-zinc-800 text-[#caa85c] px-2 py-1.5 rounded text-[11px] font-bold">✏️</button>
                    <button onclick="excluirItem('galvanicas/${id}')" class="bg-red-950 text-red-400 px-2 py-1.5 rounded text-[11px]">✕</button>
                </div>
            </div>
        `);
    });
    container.innerHTML = parts.join('');
});

// ==========================================
// 4. PRODUTOS (GARGALO ELIMINADO + PAINEL DE STOCK ACTIVO)
// ==========================================
db.ref('products').limitToLast(60).on('value', snap => {
    const container = document.getElementById('lista-produtos');
    if (!snap.exists()) { container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhum produto cadastrado...</p>'; return; }

    let cacheHtml = [];
    snap.forEach(child => {
        const id = child.key;
        const p = child.val() || {};

        if (p.loja === "luary" || id.toLowerCase().includes("luary") || p.projeto === "luary") return; // [cite: 137]

        const precoFinal = parseFloat(p.price || p.precoFinal || 0); // [cite: 138]
        const imagemValida = p.image || p.imageUrl || 'https://via.placeholder.com/150';
        const emEstoque = p.estoque !== false;

        cacheHtml.push(`
            <div class="card p-3 flex gap-3 items-center relative border border-zinc-800">
                <img src="${imagemValida}" class="w-12 h-12 rounded-lg object-contain bg-zinc-950 p-1 shrink-0">
                <div class="truncate flex-1 space-y-0.5">
                    <div class="text-[9px] text-gray-500 font-mono">SKU: ${p.sku || id}</div>
                    <h4 class="text-xs font-bold text-white truncate">${p.name || p.nome || 'Sem nome'}</h4>
                    <p class="text-xs font-bold text-[#caa85c] font-mono">${fMoeda(precoFinal)}</p>
                </div>
                <div class="flex flex-col gap-1 shrink-0 items-end">
                    <button onclick="alterarPrecoRapido('${id}', ${precoFinal})" class="text-[10px] font-bold text-blue-400 hover:underline">Preço ✏️</button>
                    <button onclick="alternarEstoqueRapido('${id}', ${emEstoque})" class="text-[10px] font-bold ${emEstoque ? 'text-green-500' : 'text-red-500'} uppercase font-mono">${emEstoque ? 'Disponível' : 'Esgotado'}</button>
                </div>
                <button onclick="excluirItem('products/${id}')" class="text-zinc-600 hover:text-red-500 font-bold text-xs absolute top-1 right-2">✕</button>
            </div>
        `);
    });
    container.innerHTML = cacheHtml.join('');
});

function alterarPrecoRapido(id, precoAtual) {
    const novoPreco = parseFloat(prompt(`Alterar preço do SKU [${id}]:`, precoAtual));
    if (!isNaN(novoPreco) && novoPreco > 0) {
        db.ref('products/' + id).update({ price: novoPreco, precoFinal: novoPreco });
    }
}

function alternarEstoqueRapido(id, estadoAtual) {
    db.ref('products/' + id).update({ estoque: !estadoAtual });
}

// ==========================================
// 5. COLEÇÕES / CATEGORIAS COM MODAL DE EDIÇÃO
// ==========================================
db.ref('categories').on('value', snap => {
    const container = document.getElementById('lista-categories') || document.getElementById('lista-categorias');
    if (!snap.exists()) return;

    let buildHtml = [];
    snap.forEach(child => {
        const id = child.key; // [cite: 134]
        const cat = child.val() || {}; // [cite: 134]

        if (cat.loja === "luary" || id.toLowerCase().includes("luary") || cat.projeto === "luary") return; // [cite: 134]

        buildHtml.push(`
            <div class="card p-3 flex items-center justify-between gap-2 relative">
                <div class="flex items-center gap-3 truncate">
                    <img src="${cat.image || 'https://via.placeholder.com/150'}" class="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0">
                    <div class="truncate">
                        <h4 class="text-xs font-bold text-white uppercase truncate">${cat.name || 'Sem nome'}</h4>
                        <span class="text-[9px] text-gray-500 font-mono block truncate">${id}</span>
                    </div>
                </div>
                <div class="flex gap-1 shrink-0">
                    <button onclick="editarCategoria('${id}', '${cat.name}', '${cat.image || ''}')" class="bg-zinc-900 text-[#caa85c] font-bold p-1 rounded text-xs">✏️</button>
                    <button onclick="excluirItem('categories/${id}')" class="text-gray-500 hover:text-red-500 font-bold p-1 text-xs">✕</button>
                </div>
            </div>
        `);
    });
    container.innerHTML = buildHtml.join('');
});

function editarCategoria(id, nomeAtual, imgAtual) {
    const novoNome = prompt("Novo nome da Coleção:", nomeAtual);
    if (!novoNome) return;
    const novaImg = prompt("Nova URL da Imagem da Coleção:", imgAtual);
    
    db.ref('categories/' + id).update({
        name: novoNome,
        image: novaImg || ''
    }).then(() => alert("Coleção editada com sucesso!"));
}

function excluirItem(caminhoRef) {
    if (confirm(`Confirmar a exclusão permanente de [${caminhoRef}]?`)) {
        db.ref(caminhoRef).remove(); // [cite: 142]
    }
}

// ==========================================
// SEÇÃO: CARREGAMENTO & GRAVAÇÃO DAS SETTINGS (CORRIGIDO)
// ==========================================
db.ref('settings').on('value', snap => {
    // Se o usuário estiver focando em algum campo, evitamos sobrescrever para não atrapalhar a digitação
    if (document.activeElement && document.activeElement.classList.contains('input-adm')) {
        return; 
    }

    const settingsGerais = snap.val() || {};
    const emp = settingsGerais.empresa || {};

    // Mapeamento blindado para garantir que pegue o dado onde quer que esteja salvo
    document.getElementById('cfg-nome').value = settingsGerais.name || emp.nome || '';
    document.getElementById('cfg-slogan').value = settingsGerais.slogan || emp.slogan || '';
    document.getElementById('cfg-parcelas').value = settingsGerais.parcelas || 6;
    document.getElementById('cfg-pix').value = settingsGerais.pix || 5;
    document.getElementById('cfg-whatsapp').value = settingsGerais.whatsapp || emp.whatsapp || '';
});

function salvarConfig() {
    // Captura os elementos do DOM com segurança
    const nomeEl = document.getElementById('cfg-nome');
    const sloganEl = document.getElementById('cfg-slogan');
    const whatsappEl = document.getElementById('cfg-whatsapp');
    const parcelasEl = document.getElementById('cfg-parcelas');
    const pixEl = document.getElementById('cfg-pix');

    if (!nomeEl || !sloganEl || !whatsappEl || !parcelasEl || !pixEl) {
        alert("⚠️ Erro crítico: Alguns campos HTML não foram encontrados na página.");
        return;
    }

    const nomeInput = nomeEl.value.trim();
    const sloganInput = sloganEl.value.trim();
    const whatsappInput = whatsappEl.value.trim();
    
    // Força um fallback seguro caso o usuário deixe o campo de número em branco
    const parcelasInput = parseInt(parcelasEl.value) || 6;
    const pixInput = parseInt(pixEl.value) || 5;

    // Montagem da estrutura de dados aceita pelo Firebase
    const dados = {
        name: nomeInput,
        slogan: sloganInput,
        parcelas: parcelasInput,
        pix: pixInput,
        whatsapp: whatsappInput,
        empresa: {
            nome: nomeInput,
            slogan: sloganInput,
            whatsapp: whatsappInput
        }
    };

    console.log("Tentando salvar as seguintes configurações:", dados);

    // Executa a atualização diretamente no nó 'settings'
    db.ref('settings').update(dados)
    .then(() => {
        alert("✅ Configurações salvas e aplicadas em tempo real no catálogo!");
    })
    .catch(err => {
        alert("❌ Erro ao salvar dados administrativos. Verifique o console do navegador e as Regras do Firebase.");
        console.error("Detalhes do erro do Firebase:", err);
    });
}
function abrirModalProduto() {
    const nome = prompt("Nome do Novo Produto:"); if (!nome) return; // [cite: 148, 149]
    const sku = prompt("SKU único:").toUpperCase().trim(); if (!sku) return;
    const preco = parseFloat(prompt("Preço de Atacado (ex: 89.90):")) || 0;
    const cat = prompt("ID da Coleção/Categoria vinculada (ex: aneis):") || 'geral'; // [cite: 150]
    const img = prompt("URL da Imagem do modelo:");
    const pesoInput = prompt("Peso do Produto (ex: 4.5g ou apenas 4.5):") || '0g';

    db.ref('products/' + sku).set({
        name: nome, sku: sku, price: preco, precoFinal: preco,
        category: cat, image: img || '', peso: pesoInput, weight: pesoInput,
        projeto: 'abella_joias', estoque: true, criadoEm: Date.now() // [cite: 151, 152]
    });
}

function abrirModalCategoria() {
    const nome = prompt("Nome da Nova Coleção (ex: Braceletes):"); if (!nome) return; // [cite: 153]
    const id = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'); // [cite: 154]
    const img = prompt("URL da Imagem da Coleção:");
    db.ref('categories/' + id).set({ name: nome, image: img || '', projeto: 'abella_joias', paused: false }); // [cite: 155]
}
