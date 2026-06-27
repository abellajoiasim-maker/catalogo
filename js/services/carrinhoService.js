/**
 * Abella Joias - PMA V8
 * Service: carrinhoService
 * Descrição: Gerenciamento unificado e seguro do carrinho de compras.
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
         * Retorna todos os itens do carrinho
         */
        listar: function () {
            return obterItens();
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
                itens.push({
                    ...produto,
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
            return obterItens().reduce((total, item) => total + (item.quantidade || 0), 0);
        },

        /**
         * Calcula o valor bruto total dos produtos no carrinho
         */
        obterTotal: function () {
            return obterItens().reduce((total, item) => {
                const preco = parseFloat(item.preco) || 0;
                return total + (preco * (item.quantidade || 0));
            }, 0);
        }
    };

    // Aplicação do congelamento estrito (Imutabilidade de Runtime) idêntico ao configService
    Object.freeze(carrinhoService);

    // Exposição segura no escopo global (window)
    window.carrinhoService = carrinhoService;

})();
