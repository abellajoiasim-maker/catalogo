// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService v8.1 (Arquitetura PMA V8 Corrigida)
// CRUD Completo, Seguro, Reativo e Integrado ao Ecossistema Abella
// ======================================================================

(function () {
    'use strict';

    const PRODUCTS_PATH = typeof window.getAbellaPath === 'function'
        ? window.getAbellaPath('products')
        : 'abella/products';

    // MEMÓRIA VOLÁTIL DE CACHE ISOLADA DO CONGELAMENTO (SOLUÇÃO DO TYPEERROR)
    let camadaCacheInterno = null;
    let camadaCacheTimestamp = 0;
    const camadaCacheTTL = 60000;

    const produtoService = {
        // CONEXÃO COM A ABSTRAÇÃO DE BASE DE DADOS
        _db() {
            if (!window.db) {
                throw new Error('[PMA V8] [ProdutoService] Infraestrutura Firebase Realtime Database indisponível.');
            }
            return window.db;
        },

        // ATALHO EXCLUSIVO DE ACESSO AO NÓ DE PRODUTOS
        _ref() {
            return this._db().ref(PRODUCTS_PATH);
        },

        // VALIDAÇÃO CRONOLÓGICA DO CACHE EM MEMÓRIA
        _isCacheValid() {
            return Boolean(
                camadaCacheInterno &&
                (Date.now() - camadaCacheTimestamp) < camadaCacheTTL
            );
        },

        // INVALIDAÇÃO FORÇADA E ATUALIZAÇÃO DO SISTEMA
        invalidateCache() {
            camadaCacheInterno = null;
            camadaCacheTimestamp = 0;
            
            // Força o CatalogService a reconstruir a árvore reativa se estiver disponível
            if (window.CatalogService && typeof window.CatalogService.getCatalog === 'function') {
                window.CatalogService.getCatalog(true).then(novoCatalogo => {
                    if (window.StateManager && typeof window.StateManager.setState === 'function') {
                        window.StateManager.setState('catalog', novoCatalogo);
                    }
                }).catch(err => console.error('[PMA V8] [ProdutoService] Erro ao sincronizar StateManager:', err));
            }
        },

        // HELPERS DE SANITIZAÇÃO DE TIPOS OPERACIONAIS
        _safeString(valor = '') {
            return String(valor || '').trim();
        },

        // SANEADOR DE PRODUTOS (ALINHADO COM CATALOGSERVICE)
        normalizarProduto(id, produto = {}) {
            if (!id || !produto) return null;

            const nome = this._safeString(produto.nome || produto.name || 'Produto Sem Nome');
            const precoOriginal = parseFloat(produto.precoOriginal ?? produto.precoAntigo ?? produto.oldPrice ?? 0) || 0;
            const precoVenda = parseFloat(produto.preco ?? produto.precoFinal ?? produto.price ?? produto.valor ?? 0) || 0;

            // Tratamento dinâmico para garantir que variações/grades venham estruturadas
            let listaVariacoesLimpa = [];
            if (Array.isArray(produto.variacoes)) {
                listaVariacoesLimpa = produto.variacoes;
            } else if (produto.variacoes && typeof produto.variacoes === 'object') {
                listaVariacoesLimpa = Object.values(produto.variacoes);
            }
            const medidas = Array.isArray(produto.medidas)
                ? produto.medidas
                : (produto.medidas && typeof produto.medidas === 'object' ? Object.values(produto.medidas) : []);

return {
                id: this._safeString(id),
                codigo: this._safeString(produto.codigo || produto.sku || id),
                sku: this._safeString(produto.sku || produto.codigo || id),
                nome: nome,
                name: nome,
                descricao: this._safeString(produto.descricao || produto.description || ''),
                precoOriginal: precoOriginal || precoVenda,
                preco: precoVenda,
                price: precoVenda,
                precoFinal: precoVenda,
                imagem: this._safeString(produto.imagem || produto.image || produto.img || ''),
                image: this._safeString(produto.imagem || produto.image || produto.img || ''),
                categoriaId: this._safeString(produto.categoriaId || produto.categoria || produto.category || ''),
                category: this._safeString(produto.categoriaId || produto.categoria || produto.category || ''),
                subcategoriaId: this._safeString(produto.subcategoriaId || produto.subcategoria || produto.subcategory || produto.subCategory || ''),
                subcategory: this._safeString(produto.subcategoriaId || produto.subcategoria || produto.subcategory || produto.subCategory || ''),
                ativo: produto.ativo !== false && produto.paused !== true,
                paused: produto.paused === true || produto.ativo === false,
                estoque: parseInt(produto.estoque ?? produto.estoqueQuantidade ?? 1) || 0,
                estoqueQuantidade: Math.max(0, parseInt(produto.estoqueQuantidade ?? produto.estoque ?? 0, 10) || 0),
                estoqueControlado: produto.estoqueControlado === true || produto.estoqueLimitadoAtivo === true || produto.controleEstoque === true,
                mostrarEstoqueGrid: produto.mostrarEstoqueGrid !== false,
                venderSemEstoque: produto.venderSemEstoque === true,
                destaque: Boolean(produto.destaque ?? false),
                variacoes: listaVariacoesLimpa,
                medidas,
                variacoesPrecoModo: produto.variacoesPrecoModo || produto.politicaPrecoVariacao || 'unico',
                variacoesPesoModo: produto.variacoesPesoModo || produto.politicaPesoVariacao || 'unico',
                dizeres:  Array.isArray(produto.dizeres)  ? produto.dizeres  : (Array.isArray(produto.sayings)  ? produto.sayings  : []),
                iniciais: Array.isArray(produto.iniciais) ? produto.iniciais : (Array.isArray(produto.initials) ? produto.initials : []),
                sayings:  Array.isArray(produto.sayings)  ? produto.sayings  : (Array.isArray(produto.dizeres)  ? produto.dizeres  : []),
                initials: Array.isArray(produto.initials) ? produto.initials : (Array.isArray(produto.iniciais) ? produto.iniciais : []),
                peso: parseFloat(produto.peso || produto.weight || 0),
                weight: parseFloat(produto.peso || produto.weight || 0),
                // Produto "vitrine": foto ambientada de referência da coleção, não é vendável
                vitrine: produto.vitrine === true || produto.isVitrine === true || produto.showcase === true || produto.tipo === 'vitrine',
                legendaVitrine: this._safeString(produto.legendaVitrine || ''),
                metadados: {
                    finish: this._safeString(produto.metadados?.finish || produto.acabamento || ''),
                    loop: this._safeString(produto.metadados?.loop || produto.passador || '')
                },
                createdAt: produto.createdAt || Date.now()
            };
        },

        // ======================================================
        // OPERAÇÕES DE LEITURA (READ)
        // ======================================================

        async listarTodos() {
            try {
                if (this._isCacheValid()) {
                    return Object.values(camadaCacheInterno);
                }

                const snapshot = await this._ref().once('value');
                const data = snapshot.val() || {};
                
                camadaCacheInterno = {};
                Object.keys(data).forEach(id => {
                    const norm = this.normalizarProduto(id, data[id]);
                    if (norm) camadaCacheInterno[id] = norm;
                });

                camadaCacheTimestamp = Date.now();
                return Object.values(camadaCacheInterno);
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:listarTodos]', error);
                return [];
            }
        },

        async buscarPorId(produtoId) {
            try {
                const id = this._safeString(produtoId);
                if (!id) return null;

                if (camadaCacheInterno && camadaCacheInterno[id]) {
                    return camadaCacheInterno[id];
                }

                const snapshot = await this._ref().child(id).once('value');
                const produtoRaw = snapshot.val();
                
                if (!produtoRaw) return null;
                return this.normalizarProduto(id, produtoRaw);
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:buscarPorId]', error);
                return null;
            }
        },

        // ======================================================
        // OPERAÇÕES DE ESCRITA MUTADORA (CUD + EXTENSÕES)
        // ======================================================

        async salvar(id = null, produtoData = {}) {
            try {
                const targetId = id ? this._safeString(id) : this._ref().push().key;
                if (!targetId) throw new Error('Falha ao gerar chave identificadora única.');

                const norm = this.normalizarProduto(targetId, produtoData);
                
                const payload = {
                    codigo: norm.codigo,
                    nome: norm.nome,
                    descricao: norm.descricao,
                    precoOriginal: norm.precoOriginal,
                    preco: norm.preco,
                    imagem: norm.imagem,
                    categoriaId: norm.categoriaId,
                    subcategoriaId: norm.subcategoriaId,
                    ativo: norm.ativo,
                    estoque: norm.estoque,
                    estoqueQuantidade: norm.estoqueControlado ? norm.estoqueQuantidade : null,
                    estoqueControlado: norm.estoqueControlado,
                    mostrarEstoqueGrid: norm.mostrarEstoqueGrid,
                    venderSemEstoque: norm.venderSemEstoque,
                    destaque: norm.destaque,
                    variacoes: norm.variacoes,
                    medidas: norm.medidas,
                    variacoesPrecoModo: norm.variacoesPrecoModo,
                    variacoesPesoModo: norm.variacoesPesoModo,
                    dizeres: norm.dizeres,
                    sayings: norm.sayings,
                    iniciais: norm.iniciais,
                    initials: norm.initials,
                    peso: norm.peso,
                    vitrine: norm.vitrine,
                    legendaVitrine: norm.legendaVitrine,
                    metadados: norm.metadados,
                    createdAt: norm.createdAt,
                    updatedAt: Date.now()
                };

                await this._ref().child(targetId).set(payload);
                this.invalidateCache();
                return targetId;
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:salvar]', error);
                return null;
            }
        },

        async remover(produtoId) {
            try {
                const id = this._safeString(produtoId);
                if (!id) return false;

                await this._ref().child(id).remove();
                this.invalidateCache();
                return true;
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:remover]', error);
                return false;
            }
        },

        async pausar(produtoId, statusAtivo = false) {
            try {
                const id = this._safeString(produtoId);
                if (!id) return false;

                await this._ref().child(id).update({ ativo: Boolean(statusAtivo) });
                this.invalidateCache();
                return true;
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:pausar]', error);
                return false;
            }
        },

        async duplicarProduto(produtoId) {
            try {
                const itemOriginal = await this.buscarPorId(produtoId);
                if (!itemOriginal) throw new Error('Produto base original não localizado.');

                const novoPayload = {
                    ...itemOriginal,
                    nome: `${itemOriginal.nome} (Cópia)`,
                    codigo: `${itemOriginal.codigo}-C`,
                    createdAt: Date.now()
                };
                delete novoPayload.id;

                return await this.salvar(null, novoPayload);
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:duplicarProduto]', error);
                return null;
            }
        }
    };

    // CONGELAMENTO SEGURO DA CAMADA DE PERSISTÊNCIA NO ESCOPO WINDOW
    Object.defineProperty(window, 'produtoService', {
        value: Object.freeze(produtoService),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] [ProdutoService] Camada de persistência especializada em produtos homologada com correção de Cache.');
})();
