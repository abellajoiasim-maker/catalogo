/**
 * Abella Joias - PMA V8
 * Service: carrinhoService
 * Descrição: Gerenciamento unificado, seguro e reativo do carrinho de compras integrado ao sistema de descontos.
 */

(function () {
    'use strict';

    // Chave de isolamento do LocalStorage para multi-lojas
    const STORAGE_KEY = 'pma_v8_carrinho_itens';

    /**
     * Recupera os itens do carrinho com tratamento seguro de erros
     * @returns {Array} Lista de itens do carrinho
     */
    function obterItens() {
        try {
            const dados = localStorage.getItem(STORAGE_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('[carrinhoService] Erro ao ler itens do localStorage:', error);
            return [];
        }
    }

    /**
     * Salva o estado atual do carrinho no LocalStorage
     * @param {Array} itens - Lista de itens atualizada
     */
    function salvarItens(itens) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
        } catch (error) {
            console.error('[carrinhoService] Erro ao salvar itens no localStorage:', error);
        }
    }

    // Chave separada para o cupom aplicado (independente dos itens, sobrevive a alterações de quantidade)
    const CUPOM_KEY = 'pma_v8_cupom_aplicado';

    function obterCupomSalvo() {
        try {
            const dados = localStorage.getItem(CUPOM_KEY);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('[carrinhoService] Erro ao ler cupom do localStorage:', error);
            return null;
        }
    }

    // Instanciação do serviço com os métodos públicos
    const carrinhoService = {
        
        /**
         * Retorna todos os itens do carrinho com os cálculos de desconto atualizados dinamicamente
         */
        listar: function () {
            const itens = obterItens();
            
            // Injeta em tempo real os descontos vigentes do ecossistema para cada item
            return itens.map(item => {
                if (window.descontoService && typeof window.descontoService.calcularPrecoComDesconto === 'function') {
                    const precoFinal = window.descontoService.calcularPrecoComDesconto(item);
                    const badge = window.descontoService.obterEtiquetaOferta(item);
                    return {
                        ...item,
                        precoVendaUnitario: precoFinal,
                        possuiDesconto: precoFinal < (parseFloat(item.preco) || 0),
                        badgePromocional: badge
                    };
                }
                // Fallback de segurança caso o descontoService falhe ou não tenha carregado
                return {
                    ...item,
                    precoVendaUnitario: parseFloat(item.preco) || 0,
                    possuiDesconto: false,
                    badgePromocional: null
                };
            });
        },

        /**
         * Retorna a lista de itens brutos (utilizado por componentes externos)
         */
        obterItens: function() {
            return obterItens();
        },

        /**
         * Adiciona um produto ou incrementa sua quantidade caso já exista (considerando a variação)
         * @param {Object} produto - Objeto do produto a ser adicionado
         * @param {number} quantidade - Quantidade desejada (padrão 1)
         * @param {string} variacao - String contendo o nome da variação/grade (opcional)
         */
        adicionar: function (produto, quantidade = 1, variacao = '') {
            if (!produto || (!produto.id && !produto.codigo && !produto.sku)) {
                console.error('[carrinhoService] Produto inválido para adição.');
                return false;
            }

            const pId = produto.id || produto.codigo || produto.sku;
            const labelVariacao = variacao ? variacao.trim() : '';
            const itens = obterItens();
            const estoqueControlado = produto.estoqueControlado === true || produto.estoqueLimitadoAtivo === true || produto.controleEstoque === true;
            const estoqueQuantidade = Math.max(0, parseInt(produto.estoqueQuantidade ?? produto.estoque ?? 0, 10) || 0);
            if (estoqueControlado && produto.venderSemEstoque !== true) {
                const totalAtual = itens
                    .filter(item => item.id === pId)
                    .reduce((total, item) => total + (parseInt(item.quantidade, 10) || 0), 0);
                if (totalAtual + quantidade > estoqueQuantidade) {
                    console.warn('[carrinhoService] Limite de estoque atingido para', pId);
                    return false;
                }
            }

            // Busca por ID E pela variação exata para não somar itens de grades diferentes na mesma linha
            const index = itens.findIndex(item => item.id === pId && (item.variacao || '') === labelVariacao);

            if (index !== -1) {
                itens[index].quantidade += quantidade;
            } else {
                // Guarda apenas os dados brutos essenciais estruturais no storage
                itens.push({
                    id: pId,
                    sku: produto.sku || produto.codigo || pId,
                    codigo: produto.codigo || produto.sku || pId,
                    name: produto.nome || produto.name,
                    preco: parseFloat(produto.preco) || 0,
                    category: produto.categoriaId || produto.category || produto.categoria || '',
                    subcategory: produto.subcategoriaId || produto.subcategory || produto.subcategoria || '',
                    image: produto.imagem || produto.image || '',
                    peso: parseFloat(produto.peso || 0),
                    quantidade: quantidade,
                    variacao: labelVariacao, // Persistência estável da grade escolhida
                    estoqueControlado,
                    estoqueQuantidade: estoqueControlado ? estoqueQuantidade : null,
                    venderSemEstoque: produto.venderSemEstoque === true
                });
            }

            salvarItens(itens);
            console.info(`[carrinhoService] Produto ID ${pId} (${labelVariacao || 'Sem Variação'}) adicionado/atualizado.`);
            return true;
        },

        /**
         * Remove completamente um item do carrinho pelo ID e sua variação específica
         * @param {string|number} produtoId - ID do produto
         * @param {string} variacao - Nome da variação para diferenciação
         */
        remover: function (produtoId, variacao = '') {
            let itens = obterItens();
            const tamanhoOriginal = itens.length;
            const labelVariacao = variacao ? variacao.trim() : '';
            
            itens = itens.filter(item => !(item.id === produtoId && (item.variacao || '') === labelVariacao));

            if (itens.length < tamanhoOriginal) {
                salvarItens(itens);
                console.info(`[carrinhoService] Produto ID ${produtoId} (${labelVariacao}) removido do carrinho.`);
                return true;
            }
            return false;
        },

        /**
         * Atualiza diretamente a quantidade de um item específico filtrado por variação
         */
        atualizarQuantidade: function (produtoId, novaQuantidade, variacao = '') {
            if (novaQuantidade <= 0) {
                return this.remover(produtoId, variacao);
            }

            const itens = obterItens();
            const labelVariacao = variacao ? variacao.trim() : '';
            const item = itens.find(item => item.id === produtoId && (item.variacao || '') === labelVariacao);

            if (item) {
                if (item.estoqueControlado === true && item.venderSemEstoque !== true && novaQuantidade > (parseInt(item.estoqueQuantidade, 10) || 0)) {
                    console.warn('[carrinhoService] Quantidade acima do estoque disponível.');
                    return false;
                }
                item.quantidade = novaQuantidade;
                salvarItens(itens);
                console.info(`[carrinhoService] Quantidade do produto ID ${produtoId} (${labelVariacao}) atualizada para ${novaQuantidade}.`);
                return true;
            }
            return false;
        },

        /**
         * Limpa totalmente os itens salvos no carrinho
         */
        limpar: function () {
            try {
                localStorage.removeItem(STORAGE_KEY);
                console.info('[carrinhoService] Carrinho esvaziado com sucesso.');
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao limpar carrinho:', error);
                return false;
            }
        },

        /**
         * Calcula o total de itens (soma das quantidades) presentes no carrinho
         */
        obterContagem: function () {
            return obterItens().reduce((total, item) => total + (parseInt(item.quantidade) || 0), 0);
        },

        /**
         * Calcula o valor BRUTO total acumulado (sem qualquer tipo de desconto)
         */
        obterTotalBruto: function () {
            return obterItens().reduce((total, item) => {
                const precoOriginal = parseFloat(item.preco) || 0;
                return total + (precoOriginal * (parseInt(item.quantidade) || 0));
            }, 0);
        },

        /**
         * Calcula o valor LÍQUIDO total real de cobrança aplicando as regras do descontoService
         * e, se houver, o cupom de código aplicado pelo cliente + a faixa de desconto por valor.
         */
        obterTotal: function () {
            const itensComDesconto = this.listar();
            const subtotalComDescontoCategoria = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            const descontoCupom = this.obterDescontoCupom();
            const descontoFaixa = this.obterDescontoFaixaValor();
            return Math.max(0, subtotalComDescontoCategoria - descontoCupom - descontoFaixa);
        },

        /**
         * Calcula o valor em R$ do desconto automático por faixa de valor de compra (sem código).
         */
        obterDescontoFaixaValor: function () {
            if (!window.descontoService) return 0;

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            const faixa = window.descontoService.obterMelhorFaixaValor(subtotal);
            if (!faixa) return 0;

            const percentual = Math.min(100, Math.max(0, parseFloat(faixa.percentual) || 0));
            return Math.round((subtotal * (percentual / 100) + Number.EPSILON) * 100) / 100;
        },

        /**
         * Retorna a faixa de valor atualmente aplicada (ou null), útil para exibir a etiqueta na UI.
         */
        obterFaixaValorAplicada: function () {
            if (!window.descontoService) return null;
            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);
            return window.descontoService.obterMelhorFaixaValor(subtotal);
        },

        /**
         * Retorna o progresso até a próxima meta de desconto por valor.
         * O cálculo usa o subtotal após ofertas de produto/categoria, antes da faixa.
         */
        obterProgressoFaixaValor: function () {
            if (!window.descontoService || typeof window.descontoService.obterProgressoFaixaValor !== 'function') {
                return null;
            }

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            return window.descontoService.obterProgressoFaixaValor(subtotal);
        },

        /**
         * Aplica um cupom já validado (objeto retornado por cupomService.validar) ao carrinho atual.
         */
        aplicarCupom: function (cupom) {
            try {
                localStorage.setItem(CUPOM_KEY, JSON.stringify(cupom));
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao aplicar cupom:', error);
                return false;
            }
        },

        /**
         * Remove o cupom atualmente aplicado ao carrinho.
         */
        removerCupom: function () {
            try {
                localStorage.removeItem(CUPOM_KEY);
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao remover cupom:', error);
                return false;
            }
        },

        /**
         * Retorna o cupom atualmente aplicado (ou null se nenhum estiver ativo).
         */
        obterCupomAplicado: function () {
            return obterCupomSalvo();
        },

        /**
         * Calcula o valor em R$ do desconto do cupom aplicado, já sobre o subtotal com desconto de categoria.
         */
        obterDescontoCupom: function () {
            const cupom = obterCupomSalvo();
            if (!cupom || !window.cupomService) return 0;

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            return window.cupomService.calcularDesconto(cupom, subtotal);
        }
    };

    // Aplicação do congelamento estrito (Imutabilidade de Runtime)
    Object.freeze(carrinhoService);

    // Exposição segura no escopo global (window)
    window.carrinhoService = carrinhoService;

})();
