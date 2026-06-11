// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v5.0.1 (Refatorado)
// ======================================================================

const CarrinhoService = {
    STORAGE_KEY: 'abella_carrinho',

    // --- HELPERS ---
    _safeParse(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            console.error('[Carrinho] Erro parse JSON:', e);
            return [];
        }
    },

    _safeNumber(valor, fallback = 0) {
        const n = Number(valor);
        return Number.isFinite(n) ? n : fallback;
    },

    _normalizarTexto(valor) {
        return (valor || '').toString().trim();
    },

    // --- ACESSO AOS DADOS ---
    getItens() {
        return this._safeParse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    },

    salvarTodos(itens = []) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(itens));
            this.notificarMudanca();
        } catch (e) {
            console.error('[Carrinho] Erro ao salvar:', e);
        }
    },

    // --- OPERAÇÕES ---
    adicionar(produto, quantidade = 1, variacao = null) {
        if (!produto || typeof produto !== 'object') {
            console.error('[Carrinho] Produto inválido:', produto);
            return false;
        }

        let itens = this.getItens();
        const qtd = Math.max(1, parseInt(quantidade, 10) || 1);

        const sku = this._normalizarTexto(produto.sku || produto.id || produto.codigo).toUpperCase();
        if (!sku) return false;

        const preco = Math.max(0, this._safeNumber(produto.precoFinal ?? produto.price ?? produto.preco ?? produto.valor ?? 0));
        const peso = Math.min(10000, Math.max(0, this._safeNumber(produto.peso ?? produto.weight ?? 0)));
        const imagem = produto.image || produto.imagem || produto.foto || '';
        const variacaoFinal = variacao || produto.variacao || null;

        // Lógica de comparação de variação
        const getVariacaoKey = (v) => {
            if (!v) return 'null';
            if (typeof v === 'object') {
                return JSON.stringify(Object.keys(v).sort().reduce((acc, key) => {
                    acc[key] = v[key];
                    return acc;
                }, {}));
            }
            return String(v).trim().toLowerCase();
        };

        const variacaoKey = getVariacaoKey(variacaoFinal);
        const index = itens.findIndex(item => {
            const itemSku = String(item.sku || '').trim().toUpperCase();
            return itemSku === sku && getVariacaoKey(item.variacao) === variacaoKey;
        });

        if (index >= 0) {
            itens[index].quantidade += qtd;
            itens[index].precoFinal = itens[index].price = preco;
            itens[index].peso = itens[index].weight = peso;
            itens[index].image = itens[index].imagem = imagem;
            itens[index].updatedAt = Date.now();
        } else {
            itens.push({
                id: produto.id || sku,
                sku,
                nome: produto.nome || produto.name || 'Produto',
                name: produto.nome || produto.name || 'Produto',
                image: imagem,
                imagem: imagem,
                categoria: produto.categorySlug || produto.category || produto.categoria || '',
                subcategoria: produto.subcategorySlug || produto.subcategory || produto.subcategoria || '',
                precoFinal: preco,
                price: preco,
                peso: peso,
                weight: peso,
                quantidade: qtd,
                variacao: variacaoFinal,
                descricao: produto.descricao || produto.description || '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }

        this.salvarTodos(itens);
        return true;
    },

    adicionarItem(produto, quantidade = 1) {
        return this.adicionar(produto, quantidade, produto.variacao || null);
    },

    remover(index) {
        const itens = this.getItens();
        if (index >= 0 && index < itens.length) {
            itens.splice(index, 1);
            this.salvarTodos(itens);
        }
    },

    atualizarQuantidade(index, quantidade) {
        const itens = this.getItens();
        if (itens[index]) {
            itens[index].quantidade = Math.max(1, parseInt(quantidade, 10) || 1);
            itens[index].updatedAt = Date.now();
            this.salvarTodos(itens);
        }
    },

    limpar() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.notificarMudanca();
    },

    // --- CÁLCULOS ---
    calcularTotais(descontoPixPercentual = 5) {
        const itens = this.getItens();
        let subtotal = 0, pesoTotal = 0, totalPecas = 0;

        itens.forEach(item => {
            const preco = this._safeNumber(item.precoFinal ?? item.price ?? 0);
            const qtd = Math.max(1, parseInt(item.quantidade) || 1);
            subtotal += (preco * qtd);
            pesoTotal += (this._safeNumber(item.peso ?? item.weight ?? 0) * qtd);
            totalPecas += qtd;
        });

        const descontoPix = Number((subtotal * (descontoPixPercentual / 100)).toFixed(2));
        
        return {
            subtotal: Number(subtotal.toFixed(2)),
            pesoTotal: Number(pesoTotal.toFixed(2)),
            totalPecas,
            descontoPix,
            totalPix: Number((subtotal - descontoPix).toFixed(2)),
            parcelado6x: Number((subtotal / 6).toFixed(2))
        };
    },

    getResumo() { return this.calcularTotais(); },
    possuiItens() { return this.getItens().length > 0; },
    
    notificarMudanca() {
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    }
};

// --- ALIASES LEGACY PARA COMPATIBILIDADE ---
CarrinhoService.obterItens = CarrinhoService.getItens.bind(CarrinhoService);
CarrinhoService.obterResumo = CarrinhoService.getResumo.bind(CarrinhoService);
CarrinhoService.limparCarrinho = CarrinhoService.limpar.bind(CarrinhoService);
CarrinhoService.removerItem = CarrinhoService.remover.bind(CarrinhoService);

window.CarrinhoService = window.carrinhoService = CarrinhoService;

console.info('🛒 CarrinhoService Premium v5.0.1 carregado.');
