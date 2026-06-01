// js/services/descontoService.js

const DescontoService = {
    calcularDescontoPix: function(subtotal, porcentagem) {
        const taxa = parseFloat(porcentagem) || 0;
        const total = parseFloat(subtotal) || 0;
        return parseFloat((total * (taxa / 100)).toFixed(2));
    },

    obterEtiquetaOferta: function(produto) {
        if (!produto) return null;
        if (produto.price < (produto.oldPrice || 0)) {
            const economia = ((produto.oldPrice - produto.price) / produto.oldPrice) * 100;
            return `-${Math.round(economia)}% OFF`;
        }
        return null;
    }
};

window.DescontoService = DescontoService;
