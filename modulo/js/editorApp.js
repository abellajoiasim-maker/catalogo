/**
 * Orquestrador Central - editorApp.js
 * Abella Joias — Super Editor V7
 */

import { Drawer }            from './drawer.js';
import { ProdutoModule }     from './produtoModule.js';
import { CategoriaModule }   from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

const EditorApp = {
    db: null,
    tentativas: 0,

    async init() {
        console.log('🚀 Inicializando Super Editor V7...');

        const pronto = window.ABELLA_FIREBASE_INITIALIZED || typeof window.db !== 'undefined';

        if (!pronto) {
            this.tentativas++;
            if (this.tentativas > 15) {
                console.error('❌ Firebase não inicializou após 15 tentativas.');
                return;
            }
            setTimeout(() => this.init(), 400);
            return;
        }

        this.db = window.db || window.firebase.database();

        // Inicializa o Drawer antes de tudo
        Drawer.init();

        // Inicializa módulos (CategoriaModule e SubcategoriaModule primeiro,
        // pois ProdutoModule precisa dos caches deles)
        CategoriaModule.init(this.db);
        SubcategoriaModule.init(this.db);
        ProdutoModule.init(this.db, {}, {});

        // Mantém ProdutoModule atualizado quando categorias/subcategorias carregam
        window.addEventListener('categoriasAtualizadas', (e) => {
            ProdutoModule.atualizarCaches(
                e.detail,
                SubcategoriaModule.subcategoriasEmMemoria
            );
        });
        window.addEventListener('subcategoriasAtualizadas', (e) => {
            ProdutoModule.atualizarCaches(
                CategoriaModule.categoriasEmMemoria,
                e.detail
            );
        });

        this._configurarAbas();
        this._configurarBotoesGlobais();

        console.log('✅ Super Editor V7 operando!');
    },

    _configurarAbas() {
        const botoesAbas = document.querySelectorAll('.tab-btn');

        botoesAbas.forEach(botao => {
            botao.addEventListener('click', (e) => {
                const alvo = e.currentTarget.getAttribute('data-tab');

                // Estilo das abas
                botoesAbas.forEach(b => {
                    b.classList.remove('active', 'bg-[#caa85c]', 'text-black');
                    b.classList.add('text-zinc-400');
                });
                e.currentTarget.classList.add('active', 'bg-[#caa85c]', 'text-black');
                e.currentTarget.classList.remove('text-zinc-400');

                // Conteúdo
                document.querySelectorAll('.tab-content').forEach(s => s.classList.add('hidden'));
                document.getElementById(`tab-${alvo}`)?.classList.remove('hidden');

                // Texto do botão criar
                const btnCriar = document.getElementById('btnCriarNovo');
                if (btnCriar) {
                    btnCriar.setAttribute('data-contexto', alvo);
                    const labels = { produtos: 'Produto', categorias: 'Categoria', subcategorias: 'Subcategoria' };
                    btnCriar.textContent = `➕ Criar ${labels[alvo] || alvo}`;
                }
            });
        });
    },

    _configurarBotoesGlobais() {
        // ── Botão "Criar Novo" ────────────────────────────────────────────────
        document.getElementById('btnCriarNovo')?.addEventListener('click', () => {
            const contexto = document.getElementById('btnCriarNovo').getAttribute('data-contexto') || 'produtos';
            const cats = CategoriaModule.categoriasEmMemoria   || {};
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

        // ── Botão "Sincronizar" ───────────────────────────────────────────────
        document.getElementById('btnRefresh')?.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.textContent = '🔄 Sincronizando...';
            btn.disabled = true;

            // Os módulos já têm listeners .on('value') ativos;
            // basta chamar os métodos de listagem para forçar o re-render.
            ProdutoModule.renderProdutos();
            CategoriaModule.renderCategorias();
            SubcategoriaModule.renderSubcategorias();

            setTimeout(() => {
                btn.textContent = '🔄 Sincronizar';
                btn.disabled = false;
            }, 600);
        });
    }
};

EditorApp.init();
