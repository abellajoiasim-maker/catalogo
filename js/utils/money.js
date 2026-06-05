// ======================================================================
// js/utils/money.js
// Abella Joias - MoneyUtils v2.0
// AUDITORIA FORENSE IQ200
// ======================================================================

const MoneyUtils = (() => {

    // ==========================================================
    // CONFIG
    // ==========================================================

    const LOCALE = 'pt-BR';

    const CURRENCY = 'BRL';

    // ==========================================================
    // HELPERS
    // ==========================================================

    function safeNumber(
        valor,
        fallback = 0
    ) {

        const numero =
            Number(valor);

        return Number.isFinite(numero)
            ? numero
            : fallback;

    }

    function safeString(
        valor = ''
    ) {

        return String(valor || '')
            .trim();

    }

    // ==========================================================
    // FORMATAR
    // ==========================================================

    function format(
        value = 0
    ) {

        try {

            const numero =
                safeNumber(value);

            return new Intl.NumberFormat(

                LOCALE,

                {

                    style:
                        'currency',

                    currency:
                        CURRENCY

                }

            ).format(numero);

        } catch (error) {

            console.error(
                '[MoneyUtils:format]',
                error
            );

            return 'R$ 0,00';

        }

    }

    // ==========================================================
    // PARSE
    // ==========================================================

    function parse(
        value = 0
    ) {

        try {

            // ==================================================
            // NUMBER
            // ==================================================

            if (
                typeof value ===
                'number'
            ) {

                return safeNumber(
                    value
                );

            }

            // ==================================================
            // STRING
            // ==================================================

            let texto =
                safeString(value);

            if (!texto) {

                return 0;

            }

            // remove moeda/espaços
            texto =
                texto.replace(
                    /[^\d,.-]/g,
                    ''
                );

            // remove milhares
            texto =
                texto.replace(
                    /\.(?=\d{3})/g,
                    ''
                );

            // decimal BR
            texto =
                texto.replace(
                    ',',
                    '.'
                );

            return safeNumber(
                parseFloat(texto)
            );

        } catch (error) {

            console.error(
                '[MoneyUtils:parse]',
                error
            );

            return 0;

        }

    }

    // ==========================================================
    // PERCENTUAL
    // ==========================================================

    function aplicarDesconto(
        valor,
        percentual = 0
    ) {

        const numero =
            safeNumber(valor);

        const desconto =
            safeNumber(percentual);

        return Number(

            (
                numero -

                (
                    numero *
                    (desconto / 100)
                )

            ).toFixed(2)

        );

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
// EXPORTS
// ==========================================================

window.MoneyUtils =
    MoneyUtils;

window.fM =
    MoneyUtils.format;

// ==========================================================
// LEGADO
// ==========================================================

window.money = {

    formatar:
        MoneyUtils.format,

    parsear:
        MoneyUtils.parse

};

// ==========================================================
// INIT
// ==========================================================

console.log(
    '💰 MoneyUtils v2.0 carregado.'
);
