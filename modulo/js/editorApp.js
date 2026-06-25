/**
 * Orquestrador Central - editorApp.js
 * Inicializa, gerencia as abas e conecta os módulos estruturais
 */

import { Drawer } from './drawer.js';
import { ProdutoModule } from './produtoModule.js';
import { CategoriaModule } from './categoriaModule.js';
import { SubcategoriaModule } from './subcategoriaModule.js';

const EditorApp = {
    db: null,

    async init() {
        console.log('🚀 Inicializando Orquestrador Modular...');

        // 1. Valida a conexão do Firebase vinda do ecossistema global
        if (typeof window.firebase !== 'undefined') {
            this.db = window.firebase.database();
        } else if (typeof window.db !== 'undefined') {
            this.db = window.db; // Usa o helper global mapeado no projeto
        } else {
            console.error('❌ Erro: Firebase não foi carregado globalmente.');
            alert('Erro crítico: Infraestrutura Firebase ausente.');
            return;
        }

        // 2. Inicializa os módulos passando as referências isoladas
        Drawer.init();
        ProdutoModule.init(this.db);
        CategoriaModule.init(this.db);
        SubcategoriaModule.init(this.db);

        // 3. Configura a UI local do Shell (Abas, Botões Globais de Criação)
        this._configurarAbas();
        this._configurarBotoesGlobais();
        
        console.log('✅ Todos os módulos foram acoplados com sucesso!');
    },

    /**
     * Gerencia a troca de abas nativa (Produtos, Categorias, Subcategorias)
     */
    _configurarAbas() {
        const botoesAbas = document.querySelectorAll('.tab-btn');
        const secoesAbas = document.querySelectorAll('.tab-content');

        botoesAbas.forEach(botao => {
            botao.addEventListener('click', () => {
                const alvo = botao.getAttribute('data-tab');

                // Remove estados ativos de todos
                botoesAbas.forEach(b => b.classList.remove('active', 'bg-[#caa85c]', 'text-black', 'font-bold'));
                botoesAbas.forEach(b => b.classList.add('text-zinc-400'));
                secoesAbas.forEach(s => s.classList.add('hidden'));

                // Ativa a aba clicada
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
        // Botão "➕ Criar Item" Superior
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

        // Botão "🔄 Sincronizar Vitrine" Superior
        document.getElementById('btnRefresh')?.addEventListener('click', () => {
            const btn = document.getElementById('btnRefresh');
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = '🔄 Sincronizando...';
            btn.disabled = true;
            
            // Força a releitura manual e imediata dos nós no Firebase
            ProdutoModule.listarProdutos();
            CategoriaModule.listarCategorias();
            SubcategoriaModule.listarSubcategorias();

            setTimeout(() => {
                btn.innerHTML = textoOriginal;
                btn.disabled = false;
            }, 800);
        });

        // Comunicação limpa entre módulos via evento customizado
        window.addEventListener('pedirCategoriasParaSub', (e) => {
            if (typeof e.detail?.callback === 'function') {
                e.detail.callback(CategoriaModule.categoriasEmMemoria);
            }
        });
    }
};

// Executa automaticamente ao carregar o arquivo via módulo ES6
document.addEventListener('DOMContentLoaded', () => {
    EditorApp.init();
});
