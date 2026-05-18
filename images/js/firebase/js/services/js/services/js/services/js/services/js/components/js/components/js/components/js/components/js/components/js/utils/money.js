// FILE: /js/utils/money.js

/**
 * Utilitário especializado na formatação e tratamento estrito de valores monetários padrão Real Brasileiro (BRL).
 * Evita mutações indesejadas e soluciona erros clássicos de casas decimais do e-commerce.
 */

/**
 * Formata um número flutuante para string no padrão monetário R$ XX,XX.
 * @param {number} valor - Valor numérico a ser formatado.
 * @returns {string} String formatada pronta para renderização na interface.
 */
export function formatarMoeda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}