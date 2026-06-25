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

        // 1. Aguarda e valida a conexão do Firebase vinda do firebase-config.js
        if (typeof window.firebase !== 'undefined') {
            this.db = window.firebase.database();
        } else {
            console.error('❌ Erro: Firebase não foi carregado globalmente.');
            alert('Erro crítico: Infraestrutura Firebase ausente.');
            return;
        }

        // Caso use a função dinâmica multi-lojas do seu ecossistema:
        const obterCaminho = typeof window.getAbellaPath === 'function' 
            ? window.getAbellaPath 
            : (p) => p;

        // 2. Inicializa os módulos passando as referências isoladas do Firebase
        Drawer.init();
        ProdutoModule.init(this.db, obterCaminho('produtos'));
        CategoriaModule.init(this.db, obterCaminho('categorias'));
        SubcategoriaModule.init(this.db, obterCaminho('subcategorias'));

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
            // Verifica qual aba está ativa para abrir o formulário correto no Drawer
            const abaAtiva = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
            
            switch (abaAtiva) {
                case 'produtos':
                    ProdutoModule.abrirNovoProduto();
                    break;
                case 'categorias':
                    CategoriaModule.abrirNovaCategoria();
                    break;
                case 'subcategorias':
                    // Passa o cache de categorias atual para popular o select pai da subcategoria
                    SubcategoriaModule.abrirNovaSubcategoria(CategoriaModule.categoriasEmMemoria);
                    break;
                default:
                    ProdutoModule.abrirNovoProduto();
            }
        });

        // Evento customizado para quando o módulo de Subcategorias pedir edição, carregar as categorias injetadas
        window.addEventListener('pedirCategoriasParaSub', (e) => {
            // Permite comunicação limpa entre os módulos de forma desacoplada
            e.detail.callback(CategoriaModule.categoriasEmMemoria);
        });
    }
};

// Executa automaticamente ao carregar o arquivo via módulo
document.addEventListener('DOMContentLoaded', () => {
    EditorApp.init();
});
