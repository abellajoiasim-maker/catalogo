/**
 * Abella Joias - PMA V8
 * Module: checkout
 * Descrição: Gerenciamento da interface de finalização de compra, cálculos e integração.
 */

(function (carrinho, desconto) {
    'use strict';

    // ==========================================================
    // Configurações e Seletores do DOM
    // ==========================================================
    const DOM = {
        listaProdutos: '#checkout-produtos',
        subtotal: '#checkout-subtotal',
        descontoPix: '#checkout-desconto-pix',
        totalFinal: '#checkout-total',
        btnFinalizar: '#btn-finalizar-pedido',
        containerLayout: '#checkout-container'
    };

    // Cache interno de elementos do DOM (otimização de performance)
    const el = {};

    // ==========================================================
    // Inicialização do Módulo
    // ==========================================================
    function iniciar() {
        console.info('[checkout] Inicializando módulo de finalização...');
        
        // Mapeia e valida os elementos da tela
        for (const [chave, seletor] of Object.entries(DOM)) {
            el[chave] = document.querySelector(seletor);
        }

        // Se os elementos essenciais não existirem na página atual, aborta silenciosamente
        if (!el.btnFinalizar) {
            console.warn('[checkout] Elementos essenciais não encontrados. Ignorando inicialização.');
            return;
        }

        configurarEventos();
        renderizarCheckout();
    }

    // ==========================================================
    // Configuração de Eventos / Listeners
    // ==========================================================
    function configurarEventos() {
        el.btnFinalizar.addEventListener('click', function (e) {
            e.preventDefault();
            processarPedido();
        });
    }

    // ==========================================================
    // Renderização e Regras de Interface
    // ==========================================================
    function renderizarCheckout() {
        const itens = carrinho.listar();

        if (itens.length === 0) {
            exibirCarrinhoVazio();
            return;
        }

        // 1. Renderiza a lista de itens no HTML
        let htmlItens = '';
        itens.forEach(item => {
            htmlItens += criarLinhaProdutoHTML(item);
        });
        
        if (el.listaProdutos) {
            el.listaProdutos.innerHTML = htmlItens;
        }

        // 2. Cálculos financeiros precisos usando os serviços do core
        const subtotalValor = carrinho.obterTotal();
        
        // Exemplo: Supondo taxa de 5% fixa para o PIX, ou buscando dinamicamente
        const percentualPix = 5; 
        const resumo = desconto.obterResumoPix(subtotalValor, percentualPix);

        // 3. Atualiza os valores na tela formatados em Moeda BR
        if (el.subtotal) el.subtotal.textContent = formatarMoeda(resumo.subtotal);
        if (el.descontoPix) el.descontoPix.textContent = formatarMoeda(resumo.desconto);
        if (el.totalFinal) el.totalFinal.textContent = formatarMoeda(resumo.totalPix);
    }

    /**
     * Cria o HTML estruturado para cada item do carrinho
     */
    function criarLinhaProdutoHTML(item) {
        const preco = parseFloat(item.preco) || 0;
        const totalItem = preco * (item.quantidade || 1);

        return `
            <div class="flex items-center justify-between border-b py-3 text-sm text-gray-700">
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">${item.nome || 'Produto'}</h4>
                    <p class="text-xs text-gray-500">Qtd: ${item.quantidade}</p>
                </div>
                <div class="text-right font-semibold">
                    ${formatarMoeda(totalItem)}
                </div>
            </div>
        `;
    }

    /**
     * Zera e limpa os campos caso o usuário remova tudo
     */
    function exibirCarrinhoVazio() {
        if (el.listaProdutos) {
            el.listaProdutos.innerHTML = '<p class="text-center py-6 text-gray-500">Seu carrinho está vazio.</p>';
        }
        if (el.subtotal) el.subtotal.textContent = formatarMoeda(0);
        if (el.descontoPix) el.descontoPix.textContent = formatarMoeda(0);
        if (el.totalFinal) el.totalFinal.textContent = formatarMoeda(0);
        if (el.btnFinalizar) el.btnFinalizar.disabled = true;
    }

    // ==========================================================
    // Processamento e Finalização do Pedido
    // ==========================================================
    function processarPedido() {
        console.info('[checkout] Processando finalização do pedido...');
        
        // Exemplo de payload seguro para envio
        const pedido = {
            itens: carrinho.listar(),
            total: carrinho.obterTotal(),
            data: new Date().toISOString()
        };

        // Aqui entra a integração com o Firebase para salvar o pedido
        // Após o sucesso, executa-se o carrinho.limpar()
        
        console.log('[checkout] Pedido estruturado pronto para envio:', pedido);
    }

    // ==========================================================
    // Utilitários Locais de Formatação
    // ==========================================================
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    // Dispara a inicialização de forma segura assim que a árvore DOM estiver pronta
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

})(window.carrinhoService, window.descontoService);
