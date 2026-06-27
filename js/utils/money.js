// ======================================================================
// js/utils/money.js
// Abella Joias - MoneyUtils v2.1 (Versão Final de Produção)
// Compatível com GitHub Pages • Proteção Contra Ponto Flutuante IEEE 754
// Arquitetura Homologada PMA V8 - Arquivo Completo e Selado
// ======================================================================

const MoneyUtils = (() => {
    'use strict';

    // ==========================================================
    // CONFIG
    // ==========================================================
    const LOCALE = 'pt-BR';
    const CURRENCY = 'BRL';

    // ==========================================================
    // HELPERS
    // ==========================================================
    function safeNumber(valor, fallback = 0) {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : fallback;
    }

    function safeString(valor = '') {
        return String(valor || '').trim();
    }

    // ==========================================================
    // FORMATAR
    // ==========================================================
    function format(value = 0) {
        try {
            const numero = safeNumber(value);
            return new Intl.NumberFormat(LOCALE, {
                style: 'currency',
                currency: CURRENCY
            }).format(numero);
        } catch (error) {
            console.error('[PMA V8] [MoneyUtils:format]', error);
            return 'R$ 0,00';
        }
    }

    // ==========================================================
    // PARSE
    // ==========================================================
    function parse(value = 0) {
        try {
            if (typeof value === 'number') {
                return safeNumber(value);
            }

            let texto = safeString(value);
            if (!texto) {
                return 0;
            }

            // Remove símbolos monetários e espaços indesejados
            texto = texto.replace(/[^\d,.-]/g, '');

            // Remove pontos de milhares
            texto = texto.replace(/\.(?=\d{3})/g, '');

            // Substitui de forma global todas as vírgulas por pontos decimais
            texto = texto.replace(/,/g, '.');

            const resultado = parseFloat(texto);
            return safeNumber(resultado);
        } catch (error) {
            console.error('[PMA V8] [MoneyUtils:parse]', error);
            return 0;
        }
    }

    // ==========================================================
    // PERCENTUAL (ARREDONDAMENTO MATEMÁTICO PRECISO)
    // ==========================================================
    function aplicarDesconto(valor, percentual = 0) {
        try {
            const precoOriginal = safeNumber(valor);
            let taxaDesconto = safeNumber(percentual);

            // Garante travas de segurança do limite de desconto (0% a 100%)
            if (taxaDesconto < 0) taxaDesconto = 0;
            if (taxaDesconto > 100) taxaDesconto = 100;

            const valorComDesconto = precoOriginal - (precoOriginal * (taxaDesconto / 100));

            // Arredondamento matemático preciso eliminando falhas de ponto flutuante do JS
            return Math.round((valorComDesconto + Number.EPSILON) * 100) / 100;
        } catch (error) {
            console.error('[PMA V8] [MoneyUtils:aplicarDesconto]', error);
            return safeNumber(valor);
        }
    }

    // ==========================================================
    // EXPORT
    // ==========================================================
    return Object.freeze({
        format,
        parse,
        aplicarDesconto,
        safeNumber
    });
})();

// ==========================================================
// EXPORTS GLOBAIS
// ==========================================================
Object.defineProperty(window, 'MoneyUtils', { value: MoneyUtils, writable: false, configurable: false });
Object.defineProperty(window, 'fM', { value: MoneyUtils.format, writable: false, configurable: false });

// Mapeamento Legado / Compatibilidade Retroativa Segura
Object.defineProperty(window, 'money', {
    value: Object.freeze({
        formatar: MoneyUtils.format,
        parsear: MoneyUtils.parse
    }),
    writable: false,
    configurable: false
});

console.info('[PMA V8] 💰 MoneyUtils v2.1 fixado e congelado com sucesso.');
