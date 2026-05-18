// CONFIGURAÇÃO OFICIAL E SEGURA DO FIREBASE
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

const fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// CONTROLE DE NAVEGAÇÃO DE ABAS SEM DELAY
function mudarAba(idAba) {
    ['pedidos', 'editor', 'ofertas', 'galvanicas', 'produtos', 'categorias', 'config'].forEach(aba => {
        const elementoAba = document.getElementById(`aba-${aba}`);
        const elementoBtn = document.getElementById(`btn-${aba}`);
        if(elementoAba) elementoAba.classList.add('hidden');
        if(elementoBtn) elementoBtn.classList.remove('active');
    });

    const abaAlvo = document.getElementById(`aba-${idAba}`);
    const btnAlvo = document.getElementById(`btn-${idAba}`);
    if(abaAlvo) abaAlvo.classList.remove('hidden');
    if(btnAlvo) btnAlvo.classList.add('active');
}

// ===================================================
// OTIMIZAÇÃO: MONITORAMENTO DE PEDIDOS RECEBIDOS
// ===================================================
db.ref('orders').on('value', snap => {
    const container = document.getElementById('lista-pedidos');
    const badgeCount = document.getElementById('qtd-pedidos');
    
    if (!snap.exists()) {
        container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhum pedido recebido até o momento...</p>';
        badgeCount.innerText = "0 pedidos";
        return;
    }

    let count = 0;
    let blocoHtml = ''; // Injeção de string única para performance total

    snap.forEach(child => {
        const id = child.key;
        const o = child.val() || {};
        count++;

        let itensHtml = '';
        if (Array.isArray(o.itens)) {
            o.itens.forEach(i => {
                itensHtml += `<li class="text-[11px] text-zinc-400 font-mono">• ${i.quantidade}x ${i.nome} — <span class="text-[#caa85c]">${fMoeda(i.preco)}</span></li>`;
            });
        }

        const dataPedido = o.criadoEm ? new Date(o.criadoEm).toLocaleString('pt-BR') : 'Data Indefinida';

        blocoHtml = `
            <div class="card p-5 border-l-4 border-l-[#caa85c] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="space-y-1 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs bg-zinc-900 border border-zinc-800 text-gray-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">Pedido #${id.slice(-5)}</span>
                        <span class="text-[10px] text-gray-500 font-medium">${dataPedido}</span>
                    </div>
                    <p class="text-sm font-bold text-white">${o.cliente || 'Cliente oculto'}</p>
                    <p class="text-xs text-gray-400">📱 WhatsApp: <a href="https://wa.me/${o.telefone}" target="_blank" class="text-blue-400 underline font-mono">${o.telefone}</a></p>
                    <p class="text-xs text-gray-400">📍 Endereço: <span class="italic text-zinc-300">${o.endereco || 'Não preenchido'}</span></p>
                    <ul class="mt-3 pt-2 border-t border-zinc-900 space-y-1">${itensHtml}</ul>
                </div>
                <div class="text-left md:text-right shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-zinc-900 flex md:flex-col justify-between items-center gap-2">
                    <div>
                        <span class="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valor Líquido</span>
                        <span class="text-lg font-black text-[#caa85c] font-mono">${fMoeda(o.total)}</span>
                    </div>
                    <button onclick="arquivarPedido('${id}')" class="bg-red-950 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider">Arquivar</button>
                </div>
            </div>
        ` + blocoHtml;
    });

    container.innerHTML = blocoHtml;
    badgeCount.innerText = `${count} pedidos`;
});

function arquivarPedido(id) {
    if (confirm("Deseja realmente remover/arquivar este registro de pedido?")) {
        db.ref('orders/' + id).remove();
    }
}

// ===================================================
// SEÇÃO: INTELIGÊNCIA E CADASTRO DE GALVÂNICAS
// ===================================================
function salvarGalvanica() {
    const nome = document.getElementById('galv-nome').value.trim();
    const selo = document.getElementById('galv-selo').value.trim();
    const endereco = document.getElementById('galv-endereco').value.trim();
    const telefone = document.getElementById('galv-telefone').value.trim();
    const whatsapp = document.getElementById('galv-whatsapp').value.trim();
    const imagem = document.getElementById('galv-imagem').value.trim();
    const descricao = document.getElementById('galv-descricao').value.trim();

    if(!nome || !whatsapp) {
        alert("⚠️ Nome e WhatsApp são obrigatórios para a homologação!");
        return;
    }

    const idRef = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');

    db.ref('galvanicas/' + idRef).set({
        nome, selo, endereco, telefone, whatsapp, imagem, descricao,
        projeto: 'abella_joias'
    }).then(() => {
        alert("🚚 Parceiro Galvânico homologado com sucesso!");
        // Limpar inputs
        ['galv-nome','galv-selo','galv-endereco','galv-telefone','galv-whatsapp','galv-imagem','galv-descricao'].forEach(i => document.getElementById(i).value = '');
    });
}

// Monitoramento Otimizado das Galvânicas no Admin
db.ref('galvanicas').on('value', snap => {
    const container = document.getElementById('lista-galvanicas-adm');
    if(!snap.exists()) {
        container.innerHTML = "<p class='text-xs text-gray-500 italic'>Nenhuma galvânica cadastrada.</p>";
        return;
    }
    let html = '';
    snap.forEach(child => {
        const id = child.key;
        const g = child.val() || {};
        html += `
            <div class="card p-4 flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 truncate">
                    <img src="${g.imagem || 'https://via.placeholder.com/60'}" class="w-10 h-10 object-contain rounded bg-black p-0.5 shrink-0">
                    <div class="truncate">
                        <h4 class="text-xs font-bold text-white uppercase truncate">${g.nome}</h4>
                        <p class="text-[10px] text-[#caa85c] font-mono truncate">WA: ${g.whatsapp}</p>
                    </div>
                </div>
                <button onclick="excluirItem('galvanicas/${id}')" class="bg-red-950 text-red-400 p-2 rounded hover:bg-red-900 hover:text-white transition text-[10px]">✕</button>
            </div>
        `;
    });
    container.innerHTML = html;
});

// ===================================================
// OTIMIZAÇÃO: CARREGAMENTO VEIO COM LIMITAÇÃO (PRODUTOS)
// ===================================================
db.ref('products').limitToLast(50).on('value', snap => {
    const container = document.getElementById('lista-produtos');
    if (!snap.exists()) { container.innerHTML = ''; return; }

    let html = '';
    snap.forEach(child => {
        const id = child.key;
        const p = child.val() || {};

        if (p.loja === "luary" || id.toLowerCase().includes("luary") || p.projeto === "luary") return;
        const precoFinal = parseFloat(p.price || p.precoFinal || 0);

        html += `
            <div class="card p-3 flex gap-3 items-center relative">
                <img src="${p.image || 'https://via.placeholder.com/150'}" class="w-12 h-12 rounded-lg object-contain bg-zinc-950 p-1 shrink-0">
                <div class="truncate flex-1 space-y-0.5">
                    <div class="text-[9px] text-gray-500 font-mono">SKU: ${p.sku || 'N/A'}</div>
                    <h4 class="text-xs font-bold text-white truncate">${p.name || 'Sem nome'}</h4>
                    <p class="text-xs font-bold text-[#caa85c] font-mono">${fMoeda(precoFinal)}</p>
                </div>
                <button onclick="excluirItem('products/${id}')" class="text-gray-500 hover:text-red-500 text-xs absolute top-2 right-2 font-bold">✕</button>
            </div>
        `;
    });
    container.innerHTML = html;
});

// CATEGORIAS OTIMIZADO
db.ref('categories').on('value', snap => {
    const container = document.getElementById('lista-categorias');
    if (!snap.exists()) { container.innerHTML = ''; return; }

    let html = '';
    snap.forEach(child => {
        const id = child.key;
        const cat = child.val() || {};

        if (cat.loja === "luary" || id.toLowerCase().includes("luary") || cat.projeto === "luary") return;

        html += `
            <div class="card p-3 flex items-center gap-3 relative">
                <img src="${cat.image || 'https://via.placeholder.com/150'}" class="w-10 h-10 rounded-lg object-cover bg-zinc-950 shrink-0">
                <div class="truncate flex-1">
                    <h4 class="text-xs font-bold text-white truncate uppercase">${cat.name || 'Sem nome'}</h4>
                    <span class="text-[9px] text-gray-500 font-mono block truncate">${id}</span>
                </div>
                <button onclick="excluirItem('categories/${id}')" class="text-gray-500 hover:text-red-500 text-xs absolute top-2 right-2 font-bold">✕</button>
            </div>
        `;
    });
    container.innerHTML = html;
});

function excluirItem(caminhoRef) {
    if (confirm(`Confirmar a exclusão permanente de [${caminhoRef}]?`)) {
        db.ref(caminhoRef).remove();
    }
}

// CARREGAMENTO & GRAVAÇÃO DAS SETTINGS
db.ref('settings').on('value', snap => {
    const settingsGerais = snap.val() || {};
    const emp = settingsGerais.empresa || settingsGerais;

    document.getElementById('cfg-nome').value = emp.nome || settingsGerais.name || '';
    document.getElementById('cfg-slogan').value = emp.slogan || '';
    document.getElementById('cfg-parcelas').value = settingsGerais.parcelas || emp.parcelas || 6;
    document.getElementById('cfg-pix').value = settingsGerais.pix || emp.pix || 5;
    document.getElementById('cfg-whatsapp').value = emp.whatsapp || settingsGerais.whatsapp || '';
});

function salvarConfig() {
    const dados = {
        name: document.getElementById('cfg-nome').value.trim(),
        parcelas: parseInt(document.getElementById('cfg-parcelas').value) || 6,
        pix: parseInt(document.getElementById('cfg-pix').value) || 5,
        whatsapp: document.getElementById('cfg-whatsapp').value.trim(),
        empresa: {
            nome: document.getElementById('cfg-nome').value.trim(),
            slogan: document.getElementById('cfg-slogan').value.trim(),
            whatsapp: document.getElementById('cfg-whatsapp').value.trim()
        }
    };
    db.ref('settings').update(dados).then(() => {
        alert("✅ Configurações salvas com sucesso!");
    });
}

function abrirModalProduto() {
    const nome = prompt("Nome do Novo Produto:"); if (!nome) return;
    const sku = prompt("SKU único:"); if (!sku) return;
    const preco = parseFloat(prompt("Preço de Atacado (ex: 89.90):")) || 0;
    const cat = prompt("ID da Coleção (ex: aneis):") || 'geral';
    const img = prompt("URL da Imagem:");

    db.ref('products/' + sku).set({
        name: nome, sku: sku.toUpperCase(), price: preco, category: cat, image: img || '',
        projeto: 'abella_joias', criadoEm: Date.now()
    });
}

function abrirModalCategoria() {
    const nome = prompt("Nome da Nova Coleção (ex: Braceletes):"); if (!nome) return;
    const id = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const img = prompt("URL da Imagem da Coleção:");

    db.ref('categories/' + id).set({
        name: nome, image: img || '', projeto: 'abella_joias', paused: false
    });
}
