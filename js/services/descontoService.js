// ======================================================================
// js/services/descontoService.js
// Abella Joias - DescontoService v8.2 (Edição Exclusiva e Estática)
// Autoridade Suprema Exclusiva sobre: Cálculos de Ofertas, PIX e Categorias
// Arquitetura Homologada PMA V8 - Arquivo Completo e Selado
// ======================================================================

(function () {
    'use strict';

    // ==========================================================
    // Métodos Auxiliares Internos (Isolados no Escopo)
    // ==========================================================

    function safeNumber(valor, fallback = 0) {
        if (valor === null || valor === undefined) {
            return fallback;
        }

        if (typeof valor === 'number') {
            return Number.isFinite(valor) ? valor : fallback;
        }

        // Saneamento robusto focado em Moeda BR (Ex: "R$ 1.250,50" -> 1250.50)
        let str = String(valor).trim();
        
        // Se contiver pontos e vírgulas, remove os pontos de milhar e converte a vírgula em ponto
        if (str.includes(',') && str.includes('.')) {
            str = str.replace(/\./g, '');
        }
        str = str.replace(',', '.');
        
        // Remove qualquer caractere que não seja número, ponto ou sinal de menos
        const numero = parseFloat(str.replace(/[^\d.-]/g, ''));

        return Number.isFinite(numero) ? numero : fallback;
    }

    function round(valor) {
        return Math.round((valor + Number.EPSILON) * 100) / 100;
    }

    // ==========================================================
    // Definição do Serviço da API Pública
    // ==========================================================

    const descontoService = {

        /**
         * Resolve o percentual de desconto aplicável a um produto com base na sua categoria
         * cruzando os dados em tempo real com o ConfigService corporativo da Abella Joias.
         */
        obterPercentualPromocao: function (produto) {
            if (!produto || typeof produto !== 'object' || !window.ConfigService) {
                return 0;
            }

            try {
                // Recupera de forma síncrona o cache limpo e descongelado do ConfigService
                const config = typeof window.ConfigService.getCachedSettings === 'function'
                    ? window.ConfigService.getCachedSettings()
                    : null;
                if (!config || !config.descontos) {
                    return 0;
                }

                const normalizarChave = (valor) => String(valor || '')
                    .trim()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-');

                const categoriaProd = normalizarChave(
                    produto.categoriaId || produto.categoryId || produto.category || produto.categoria
                );
                const subcategoriaProd = normalizarChave(
                    produto.subcategoriaId || produto.subcategoryId || produto.subcategory || produto.subcategoria
                );
                const regrasCategoria = config.descontos.regrasCategoria || {};

                // Primeiro procura a regra mais específica por subcategoria/categoria.
                const candidatos = [
                    subcategoriaProd && `${categoriaProd}__${subcategoriaProd}`,
                    subcategoriaProd,
                    categoriaProd
                ].filter(Boolean);
                for (const chave of candidatos) {
                    const regra = regrasCategoria[chave];
                    if (regra && regra.ativo) {
                        return Math.min(100, Math.max(0, safeNumber(regra.porcentagem)));
                    }
                }

                // Só aplica o desconto global quando ele estiver ativo.
                if (config.descontos.ativo) {
                    return Math.min(100, Math.max(0, safeNumber(config.descontos.porcentagem)));
                }

                return 0;
            } catch (error) {
                console.error('[PMA V8] [descontoService] Erro ao obter regras do ConfigService:', error);
                return 0;
            }
        },

        /**
         * Calcula o preço final de um produto aplicando o desconto de categoria/campanha global se houver.
         */
        calcularPrecoComDesconto: function (produto) {
            if (!produto || typeof produto !== 'object') {
                return 0;
            }

            const precoOriginal = safeNumber(produto.price ?? produto.precoFinal ?? produto.preco ?? produto.valor);
            const precoPromocional = safeNumber(produto.promocao ?? produto.promo ?? produto.precoPromocional, 0);
            const percentualPromo = this.obterPercentualPromocao(produto);

            // Preço promocional explícito do produto tem prioridade quando é menor.
            if (precoPromocional > 0 && precoPromocional < precoOriginal) {
                return precoPromocional;
            }

            if (percentualPromo > 0) {
                return round(precoOriginal * (1 - percentualPromo / 100));
            }

            return precoOriginal;
        },

        /**
         * Retorna um objeto contendo o subtotal, valor deduzido e total final com PIX
         */
        obterResumoPix: function (subtotal, percentual = 0) {
            const total = safeNumber(subtotal);
            const desconto = this.calcularDescontoPix(total, percentual);

            return {
                subtotal: total,
                desconto,
                totalPix: round(total - desconto)
            };
        },

        /**
         * Calcula o valor absoluto do desconto aplicado via PIX
         */
        calcularDescontoPix: function (subtotal, porcentagem = 0) {
            const total = safeNumber(subtotal);
            const taxa = Math.min(100, Math.max(0, safeNumber(porcentagem)));

            return round(total * (taxa / 100));
        },

        /**
         * Calcula o valor líquido final após a aplicação do desconto PIX
         */
        calcularTotalPix: function (subtotal, porcentagem = 0) {
            const total = safeNumber(subtotal);
            const desconto = this.calcularDescontoPix(total, porcentagem);

            return Math.max(0, round(total - desconto));
        },

        /**
         * Calcula a diferença exata em reais entre o preço de tabela/antigo e o preço de venda atual
         */
        calcularEconomia: function (precoAtual, precoAnterior) {
            const atual = safeNumber(precoAtual);
            const antigo = safeNumber(precoAnterior);

            if (antigo <= 0 || atual >= antigo) {
                return 0;
            }

            return round(antigo - atual);
        },

        /**
         * Retorna a porcentagem inteira de desconto obtida entre dois preços
         */
        calcularPercentualDesconto: function (precoAtual, precoAnterior) {
            const atual = safeNumber(precoAtual);
            const antigo = safeNumber(precoAnterior);

            if (antigo <= 0 || atual >= antigo) {
                return 0;
            }

            return Math.round(((antigo - atual) / antigo) * 100);
        },

        /**
         * Gera a string descritiva da etiqueta de oferta (ex: "-15% OFF") priorizando descontos de painel
         */
        obterEtiquetaOferta: function (produto) {
            if (!produto || typeof produto !== 'object') {
                return null;
            }

            const precoOriginal = safeNumber(produto.price ?? produto.precoFinal ?? produto.preco ?? produto.valor);
            const precoPromocional = safeNumber(produto.promocao ?? produto.promo ?? produto.precoPromocional, 0);
            const percentualPromo = this.obterPercentualPromocao(produto);

            // Se houver desconto ativo via painel administrativo por categoria/global
            if (percentualPromo >= 1) {
                return `-${percentualPromo}% OFF`;
            }

            // Também identifica a etiqueta quando o produto possui preço promocional fixo.
            if (precoPromocional > 0 && precoPromocional < precoOriginal) {
                const percentualFixo = this.calcularPercentualDesconto(precoPromocional, precoOriginal);
                return percentualFixo >= 1 ? `-${percentualFixo}% OFF` : null;
            }

            // Fallback: Verifica se o produto veio com "oldPrice" fixo direto do banco de dados
            const precoAnterior = safeNumber(produto.oldPrice ?? produto.precoAntigo ?? produto.precoOriginal);

            if (precoAnterior <= 0 || precoOriginal >= precoAnterior) {
                return null;
            }

            const percentualDePara = this.calcularPercentualDesconto(precoOriginal, precoAnterior);
            return percentualDePara >= 1 ? `-${percentualDePara}% OFF` : null;
        },

        /**
         * Valida se um determinado produto possui regras de desconto ou ofertas ativas
         */
        produtoEmOferta: function (produto) {
            if (!produto || typeof produto !== 'object') {
                return false;
            }

            if (this.obterPercentualPromocao(produto) > 0) {
                return true;
            }

            const precoBase = safeNumber(produto.price ?? produto.precoFinal ?? produto.preco ?? produto.valor);
            const precoPromocional = safeNumber(produto.promocao ?? produto.promo ?? produto.precoPromocional, 0);
            if (precoPromocional > 0 && precoPromocional < precoBase) {
                return true;
            }

            const precoAtual = precoBase;
            const precoAnterior = safeNumber(produto.oldPrice ?? produto.precoAntigo ?? produto.precoOriginal);

            return (precoAnterior > 0 && precoAtual < precoAnterior);
        },

        /**
         * Formata uma string elegante exibindo o valor poupado em reais (R$)
         */
        formatarEconomia: function (precoAtual, precoAnterior) {
            const economia = this.calcularEconomia(precoAtual, precoAnterior);
            return economia > 0 ? `Economize R$ ${economia.toFixed(2).replace('.', ',')}` : null;
        }
    };

    // Imutabilidade de Runtime total sob o escopo PMA V8 para Abella Joias
    Object.defineProperty(window, 'descontoService', {
        value: Object.freeze(descontoService),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] 🏷️ DescontoService v8.2 integrado de forma síncrona com o painel Abella Joias.');

})();
