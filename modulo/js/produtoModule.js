import { Drawer } from './drawer.js';

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {},
    subcategoriasEmMemoria: {},

    init(firebaseDb, subcategoriasCache = {}) {
        const nóOficial = typeof window.getAbellaPath === 'function' 
            ? window.getAbellaPath('products') 
            : 'abella/products';

        this.dbRef = firebaseDb.ref(nóOficial);
        // Garante que o cache não seja undefined
        this.subcategoriasEmMemoria = subcategoriasCache || {};
        
        // Chamadas protegidas
        ProdutoModule._configurarEventosGerais();
        ProdutoModule.listarProdutos();
    },

    _configurarEventosGerais() {
        const containerLista = document.getElementById('lista-produtos-container');
        if (containerLista) {
            containerLista.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const acao = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');

                if (acao === 'editar') ProdutoModule.abrirEditarProduto(id);
                if (acao === 'excluir') ProdutoModule.excluirProduto(id);
            });
        }
    },

    listarProdutos() {
        if (!this.dbRef) return;
        this.dbRef.on('value', (snapshot) => {
            this.produtosEmMemoria = snapshot.val() || {};
            ProdutoModule.renderProdutos();
        });
    },

    renderProdutos() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        container.innerHTML = Object.entries(this.produtosEmMemoria).map(([id, p]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                <div class="flex items-center gap-4">
                    <img src="${p.image || ''}" class="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800" onerror="this.src='https://via.placeholder.com/48'">
                    <div>
                        <div class="text-sm font-bold text-zinc-200">${p.nome || 'Sem Nome'}</div>
                        <div class="text-[10px] text-zinc-500 font-mono">ID: ${id}</div>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button data-action="editar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button data-action="excluir" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('') || '<div class="text-center p-8 text-zinc-500 text-xs">Nenhum produto cadastrado.</div>';
    },

    abrirNovoProduto(subcategorias = {}) {
        this.subcategoriasEmMemoria = subcategorias; // Atualiza para o estado mais recente
        const formHtml = ProdutoModule._gerarFormularioHTML('novo', '', {});
        Drawer.open({ title: '➕ CADASTRAR NOVA JOIA', content: formHtml, width: '650px' });
        ProdutoModule._vincularOuvintesFormulario('novo');
    },

    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;
        const formHtml = ProdutoModule._gerarFormularioHTML('editar', id, produto);
        Drawer.open({ title: '✏️ EDITAR PRODUTO', content: formHtml, width: '650px' });
        ProdutoModule._vincularOuvintesFormulario(id);
    },

    _gerarFormularioHTML(modo, id, p = {}) {
        const isEdit = modo === 'editar';
        const optionsSubcat = Object.entries(this.subcategoriasEmMemoria).map(([subId, sub]) => 
            `<option value="${subId}" ${p.subcategoria === subId ? 'selected' : ''}>${sub.nome || 'Sem Nome'}</option>`
        ).join('');

        return `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Subcategoria</label>
                    <select id="prod-subcategoria" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm">
                        <option value="">Selecione uma subcategoria...</option>${optionsSubcat}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Joia</label>
                    <input type="text" id="prod-nome" value="${p.nome || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm">
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL Imagem</label>
                    <input type="text" id="prod-image" value="${p.image || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm">
                </div>
                <button id="btn-salvar-produto" class="w-full bg-[#caa85c] text-black font-black py-3 rounded-xl hover:bg-opacity-90 transition-all">SALVAR ALTERAÇÕES</button>
            </div>
        `;
    },

    _vincularOuvintesFormulario(idOuAcao) {
        const btn = document.getElementById('btn-salvar-produto');
        if (btn) btn.onclick = () => ProdutoModule.salvarProduto(idOuAcao);
    },

    async salvarProduto(idOuAcao) {
        const dados = {
            nome: document.getElementById('prod-nome').value,
            subcategoria: document.getElementById('prod-subcategoria').value,
            image: document.getElementById('prod-image').value,
            updatedAt: Date.now()
        };

        if (!dados.nome) return alert("Nome é obrigatório!");

        if (idOuAcao === 'novo') await this.dbRef.push({ ...dados, createdAt: Date.now() });
        else await this.dbRef.child(idOuAcao).update(dados);
        
        Drawer.close();
    },

    async excluirProduto(id) {
        if (confirm("Deseja apagar este produto?")) await this.dbRef.child(id).remove();
    }
};
