// ======================================================================
// js/firebase/services/descontoService.js
// Abella Joias - DescontoService v3.0
// ======================================================================

const DescontoService = {

    // ==========================================================
    // Helpers
    // ==========================================================

    _safeNumber(valor, fallback = 0) {

        if (
            valor === null ||
            valor === undefined
        ) {
            return fallback;
        }

        const numero = Number(

            String(valor)
                .replace(/[^\d,.-]/g, '')
                .replace(',', '.')

        );

        return Number.isFinite(numero)
            ? numero
            : fallback;

    },

    _round(valor) {

        return Math.round(
            (valor + Number.EPSILON) * 100
        ) / 100;

    },

    // ==========================================================
    // Resumo PIX
    // ==========================================================

    obterResumoPix(
        subtotal,
        percentual = 0
    ) {

        const total =
            this._safeNumber(subtotal);

        const desconto =
            this.calcularDescontoPix(
                total,
                percentual
            );

        return {

            subtotal: total,

            desconto,

            totalPix:
                this._round(
                    total - desconto
                )

        };

    },

    // ==========================================================
    // Calcular Desconto PIX
    // ==========================================================

    calcularDescontoPix(
        subtotal,
        porcentagem = 0
    ) {

        const total =
            this._safeNumber(subtotal);

        const taxa = Math.min(

            100,

            Math.max(

                0,

                this._safeNumber(
                    porcentagem
                )

            )

        );

        return this._round(
            total * (taxa / 100)
        );

    },

    // ==========================================================
    // Calcular Total PIX
    // ==========================================================

    calcularTotalPix(
        subtotal,
        porcentagem = 0
    ) {

        const total =
            this._safeNumber(subtotal);

        const desconto =
            this.calcularDescontoPix(
                total,
                porcentagem
            );

        return Math.max(

            0,

            this._round(
                total - desconto
            )

        );

    },

    // ==========================================================
    // Calcular Economia
    // ==========================================================

    calcularEconomia(
        precoAtual,
        precoAnterior
    ) {

        const atual =
            this._safeNumber(
                precoAtual
            );

        const antigo =
            this._safeNumber(
                precoAnterior
            );

        if (
            antigo <= 0 ||
            atual >= antigo
        ) {
            return 0;
        }

        return this._round(
            antigo - atual
        );

    },

    // ==========================================================
    // Calcular % de Desconto
    // ==========================================================

    calcularPercentualDesconto(
        precoAtual,
        precoAnterior
    ) {

        const atual =
            this._safeNumber(
                precoAtual
            );

        const antigo =
            this._safeNumber(
                precoAnterior
            );

        if (
            antigo <= 0 ||
            atual >= antigo
        ) {
            return 0;
        }

        return Math.round(

            (
                (
                    antigo -
                    atual
                ) /
                antigo
            ) * 100

        );

    },

    // ==========================================================
    // Etiqueta de Oferta
    // ==========================================================

    obterEtiquetaOferta(
        produto
    ) {

        if (
            !produto ||
            typeof produto !== 'object'
        ) {
            return null;
        }

        const precoAtual =
            this._safeNumber(

                produto.price ??
                produto.precoFinal ??
                produto.preco ??
                produto.valor

            );

        const precoAnterior =
            this._safeNumber(

                produto.oldPrice ??
                produto.precoAntigo ??
                produto.precoOriginal

            );

        if (
            precoAnterior <= 0 ||
            precoAtual >= precoAnterior
        ) {
            return null;
        }

        const percentual =
            this.calcularPercentualDesconto(
                precoAtual,
                precoAnterior
            );

        if (percentual < 1) {
            return null;
        }

        return `-${percentual}% OFF`;

    },

    // ==========================================================
    // Produto em Oferta?
    // ==========================================================

    produtoEmOferta(
        produto
    ) {

        if (
            !produto ||
            typeof produto !== 'object'
        ) {
            return false;
        }

        const precoAtual =
            this._safeNumber(

                produto.price ??
                produto.precoFinal ??
                produto.preco ??
                produto.valor

            );

        const precoAnterior =
            this._safeNumber(

                produto.oldPrice ??
                produto.precoAntigo ??
                produto.precoOriginal

            );

        return (

            precoAnterior > 0 &&
            precoAtual < precoAnterior

        );

    },

    // ==========================================================
    // Formatar Economia
    // ==========================================================

    formatarEconomia(
        precoAtual,
        precoAnterior
    ) {

        const economia =
            this.calcularEconomia(
                precoAtual,
                precoAnterior
            );

        return economia > 0

            ? `Economize R$ ${economia.toFixed(2)}`

            : null;

    }

};

Object.freeze(
    DescontoService
);

window.DescontoService =
    DescontoService;

console.log(
    '💰 DescontoService v3.0 carregado.'
);
