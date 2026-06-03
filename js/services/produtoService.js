// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v3.0
// ======================================================================

const produtoService = {

    // ==========================================================
    // HELPERS
    // ==========================================================

    _safeString(valor = ''){

        return String(valor || '')
            .trim();

    },

    _safeNumber(valor = 0){

        const n =
            parseFloat(valor);

        return Number.isFinite(n)
            ? n
            : 0;

    },

    _slug(texto = ''){

        return this
            ._safeString(texto)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g,'-')
            .replace(/^-+|-+$/g,'');

    },

    _resolverImagem(produto){

        const imagem =
            produto.image ||
            produto.imagem ||
            produto.foto ||
            produto.img ||
            '';

        if(!imagem){

            return '';

        }

        // URL normal
        if(imagem.startsWith('http')){

            return imagem;

        }

        // Firebase gs://
        if(imagem.startsWith('gs://')){

            try{

                const semGs =
                    imagem.replace(
                        'gs://',
                        ''
                    );

                const partes =
                    semGs.split('/');

                const bucket =
                    partes.shift();

                const arquivo =
                    partes.join('/');

                return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;

            }catch(e){

                console.error(
                    'Erro converter imagem:',
                    e
                );

                return '';

            }

        }

        return imagem;

    },

    // ==========================================================
    // NORMALIZADOR
    // ==========================================================

    normalizarProduto(id, produto = {}){

        const nome =
            this._safeString(
                produto.nome ||
                produto.name
            );

        const categoria =
            this._safeString(
                produto.category ||
                produto.categoria ||
                produto.categoryName
            );

        const subcategoria =
            this._safeString(
                produto.subcategory ||
                produto.subcategoria ||
                produto.subCategory
            );

        const preco =
            this._safeNumber(
                produto.precoFinal ??
                produto.price ??
                produto.preco
            );

        const peso =
            this._safeNumber(
                produto.peso ??
                produto.weight
            );

        let variacoes =
            produto.variacoes ||
            produto.variantes ||
            [];

        // STRING → ARRAY
        if(typeof variacoes === 'string'){

            variacoes =
                variacoes
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);

        }

        // GARANTE ARRAY
        if(!Array.isArray(variacoes)){

            variacoes = [];

        }

        return {

            // IDs
            id:
                id ||
                produto.id ||
                crypto.randomUUID(),

            // Nome
            nome,
            name:nome,

            // SKU
            sku:
                this._safeString(
                    produto.sku
                ),

            // Categoria
            categoria,
            category:categoria,

            // Slugs
            categorySlug:
                produto.categorySlug ||
                this._slug(categoria),

            // Subcategoria
            subcategoria,
            subcategory:subcategoria,

            subcategorySlug:
                produto.subcategorySlug ||
                this._slug(subcategoria),

            // Preços
            precoFinal:preco,
            preco:preco,
            price:preco,

            // Peso
            peso,
            weight:peso,

            // Descrição
            descricao:
                produto.descricao ||
                produto.description ||
                '',

            description:
                produto.description ||
                produto.descricao ||
                '',

            // Imagem
            image:
                this._resolverImagem(produto),

            imagem:
                this._resolverImagem(produto),

            // Promoções
            promo:
                this._safeNumber(
                    produto.promo
                ),

            badge:
                produto.badge ||
                '',

            // Estoque
            estoque:
                this._safeNumber(
                    produto.estoque
                ),

            // Variações
            variacoes,
            variantes:variacoes,

            // Status
            ativo:
                produto.ativo !== false,

            createdAt:
                produto.createdAt ||
                Date.now()
        };

    },

    // ==========================================================
    // LISTAR TODOS
    // ==========================================================

    async listarTodos(){

        try{

            const snap =
                await firebase
                .database()
                .ref('abella/products')
                .once('value');

            const data =
                snap.val() || {};

            if(!data){

                return [];

            }

            // FIREBASE OBJECT → ARRAY
            const lista =
                Object.keys(data).map(id => {

                    return this.normalizarProduto(
                        id,
                        data[id]
                    );

                });

            // SOMENTE PRODUTOS ATIVOS
            return lista.filter(p => p.ativo);

        }catch(err){

            console.error(
                '[produtoService] erro listarTodos:',
                err
            );

            return [];

        }

    },

    // ==========================================================
    // BUSCAR POR ID
    // ==========================================================

    async buscarPorId(id){

        try{

            if(!id){

                return null;

            }

            const snap =
                await firebase
                .database()
                .ref(`abella/products/${id}`)
                .once('value');

            const produto =
                snap.val();

            if(!produto){

                return null;

            }

            return this.normalizarProduto(
                id,
                produto
            );

        }catch(err){

            console.error(
                '[produtoService] erro buscarPorId:',
                err
            );

            return null;

        }

    },

    // ==========================================================
    // LISTAR POR CATEGORIA
    // ==========================================================

    async listarPorCategoria(categoriaSlug){

        try{

            const todos =
                await this.listarTodos();

            return todos.filter(p =>

                (
                    p.categorySlug || ''
                )
                .toLowerCase()
                ===
                (
                    categoriaSlug || ''
                )
                .toLowerCase()

            );

        }catch(err){

            console.error(
                '[produtoService] erro categoria:',
                err
            );

            return [];

        }

    },

    // ==========================================================
    // LISTAR POR SUBCATEGORIA
    // ==========================================================

    async listarPorSubcategoria(
        categoriaSlug,
        subcategoriaSlug
    ){

        try{

            const todos =
                await this.listarTodos();

            return todos.filter(p => {

                const categoriaOK =

                    (
                        p.categorySlug || ''
                    )
                    .toLowerCase()

                    ===

                    (
                        categoriaSlug || ''
                    )
                    .toLowerCase();

                const subcategoriaOK =

                    (
                        p.subcategorySlug || ''
                    )
                    .toLowerCase()

                    ===

                    (
                        subcategoriaSlug || ''
                    )
                    .toLowerCase();

                return (
                    categoriaOK &&
                    subcategoriaOK
                );

            });

        }catch(err){

            console.error(
                '[produtoService] erro subcategoria:',
                err
            );

            return [];

        }

    }

};

// ==========================================================
// EXPORT GLOBAL
// ==========================================================

window.produtoService =
    produtoService;
