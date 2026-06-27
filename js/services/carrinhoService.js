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

    // Instanciação do serviço com os métodos públicos
    const carrinhoService = {
        
        /**
         * Retorna todos os itens do carrinho com os cálculos de desconto atualizados dinamicamente
         */
        listar: function () {
            const itens = obterItens();
            
            // Injeta em tempo real os descontos vigentes do ecossistema para cada item
            return itens.map(item => {
                if (window.descontoService && typeof window.descontoService.calcularDesconto === 'function') {
                    const infoDesconto = window.descontoService.calcularDesconto(item);
                    return {
                        ...item,
                        precoVendaUnitario: infoDesconto.precoFinal,
                        possuiDesconto: infoDesconto.descontoAplicado > 0,
                        badgePromocional: infoDesconto.badge
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
         * Adiciona um produto ou incrementa sua quantidade caso já exista
         * @param {Object} produto - Objeto do produto a ser adicionado
         * @param {number} quantidade - Quantidade desejada (padrão 1)
         */
        adicionar: function (produto, quantidade = 1) {
            if (!produto || !produto.id) {
                console.error('[carrinhoService] Produto inválido para adição.');
                return false;
            }

            const itens = obterItens();
            const index = itens.findIndex(item => item.id === produto.id);

            if (index !== -1) {
                itens[index].quantidade += quantidade;
            } else {
                // Guarda apenas os dados brutos essenciais estruturais no storage
                itens.push({
                    id: produto.id,
                    name: produto.name,
                    preco: parseFloat(produto.preco) || 0,
                    category: produto.category,
                    subcategory: produto.subcategory || '',
                    image: produto.image || '',
                    peso: produto.peso || 0,
                    quantidade: quantidade
                });
            }

            salvarItens(itens);
            console.info(`[carrinhoService] Produto ID ${produto.id} adicionado/atualizado.`);
            return true;
        },

        /**
         * Remove completamente um item do carrinho pelo ID
         * @param {string|number} produtoId - ID do produto
         */
        remover: function (produtoId) {
            let itens = obterItens();
            const tamanhoOriginal = itens.length;
            
            itens = itens.filter(item => item.id !== produtoId);

            if (itens.length < tamanhoOriginal) {
                salvarItens(itens);
                console.info(`[carrinhoService] Produto ID ${produtoId} removido do carrinho.`);
                return true;
            }
            return false;
        },

        /**
         * Atualiza diretamente a quantidade de um item específico
         * @param {string|number} produtoId - ID do produto
         * @param {number} novaQuantidade - Nova quantidade (deve ser maior que 0)
         */
        atualizarQuantidade: function (produtoId, novaQuantidade) {
            if (novaQuantidade <= 0) {
                return this.remover(produtoId);
            }

            const itens = obterItens();
            const item = itens.find(item => item.id === produtoId);

            if (item) {
                item.quantidade = novaQuantidade;
                salvarItens(itens);
                console.info(`[carrinhoService] Quantidade do produto ID ${produtoId} atualizada para ${novaQuantidade}.`);
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
         */
        obterTotal: function () {
            const itensComDesconto = this.listar();
            return itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);
        }
    };

    // Aplicação do congelamento estrito (Imutabilidade de Runtime)
    Object.freeze(carrinhoService);

    // Exposição segura no escopo global (window)
    window.carrinhoService = carrinhoService;

})();
