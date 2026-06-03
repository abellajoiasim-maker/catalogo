// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v3.0
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: 'abella_carrinho',

    // ==========================================================
    // HELPERS
    // ==========================================================

    _safeParse(json){

        try{

            return JSON.parse(json);

        }catch(e){

            return [];

        }

    },

    _safeNumber(valor, fallback = 0){

        const n = Number(valor);

        return Number.isFinite(n)
            ? n
            : fallback;

    },

    _resolverPreco(produto){

        return this._safeNumber(

            produto.precoFinal ??
            produto.price ??
            produto.preco ??
            produto.valor ??
            0

        );

    },

    _resolverPeso(produto){

        return this._safeNumber(

            produto.weight ??
            produto.peso ??
            0

        );

    },

    _resolverImagem(produto){

        return (
            produto.image ||
            produto.imagem ||
            produto.foto ||
            ''
        );

    },

    _resolverNome(produto){

        return (
            produto.nome ||
            produto.name ||
            'Produto'
        );

    },

    _resolverCategoria(produto){

        return (
            produto.category ||
            produto.categoria ||
            ''
        );

    },

    _resolverSubcategoria(produto){

        return (
            produto.subcategory ||
            produto.subcategoria ||
            ''
        );

    },

    // ==========================================================
    // GET ITENS
    // ==========================================================

    getItens(){

        return this._safeParse(

            localStorage.getItem(
                this.STORAGE_KEY
            ) || '[]'

        );

    },

    obterItens(){

        return this.getItens();

    },

    // ==========================================================
    // SALVAR
    // ==========================================================

    salvarTodos(itens = []){

        localStorage.setItem(

            this.STORAGE_KEY,

            JSON.stringify(itens)

        );

        this.notificarMudanca();

    },

    // ==========================================================
    // ADICIONAR ITEM
    // ==========================================================

    adicionar(

        produto,
        quantidade = 1,
        variacao = null

    ){

        if(!produto) return;

        let itens =
            this.getItens();

        quantidade =
            Math.max(
                1,
                parseInt(quantidade) || 1
            );

        const sku =
            (
                produto.sku ||
                produto.id ||
                ''
            )
            .toString()
            .trim();

        if(!sku){

            console.error(
                'Produto sem SKU:',
                produto
            );

            return;

        }

        const preco =
            this._resolverPreco(produto);

        const peso =
            this._resolverPeso(produto);

        const variacaoFinal =
            variacao ||
            produto.variacao ||
            null;

        const index =
            itens.findIndex(item =>

                item.sku === sku &&
                (
                    item.variacao || null
                ) === (
                    variacaoFinal || null
                )

            );

        // ==========================================
        // ITEM EXISTE
        // ==========================================

        if(index >= 0){

            itens[index].quantidade +=
                quantidade;

        }

        // ==========================================
        // NOVO ITEM
        // ==========================================

        else{

            itens.push({

                id:
                    produto.id ||
                    sku,

                sku,

                nome:
                    this._resolverNome(produto),

                name:
                    this._resolverNome(produto),

                image:
                    this._resolverImagem(produto),

                imagem:
                    this._resolverImagem(produto),

                category:
                    this._resolverCategoria(produto),

                categoria:
                    this._resolverCategoria(produto),

                subcategory:
                    this._resolverSubcategoria(produto),

                subcategoria:
                    this._resolverSubcategoria(produto),

                price:
                    preco,

                precoFinal:
                    preco,

                preco:
                    preco,

                weight:
                    peso,

                peso:
                    peso,

                quantidade,

                variacao:
                    variacaoFinal,

                addedAt:
                    Date.now()

            });

        }

        this.salvarTodos(itens);

        return true;

    },

    adicionarItem(produto){

        if(!produto) return;

        return this.adicionar(

            produto,

            produto.quantidade || 1,

            produto.variacao || null

        );

    },

    // ==========================================================
    // REMOVER ITEM
    // ==========================================================

    remover(index){

        const itens =
            this.getItens();

        if(
            index < 0 ||
            index >= itens.length
        ){

            return;

        }

        itens.splice(index, 1);

        this.salvarTodos(itens);

    },

    removerItem(index){

        this.remover(index);

    },

    // ==========================================================
    // ATUALIZAR QUANTIDADE
    // ==========================================================

    atualizarQuantidade(

        index,
        quantidade

    ){

        const itens =
            this.getItens();

        if(!itens[index]){

            return;

        }

        quantidade =
            Math.max(
                1,
                parseInt(quantidade) || 1
            );

        itens[index].quantidade =
            quantidade;

        this.salvarTodos(itens);

    },

    // ==========================================================
    // EXISTE PRODUTO
    // ==========================================================

    existeProduto(

        sku,
        variacao = null

    ){

        return this
            .getItens()
            .some(item =>

                item.sku === sku &&
                (
                    item.variacao || null
                ) === (
                    variacao || null
                )

            );

    },

    // ==========================================================
    // LIMPAR
    // ==========================================================

    limpar(){

        localStorage.removeItem(
            this.STORAGE_KEY
        );

        this.notificarMudanca();

    },

    limparCarrinho(){

        this.limpar();

    },

    // ==========================================================
    // CONTADORES
    // ==========================================================

    getQuantidadeProdutos(){

        return this
            .getItens()
            .length;

    },

    getQuantidadeItens(){

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

    // ==========================================================
    // TOTAIS
    // ==========================================================

    calcularTotais(

        pixDescPorcentagem = 5

    ){

        const itens =
            this.getItens();

        let subtotal = 0;
        let totalPecas = 0;
        let pesoTotal = 0;

        itens.forEach(item => {

            const preco =
                this._safeNumber(

                    item.precoFinal ??
                    item.price ??
                    item.preco

                );

            const peso =
                this._safeNumber(

                    item.peso ??
                    item.weight

                );

            const qtd =
                Math.max(

                    1,

                    parseInt(
                        item.quantidade
                    ) || 1

                );

            subtotal +=
                preco * qtd;

            pesoTotal +=
                peso * qtd;

            totalPecas +=
                qtd;

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
                        pixDescPorcentagem / 100
                    )
                )
                .toFixed(2)

            );

        const totalPix =
            Number(

                (
                    subtotal -
                    descontoPix
                )
                .toFixed(2)

            );

        return {

            subtotal,

            totalPecas,

            pesoTotal,

            descontoPix,

            totalPix,

            parcelamento6x:
                Number(
                    (
                        subtotal / 6
                    ).toFixed(2)
                )

        };

    },

    getResumo(){

        return this.calcularTotais();

    },

    obterResumo(){

        return this.getResumo();

    },

    // ==========================================================
    // EVENTOS
    // ==========================================================

    notificarMudanca(){

        // EVENTO GLOBAL

        window.dispatchEvent(

            new Event(
                'carrinhoAtualizado'
            )

        );

        // CALLBACKS LEGADOS

        if(
            typeof window
                .atualizarContadorCarrinho ===
            'function'
        ){

            window
                .atualizarContadorCarrinho();

        }

        if(
            typeof window
                .carregarItensCarrinho ===
            'function'
        ){

            window
                .carregarItensCarrinho();

        }

        if(
            typeof window
                .atualizarResumoCarrinho ===
            'function'
        ){

            window
                .atualizarResumoCarrinho();

        }

    }

};

// ==========================================================
// EXPORT GLOBAL
// ==========================================================

window.CarrinhoService =
    CarrinhoService;

window.carrinhoService =
    CarrinhoService;

// ==========================================================
// COMPATIBILIDADE TOTAL
// ==========================================================

CarrinhoService.obterItens =
    CarrinhoService.getItens.bind(CarrinhoService);

CarrinhoService.obterResumo =
    CarrinhoService.getResumo.bind(CarrinhoService);

CarrinhoService.adicionarItem =
    CarrinhoService.adicionarItem.bind(CarrinhoService);

CarrinhoService.removerItem =
    CarrinhoService.removerItem.bind(CarrinhoService);

CarrinhoService.limparCarrinho =
    CarrinhoService.limparCarrinho.bind(CarrinhoService);

// ==========================================================
// AUTO SYNC ENTRE ABAS
// ==========================================================

window.addEventListener(

    'storage',

    e => {

        if(
            e.key ===
            CarrinhoService.STORAGE_KEY
        ){

            CarrinhoService
                .notificarMudanca();

        }

    }

);

console.log(
    '🛒 CarrinhoService Premium v3.0 carregado.'
);
