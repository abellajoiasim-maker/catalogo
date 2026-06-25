import { Drawer } from './drawer.js';

export const CategoriaModule = {
    dbRefCat: null,
    dbRefSub: null,
    categoriasEmMemoria: {},
    subcategoriasEmMemoria: {},
    abaAtiva: 'produtos', // 'produtos', 'categorias', 'subcategorias'

    init(firebaseDb) {
        // Define os caminhos dinâmicos oficiais baseados na estrutura Abella Joias
        const nóCat = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('categories') : 'abella/categories';
        const nóSub = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('subcategories') : 'abella/subcategories';

        this.dbRefCat = firebaseDb.ref(nóCat);
        this.dbRefSub = firebaseDb.ref(nóSub);

        this._ouvirBanco();
        this._configurarEventosAbas();
        this._configurarEventosAcoes();
    },

    _ouvirBanco() {
        // Sincroniza Categorias
        this.dbRefCat.on('value', (snapshot) => {
            this.categoriasEmMemoria = snapshot.val() || {};
            if (this.abaAtiva === 'categorias') this.renderCategorias();
        });

        // Sincroniza Subcategorias
        this.dbRefSub.on('value', (snapshot) => {
            this.subcategoriasEmMemoria = snapshot.val() || {};
            if (this.abaAtiva === 'subcategorias') this.renderSubcategorias();
        });
    },

_configurarEventosAbas() {
        // Mapeia os botões utilizando os atributos data-tab que já existem no seu HTML
        const btnProdutos = document.querySelector('button[data-tab="produtos"]');
        const btnCategorias = document.querySelector('button[data-tab="categorias"]');
        const btnSubcategorias = document.querySelector('button[data-tab="subcategorias"]');

        // Escuta os cliques diretamente nos botões mapeados (Padrão Vanilla JS seguro)
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
        // Busca pelo ID oficial ou pela classe dourada do Tailwind
        const btnCriar = document.getElementById('btnCriarNovo') || document.querySelector('.bg-\\[\\#caa85c\\]');
        if (btnCriar) {
            btnCriar.innerHTML = `<span>➕ Criar ${tipo}</span>`;
            
            // Converte para o termo exato esperado pela sua aplicação principal
            const contextoMap = { 'Produto': 'produtos', 'Categoria': 'categoria', 'Subcategoria': 'subcategoria' };
            btnCriar.setAttribute('data-contexto', contextoMap[tipo] || 'produtos');
        }
    },

    _configurarEventosAcoes() {
        const containerLista = document.getElementById('lista-produtos-container');
        if (!containerLista) return;

        containerLista.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-cat-action]');
            if (!btn) return;

            const acao = btn.getAttribute('data-cat-action');
            const id = btn.getAttribute('data-id');
            const tipo = btn.getAttribute('data-tipo'); // 'cat' ou 'sub'

            if (tipo === 'cat') {
                if (acao === 'editar') this.abrirEditarCategoria(id);
                if (acao === 'excluir') this.excluirCategoria(id);
            } else {
                if (acao === 'editar') this.abrirEditarSubcategoria(id);
                if (acao === 'excluir') this.excluirSubcategoria(id);
            }
        });
    },

    /* =========================================================================
       RENDERIZADORES DE LISTA (Injetados dinamicamente no container principal)
       ========================================================================= */

    renderCategorias() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        const ids = Object.keys(this.categoriasEmMemoria);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500 text-xs uppercase tracking-wider font-bold">Nenhuma categoria cadastrada.</div>`;
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
                        <div class="text-[11px] text-[#caa85c] font-medium mt-0.5">Slug/Filtro: ${c.slug || id}</div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button data-cat-action="editar" data-tipo="cat" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all text-xs">✏️</button>
                        <button data-cat-action="excluir" data-tipo="cat" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs">🗑️</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    renderSubcategorias() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        const ids = Object.keys(this.subcategoriesEmMemoria || this.subcategoriasEmMemoria);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500 text-xs uppercase tracking-wider font-bold">Nenhuma subcategoria cadastrada.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const s = this.subcategoriasEmMemoria[id];
            const nomePai = this.categoriasEmMemoria[s.categoriaPai]?.nome || s.categoriaPai || 'Nenhuma';
            html += `
                <div class="flex items-center justify-between p-4 mb-2 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                    <div>
                        <div class="text-[10px] text-zinc-500 font-mono">ID: ${id} • Categoria Pai: <span class="text-zinc-400">${nomePai}</span></div>
                        <div class="text-sm font-bold text-zinc-200 mt-0.5">${s.nome || s.name || 'Sem Nome'}</div>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button data-cat-action="editar" data-tipo="sub" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all text-xs">✏️</button>
                        <button data-cat-action="excluir" data-tipo="sub" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs">🗑️</button>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    /* =========================================================================
       FORMULÁRIOS E PERSISTÊNCIA NO DRAWER
       ========================================================================= */

    abrirCriarCategoria() {
        const form = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Categoria</label>
                    <input type="text" id="cat-nome" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="Ex: Anéis, Pulseiras">
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Slug / Identificador Técnico (Sem espaços ou acentos)</label>
                    <input type="text" id="cat-slug" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="Ex: aneis, pulseiras">
                </div>
                <button id="btn-salvar-cat" type="button" class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-opacity mt-4 text-xs uppercase">💾 Cadastrar Categoria</button>
            </div>
        `;
        Drawer.open({ title: '📁 NOVA CATEGORIA DE JOIAS', content: form, width: '450px' });
        setTimeout(() => document.getElementById('btn-salvar-cat')?.addEventListener('click', () => this.salvarCategoria('novo')), 100);
    },

    abrirEditarCategoria(id) {
        const c = this.categoriasEmMemoria[id];
        if (!c) return;
        const form = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Categoria</label>
                    <input type="text" id="cat-nome" value="${c.nome || c.name || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Slug / Identificador Técnico</label>
                    <input type="text" id="cat-slug" value="${c.slug || id}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                </div>
                <button id="btn-salvar-cat" type="button" class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-opacity mt-4 text-xs uppercase">💾 Salvar Modificações</button>
            </div>
        `;
        Drawer.open({ title: '✏️ EDITAR CATEGORIA', content: form, width: '450px' });
        setTimeout(() => document.getElementById('btn-salvar-cat')?.addEventListener('click', () => this.salvarCategoria(id)), 100);
    },

    async salvarCategoria(id) {
        const nome = document.getElementById('cat-nome')?.value.trim();
        const slug = document.getElementById('cat-slug')?.value.trim().toLowerCase();

        if (!nome || !slug) return alert("Preencha todos os campos!");

        const payload = { nome, name: nome, slug, updatedAt: Date.now() };

        if (id === 'novo') {
            await this.dbRefCat.child(slug).set(payload);
        } else {
            await this.dbRefCat.child(id).update(payload);
        }
        Drawer.close();
    },

    async excluirCategoria(id) {
        if (confirm("Deletar esta categoria permanentemente?")) {
            await this.dbRefCat.child(id).remove();
        }
    },

    // --- Subcategorias ---
    abrirCriarSubcategoria() {
        let opcoesCat = '';
        Object.keys(this.categoriasEmMemoria).forEach(key => {
            opcoesCat += `<option value="${key}">${this.categoriasEmMemoria[key].nome || key}</option>`;
        });

        const form = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Vinculada (Mãe)</label>
                    <select id="sub-pai" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                        ${opcoesCat}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Subcategoria</label>
                    <input type="text" id="sub-nome" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="Ex: Choker, Argolas, Aparadores">
                </div>
                <button id="btn-salvar-sub" type="button" class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-opacity mt-4 text-xs uppercase">💾 Cadastrar Subcategoria</button>
            </div>
        `;
        Drawer.open({ title: '🌿 NOVA SUBCATEGORIA DE JOIAS', content: form, width: '450px' });
        setTimeout(() => document.getElementById('btn-salvar-sub')?.addEventListener('click', () => this.salvarSubcategoria('novo')), 100);
    },

    abrirEditarSubcategoria(id) {
        const s = this.subcategoriasEmMemoria[id];
        if (!s) return;

        let opcoesCat = '';
        Object.keys(this.categoriasEmMemoria).forEach(key => {
            const sel = s.categoriaPai === key ? 'selected' : '';
            opcoesCat += `<option value="${key}" ${sel}>${this.categoriasEmMemoria[key].nome || key}</option>`;
        });

        const form = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Vinculada (Mãe)</label>
                    <select id="sub-pai" class="w-full bg-zinc-900 border border-zinc-900 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                        ${opcoesCat}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Subcategoria</label>
                    <input type="text" id="sub-nome" value="${s.nome || s.name || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                </div>
                <button id="btn-salvar-sub" type="button" class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-opacity mt-4 text-xs uppercase">💾 Salvar Modificações</button>
            </div>
        `;
        Drawer.open({ title: '✏️ EDITAR SUBCATEGORIA', content: form, width: '450px' });
        setTimeout(() => document.getElementById('btn-salvar-sub')?.addEventListener('click', () => this.salvarSubcategoria(id)), 100);
    },

    async salvarSubcategoria(id) {
        const categoriaPai = document.getElementById('sub-pai')?.value;
        const nome = document.getElementById('sub-nome')?.value.trim();

        if (!nome || !categoriaPai) return alert("Preencha todos os campos!");

        const payload = { nome, name: nome, categoriaPai, updatedAt: Date.now() };

        if (id === 'novo') {
            await this.dbRefSub.push(payload);
        } else {
            await this.dbRefSub.child(id).update(payload);
        }
        Drawer.close();
    },

    async excluirSubcategoria(id) {
        if (confirm("Deletar esta subcategoria permanentemente?")) {
            await this.dbRefSub.child(id).remove();
        }
    }
};
