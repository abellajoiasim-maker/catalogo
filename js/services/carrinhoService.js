// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v5.0 IQ200
// TOTALMENTE AJUSTADO PARA O NÓ "abella"
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: 'abella_carrinho',

    // ==========================================================
    // HELPERS
    // ================// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v5.0 IQ200
// TOTALMENTE AJUSTADO PARA O NÓ "abella"
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

            console.error(
                '[Carrinho] Erro parse JSON:',
                e
            );

            return [];

        }

    },

    _safeNumber(valor, fallback = 0){

        const n = Number(valor);

        return Number.isFinite(n)
            ? n
            : fallback;

    },

    _normalizarTexto(valor){

        return (
            valor ||
            ''
        )
        .toString()
        .trim();

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

        try{

            localStorage.setItem(

                this.STORAGE_KEY,

                JSON.stringify(itens)

            );

            this.notificarMudanca();

        }catch(e){

            console.error(
                '[Carrinho] Erro salvar:',
                e
            );

        }

    },

    // ==========================================================
    // ADD ITEM
    // ==========================================================

    adicionar(

        produto,
        quantidade = 1,
        variacao = null

    ){

        try{

            // ======================================================
            // VALIDAÇÃO
            // ======================================================

            if(
                !produto ||
                typeof produto !== 'object'
            ){

                console.error(
                    '[Carrinho] Produto inválido:',
                    produto
                );

                return false;

            }

            let itens =
                this.getItens();

          quantidade =
    Math.max(
        1,
        parseInt(
            quantidade,
            10
        ) || 1
    );

            // ======================================================
            // SKU
            // ======================================================

            const sku =
                this._normalizarTexto(

                    produto.sku ||
                    produto.id ||
                    produto.codigo

                )
                .toUpperCase();

            if(!sku){

                console.error(
                    '[Carrinho] Produto sem SKU:',
                    produto
                );

                return false;

            }

            // ======================================================
            // PREÇO
            // ======================================================

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

            // ======================================================
            // PESO
            // ======================================================

            const peso =
                Math.min(

                    10000,

                    Math.max(

                        0,

                        this._safeNumber(

                            produto.peso ??
                            produto.weight ??
                            0

                        )

                    )

                );

            // ======================================================
            // IMAGEM
            // ======================================================

            const imagem =

                produto.image ||
                produto.imagem ||
                produto.foto ||
                '';

            // ======================================================
            // VARIAÇÃO
            // ======================================================

            const variacaoFinal =
                variacao ||
                produto.variacao ||
                null;

            // ======================================================
            // LOCALIZA ITEM
            // ======================================================

            const index =
                itens.findIndex(item =>

                    String(item.sku) === String(sku) &&

                    String(
                        item.variacao || ''
                    ) === String(
                        variacaoFinal || ''
                    )

                );

            // ======================================================
            // ITEM EXISTE
            // ======================================================

            if(index >= 0){

                itens[index].quantidade += quantidade;

                itens[index].precoFinal = preco;
                itens[index].price = preco;

                itens[index].peso = peso;
                itens[index].weight = peso;

                itens[index].image = imagem;
                itens[index].imagem = imagem;

                itens[index].updatedAt =
                    Date.now();

            }

            // ======================================================
            // NOVO ITEM
            // ======================================================

            else{

                itens.push({

                    // IDENTIDADE
                    id:
                        produto.id ||
                        sku,

                    sku,

                    // NOME
                    nome:
                        produto.nome ||
                        produto.name ||
                        'Produto',

                    name:
                        produto.nome ||
                        produto.name ||
                        'Produto',

                    // IMAGENS
                    image:
                        imagem,

                    imagem:
                        imagem,

                    // CATEGORIAS
                    categoria:
                        produto.categorySlug ||
                        produto.category ||
                        produto.categoria ||
                        '',

                    subcategoria:
                        produto.subcategorySlug ||
                        produto.subcategory ||
                        produto.subcategoria ||
                        '',

                    // PREÇOS
                    precoFinal:
                        preco,

                    price:
                        preco,

                    // PESO
                    peso:
                        peso,

                    weight:
                        peso,

                    // QUANTIDADE
                    quantidade:
                        quantidade,

                    // VARIAÇÃO
                    variacao:
                        variacaoFinal,

                    // DESCRIÇÃO
                    descricao:
                        produto.descricao ||
                        produto.description ||
                        '',

                    // METADADOS
                    createdAt:
                        Date.now(),

                    updatedAt:
                        Date.now()

                });

            }

            // ======================================================
            // SAVE
            // ======================================================

            this.salvarTodos(itens);

            console.log(
                '🛒 Produto adicionado:',
                sku
            );

            return true;

        }catch(error){

            console.error(
                '[Carrinho] Erro adicionar:',
                error
            );

            return false;

        }

    },

    adicionarItem(produto){

        if(!produto){

            console.error(
                '[Carrinho] Produto vazio.'
            );

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
    Math.max(
        1,
        parseInt(
            quantidade,
            10
        ) || 1
    );

        itens[index].updatedAt =
            Date.now();

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
                Math.min(

                    10000,

                    Math.max(

                        0,

                        this._safeNumber(

                            item.peso ??
                            item.weight ??
                            0

                        )

                    )

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
    // EXISTS
    // ==========================================================

    possuiItens(){

        return this.getItens().length > 0;

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
// EXPORT GLOBAL
// ==========================================================

window.CarrinhoService =
    CarrinhoService;

window.carrinhoService =
    CarrinhoService;

// ==========================================================
// LEGACY
// ==========================================================

CarrinhoService.obterItens =
    CarrinhoService.getItens.bind(
        CarrinhoService
    );

CarrinhoService.obterResumo =
    CarrinhoService.getResumo.bind(
        CarrinhoService
    );

CarrinhoService.adicionarItem =
    CarrinhoService.adicionarItem.bind(
        CarrinhoService
    );

CarrinhoService.removerItem =
    CarrinhoService.removerItem.bind(
        CarrinhoService
    );

CarrinhoService.limparCarrinho =
    CarrinhoService.limparCarrinho.bind(
        CarrinhoService
    );

// ==========================================================
// INIT
// ==========================================================

console.log(
    '🛒 CarrinhoService Premium v5.0 carregado.'
);==========================================

    _safeParse(json){

        try{

            return JSON.parse(json);

        }catch(e){

            console.error(
                '[Carrinho] Erro parse JSON:',
                e
            );

            return [];

        }

    },

    _safeNumber(valor, fallback = 0){

        const n = Number(valor);

        return Number.isFinite(n)
            ? n
            : fallback;

    },

    _normalizarTexto(valor){

        return (
            valor ||
            ''
        )
        .toString()
        .trim();

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

        try{

            localStorage.setItem(

                this.STORAGE_KEY,

                JSON.stringify(itens)

            );

            this.notificarMudanca();

        }catch(e){

            console.error(
                '[Carrinho] Erro salvar:',
                e
            );

        }

    },

    // ==========================================================
    // ADD ITEM
    // ==========================================================

    adicionar(

        produto,
        quantidade = 1,
        variacao = null

    ){

        try{

            // ======================================================
            // VALIDAÇÃO
            // ======================================================

            if(
                !produto ||
                typeof produto !== 'object'
            ){

                console.error(
                    '[Carrinho] Produto inválido:',
                    produto
                );

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

            // ======================================================
            // SKU
            // ======================================================

            const sku =
                this._normalizarTexto(

                    produto.sku ||
                    produto.id ||
                    produto.codigo

                )
                .toUpperCase();

            if(!sku){

                console.error(
                    '[Carrinho] Produto sem SKU:',
                    produto
                );

                return false;

            }

            // ======================================================
            // PREÇO
            // ======================================================

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

            // ======================================================
            // PESO
            // ======================================================

            const peso =
                Math.min(

                    10000,

                    Math.max(

                        0,

                        this._safeNumber(

                            produto.peso ??
                            produto.weight ??
                            0

                        )

                    )

                );

            // ======================================================
            // IMAGEM
            // ======================================================

            const imagem =

                produto.image ||
                produto.imagem ||
                produto.foto ||
                '';

            // ======================================================
            // VARIAÇÃO
            // ======================================================

            const variacaoFinal =
                variacao ||
                produto.variacao ||
                null;

            // ======================================================
            // LOCALIZA ITEM
            // ======================================================

            const index =
                itens.findIndex(item =>

                    String(item.sku) === String(sku) &&

                    String(
                        item.variacao || ''
                    ) === String(
                        variacaoFinal || ''
                    )

                );

            // ======================================================
            // ITEM EXISTE
            // ======================================================

            if(index >= 0){

                itens[index].quantidade += quantidade;

                itens[index].precoFinal = preco;
                itens[index].price = preco;

                itens[index].peso = peso;
                itens[index].weight = peso;

                itens[index].image = imagem;
                itens[index].imagem = imagem;

                itens[index].updatedAt =
                    Date.now();

            }

            // ======================================================
            // NOVO ITEM
            // ======================================================

            else{

                itens.push({

                    // IDENTIDADE
                    id:
                        produto.id ||
                        sku,

                    sku,

                    // NOME
                    nome:
                        produto.nome ||
                        produto.name ||
                        'Produto',

                    name:
                        produto.nome ||
                        produto.name ||
                        'Produto',

                    // IMAGENS
                    image:
                        imagem,

                    imagem:
                        imagem,

                    // CATEGORIAS
                    categoria:
                        produto.categorySlug ||
                        produto.category ||
                        produto.categoria ||
                        '',

                    subcategoria:
                        produto.subcategorySlug ||
                        produto.subcategory ||
                        produto.subcategoria ||
                        '',

                    // PREÇOS
                    precoFinal:
                        preco,

                    price:
                        preco,

                    // PESO
                    peso:
                        peso,

                    weight:
                        peso,

                    // QUANTIDADE
                    quantidade:
                        quantidade,

                    // VARIAÇÃO
                    variacao:
                        variacaoFinal,

                    // DESCRIÇÃO
                    descricao:
                        produto.descricao ||
                        produto.description ||
                        '',

                    // METADADOS
                    createdAt:
                        Date.now(),

                    updatedAt:
                        Date.now()

                });

            }

            // ======================================================
            // SAVE
            // ======================================================

            this.salvarTodos(itens);

            console.log(
                '🛒 Produto adicionado:',
                sku
            );

            return true;

        }catch(error){

            console.error(
                '[Carrinho] Erro adicionar:',
                error
            );

            return false;

        }

    },

    adicionarItem(produto){

        if(!produto){

            console.error(
                '[Carrinho] Produto vazio.'
            );

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

        itens[index].updatedAt =
            Date.now();

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
                Math.min(

                    10000,

                    Math.max(

                        0,

                        this._safeNumber(

                            item.peso ??
                            item.weight ??
                            0

                        )

                    )

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
    // EXISTS
    // ==========================================================

    possuiItens(){

        return this.getItens().length > 0;

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
// EXPORT GLOBAL
// ==========================================================

window.CarrinhoService =
    CarrinhoService;

window.carrinhoService =
    CarrinhoService;

// ==========================================================
// LEGACY
// ==========================================================

CarrinhoService.obterItens =
    CarrinhoService.getItens.bind(
        CarrinhoService
    );

CarrinhoService.obterResumo =
    CarrinhoService.getResumo.bind(
        CarrinhoService
    );

CarrinhoService.adicionarItem =
    CarrinhoService.adicionarItem.bind(
        CarrinhoService
    );

CarrinhoService.removerItem =
    CarrinhoService.removerItem.bind(
        CarrinhoService
    );

CarrinhoService.limparCarrinho =
    CarrinhoService.limparCarrinho.bind(
        CarrinhoService
    );

// ==========================================================
// INIT
// ==========================================================

console.log(
    '🛒 CarrinhoService Premium v5.0 carregado.'
);
