import { Drawer } from './drawer.js';

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {}, 

    /**
     * Inicializa o módulo de produtos usando as diretrizes oficiais da Abella Joias
     */
    init(firebaseDb, path = '') {
        const nóOficial = typeof window.getAbellaPath === 'function' 
            ? window.getAbellaPath('products') 
            : 'abella/products';

        this.dbRef = firebaseDb.ref(nóOficial);
        this._configurarEventosGerais();
        this.listarProdutos();
    },

    /**
     * Event Delegation para os botões da lista
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
     * Renderiza a lista de produtos com suporte completo a pesos e promoções
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
            
            const isPausado = p.paused === true || p.status === 'pausado';
            const statusColor = !isPausado ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30';
            const statusText = !isPausado ? 'ATIVO' : 'PAUSADO';

            const precoBase = parseFloat(p.price || p.precoFinal || p.preco || 0);
            const precoPromo = parseFloat(p.promo || 0);
            
            let precoHtml = `<div class="text-xs text-[#caa85c] font-black mt-1">R$ ${precoBase.toFixed(2).replace('.', ',')}</div>`;
            if (precoPromo > 0) {
                precoHtml = `
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-[11px] text-zinc-500 line-through">R$ ${precoBase.toFixed(2).replace('.', ',')}</span>
                        <span class="text-xs text-green-400 font-black">R$ ${precoPromo.toFixed(2).replace('.', ',')}</span>
                    </div>
                `;
            }

            const titulo = p.nome || p.name || 'Produto Sem Nome';
            const urlImagem = p.image || p.imagem || p.imagemDesktop || '';
            const referencia = p.sku || p.ref || id;
            const pesoExibido = p.peso || p.weight || 0;

            html += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-2 bg-zinc-950 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center relative flex-shrink-0">
                            <img src="${urlImagem}" class="w-full h-full object-cover relative z-10" onerror="this.style.opacity='0'">
                            <span class="absolute text-[9px] text-zinc-700 font-bold uppercase select-none">Sem Foto</span>
                        </div>
                        <div>
                            <div class="text-[10px] text-zinc-500 font-mono tracking-wider">SKU: ${referencia} • <span class="text-zinc-400">${pesoExibido}g</span></div>
                            <div class="text-sm font-bold text-zinc-200 mt-0.5">${titulo}</div>
                            ${precoHtml}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto border-t border-zinc-900/50 sm:border-0 pt-3 sm:pt-0">
                        <span class="text-[9px] font-black px-2.5 py-1 rounded-lg ${statusColor} tracking-widest">${statusText}</span>
                        
                        <div class="flex items-center gap-1.5">
                            <button data-action="editar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black hover:border-[#caa85c] transition-all text-xs">
                                ✏️
                            </button>
                            <button data-action="duplicar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-zinc-200 transition-all text-xs">
                                📋
                            </button>
                            <button data-action="pausar" data-id="${id}" class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-800 hover:text-zinc-200 transition-all text-xs">
                                ⏸️
                            </button>
                            <button data-action="excluir" data-id="${id}" class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all text-xs">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    abrirNovoProduto(categoriasDisponiveis = {}) {
        const formHtml = this._gerarFormularioHTML('novo', '', {}, categoriasDisponiveis);
        Drawer.open({
            title: '➕ CADASTRAR NOVA JOIA NO BRUTO',
            content: formHtml,
            width: '650px'
        });
        
        this._vincularOuvintesFormulario('novo');
    },

    abrirEditarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;

        const formHtml = this._gerarFormularioHTML('editar', id, produto, {});
        Drawer.open({
            title: `✏️ EDITAR PRODUTO`,
            content: formHtml,
            width: '650px'
        });

        this._vincularOuvintesFormulario(id);
    },

    /**
     * Vincula listeners de salvamento e atualização dinâmica de imagem em tempo real
     * @private
     */
    _vincularOuvintesFormulario(idOuAcao) {
        setTimeout(() => {
            // Gatilho do botão salvar
            document.getElementById('btn-salvar-produto')?.addEventListener('click', () => this.salvarProduto(idOuAcao));

            // Ouvinte dinâmico para atualizar o Preview da Imagem digitada/colada
            const inputImg = document.getElementById('prod-image');
            const previewImg = document.getElementById('preview-modal-produto');
            
            inputImg?.addEventListener('input', (e) => {
                if (previewImg) {
                    previewImg.src = e.target.value.trim();
                    previewImg.style.opacity = e.target.value.trim() ? '1' : '0';
                }
            });
        }, 100);
    },

    /**
     * Salva o produto capturando a totalidade dos inputs do formulário estendido
     */
    async salvarProduto(idOuAcao) {
        const nome = document.getElementById('prod-nome')?.value.trim();
        const price = document.getElementById('prod-price')?.value;
        const promo = document.getElementById('prod-promo')?.value || '0';
        const peso = document.getElementById('prod-peso')?.value || '0';
        const sku = document.getElementById('prod-sku')?.value.trim();
        const image = document.getElementById('prod-image')?.value.trim() || '';
        const imagemMobile = document.getElementById('prod-image-mobile')?.value.trim() || '';
        const category = document.getElementById('prod-category')?.value || '';
        const variacaoTipo = document.getElementById('prod-variacao')?.value || '';

        if (!nome || !price) {
            alert("Nome e Preço Base são obrigatórios!");
            return;
        }

        const dadosProduto = {
            name: nome,
            nome: nome,
            price: parseFloat(price.toString().replace(',', '.')),
            precoFinal: parseFloat(price.toString().replace(',', '.')),
            promo: parseFloat(promo.toString().replace(',', '.')),
            peso: parseFloat(peso.toString().replace(',', '.')),
            weight: parseFloat(peso.toString().replace(',', '.')),
            sku: sku || Date.now().toString(),
            image: image,
            imagem: image,
            imagemDesktop: image,
            imagemMobile: imagemMobile,
            category: category,
            variacaoTipo: variacaoTipo,
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
            console.error("Erro ao persistir dados completos:", error);
        }
    },

    async pausarProduto(id) {
        const produto = this.produtosEmMemoria[id];
        if (!produto) return;
        const novoStatus = produto.paused === true ? false : true;
        try {
            await this.dbRef.child(id).update({ paused: novoStatus, updatedAt: Date.now() });
        } catch (error) {
            console.error(error);
        }
    },

    async duplicarProduto(id) {
        const original = this.produtosEmMemoria[id];
        if (!original) return;
        const copia = {
            ...original,
            name: `${original.name || original.nome} (Cópia)`,
            nome: `${original.nome || original.name} (Cópia)`,
            sku: `${original.sku || Date.now()}-COPY`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        try { await this.dbRef.push(copia); } catch (error) { console.error(error); }
    },

    async excluirProduto(id) {
        if (confirm("Deletar permanentemente do banco?")) {
            try { await this.dbRef.child(id).remove(); } catch (error) { console.error(error); }
        }
    },

    /**
     * Formulário Estendido contendo todos os inputs e a caixa visual de Preview de Foto
     */
    _gerarFormularioHTML(modo, id = '', p = {}, categorias = {}) {
        const isEdit = modo === 'editar';
        
        const nomeValor = isEdit ? (p.nome || p.name || '') : '';
        const skuValor = isEdit ? (p.sku || p.ref || '') : '';
        const precoValor = isEdit ? (p.price || p.precoFinal || p.preco || '') : '';
        const promoValor = isEdit ? (p.promo || '0') : '0';
        const pesoValor = isEdit ? (p.peso || p.weight || '0') : '0';
        const imgDesktop = isEdit ? (p.image || p.imagem || p.imagemDesktop || '') : '';
        const imgMobile = isEdit ? (p.imagemMobile || '') : '';
        const catSelecionada = isEdit ? (p.category || p.categoria || '') : '';
        const varSelecionada = isEdit ? (p.variacaoTipo || '') : '';

        return `
            <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Visualização Prévia do Produto</label>
                    <div class="w-full h-44 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative flex items-center justify-center border-dashed">
                        <div class="absolute text-xs text-zinc-600 select-none pointer-events-none">Sem imagem ou URL inválida</div>
                        <img id="preview-modal-produto" src="${imgDesktop}" class="w-full h-full object-cover relative z-10" onerror="this.style.opacity='0'" onload="this.style.opacity='1'">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">SKU / Referência</label>
                        <input type="text" id="prod-sku" value="${skuValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Peso da Peça (g)</label>
                        <input type="text" id="prod-peso" value="${pesoValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Joia</label>
                    <input type="text" id="prod-nome" value="${nomeValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="Ex: Anel Coração Vazado Zircônia">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Base (R$)</label>
                        <input type="text" id="prod-price" value="${precoValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="0.00">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Promocional (R$ - Opcional)</label>
                        <input type="text" id="prod-promo" value="${promoValor}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="0.00">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Vinculada</label>
                        <input type="text" id="prod-category" value="${catSelecionada}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="Ex: Aneis">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Tipo de Variação de Banho</label>
                        <select id="prod-variacao" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]">
                            <option value="" ${varSelecionada === '' ? 'selected' : ''}>Sem Variação</option>
                            <option value="banho" ${varSelecionada === 'banho' ? 'selected' : ''}>Variação de Banho Padrão</option>
                            <option value="tamanho" ${varSelecionada === 'tamanho' ? 'selected' : ''}>Variação por Tamanho / Aro</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL Imagem Desktop (Principal)</label>
                    <input type="text" id="prod-image" value="${imgDesktop}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="https://... ou gs://...">
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL Imagem Mobile (Opcional)</label>
                    <input type="text" id="prod-image-mobile" value="${imgMobile}" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white outline-none focus:border-[#caa85c]" placeholder="https://...">
                </div>

                <button id="btn-salvar-produto" type="button" class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-opacity mt-6 tracking-wide text-xs uppercase">
                    ${isEdit ? '💾 Salvar Alterações' : '➕ Cadastrar Item no Catálogo'}
                </button>
            </div>
        `;
    }
};
