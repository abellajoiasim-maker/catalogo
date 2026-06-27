// ======================================================================
// js/services/produtoService.js
// Abella Joias - ProdutoService v8.0 (Arquitetura PMA V8)
// CRUD Completo, Seguro, Reativo e Integrado ao Ecossistema Abella
// ======================================================================

(function () {
    'use strict';

    const PRODUCTS_PATH = typeof window.getAbellaPath === 'function'
        ? window.getAbellaPath('products')
        : 'abella/products';

    const produtoService = {
        _cache: null,
        _cacheTimestamp: 0,
        _cacheTTL: 60000,

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
                this._cache &&
                (Date.now() - this._cacheTimestamp) < this._cacheTTL
            );
        },

        // INVALIDAÇÃO FORÇADA E ATUALIZAÇÃO DO SISTEMA
        invalidateCache() {
            this._cache = null;
            this._cacheTimestamp = 0;
            
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

        _safeNumber(valor = 0) {
            const n = parseFloat(valor);
            return Number.isFinite(n) ? n : 0;
        },

        _safeArray(valor) {
            if (Array.isArray(valor)) {
                return valor.map(v => String(v).trim()).filter(Boolean);
            }
            if (typeof valor === 'string') {
                return valor.split(',').map(v => v.trim()).filter(Boolean);
            }
            return [];
        },

        // SANEADOR DE PRODUTOS (ALINHADO COM CATALOGSERVICE)
        normalizarProduto(id, produto = {}) {
            if (!id || !produto) return null;

            const nome = this._safeString(produto.nome || produto.name || 'Produto Sem Nome');
            const precoOriginal = this._safeNumber(produto.precoOriginal ?? produto.precoAntigo ?? produto.oldPrice ?? 0);
            const precoVenda = this._safeNumber(produto.preco ?? produto.precoFinal ?? produto.price ?? produto.valor ?? 0);

            return {
                id: this._safeString(id),
                codigo: this._safeString(produto.codigo || produto.sku || id),
                nome: nome,
                descricao: this._safeString(produto.descricao || produto.description || ''),
                precoOriginal: precoOriginal || precoVenda,
                preco: precoVenda,
                imagem: this._safeString(produto.imagem || produto.image || produto.img || ''),
                categoriaId: this._safeString(produto.categoriaId || produto.categoria || produto.category || ''),
                subcategoriaId: this._safeString(produto.subcategoriaId || produto.subcategoria || produto.subcategory || ''),
                ativo: produto.ativo !== false,
                estoque: this._safeNumber(produto.estoque ?? 1),
                destaque: Boolean(produto.destaque ?? false),
                variacoes: this._safeArray(produto.variacoes || produto.variantes),
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
                    return Object.values(this._cache);
                }

                const snapshot = await this._ref().once('value');
                const data = snapshot.val() || {};
                
                this._cache = {};
                Object.keys(data).forEach(id => {
                    const norm = this.normalizarProduto(id, data[id]);
                    if (norm) this._cache[id] = norm;
                });

                this._cacheTimestamp = Date.now();
                return Object.values(this._cache);
            } catch (error) {
                console.error('[PMA V8] [ProdutoService:listarTodos]', error);
                return [];
            }
        },

        async buscarPorId(produtoId) {
            try {
                const id = this._safeString(produtoId);
                if (!id) return null;

                if (this._cache && this._cache[id]) {
                    return this._cache[id];
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

        /**
         * Cria ou atualiza as propriedades de um produto no banco
         * @param {string|null} id - ID do produto (se nulo, cria um novo nó autogerado)
         * @param {Object} produtoData - Dados brutos do produto vindo do formulário
         */
        async salvar(id = null, produtoData = {}) {
            try {
                const targetId = id ? this._safeString(id) : this._ref().push().key;
                if (!targetId) throw new Error('Falha ao gerar chave identificadora única.');

                const norm = this.normalizarProduto(targetId, produtoData);
                
                // Mapeia o payload final estruturado puro para persistência direta
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
                    destaque: norm.destaque,
                    variacoes: norm.variacoes,
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

        /**
         * Remove permanentemente um produto do banco de dados
         * @param {string} produtoId - ID identificador do produto
         */
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

        /**
         * Alterna o estado de ativação de um produto (Pausa/Ativa na vitrine)
         * @param {string} produtoId - ID identificador do produto
         * @param {boolean} statusAtivo - Status booleano desejado
         */
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

        /**
         * Duplica as propriedades de um produto existente criando uma nova referência
         * @param {string} produtoId - ID do produto a ser copiado
         */
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
                delete novoPayload.id; // Remove ID para forçar geração de nova chave pelo método salvar

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

    console.info('[PMA V8] [ProdutoService] Camada de persistência especializada em produtos homologada.');
})();
