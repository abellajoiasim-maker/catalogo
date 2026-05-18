// CONFIGURAÇÃO OFICIAL DO SEU FIREBASE
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

// CONTROLE DE NAVEGAÇÃO DE ABAS
// CONTROLE DE NAVEGAÇÃO DE ABAS ATUALIZADO
function mudarAba(idAba) {
    ['pedidos', 'editor', 'ofertas', 'produtos', 'categorias', 'config'].forEach(aba => {
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

// ==========================================
// SEÇÃO: GERENCIAMENTO DE PEDIDOS RECEBIDOS
// ==========================================
db.ref('orders').on('value', snap => {
    const container = document.getElementById('lista-pedidos');
    const badgeCount = document.getElementById('qtd-pedidos');
    container.innerHTML = '';

    if (!snap.exists()) {
        container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhum pedido recebido até o momento...</p>';
        badgeCount.innerText = "0 pedidos";
        return;
    }

    let count = 0;
    let htmlContent = '';

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

        htmlContent = `
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
                        <span class="text-lg font-black text-[#caa85c] font-mono">${o.total || 'R$ 0,00'}</span>
                    </div>
                    <button onclick="arquivarPedido('${id}')" class="bg-red-950 border border-red-800/40 text-red-400 hover:bg-red-900 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider">Arquivar</button>
                </div>
            </div>
        ` + htmlContent; // Mantém os pedidos mais novos no topo da lista
    });

    container.innerHTML = htmlContent;
    badgeCount.innerText = `${count} pedidos`;
});

function arquivarPedido(id) {
    if (confirm("Deseja realmente remover/arquivar este registro de pedido?")) {
        db.ref('orders/' + id).remove().shadow-xl;
    }
}

// ==========================================
// SEÇÃO: CATEGORIAS (COLEÇÕES) COM FILTRO PROTETOR
// ==========================================
db.ref('categories').on('value', snap => {
    const container = document.getElementById('lista-categorias');
    container.innerHTML = '';
    if (!snap.exists()) return;

    snap.forEach(child => {
        const id = child.key;
        const cat = child.val() || {};

        // FILTRO DE SEGURANÇA: Isola o painel contra dados da Luary Shop
        if (cat.loja === "luary" || id.toLowerCase().includes("luary") || cat.projeto === "luary") return;

        container.innerHTML += `
            <div class="card p-3 flex items-center gap-3 relative">
                <img src="${cat.image || 'https://via.placeholder.com/150'}" class="w-12 h-12 rounded-lg object-cover bg-zinc-950 shrink-0">
                <div class="truncate flex-1 pr-4">
                    <h4 class="text-xs font-bold text-white truncate uppercase">${cat.name || 'Sem nome'}</h4>
                    <span class="text-[9px] text-gray-500 font-mono block truncate">${id}</span>
                </div>
                <button onclick="excluirItem('categories/${id}')" class="text-gray-600 hover:text-red-500 text-xs absolute top-2 right-2 font-bold">✕</button>
            </div>
        `;
    });
});

// ==========================================
// SEÇÃO: PRODUTOS / MODELOS COM FILTRO PROTETOR
// ==========================================
db.ref('products').on('value', snap => {
    const container = document.getElementById('lista-produtos');
    container.innerHTML = '';
    if (!snap.exists()) return;

    snap.forEach(child => {
        const id = child.key;
        const p = child.val() || {};

        // FILTRO DE SEGURANÇA: Isola o painel contra dados da Luary Shop
        if (p.loja === "luary" || id.toLowerCase().includes("luary") || p.projeto === "luary") return;

        const precoFinal = parseFloat(p.price || p.precoFinal || 0);

        container.innerHTML += `
            <div class="card p-3 flex gap-3 items-center relative">
                <img src="${p.image || 'https://via.placeholder.com/150'}" class="w-14 h-14 rounded-lg object-contain bg-zinc-950 p-1 shrink-0">
                <div class="truncate flex-1 space-y-0.5">
                    <div class="flex justify-between items-center text-[10px] text-gray-500 font-mono pr-6">
                        <span>SKU: ${p.sku || 'N/A'}</span>
                    </div>
                    <h4 class="text-xs font-bold text-white truncate">${p.name || 'Sem nome'}</h4>
                    <p class="text-xs font-bold text-[#caa85c] font-mono">${fMoeda(precoFinal)}</p>
                </div>
                <button onclick="excluirItem('products/${id}')" class="text-gray-600 hover:text-red-500 text-xs absolute top-2 right-2 font-bold">✕</button>
            </div>
        `;
    });
});

function excluirItem(caminhoRef) {
    if (confirm(`Confirmar a exclusão permanente de [${caminhoRef}]?`)) {
        db.ref(caminhoRef).remove();
    }
}

// ==========================================
// SEÇÃO: CARREGAMENTO & GRAVAÇÃO DAS SETTINGS
// ==========================================
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
        alert("✅ Configurações salvas e aplicadas em tempo real no catálogo!");
    }).catch(err => {
        alert("Erro ao salvar dados administrativos.");
        console.error(err);
    });
}

// CRIAÇÃO SIMPLIFICADA DE ALERTAS DE OPERAÇÃO
function abrirModalProduto() {
    const nome = prompt("Nome do Novo Produto:");
    if (!nome) return;
    const sku = prompt("SKU único:");
    const preco = parseFloat(prompt("Preço de Atacado (ex: 89.90):")) || 0;
    const cat = prompt("ID da Coleção/Categoria vinculada (ex: aneis):");
    const img = prompt("URL da Imagem do modelo:");

    if (sku) {
        db.ref('products/' + sku).set({
            name: nome,
            sku: sku,
            price: preco,
            category: cat || 'geral',
            image: img || '',
            projeto: 'abella_joias',
            criadoEm: Date.now()
        });
    }
}

function abrirModalCategoria() {
    const nome = prompt("Nome da Nova Coleção (ex: Braceletes):");
    if (!nome) return;
    const id = nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
    const img = prompt("URL da Imagem da Coleção:");

    db.ref('categories/' + id).set({
        name: nome,
        image: img || '',
        projeto: 'abella_joias',
        paused: false
    });
}
