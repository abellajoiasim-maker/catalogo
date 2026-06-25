/**
 * Orquestrador Central Seguro - editorApp.js
 * Aguarda a infraestrutura oficial do catálogo estar pronta para iniciar os módulos
 */

import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

const EditorApp = {
    db: null,
    tentativas: 0,

    async init() {
        console.log('🚀 Verificando infraestrutura do ecossistema Abella Joias...');

        // Verifica se a conexão oficial já está ativa na janela global
        const pronto = window.ABELLA_FIREBASE_INITIALIZED === true || window.ABELLA_FIREBASE_CONNECTED === true || typeof window.db !== 'undefined';

        if (!pronto) {
            this.tentativas++;
            if (this.tentativas > 10) {
                console.error('❌ Tempo limite de conexão esgotado. Verifique o arquivo firebase-config.js');
                return;
            }
            // Aguarda 400ms e tenta novamente de forma assíncrona até o Firebase carregar
            setTimeout(() => this.init(), 400);
            return;
        }

        // Puxa a instância ativa e testada do banco global
        this.db = window.db || (typeof window.firebase !== 'undefined' ? window.firebase.database() : null);

        if (!this.db) {
            console.error('❌ Instância do Realtime Database não encontrada.');
            return;
        }

        console.log('🔗 Conexão com o Firebase validada. Acoplando módulos...');

        // Inicializa os módulos estruturais do ecossistema
        Drawer.init();
        ProdutoModule.init(this.db);
        CategoriaModule.init(this.db);
        SubcategoriaModule.init(this.db);

        // Ativa os listeners de interface do Shell (Abas e cliques superiores)
        this._configurarAbas();
        this._configurarBotoesGlobais();
        
        console.log('✅ Todos os módulos operando em tempo real!');
    },

    /**
     * Gerencia a troca de abas nativa
     */
    _configurarAbas() {
        const botoesAbas = document.querySelectorAll('.tab-btn');
        const secoesAbas = document.querySelectorAll('.tab-content');

        botoesAbas.forEach(botao => {
            botao.addEventListener('click', () => {
                const alvo = botao.getAttribute('data-tab');

                botoesAbas.forEach(b => b.classList.remove('active', 'bg-[#caa85c]', 'text-black', 'font-bold'));
                botoesAbas.forEach(b => b.classList.add('text-zinc-400'));
                secoesAbas.forEach(s => s.classList.add('hidden'));

                botao.classList.add('active', 'bg-[#caa85c]', 'text-black', 'font-bold');
                botao.classList.remove('text-zinc-400');
                
                const secaoAlvo = document.getElementById(`tab-${alvo}`);
                if (secaoAlvo) secaoAlvo.classList.remove('hidden');
            });
        });
    },

    /**
     * Intercepta os botões superiores do Shell Administrativo
     */
    _configurarBotoesGlobais() {
        // Botão "➕ Criar Item"
        document.getElementById('btnCriarNovo')?.addEventListener('click', () => {
            const abaAtiva = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
            
            switch (abaAtiva) {
                case 'produtos':
                    ProdutoModule.abrirNovoProduto(CategoriaModule.categoriasEmMemoria);
                    break;
                case 'categorias':
                    CategoriaModule.abrirNovaCategoria();
                    break;
                case 'subcategorias':
                    SubcategoriaModule.abrirNovaSubcategoria(CategoriaModule.categoriasEmMemoria);
                    break;
                default:
                    ProdutoModule.abrirNovoProduto(CategoriaModule.categoriasEmMemoria);
            }
        });

        // Botão "🔄 Sincronizar Vitrine"
        document.getElementById('btnRefresh')?.addEventListener('click', () => {
            const btn = document.getElementById('btnRefresh');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '🔄 Sincronizando...';
            btn.disabled = true;
            
            ProdutoModule.listarProdutos();
            CategoriaModule.listarCategorias();
            SubcategoriaModule.listarSubcategorias();

            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }, 800);
        });

        window.addEventListener('pedirCategoriasParaSub', (e) => {
            if (typeof e.detail?.callback === 'function') {
                e.detail.callback(CategoriaModule.categoriasEmMemoria);
            }
        });
    }
};

// Inicialização imediata via ciclo do módulo
EditorApp.init();
