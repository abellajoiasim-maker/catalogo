window.formatarPeso = function(valor){

    valor = Number(valor || 0);

    if(valor >= 1000){

        return new Intl.NumberFormat(
            'pt-BR',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        ).format(valor / 1000) + ' kg';
    }

    return new Intl.NumberFormat(
        'pt-BR',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(valor) + ' g';
};
