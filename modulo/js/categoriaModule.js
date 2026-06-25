import { Drawer } from './drawer.js';

export const CategoriaModule = {
    abaAtiva: 'produtos',
    dbRefCat: null,
    dbRefSub: null,
    categoriasEmMemoria: {},
    subcategoriasEmMemoria: {},

    init(firebaseDb) {
        const nóCat = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('categories') : 'abella/categories';
        const nóSub = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('subcategories') : 'abella/subcategories';

        this.dbRefCat = firebaseDb.ref(nóCat);
        this.dbRefSub = firebaseDb.ref(nóSub);

        this._ouvirBanco();
        this._configurarEventosAbas();
    },

    _ouvirBanco() {
        this.dbRefCat.on('value', (snap) => {
            this.categoriasEmMemoria = snap.val() || {};
            if (this.abaAtiva === 'categorias') this.renderCategorias();
        });
        this.dbRefSub.on('value', (snap) => {
            this.subcategoriasEmMemoria = snap.val() || {};
            if (this.abaAtiva === 'subcategorias') this.renderSubcategorias();
        });
    },

    // --- MÉTODOS DE AÇÃO (Devem existir para o Window acessar) ---
    abrirEditarCategoria(id) {
        const cat = this.categoriasEmMemoria[id];
        if (!cat) return;
        Drawer.open({
            title: '✏️ EDITAR CATEGORIA',
            content: `
                <input type="text" id="cat-nome-edit" value="${cat.nome || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white mb-4">
                <button onclick="window.salvarCategoria('${id}')" class="w-full bg-[#caa85c] py-3 rounded-xl font-black text-black">SALVAR ALTERAÇÕES</button>
            `
        });
    },

    async excluirCategoria(id) {
        if (confirm("Tem certeza que deseja excluir esta categoria?")) {
            await this.dbRefCat.child(id).remove();
        }
    },

    async salvarCategoria(id) {
        const nome = document.getElementById('cat-nome-edit').value;
        await this.dbRefCat.child(id).update({ nome });
        Drawer.close();
    },

    // --- Renderização ---
    renderCategorias() {
        const container = document.getElementById('lista-categorias-container');
        if (!container) return;

        container.innerHTML = Object.entries(this.categoriasEmMemoria).map(([id, c]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                    <div class="text-[10px] text-zinc-500 font-mono">ID: ${id}</div>
                    <div class="text-sm font-bold text-zinc-200 mt-0.5">${c.nome || 'Sem Nome'}</div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="window.editarCategoria('${id}')" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button onclick="window.excluirCategoria('${id}')" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    renderSubcategorias() {
        const container = document.getElementById('lista-subcategorias-container');
        if (!container) return;

        container.innerHTML = Object.entries(this.subcategoriasEmMemoria).map(([id, s]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl">
                <div>
                    <div class="text-sm font-bold text-zinc-200">${s.nome || 'Sem Nome'}</div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="window.editarSubcategoria('${id}')" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button onclick="window.excluirSubcategoria('${id}')" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    _configurarEventosAbas() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.abaAtiva = e.currentTarget.getAttribute('data-tab');
                if (this.abaAtiva === 'categorias') this.renderCategorias();
                if (this.abaAtiva === 'subcategorias') this.renderSubcategorias();
            });
        });
    }
};
