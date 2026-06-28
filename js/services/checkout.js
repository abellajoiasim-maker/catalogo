/**
 * PMA V8 - Checkout & Romaneio Service (Versão Dinâmica via Firebase Settings)
 * Centraliza as regras de finalização de pedido, integração com Firebase, PDF e WhatsApp.
 */
(() => {
    'use strict';

    // ==========================================
    // 1. CONFIGURAÇÕES E ESTADO LOCAL
    // ==========================================
    const CONFIG = {
        CHAVE_CARRINHO: 'pma_v8_carrinho_itens',
        WHATSAPP_FALLBACK: '5519999999999' // Usado apenas se o Firebase falhar ou estiver vazio
    };

    // Referência ao banco de dados Firebase
    const db = window.db || firebase.database();

    // Função utilitária para obter o caminho respeitando o barramento de múltiplas lojas
    function _obterCaminhoDB(node) {
        if (typeof window.getAbellaPath === 'function') {
            return window.getAbellaPath(node);
        }
        const root = window.ABELLA_DB_ROOT || 'abella';
        return node ? `${root}/${node}` : root;
    }

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

    function _formatarMoeda(valor) {
        return typeof formatarMoeda === 'function' ? formatarMoeda(valor) : `R$ ${valor.toFixed(2).replace('.', ',')}`;
    }

    function _formatarPeso(valor) {
        return typeof formatarPeso === 'function' ? formatarPeso(valor) : `${valor.toFixed(2).replace('.', ',')} grs.`;
    }

    // ==========================================
    // 3. MÉTODOS CORE (LÓGICA DO CHECKOUT)
    // ==========================================

    /**
     * Calcula os totais do carrinho e atualiza os elementos do HTML
     */
    function atualizarResumo() {
        const itens = _recuperarDadosCarrinho();
        
        let qtdTotal = 0;
        let pesoTotal = 0;
        let subtotal = 0;

        const listaContainer = document.getElementById('lista-itens-checkout');
        if (listaContainer) {
            listaContainer.innerHTML = '';
            
            itens.forEach(item => {
                qtdTotal += parseInt(item.quantidade || 0);
                pesoTotal += parseFloat(item.pesoTotal || 0);
                subtotal += parseFloat(item.subtotal || 0);

                listaContainer.innerHTML += `
                    <div class="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                        <img src="${item.imagem || 'img/sem-foto.jpg'}" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10">
                        <div class="flex-1 min-w-0">
                            <h4 class="text-xs font-bold text-zinc-200 truncate">${item.nome || 'Produto'}</h4>
                            <p class="text-[10px] text-zinc-500 mt-0.5">${item.quantidade} pçs • ${_formatarPeso(parseFloat(item.pesoTotal))}</p>
                        </div>
                        <div class="text-right shrink-0">
                            <span class="text-xs font-black text-[#caa85c]">${_formatarMoeda(parseFloat(item.subtotal))}</span>
                        </div>
                    </div>
                `;
            });
        }

        const formaPagamentoInput = document.querySelector('input[name="formaPagamento"]:checked');
        const formaPagamento = formaPagamentoInput ? formaPagamentoInput.value : 'PIX';
        
        let desconto = 0;
        const boxDesconto = document.getElementById('box-desconto');
        
        if (formaPagamento === 'PIX') {
            desconto = subtotal * 0.05; 
            if (boxDesconto) boxDesconto.classList.remove('hidden');
        } else {
            if (boxDesconto) boxDesconto.classList.add('hidden');
        }

        let frete = 0;
        const resFrete = document.getElementById('res-frete');
        if (resFrete) resFrete.innerText = frete === 0 ? "Grátis" : _formatarMoeda(frete);

        const totalGeral = subtotal - desconto + frete;

        if (document.getElementById('res-qtd')) document.getElementById('res-qtd').innerText = `${qtdTotal} pçs`;
        if (document.getElementById('res-peso')) document.getElementById('res-peso').innerText = _formatarPeso(pesoTotal);
        if (document.getElementById('res-subtotal')) document.getElementById('res-subtotal').innerText = _formatarMoeda(subtotal);
        if (document.getElementById('res-desconto')) document.getElementById('res-desconto').innerText = `- ${_formatarMoeda(desconto)}`;
        if (document.getElementById('res-total')) document.getElementById('res-total').innerText = _formatarMoeda(totalGeral);
    }

    /**
     * Gera e aciona a impressão da página preparada para o Romaneio
     */
    function gerarPDF() {
        const itens = _recuperarDadosCarrinho();
        if (itens.length === 0) {
            alert("O carrinho está vazio. Não é possível imprimir.");
            return;
        }
        window.print();
    }

    /**
     * Abre o modal interno injetando a lista de produtos em formato de texto/romaneio
     */
    function visualizarRomaneio() {
        const itens = _recuperarDadosCarrinho();
        if (itens.length === 0) {
            alert("Nenhum item no carrinho para gerar romaneio.");
            return;
        }

        const modal = document.getElementById('modal-romaneio');
        const conteudo = document.getElementById('conteudo-romaneio');
        if (!modal || !conteudo) return;

        let htmlRomaneio = `<div class="space-y-2 border-b border-white/10 pb-4 mb-4">
            <p class="font-bold text-[#caa85c] text-base">ROMANEIO DE PEDIDO</p>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>`;

        itens.forEach((item, index) => {
            htmlRomaneio += `
                <div class="flex justify-between py-1 border-b border-white/5 text-xs">
                    <span>${String(index + 1).padStart(2, '0')}. ${item.nome} (x${item.quantidade})</span>
                    <span class="text-[#caa85c]">${_formatarMoeda(parseFloat(item.subtotal))}</span>
                </div>
            `;
        });

        conteudo.innerHTML = htmlRomaneio;
        modal.classList.remove('hidden');
    }

    function fecharModal() {
        const modal = document.getElementById('modal-romaneio');
        if (modal) modal.classList.add('hidden');
    }

    /**
     * Finaliza o pedido buscando dinamicamente as configurações salvas no painel admin
     */
    async function finalizarPedido(event) {
        if (event) event.preventDefault();
        
        const itens = _recuperarDadosCarrinho();
        if (itens.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        const nome = document.getElementById('cli-nome')?.value.trim();
        const whats = document.getElementById('cli-whats')?.value.trim();
        const cidadeCli = document.getElementById('cli-cidade')?.value.trim();
        
        const localEnt = document.getElementById('ent-local')?.value.trim();
        const ruaEnt = document.getElementById('ent-rua')?.value.trim();
        const numEnt = document.getElementById('ent-numero')?.value.trim();
        const bairroEnt = document.getElementById('ent-bairro')?.value.trim();
        const cidadeEnt = document.getElementById('ent-cidade')?.value.trim();
        
        const formaPagamento = document.querySelector('input[name="formaPagamento"]:checked')?.value || 'PIX';
        const observacoes = document.getElementById('obs-pedido')?.value.trim() || 'Nenhuma';

        if (!nome || !whats || !cidadeCli || !localEnt || !ruaEnt || !numEnt || !bairroEnt || !cidadeEnt) {
            alert("Por favor, preencha todos os campos obrigatórios marcados com *");
            return;
        }

        // Alteração Anti-Looping / Dinâmica: Desativa o botão temporariamente para evitar cliques duplos
        const btnFinalizar = document.querySelector('button[type="submit"]');
        if (btnFinalizar) btnFinalizar.disabled = true;

        try {
            // 1. Puxa dinamicamente as definições comerciais salvas pelo Painel Config
            const configPath = _obterCaminhoDB('settings');
            const configSnap = await db.ref(configPath).once('value');
            
            let whatsappDestino = CONFIG.WHATSAPP_FALLBACK;
            let nomeLoja = "Minha Loja";

            if (configSnap.exists()) {
                const configData = configSnap.val();
                if (configData.whatsapp) whatsappDestino = configData.whatsapp;
                if (configData.name) nomeLoja = configData.name;
            }

            const pedidoId = 'PED-' + Date.now();
            const ramificacaoPedidos = _obterCaminhoDB(`pedidos/${pedidoId}`);
            
            const dadosPedido = {
                id: pedidoId,
                cliente: { nome, whatsapp: whats, cidade: cidadeCli },
                entrega: { local: localEnt, rua: ruaEnt, numero: numEnt, bairro: bairroEnt, cidade: cidadeEnt },
                pagamento: formaPagamento,
                observacoes: observacoes,
                itens: itens,
                dataCriacao: new Date().toISOString()
            };

            // 2. Grava no Firebase
            await db.ref(ramificacaoPedidos).set(dadosPedido);

            // 3. Montagem do texto estruturado para envio do WhatsApp
            let quebra = "\n";
            let msgWhats = `*Novo Pedido - ${nomeLoja}*${quebra}${quebra}`;
            msgWhats += `*ID:* ${pedidoId}${quebra}`;
            msgWhats += `*Cliente:* ${nome}${quebra}`;
            msgWhats += `*WhatsApp:* ${whats}${quebra}${quebra}`;
            msgWhats += `*--- ITENS DO PEDIDO ---*${quebra}`;
            
            itens.forEach(item => {
                msgWhats += `- ${item.quantidade}x ${item.nome} | ${_formatarMoeda(parseFloat(item.subtotal))}${quebra}`;
            });

            msgWhats += `${quebra}*Forma de Pagto:* ${formaPagamento}${quebra}`;
            msgWhats += `*Local de Entrega:* ${localEnt} (${cidadeEnt})${quebra}`;
            msgWhats += `*Obs:* ${observacoes}`;

            let urlWhats = `https://api.whatsapp.com/send?phone=${whatsappDestino}&text=${encodeURIComponent(msgWhats)}`;

            _limparCarrinhoLocal();
            window.open(urlWhats, '_blank');
            window.location.reload();

        } catch (error) {
            console.error("Erro ao salvar ou finalizar o pedido:", error);
            alert("Ocorreu um erro técnico ao processar seu pedido. Tente novamente.");
            if (btnFinalizar) btnFinalizar.disabled = false;
        }
    }

    // ==========================================
    // 4. EXPOSIÇÃO SEGURA PARA O ESCOPO GLOBAL
    // ==========================================
    window.checkoutService = Object.freeze({
        atualizarResumo,
        finalizarPedido,
        gerarPDF,
        visualizarRomaneio,
        fecharModal
    });

    window.atualizarResumo = atualizarResumo;
    window.finalizarPedido = finalizarPedido;
    window.gerarPDF = gerarPDF;
    window.visualizarRomaneio = visualizarRomaneio;
    window.fecharModal = fecharModal;

    document.addEventListener('DOMContentLoaded', () => {
        atualizarResumo();
    });

})();
