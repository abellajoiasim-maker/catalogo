const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const fM = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    event.currentTarget.classList.add('active');

    if(id === 'produtos') carregarDados('products', 'lista-produtos', renderProduto);
    if(id === 'categorias') carregarDados('categories', 'lista-categorias', renderCategoria);
    if(id === 'pedidos') carregarDados('orders', 'lista-pedidos', renderPedido);
}

function carregarDados(path, containerId, renderFunc) {
    db.ref(path).on('value', snapshot => {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        snapshot.forEach(child => {
            container.innerHTML += renderFunc(child.key, child.val());
        });
    });
}

const renderProduto = (id, p) => `
    <div class="item-card">
        <img src="${p.imagem}" style="width:100%; height:150px; object-fit:cover">
        <h4>${p.nome}</h4>
        <p>SKU: ${p.sku} | <b>${fM(p.preco)}</b></p>
        <div class="actions">
            <button onclick="excluirItem('products/${id}')" class="btn-del">🗑️</button>
        </div>
    </div>
`;

const renderCategoria = (id, c) => `
    <div class="item-card">
        <h4>${c.nome}</h4>
        <button onclick="excluirItem('categories/${id}')" class="btn-del">🗑️</button>
    </div>
`;

const renderPedido = (id, o) => `
    <div class="list-item">
        <span><b>Pedido #${id.slice(-5)}</b> - ${o.cliente}</span>
        <span>${fM(o.total)}</span>
        <button onclick="excluirItem('orders/${id}')" class="btn-del">🗑️</button>
    </div>
`;

function excluirItem(path) {
    if(confirm("Deseja apagar este item permanentemente do sistema?")) {
        db.ref(path).remove().then(() => alert("Removido com sucesso!"));
    }
}

function salvarEmpresa() {
    const dados = {
        nome: document.getElementById('emp-nome').value,
        whatsapp: document.getElementById('emp-whats').value
    };
    db.ref('empresa').set(dados).then(() => alert("Dados da Abella Joias updated!"));
}

function abrirModal(tipo) {
    const modal = document.getElementById('modal-admin');
    const body = document.getElementById('modal-form-body');
    modal.style.display = 'block';
    
    if(tipo === 'produto') {
        body.innerHTML = `
            <h3>Novo Produto</h3>
            <input type="text" id="n-nome" placeholder="Nome">
            <input type="text" id="n-sku" placeholder="SKU">
            <input type="number" id="n-preco" placeholder="Preço">
            <input type="text" id="n-img" placeholder="Link da Imagem">
            <button onclick="confirmarCadastro('products')">Cadastrar</button>
        `;
    }
}

function confirmarCadastro(path) {
    const obj = {
        nome: document.getElementById('n-nome').value,
        sku: document.getElementById('n-sku').value,
        preco: parseFloat(document.getElementById('n-preco').value),
        imagem: document.getElementById('n-img').value
    };
    db.ref(path).push(obj).then(() => {
        alert("Salvo!");
        fecharModal();
    });
}

function fecharModal() { document.getElementById('modal-admin').style.display = 'none'; }