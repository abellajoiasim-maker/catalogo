import { Drawer } from './drawer.js';

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {}, // Guarda os dados localmente para agilizar a edição e evitar refetch

    /**
     * Inicializa o módulo de produtos
     * @param {Object} firebaseDb - A referência global do banco de dados (ex: firebase.database())
     * @param {string} path - O caminho no banco de dados (ex: 'produtos' ou 'abella/produtos')
     */
    init(firebaseDb, path = 'produtos') {
        this.dbRef = firebaseDb.ref(path);
        this._configurarEventosGerais();
        this.listarProdutos();
    },

    /**
     * Configura um único listener para todos os botões de ação (Event Delegation).
     * Substitui os antigos `onclick=` soltos no HTML.
     */
    _configurarEventosGerais() {
        const containerLista = document.getElementById('lista-produtos-container');
        
        if (containerLista) {
            containerLista.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;

                const acao = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');

                switch (acao) {
                    case 'editar': this.abrirEditarProduto(id); break;
                    case 'duplicar': this.duplicarProduto(id); break;
                    case 'pausar': this.pausarProduto(id); break;
                    case 'excluir': this.excluirProduto(id); break;
                }
            });
        }
    },

    /**
     * Busca os produtos no Firebase e aciona a renderização em tempo real
     */
    listarProdutos() {
        this.dbRef.on('value', (snapshot) => {
            const dados = snapshot.val();
            this.produtosEmMemoria = dados || {};
            this.renderProdutos(this.produtosEmMemoria);
        }, (error) => {
            console.error("Erro ao buscar produtos:", error);
        });
    },

    /**
     * Gera o HTML da vitrine administrativa
     * @param {Object} produtos 
     */
    renderProdutos(produtos) {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        const ids = Object.keys(produtos);
        
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500">Nenhum produto cadastrado.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const p = produtos[id];
            const statusColor = p.ativo !== false ? 'bg-green-500' : 'bg-red-500';
            const statusText = p.ativo !== false ? 'ATIVO' : 'PAUSADO';

            // Usamos data-action e data-id no lugar de onclick()
            html += `
                <div class="flex items-center justify-between p-4 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                    <div class="flex items-center gap-4">
                        <img src="${p.imagem || ''}" class="w-12 h-12 rounded object-cover bg-zinc-800" onerror="this.src='imagem-padrao.png'">
                        <div>
                            <div class="text-xs text-zinc-500 font-mono">${p.ref || id}</div>
                            <div class="text-sm font-bold text-zinc-200">${p.nome || 'Produto Sem Nome'}</div>
                            <div class="text-xs text-[#caa85c] font-bold">R$ ${Number(p.preco || 0).toFixed(2).replace('.', ',')}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold px-2 py-1 rounded text-white ${statusColor}">${statusText}</span>
                        
                        <!-- BOTÕES DE AÇÃO COM DATA ATTRIBUTES -->
                        <button data-action="editar" data-id="${id}" class="p-2 bg-zinc-800 text-zinc-300 rounded hover:bg-[#caa85c] hover:text-black transition-colors" title="Editar">
                            ✏️
                        </button>
                        <button data-action="duplicar" data-id="${id}" class="p-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors" title="Duplicar">
                            📋
                        </button>
                        <button data-action="pausar" data-id="${id}" class="p-2 bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors" title="Pausar/Ativar">
                            ⏸️
                        </button>
                        <button data-action="excluir" data-id="${id}" class="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Abre o Drawer configurado para Criar um Novo Produto
     */
    abrirNovoProduto() {
        const formHtml = this._gerarFormularioHTML('novo');
        Drawer.open({
            title: '➕ CRIAR NOVO PRODUTO',
            content: formHtml,
            width: '600px'
        });
        
        // Adiciona listener específico para o botão salvar do form recém renderizado
        setTimeout(() => {
            document.getElementById('btn-salvar-produto')?.addEventListener('click', () => this.salvarProduto('novo'));
        }, 100);
    },

    /**
     * Abre o Drawer configurado para Editar um Produto existente
     * @param {string} id 
     */
    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        const formHtml = this._gerarFormularioHTML('editar', id, produto);
        Drawer.open({
            title: `✏️ EDITAR: ${produto.ref || id}`,
            content: formHtml,
            width: '600px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-produto')?.addEventListener('click', () => this.salvarProduto(id));
        }, 100);
    },

    /**
     * Salva o produto (Criação ou Edição) lendo os dados do formulário do Drawer
     * @param {string} idOuAcao - ID do produto ou a string 'novo'
     */
    async salvarProduto(idOuAcao) {
        // Coleta os valores dos inputs do Drawer
        const nome = document.getElementById('prod-nome').value;
        const preco = document.getElementById('prod-preco').value;
        const ref = document.getElementById('prod-ref').value;
        // ... (Adicione os outros campos conforme seu modelo de dados)

        if (!nome || !preco) {
            alert("Nome e preço são obrigatórios!");
            return;
        }

        const dadosProduto = {
            nome: nome,
            preco: parseFloat(preco.replace(',', '.')),
            ref: ref || Date.now().toString(),
            ativo: true,
            atualizadoEm: new Date().toISOString()
        };

        try {
            if (idOuAcao === 'novo') {
                await this.dbRef.push(dadosProduto);
            } else {
                await this.dbRef.child(idOuAcao).update(dadosProduto);
            }
            Drawer.close();
            // Um toast de sucesso seria legal aqui!
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar produto.");
        }
    },

    /**
     * Duplica um item e adiciona (Cópia) ao nome
     * @param {string} id 
     */
    async duplicarProduto(id) {
        const produtoOriginal = this.produtosEmMemoria[id];
        if (!produtoOriginal) return;

        const produtoCopia = { 
            ...produtoOriginal, 
            nome: `${produtoOriginal.nome} (Cópia)`,
            ref: `${produtoOriginal.ref}-COPIA`,
            criadoEm: new Date().toISOString()
        };
        
        // Remove IDs ou chaves antigas se necessário
        delete produtoCopia.id; 

        try {
            await this.dbRef.push(produtoCopia);
        } catch (error) {
            console.error("Erro ao duplicar:", error);
        }
    },

    /**
     * Altera o status entre Ativo e Pausado
     * @param {string} id 
     */
    async pausarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        try {
            await this.dbRef.child(id).update({
                ativo: produto.ativo === false ? true : false
            });
        } catch (error) {
            console.error("Erro ao alterar status:", error);
        }
    },

    /**
     * Exclui permanentemente o produto do Firebase
     * @param {string} id 
     */
    async excluirProduto(id) {
        if (confirm("Tem certeza que deseja excluir este produto permanentemente?")) {
            try {
                await this.dbRef.child(id).remove();
            } catch (error) {
                console.error("Erro ao excluir:", error);
            }
        }
    },

    /**
     * Módulo Privado: Gera a estrutura do formulário baseando-se no produto
     * @private
     */
    _gerarFormularioHTML(modo, id = '', p = {}) {
        const isEdit = modo === 'editar';
        
        return `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400">Referência (REF)</label>
                    <input type="text" id="prod-ref" value="${isEdit ? p.ref || '' : ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]">
                </div>
                <div>
                    <label class="text-xs text-zinc-400">Nome do Produto</label>
                    <input type="text" id="prod-nome" value="${isEdit ? p.nome || '' : ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]">
                </div>
                <div>
                    <label class="text-xs text-zinc-400">Preço (R$)</label>
                    <input type="number" id="prod-preco" value="${isEdit ? p.preco || '' : ''}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]">
                </div>
                
                <!-- O Botão chama a lógica via evento vinculado no setTimeout -->
                <button id="btn-salvar-produto" type="button" class="w-full bg-[#caa85c] text-black font-bold py-3 rounded hover:bg-opacity-90 transition-opacity mt-6">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Adicionar Produto'}
                </button>
            </div>
        `;
    }
};
