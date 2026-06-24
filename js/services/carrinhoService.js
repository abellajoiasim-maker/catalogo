// services/carrinhoService.js
export const CarrinhoService = {
    CHAVE_STORAGE: 'abella_carrinho_v7',

    obterCarrinho() {
        try {
            return JSON.parse(localStorage.getItem(this.CHAVE_STORAGE)) || [];
        } catch {
            return [];
        }
    },

    adicionar(produto, variacoesSelecionadas) {
        if (!produto || !produto.id) return;
        
        let carrinho = this.obterCarrinho();
        const itemExistenteIndex = carrinho.findIndex(item => item.produtoId === produto.id);
        
        const precoOriginal = Number(produto.preco || 0);
        const precoFinalCalculado = DescontoService.calcularPrecoFinal(produto);
        const valorDescontoAplicado = precoOriginal - precoFinalCalculado;
        const totalQtdAdicionada = variacoesSelecionadas.reduce((acc, v) => acc + v.quantidade, 0);
        
        if (totalQtdAdicionada <= 0) return;

        // Regra Absoluta Nº 6: Estrutura exata salva no carrinho
        if (itemExistenteIndex > -1) {
            variacoesSelecionadas.forEach(vNova => {
                const vExistente = carrinho[itemExistenteIndex].variacoes.find(v => v.id === vNova.id);
                if (vExistente) {
                    vExistente.quantidade += vNova.quantidade;
                } else {
                    carrinho[itemExistenteIndex].variacoes.push(vNova);
                }
            });
            carrinho[itemExistenteIndex].quantidadeTotal = carrinho[itemExistenteIndex].variacoes.reduce((acc, v) => acc + v.quantidade, 0);
            carrinho[itemExistenteIndex].subtotal = carrinho[itemExistenteIndex].quantidadeTotal * precoFinalCalculado;
        } else {
            const novoItem = {
                produtoId: produto.id,
                nome: produto.nome,
                peso: Number(produto.peso || 0), // Regra Nº 4: Peso vem direto do produto
                preco: precoFinalCalculado,
                precoOriginal: precoOriginal,
                precoFinal: precoFinalCalculado,
                desconto: valorDescontoAplicado,
                quantidadeTotal: totalQtdAdicionada,
                variacoes: variacoesSelecionadas,
                subtotal: totalQtdAdicionada * precoFinalCalculado
            };
            carrinho.push(novoItem);
        }

        localStorage.setItem(this.CHAVE_STORAGE, JSON.stringify(carrinho));
        document.dispatchEvent(new CustomEvent('carrinho:atualizado'));
    }
};
