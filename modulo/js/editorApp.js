/**
 * Orquestrador Central Seguro - editorApp.js
 */

import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

// --- EXPANSÃO GLOBAL: Fundamental para os botões 'onclick' no seu HTML ---
window.editarCategoria = (id) => CategoriaModule.abrirEditarCategoria(id);
window.excluirCategoria = (id) => CategoriaModule.excluirCategoria(id);
window.editarSubcategoria = (id) => SubcategoriaModule.abrirEditarSubcategoria(id, CategoriaModule.categoriasEmMemoria);
window.excluirSubcategoria = (id) => SubcategoriaModule.excluirSubcategoria(id);
window.salvarCategoria = () => CategoriaModule.salvar(); // Garante que o salvar funcione no Drawer

const EditorApp = {
    db: null,
    tentativas: 0,

    async init() {
        console.log('🚀 Inicializando infraestrutura Abella Joias...');

        const pronto = window.ABELLA_FIREBASE_INITIALIZED || typeof window.db !== 'undefined';

        if (!pronto) {
            this.tentativas++;
            if (this.tentativas > 10) return console.error('❌ Falha na conexão.');
            setTimeout(() => this.init(), 400);
            return;
        }

        this.db = window.db || window.firebase.database();

        // Inicializa o Drawer
        Drawer.init();

        // Inicializa módulos de dados
        CategoriaModule.init(this.db);
        SubcategoriaModule.init(this.db);

        // Inicializa ProdutoModule aguardando um breve momento para garantir que 
        // os dados de subcategorias estejam carregados em memória
        setTimeout(() => {
            ProdutoModule.init(this.db, SubcategoriaModule.subcategoriasEmMemoria);
        }, 800);

        this._configurarAbas();
        this._configurarBotoesGlobais();
        
        console.log('✅ Ecossistema operando!');
    },

    _configurarAbas() {
        const botoesAbas = document.querySelectorAll('.tab-btn');
        botoesAbas.forEach(botao => {
            botao.addEventListener('click', (e) => {
                const alvo = e.currentTarget.getAttribute('data-tab');

                // UI das Abas
                botoesAbas.forEach(b => b.classList.remove('active', 'bg-[#caa85c]', 'text-black', 'font-bold'));
                botoesAbas.forEach(b => b.classList.add('text-zinc-400'));
                e.currentTarget.classList.add('active', 'bg-[#caa85c]', 'text-black', 'font-bold');
                e.currentTarget.classList.remove('text-zinc-400');
                
                // Exibição das seções
                document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
                document.getElementById(`tab-${alvo}`)?.classList.remove('hidden');

                // Atualiza o botão superior
                const btnCriar = document.getElementById('btnCriarNovo');
                if(btnCriar) {
                    btnCriar.setAttribute('data-contexto', alvo);
                    btnCriar.textContent = `➕ Criar ${alvo.charAt(0).toUpperCase() + alvo.slice(1, -1)}`;
                }
            });
        });
    },

    _configurarBotoesGlobais() {
        document.getElementById('btnCriarNovo')?.addEventListener('click', () => {
            const contexto = document.getElementById('btnCriarNovo').getAttribute('data-contexto');
            
            const cats = CategoriaModule.categoriasEmMemoria || {};
            const subs = SubcategoriaModule.subcategoriasEmMemoria || {};

            switch (contexto) {
                case 'produtos':
                    ProdutoModule.abrirNovoProduto(cats, subs);
                    break;
                case 'categorias':
                    CategoriaModule.abrirNovaCategoria();
                    break;
                case 'subcategorias':
                    SubcategoriaModule.abrirNovaSubcategoria(cats);
                    break;
            }
        });

        document.getElementById('btnRefresh')?.addEventListener('click', (e) => {
            const btn = e.target;
            btn.textContent = '🔄 Sincronizando...';
            
            // Re-lista tudo via módulos
            // Garantimos que os métodos existem antes de chamar
            if (typeof ProdutoModule.listarProdutos === 'function') ProdutoModule.listarProdutos();
            if (typeof CategoriaModule.listarCategorias === 'function') CategoriaModule.listarCategorias();
            if (typeof SubcategoriaModule.listarSubcategorias === 'function') SubcategoriaModule.listarSubcategorias();
            
            setTimeout(() => btn.textContent = '🔄 Sincronizar', 500);
        });
    }
};

EditorApp.init();
