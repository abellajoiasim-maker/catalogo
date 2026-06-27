// ======================================================================
// js/utils/peso.js
// Abella Joias - PesoUtils v2.0 (Versão Final de Produção)
// Compatível com GitHub Pages • Proteção Contra Ponto Flutuante IEEE 754
// Arquitetura Homologada PMA V8 - Arquivo Completo e Selado
// ======================================================================

const PesoUtils = (() => {
    'use strict';

    const LOCALE = 'pt-BR';

    // ==========================================================
    // HELPERS DE SANITIZAÇÃO
    // ==========================================================
    function safeNumber(valor, fallback = 0) {
        if (typeof valor === 'string') {
            // Remove espaços, substitui vírgula por ponto para parser seguro
            valor = valor.trim().replace(/,/g, '.');
        }
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : fallback;
    }

    // Evita erros matemáticos de precisão decimal inerentes ao JS
    function ajustarPrecisao(valor) {
        return Math.round((valor + Number.EPSILON) * 1000) / 1000;
    }

    // ==========================================================
    // MÉTODOS PÚBLICOS
    // ==========================================================
    function formatarPeso(valor) {
        try {
            const numero = safeNumber(valor);

            if (numero >= 1000) {
                const kg = ajustarPrecisao(numero / 1000);
                return new Intl.NumberFormat(LOCALE, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(kg) + ' kg';
            }

            return new Intl.NumberFormat(LOCALE, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(numero) + ' g';

        } catch (error) {
            console.error('[PMA V8] [PesoUtils:formatarPeso]', error);
            return '0,00 g';
        }
    }

    function pesoNumero(valor) {
        try {
            const numero = safeNumber(valor);
            if (numero >= 1000) {
                return ajustarPrecisao(numero / 1000);
            }
            return numero;
        } catch (error) {
            console.error('[PMA V8] [PesoUtils:pesoNumero]', error);
            return 0;
        }
    }

    function unidadePeso(valor) {
        try {
            const numero = safeNumber(valor);
            return numero >= 1000 ? 'kg' : 'g';
        } catch (error) {
            console.error('[PMA V8] [PesoUtils:unidadePeso]', error);
            return 'g';
        }
    }

    // ==========================================================
    // EXPORT
    // ==========================================================
    return Object.freeze({
        formatarPeso,
        pesoNumero,
        unidadePeso,
        safeNumber
    });
})();

// ==========================================================
// FIXAÇÃO PROTETIVA NO ESCOPO GLOBAL
// ==========================================================
Object.defineProperty(window, 'PesoUtils', { value: PesoUtils, writable: false, configurable: false });
Object.defineProperty(window, 'formatarPeso', { value: PesoUtils.formatarPeso, writable: false, configurable: false });
Object.defineProperty(window, 'pesoNumero', { value: PesoUtils.pesoNumero, writable: false, configurable: false });
Object.defineProperty(window, 'unidadePeso', { value: PesoUtils.unidadePeso, writable: false, configurable: false });

console.info('[PMA V8] ⚖️ PesoUtils v2.0 fixado e congelado com sucesso.');
