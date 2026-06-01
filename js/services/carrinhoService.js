// js/services/carrinhoService.js

const CarrinhoService = {
    getItens: function() {
        return JSON.parse(localStorage.getItem('carrinho') || '[]');
    },

    salvarTodos: function(itens) {
        localStorage.setItem('carrinho', JSON.stringify(itens));
        this.notificarMudanca();
    },

    adicionar: function(produto, quantidade = 1, variacao = null) {
        let itens = this.getItens();
        const precoUnitario = parseFloat(produto.price || produto.precoFinal || 0);
        const pesoUnitario = parseFloat(produto.weight || produto.peso || 0);

        const index = itens.findIndex(i => i.sku === produto.sku && i.variacao === variacao);
        if (index > -1) {
            itens[index].quantidade = (parseInt(itens[index].quantidade) || 0) + parseInt(quantidade);
        } else {
            itens.push({
                sku: produto.sku || '',
                nome: produto.name || produto.nome || '',
                name: produto.name || produto.nome || '',
                image: produto.image || produto.imagem || '',
                price: precoUnitario,
                precoFinal: precoUnitario,
                weight: pesoUnitario,
                peso: pesoUnitario,
                quantidade: parseInt(quantidade),
                variacao: variacao
            });
        }
        this.salvarTodos(itens);
    },

    remover: function(index) {
        let itens = this.getItens();
        itens.splice(index, 1);
        this.salvarTodos(itens);
    },

    atualizarQuantidade: function(index, qtd) {
        let itens = this.getItens();
        if (itens[index]) {
            itens[index].quantidade = Math.max(1, parseInt(qtd) || 1);
            this.salvarTodos(itens);
        }
    },

    limpar: function() {
        localStorage.removeItem('carrinho');
        this.notificarMudanca();
    },

    calcularTotais: function(pixDescPorcentagem = 5) {
        const itens = this.getItens();
        let subtotal = 0;
        let totalPecas = 0;
        let pesoTotal = 0;

        itens.forEach(item => {
            const p = parseFloat(item.price || item.precoFinal || 0);
            const q = parseInt(item.quantidade || 1);
            const w = parseFloat(item.weight || item.peso || 0);

            subtotal += parseFloat((p * q).toFixed(2));
            totalPecas += q;
            pesoTotal += parseFloat((w * q).toFixed(2));
        });

        subtotal = parseFloat(subtotal.toFixed(2));
        const descontoPix = parseFloat((subtotal * (pixDescPorcentagem / 100)).toFixed(2));
        const totalPix = parseFloat((subtotal - descontoPix).toFixed(2));

        return {
            subtotal,
            totalPecas,
            pesoTotal: parseFloat(pesoTotal.toFixed(2)),
            descontoPix,
            totalPix
        };
    },

    notificarMudanca: function() {
        const event = new Event('carrinhoAtualizado');
        window.dispatchEvent(event);
        if (typeof window.atualizarContadorCarrinho === 'function') window.atualizarContadorCarrinho();
        if (typeof window.carregarItensCarrinho === 'function') window.carregarItensCarrinho();
    }
};

window.CarrinhoService = CarrinhoService;
