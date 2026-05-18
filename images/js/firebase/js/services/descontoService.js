// FILE: /js/services/descontoService.js

/**
 * Service especializado no cálculo e aplicação das regras comerciais de desconto da Abella Joias.
 * Centraliza e protege as regras de progressão de valores e benefícios para o cliente.
 */
class DescontoService {
    constructor() {
        // Definições estritas das faixas de desconto com base no subtotal da compra
        this.FAIXAS_DESCONTO = [
            { min: 2500, percentual: 20 },
            { min: 1000, percentual: 15 },
            { min: 500,  percentual: 10 },
            { min: 300,  percentual: 5  }
        ];
        
        // Percentual fixo de desconto aplicável para pagamentos via PIX em compras elegíveis
        this.PERCENTUAL_PIX = 0.05; 
        // Valor mínimo de subtotal para elegibilidade do desconto PIX
        this.MINIMO_SUBTOTAL_PIX = 300;
    }

    /**
     * Calcula o percentual de desconto progressivo com base estrita no valor bruto do subtotal.
     * Regra: subtotal>=2500 ? 20 : subtotal>=1000 ? 15 : subtotal>=500 ? 10 : subtotal>=300 ? 5 : 0
     * @param {number} subtotal - O valor bruto total dos produtos no carrinho.
     * @returns {number} O número inteiro representando a porcentagem de desconto (Ex: 20).
     */
    calcularPercentualProgressivo(subtotal) {
        const valor = Number(subtotal) || 0;
        
        for (const faixa of this.FAIXAS_DESCONTO) {
            if (valor >= faixa.min) {
                return faixa.percentual;
            }
        }
        
        return 0;
    }

    /**
     * Calcula o valor nominal em reais deduzido pelo desconto progressivo.
     * @param {number} subtotal - O valor bruto total dos produtos no carrinho.
     * @returns {number} Valor em reais do desconto concedido.
     */
    calcularValorDescontoProgressivo(subtotal) {
        const valor = Number(subtotal) || 0;
        const percentual = this.calcularPercentualProgressivo(valor);
        return valor * (percentual / 100);
    }

    /**
     * Calcula o desconto adicional de 5% exclusivo para a modalidade PIX.
     * Regra: subtotal>=300 ? subtotal*0.05 : 0
     * @param {number} subtotal - O valor bruto total dos produtos no carrinho.
     * @returns {number} Valor nominal em reais do desconto PIX.
     */
    calcularDescontoPix(subtotal) {
        const valor = Number(subtotal) || 0;
        if (valor >= this.MINIMO_SUBTOTAL_PIX) {
            return valor * this.PERCENTUAL_PIX;
        }
        return 0;
    }

    /**
     * Retorna a próxima faixa de desconto para exibição visual de metas (UX de progressão).
     * @param {number} subtotal - O valor bruto atual do carrinho.
     * @returns {Object|null} Objeto contendo a meta { min, percentual } ou null se atingiu o teto máximo.
     */
    obterProximaFaixa(subtotal) {
        const valor = Number(subtotal) || 0;
        
        // Inverte a lista para buscar de baixo para cima a próxima meta alcançável
        const faixasInvertidas = [...this.FAIXAS_DESCONTO].reverse();
        for (const faixa of faixasInvertidas) {
            if (valor < faixa.min) {
                return faixa;
            }
        }
        return null;
    }

    /**
     * Consolida todos os cálculos gerando o balanço financeiro final do carrinho de compras.
     * Garante o cálculo matemático idêntico ao modelo legado para evitar divergências de centavos.
     * @param {number} subtotal - O valor bruto total dos produtos no carrinho.
     * @param {boolean} [isPix=false] - Flag indicando se a modalidade de pagamento selecionada é PIX.
     * @returns {Object} Estrutura com subtotal, descontos aplicados e total líquido final.
     */
    calcularResumoFinanceiro(subtotal, isPix = false) {
        const vSubtotal = Number(subtotal) || 0;
        const vDescontoProgressivo = this.calcularValorDescontoProgressivo(vSubtotal);
        const percentualProgressivo = this.calcularPercentualProgressivo(vSubtotal);
        
        let vDescontoPix = 0;
        if (isPix) {
            vDescontoPix = this.calcularDescontoPix(vSubtotal);
        }

        const vTotalLiquido = Math.max(0, vSubtotal - vDescontoProgressivo - vDescontoPix);

        return {
            subtotal: vSubtotal,
            percentualProgressivo: percentualProgressivo,
            valorDescontoProgressivo: vDescontoProgressivo,
            valorDescontoPix: vDescontoPix,
            total: vTotalLiquido
        };
    }
}

export const descontoService = new DescontoService();