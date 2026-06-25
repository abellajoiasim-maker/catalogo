export const CategoriaModule = {
    abaAtiva: 'produtos',
    dbRefCat: null,
    dbRefSub: null,
    categoriasEmMemoria: {},
    subcategoriasEmMemoria: {},

    init(firebaseDb) {
        // Vincula as referências oficiais usando as funções globais da Abella Joias
        const nóCat = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('categories') : 'abella/categories';
        const nóSub = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('subcategories') : 'abella/subcategories';

        this.dbRefCat = firebaseDb.ref(nóCat);
        this.dbRefSub = firebaseDb.ref(nóSub);

        this._ouvirBanco();
        this._configurarEventosAbas();
    },

    _ouvirBanco() {
        this.dbRefCat.on('value', (snapshot) => {
            this.categoriasEmMemoria = snapshot.val() || {};
            if (this.abaAtiva === 'categorias') this.renderCategorias();
        });

        this.dbRefSub.on('value', (snapshot) => {
            this.subcategoriasEmMemoria = snapshot.val() || {};
            if (this.abaAtiva === 'subcategorias') this.renderSubcategorias();
        });
    },

    _configurarEventosAbas() {
        // Seletores totalmente nativos e imunes a erros de sintaxe do navegador
        const btnProdutos = document.querySelector('button[data-tab="produtos"]');
        const btnCategorias = document.querySelector('button[data-tab="categorias"]');
        const btnSubcategorias = document.querySelector('button[data-tab="subcategorias"]');

        if (btnProdutos) {
            btnProdutos.addEventListener('click', () => {
                this.abaAtiva = 'produtos';
                this._atualizarBotaoCriar('Produto');
            });
        }

        if (btnCategorias) {
            btnCategorias.addEventListener('click', () => {
                this.abaAtiva = 'categorias';
                this._atualizarBotaoCriar('Categoria');
                this.renderCategorias();
            });
        }

        if (btnSubcategorias) {
            btnSubcategorias.addEventListener('click', () => {
                this.abaAtiva = 'subcategorias';
                this._atualizarBotaoCriar('Subcategoria');
                this.renderSubcategorias();
            });
        }
    },

    _atualizarBotaoCriar(tipo) {
        const btnCriar = document.getElementById('btnCriarNovo') || document.querySelector('.bg-\\[\\#caa85c\\]');
        if (btnCriar) {
            btnCriar.innerHTML = `<span>➕ Criar ${tipo}</span>`;
            const mapa = { 'Produto': 'produtos', 'Categoria': 'categoria', 'Subcategoria': 'subcategoria' };
            btnCriar.setAttribute('data-contexto', mapa[tipo] || 'produtos');
        }
    },

    renderCategorias() {
        const container = document.getElementById('lista-categorias-container');
        if (!container) return;

        const ids = Object.keys(this.categoriasEmMemoria);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500 text-xs uppercase font-bold">Nenhuma categoria cadastrada.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const c = this.categoriasEmMemoria[id];
            html += `
                <div class="flex items-center justify-between p-4 mb-2 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                    <div>
                        <div class="text-[10px] text-zinc-500 font-mono">ID: ${id}</div>
                        <div class="text-sm font-bold text-zinc-200 mt-0.5">${c.nome || c.name || 'Sem Nome'}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderSubcategorias() {
        const container = document.getElementById('lista-subcategorias-container');
        if (!container) return;

        const ids = Object.keys(this.subcategoriasEmMemoria);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500 text-xs uppercase font-bold">Nenhuma subcategoria cadastrada.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const s = this.subcategoriasEmMemoria[id];
            html += `
                <div class="flex items-center justify-between p-4 mb-2 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                    <div>
                        <div class="text-sm font-bold text-zinc-200 mt-0.5">${s.nome || s.name || 'Sem Nome'}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
};
