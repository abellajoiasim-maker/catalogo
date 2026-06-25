import { Drawer } from './drawer.js';

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {},
    subcategoriasEmMemoria: {}, // Adicionado para suporte ao select

    init(firebaseDb, subcategoriasCache = {}) {
        const nóOficial = typeof window.getAbellaPath === 'function' 
            ? window.getAbellaPath('products') 
            : 'abella/products';

        this.dbRef = firebaseDb.ref(nóOficial);
        this.subcategoriasEmMemoria = subcategoriasCache;
        this._configurarEventosGerais();
        this.listarProdutos();
    },

    // ... [Manter _configurarEventosGerais, listarProdutos, renderProdutos, etc. inalterados] ...

    abrirNovoProduto(categorias = {}, subcategorias = {}) {
        this.subcategoriasEmMemoria = subcategorias; // Atualiza cache
        const formHtml = this._gerarFormularioHTML('novo', '', {}, categorias);
        Drawer.open({
            title: '➕ CADASTRAR NOVA JOIA',
            content: formHtml,
            width: '650px'
        });
        this._vincularOuvintesFormulario('novo');
    },

    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        const formHtml = this._gerarFormularioHTML('editar', id, produto, {});
        Drawer.open({
            title: `✏️ EDITAR PRODUTO`,
            content: formHtml,
            width: '650px'
        });
        this._vincularOuvintesFormulario(id);
    },

    _gerarFormularioHTML(modo, id = '', p = {}, categorias = {}) {
        const isEdit = modo === 'editar';
        
        // Mapeamento de valores
        const nomeValor = isEdit ? (p.nome || p.name || '') : '';
        const imgDesktop = isEdit ? (p.image || p.imagem || '') : '';
        const subcatSelecionada = isEdit ? (p.subcategoria || '') : '';

        // Gera as opções do select de subcategorias
        const optionsSubcat = Object.entries(this.subcategoriasEmMemoria).map(([id, sub]) => 
            `<option value="${id}" ${subcatSelecionada === id ? 'selected' : ''}>${sub.nome}</option>`
        ).join('');

        return `
            <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Preview (1:1)</label>
                    <div class="w-32 h-32 aspect-square bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl overflow-hidden flex items-center justify-center">
                        <img id="preview-modal-produto" src="${imgDesktop || ''}" class="w-full h-full object-cover" onerror="this.style.opacity='0'" onload="this.style.opacity='1'">
                    </div>
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Subcategoria</label>
                    <select id="prod-subcategoria" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white">
                        <option value="">Selecione uma subcategoria...</option>
                        ${optionsSubcat}
                    </select>
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL Imagem</label>
                    <input type="text" id="prod-image" value="${imgDesktop}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white">
                </div>

                <button id="btn-salvar-produto" class="w-full bg-[#caa85c] text-black font-black py-3 rounded-xl mt-4">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Cadastrar'}
                </button>
            </div>
        `;
    },

    async salvarProduto(idOuAcao) {
        // ... (código existente)
        const subcategoria = document.getElementById('prod-subcategoria')?.value;
        
        const dadosProduto = {
            // ... (campos anteriores)
            subcategoria: subcategoria, // Adicionado ao salvar
            updatedAt: Date.now()
        };
        // ... (resto da lógica de persistência)
    }
};
