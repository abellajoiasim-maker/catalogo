/**
 * Abella Joias - PMA V8
 * Path: catalogo/js/services/checkout.js
 * Descrição: Gerenciamento unificado da interface de finalização de compra, cálculos e integrações.
 */

(function (global) {
    'use strict';

    // Configurações Padrão (serão sobrescritas pelo Firebase se disponível)
    const CONFIG = {
        descontoPix: 5,
        parcelasMax: 6,
        freteFixo: 15,
        freteGratisAlvo: 100,
        pedidoMinimo: 300,
        whatsEmpresa: '5519999999999'
    };

    let itensCarrinho = [];
    const db = global.firebase ? global.firebase.database() : null;

    // Cache e Seletores do DOM
    const el = {};
    const DOM = {
        cliNome: '#cli-nome',
        cliWhats: '#cli-whats',
        cliCidade: '#cli-cidade',
        entLocal: '#ent-local',
        entRua: '#ent-rua',
        entNumero: '#ent-numero',
        entBairro: '#ent-bairro',
        entCidade: '#ent-cidade',
        obsPedido: '#obs-pedido',
        listaProdutos: '#lista-itens-checkout',
        resQtd: '#res-qtd',
        resPeso: '#res-peso',
        resSubtotal: '#res-subtotal',
        resDesconto: '#res-desconto',
        boxDesconto: '#box-desconto',
        resFrete: '#res-frete',
        resTotal: '#res-total',
        modalRomaneio: '#modal-romaneio',
        conteudoRomaneio: '#conteudo-romaneio',
        logoImg: '#abellaLogoImg',
        logoFallback: '#abellaLogoFallback'
    };

    // ==========================================================
    // Inicialização do Módulo
    // ==========================================================
    async function iniciar() {
        console.info('[checkout] Inicializando serviço premium em catalogo/js/services/...');
        
        // Mapeia elementos do DOM
        for (const [chave, seletor] of Object.entries(DOM)) {
            el[chave] = document.querySelector(seletor);
        }

        // Obtém itens do carrinho através dos serviços disponíveis
        itensCarrinho = obterItensDoServico();

        if (!itensCarrinho.length) {
            alert('Seu carrinho está vazio.');
            window.location.href = 'index.html';
            return;
        }

        await carregarConfiguracoesFirebase();
        renderizarItensCheckout();
        atualizarResumoFinanceiro();
    }

    function obterItensDoServico() {
        if (typeof global.carrinhoService !== 'undefined' && global.carrinhoService.obterItens) {
            return global.carrinhoService.obterItens() || [];
        }
        if (global.CarrinhoService && typeof global.CarrinhoService.getItens === 'function') {
            return global.CarrinhoService.getItens() || [];
        }
        return [];
    }

    // ==========================================================
    // Conexão e Configurações API/Firebase
    // ==========================================================
    async function carregarConfiguracoesFirebase() {
        if (!db) return;
        try {
            let pathSettings = 'settings';
            if (typeof global.getAbellaPath === 'function') pathSettings = global.getAbellaPath('settings');
            else if (typeof global.getStoragePath === 'function') pathSettings = global.getStoragePath('settings');

            const snap = await db.ref(pathSettings).once('value');
            let logoPath = '';

            if (snap.exists()) {
                const s = snap.val() || {};
                CONFIG.descontoPix = parseFloat(s.pix ?? s.pixDesc ?? s.descontoPix ?? 5);
                CONFIG.parcelasMax = parseInt(s.parcelas ?? s.parcelasMax ?? 6);
                CONFIG.freteFixo = parseFloat(s.freteFixo ?? 15);
                CONFIG.freteGratisAlvo = parseFloat(s.freteGratisAlvo ?? 100);
                CONFIG.pedidoMinimo = parseFloat(s.pedidoMinimo ?? 300);
                CONFIG.whatsEmpresa = (s.whatsEmpresa || '5519999999999').replace(/\D/g,'');
                logoPath = s.logo || s.logoUrl || '';
            }

            if (!logoPath && typeof global.obterLogo === 'function') logoPath = global.obterLogo();
            processarLogoInterface(logoPath);

        } catch (e) {
            console.warn('[checkout] Erro ao carregar configurações remotas:', e);
        }
    }

    function processarLogoInterface(logoPath) {
        if (!el.logoImg) return;
        let urlFinal = logoPath ? logoPath.trim() : "https://firebasestorage.googleapis.com/v0/b/catalogo-abella-joias.firebasestorage.app/o/images%2Flogo%2Flogo.png?alt=media";
        
        if (urlFinal.startsWith('gs://')) {
            if (global.ImageHelper && typeof global.ImageHelper.converterGsUrl === 'function') {
                urlFinal = global.ImageHelper.converterGsUrl(urlFinal);
            } else {
                const semGs = urlFinal.replace('gs://', '');
                const primeiraBarra = semGs.indexOf('/');
                if (primeiraBarra !== -1) {
                    const bucket = semGs.substring(0, primeiraBarra);
                    const caminho = semGs.substring(primeiraBarra + 1);
                    urlFinal = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;
                }
            }
        }
        
        el.logoImg.src = urlFinal;
        el.logoImg.onload = () => {
            el.logoImg.classList.remove('hidden');
            if (el.logoFallback) el.logoFallback.classList.add('hidden');
        };
    }

    // ==========================================================
    // Cálculos Financeiros Precisos
    // ==========================================================
    function calcularTotais() {
        let qtd = 0, peso = 0, subtotal = 0;

        itensCarrinho.forEach(item => {
            const quantidade = parseInt(item.quantidade, 10) || 1;
            const preco = parseFloat(item.precoFinal ?? item.price ?? item.preco ?? item.precoUnitario ?? 0);
            const pesoItem = parseFloat(item.peso || item.pesoUnitario || 0);

            qtd += quantidade;
            peso += pesoItem * quantidade;
            subtotal += preco * quantidade;
        });

        const inputPagamento = document.querySelector('input[name="formaPagamento"]:checked');
        const pagamento = inputPagamento ? inputPagamento.value : 'PIX';
        
        const desconto = (pagamento === 'PIX') ? (subtotal * ((CONFIG.descontoPix || 0) / 100)) : 0;
        const frete = (subtotal > 0 && subtotal < (CONFIG.freteGratisAlvo || 100)) ? parseFloat(CONFIG.freteFixo || 0) : 0;
        const total = subtotal - desconto + frete;

        return { qtd, peso, subtotal, desconto, frete, total, pagamento };
    }

    function atualizarResumoFinanceiro() {
        try {
            const t = calcularTotais();
            
            if (el.resQtd) el.resQtd.innerText = `${t.qtd} pçs`;
            if (el.resSubtotal) el.resSubtotal.innerText = formatarMoedaSeguro(t.subtotal);
            if (el.resTotal) el.resTotal.innerText = formatarMoedaSeguro(t.total);
            
            if (el.resPeso) {
                const pesoFormatado = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(t.peso);
                el.resPeso.innerText = `${pesoFormatado} grs.`;
            }

            if (el.resDesconto && el.boxDesconto) {
                el.resDesconto.innerText = `- ${formatarMoedaSeguro(t.desconto)}`;
                if (t.desconto > 0) {
                    el.boxDesconto.classList.replace('hidden', 'flex');
                } else {
                    el.boxDesconto.classList.replace('flex', 'hidden');
                }
            }

            if (el.resFrete) {
                el.resFrete.innerText = t.frete > 0 ? formatarMoedaSeguro(t.frete) : 'Grátis (Limeira)';
            }
        } catch (error) {
            console.error('[checkout] Erro ao processar atualização financeira:', error);
        }
    }

    // ==========================================================
    // Renderização de Elementos UI
    // ==========================================================
    function renderizarItensCheckout() {
        if (!el.listaProdutos) return;
        el.listaProdutos.innerHTML = '';

        itensCarrinho.forEach(item => {
            const qtd = parseInt(item.quantidade, 10) || 1;
            const preco = parseFloat(item.precoFinal ?? item.price ?? item.preco ?? item.precoUnitario ?? 0);
            const total = preco * qtd;
            const imagem = obterImagemProdutoSegura(item);
            const nomeLimpo = textClean(item.name || item.titulo || item.nome || 'Produto');
            const vNome = textClean(item.variacaoSelecionada || '');
            const exibirVariacao = vNome ? `<span class="block text-[10px] text-[#caa85c] font-bold mt-0.5 uppercase tracking-wide">Variação: ${vNome}</span>` : '';

            el.listaProdutos.innerHTML += `
                <div class="flex items-center gap-4 border border-white/5 rounded-2xl p-3 bg-zinc-900/40">
                    <img src="${imagem}" class="w-16 h-16 rounded-xl object-cover bg-black border border-zinc-800 shrink-0" alt="${nomeLimpo}">
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-sm truncate text-white uppercase tracking-wide">${nomeLimpo}</h3>
                        ${exibirVariacao}
                        <p class="text-zinc-500 text-xs mt-0.5">${qtd}x • ${formatarMoedaSeguro(preco)}</p>
                    </div>
                    <span class="font-black text-sm text-[#caa85c] shrink-0">${formatarMoedaSeguro(total)}</span>
                </div>
            `;
        });
    }

    // ==========================================================
    // Funções de Fluxo e Emissão (Romaneio, PDF, Impressão e WhatsApp)
    // ==========================================================
    function visualizarRomaneio() {
        const t = calcularTotais();
        const cliente = textClean(el.cliNome?.value || 'Não informado');
        const whats = textClean(el.cliWhats?.value || 'Não informado');
        const cidade = textClean(el.cliCidade?.value || 'Não informado');
        const obs = textClean(el.obsPedido?.value || 'Sem observações');

        let html = `
            <div style="text-align:center; margin-bottom:20px; font-family:sans-serif;">
                <h2 style="color:#caa85c; margin:0; font-size:24px; letter-spacing:2px;">ABELLA JOIAS</h2>
                <p style="margin:5px 0; color:#a1a1aa; font-size:12px;">ROMANEIO PREMIUM</p>
                <p style="margin:5px 0; color:#71717a; font-size:11px;">${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <div style="margin-bottom:20px; border:1px solid #27272a; padding:15px; border-radius:12px; background:#09090b;">
                <div style="margin-bottom:4px;"><b>CLIENTE:</b> ${cliente}</div>
                <div style="margin-bottom:4px;"><b>WHATSAPP:</b> ${whats}</div>
                <div style="margin-bottom:4px;"><b>CIDADE:</b> ${cidade}</div>
                <div><b>PAGAMENTO:</b> ${t.pagamento}</div>
            </div>
            <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
                <thead>
                    <tr style="border-bottom: 1px solid #27272a; text-align:left; color:#caa85c;">
                        <th style="padding:8px 0; width:80px;">REF</th>
                        <th style="padding:8px 0;">PRODUTO</th>
                        <th style="padding:8px 0; text-align:center; width:50px;">QTD</th>
                        <th style="padding:8px 0; text-align:right; width:80px;">VALOR UNIT.</th>
                        <th style="padding:8px 0; text-align:right; width:90px;">PESO UNIT.</th>
                        <th style="padding:8px 0; text-align:right; width:90px;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
        `;

        itensCarrinho.forEach(item => {
            const ref = textClean(item.id || item.codigo || item.sku || '-');
            const qtd = parseInt(item.quantidade, 10) || 1;
            const preco = parseFloat(item.precoFinal ?? item.price ?? item.preco ?? item.precoUnitario ?? 0);
            const pesoUn = parseFloat(item.peso || item.pesoUnitario || 0);
            const vNome = item.variacaoSelecionada ? ` (Tam: ${textClean(item.variacaoSelecionada)})` : '';
            const nomeStr = textClean(item.name || item.titulo || item.nome || 'Produto');
            const pesoFormatado = formatarPesoSeguro(pesoUn).replace(/g/g, '').trim();
            
            html += `
                <tr style="border-bottom:1px solid #18181b;">
                    <td style="padding:8px 0; color:#a1a1aa; font-family:monospace;">${ref}</td>
                    <td style="padding:8px 0; color:#e4e4e7;">${nomeStr}${vNome}</td>
                    <td style="padding:8px 0; text-align:center; color:#e4e4e7;">${qtd}</td>
                    <td style="padding:8px 0; text-align:right; color:#e4e4e7;">${formatarMoedaSeguro(preco)}</td>
                    <td style="padding:8px 0; text-align:right; color:#e4e4e7;">${pesoFormatado} grs.</td>
                    <td style="padding:8px 0; text-align:right; color:#caa85c; font-weight:bold;">${formatarMoedaSeguro(preco * qtd)}</td>
                </tr>
            `;
        });

        const pesoTotalLimpo = formatarPesoSeguro(t.peso).replace(/g/g, '').trim();

        html += `
                </tbody>
            </table>
            <div style="border-top:1px dashed #27272a; padding-top:15px; text-align:right; font-size:13px; line-height:1.6;">
                <div style="margin-bottom: 4px;"><span style="color:#a1a1aa">Peso Total do Pedido:</span> <b style="color:#fff;">${pesoTotalLimpo} grs.</b></div>
                <div><span style="color:#71717a">Bruto Sem Banho:</span> <b>${formatarMoedaSeguro(t.subtotal)}</b></div>
                ${t.desconto > 0 ? `<div><span style="color:#34d399">Desconto PIX (${CONFIG.descontoPix}%):</span> <b style="color:#34d399">-${formatarMoedaSeguro(t.desconto)}</b></div>` : ''}
                ${t.frete > 0 ? `<div><span style="color:#71717a">Frete:</span> <b>${formatarMoedaSeguro(t.frete)}</b></div>` : '<div><span style="color:#34d399">Frete para Galvânicas Limeira:</span> <b>Grátis</b></div>'}
                <div style="font-size:18px; margin-top:10px; color:#fff;"><span style="color:#caa85c">VALOR FINAL:</span> <b style="color:#caa85c">${formatarMoedaSeguro(t.total)}</b></div>
            </div>
            <div style="margin-top:20px; font-size:11px; color:#71717a; border-top:1px solid #18181b; padding-top:10px;">
                <b>Obs:</b> ${obs}
            </div>
        `;

        if (el.conteudoRomaneio) el.conteudoRomaneio.innerHTML = html;
        if (el.modalRomaneio) el.modalRomaneio.classList.remove('hidden');
    }

    function fecharModal() {
        if (el.modalRomaneio) el.modalRomaneio.classList.add('hidden');
    }

    function gerarPDF(autoPrint = false) {
        try {
            const { jsPDF } = global.jspdf;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            
            const t = calcularTotais();
            const cliente = el.cliNome?.value || 'Não informado';
            const whats = el.cliWhats?.value || 'Não informado';
            const city = el.cliCidade?.value || 'Não informado';
            const obs = el.obsPedido?.value || 'Sem observações';

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(186, 154, 91);
            doc.text('ABELLA JOIAS', 105, 20, { align: 'center' });
            
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('ROMANEIO DE PEDIDO PREMIUM', 105, 26, { align: 'center' });
            doc.text(new Date().toLocaleString('pt-BR'), 105, 31, { align: 'center' });

            doc.setDrawColor(220, 220, 220);
            doc.setFillColor(248, 248, 248);
            doc.roundedRect(14, 38, 182, 28, 3, 3, 'FD');
            
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            doc.text('DADOS DO CLIENTE & ENTREGA', 18, 44);
            
            doc.setFont('Helvetica', 'normal');
            doc.text(`Cliente: ${cliente}`, 18, 51);
            doc.text(`WhatsApp: ${whats}`, 18, 56);
            doc.text(`Cidade: ${city}`, 18, 61);
            doc.text(`Pagamento: ${t.pagamento}`, 120, 51);
            doc.text(`Total Peças: ${t.qtd} pçs`, 120, 56);
            doc.text(`Peso Total: ${formatarPesoSeguro(t.peso).replace(/g/g, '').trim()} grs.`, 120, 61);

            let y = 74;
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.setFillColor(240, 240, 240);
            doc.rect(14, y, 182, 7, 'F');
            doc.setTextColor(50, 50, 50);
            
            doc.text('REF', 16, y + 5);
            doc.text('PRODUTO', 45, y + 5);
            doc.text('QTD', 115, y + 5, { align: 'center' });
            doc.text('VALOR UN.', 140, y + 5, { align: 'right' });
            doc.text('TOTAL', 190, y + 5, { align: 'right' });

            y += 7;
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            itensCarrinho.forEach(item => {
                if (y > 260) { doc.addPage(); y = 20; }
                
                const ref = item.id || item.codigo || item.sku || '-';
                const vNome = item.variacaoSelecionada ? ` (${item.variacaoSelecionada})` : '';
                const nome = (item.name || item.titulo || item.nome || 'Produto') + vNome;
                const qtd = parseInt(item.quantidade, 10) || 1;
                const preco = parseFloat(item.precoFinal ?? item.price ?? item.preco ?? item.precoUnitario ?? 0);

                doc.text(ref, 16, y + 5);
                doc.text(nome.substring(0, 35), 45, y + 5);
                doc.text(String(qtd), 115, y + 5, { align: 'center' });
                doc.text(formatarMoedaSeguro(preco), 140, y + 5, { align: 'right' });
                doc.text(formatarMoedaSeguro(preco * qtd), 190, y + 5, { align: 'right' });
                
                y += 7;
            });

            y += 5;
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setDrawColor(200, 200, 200);
            doc.line(14, y, 196, y);
            
            y += 6;
            doc.text(`Subtotal: ${formatarMoedaSeguro(t.subtotal)}`, 195, y, { align: 'right' });
            if(t.desconto > 0) {
                y += 5;
                doc.text(`Desconto PIX: -${formatarMoedaSeguro(t.desconto)}`, 195, y, { align: 'right' });
            }
            y += 5;
            doc.text(`Frete: ${t.frete > 0 ? formatarMoedaSeguro(t.frete) : 'Grátis'}`, 195, y, { align: 'right' });
            
            y += 8;
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(186, 154, 91);
            doc.text(`VALOR TOTAL: ${formatarMoedaSeguro(t.total)}`, 195, y, { align: 'right' });

            if (autoPrint) {
                doc.autoPrint();
                global.open(doc.output('bloburl'), '_blank');
            } else {
                doc.save(`romaneio_abella_${Date.now()}.pdf`);
            }
        } catch (err) {
            console.error('[checkout] Erro na compilação do PDF:', err);
            alert('Erro na compilação do PDF.');
        }
    }

    async function finalizarPedido() {
        const nome = el.cliNome?.value.trim();
        const whats = el.cliWhats?.value.trim();
        const cidade = el.cliCidade?.value.trim();
        const local = el.entLocal?.value.trim();
        const rua = el.entRua?.value.trim();
        const num = el.entNumero?.value.trim();
        const bairro = el.entBairro?.value.trim();
        const cidadeEnt = el.entCidade?.value.trim();
        const obs = el.obsPedido?.value.trim();

        if (!nome || !whats || !cidade || !local || !rua || !num || !bairro || !cidadeEnt) {
            alert('Por favor, preencha todos os campos obrigatórios (*).');
            return;
        }

        const t = calcularTotais();

        // 1. Envio de dados assíncronos ao Firebase Database
        if (db) {
            try {
                let pathPedidos = 'pedidos';
                if (typeof global.getAbellaPath === 'function') pathPedidos = global.getAbellaPath('pedidos');
                
                const novoPedidoRef = db.ref(pathPedidos).push();
                await novoPedidoRef.set({
                    cliente: { nome, whats, cidade },
                    entrega: { local, rua, numero: num, bairro, city: cidadeEnt },
                    financeiro: {
                        subtotal: t.subtotal,
                        desconto: t.desconto,
                        frete: t.frete,
                        total: t.total,
                        formaPagamento: t.pagamento
                    },
                    itens: itensCarrinho,
                    observacoes: obs,
                    dataCriacao: global.firebase.database.ServerValue.TIMESTAMP
                });
            } catch (errDB) {
                console.error('[checkout] Falha ao registrar pedido no Firebase:', errDB);
            }
        }

        // 2. Construção da mensagem estruturada para o WhatsApp
        let msg = `✨ *NOVO PEDIDO CONFIRMADO - ABELLA JOIAS* ✨\n\n`;
        msg += `👤 *DADOS DO CLIENTE:*\n`;
        msg += `▪️ *Nome:* ${nome}\n`;
        msg += `▪️ *WhatsApp:* ${whats}\n`;
        msg += `▪️ *Cidade:* ${cidade}\n\n`;
        
        msg += `📦 *DADOS DE ENTREGA:*\n`;
        msg += `▪️ *Local:* ${local}\n`;
        msg += `▪️ *Endereço:* ${rua}, Nº ${num}\n`;
        msg += `▪️ *Bairro:* ${bairro} - ${cidadeEnt}\n\n`;

        msg += `📊 *RESUMO FINANCEIRO:*\n`;
        msg += `▪️ *Total de Peças:* ${t.qtd} pçs\n`;
        msg += `▪️ *Peso Total:* ${formatarPesoSeguro(t.peso).replace(/g/g, '').trim()} grs.\n`;
        msg += `▪️ *Subtotal:* ${formatarMoedaSeguro(t.subtotal)}\n`;
        if (t.desconto > 0) msg += `▪️ *Desconto PIX:* -${formatarMoedaSeguro(t.desconto)}\n`;
        msg += `▪️ *Frete:* ${t.frete > 0 ? formatarMoedaSeguro(t.frete) : 'Grátis (Galvânicas Limeira)'}\n`;
        msg += `▪️ *Forma de Pagamento:* ${t.pagamento}\n`;
        msg += `⭐ *TOTAL FINAL:* ${formatarMoedaSeguro(t.total)}\n\n`;

        if (obs) msg += `📝 *Observações:* ${obs}\n\n`;
        msg += `💬 O meu pedido já foi gerado com sucesso! Fico no aguardo do envio do *link de pagamento* e da confirmação do *prazo de entrega*. Obrigado!`;

        const urlWhats = `https://api.whatsapp.com/send?phone=${CONFIG.whatsEmpresa}&text=${encodeURIComponent(msg)}`;
        
        // 3. Limpeza estruturada do carrinho após finalização
        limparCarrinhoServico();
        
        global.open(urlWhats, '_blank');
    }

    function limparCarrinhoServico() {
        if (typeof global.carrinhoService !== 'undefined' && global.carrinhoService.limpar) {
            global.carrinhoService.limpar();
        } else if (global.CarrinhoService && typeof global.CarrinhoService.limpar === 'function') {
            global.CarrinhoService.limpar();
        }
    }

    // ==========================================================
    // Utilitários Internos Auxiliares
    // ==========================================================
    function formatarMoedaSeguro(valor) {
        if (global.MoneyUtils && typeof global.MoneyUtils.format === 'function') return global.MoneyUtils.format(valor);
        if (global.money && typeof global.money.formatar === 'function') return global.money.formatar(valor);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valor) || 0);
    }

    function formatarPesoSeguro(peso) {
        if (typeof global.formatarPeso === 'function') return global.formatarPeso(peso);
        return (parseFloat(peso) || 0).toFixed(2);
    }

    function obterImagemProdutoSegura(item) {
        let url = item.image || item.imagem || item.thumbnail || '';
        if (typeof global.obterImagemProduto === 'function') return global.obterImagemProduto(url);
        if (global.ImageHelper && typeof global.ImageHelper.converterGsUrl === 'function') return global.ImageHelper.converterGsUrl(url);
        if (!url) return 'https://via.placeholder.com/100/111111/caa85c?text=Joia';
        return String(url).trim();
    }

    function textClean(text) {
        return String(text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Bind seguro de listeners do ciclo de vida global
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    // Exportação de gatilhos para chamadas inline no HTML (onclick/onchange)
    global.visualizarRomaneio = visualizarRomaneio;
    global.fecharModal = fecharModal;
    global.gerarPDF = gerarPDF;
    global.finalizarPedido = finalizarPedido;
    global.atualizarResumo = atualizarResumoFinanceiro;

})(window);
