/**
 * PMA V8 - Checkout & Romaneio Service
 * Abella Joias — Alinhado ao carrinhoService e produtoService
 */
(() => {
    'use strict';

    // =====================================================
    // 1. CONFIGURAÇÕES E ESTADO
    // =====================================================
    const CONFIG = {
        CHAVE_CARRINHO:    'pma_v8_carrinho_itens',
        WHATSAPP_FALLBACK: '5519999999999'
    };

    const FALLBACK_IMG = 'https://firebasestorage.googleapis.com/v0/b/catalogo-abella-joias.firebasestorage.app/o/images%2Flogo%2FInCollage_20250630_100544920-01.jpeg?alt=media';

    // Cache de configurações do Firebase
    let _configCache = null;

    function _obterCaminhoDB(node) {
        if (typeof window.getAbellaPath === 'function') return window.getAbellaPath(node);
        return node ? `abella/${node}` : 'abella';
    }

    function _db() {
        return window.db || (typeof firebase !== 'undefined' ? firebase.database() : null);
    }

    // =====================================================
    // 2. UTILITÁRIOS
    // =====================================================
    function _fmtMoeda(valor) {
        const v = parseFloat(valor) || 0;
        if (typeof money !== 'undefined' && typeof money.formatar === 'function') return money.formatar(v);
        if (typeof formatarMoeda === 'function') return formatarMoeda(v);
        return 'R$ ' + v.toFixed(2).replace('.', ',');
    }

    function _fmtPeso(gramas) {
        const g = parseFloat(gramas) || 0;
        if (typeof PesoUtils !== 'undefined' && typeof PesoUtils.formatarPeso === 'function') return PesoUtils.formatarPeso(g);
        if (typeof formatarPeso === 'function') return formatarPeso(g);
        if (g >= 1000) return (g / 1000).toFixed(2).replace('.', ',') + ' Kg.';
        return g.toFixed(2).replace('.', ',') + ' grs.';
    }

    // Arredonda para 2 casas decimais evitando ruído de ponto flutuante
    // (ex.: 179.67 * 0.05 pode virar 8.983500000000001 em JS). Sem isso o
    // valor "sujo" é gravado no Firebase e aparece assim em qualquer tela
    // que releia o pedido (ex.: campo Desconto em pedidos.html).
    function _round2(valor) {
        return Math.round((Number(valor) || 0) * 100) / 100;
    }

    function _resolverImagem(url) {
        if (!url) return FALLBACK_IMG;
        const s = String(url).trim();
        if (s.startsWith('http://') || s.startsWith('https://')) return s;
        if (s.startsWith('gs://')) {
            const sem = s.replace('gs://', '');
            const idx = sem.indexOf('/');
            if (idx === -1) return FALLBACK_IMG;
            return `https://firebasestorage.googleapis.com/v0/b/${sem.substring(0, idx)}/o/${encodeURIComponent(sem.substring(idx + 1))}?alt=media`;
        }
        if (typeof resolverImagemFirebase === 'function') return resolverImagemFirebase(s);
        return s || FALLBACK_IMG;
    }

    // =====================================================
    // 3. LEITURA DO CARRINHO
    //    Lê os campos exatos que o carrinhoService.adicionar salva:
    //    id, name, preco, image, peso, quantidade, variacao
    // =====================================================
    function _recuperarItens() {
        try {
            const raw = localStorage.getItem(CONFIG.CHAVE_CARRINHO);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('[checkout.js] Erro ao ler carrinho:', e);
            return [];
        }
    }

    function _limparCarrinho() {
        localStorage.removeItem(CONFIG.CHAVE_CARRINHO);
    }

    // Normaliza um item do carrinho para os campos que o checkout usa
    function _normalizarItem(item) {
        const qtd    = parseInt(item.quantidade || item.qtd || 0);
        const preco  = parseFloat(item.preco || item.price || item.precoVendaUnitario || 0);
        const peso   = parseFloat(item.peso || item.pesoUnitario || 0);
        return {
            id:        item.id     || item.codigo || item.sku || '',
            nome:      item.name   || item.nome   || 'Produto',
            sku:       item.sku    || item.codigo || item.id  || '',
            imagem:    item.image  || item.imagem || '',
            preco,
            peso,
            quantidade: qtd,
            subtotal:   preco * qtd,
            pesoTotal:  peso  * qtd,
            variacao:   item.variacao || item.combinacao || ''
        };
    }

    // =====================================================
    // 4. CARREGAR CONFIGURAÇÕES DO FIREBASE
    // =====================================================
    async function _carregarConfig() {
        if (_configCache) return _configCache;
        try {
            const db = _db();
            if (!db) return {};
            const snap = await db.ref(_obterCaminhoDB('settings')).once('value');
            _configCache = snap.exists() ? snap.val() : {};
            return _configCache;
        } catch (e) {
            console.warn('[checkout.js] Falha ao carregar settings:', e);
            return {};
        }
    }

    async function _aplicarConfigHeader(cfg) {
        // Nome e slogan
        if (cfg.name   && document.getElementById('nomeLojaHeader'))   document.getElementById('nomeLojaHeader').innerText   = cfg.name;
        if (cfg.slogan && document.getElementById('sloganHeader'))     document.getElementById('sloganHeader').innerText     = cfg.slogan;

        // Banner
        const banner = document.getElementById('banner');
        if (banner && cfg.bannerAtivo && cfg.bannerTexto) {
            const bt = document.getElementById('bannerTexto');
            if (bt) bt.innerText = cfg.bannerTexto;
            banner.classList.remove('hidden');
        }

        // Labels de pagamento
        const pix = parseFloat(cfg.discountPix || cfg.descontoPix || cfg.pix || 5);
        const parc = cfg.maxInstallments || cfg.parcelas || 6;
        const lblPix = document.getElementById('labelDescontoPix');
        const lblParc = document.getElementById('labelParcelasCartao');
        if (lblPix)  lblPix.innerText  = `${pix}% de desconto`;
        if (lblParc) lblParc.innerText = `Em até ${parc}x`;

        // Logo
        const logoImg  = document.getElementById('abellaLogoImg');
        const fallback = document.getElementById('abellaLogoFallback');
        let logoFinal  = (cfg.logoUrl || cfg.logo || '').trim() || FALLBACK_IMG;
        if (logoImg) {
            logoImg.src    = _resolverImagem(logoFinal);
            logoImg.onload = () => { logoImg.classList.remove('hidden'); if (fallback) fallback.classList.add('hidden'); };
            logoImg.onerror = () => { logoImg.src = FALLBACK_IMG; };
        }
    }

    // =====================================================
    // 5. RESUMO DO CHECKOUT (lista + totais)
    // =====================================================
    async function atualizarResumo() {
        const cfg = await _carregarConfig();
        const descontoPix = parseFloat(cfg.discountPix || cfg.descontoPix || cfg.pix || 5);
        const freteFixo   = parseFloat(cfg.freteFixo || cfg.frete || 0);
        const freteGratis = parseFloat(cfg.freteGratisAlvo || cfg.freteGratis || 100);

        const itensRaw = _recuperarItens();
        const itens    = itensRaw.map(_normalizarItem);

        // ── Lista de itens ──
        const listaContainer = document.getElementById('lista-itens-checkout');
        if (listaContainer) {
            listaContainer.innerHTML = '';
            if (itens.length === 0) {
                listaContainer.innerHTML = `<p class="text-zinc-500 text-xs text-center py-4">Nenhum item no carrinho.</p>`;
            } else {
                itens.forEach(item => {
                    const variacaoHtml = item.variacao
                        ? `<p class="text-[10px] text-[#caa85c] mt-0.5 font-semibold truncate">🔹 ${item.variacao}</p>`
                        : '';
                    listaContainer.innerHTML += `
                        <div class="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
                            <img src="${_resolverImagem(item.imagem)}"
                                 class="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                                 onerror="this.src='${FALLBACK_IMG}'">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-xs font-bold text-zinc-200 truncate">${item.nome}</h4>
                                ${variacaoHtml}
                                <p class="text-[10px] text-zinc-500 mt-0.5">${item.quantidade} pçs • ${_fmtPeso(item.pesoTotal)}</p>
                            </div>
                            <div class="text-right shrink-0">
                                <span class="text-xs font-black text-[#caa85c]">${_fmtMoeda(item.subtotal)}</span>
                            </div>
                        </div>`;
                });
            }
        }

        // ── Totais ──
        const qtdTotal    = itens.reduce((a, i) => a + i.quantidade, 0);
        const pesoTotal   = itens.reduce((a, i) => a + i.pesoTotal,  0);
        const subtotal    = _round2(itens.reduce((a, i) => a + i.subtotal,   0));

        const formaPag = document.querySelector('input[name="formaPagamento"]:checked')?.value || 'PIX';
        const desconto = _round2(formaPag === 'PIX' ? subtotal * (descontoPix / 100) : 0);

        const frete = _round2(subtotal >= freteGratis ? 0 : freteFixo);
        const total = _round2(subtotal - desconto + frete);

        // Box desconto PIX
        const boxDesc = document.getElementById('box-desconto');
        if (boxDesc) boxDesc.classList.toggle('hidden', desconto === 0);

        // Label desconto dinâmico
        const lblPixEl = document.getElementById('labelDescontoPix');
        if (lblPixEl) lblPixEl.innerText = `${descontoPix}% de desconto`;

        _setEl('res-qtd',      `${qtdTotal} pçs`);
        _setEl('res-peso',     _fmtPeso(pesoTotal));
        _setEl('res-subtotal', _fmtMoeda(subtotal));
        _setEl('res-desconto', `- ${_fmtMoeda(desconto)}`);
        _setEl('res-frete',    frete === 0 ? 'Grátis' : _fmtMoeda(frete));
        _setEl('res-total',    _fmtMoeda(total));
    }

    function _setEl(id, val) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }

    // =====================================================
    // 6. ROMANEIO
    // =====================================================
    function visualizarRomaneio() {
        const itens = _recuperarItens().map(_normalizarItem);
        if (!itens.length) { alert('Nenhum item no carrinho para gerar romaneio.'); return; }

        const modal    = document.getElementById('modal-romaneio');
        const conteudo = document.getElementById('conteudo-romaneio');
        if (!modal || !conteudo) return;

        const agora = new Date();
        const data  = agora.toLocaleDateString('pt-BR');
        const hora  = agora.toLocaleTimeString('pt-BR');

        const subtotal = itens.reduce((a, i) => a + i.subtotal, 0);
        const pesoTotal = itens.reduce((a, i) => a + i.pesoTotal, 0);
        const qtdTotal  = itens.reduce((a, i) => a + i.quantidade, 0);

        let html = `
            <div class="space-y-1 border-b border-white/10 pb-4 mb-4">
                <p class="font-bold text-[#caa85c] text-base tracking-widest uppercase">Romaneio de Pedido</p>
                <p class="text-zinc-400 text-xs">Data: ${data} às ${hora}</p>
            </div>`;

        itens.forEach((item, idx) => {
            const variacaoStr = item.variacao ? ` — ${item.variacao}` : '';
            html += `
                <div class="flex justify-between py-2 border-b border-white/5 text-xs gap-4">
                    <span class="text-zinc-300 flex-1 min-w-0 truncate">
                        ${String(idx + 1).padStart(2, '0')}. ${item.nome}${variacaoStr}
                        <span class="text-zinc-500 ml-1">(x${item.quantidade})</span>
                    </span>
                    <span class="text-[#caa85c] font-bold shrink-0">${_fmtMoeda(item.subtotal)}</span>
                </div>`;
        });

        html += `
            <div class="mt-4 pt-4 border-t border-white/10 space-y-1 text-xs">
                <div class="flex justify-between"><span class="text-zinc-500">Total de Peças:</span><span class="font-bold">${qtdTotal} pçs</span></div>
                <div class="flex justify-between"><span class="text-zinc-500">Peso Total:</span><span class="font-bold">${_fmtPeso(pesoTotal)}</span></div>
                <div class="flex justify-between text-base mt-2"><span class="font-black text-white">Subtotal:</span><span class="font-black text-[#caa85c]">${_fmtMoeda(subtotal)}</span></div>
            </div>`;

        conteudo.innerHTML = html;
        modal.classList.remove('hidden');
    }

    function fecharModal() {
        const modal = document.getElementById('modal-romaneio');
        if (modal) modal.classList.add('hidden');
    }

    // =====================================================
    // 7. PDF / IMPRESSÃO
    // =====================================================
    function gerarPDF(imprimir = false) {
        const itens = _recuperarItens().map(_normalizarItem);
        if (!itens.length) { alert('O carrinho está vazio. Não é possível gerar o documento.'); return; }
        window.print();
    }

    // =====================================================
    // 8. FINALIZAR PEDIDO
    // =====================================================
    async function finalizarPedido(event) {
        if (event) event.preventDefault();

        const itens = _recuperarItens().map(_normalizarItem);
        if (!itens.length) { alert('Seu carrinho está vazio!'); return; }

        const nome     = document.getElementById('cli-nome')?.value.trim();
        const whats    = document.getElementById('cli-whats')?.value.trim();
        const cidadeCli = document.getElementById('cli-cidade')?.value.trim();
        const localEnt  = document.getElementById('ent-local')?.value.trim();
        const ruaEnt    = document.getElementById('ent-rua')?.value.trim();
        const numEnt    = document.getElementById('ent-numero')?.value.trim();
        const bairroEnt = document.getElementById('ent-bairro')?.value.trim();
        const cidadeEnt = document.getElementById('ent-cidade')?.value.trim();
        const formaPag  = document.querySelector('input[name="formaPagamento"]:checked')?.value || 'PIX';
        const obs       = document.getElementById('obs-pedido')?.value.trim() || 'Nenhuma';

        if (!nome || !whats || !cidadeCli || !localEnt || !ruaEnt || !numEnt || !bairroEnt || !cidadeEnt) {
            alert('Por favor, preencha todos os campos obrigatórios (*).');
            return;
        }

        const btnFinalizar = document.querySelector('button[onclick="finalizarPedido()"]');
        if (btnFinalizar) { btnFinalizar.disabled = true; btnFinalizar.innerText = '⏳ Processando...'; }

        try {
            const cfg = await _carregarConfig();
            const descontoPix  = parseFloat(cfg.discountPix || cfg.descontoPix || cfg.pix || 5);
            const freteFixo    = parseFloat(cfg.freteFixo || cfg.frete || 0);
            const freteGratis  = parseFloat(cfg.freteGratisAlvo || cfg.freteGratis || 100);
            const whatsDestino = cfg.whatsapp || CONFIG.WHATSAPP_FALLBACK;
            const nomeLoja     = cfg.name || 'Abella Joias';

            const subtotal  = _round2(itens.reduce((a, i) => a + i.subtotal,  0));
            const pesoTotal = itens.reduce((a, i) => a + i.pesoTotal, 0);
            const qtdTotal  = itens.reduce((a, i) => a + i.quantidade, 0);
            const desconto  = _round2(formaPag === 'PIX' ? subtotal * (descontoPix / 100) : 0);
            const frete     = _round2(subtotal >= freteGratis ? 0 : freteFixo);
            const total     = _round2(subtotal - desconto + frete);

            const pedidoId = 'PED-' + Date.now();

            // Salvar no Firebase
            const db = _db();
            if (db) {
               const dadosPedido = {
    // ── Campos de identificação ──────────────────────────
    id:        pedidoId,
    idPedido:  pedidoId,

    // ── Cliente — objeto aninhado E campos planos ────────
    cliente:      nome,           // pedidos.html lê p.cliente como string
    nome:         nome,
    whats:        whats,          // pedidos.html lê p.whats
    whatsapp:     whats,
    contato:      whats,
    cidade:       cidadeCli,      // pedidos.html lê p.cidade
    cidadeCliente: cidadeCli,

    // ── Entrega — string plana E objeto aninhado ─────────
    entrega: `${localEnt} — ${ruaEnt}, ${numEnt}, ${bairroEnt}, ${cidadeEnt}`,
    enderecoEntrega: {
        local:   localEnt,
        rua:     ruaEnt,
        numero:  numEnt,
        bairro:  bairroEnt,
        cidade:  cidadeEnt
    },

    // ── Pagamento ────────────────────────────────────────
    pagamento:      formaPag,
    formaPagamento: formaPag,     // pedidos.html lê p.formaPagamento

    // ── Financeiro ───────────────────────────────────────
    subtotal,
    desconto,
    frete,
    total,
    valorTotal: total,            // pedidos.html lê p.valorTotal como fallback
    pesoTotal,
    totalPecas: qtdTotal,
    qtd:        qtdTotal,

    // ── Observações ──────────────────────────────────────
    observacoes: obs,

    // ── Itens ────────────────────────────────────────────
    itens: itens.map(i => ({
        id:         i.id,
        sku:        i.sku,
        nome:       i.nome,
        name:       i.nome,
        variacao:   i.variacao,
        preco:      i.preco,
        price:      i.preco,
        precoFinal: i.preco,
        quantidade: i.quantidade,
        subtotal:   i.subtotal,
        peso:       i.peso,
        pesoTotal:  i.pesoTotal,
        imagem:     i.imagem,
        image:      i.imagem
    })),

    // ── Controle ─────────────────────────────────────────
    status:      'Novo',
    dataCriacao: new Date().toISOString(),
    data:        new Date().toLocaleDateString('pt-BR')
};
                await db.ref(_obterCaminhoDB(`orders/${pedidoId}`)).set(dadosPedido);
            }

            // Mensagem WhatsApp resumida. O pedido completo, incluindo itens e variações,
            // continua salvo no Firebase e disponível no painel/romaneio.
            const Q = '\n';
            let msg = `*Novo pedido — ${nomeLoja}*${Q}${Q}`;
            msg += `*Nome:* ${nome}${Q}`;
            msg += `*Telefone:* ${whats}${Q}`;
            msg += `*Cidade:* ${cidadeCli}${Q}`;
            msg += `*Valor da compra:* ${_fmtMoeda(total)}${Q}`;
            msg += `*Forma de pagamento:* ${formaPag}`;

            const urlWhats = `https://api.whatsapp.com/send?phone=${whatsDestino}&text=${encodeURIComponent(msg)}`;

            _limparCarrinho();
            window.open(urlWhats, '_blank');
            window.location.href = 'index.html';

        } catch (err) {
            console.error('[checkout.js] Erro ao finalizar pedido:', err);
            alert('Erro técnico ao processar o pedido. Tente novamente.');
            if (btnFinalizar) { btnFinalizar.disabled = false; btnFinalizar.innerText = '🚀 Finalizar Pedido via WhatsApp'; }
        }
    }

    // =====================================================
    // 9. INICIALIZAÇÃO
    // =====================================================
    async function _init() {
        const cfg = await _carregarConfig();
        await _aplicarConfigHeader(cfg);
        await atualizarResumo();
    }

    // =====================================================
    // 10. EXPOSIÇÃO GLOBAL
    // =====================================================
    window.atualizarResumo    = atualizarResumo;
    window.finalizarPedido    = finalizarPedido;
    window.gerarPDF           = gerarPDF;
    window.visualizarRomaneio = visualizarRomaneio;
    window.fecharModal        = fecharModal;

    window.checkoutService = Object.freeze({
        atualizarResumo, finalizarPedido, gerarPDF, visualizarRomaneio, fecharModal
    });

    document.addEventListener('DOMContentLoaded', _init);

})();
