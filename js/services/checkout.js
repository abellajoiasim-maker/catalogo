/**
 * PMA V8 - Checkout & Romaneio Service
 * Centraliza as regras de finalização de pedido, integração com Firebase, PDF e WhatsApp.
 */
(() => {
    'use strict';

    // ==========================================
    // 1. CONFIGURAÇÕES E ESTADO LOCAL
    // ==========================================
    const CONFIG = {
        CHAVE_CARRINHO: 'pma_v8_carrinho_itens',
        WHATSAPP_PADRAO: '5519XXXXXXXXX' // Substitua pelo número da loja ou galvânica
    };

    // ==========================================
    // 2. FUNÇÕES AUXILIARES / INTERNAS
    // ==========================================
    function _recuperarDadosCarrinho() {
        try {
            const itens = localStorage.getItem(CONFIG.CHAVE_CARRINHO);
            return itens ? JSON.parse(itens) : [];
        } catch (error) {
            console.error("Erro ao ler dados do carrinho:", error);
            return [];
        }
    }

    function _limparCarrinhoLocal() {
        localStorage.removeItem(CONFIG.CHAVE_CARRINHO);
    }

    // ==========================================
    // 3. MÉTODOS CORE (LÓGICA QUE ESTAVA NO HTML)
    // ==========================================
    
    /**
     * Gera o PDF do Romaneio baseado nos dados atuais do checkout
     */
    function gerarPDF() {
        console.log("Iniciando geração do PDF do Romaneio...");
        const itens = _recuperarDadosCarrinho();
        
        if (itens.length === 0) {
            alert("O carrinho está vazio. Não é possível gerar o PDF.");
            return;
        }

        // TODO: Insira aqui a sua lógica de montagem do PDF/Layout de impressão 
        // (Ajuste do layout de impressão que evita cortes no botão e formata moedas BR)
        
        window.print(); // Executa a impressão do layout preparado
    }

    /**
     * Abre a janela ou modal de visualização prévia do Romaneio impresso
     */
    function visualizarRomaneio() {
        console.log("Abrindo visualização do romaneio...");
        // TODO: Lógica para abrir o modal ou a janela de impressão com os dados injetados
    }

    /**
     * Finaliza o pedido: Salva no Firebase, gera a mensagem e direciona para o WhatsApp
     */
    async function finalizarPedido(event) {
        if (event) event.preventDefault();
        console.log("Processando finalização do pedido...");

        const itens = _recuperarDadosCarrinho();
        if (itens.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        try {
            // 1. Capturar dados do formulário de checkout (Nome, Galvanica, Frete, etc.)
            // 2. Salvar o nó do pedido no Firebase isolado da loja correspondente
            // 3. Construir o texto formatado para o WhatsApp
            
            let textoWhats = encodeURIComponent("Olá! Segue meu pedido gerado pelo catálogo...");
            let urlWhats = `https://api.whatsapp.com/send?phone=${CONFIG.WHATSAPP_PADRAO}&text=${textoWhats}`;

            // Limpa o carrinho após o sucesso total
            _limparCarrinhoLocal();

            // Redireciona para o WhatsApp
            window.open(urlWhats, '_blank');

        } catch (error) {
            console.error("Erro ao salvar ou finalizar o pedido:", error);
            alert("Ocorreu um erro ao processar seu pedido. Tente novamente.");
        }
    }

    // ==========================================
    // 4. EXPOSIÇÃO SEGURA PARA O ESCOPO GLOBAL
    // ==========================================
    // Mapeia as funções no objeto window para que os atributos `onclick` do HTML funcionem perfeitamente.
    window.checkoutService = Object.freeze({
        finalizarPedido,
        gerarPDF,
        visualizarRomaneio
    });

    // Atalhos globais diretos (opcional, para manter compatibilidade com onclick="finalizarPedido()")
    window.finalizarPedido = finalizarPedido;
    window.gerarPDF = gerarPDF;
    window.visualizarRomaneio = visualizarRomaneio;

})();
