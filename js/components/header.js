// js/components/header.js

const HeaderComponent = {
    renderCounters: function() {
        const totais = window.CarrinhoService.calcularTotais();
        
        const countEl = document.getElementById('cart-count');
        const weightEl = document.getElementById('cart-weight');
        const totalEl = document.getElementById('cart-total');

        if (countEl) countEl.innerText = `${totais.totalPecas} pçs`;
        if (weightEl) weightEl.innerText = `${totais.pesoTotal.toFixed(2)}g`;
        if (totalEl) totalEl.innerText = window.MoneyUtils.format(totais.subtotal);
    },

    init: function() {
        this.renderCounters();
        window.removeEventListener('carrinhoAtualizado', this.renderCounters);
        window.addEventListener('carrinhoAtualizado', this.renderCounters);
    }
};

window.HeaderComponent = HeaderComponent;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.CarrinhoService !== 'undefined') {
        window.HeaderComponent.init();
    }
});
