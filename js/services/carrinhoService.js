// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v5.1.0
// Compatibilidade Total Checkout + Carrinho + Produtos
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: 'abella_carrinho',
    LEGACY_KEY: 'carrinho',

    // =====================================================
    // HELPERS
    // =====================================================

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
        return Number.isFinite(n)
            ? n
            : fallback;
    },

    _normalizarTexto(valor) {
        return (valor || '')
            .toString()
            .trim();
    },

    // =====================================================
    // ACESSO AOS DADOS
    // =====================================================

    getItens() {

        const novo =
            localStorage.getItem(
                this.STORAGE_KEY
            );

        const antigo =
            localStorage.getItem(
                this.LEGACY_KEY
            );

        return this._safeParse(
            novo || antigo || '[]'
        );
    },

    obterItens() {
        return this.getItens();
    },

salvarTodos(itens = []) {

    try {

        const json =
            JSON.stringify(itens);

        localStorage.setItem(
            'abella_carrinho',
            json
        );

        localStorage.setItem(
            'carrinho',
            json
        );

        this.notificarMudanca();

    } catch (e) {

        console.error(
            '[Carrinho] Erro ao salvar:',
            e
        );

    }

},

    // =====================================================
    // ADICIONAR
    // =====================================================

    adicionar(produto, quantidade = 1, variacao = null) {

        if (!produto) return false;

        let itens =
            this.getItens();

        const qtd =
            Math.max(
                1,
                parseInt(quantidade) || 1
            );

        const sku =
            this._normalizarTexto(
                produto.sku ||
                produto.id ||
                produto.codigo
            ).toUpperCase();

        if (!sku) return false;

        const preco =
            Math.max(
                0,
                this._safeNumber(
                    produto.precoFinal ??
                    produto.price ??
                    produto.preco ??
                    produto.valor ??
                    0
                )
            );

        const peso =
            this._safeNumber(
                produto.peso ??
                produto.weight ??
                0
            );

        const imagem =
            produto.image ||
            produto.imagem ||
            produto.foto ||
            '';

        const index =
            itens.findIndex(
                item =>
                    String(item.sku).toUpperCase() === sku
            );

        if (index >= 0) {

            itens[index].quantidade += qtd;

            itens[index].precoFinal = preco;
            itens[index].price = preco;

            itens[index].peso = peso;
            itens[index].weight = peso;

            itens[index].updatedAt =
                Date.now();

        } else {

            itens.push({

                id:
                    produto.id ||
                    sku,

                sku,

                nome:
                    produto.nome ||
                    produto.name ||
                    'Produto',

                name:
                    produto.nome ||
                    produto.name ||
                    'Produto',

                image: imagem,
                imagem: imagem,

                precoFinal: preco,
                price: preco,

                peso: peso,
                weight: peso,

                quantidade: qtd,

                variacao,

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now()

            });
        }

        this.salvarTodos(itens);

        return true;
    },

    adicionarItem(produto, quantidade = 1) {

        return this.adicionar(
            produto,
            quantidade,
            produto.variacao || null
        );

    },

    // =====================================================
    // REMOVER
    // =====================================================

    remover(index) {

        const itens =
            this.getItens();

        if (
            index >= 0 &&
            index < itens.length
        ) {

            itens.splice(index, 1);

            this.salvarTodos(itens);

        }
    },

    removerItem(index) {
        this.remover(index);
    },

    // =====================================================
    // QUANTIDADE
    // =====================================================

    atualizarQuantidade(
        index,
        quantidade
    ) {

        const itens =
            this.getItens();

        if (!itens[index]) return;

        itens[index].quantidade =
            Math.max(
                1,
                parseInt(quantidade) || 1
            );

        itens[index].updatedAt =
            Date.now();

        this.salvarTodos(itens);
    },

    // =====================================================
    // LIMPAR
    // =====================================================

   limpar() {

    localStorage.removeItem(
        'abella_carrinho'
    );

    localStorage.removeItem(
        'carrinho'
    );

    this.notificarMudanca();

},

    // =====================================================
    // RESUMO
    // =====================================================

    calcularTotais(
        descontoPixPercentual = 5
    ) {

        const itens =
            this.getItens();

        let subtotal = 0;
        let pesoTotal = 0;
        let totalPecas = 0;

        itens.forEach(item => {

            const preco =
                this._safeNumber(
                    item.precoFinal ??
                    item.price ??
                    0
                );

            const qtd =
                parseInt(
                    item.quantidade
                ) || 1;

            subtotal +=
                preco * qtd;

            pesoTotal +=
                (
                    this._safeNumber(
                        item.peso ??
                        item.weight ??
                        0
                    ) * qtd
                );

            totalPecas += qtd;
        });

        const descontoPix =
            subtotal *
            (
                descontoPixPercentual / 100
            );

        return {

            subtotal,

            pesoTotal,

            totalPecas,

            descontoPix,

            totalPix:
                subtotal -
                descontoPix

        };
    },

    getResumo() {
        return this.calcularTotais();
    },

    obterResumo() {
        return this.getResumo();
    },

    possuiItens() {
        return this.getItens().length > 0;
    },

    notificarMudanca() {

        window.dispatchEvent(
            new Event(
                'carrinhoAtualizado'
            )
        );

    }

};

window.CarrinhoService =
window.carrinhoService =
    CarrinhoService;

console.info(
    '🛒 CarrinhoService Premium v5.1.0 carregado.'
);
