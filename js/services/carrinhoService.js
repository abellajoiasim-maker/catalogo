// ======================================================================
// js/services/carrinhoService.js
// Abella Joias - CarrinhoService Premium v8.0 (Arquitetura PMA V8)
// Motor de Vendas Blindado, Reativo e Integrado ao Ecossistema
// ======================================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'abella_carrinho';
    const LEGACY_KEY = 'carrinho';

    const CarrinhoService = {

        // =====================================================
        // HELPERS & SANITIZAÇÃO
        // =====================================================

        _safeParse(json) {
            try {
                return JSON.parse(json) || [];
            } catch (e) {
                console.error('[PMA V8] [Carrinho] Erro ao descriptografar dados locais:', e);
                return [];
            }
        },

        _safeNumber: (valor, fallback = 0) => {
            const n = Number(valor);
            return Number.isFinite(n) ? n : fallback;
        },

        _normalizarTexto: (valor) => String(valor || '').trim(),

        // =====================================================
        // ACESSO AO REPOSITÓRIO (IMUTÁVEL)
        // =====================================================

        getItens() {
            const novo = localStorage.getItem(STORAGE_KEY);
            const antigo = localStorage.getItem(LEGACY_KEY);
            const itens = this._safeParse(novo || antigo || '[]');
            
            // Congela profundamente os itens para evitar manipulação de preços em memória
            return Object.freeze(itens.map(item => Object.freeze({ ...item })));
        },

        obterItens() {
            return this.getItens();
        },

        salvarTodos(itens = []) {
            try {
                const json = JSON.stringify(itens);
                localStorage.setItem(STORAGE_KEY, json);
                localStorage.setItem(LEGACY_KEY, json);

                this.notificarMudanca(itens);
            } catch (e) {
                console.error('[PMA V8] [Carrinho] Falha crítica na persistência do LocalStorage:', e);
            }
        },

        // =====================================================
        // MUTADORES DE FLUXO (ADICIONAR / MODIFICAR)
        // =====================================================

        adicionar(produto, quantidade = 1, variacao = null) {
            if (!produto) return false;

            // Clona a lista para permitir mutação segura na transação
            const itens = Array.from(this.getItens());
            const qtd = Math.max(1, parseInt(quantidade) || 1);
            
            const sku = this._normalizarTexto(
                produto.sku || produto.id || produto.codigo
            ).toUpperCase();

            if (!sku) return false;

            const preco = Math.max(0, this._safeNumber(
                produto.precoFinal ?? produto.price ?? produto.preco ?? produto.valor ?? 0
            ));

            const peso = this._safeNumber(produto.peso ?? produto.weight ?? 0);
            const imagem = this._normalizarTexto(produto.image || produto.imagem || produto.foto || '');
            const index = itens.findIndex(item => String(item.sku).toUpperCase() === sku);

            if (index >= 0) {
                const itemMutado = { ...itens[index] };
                itemMutado.quantidade += qtd;
                itemMutado.precoFinal = preco;
                itemMutado.price = preco;
                itemMutado.peso = peso;
                itemMutado.weight = peso;
                itemMutado.updatedAt = Date.now();
                itens[index] = itemMutado;
            } else {
                itens.push({
                    id: produto.id || sku,
                    sku: sku,
                    nome: this._normalizarTexto(produto.nome || produto.name || 'Produto'),
                    name: this._normalizarTexto(produto.nome || produto.name || 'Produto'),
                    image: imagem,
                    imagem: imagem,
                    precoFinal: preco,
                    price: preco,
                    peso: peso,
                    weight: peso,
                    quantidade: qtd,
                    variacao: variacao ? this._normalizarTexto(variacao) : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }

            this.salvarTodos(itens);
            return true;
        },

        adicionarItem(produto, quantidade = 1) {
            return this.adicionar(produto, quantidade, produto.variacao || null);
        },

        remover(index) {
            const itens = Array.from(this.getItens());
            if (index >= 0 && index < itens.length) {
                itens.splice(index, 1);
                this.salvarTodos(itens);
            }
        },

        removerItem(index) {
            this.remover(index);
        },

        atualizarQuantidade(index, quantidade) {
            const itens = Array.from(this.getItens());
            if (!itens[index]) return;

            const itemMutado = { ...itens[index] };
            itemMutado.quantidade = Math.max(1, parseInt(quantidade) || 1);
            itemMutado.updatedAt = Date.now();
            
            itens[index] = itemMutado;
            this.salvarTodos(itens);
        },

        limpar() {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(LEGACY_KEY);
            this.notificarMudanca([]);
        },

        // =====================================================
        // MATEMÁTICA FINANCEIRA INTEGRADA (DESCONTO & PARCELAS)
        // =====================================================

        calcularTotais(descontoPixPercentual = null) {
            const itens = this.getItens();
            let subtotal = 0;
            let pesoTotal = 0;
            let totalPecas = 0;

            itens.forEach(item => {
                const preco = this._safeNumber(item.precoFinal ?? item.price ?? 0);
                const qtd = parseInt(item.quantidade) || 1;

                subtotal += preco * qtd;
                pesoTotal += this._safeNumber(item.peso ?? item.weight ?? 0) * qtd;
                totalPecas += qtd;
            });

            // Resgata o percentual dinâmico do ConfigService caso não seja provido por parâmetro
            let taxaPix = descontoPixPercentual;
            if (taxaPix === null && window.ConfigService && typeof window.ConfigService.getSettings === 'function') {
                // Tenta ler o cache síncrono ou assume fallback seguro de 5%
                const configs = window.ConfigService._cache;
                taxaPix = configs ? configs.pixDesc : 5;
            } else if (taxaPix === null) {
                taxaPix = 5;
            }

            // Integração nativa com o DescontoService para precisão de centavos
            let resumoPix = { subtotal, desconto: 0, totalPix: subtotal };
            if (window.DescontoService && typeof window.DescontoService.obterResumoPix === 'function') {
                resumoPix = window.DescontoService.obterResumoPix(subtotal, taxaPix);
            } else {
                const desc = subtotal * (taxaPix / 100);
                resumoPix = {
                    subtotal,
                    desconto: Math.round((desc + Number.EPSILON) * 100) / 100,
                    totalPix: Math.round((subtotal - desc + Number.EPSILON) * 100) / 100
                };
            }

            return Object.freeze({
                subtotal: resumoPix.subtotal,
                pesoTotal: Math.round((pesoTotal + Number.EPSILON) * 100) / 100,
                totalPecas,
                descontoPix: resumoPix.desconto,
                totalPix: resumoPix.totalPix
            });
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

        // =====================================================
        // DISPARADORES DE REATIVIDADE
        // =====================================================

        notificarMudanca(itens Atuais = null) {
            const lista = itensAtuais || this.getItens();
            
            // 1. Sincronização com o StateManager Centralizado
            if (window.StateManager && typeof window.StateManager.setState === 'function') {
                window.StateManager.setState('cart', lista);
            }

            // 2. Fallback de evento nativo DOM para o legado da interface
            window.dispatchEvent(
                new CustomEvent('carrinhoAtualizado', { detail: lista })
            );
        }
    };

    // VINCULAÇÃO E CONGELAMENTO DA CAMADA GLOBAL
    Object.defineProperty(window, 'carrinhoService', {
        value: Object.freeze(CarrinhoService),
        writable: false,
        configurable: false
    });
    
    window.CarrinhoService = window.carrinhoService;

    console.info('🛒 [PMA V8] [CarrinhoService] Motor financeiro homologado e integrado.');
})();
