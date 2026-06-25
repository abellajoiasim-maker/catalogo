import { Drawer } from './drawer.js';

export const CategoriaModule = {
    dbRef: null,
    categoriasEmMemoria: {},

    /**
     * Inicializa o módulo de categorias
     */
    init(firebaseDb, path = 'categorias') {
        this.dbRef = firebaseDb.ref(path);
        this._configurarEventosGerais();
        this.listarCategorias();
    },

    /**
     * Event Delegation para os botões de ação das categorias
     */
    _configurarEventosGerais() {
        const containerLista = document.getElementById('lista-categorias-container');
        if (containerLista) {
            containerLista.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const acao = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');

                switch (acao) {
                    case 'editar': this.abrirEditarCategoria(id); break;
                    case 'excluir': this.excluirCategoria(id); break;
                }
            });
        }
    },

    listarCategorias() {
        this.dbRef.on('value', (snapshot) => {
            const dados = snapshot.val();
            this.categoriasEmMemoria = dados || {};
            this.renderCategorias(this.categoriasEmMemoria);
            
            // Evento global opcional para notificar outros módulos (ex: preencher selects de produtos)
            window.dispatchEvent(new CustomEvent('categoriasAtualizadas', { detail: this.categoriasEmMemoria }));
        });
    },

    renderCategorias(categorias) {
        const container = document.getElementById('lista-categorias-container');
        if (!container) return;

        const ids = Object.keys(categorias);
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-6 text-center text-zinc-500 text-xs">Nenhuma categoria cadastrada.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const cat = typeof categorias[id] === 'object' ? { id, ...categorias[id] } : { id, nome: categorias[id] };
            
            html += `
                <div class="flex items-center justify-between p-3 mb-2 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                    <div>
                        <div class="text-xs text-zinc-500 font-mono">ID: ${cat.id}</div>
                        <div class="text-sm font-bold text-zinc-200">${cat.nome || 'Sem Nome'}</div>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="editar" data-id="${cat.id}" class="p-2 bg-zinc-800 text-zinc-300 rounded hover:bg-[#caa85c] hover:text-black transition-colors" title="Editar">
                            ✏️
                        </button>
                        <button data-action="excluir" data-id="${cat.id}" class="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    abrirNovaCategoria() {
        const formHtml = this._gerarFormularioHTML('novo');
        Drawer.open({
            title: '➕ Nova Categoria',
            content: formHtml,
            width: '500px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-categoria')?.addEventListener('click', () => this.salvarCategoria('novo'));
        }, 100);
    },

    abrirEditarCategoria(id) {
        const cat = this.categoriasEmMemoria[id];
        if (!cat) return;
        const nomeCat = typeof cat === 'object' ? cat.nome : cat;

        const formHtml = this._gerarFormularioHTML('editar', id, { nome: nomeCat });
        Drawer.open({
            title: `✏️ Editar Categoria`,
            content: formHtml,
            width: '500px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-categoria')?.addEventListener('click', () => this.salvarCategoria(id));
        }, 100);
    },

    async salvarCategoria(idOuAcao) {
        const nome = document.getElementById('cat-nome').value.trim();
        if (!nome) {
            alert("O nome da categoria é obrigatório!");
            return;
        }

        try {
            if (idOuAcao === 'novo') {
                // Se seu banco usa nós estruturados {nome: "X"}, senão salve string pura
                await this.dbRef.push({ nome, criadoEm: new Date().toISOString() });
            } else {
                await this.dbRef.child(idOuAcao).update({ nome, atualizadoEm: new Date().toISOString() });
            }
            Drawer.close();
        } catch (error) {
            console.error("Erro ao salvar categoria:", error);
        }
    },

    async excluirCategoria(id) {
        if (confirm("Deseja mesmo excluir esta categoria? Isso pode afetar a exibição dos produtos vinculados.")) {
            try {
                await this.dbRef.child(id).remove();
            } catch (error) {
                console.error("Erro ao excluir categoria:", error);
            }
        }
    },

    _gerarFormularioHTML(modo, id = '', c = {}) {
        const isEdit = modo === 'editar';
        return `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400">Nome da Categoria</label>
                    <input type="text" id="cat-nome" value="${isEdit ? c.nome || '' : ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-white outline-none focus:border-[#caa85c]">
                </div>
                <button id="btn-salvar-categoria" type="button" class="w-full bg-[#caa85c] text-black font-bold py-3 rounded-xl hover:bg-opacity-90 transition-opacity mt-4">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Criar Categoria'}
                </button>
            </div>
        `;
    }
};
