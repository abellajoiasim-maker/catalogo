// ======================================================================
// js/components/produtoCard.js
// Abella Joias - ProdutoCard v5.0 (Auditado conforme Regras Forenses)
// ======================================================================

const ProdutoCard = {

    // ==========================================================
    // HELPERS DE ESCAPE
    // ==========================================================
    _escapeHTML(text = '') {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // ==========================================================
    // RENDERIZADOR COMPATÍVEL COM REGRAS 1, 2 E 3
    // ==========================================================
    render(produto) {
        if (!produto || !produto.id) return '';

        // Regra Absoluta Nº 3 — Consumo Exclusivo via ImageHelper
        const imagemPrincipal = typeof window.ImageHelper !== 'undefined' 
            ? window.ImageHelper.getPrimary(produto)
            : (produto.thumbnail || '../images/placeholder.jpg');

        const nomeEscapado = this._escapeHTML(produto.nome);
        const codigoEscapado = this._escapeHTML(produto.codigo);
        const categoriaEscapada = this._escapeHTML(produto.categoria);

        // Formatação de valores baseada no Contrato Unificado (Regra Nº 1)
        const precoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco);
        
        let precoFinal = produto.preco;
        if (produto.precoPromocional && produto.precoPromocional > 0 && produto.precoPromocional < produto.preco) {
            precoFinal = produto.precoPromocional;
        }
        const precoFinalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoFinal);
        const temPromo = precoFinal < produto.preco;

        return `
            <div class="produto-card bg-card p-4 rounded-2xl border border-zinc-800 flex flex-col justify-between h-full" data-id="${produto.id}">
                <div class="relative overflow-hidden rounded-xl bg-zinc-900 aspect-square mb-3">
                    <img src="${imagemPrincipal}" alt="${nomeEscapado}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='../images/placeholder.jpg'">
                    ${temPromo ? `<span class="absolute top-2 right-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Oferta</span>` : ''}
                    ${produto.destaque ? `<span class="absolute top-2 left-2 bg-[#caa85c] text-black font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">Destaque</span>` : ''}
                </div>
                <div class="flex-1 min-w-0 mb-3">
                    <div class="text-[10px] uppercase text-zinc-500 tracking-wider font-bold mb-1">${categoriaEscapada}</div>
                    <h3 class="text-sm font-semibold text-white tracking-wide truncate">${nomeEscapado}</h3>
                    <p class="text-xs text-zinc-400 font-mono mt-0.5">SKU: ${codigoEscapado}</p>
                </div>
                <div>
                    <div class="mb-3">
                        ${temPromo ? `<span class="text-xs text-zinc-500 line-through mr-1.5">${precoFormatado}</span>` : ''}
                        <span class="text-base font-black text-[#caa85c]">${precoFinalFormatado}</span>
                    </div>
                    <button data-product-id="${produto.id}" class="js-open-product w-full py-2.5 bg-zinc-900 border border-zinc-800 hover:border-[#caa85c]/40 text-white text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-widest">
                        Visualizar Detalhes
                    </button>
                </div>
            </div>
        `;
    },

    // ==========================================================
    // ESCUTADOR DE EVENTOS DA REGRA ABSOLUTA Nº 2
    // ==========================================================
    bindEvents(container = document, listaDeProdutosCompleta = null) {
        try {
            container.querySelectorAll('.js-open-product').forEach(button => {
                if (button.dataset.bound === 'true') return;
                button.dataset.bound = 'true';

                button.addEventListener('click', event => {
                    const id = event.currentTarget.dataset.productId;
                    
                    // Busca o objeto estritamente completo indexado em cache para não consultar o Firebase no Modal
                    let produtoCompleto = null;
                    if (listaDeProdutosCompleta && listaDeProdutosCompleta[id]) {
                        produtoCompleto = listaDeProdutosCompleta[id];
                    } else if (window.produtoService && window.produtoService._cache) {
                        produtoCompleto = window.produtoService._cache.find(p => p.id === id);
                    }

                    if (typeof window.abrirModalCompra === 'function' && produtoCompleto) {
                        // Passa o objeto 100% íntegro sem mutação
                        window.abrirModalCompra(produtoCompleto);
                    } else if (typeof window.abrirModalCompra === 'function' && !produtoCompleto) {
                        // Fallback de segurança usando o serviço sem quebrar o fluxo
                        window.produtoService.buscarPorId(id).then(prod => {
                            if (prod) window.abrirModalCompra(prod);
                        });
                    }
                });
            });
        } catch (error) {
            console.error('[ProdutoCard:bindEvents]', error);
        }
    }
};

window.ProdutoCard = ProdutoCard;
