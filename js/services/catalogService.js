// ======================================================================
// js/services/catalogService.js
// Abella Joias - CatalogService v8.0 (Arquitetura PMA V8)
// Autoridade Suprema Exclusiva de Leitura e Agregação de Dados do Catálogo
// ======================================================================

(function () {
    'use strict';

    const CatalogService = {
        _cache: null,
        _cacheTimestamp: 0,
        _cacheTTL: 60000,

        // PROVEDOR DE INSTÂNCIA DO BANCO DE DADOS
        _db() {
            if (!window.db) {
                throw new Error('[PMA V8] [CatalogService] Infraestrutura Firebase Realtime Database indisponível.');
            }
            return window.db;
        },

        // CENTRALIZADOR DE MAPEAMENTO DE ROTAS OFICIAIS
        _ref(path) {
            const cleanPath = typeof window.getAbellaPath === 'function'
                ? window.getAbellaPath(path)
                : `abella/${path}`;
            return this._db().ref(cleanPath);
        },

        // VERIFICAÇÃO CRONOLÓGICA DE VALIDADE DE CACHE
        _isCacheValid() {
            return Boolean(
                this._cache &&
                (Date.now() - this._cacheTimestamp) < this._cacheTTL
            );
        },

        // COMPORTAMENTO DE INVALIDAÇÃO FORÇADA DE MEMÓRIA
        invalidateCache() {
            this._cache = null;
            this._cacheTimestamp = 0;
        },

        // AGREGADOR FORENSE E NORMALIZADOR DE ÁRVORES DE DADOS
        _normalizarCatalogo(rawProdutos = {}, rawCategorias = {}, rawSubcategorias = {}, settings = {}) {
            const descontosGlobais = settings.descontos || { ativo: false, porcentagem: 0, regrasCategoria: {} };

            // 1. Processamento e Saneamento de Categorias e Subcategorias
            const tabelaSubcategorias = Object.entries(rawSubcategorias).map(([id, sub]) => ({
                id,
                nome: String(sub.nome || '').trim(),
                categoriaPai: String(sub.categoriaPai || sub.categoriaId || '').trim(),
                ordem: Number(sub.ordem ?? 99)
            }));

            const listaCategorias = Object.entries(rawCategorias).map(([id, cat]) => {
                const subcategoriasFilhas = tabelaSubcategorias
                    .filter(sub => sub.categoriaPai === id)
                    .sort((a, b) => a.ordem - b.ordem);

                return {
                    id,
                    nome: String(cat.nome || '').trim(),
                    slug: String(cat.slug || id).trim(),
                    ordem: Number(cat.ordem ?? 99),
                    subcategorias: subcategoriasFilhas
                };
            }).sort((a, b) => a.ordem - b.ordem);

            // 2. Processamento, Normalização e Aplicação de Regras de Desconto nos Produtos
            const listaProdutos = Object.entries(rawProdutos).map(([id, prod]) => {
                const precoOriginal = Number(prod.preco ?? prod.price ?? 0);
                let precoFinal = precoOriginal;

                // Aplicação de desconto em cascata (se houver regra por categoria ou desconto global ativo)
                if (descontosGlobais.ativo && descontosGlobais.porcentagem > 0) {
                    const descontoCategoria = descontosGlobais.regrasCategoria 
                        ? Number(descontosGlobais.regrasCategoria[prod.categoriaId] ?? 0)
                        : 0;
                    
                    const taxaDesconto = descontoCategoria > 0 ? descontoCategoria : descontosGlobais.porcentagem;
                    precoFinal = precoOriginal - (precoOriginal * (taxaDesconto / 100));
                }

                return {
                    id,
                    codigo: String(prod.codigo || prod.sku || id).trim(),
                    nome: String(prod.nome || '').trim(),
                    descricao: String(prod.descricao || prod.description || '').trim(),
                    precoOriginal: precoOriginal,
                    preco: precoFinal, // Preço oficial calculado consumido pela aplicação
                    imagem: String(prod.imagem || prod.image || '').trim(),
                    categoriaId: String(prod.categoriaId || '').trim(),
                    subcategoriaId: String(prod.subcategoriaId || '').trim(),
                    ativo: Boolean(prod.ativo ?? true),
                    estoque: Number(prod.estoque ?? 1),
                    destaque: Boolean(prod.destaque ?? false),
                    metadados: {
                        finish: String(prod.acabamento || '').trim(),
                        loop: String(prod.passador || '').trim()
                    }
                };
            });

            return Object.freeze({
                produtos: listaProdutos,
                categorias: listaCategorias,
                configuracoes: settings
            });
        },

        // RESOLUTOR MESTRE DA ÁRVORE DO CATÁLOGO COMPLETO (PROMISE.ALL)
        async getCatalog(forceRefresh = false) {
            try {
                if (!forceRefresh && this._isCacheValid()) {
                    return structuredClone(this._cache);
                }

                // Resgata as configurações globais em paralelo com a infraestrutura do banco
                const settingsPromise = window.ConfigService && typeof window.ConfigService.getSettings === 'function'
                    ? window.ConfigService.getSettings(forceRefresh)
                    : Promise.resolve({});

                const [snapshotProdutos, snapshotCategorias, snapshotSubcategorias, currentSettings] = await Promise.all([
                    this._ref('products').once('value'),
                    this._ref('categories').once('value'),
                    this._ref('subcategories').once('value'),
                    settingsPromise
                ]);

                const rawProds = snapshotProdutos.val() || {};
                const rawCats = snapshotCategorias.val() || {};
                const rawSubs = snapshotSubcategorias.val() || {};

                // Processa a consolidação das informações
                this._cache = this._normalizarCatalogo(rawProds, rawCats, rawSubs, currentSettings);
                this._cacheTimestamp = Date.now();

                return structuredClone(this._cache);
            } catch (error) {
                console.error('[PMA V8] [CatalogService] Erro crítico ao consolidar árvore de catálogo:', error);
                
                // Fallback seguro em formato estruturado
                return structuredClone({
                    produtos: [],
                    categorias: [],
                    configuracoes: {}
                });
            }
        }
    };

    // VINCULAÇÃO E CONGELAMENTO DA CAMADA DO SERVIÇO NO ESCOPO GLOBAL
    Object.defineProperty(window, 'CatalogService', {
        value: Object.freeze(CatalogService),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] [CatalogService] Módulo estrutural criado e injetado com integridade.');
})();
