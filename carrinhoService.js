// ======================================================================
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

        this._agendarSyncNuvem();

    },

    // ==========================================================
    // CARRINHO NA NUVEM (link compartilhável + carrinho abandonado)
    // Salva em abella/carts/{cartId}. Link: carrinho.html?c={cartId}
    // ==========================================================

    CART_ID_KEY: 'abella_cart_id',

    _syncTimer: null,

    _gerarCartId(){

        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        let id = '';

        for(let i = 0; i < 10; i++){
            id += chars[Math.floor(Math.random() * chars.length)];
        }

        return id;

    },

    getCartId(criar = true){

        try{

            let id = localStorage.getItem(this.CART_ID_KEY);

            if(!id && criar){
                id = this._gerarCartId();
                localStorage.setItem(this.CART_ID_KEY, id);
            }

            return id || '';

        }catch(e){

            return '';

        }

    },

    _nuvemDisponivel(){

        return (
            typeof window.db !== 'undefined' &&
            typeof window.getAbellaPath === 'function'
        );

    },

    _agendarSyncNuvem(){

        clearTimeout(this._syncTimer);

        this._syncTimer = setTimeout(() => {
            this.sincronizarNuvem();
        }, 1200);

    },

    async sincronizarNuvem(){

        try{

            if(!this._nuvemDisponivel()) return null;

            const itens = this.getItens();

            // Carrinho vazio: marca o registro como vazio (não cria novo)
            const idExistente = this.getCartId(false);

            if(!itens.length){

                if(idExistente){
                    await window.db
                        .ref(window.getAbellaPath('carts/' + idExistente))
                        .update({
                            itens: [],
                            totalPecas: 0,
                            subtotal: 0,
                            status: 'vazio',
                            updatedAt: Date.now()
                        });
                }

                return idExistente || null;

            }

            const id = this.getCartId(true);
            const totais = this.calcularTotais();

            const payload = {
                itens: itens.map(i => ({
                    id: i.id || '',
                    sku: i.sku || '',
                    nome: i.nome || i.name || '',
                    image: i.image || i.imagem || '',
                    precoFinal: this._safeNumber(i.precoFinal ?? i.price ?? 0),
                    peso: this._safeNumber(i.peso ?? i.weight ?? 0),
                    quantidade: parseInt(i.quantidade) || 1,
                    variacao: i.variacao || null,
                    categoria: i.categoria || '',
                    subcategoria: i.subcategoria || ''
                })),
                totalPecas: totais.totalPecas,
                subtotal: totais.subtotal,
                pesoTotal: totais.pesoTotal,
                status: 'aberto',
                updatedAt: Date.now()
            };

            const ref = window.db.ref(window.getAbellaPath('carts/' + id));

            const snap = await ref.child('createdAt').once('value');

            if(!snap.exists()){
                payload.createdAt = Date.now();
            }

            await ref.update(payload);

            return id;

        }catch(e){

            console.warn('[Carrinho] Falha ao sincronizar na nuvem:', e);
            return null;

        }

    },

    async obterLinkCompartilhavel(){

        const id = await this.sincronizarNuvem();

        if(!id) return '';

        const base =
            window.location.origin +
            window.location.pathname.replace(/[^/]*$/, '');

        return `${base}carrinho.html?c=${id}`;

    },

    // Carrega um carrinho salvo (link ?c=ID) e coloca no localStorage
    async restaurarDaNuvem(cartId){

        try{

            if(!cartId || !this._nuvemDisponivel()) return false;

            const snap = await window.db
                .ref(window.getAbellaPath('carts/' + cartId))
                .once('value');

            if(!snap.exists()) return false;

            const dados = snap.val() || {};
            let lista = dados.itens || [];

            if(!Array.isArray(lista)){
                lista = Object.values(lista);
            }

            if(!lista.length) return false;

            const itens = lista.map(i => {

                const preco = this._safeNumber(i.precoFinal ?? i.price ?? 0);
                const peso = this._safeNumber(i.peso ?? 0);
                const img = i.image || i.imagem || '';
                const nome = i.nome || i.name || 'Produto';

                return {
                    id: i.id || i.sku,
                    sku: i.sku || i.id,
                    nome, name: nome,
                    image: img, imagem: img,
                    categoria: i.categoria || '',
                    subcategoria: i.subcategoria || '',
                    precoFinal: preco, price: preco,
                    peso, weight: peso,
                    quantidade: parseInt(i.quantidade) || 1,
                    variacao: i.variacao || null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

            });

            localStorage.setItem(this.CART_ID_KEY, cartId);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(itens));

            window.dispatchEvent(new Event('carrinhoAtualizado'));

            return true;

        }catch(e){

            console.error('[Carrinho] Erro ao restaurar:', e);

            return false;

        }

    },

    // Pedido finalizado: encerra o carrinho e gera um novo id na próxima compra
    async marcarFinalizado(pedidoId = ''){

        try{

            const id = this.getCartId(false);

            if(id && this._nuvemDisponivel()){
                await window.db
                    .ref(window.getAbellaPath('carts/' + id))
                    .update({
                        status: 'finalizado',
                        pedidoId,
                        updatedAt: Date.now()
                    });
            }

            localStorage.removeItem(this.CART_ID_KEY);

        }catch(e){

            console.warn('[Carrinho] Erro ao finalizar carrinho:', e);

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
