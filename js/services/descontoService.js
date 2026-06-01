// ======================================================================
// js/firebase/services/descontoService.js
// Abella Joias - DescontoService v2.0
// ======================================================================

const DescontoService = {

    // ==========================================================
    // Helpers
    // ==========================================================

    _safeNumber(valor, fallback = 0) {

        const numero = Number(valor);

        return Number.isFinite(numero)
            ? numero
            : fallback;
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

        const taxa =
            this._safeNumber(
                porcentagem
            );

        return Number(
            (
                total *
                (taxa / 100)
            ).toFixed(2)
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

        return Number(
            (
                total -
                desconto
            ).toFixed(2)
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

        return Number(
            (
                antigo -
                atual
            ).toFixed(2)
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

        if (!produto) {
            return null;
        }

        const precoAtual =
            this._safeNumber(
                produto.price ??
                produto.precoFinal ??
                produto.preco
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

        return `-${percentual}% OFF`;
    },

    // ==========================================================
    // Produto em Oferta?
    // ==========================================================

    produtoEmOferta(
        produto
    ) {

        if (!produto) {
            return false;
        }

        const precoAtual =
            this._safeNumber(
                produto.price ??
                produto.precoFinal ??
                produto.preco
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

window.DescontoService =
    DescontoService;
