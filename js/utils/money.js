// js/utils/money.js

const MoneyUtils = {
    format: function(value) {
        const cleanValue = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(cleanValue);
    },
    
    parse: function(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        const clean = value.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
        return parseFloat(clean) || 0;
    }
};

window.MoneyUtils = MoneyUtils;
window.fM = MoneyUtils.format;
