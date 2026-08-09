/**
 * Abella Joias - PMA V8
 * Service: cupomService
 * Descrição: Validação e cálculo de cupons de desconto (código digitado pelo cliente),
 * incluindo a regra de valor mínimo de compra.
 */

(function () {
    'use strict';

    function abellaPath(node) {
        return typeof window.getAbellaPath === 'function' ? window.getAbellaPath(node) : `abella/${node}`;
    }

    function round(valor) {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    const cupomService = {

        /**
         * Busca e valida um cupom pelo código, considerando o subtotal atual do carrinho.
         * Retorna { valido: boolean, motivo: string|null, cupom: object|null }
         */
        validar: async function (codigoDigitado, subtotal) {
            const codigo = String(codigoDigitado || '').trim().toUpperCase();

            if (!codigo) {
                return { valido: false, motivo: 'Digite um código de cupom.', cupom: null };
            }
            if (!window.db) {
                return { valido: false, motivo: 'Serviço indisponível no momento.', cupom: null };
            }

            try {
                const snap = await window.db.ref(`${abellaPath('coupons')}/${codigo}`).once('value');
                if (!snap.exists()) {
                    return { valido: false, motivo: 'Cupom não encontrado.', cupom: null };
                }

                const cupom = snap.val();

                if (cupom.active === false) {
                    return { valido: false, motivo: 'Este cupom não está mais ativo.', cupom: null };
                }

                const validade = cupom.expiraEm || cupom.validoAte;
                if (validade) {
                    const dataValidade = new Date(validade + 'T23:59:59');
                    if (Date.now() > dataValidade.getTime()) {
                        return { valido: false, motivo: 'Este cupom expirou.', cupom: null };
                    }
                }

                const valorMinimo = parseFloat(cupom.valorMinimo || 0);
                if (valorMinimo > 0 && subtotal < valorMinimo) {
                    const faltam = (valorMinimo - subtotal).toFixed(2).replace('.', ',');
                    return {
                        valido: false,
                        motivo: `Esse cupom exige compra mínima de R$ ${valorMinimo.toFixed(2).replace('.', ',')}. Faltam R$ ${faltam}.`,
                        cupom: null
                    };
                }

                return { valido: true, motivo: null, cupom: { ...cupom, code: codigo } };
            } catch (error) {
                console.error('[cupomService] Erro ao validar cupom:', error);
                return { valido: false, motivo: 'Erro ao validar cupom. Tente novamente.', cupom: null };
            }
        },

        /**
         * Calcula o valor do desconto (em R$) que um cupom já validado aplica sobre um subtotal.
         */
        calcularDesconto: function (cupom, subtotal) {
            if (!cupom || subtotal <= 0) return 0;

            const valor = parseFloat(cupom.value || cupom.valor || 0);
            if (!valor || valor <= 0) return 0;

            if (cupom.type === 'fixo' || cupom.tipo === 'fixo') {
                return round(Math.min(valor, subtotal)); // nunca desconta mais que o próprio subtotal
            }

            // porcentagem
            const percentual = Math.min(100, Math.max(0, valor));
            return round(subtotal * (percentual / 100));
        }
    };

    Object.freeze(cupomService);
    window.cupomService = cupomService;

})();
