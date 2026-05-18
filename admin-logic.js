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
        container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhum pedido ativo recebido...</p>';
        badgeCount.innerText = "0 pedidos";
        return;
    }

    let count = 0;
    let stackHtml = []; // Otimização extrema de memória

    snap.forEach(child => {
        const id = child.key; // [cite: 124]
        const o = child.val() || {}; // [cite: 124]
        count++;

        let itensHtml = '';
        if (Array.isArray(o.itens)) {
            o.itens.forEach(i => {
                itensHtml += `<li class="text-[11px] text-zinc-400 font-mono">• ${i.quantidade || i.qtd || 1}x ${i.nome || i.name} — <span class="text-[#caa85c]">${fMoeda(i.preco || i.price)}</span></li>`; // [cite: 124, 125]
            });
        }

        const rawTotal = o.total;
        const totalExibivel = typeof rawTotal === 'number' ? fMoeda(rawTotal) : (rawTotal || 'R$ 0,00'); // [cite: 131]
        const dataPedido = o.criadoEm ? new Date(o.criadoEm).toLocaleString('pt-BR') : 'Data Indefinida'; // [cite: 125]

        stackHtml.push(`
            <div class="card p-5 border-l-4 border-l-[#caa85c] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs bg-zinc-900 border border-zinc-800 text-gray-400 font-bold uppercase px-2 py-0.5 rounded">Pedido #${id.slice(-5)}</span>
                        <span class="text-[10px] text-gray-500 font-medium">${dataPedido}</span>
                    </div>
                    <p class="text-sm font-bold text-white">${o.cliente || o.nome || 'Cliente Oculto'}</p>
                    <p class="text-xs text-gray-400">📱 WhatsApp: <a href="https://wa.me/${o.telefone}" target="_blank" class="text-blue-400 underline font-mono">${o.telefone}</a></p>
                    <p class="text-xs text-gray-400">📍 Endereço: <span class="italic text-zinc-300">${o.endereco || 'Retirada / Não informado'}</span></p>
                    <ul class="mt-3 pt-2 border-t border-zinc-900 space-y-1">${itensHtml}</ul>
                </div>
                <div class="text-left md:text-right shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-900 flex md:flex-col justify-between items-center gap-2">
                    <div>
                        <span class="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valor Líquido</span>
                        <span class="text-lg font-black text-[#caa85c] font-mono">${totalExibivel}</span>
                    </div>
                    <button onclick="arquivarPedido('${id}')" class="bg-red-950 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-red-900">Arquivar</button>
                </div>
            </div>
        `);
    });

    container.innerHTML = stackHtml.reverse().join(''); // Mais novos sempre em primeiro [cite: 132]
    badgeCount.innerText = `${count} pedidos`; // 
});

function arquivarPedido(id) {
    if (confirm("Deseja realmente remover ou arquivar este pedido do painel?")) {
        db.ref('orders/' + id).remove(); // 
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
// 6. CARREGAMENTO & GRAVAÇÃO DAS SETTINGS (FIX SLOGAN)
// ==========================================
db.ref('settings').on('value', snap => {
    const settingsGerais = snap.val() || {};
    const emp = settingsGerais.empresa || settingsGerais;

    document.getElementById('cfg-nome').value = emp.nome || settingsGerais.name || '';
    document.getElementById('cfg-slogan').value = emp.slogan || settingsGerais.slogan || ''; // [cite: 143]
    document.getElementById('cfg-parcelas').value = settingsGerais.parcelas || emp.parcelas || 6;
    document.getElementById('cfg-pix').value = settingsGerais.pix || emp.pix || 5;
    document.getElementById('cfg-whatsapp').value = emp.whatsapp || settingsGerais.whatsapp || '';
});

function salvarConfig() {
    const nomeInput = document.getElementById('cfg-nome').value.trim();
    const sloganInput = document.getElementById('cfg-slogan').value.trim();
    const whatsappInput = document.getElementById('cfg-whatsapp').value.trim();

    const dados = {
        name: nomeInput,
        slogan: sloganInput, // [cite: 144]
        parcelas: parseInt(document.getElementById('cfg-parcelas').value) || 6,
        pix: parseInt(document.getElementById('cfg-pix').value) || 5,
        whatsapp: whatsappInput,
        empresa: {
            nome: nomeInput,
            slogan: sloganInput,
            whatsapp: whatsappInput
        }
    };
    db.ref('settings').update(dados).then(() => {
        alert("✅ Configurações e Slogan gravados com sucesso!");
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
