// FILE: js/utils/money.js

/**
 * Utilitário para formatação e manipulação de valores monetários.
 */
export const money = {
    /**
     * Converte um valor numérico bruto para String formatada em Moeda Real (BRL).
     * @param {number} valor - Quantidade numérica flutuante.
     * @returns {string} Valor tratado (Ex: R$ 1.500,00).
     */
    formatarMoeda(valor) {
        const numeroValido = Number(valor) || 0;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numeroValido);
    }
};

// Vinculação global opcional para retrocompatibilidade com escopos legados em scripts tradicionais
if (typeof window !== 'undefined') {
    window.formatarMoedaReal = money.formatarMoeda;
}
