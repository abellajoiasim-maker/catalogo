// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v5.0 (Auditado)
// ======================================================================

(function () {
    'use strict';
// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService Premium v4.0
// ======================================================================

(function () {

    'use strict';

    const PRODUCTS_PATH =
        getAbellaPath('products');

    const produtoService = {

        // ======================================================
        // CACHE
        // ======================================================

        _cache: null,

        _cacheTimestamp: 0,

        _cacheTTL: 60000,

        // ======================================================
        // DATABASE
        // ======================================================

        _db() {

            if (!window.db) {

                throw new Error(
                    'Firebase Database não inicializado.'
                );
            }

            return window.db;
        },

        // ======================================================
        // REF
        // ======================================================

        _ref() {

            return this
                ._db()
                .ref(PRODUCTS_PATH);
        },

        // ======================================================
        // CACHE VALIDATION
        // ======================================================

        _isCacheValid() {

            return Boolean(

                this._cache &&

                (
                    Date.now() -
                    this._cacheTimestamp
                ) < this._cacheTTL

            );
        },

        invalidateCache() {

            this._cache = null;

            this._cacheTimestamp = 0;
        },

        // ======================================================
        // HELPERS
        // ======================================================

        _safeString(valor = '') {

            return String(valor || '')
                .trim();
        },

        _safeNumber(valor = 0) {

            const n =
                parseFloat(valor);

            return Number.isFinite(n)
                ? n
                : 0;
        },

        _safeArray(valor) {

            if (Array.isArray(valor)) {

                return valor
                    .map(v => String(v).trim())
                    .filter(Boolean);
            }

            if (typeof valor === 'string') {

                return valor
                    .split(',')
                    .map(v => v.trim())
                    .filter(Boolean);
            }

            return [];
        },

        _slug(texto = '') {

            return this
                ._safeString(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        // ======================================================
        // STORAGE URL
        // ======================================================

        _resolverImagem(produto = {}) {

            const imagemOriginal =

                produto.image ||

                produto.imagem ||

                produto.foto ||

                produto.img ||

                '';

            const imagem =
                this._safeString(
                    imagemOriginal
                );

            if (!imagem) {

                return '';
            }

            // ==================================================
            // HTTP / HTTPS
            // ==================================================

            if (
                imagem.startsWith('http://') ||
                imagem.startsWith('https://')
            ) {

                return imagem;
            }

            // ==================================================
            // FIREBASE STORAGE GS://
            // ==================================================

            if (imagem.startsWith('gs://')) {

                try {

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

                    if (
                        !bucket ||
                        !arquivo
                    ) {

                        return '';
                    }

                    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(arquivo)}?alt=media`;

                } catch (error) {

                    console.error(
                        '[produtoService] erro imagem:',
                        error
                    );

                    return '';
                }
            }

            return imagem;
        },

        // ======================================================
        // NORMALIZADOR
        // ======================================================

        normalizarProduto(
            id,
            produto = {}
        ) {

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

                    produto.subCategory ||

                    produto.subcategoryName

                );

            const preco =
                this._safeNumber(

                    produto.precoFinal ??

                    produto.price ??

                    produto.preco ??

                    produto.valor ??

                    0

                );

            const peso =
                this._safeNumber(

                    produto.peso ??

                    produto.weight ??

                    produto.gramas ??

                    0

                );

            const variacoes =
                this._safeArray(

                    produto.variacoes ||

                    produto.variantes ||

                    produto.opcoesPersonalizadas

                );

            const createdAt =

                produto.createdAt ||

                Date.now();

         return {

                // ==============================================
                // IDENTIFICAÇÃO
                // ==============================================

                id:
                    this._safeString(
                        id ||
                        produto.id
                    ),

                sku:
                    this._safeString(
                        produto.sku ||
                        id
                    ),

                // ==============================================
                // NOME
                // ==============================================

                nome:
                    nome,

                name:
                    nome,

                // ==============================================
                // CATEGORIA
                // ==============================================

                categoria:
                    categoria,

                category:
                    categoria,

                categorySlug:

                    produto.categorySlug ||

                    this._slug(
                        categoria
                    ),

                subcategoria:
                    subcategoria,

                subcategory:
                    subcategoria,

                subcategorySlug:

                    produto.subcategorySlug ||

                    this._slug(
                        subcategoria
                    ),

                // ==============================================
                // PREÇOS
                // ==============================================

                precoFinal:
                    preco,

                preco:
                    preco,

                price:
                    preco,

                // ==============================================
                // PESO
                // ==============================================

                peso:
                    peso,

                weight:
                    peso,

                // ==============================================
                // DESCRIÇÃO
                // ==============================================

                descricao:

                    produto.descricao ||

                    produto.description ||

                    '',

                description:

                    produto.description ||

                    produto.descricao ||

                    '',

                // ==============================================
                // IMAGENS
                // ==============================================

                image:
                    this._resolverImagem(
                        produto
                    ),

                imagem:
                    this._resolverImagem(
                        produto
                    ),

                imagemOriginal:
                    produto.image ||

                    produto.imagem ||

                    '',

                // ==============================================
                // PROMOÇÃO
                // ==============================================

                promo:
                    this._safeNumber(
                        produto.promo
                    ),

                badge:
                    this._safeString(
                        produto.badge
                    ),

                // ==============================================
                // ESTOQUE
                // ==============================================

                estoque:
                    this._safeNumber(
                        produto.estoque
                    ),

                // ==============================================
                // VARIAÇÕES
                // ==============================================

                variacoes:
                    variacoes,

                variantes:
                    variacoes,

                variacaoTipo:
                    this._safeString(
                        produto.variacaoTipo
                    ),

                opcoesPersonalizadas:
                    this._safeString(
                        produto.opcoesPersonalizadas
                    ),

                // ==============================================
                // STATUS
                // ==============================================

                paused:
                    produto.paused === true,

                ativo:
                    (
                        produto.paused !== true &&
                        produto.ativo !== false
                    ),

                // ==============================================
                // DATAS
                // ==============================================

                createdAt:
                    createdAt,

updatedAt:

    produto.updatedAt ||

    createdAt

};

},

// ======================================================
// LISTAR TODOS
        async listarTodos(
            forceRefresh = false
        ) {

            try {

                if (
                    !forceRefresh &&
                    this._isCacheValid()
                ) {

                    return structuredClone(
                        this._cache
                    );
                }

                const snap =
                    await this
                        ._ref()
                        .once('value');

                const data =
                    snap.val() || {};

                const lista =

                    Object.keys(data)
                        .map(id => {

                            return this
                                .normalizarProduto(
                                    id,
                                    data[id]
                                );

                        })
                        .filter(
                            produto =>
                                produto.ativo
                        );

                this._cache =
                    lista;

                this._cacheTimestamp =
                    Date.now();

                return structuredClone(
                    lista
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarTodos]',
                    error
                );

                return [];
            }
        },

        // ======================================================
        // BUSCAR POR ID
        // ======================================================

        async buscarPorId(id) {

            try {

                const produtoId =
                    this._safeString(id);

                if (!produtoId) {

                    return null;
                }

                const snap =
                    await this
                        ._ref()
                        .child(produtoId)
                        .once('value');

                const produto =
                    snap.val();

                if (!produto) {

                    return null;
                }

                return this
                    .normalizarProduto(
                        produtoId,
                        produto
                    );

            } catch (error) {

                console.error(
                    '[produtoService:buscarPorId]',
                    error
                );

                return null;
            }
        },

        // ======================================================
        // LISTAR POR CATEGORIA
        // ======================================================

        async listarPorCategoria(
            categoriaSlug
        ) {

            try {

                const slug =
                    this._slug(
                        categoriaSlug
                    );

                const produtos =
                    await this
                        .listarTodos();

                return produtos.filter(
                    produto =>

                        produto.categorySlug
                        === slug
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarPorCategoria]',
                    error
                );

                return [];
            }
        },

        // ======================================================
        // LISTAR POR SUBCATEGORIA
        // ======================================================

        async listarPorSubcategoria(
            categoriaSlug,
            subcategoriaSlug
        ) {

            try {

                const categoria =
                    this._slug(
                        categoriaSlug
                    );

                const subcategoria =
                    this._slug(
                        subcategoriaSlug
                    );

                const produtos =
                    await this
                        .listarTodos();

                return produtos.filter(
                    produto => {

                        return (

                            produto.categorySlug
                            === categoria

                            &&

                            produto.subcategorySlug
                            === subcategoria

                        );
                    }
                );

            } catch (error) {

                console.error(
                    '[produtoService:listarPorSubcategoria]',
                    error
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
})();
    const produtoService = {

        // ======================================================
        // CACHE
        // ======================================================
        _cache: null,
        _cacheTimestamp: 0,
        _cacheTTL: 60000,

        // ======================================================
        // CACHE VALIDATION
        // ======================================================
        _isCacheValid() {
            return Boolean(
                this._cache && (Date.now() - this._cacheTimestamp) < this._cacheTTL
            );
        },

        invalidateCache() {
            this._cache = null;
            this._cacheTimestamp = 0;
        },

        // ======================================================
        // SANITIZADORES AUXILIARES
        // ======================================================
        _safeString(valor = '') {
            return String(valor || '').trim();
        },

        _safeNumber(valor = 0) {
            const n = parseFloat(valor);
            return Number.isFinite(n) ? n : 0;
        },

        _slug(texto = '') {
            return this._safeString(texto)
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        // ======================================================
        // NORMALIZADOR SEGUIDOR DA REGRA ABSOLUTA Nº 1
        // ======================================================
        normalizarProduto(id, produto = {}) {
            const idString = this._safeString(id || produto.id);
            const nomeString = this._safeString(produto.nome);

            // Mapeamento e transporte seguro de variações (Regra Absoluta Nº 2)
            const variacoesTratadas = Array.isArray(produto.variacoes) 
                ? produto.variacoes.map((v, idx) => ({
                    id: this._safeString(v.id || `v_${idx}`),
                    nome: this._safeString(v.nome),
                    ordem: this._safeNumber(v.ordem ?? idx),
                    ativo: v.ativo !== false,
                    estoque: this._safeNumber(v.estoque),
                    imagem: this._safeString(v.imagem),
                    codigo: this._safeString(v.codigo)
                }))
                : [];

            // Mapeamento seguro das faixas de desconto (Regra Absoluta Nº 1)
            const descontosTratados = Array.isArray(produto.descontos)
                ? produto.descontos.map((d, idx) => ({
                    id: this._safeString(d.id || `d_${idx}`),
                    minimo: this._safeNumber(d.minimo),
                    maximo: this._safeNumber(d.maximo),
                    percentual: this._safeNumber(d.percentual),
                    ativo: d.ativo !== false
                }))
                : [];

            return {
                id: idString,
                slug: this._safeString(produto.slug || this._slug(nomeString)),
                codigo: this._safeString(produto.codigo || produto.sku || idString),
                nome: nomeString,
                descricao: this._safeString(produto.descricao),
                categoria: this._safeString(produto.categoria),
                subcategoria: this._safeString(produto.subcategoria),
                marca: this._safeString(produto.marca),
                peso: this._safeNumber(produto.peso), // Regra Nº 4: Peso nativo do objeto
                preco: this._safeNumber(produto.preco),
                precoPromocional: this._safeNumber(produto.precoPromocional),
                descontos: descontosTratados,
                variacoes: variacoesTratadas,
                estoque: this._safeNumber(produto.estoque),
                imagens: Array.isArray(produto.imagens) ? produto.imagens.map(img => this._safeString(img)) : [],
                thumbnail: this._safeString(produto.thumbnail),
                banner: this._safeString(produto.banner),
                ativo: produto.ativo !== false,
                destaque: produto.destaque === true,
                novo: produto.novo === true,
                oferta: produto.oferta === true,
                ordem: this._safeNumber(produto.ordem),
                criadoEm: produto.criadoEm || produto.createdAt || Date.now(),
                alteradoEm: produto.alteradoEm || produto.updatedAt || Date.now()
            };
        },

        // ======================================================
        // LISTAR TODOS (USANDO REPOSITORY SEGUNDO A REGRA Nº 5)
        // ======================================================
        async listarTodos(forceRefresh = false) {
            try {
                if (!forceRefresh && this._isCacheValid()) {
                    return structuredClone(this._cache);
                }

                // Respeitando Regra Nº 5: O acesso ao Firebase vai para o Repository
                if (!window.BaseRepository) {
                    throw new Error('BaseRepository não carregado no escopo global.');
                }

                const data = await window.BaseRepository.obterTodos('products');
                
                const lista = Object.keys(data)
                    .map(id => this.normalizarProduto(id, data[id]))
                    .filter(produto => produto.ativo);

                this._cache = lista;
                this._cacheTimestamp = Date.now();

                return structuredClone(lista);
            } catch (error) {
                console.error('[produtoService:listarTodos]', error);
                return [];
            }
        },

        // ======================================================
        // BUSCAR POR ID
        // ======================================================
        async buscarPorId(id) {
            try {
                const produtoId = this._safeString(id);
                if (!produtoId) return null;

                if (this._isCacheValid() && this._cache) {
                    const encontrado = this._cache.find(p => p.id === produtoId);
                    if (encontrado) return structuredClone(encontrado);
                }

                if (!window.BaseRepository) {
                    throw new Error('BaseRepository não carregado.');
                }

                // Puxa a ramificação exata via repositório isolando infraestrutura
                const dataTodos = await window.BaseRepository.obterTodos('products');
                const produtoRaw = dataTodos[produtoId];

                if (!produtoRaw) return null;

                return this.normalizarProduto(produtoId, produtoRaw);
            } catch (error) {
                console.error('[produtoService:buscarPorId]', error);
                return null;
            }
        },

        // ======================================================
        // FILTROS
        // ======================================================
        async listarPorCategoria(categoriaSlug) {
            try {
                const slugTarget = this._slug(categoriaSlug);
                const produtos = await this.listarTodos();
                return produtos.filter(p => this._slug(p.categoria) === slugTarget);
            } catch (error) {
                console.error('[produtoService:listarPorCategoria]', error);
                return [];
            }
        },

        async listarPorSubcategoria(categoriaSlug, subcategoriaSlug) {
            try {
                const catTarget = this._slug(categoriaSlug);
                const subTarget = this._slug(subcategoriaSlug);
                const produtos = await this.listarTodos();
                return produtos.filter(p => 
                    this._slug(p.categoria) === catTarget && 
                    this._slug(p.subcategoria) === subTarget
                );
            } catch (error) {
                console.error('[produtoService:listarPorSubcategoria]', error);
                return [];
            }
        }
    };

    window.produtoService = produtoService;
})();
