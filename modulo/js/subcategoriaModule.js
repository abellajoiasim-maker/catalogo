import { Drawer } from './drawer.js';

export const SubcategoriaModule = {
    dbRef: null,
    subcategoriasEmMemoria: {},
    categoriasEmMemoria: {},

    init(firebaseDb) {
        this.dbRef = firebaseDb.ref(
            typeof window.getAbellaPath === 'function'
                ? window.getAbellaPath('subcategories')
                : 'abella/subcategories'
        );

        this._configurarEventosGlobais();
        this.listarSubcategorias();

        // Ouve atualizações de categorias vindas do CategoriaModule
        window.addEventListener('categoriasAtualizadas', (e) => {
            this.categoriasEmMemoria = e.detail || {};
        });
    },

    _configurarEventosGlobais() {
        window.editarSubcategoria  = (id) => this.abrirEditarSubcategoria(id);
        window.excluirSubcategoria = (id) => this.excluirSubcategoria(id);
    },

    listarSubcategorias() {
        if (!this.dbRef) return Promise.resolve();
        return new Promise((resolve) => {
            this.dbRef.on('value', (snap) => {
                this.subcategoriasEmMemoria = snap.val() || {};
                this.renderSubcategorias();
                // Notifica ProdutoModule e outros que precisam do cache de subs
                window.dispatchEvent(new CustomEvent('subcategoriasAtualizadas', {
                    detail: this.subcategoriasEmMemoria
                }));
                resolve(this.subcategoriasEmMemoria);
            });
        });
    },

    renderSubcategorias() {
        const container = document.getElementById('lista-subcategorias-container');
        if (!container) return;

        const entradas = Object.entries(this.subcategoriasEmMemoria);
        if (!entradas.length) {
            container.innerHTML = `<p class="text-center py-10 text-zinc-600 text-sm">Nenhuma subcategoria cadastrada.</p>`;
            return;
        }

        container.innerHTML = entradas.map(([id, s]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                <div>
                    <div class="text-[10px] text-zinc-500 font-mono tracking-widest">ID: ${id}</div>
                    <div class="text-sm font-bold text-zinc-200 mt-0.5">${s.nome || s.name || 'Sem Nome'}</div>
                    <div class="text-[10px] text-zinc-600 mt-0.5 uppercase font-bold">
                        Categoria: ${this._nomeDaCategoria(s.categoriaId)}
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="window.editarSubcategoria('${id}')"
                            class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button onclick="window.excluirSubcategoria('${id}')"
                            class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    _nomeDaCategoria(catId) {
        if (!catId) return 'N/A';
        const c = this.categoriasEmMemoria[catId];
        return c ? (c.nome || c.name || catId) : catId;
    },

    _optsCategorias(selecionada = '') {
        return Object.entries(this.categoriasEmMemoria)
            .map(([id, c]) => `<option value="${id}" ${selecionada === id ? 'selected' : ''}>${c.nome || c.name || id}</option>`)
            .join('');
    },

    // ── NOVA SUBCATEGORIA ─────────────────────────────────────────────────────
    abrirNovaSubcategoria(categorias = {}) {
        if (Object.keys(categorias).length) this.categoriasEmMemoria = categorias;

        Drawer.open({
            title: '➕ NOVA SUBCATEGORIA',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Pai</label>
                        <select id="sub-cat-id"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>
                            ${this._optsCategorias()}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Subcategoria</label>
                        <input type="text" id="sub-nome" placeholder="Ex: Letra Tranversal com Cristal"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Slug (opcional)</label>
                        <input type="text" id="sub-slug" placeholder="Ex: letra-tranversal-com-cristal"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                        <p class="text-[10px] text-zinc-600 mt-1">Deixe em branco para gerar automaticamente.</p>
                    </div>
                    <button id="btn-salvar-sub"
                            class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                        ➕ Criar Subcategoria
                    </button>
                </div>
            `,
            width: '500px'
        });

        document.getElementById('btn-salvar-sub').onclick = () => this._salvar('novo', '');
    },

    // ── EDITAR SUBCATEGORIA ───────────────────────────────────────────────────
    abrirEditarSubcategoria(id) {
        const s = this.subcategoriasEmMemoria[id];
        if (!s) return;

        Drawer.open({
            title: '✏️ EDITAR SUBCATEGORIA',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Pai</label>
                        <select id="sub-cat-id"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>
                            ${this._optsCategorias(s.categoriaId || '')}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Subcategoria</label>
                        <input type="text" id="sub-nome" value="${s.nome || s.name || ''}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Slug</label>
                        <input type="text" id="sub-slug" value="${s.slug || ''}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <button id="btn-salvar-sub"
                            class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                        💾 Salvar Alterações
                    </button>
                </div>
            `,
            width: '500px'
        });

        document.getElementById('btn-salvar-sub').onclick = () => this._salvar('editar', id);
    },

    async _salvar(modo, id) {
        const nome     = document.getElementById('sub-nome')?.value?.trim();
        const catId    = document.getElementById('sub-cat-id')?.value?.trim();
        const slugDig  = document.getElementById('sub-slug')?.value?.trim();

        if (!nome)  return alert('Informe o nome da subcategoria.');
        if (!catId) return alert('Selecione a categoria pai.');

        const slug = slugDig || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const btn = document.getElementById('btn-salvar-sub');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            const dados = { nome, name: nome, slug, categoriaId: catId, atualizadoEm: Date.now() };
            if (modo === 'novo') {
                await this.dbRef.push({ ...dados, criadoEm: Date.now() });
            } else {
                await this.dbRef.child(id).update(dados);
            }
            Drawer.close();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar. Verifique o console.');
            btn.textContent = modo === 'novo' ? '➕ Criar Subcategoria' : '💾 Salvar Alterações';
            btn.disabled = false;
        }
    },

    async excluirSubcategoria(id) {
        const s = this.subcategoriasEmMemoria[id];
        const nome = s?.nome || s?.name || id;
        if (confirm(`Deletar a subcategoria "${nome}"?`)) {
            await this.dbRef.child(id).remove();
        }
    }
};
