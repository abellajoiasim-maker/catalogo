import { Drawer } from './drawer.js';

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {}, 

    /**
     * Inicializa o módulo de produtos usando as diretrizes oficiais da Abella Joias
     */
    init(firebaseDb, path = '') {
        // Usa o helper oficial global se disponível, garantindo o nó correto ('products')
        const nóOficial = typeof window.getAbellaPath === 'function' 
            ? window.getAbellaPath('products') 
            : 'abella/products';

        this.dbRef = firebaseDb.ref(nóOficial);
        this._configurarEventosGerais();
        this.listarProdutos();
    },

    /**
     * Event Delegation para evitar onclick inline
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
     * Escuta em tempo real o nó oficial do Firebase
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
     * Renderiza os produtos aplicando as chaves oficiais do banco (sku, nome, price, paused)
     */
    renderProdutos(produtos) {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        const ids = Object.keys(produtos);
        
        if (ids.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-zinc-500 text-xs uppercase tracking-wider font-bold">Nenhum produto encontrado no banco.</div>`;
            return;
        }

        let html = '';
        ids.forEach(id => {
            const p = produtos[id];
            
            // Regra oficial: p.paused === true significa que o produto está pausado
            const isPausado = p.paused === true || p.status === 'pausado';
            const statusColor = !isPausado ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30';
            const statusText = !isPausado ? 'ATIVO' : 'PAUSADO';

            // Mapeamento blindado de valores (aceita strings antigas e numéricos)
            const valorBruto = p.price !== undefined ? p.price : (p.precoFinal || p.preco || 0);
            const precoNum = typeof valorBruto === 'string' ? parseFloat(valorBruto.replace(',', '.')) : valorBruto;
            const precoFormatado = !isNaN(precoNum) ? precoNum.toFixed(2).replace('.', ',') : '0,00';

            // Fallbacks de propriedades oficiais do banco
            const titulo = p.nome || p.name || 'Produto Sem Nome';
            const urlImagem = p.image || p.imagem || '';
            const referencia = p.sku || p.ref || id;

            html += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-2 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center relative flex-shrink-0">
                            <img src="${urlImagem}" class="w-full h-full object-cover relative z-10" onerror="this.style.opacity='0'">
                            <span class="absolute text-[9px] text-zinc-700 font-bold uppercase select-none">Sem Foto</span>
                        </div>
                        <div>
                            <div class="text-[10px] text-zinc-500 font-mono tracking-wider">SKU/REF: ${referencia}</div>
                            <div class="text-sm font-bold text-zinc-200 mt-0.5">${titulo}</div>
                            <div class="text-xs text-[#caa85c] font-black mt-1">R$ ${precoFormatado}</div>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t border-zinc-900/50 sm:border-0 pt-3 sm:pt-0">
                        <span class="text-[9px] font-black px-2.5 py-1 rounded-lg ${statusColor} tracking-widest">${statusText}</span>
                        
                        <div class="flex items-center gap-1.5">
                            <button data-action="editar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black hover:border-[#caa85c] transition-all text-xs" title="Editar Peça">
                                ✏️
                            </button>
                            <button data-action="duplicar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-zinc-200 transition-all text-xs" title="Duplicar Item">
                                📋
                            </button>
                            <button data-action="pausar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-zinc-200 transition-all text-xs" title="Alternar Status">
                                ⏸️
                            </button>
                            <button data-action="excluir" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-xs" title="Remover Definitivamente">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    /**
     * Abre o formulário para criação
     */
    abrirNovoProduto(categoriasDisponiveis = {}) {
        const formHtml = this._gerarFormularioHTML('novo', '', {}, categoriasDisponiveis);
        Drawer.open({
            title: '➕ CADASTRAR PRODUTO NO BRUTO',
            content: formHtml,
            width: '600px'
        });
        
        setTimeout(() => {
            document.getElementById('btn-salvar-produto')?.addEventListener('click', () => this.salvarProduto('novo'));
        }, 100);
    },

    /**
     * Abre o formulário carregando o cache da memória instantaneamente
     */
    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        // Dispara uma solicitação silenciosa das categorias atuais se necessário para preencher o select
        const formHtml = this._gerarFormularioHTML('editar', id, produto, {});
        Drawer.open({
            title: `✏️ EDITAR PRODUTO`,
            content: formHtml,
            width: '600px'
        });

        setTimeout(() => {
            document.getElementById('btn-salvar-produto')?.addEventListener('click', () => this.salvarProduto(id));
        }, 100);
    },

    /**
     * Grava salvando estritamente a árvore oficial do banco da Abella Joias
     */
    async salvarProduto(idOuAcao) {
        const nome = document.getElementById('prod-nome')?.value.trim();
        const price = document.getElementById('prod-price')?.value;
        const sku = document.getElementById('prod-sku')?.value.trim();
        const image = document.getElementById('prod-image')?.value.trim() || '';
        const category = document.getElementById('prod-category')?.value || '';

        if (!nome || !price) {
            alert("Nome e Preço são campos obrigatórios!");
            return;
        }

        const dadosProduto = {
            name: nome,
            nome: nome,
            price: parseFloat(price.replace(',', '.')),
            precoFinal: parseFloat(price.replace(',', '.')),
            sku: sku || Date.now().toString(),
            image: image,
            imagem: image,
            category: category,
            updatedAt: Date.now()
        };

        try {
            if (idOuAcao === 'novo') {
                dadosProduto.paused = false;
                dadosProduto.createdAt = Date.now();
                await this.dbRef.push(dadosProduto);
            } else {
                await this.dbRef.child(idOuAcao).update(dadosProduto);
            }
            Drawer.close();
        } catch (error) {
            console.error("Erro ao persistir dados:", error);
        }
    },

    /**
     * Alterna o estado com a propriedade oficial .paused
     */
    async pausarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        // Se p.paused for true, vira false. Se não existir ou for false, vira true.
        const novoStatus = produto.paused === true ? false : true;

        try {
            await this.dbRef.child(id).update({
                paused: novoStatus,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error("Erro ao alterar status:", error);
        }
    },

    async duplicarProduto(id) {
        const original = this.produtosEmMemoria[id];
        if (!original) return;

        const copia = {
            ...original,
            name: `${original.name || original.nome} (Cópia)`,
            nome: `${original.nome || original.name} (Cópia)`,
            sku: `${original.sku || ''}-COPY`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        try {
            await this.dbRef.push(copia);
        } catch (error) {
            console.error("Erro ao duplicar produto:", error);
        }
    },

    async excluirProduto(id) {
        if (confirm("Deseja deletar este item permanentemente do banco?")) {
            try {
                await this.dbRef.child(id).remove();
            } catch (error) {
                console.error("Erro ao remover:", error);
            }
        }
    },

    /**
     * Montagem do formulário respeitando os campos da Abella Joias
     */
    _gerarFormularioHTML(modo, id = '', p = {}, categorias = {}) {
        const isEdit = modo === 'editar';
        const titulo = isEdit ? (p.nome || p.name || '') : '';
        const skuValor = isEdit ? (p.sku || p.ref || '') : '';
        const precoValor = isEdit ? (p.price || p.precoFinal || p.preco || '') : '';
        const urlImagem = isEdit ? (p.image || p.imagem || '') : '';

        return `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-zinc-400">SKU / Referência</label>
                    <input type="text" id="prod-sku" value="${skuValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]">
                </div>
                <div>
                    <label class="text-xs text-zinc-400">Nome da Joia (Atacado)</label>
                    <input type="text" id="prod-nome" value="${titulo}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]">
                </div>
                <div>
                    <label class="text-xs text-zinc-400">Preço Base (R$)</label>
                    <input type="text" id="prod-price" value="${precoValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]" placeholder="0.00">
                </div>
                <div>
                    <label class="text-xs text-zinc-400">URL da Imagem</label>
                    <input type="text" id="prod-image" value="${urlImagem}" class="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-white outline-none focus:border-[#caa85c]" placeholder="https://...">
                </div>
                <button id="btn-salvar-produto" type="button" class="w-full bg-[#caa85c] text-black font-bold py-3 rounded hover:bg-opacity-90 transition-opacity mt-6">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Cadastrar Item'}
                </button>
            </div>
        `;
    }
};
