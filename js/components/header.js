// ======================================================================
// js/components/header.js
// Abella Joias - HeaderComponent v2.0
// ======================================================================

const HeaderComponent = {

    initialized: false,

    // ==========================================================
    // Formatar moeda
    // ==========================================================

    formatMoney(valor) {

        try {

            if (
                window.MoneyUtils &&
                typeof window.MoneyUtils.format === 'function'
            ) {

                return window.MoneyUtils.format(
                    valor
                );
            }

            return new Intl.NumberFormat(
                'pt-BR',
                {
                    style: 'currency',
                    currency: 'BRL'
                }
            ).format(valor);

        } catch {

            return `R$ ${Number(valor || 0).toFixed(2)}`;
        }
    },

    // ==========================================================
    // Atualizar indicadores
    // ==========================================================

    renderCounters() {

        try {

            if (
                !window.CarrinhoService
            ) {
                return;
            }

            const totais =
                window.CarrinhoService
                    .calcularTotais();

            const countEl =
                document.getElementById(
                    'cart-count'
                );

            const weightEl =
                document.getElementById(
                    'cart-weight'
                );

            const totalEl =
                document.getElementById(
                    'cart-total'
                );

            if (countEl) {

                countEl.textContent =
                    `${totais.totalPecas} pçs`;
            }

            if (weightEl) {

                weightEl.textContent =
                    `${totais.pesoTotal.toFixed(2)}g`;
            }

            if (totalEl) {

                totalEl.textContent =
                    this.formatMoney(
                        totais.subtotal
                    );
            }

        } catch (error) {

            console.error(
                '[HeaderComponent:renderCounters]',
                error
            );
        }
    },

    // ==========================================================
    // Atualizar contador visual
    // ==========================================================

    atualizarBadge() {

        try {

            const badge =
                document.getElementById(
                    'cart-badge'
                );

            if (!badge) {
                return;
            }

            const quantidade =
                window.CarrinhoService
                    ?.getQuantidadeItens?.() || 0;

            badge.textContent =
                quantidade;

            badge.style.display =
                quantidade > 0
                    ? 'flex'
                    : 'none';

        } catch (error) {

            console.error(
                '[HeaderComponent:atualizarBadge]',
                error
            );
        }
    },

    // ==========================================================
    // Atualização completa
    // ==========================================================

    atualizarTudo() {

        this.renderCounters();

        this.atualizarBadge();
    },

    // ==========================================================
    // Inicialização
    // ==========================================================

    init() {

        if (
            this.initialized
        ) {
            return;
        }

        this.initialized = true;

        this._listener =
            this.atualizarTudo.bind(this);

        this.atualizarTudo();

        window.addEventListener(
            'carrinhoAtualizado',
            this._listener
        );

        console.log(
            '[HeaderComponent] Inicializado.'
        );
    },

    // ==========================================================
    // Destruir Listener
    // ==========================================================

    destroy() {

        if (
            this._listener
        ) {

            window.removeEventListener(
                'carrinhoAtualizado',
                this._listener
            );
        }

        this.initialized = false;
    }
};

// ==========================================================
// Exportação Global
// ==========================================================

window.HeaderComponent =
    HeaderComponent;

// ==========================================================
// Auto Start
// ==========================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (
            typeof window.CarrinhoService !==
            'undefined'
        ) {

            HeaderComponent.init();
        }
    }
);
