import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

// Expõe globalmente para os botões do HTML
window.editarCategoria = (id) => CategoriaModule.abrirEditarCategoria(id);
window.excluirCategoria = (id) => CategoriaModule.excluirCategoria(id);
window.editarSubcategoria = (id) => SubcategoriaModule.abrirEditarSubcategoria(id, CategoriaModule.categoriasEmMemoria);
window.excluirSubcategoria = (id) => SubcategoriaModule.excluirSubcategoria(id);

const EditorApp = {
    async init() {
        // Aguarda o Firebase
        if (!window.db) {
            setTimeout(() => this.init(), 300);
            return;
        }

        const db = window.db;
        Drawer.init();

        // Inicializa em ordem: Categoria -> Subcategoria -> Produto
        CategoriaModule.init(db);
        SubcategoriaModule.init(db);
        
        // Pequeno delay para garantir que o cache de Subcategoria existe
        setTimeout(() => {
            ProdutoModule.init(db, SubcategoriaModule.subcategoriasEmMemoria);
        }, 500);

        console.log('✅ Painel carregado com segurança.');
    }
};

EditorApp.init();
