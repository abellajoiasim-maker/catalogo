// ==========================================================================
// ARQUIVO: js/utils/money.js
// CRIADO: Este arquivo estava AUSENTE no projeto original.
// categoriaCard.js e produtoCard.js importavam formatarMoeda daqui,
// causando erro de módulo não encontrado ao carregar os componentes.
// ==========================================================================

/**
 * Formata um valor numérico para o padrão monetário brasileiro (BRL).
 * Centraliza a formatação para garantir consistência visual em todo o app.
 * @param {number} valor - O valor numérico a ser formatado.
 * @returns {string} String formatada, ex: "R$ 1.250,00"
 */
export function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(valor) || 0);
}
