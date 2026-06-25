/**
 * Orquestrador Central Seguro - editorApp.js
 */

import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

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

        // Inicializa os módulos passando a instância do banco
        Drawer.init();
        ProdutoModule.init(this.db);
        CategoriaModule.init(this.db);
        SubcategoriaModule.init(this.db);

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
                btnCriar.setAttribute('data-contexto', alvo);
                btnCriar.textContent = `➕ Criar ${alvo.charAt(0).toUpperCase() + alvo.slice(1, -1)}`;
            });
        });
    },

    _configurarBotoesGlobais() {
        // Criar Novo
        document.getElementById('btnCriarNovo')?.addEventListener('click', () => {
            const contexto = document.getElementById('btnCriarNovo').getAttribute('data-contexto');
            
            // Passamos as dependências de dados para o módulo correspondente
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

        // Refresh
        document.getElementById('btnRefresh')?.addEventListener('click', (e) => {
            const btn = e.target;
            btn.textContent = '🔄 Sincronizando...';
            
            // Re-lista tudo via módulos
            Promise.all([
                ProdutoModule.listarProdutos(),
                CategoriaModule.listarCategorias(),
                SubcategoriaModule.listarSubcategorias()
            ]).then(() => {
                setTimeout(() => btn.textContent = '🔄 Sincronizar', 500);
            });
        });
    }
};

EditorApp.init();
