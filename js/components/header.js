// ======================================================================
// js/components/header.js
// Abella Joias - HeaderComponent v3.0
// Refatorado conforme Auditoria Forense Firebase
// ======================================================================

const HeaderComponent = {


initialized: false,

_listener: null,

_elements: {},

_renderTimeout: null,

// ==========================================================
// HELPERS
// ==========================================================

_safeNumber(value = 0) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
},

formatMoney(valor) {

    try {

        if (
            window.MoneyUtils &&
            typeof window.MoneyUtils.format ===
            'function'
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
        ).format(
            this._safeNumber(
                valor
            )
        );

    } catch {

        return `R$ ${this._safeNumber(valor).toFixed(2)}`;
    }
},

// ==========================================================
// CACHE DOM
// ==========================================================

cacheElements() {

    this._elements = {

        count:
            document.getElementById(
                'cart-count'
            ),

        weight:
            document.getElementById(
                'cart-weight'
            ),

        total:
            document.getElementById(
                'cart-total'
            ),

        badge:
            document.getElementById(
                'cart-badge'
            )
    };
},

// ==========================================================
// QUANTIDADE ITENS
// ==========================================================

getQuantidadeItens() {

    try {

        const itens =
            window.CarrinhoService
                ?.getItens?.() || [];

        return itens.reduce(
            (acc, item) => {

                return (

                    acc +

                    this._safeNumber(
                        item.quantidade
                    )

                );

            },
            0
        );

    } catch {

        return 0;
    }
},

// ==========================================================
// RENDER
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

        if (
            this._elements.count
        ) {

            this._elements.count
                .textContent =

                `${totais.totalPecas} pçs`;
        }

       if (this._elements.weight) {
    this._elements.weight.textContent = typeof window.formatarPeso === 'function'
        ? window.formatarPeso(totais.pesoTotal)
        : `${this._safeNumber(totais.pesoTotal).toFixed(2)}g`;
}

        if (
            this._elements.total
        ) {

            this._elements.total
                .textContent =

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
// BADGE
// ==========================================================

atualizarBadge() {

    try {

        const badge =
            this._elements.badge;

        if (!badge) {
            return;
        }

        const quantidade =
            this.getQuantidadeItens();

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
// RENDER COMPLETO
// ==========================================================

atualizarTudo() {

    clearTimeout(
        this._renderTimeout
    );

    this._renderTimeout =
        setTimeout(() => {

            this.renderCounters();

            this.atualizarBadge();

        }, 10);
},

// ==========================================================
// INIT
// ==========================================================

init() {

    if (
        this.initialized
    ) {
        return;
    }

    this.initialized =
        true;

    this.cacheElements();

    this._listener =
        this.atualizarTudo
            .bind(this);

    window.addEventListener(
        'carrinhoAtualizado',
        this._listener
    );

    this.atualizarTudo();

    console.log(
        '[HeaderComponent] Inicializado.'
    );
},

// ==========================================================
// DESTROY
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

    clearTimeout(
        this._renderTimeout
    );

    this._listener = null;

    this._elements = {};

    this.initialized =
        false;
}


};

// ==========================================================
// EXPORT
// ==========================================================

window.HeaderComponent =
HeaderComponent;

// ==========================================================
// AUTO INIT
// ==========================================================

if (
document.readyState ===
'loading'
) {


document.addEventListener(
    'DOMContentLoaded',
    () => {

        HeaderComponent.init();
    }
);


} else {


HeaderComponent.init();

    

}

console.log(
'🧩 HeaderComponent v3.0 carregado.'
);
