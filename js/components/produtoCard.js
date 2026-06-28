// ======================================================================
// js/components/produtoCard.js
// Abella Joias - ProdutoCard v8.0 (Versão Final de Produção)
// Componente de Renderização e Normalização de Vitrine Reativa
// Compatível com GitHub Pages • Integração Nativa com MoneyUtils
// Arquitetura Homologada PMA V8 - Arquivo Completo e Selado
// ======================================================================

(() => {
    'use strict';

    const ProdutoCard = {
        // ==========================================================
        // HELPERS DE SANITIZAÇÃO INTERNOS
        // ==========================================================
        _safeString(value = '') {
            return String(value || '').trim();
        },

        _safeNumber(value = 0) {
            const number = Number(value);
            return Number.isFinite(number) ? number : 0;
        },

        _escapeHTML(text = '') {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        // ==========================================================
        // NORMALIZADOR DE CONTRATO DE DADOS
        // ==========================================================
        normalizeProduct(produto = {}) {
            const nome = produto.name || produto.nome || 'Produto Sem Nome';
            const preco = this._safeNumber(produto.precoFinal ?? produto.price ?? produto.preco ?? produto.valor ?? 0);
            const peso = this._safeNumber(produto.weight ?? produto.peso ?? 0);

            return {
                id: this._safeString(produto.id),
                sku: this._safeString(produto.sku || produto.codigo || 'N/A'),
                nome: this._escapeHTML(nome),
                preco,
                peso,
                imagem: window.ImageHelper?.obterImagem?.(produto) || produto.image || produto.imagem || '',
                raw: produto
            };
        },

        // ==========================================================
        // TEMPLATE ENGINE (TAILWIND UI CORRETO)
        // ==========================================================
        createHTML(produto = {}) {
            try {
                const item = this.normalizeProduct(produto);
                const precoFormatado = window.MoneyUtils?.format?.(item.preco) || `R$ ${item.preco.toFixed(2)}`;

                return `
                    <div class="abella-produto-card bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden p-3 flex flex-col justify-between space-y-3 hover:border-[#caa85c]/40 transition-all group relative" data-product-id="${item.id}">
                        <div class="aspect-square w-full bg-zinc-900/40 rounded-xl overflow-hidden relative flex items-center justify-center">
                            <img src="${item.imagem}" alt="${item.nome}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500">
                        </div>
                        <div class="space-y-1 text-left flex-1 flex flex-col justify-between">
                            <div>
                                <span class="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">
                                    SKU: ${item.sku}
                                </span>
                                <h3 class="text-white font-bold text-xs leading-tight tracking-wide uppercase mt-1.5 line-clamp-2 min-h-[32px]">
                                    ${item.nome}
                                </h3>
                            </div>
                            <div class="pt-2 border-t border-zinc-900 flex justify-between items-end mt-2">
                                <div class="font-mono">
                                    <span class="block text-[8px] text-zinc-500 uppercase">Bruto Sem Banho</span>
                                    <span class="gold text-sm font-black">${precoFormatado}</span>
                                    <span class="block text-[9px] text-zinc-400 mt-0.5">⚖️ ${item.peso.toFixed(2)}g</span>
                                </div>
                                <button type="button" class="js-open-product bg-[#caa85c] hover:bg-[#bda152] text-black font-black p-2.5 rounded-xl transition-all shadow-md" data-product-id="${item.id}" aria-label="Abrir produto">
                                    🛒 +
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('[PMA V8] [ProdutoCard:createHTML] Erro ao gerar template:', error);
                return '';
            }
        },

        // ==========================================================
        // ASSINATURA DE EVENTOS SEGUROS (DELEGAÇÃO COMPATÍVEL)
        // ==========================================================
        bindEvents(container = document) {
            try {
                container.querySelectorAll('.js-open-product').forEach(button => {
                    if (button.dataset.bound === 'true') return;
                    button.dataset.bound = 'true';

                    button.addEventListener('click', event => {
                        const id = event.currentTarget.dataset.productId;
                        
                        // Executa a abertura delegada de forma segura
                        if (typeof window.abrirModalCompra === 'function') {
                            window.abrirModalCompra(id);
                        } else {
                            console.warn(`[PMA V8] [ProdutoCard] Função global abrirModalCompra não encontrada para o ID: ${id}`);
                        }
                    });
                });
            } catch (error) {
                console.error('[PMA V8] [ProdutoCard:bindEvents] Falha ao acoplar escutadores de eventos:', error);
            }
        }
    };

    // VINCULAÇÃO E CONGELAMENTO NO ESCOPO GLOBAL
    Object.defineProperty(window, 'ProdutoCard', {
        value: Object.freeze(ProdutoCard),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] 🧩 ProdutoCard v8.0 renderizador de vitrine integrado e selado.');
})();
