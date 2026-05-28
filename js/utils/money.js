const MoneyUtils = {
    formatar(valor) {
        const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
        if (isNaN(numero)) return 'R$ 0,00';
        return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    converterParaNumero(valorString) {
        if (!valorString) return 0;
        if (typeof valorString === 'number') return valorString;
        return parseFloat(valorString.replace(/[^\d,]/g, '').replace(',', '.'));
    }
};
