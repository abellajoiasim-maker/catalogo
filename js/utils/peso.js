/**
 * =====================================================
 * PESO UTILS v1.0
 * Abella Joias
 * =====================================================
 */

(function () {

    /**
     * Formata peso automaticamente:
     *
     * 999.99   => 999,99 g
     * 1000     => 1,00 kg
     * 1250     => 1,25 kg
     * 99999.99 => 100,00 kg
     */

    function formatarPeso(valor) {

        valor = Number(valor || 0);

        if (isNaN(valor)) {
            valor = 0;
        }

        if (valor >= 1000) {

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
    }

    /**
     * Retorna peso somente numérico
     * Ex:
     * 1250 => 1,25
     */

    function pesoNumero(valor) {

        valor = Number(valor || 0);

        if (valor >= 1000) {
            return valor / 1000;
        }

        return valor;
    }

    /**
     * Retorna unidade automaticamente
     */

    function unidadePeso(valor) {

        valor = Number(valor || 0);

        return valor >= 1000
            ? 'kg'
            : 'g';
    }

    /**
     * Disponibiliza globalmente
     */

    window.formatarPeso = formatarPeso;
    window.pesoNumero = pesoNumero;
    window.unidadePeso = unidadePeso;

    console.log(
        '⚖️ PesoUtils v1.0 carregado.'
    );

})();
