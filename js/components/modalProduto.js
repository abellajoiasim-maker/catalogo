// js/components/modalProduto.js
// Abella Joias - ModalProduto v3.0 (Corrigido)

const ModalProduto = {
    abrir(produtoCompleto) {
        if (!produtoCompleto) return;
        window.produtoAtual = produtoCompleto; // Mantém o contrato íntegro na memória
        
        const modal = document.getElementById('modalProduto');
        if (!modal) return;

        // CORREÇÃO: Ajustado para o método correto obterImagem do ImageHelper
        const imgPrincipal = window.ImageHelper?.obterImagem 
            ? window.ImageHelper.obterImagem(produtoCompleto)
            : 'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA';

        const precoFinal = window.DescontoService?.calcularPrecoFinal 
            ? window.DescontoService.calcularPrecoFinal(produtoCompleto)
            : (produtoCompleto.preco || 0);
        
        document.getElementById('modal-nome').innerText = produtoCompleto.nome || produtoCompleto.name || 'Produto';
        document.getElementById('modal-sku').innerText = `SKU: ${produtoCompleto.codigo || produtoCompleto.sku || ''}`;
        document.getElementById('modal-descricao').innerText = produtoCompleto.descricao || 'Sem descrição disponível.';
        document.getElementById('modal-peso').innerText = `${produtoCompleto.peso || produtoCompleto.weight || 0}g`;
        
        // Formatação monetária segura usando o MoneyUtils
        document.getElementById('modal-preco').innerText = window.MoneyUtils?.format
            ? window.MoneyUtils.format(precoFinal)
            : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoFinal);
        
        const containerImagem = document.getElementById('modal-imagem-container');
        if (containerImagem) {
            containerImagem.innerHTML = `<img src="${imgPrincipal}" class="w-full h-full object-cover rounded-2xl">`;
        }

        // Regra Absoluta Nº 2: Quantidade individual por variação
        const containerVariacoes = document.getElementById('modal-variacoes-container');
        if (containerVariacoes) {
            containerVariacoes.innerHTML = '';
            const listaVariacoes = produtoCompleto.variacoes || [];
            
            if (listaVariacoes.length > 0) {
                listaVariacoes.filter(v => v.ativo).forEach(variacao => {
                    const row = document.createElement('div');
                    row.className = "flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl mb-2";
                    row.innerHTML = `
                        <div>
                            <span class="text-sm font-medium text-white">${variacao.nome}</span>
                            <span class="block text-[10px] text-zinc-500 font-mono">Cod: ${variacao.codigo || 'N/A'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="window.ajustarQtdVar('${variacao.id}', -1)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">-</button>
                            <input type="number" id="qtd-var-${variacao.id}" data-var-id="${variacao.id}" data-var-nome="${variacao.nome}" value="0" min="0" class="w-12 h-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" readonly>
                            <button onclick="window.ajustarQtdVar('${variacao.id}', 1)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">+</button>
                        </div>
                    `;
                    containerVariacoes.appendChild(row);
                });
            } else {
                // Produto sem variações ganha um contador padrão (Mínimo 1)
                containerVariacoes.innerHTML = `
                    <div class="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                        <span class="text-sm text-zinc-400">Quantidade Desejada:</span>
                        <div class="flex items-center gap-2">
                            <button onclick="window.ajustarQtdVar('padrao', -1, true)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">-</button>
                            <input type="number" id="qtd-var-padrao" value="1" min="1" class="w-12 h-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" readonly>
                            <button onclick="window.ajustarQtdVar('padrao', 1, true)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">+</button>
                        </div>
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    }
};

// Exposição global compatível com o resto do projeto
window.ModalProduto = ModalProduto;

window.ajustarQtdVar = function(id, delta, isPadrao = false) {
    const input = document.getElementById(`qtd-var-${id}`);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += delta;
    
    // Se for o produto padrão (sem variação), o mínimo permitido é 1
    const minPermitido = isPadrao ? 1 : 0;
    if (val < minPermitido) val = minPermitido;
    
    input.value = val;
};
