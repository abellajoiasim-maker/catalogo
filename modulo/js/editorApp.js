import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

// EXPOSIÇÃO GLOBAL - Isso resolve o "botão não funciona"
window.editarCategoria = (id) => CategoriaModule.abrirEditarCategoria(id);
window.excluirCategoria = (id) => CategoriaModule.excluirCategoria(id);
window.editarSubcategoria = (id) => SubcategoriaModule.abrirEditarSubcategoria(id, CategoriaModule.categoriasEmMemoria);
window.excluirSubcategoria = (id) => SubcategoriaModule.excluirSubcategoria(id);

const EditorApp = {
    async init() {
        // Aguarda o objeto 'db' ser criado pelo seu script de config do Firebase
        if (!window.db && !window.firebase) {
            console.log('🔄 Aguardando Firebase...');
            setTimeout(() => this.init(), 300);
            return;
        }

        const db = window.db || window.firebase.database();
        console.log('✅ Firebase conectado. Iniciando módulos...');

        // Inicia na ordem certa: Dados primeiro, depois Produtos
        Drawer.init();
        CategoriaModule.init(db);
        SubcategoriaModule.init(db);

        // Aguarda os dados do banco antes de iniciar o ProdutoModule
        setTimeout(() => {
            ProdutoModule.init(db, SubcategoriaModule.subcategoriasEmMemoria);
        }, 800);

        this._configurarAbas();
    },

    _configurarAbas() {
        // Garante que os botões de tab funcionem
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = (e) => {
                const alvo = e.currentTarget.getAttribute('data-tab');
                document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
                document.getElementById(`tab-${alvo}`)?.classList.remove('hidden');
                
                // Atualiza botão criar
                const btnCriar = document.getElementById('btnCriarNovo');
                btnCriar.setAttribute('data-contexto', alvo);
                btnCriar.textContent = `➕ Criar ${alvo.charAt(0).toUpperCase() + alvo.slice(1, -1)}`;
            };
        });
    }
};

EditorApp.init();
