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
        this.subcategoriasEmMemoria = subcategoriasCache || {};
        
        // Chamada segura dos métodos
        this._configurarEventosGerais();
        this.listarProdutos();
    },

    _configurarEventosGerais() {
        const containerLista = document.getElementById('lista-produtos-container');
        if (containerLista) {
            containerLista.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const acao = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');

                if (acao === 'editar') this.abrirEditarProduto(id);
                if (acao === 'excluir') this.excluirProduto(id);
            });
        }
    },

    listarProdutos() {
        this.dbRef.on('value', (snapshot) => {
            this.produtosEmMemoria = snapshot.val() || {};
            this.renderProdutos();
        });
    },

    renderProdutos() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        container.innerHTML = Object.entries(this.produtosEmMemoria).map(([id, p]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div class="flex items-center gap-4">
                    <img src="${p.image || ''}" class="w-12 h-12 rounded-lg object-cover bg-zinc-900">
                    <div>
                        <div class="text-sm font-bold text-zinc-200">${p.nome || 'Sem Nome'}</div>
                        <div class="text-[10px] text-zinc-500 font-mono">ID: ${id}</div>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button data-action="editar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black">✏️</button>
                    <button data-action="excluir" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    abrirNovoProduto(categorias = {}) {
        const formHtml = this._gerarFormularioHTML('novo', '', {}, categorias);
        Drawer.open({ title: '➕ CADASTRAR NOVA JOIA', content: formHtml, width: '650px' });
        this._vincularOuvintesFormulario('novo');
    },

    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;
        const formHtml = this._gerarFormularioHTML('editar', id, produto);
        Drawer.open({ title: '✏️ EDITAR PRODUTO', content: formHtml, width: '650px' });
        this._vincularOuvintesFormulario(id);
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
                    <select id="prod-subcategoria" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white">
                        <option value="">Selecione...</option>${optionsSubcat}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Joia</label>
                    <input type="text" id="prod-nome" value="${p.nome || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white">
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL Imagem</label>
                    <input type="text" id="prod-image" value="${p.image || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white">
                </div>
                <button id="btn-salvar-produto" class="w-full bg-[#caa85c] text-black font-black py-3 rounded-xl">SALVAR</button>
            </div>
        `;
    },

    _vincularOuvintesFormulario(idOuAcao) {
        document.getElementById('btn-salvar-produto').onclick = () => this.salvarProduto(idOuAcao);
    },

    async salvarProduto(idOuAcao) {
        const dados = {
            nome: document.getElementById('prod-nome').value,
            subcategoria: document.getElementById('prod-subcategoria').value,
            image: document.getElementById('prod-image').value,
            updatedAt: Date.now()
        };

        if (idOuAcao === 'novo') await this.dbRef.push({ ...dados, createdAt: Date.now() });
        else await this.dbRef.child(idOuAcao).update(dados);
        
        Drawer.close();
    },

    async excluirProduto(id) {
        if (confirm("Deseja apagar este produto?")) await this.dbRef.child(id).remove();
    }
};
