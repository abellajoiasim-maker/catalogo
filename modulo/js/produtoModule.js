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
        
        // Chamadas explícitas pelo nome do módulo para evitar erro de escopo
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
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div class="flex items-center gap-4">
                    <img src="${p.image || ''}" class="w-12 h-12 rounded-lg object-cover bg-zinc-900">
                    <div>
                        <div class="text-sm font-bold text-zinc-200">${p.nome || 'Sem Nome'}</div>
                        <div class="text-[10px] text-zinc-500 font-mono">SKU: ${p.sku || id}</div>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button data-action="editar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black">✏️</button>
                    <button data-action="excluir" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    abrirEditarProduto(id) {
        const p = this.produtosEmMemoria[id];
        if (!p) return;
        
        const optionsSubcat = Object.entries(this.subcategoriasEmMemoria).map(([subId, sub]) => 
            `<option value="${subId}" ${p.subcategoria === subId ? 'selected' : ''}>${sub.nome || sub.titulo || 'Sem Nome'}</option>`
        ).join('');

        const formHtml = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs text-zinc-400 font-bold">SKU</label><input type="text" id="prod-sku" value="${p.sku || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                    <div><label class="text-xs text-zinc-400 font-bold">Peso (g)</label><input type="number" id="prod-peso" value="${p.peso || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                </div>
                <div><label class="text-xs text-zinc-400 font-bold">Nome da Joia</label><input type="text" id="prod-nome" value="${p.nome || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs text-zinc-400 font-bold">Preço Base</label><input type="number" id="prod-preco" value="${p.preco || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                    <div><label class="text-xs text-zinc-400 font-bold">Preço Promocional</label><input type="number" id="prod-promocao" value="${p.promocao || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                </div>
                <div><label class="text-xs text-zinc-400 font-bold">Subcategoria</label><select id="prod-subcategoria" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"><option value="">Selecione...</option>${optionsSubcat}</select></div>
                <div><label class="text-xs text-zinc-400 font-bold">URL Imagem</label><input type="text" id="prod-image" value="${p.image || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white"></div>
                <button id="btn-salvar-produto" class="w-full bg-[#caa85c] text-black font-black py-3 rounded-xl mt-4">SALVAR ALTERAÇÕES</button>
            </div>
        `;

        Drawer.open({ title: '✏️ EDITAR PRODUTO', content: formHtml, width: '650px' });
        document.getElementById('btn-salvar-produto').onclick = () => ProdutoModule.salvarProduto(id);
    },

    async salvarProduto(id) {
        const dados = {
            sku: document.getElementById('prod-sku').value,
            peso: document.getElementById('prod-peso').value,
            nome: document.getElementById('prod-nome').value,
            preco: document.getElementById('prod-preco').value,
            promocao: document.getElementById('prod-promocao').value,
            subcategoria: document.getElementById('prod-subcategoria').value,
            image: document.getElementById('prod-image').value,
            updatedAt: Date.now()
        };
        await this.dbRef.child(id).update(dados);
        Drawer.close();
    },

    async excluirProduto(id) {
        if (confirm("Apagar produto?")) await this.dbRef.child(id).remove();
    }
};
