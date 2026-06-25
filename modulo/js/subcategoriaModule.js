import { Drawer } from './drawer.js';

export const SubcategoriaModule = {
    dbRef: null,
    subcategoriasEmMemoria: {},

    init(firebaseDb) {
        const nóSub = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('subcategories') : 'abella/subcategories';
        this.dbRef = firebaseDb.ref(nóSub);
        this.listarSubcategorias();
    },

    listarSubcategorias() {
        this.dbRef.on('value', (snapshot) => {
            this.subcategoriasEmMemoria = snapshot.val() || {};
            this.renderSubcategorias();
            window.dispatchEvent(new CustomEvent('subcategoriasAtualizadas', { detail: this.subcategoriasEmMemoria }));
        });
    },

    renderSubcategorias() {
        const container = document.getElementById('lista-subcategorias-container');
        if (!container) return;

        container.innerHTML = Object.entries(this.subcategoriasEmMemoria).map(([id, s]) => `
            <div class="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all">
                <div>
                    <div class="text-[10px] text-zinc-500 font-mono tracking-widest">ID: ${id}</div>
                    <div class="text-sm font-bold text-zinc-200 mt-0.5">${s.nome || 'Sem Nome'}</div>
                    <div class="text-[10px] text-zinc-600 mt-1 uppercase font-bold">Pai: ${s.categoriaId || 'N/A'}</div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="window.editarSubcategoria('${id}')" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                    <button onclick="window.excluirSubcategoria('${id}')" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                </div>
            </div>
        `).join('') || `<div class="p-8 text-center text-zinc-500 text-xs">Nenhuma subcategoria.</div>`;
    },

    abrirNovaSubcategoria(categorias) {
        this._abrirFormulario('novo', '', {}, categorias);
    },

    abrirEditarSubcategoria(id, categorias) {
        const sub = this.subcategoriasEmMemoria[id];
        if (sub) this._abrirFormulario('editar', id, sub, categorias);
    },

    _abrirFormulario(modo, id, sub, categorias) {
        const isEdit = modo === 'editar';
        const options = Object.entries(categorias).map(([catId, cat]) => 
            `<option value="${catId}" ${sub.categoriaId === catId ? 'selected' : ''}>${cat.nome || cat}</option>`
        ).join('');

        Drawer.open({
            title: isEdit ? '✏️ EDITAR SUBCATEGORIA' : '➕ NOVA SUBCATEGORIA',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Pai</label>
                        <select id="sub-cat-id" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white">${options}</select>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Nome</label>
                        <input type="text" id="sub-nome" value="${sub.nome || ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white">
                    </div>
                    <button id="btn-salvar-sub" class="w-full bg-[#caa85c] text-black font-black py-3 rounded-xl hover:bg-opacity-90">SALVAR</button>
                </div>
            `
        });

        document.getElementById('btn-salvar-sub').onclick = () => this.salvar(modo, id);
    },

    async salvar(modo, id) {
        const dados = {
            nome: document.getElementById('sub-nome').value,
            categoriaId: document.getElementById('sub-cat-id').value,
            atualizadoEm: Date.now()
        };
        
        if (modo === 'novo') await this.dbRef.push({ ...dados, criadoEm: Date.now() });
        else await this.dbRef.child(id).update(dados);
        
        Drawer.close();
    },

    async excluirSubcategoria(id) {
        if (confirm("Deletar subcategoria?")) await this.dbRef.child(id).remove();
    }
};
