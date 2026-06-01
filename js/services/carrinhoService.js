// ======================================================================
// js/firebase/services/carrinhoService.js
// Abella Joias - CarrinhoService v2.0
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: 'carrinho',

    // ==========================================================
    // Helpers
    // ==========================================================

    _safeParse(json) {

        try {
            return JSON.parse(json);
        } catch {
            return [];
        }
    },

    _safeNumber(value, fallback = 0) {

        const n = Number(value);

        return Number.isFinite(n)
            ? n
            : fallback;
    },

    // ==========================================================
    // Obter Itens
    // ==========================================================

    getItens() {

        return this._safeParse(
            localStorage.getItem(
                this.STORAGE_KEY
            ) || '[]'
        );
    },

    // ==========================================================
    // Salvar Carrinho
    // ==========================================================

    salvarTodos(itens = []) {

        localStorage.setItem(
            this.STORAGE_KEY,
            JSON.stringify(itens)
        );

        this.notificarMudanca();
    },

    // ==========================================================
    // Adicionar Produto
    // ==========================================================

    adicionar(
        produto,
        quantidade = 1,
        variacao = null
    ) {

        if (!produto) {
            return;
        }

        let itens =
            this.getItens();

        quantidade =
            Math.max(
                1,
                parseInt(quantidade) || 1
            );

        const precoUnitario =
            this._safeNumber(
                produto.price ??
                produto.precoFinal ??
                produto.preco
            );

        const pesoUnitario =
            this._safeNumber(
                produto.weight ??
                produto.peso
            );

        const sku =
            produto.sku || '';

        const index =
            itens.findIndex(item =>
                item.sku === sku &&
                item.variacao === variacao
            );

        if (index >= 0) {

            itens[index].quantidade +=
                quantidade;

        } else {

            itens.push({

                sku,

                nome:
                    produto.name ||
                    produto.nome ||
                    '',

                name:
                    produto.name ||
                    produto.nome ||
                    '',

                image:
                    produto.image ||
                    produto.imagem ||
                    '',

                price:
                    precoUnitario,

                precoFinal:
                    precoUnitario,

                weight:
                    pesoUnitario,

                peso:
                    pesoUnitario,

                quantidade,

                variacao
            });
        }

        this.salvarTodos(itens);
    },

    // ==========================================================
    // Remover Produto
    // ==========================================================

    remover(index) {

        const itens =
            this.getItens();

        if (
            index < 0 ||
            index >= itens.length
        ) {
            return;
        }

        itens.splice(index, 1);

        this.salvarTodos(itens);
    },

    // ==========================================================
    // Atualizar Quantidade
    // ==========================================================

    atualizarQuantidade(
        index,
        quantidade
    ) {

        const itens =
            this.getItens();

        if (!itens[index]) {
            return;
        }

        itens[index].quantidade =
            Math.max(
                1,
                parseInt(
                    quantidade
                ) || 1
            );

        this.salvarTodos(itens);
    },

    // ==========================================================
    // Verificar Existência
    // ==========================================================

    existeProduto(
        sku,
        variacao = null
    ) {

        return this
            .getItens()
            .some(item =>
                item.sku === sku &&
                item.variacao === variacao
            );
    },

    // ==========================================================
    // Limpar Carrinho
    // ==========================================================

    limpar() {

        localStorage.removeItem(
            this.STORAGE_KEY
        );

        this.notificarMudanca();
    },

    // ==========================================================
    // Quantidade de Produtos
    // ==========================================================

    getQuantidadeProdutos() {

        return this
            .getItens()
            .length;
    },

    // ==========================================================
    // Quantidade Total de Peças
    // ==========================================================

    getQuantidadeItens() {

        return this
            .getItens()
            .reduce(
                (acc, item) =>
                    acc +
                    (
                        parseInt(
                            item.quantidade
                        ) || 0
                    ),
                0
            );
    },
    getResumo() {

    return this.calcularTotais();

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
        let totalPecas = 0;
        let pesoTotal = 0;

        itens.forEach(item => {

            const preco =
                this._safeNumber(
                    item.price ??
                    item.precoFinal
                );

            const quantidade =
                Math.max(
                    1,
                    parseInt(
                        item.quantidade
                    ) || 1
                );

            const peso =
                this._safeNumber(
                    item.weight ??
                    item.peso
                );

            subtotal +=
                preco *
                quantidade;

            totalPecas +=
                quantidade;

            pesoTotal +=
                peso *
                quantidade;
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
                        pixDescPorcentagem /
                        100
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

            totalPecas,

            pesoTotal,

            descontoPix,

            totalPix
        };
    },

    // ==========================================================
    // Eventos
    // ==========================================================

    notificarMudanca() {

        window.dispatchEvent(
            new Event(
                'carrinhoAtualizado'
            )
        );

        if (
            typeof window
                .atualizarContadorCarrinho ===
            'function'
        ) {

            window
                .atualizarContadorCarrinho();
        }

        if (
            typeof window
                .carregarItensCarrinho ===
            'function'
        ) {

            window
                .carregarItensCarrinho();
        }
    }
};

window.CarrinhoService =
    CarrinhoService;
