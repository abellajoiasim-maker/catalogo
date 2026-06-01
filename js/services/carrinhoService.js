// ======================================================================
// js/firebase/services/carrinhoService.js
// Abella Joias - CarrinhoService v3.0
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: "carrinho",

    // ==========================================================
    // Helpers
    // ==========================================================

    _normalizarProduto(
        produto = {},
        quantidade = 1,
        variacao = null
    ) {

        const preco = Number(
            produto.price ??
            produto.precoFinal ??
            produto.preco ??
            0
        );

        const peso = Number(
            produto.weight ??
            produto.peso ??
            0
        );

        return {

            sku:
                produto.sku || "",

            nome:
                produto.name ||
                produto.nome ||
                "",

            name:
                produto.name ||
                produto.nome ||
                "",

            image:
                produto.image ||
                produto.imagem ||
                "",

            price: preco,

            precoFinal: preco,

            weight: peso,

            peso: peso,

            quantidade: Math.max(
                1,
                Number(quantidade) || 1
            ),

            variacao:
                variacao || null
        };
    },

    // ==========================================================
    // Buscar Itens
    // ==========================================================

    getItens() {

        try {

            return JSON.parse(
                localStorage.getItem(
                    this.STORAGE_KEY
                ) || "[]"
            );

        } catch (error) {

            console.error(
                "[CarrinhoService:getItens]",
                error
            );

            return [];
        }
    },

    // ==========================================================
    // Salvar
    // ==========================================================

    salvarTodos(itens = []) {

        try {

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(itens)
            );

            this.notificarMudanca();

        } catch (error) {

            console.error(
                "[CarrinhoService:salvarTodos]",
                error
            );
        }
    },

    // ==========================================================
    // Adicionar
    // ==========================================================

    adicionar(
        produto,
        quantidade = 1,
        variacao = null
    ) {

        let itens =
            this.getItens();

        const item =
            this._normalizarProduto(
                produto,
                quantidade,
                variacao
            );

        const index =
            itens.findIndex(i =>

                i.sku === item.sku &&
                i.variacao === item.variacao
            );

        if (index >= 0) {

            itens[index].quantidade +=
                item.quantidade;

        } else {

            itens.push(item);
        }

        this.salvarTodos(itens);

        return itens;
    },

    // ==========================================================
    // Remover
    // ==========================================================

    remover(index) {

        let itens =
            this.getItens();

        if (
            index < 0 ||
            index >= itens.length
        ) {
            return false;
        }

        itens.splice(
            index,
            1
        );

        this.salvarTodos(itens);

        return true;
    },

    // ==========================================================
    // Buscar Item
    // ==========================================================

    buscarPorSku(
        sku,
        variacao = null
    ) {

        return this
            .getItens()
            .find(

                item =>

                    item.sku === sku &&
                    item.variacao === variacao
            );
    },

    // ==========================================================
    // Atualizar Quantidade
    // ==========================================================

    atualizarQuantidade(
        index,
        quantidade
    ) {

        let itens =
            this.getItens();

        if (!itens[index]) {
            return false;
        }

        itens[index].quantidade =
            Math.max(
                1,
                Number(quantidade) || 1
            );

        this.salvarTodos(itens);

        return true;
    },

    // ==========================================================
    // Incrementar
    // ==========================================================

    incrementar(index) {

        let itens =
            this.getItens();

        if (!itens[index]) {
            return false;
        }

        itens[index].quantidade++;

        this.salvarTodos(itens);

        return true;
    },

    // ==========================================================
    // Decrementar
    // ==========================================================

    decrementar(index) {

        let itens =
            this.getItens();

        if (!itens[index]) {
            return false;
        }

        itens[index].quantidade =
            Math.max(
                1,
                itens[index].quantidade - 1
            );

        this.salvarTodos(itens);

        return true;
    },

    // ==========================================================
    // Limpar
    // ==========================================================

    limpar() {

        localStorage.removeItem(
            this.STORAGE_KEY
        );

        this.notificarMudanca();
    },

    // ==========================================================
    // Totais
    // ==========================================================

    calcularTotais(
        pixDescPorcentagem = 5
    ) {

        const itens =
            this.getItens();

        let subtotal = 0;
        let totalItens = 0;
        let totalPecas = 0;
        let pesoTotal = 0;

        itens.forEach(item => {

            const preco =
                Number(
                    item.price ??
                    item.precoFinal ??
                    0
                );

            const qtd =
                Number(
                    item.quantidade ?? 1
                );

            const peso =
                Number(
                    item.weight ??
                    item.peso ??
                    0
                );

            subtotal +=
                preco * qtd;

            totalPecas += qtd;

            totalItens++;

            pesoTotal +=
                peso * qtd;
        });

        subtotal =
            Number(
                subtotal.toFixed(2)
            );

        pesoTotal =
            Number(
                pesoTotal.toFixed(2)
            );

        const descontoPix =
            Number(
                (
                    subtotal *
                    (
                        Number(
                            pixDescPorcentagem
                        ) / 100
                    )
                ).toFixed(2)
            );

        const totalPix =
            Number(
                (
                    subtotal -
                    descontoPix
                ).toFixed(2)
            );

        return {

            subtotal,

            totalItens,

            totalPecas,

            pesoTotal,

            descontoPix,

            totalPix
        };
    },

    // ==========================================================
    // Quantidade Total
    // ==========================================================

    getQuantidadeTotal() {

        return this
            .getItens()
            .reduce(

                (acc, item) =>

                    acc +
                    Number(
                        item.quantidade || 0
                    ),

                0
            );
    },

    // ==========================================================
    // Eventos
    // ==========================================================

    notificarMudanca() {

        try {

            window.dispatchEvent(
                new Event(
                    "carrinhoAtualizado"
                )
            );

            if (
                typeof window
                    .atualizarContadorCarrinho ===
                "function"
            ) {

                window
                    .atualizarContadorCarrinho();
            }

            if (
                typeof window
                    .carregarItensCarrinho ===
                "function"
            ) {

                window
                    .carregarItensCarrinho();
            }

        } catch (error) {

            console.error(
                "[CarrinhoService:notificarMudanca]",
                error
            );
        }
    }
};

window.CarrinhoService =
    CarrinhoService;
