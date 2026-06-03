javascript
// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v3.0 FINAL
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY:'abella_carrinho',

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

    _safeNumber(valor,fallback = 0){

        const n =
            Number(valor);

        return Number.isFinite(n)
            ? n
            : fallback;

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
    // SAVE
    // ==========================================================

    salvarTodos(itens = []){

        localStorage.setItem(

            this.STORAGE_KEY,

            JSON.stringify(itens)

        );

        this.notificarMudanca();

    },

    // ==========================================================
    // ADD ITEM
    // ==========================================================

    adicionar(

        produto,
        quantidade = 1,
        variacao = null

    ){

        if(!produto){

            return false;

        }

        let itens =
            this.getItens();

        quantidade =
            Math.min(

                999,

                Math.max(
                    1,
                    parseInt(quantidade) || 1
                )

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
                'Produto sem SKU',
                produto
            );

            return false;

        }

        const preco =
            this._safeNumber(

                produto.precoFinal ??
                produto.price ??
                produto.preco ??
                0

            );

        const peso =
            this._safeNumber(

                produto.peso ??
                produto.weight ??
                0

            );

        const index =
            itens.findIndex(item =>

                item.sku === sku &&
                (
                    item.variacao || null
                ) === (
                    variacao || null
                )

            );

        // ITEM EXISTE

        if(index >= 0){

            itens[index].quantidade +=
                quantidade;

        }

        // NOVO ITEM

        else{

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

                image:
                    produto.image ||
                    produto.imagem ||
                    '',

                imagem:
                    produto.image ||
                    produto.imagem ||
                    '',

                categoria:
                    produto.category ||
                    produto.categoria ||
                    '',

                subcategoria:
                    produto.subcategory ||
                    produto.subcategoria ||
                    '',

                precoFinal:
                    preco,

                price:
                    preco,

                peso:
                    peso,

                weight:
                    peso,

                quantidade,

                variacao:
                    variacao || null

            });

        }

        this.salvarTodos(itens);

        return true;

    },

    adicionarItem(produto){

        if(!produto){

            return false;

        }

        return this.adicionar(

            produto,

            produto.quantidade || 1,

            produto.variacao || null

        );

    },

    // ==========================================================
    // REMOVE
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

        itens.splice(index,1);

        this.salvarTodos(itens);

    },

    removerItem(index){

        this.remover(index);

    },

    // ==========================================================
    // UPDATE QTD
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

        itens[index].quantidade =
            Math.min(

                999,

                Math.max(
                    1,
                    parseInt(quantidade) || 1
                )

            );

        this.salvarTodos(itens);

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
    // TOTALS
    // ==========================================================

    calcularTotais(
        descontoPixPercentual = 5
    ){

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

            const peso =
                this._safeNumber(

                    item.peso ??
                    item.weight ??
                    0

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
                        descontoPixPercentual / 100
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

            pesoTotal,

            totalPecas,

            descontoPix,

            totalPix,

            parcelado6x:
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
    // EVENTS
    // ==========================================================

    notificarMudanca(){

        window.dispatchEvent(

            new Event(
                'carrinhoAtualizado'
            )

        );

    }

};

// ==========================================================
// EXPORT
// ==========================================================

window.CarrinhoService =
    CarrinhoService;

window.carrinhoService =
    CarrinhoService;

// ==========================================================
// LEGACY
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

console.log(
    '🛒 CarrinhoService Premium carregado.'
);

