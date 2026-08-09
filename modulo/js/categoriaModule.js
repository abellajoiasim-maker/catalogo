import { Drawer } from './drawer.js';

export const CategoriaModule = {
    abaAtiva: 'produtos',
    dbRefCat: null,
    categoriasEmMemoria: {},

    init(firebaseDb) {
        this.dbRefCat = firebaseDb.ref(
            typeof window.getAbellaPath === 'function'
                ? window.getAbellaPath('categories')
                : 'abella/categories'
        );

        this._configurarEventosGlobais();
        this.listarCategorias();
    },

    _configurarEventosGlobais() {
        // Expõe ações via window para os botões gerados no innerHTML
        window.editarCategoria  = (id) => this.abrirEditarCategoria(id);
        window.excluirCategoria = (id) => this.excluirCategoria(id);
    },

    listarCategorias() {
        if (!this.dbRefCat) return Promise.resolve();
        return new Promise((resolve) => {
            this.dbRefCat.on('value', (snap) => {
                this.categoriasEmMemoria = snap.val() || {};
                this.renderCategorias();
                // Notifica outros módulos que precisam da lista de categorias
                window.dispatchEvent(new CustomEvent('categoriasAtualizadas', {
                    detail: this.categoriasEmMemoria
                }));
                resolve(this.categoriasEmMemoria);
            });
        });
    },

    renderCategorias() {
        const container = document.getElementById('lista-categorias-container');
        if (!container) return;

        const entradas = Object.entries(this.categoriasEmMemoria);
        if (!entradas.length) {
            container.innerHTML = `<p class="text-center py-10 text-zinc-600 text-sm">Nenhuma categoria cadastrada.</p>`;
            return;
        }

        container.innerHTML = entradas.map(([id, c]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                <div>
                    <div class="text-[10px] text-zinc-500 font-mono tracking-widest">ID: ${id}</div>
                    <div class="text-sm font-bold text-zinc-200 mt-0.5">${c.nome || c.name || 'Sem Nome'}</div>
                    ${c.slug ? `<div class="text-[10px] text-zinc-600 mt-0.5">slug: ${c.slug}</div>` : ''}
                </div>
                <div class="flex gap-1.5">
                    <button onclick="window.editarCategoria('${id}')"
                            class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button onclick="window.excluirCategoria('${id}')"
                            class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    // ── NOVA CATEGORIA ────────────────────────────────────────────────────────
    abrirNovaCategoria() {
        Drawer.open({
            title: '➕ NOVA CATEGORIA',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Categoria</label>
                        <input type="text" id="cat-nome" placeholder="Ex: Anéis"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Slug (opcional)</label>
                        <input type="text" id="cat-slug" placeholder="Ex: aneis"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                        <p class="text-[10px] text-zinc-600 mt-1">Deixe em branco para gerar automaticamente.</p>
                    </div>
                    <button id="btn-salvar-cat"
                            class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                        ➕ Criar Categoria
                    </button>
                </div>
            `,
            width: '500px'
        });

        document.getElementById('btn-salvar-cat').onclick = () => this._salvar('novo', '');
    },

    // ── EDITAR CATEGORIA ──────────────────────────────────────────────────────
    abrirEditarCategoria(id) {
        const c = this.categoriasEmMemoria[id];
        if (!c) return;

        Drawer.open({
            title: '✏️ EDITAR CATEGORIA',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Categoria</label>
                        <input type="text" id="cat-nome" value="${c.nome || c.name || ''}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Slug</label>
                        <input type="text" id="cat-slug" value="${c.slug || ''}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <button id="btn-salvar-cat"
                            class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                        💾 Salvar Alterações
                    </button>
                </div>
            `,
            width: '500px'
        });

        document.getElementById('btn-salvar-cat').onclick = () => this._salvar('editar', id);
    },

    async _salvar(modo, id) {
        const nome = document.getElementById('cat-nome')?.value?.trim();
        if (!nome) return alert('Informe o nome da categoria.');

        const slugDigitado = document.getElementById('cat-slug')?.value?.trim();
        const slug = slugDigitado || nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const btn = document.getElementById('btn-salvar-cat');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            if (modo === 'novo') {
                await this.dbRefCat.push({ nome, name: nome, slug, paused: false, criadoEm: Date.now() });
            } else {
                await this.dbRefCat.child(id).update({ nome, name: nome, slug, atualizadoEm: Date.now() });
            }
            Drawer.close();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar. Verifique o console.');
            btn.textContent = modo === 'novo' ? '➕ Criar Categoria' : '💾 Salvar Alterações';
            btn.disabled = false;
        }
    },

    async excluirCategoria(id) {
        const c = this.categoriasEmMemoria[id];
        const nome = c?.nome || c?.name || id;
        if (confirm(`Apagar a categoria "${nome}"? Subcategorias vinculadas não serão removidas.`)) {
            await this.dbRefCat.child(id).remove();
        }
    },

    // Subcategorias são renderizadas por SubcategoriaModule.
    renderSubcategorias() {
        return;
    }
};
