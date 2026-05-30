const CarrinhoService = {
    obterCarrinho() {
        return StorageUtils.obter('carrinho_abella') || [];
    },

    adicionar(produto, quantidade = 1) {
        let carrinho = this.obterCarrinho();
        const index = carrinho.findIndex(item => item.id === produto.id);

        if (index > -1) {
            carrinho[index].quantidade += quantidade;
        } else {
            carrinho.push({
    ...produto,
    quantidade
});
        }
        StorageUtils.salvar('carrinho_abella', carrinho);
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    },

    remover(produtoId) {
        let carrinho = this.obterCarrinho();
        carrinho = carrinho.filter(item => item.id !== produtoId);
        StorageUtils.salvar('carrinho_abella', carrinho);
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    }
};
