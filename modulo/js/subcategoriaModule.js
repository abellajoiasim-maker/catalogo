import { Drawer } from './drawer.js';

export const SubcategoriaModule = {
    dbRef: null,
    subcategoriasEmMemoria: {},

    /**
     * Inicializa o módulo de subcategorias
     */
    init(firebaseDb, path = 'subcategorias') {
        this.dbRef = firebaseDb.ref(path);
        this._configurarEventosGerais();
        this.listarSubcategorias();
    },

    /**
     * Event Delegation para os botões das subcategorias
     */
    _configurarEventosGerais() {
        const containerLista = document.getElementById('lista-subcategorias-container');
        if (containerLista) {
            containerLista.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const acao = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');

                switch (acao) {
                    case 'editar': this.abrirEditarSubcategoria(id); break;
                    case 'excluir': this.excluirSubcategoria(id); break;
                }
            });
        }
    },

    listarSubcategorias() {
        this.dbRef.on('value', (snapshot) => {
            const dados = snapshot.val();
            this.subcategoriasEmMemoria = dados || {};
            this.renderSubcategorias(this.subcategoriasEmMemoria);
            
            window.dispatchEvent(new CustomEvent('subcategoriasAtualizadas', { detail: this.subcategoriasEmMemoria }));
        });
    },

    renderSubcategorias(subcategorias) {
        const container = document.getElementById('lista-subcategorias-container');
        if (!container) return;

        const ids = Object.keys(subcategorias);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-zinc-500 text-xs">Nenhuma subcategoria cadastrada.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const sub = subcategorias[id];
            html += `
                <div class="flex items-center justify-between p-3 mb-2 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                    <div>
                        <div class="text-xs text-zinc-500 font-mono">ID: ${id}</div>
                        <div class="text-sm font-bold text-zinc-200">${sub.nome || 'Sem Nome'}</div>
                        <div class="text-[10px] text-zinc-400">Pai (Cat ID): <span class="font-mono text-[#caa85c]">${sub.categoriaId || '-'}</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="editar" data-id="${id}" class="p-2 bg-zinc-800 text-zinc-300 rounded hover:bg-[#caa85c] hover:text-black transition-colors" title="Editar">
                            ✏️
                        </button>
                        <button data-action="excluir" data-id="${id}" class="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    abrirNovaSubcategoria(categoriasDisponiveis = {}) {
        const formHtml = this._gerarFormularioHTML('novo', '', {}, categoriasDisponiveis);
        Drawer.open({
            title: '➕ Nova Subcategoria',
            content: formHtml,
            width: '500px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-subcategoria')?.addEventListener('click', () => this.salvarSubcategoria('novo'));
        }, 100);
    },

    abrirEditarSubcategoria(id, categoriasDisponiveis = {}) {
        const sub = this.subcategoriasEmMemoria[id];
        if (!sub) return;

        const formHtml = this._gerarFormularioHTML('editar', id, sub, categoriasDisponiveis);
        Drawer.open({
            title: `✏️ Editar Subcategoria`,
            content: formHtml,
            width: '500px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-subcategoria')?.addEventListener('click', () => this.salvarSubcategoria(id));
        }, 100);
    },

    async salvarSubcategoria(idOuAcao) {
        const nome = document.getElementById('sub-nome').value.trim();
        const categoriaId = document.getElementById('sub-cat-id').value;

        if (!nome || !categoriaId) {
            alert("Nome e Categoria Pai são obrigatórios!");
            return;
        }

        const dados = {
            nome,
            categoriaId,
            atualizadoEm: new Date().toISOString()
        };

        try {
            if (idOuAcao === 'novo') {
                dados.criadoEm = new Date().toISOString();
                await this.dbRef.push(dados);
            } else {
                await this.dbRef.child(idOuAcao).update(dados);
            }
            Drawer.close();
        } catch (error) {
            console.error("Erro ao salvar subcategoria:", error);
        }
    },

    async excluirSubcategoria(id) {
        if (confirm("Tem certeza que deseja apagar esta subcategoria?")) {
            try {
                await this.dbRef.child(id).remove();
            } catch (error) {
                console.error("Erro ao remover subcategoria:", error);
            }
        }
    },

    _gerarFormularioHTML(modo, id = '', s = {}, categorias = {}) {
        const isEdit = modo === 'editar';
        
        let selectOptions = '<option value="">Selecione uma Categoria Pai...</option>';
        Object.keys(categorias).forEach(catId => {
            const cat = categorias[catId];
            const nomeCat = typeof cat === 'object' ? cat.nome : cat;
            const selected = s.categoriaId === catId ? 'selected' : '';
            selectOptions += `<option value="${catId}" ${selected}>${nomeCat}</option>`;
        });

        return `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400">Categoria Vínculo (Pai)</label>
                    <select id="sub-cat-id" class="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white outline-none focus:border-[#caa85c]">
                        ${selectOptions}
                    </select>
                </div>
                <div>
                    <label class="text-xs text-zinc-400">Nome da Subcategoria</label>
                    <input type="text" id="sub-nome" value="${isEdit ? s.nome || '' : ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white outline-none focus:border-[#caa85c]">
                </div>
                <button id="btn-salvar-subcategoria" type="button" class="w-full bg-[#caa85c] text-black font-bold py-3 rounded-xl hover:bg-opacity-90 transition-opacity mt-4">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Criar Subcategoria'}
                </button>
            </div>
        `;
    }
};
