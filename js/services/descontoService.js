/**
 * Abella Joias - PMA V8
 * Service: descontoService
 * Descrição: Cálculos matemáticos de descontos, PIX e validações de ofertas.
 */

(function () {
    'use strict';

    // ==========================================================
    // Métodos Auxiliares Internos (Isolados no Escopo)
    // ==========================================================

    function safeNumber(valor, fallback = 0) {
        if (valor === null || valor === undefined) {
            return fallback;
        }

        const numero = Number(
            String(valor)
                .replace(/[^\d,.-]/g, '')
                .replace(',', '.')
        );

        return Number.isFinite(numero) ? numero : fallback;
    }

    function round(valor) {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    // ==========================================================
    // Definição do Serviço da API Pública
    // ==========================================================

    const descontoService = {

        /**
         * Retorna um objeto contendo o subtotal, valor deduzido e total final com PIX
         */
        obterResumoPix: function (subtotal, percentual = 0) {
            const total = safeNumber(subtotal);
            const desconto = this.calcularDescontoPix(total, percentual);

            return {
                subtotal: total,
                desconto,
                totalPix: round(total - desconto)
            };
        },

        /**
         * Calcula o valor absoluto do desconto aplicado via PIX
         */
        calcularDescontoPix: function (subtotal, porcentagem = 0) {
            const total = safeNumber(subtotal);
            const taxa = Math.min(100, Math.max(0, safeNumber(porcentagem)));

            return round(total * (taxa / 100));
        },

        /**
         * Calcula o valor líquido final após a aplicação do desconto PIX
         */
        calcularTotalPix: function (subtotal, porcentagem = 0) {
            const total = safeNumber(subtotal);
            const desconto = this.calcularDescontoPix(total, porcentagem);

            return Math.max(0, round(total - desconto));
        },

        /**
         * Calcula a diferença exata em reais entre o preço original e o atual
         */
        calcularEconomia: function (precoAtual, precoAnterior) {
            const atual = safeNumber(precoAtual);
            const antigo = safeNumber(precoAnterior);

            if (antigo <= 0 || atual >= antigo) {
                return 0;
            }

            return round(antigo - atual);
        },

        /**
         * Retorna a porcentagem inteira de desconto obtida
         */
        calcularPercentualDesconto: function (precoAtual, precoAnterior) {
            const atual = safeNumber(precoAtual);
            const antigo = safeNumber(precoAnterior);

            if (antigo <= 0 || atual >= antigo) {
                return 0;
            }

            return Math.round(((antigo - atual) / antigo) * 100);
        },

        /**
         * Gera a string descritiva da etiqueta de oferta (ex: "-15% OFF")
         */
        obterEtiquetaOferta: function (produto) {
            if (!produto || typeof produto !== 'object') {
                return null;
            }

            const precoAtual = safeNumber(
                produto.price ?? produto.precoFinal ?? produto.preco ?? produto.valor
            );

            const precoAnterior = safeNumber(
                produto.oldPrice ?? produto.precoAntigo ?? produto.precoOriginal
            );

            if (precoAnterior <= 0 || precoAtual >= precoAnterior) {
                return null;
            }

            const percentual = this.calcularPercentualDesconto(precoAtual, precoAnterior);

            if (percentual < 1) {
                return null;
            }

            return `-${percentual}% OFF`;
        },

        /**
         * Valida se um determinado produto possui regras de desconto ativas
         */
        produtoEmOferta: function (produto) {
            if (!produto || typeof produto !== 'object') {
                return false;
            }

            const precoAtual = safeNumber(
                produto.price ?? produto.precoFinal ?? produto.preco ?? produto.valor
            );

            const precoAnterior = safeNumber(
                produto.oldPrice ?? produto.precoAntigo ?? produto.precoOriginal
            );

            return (precoAnterior > 0 && precoAtual < precoAnterior);
        },

        /**
         * Formata uma string elegante exibindo o valor poupado em reais (R$)
         */
        formatarEconomia: function (precoAtual, precoAnterior) {
            const economia = this.calcularEconomia(precoAtual, precoAnterior);
            return economia > 0 ? `Economize R$ ${economia.toFixed(2)}` : null;
        }
    };

    // Imutabilidade de Runtime total sob o escopo PMA V8
    Object.freeze(descontoService);

    // Exposição controlada e padronizada na Window
    window.descontoService = descontoService;

    console.info('[descontoService] Configurado com sucesso sob o padrão PMA V8.');

})();
