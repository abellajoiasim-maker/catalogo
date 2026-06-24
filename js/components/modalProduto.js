// components/modalProduto.js
export const ModalProduto = {
    abrir(produtoCompleto) {
        if (!produtoCompleto) return;
        window.produtoAtual = produtoCompleto; // Mantém o contrato íntegro na memória
        
        const modal = document.getElementById('modalProduto');
        if (!modal) return;

        const imgPrincipal = ImageHelper.getPrimary(produtoCompleto);
        const precoFinal = DescontoService.calcularPrecoFinal(produtoCompleto);
        
        document.getElementById('modal-nome').innerText = produtoCompleto.nome;
        document.getElementById('modal-sku').innerText = `SKU: ${produtoCompleto.codigo || ''}`;
        document.getElementById('modal-descricao').innerText = produtoCompleto.descricao || 'Sem descrição disponível.';
        document.getElementById('modal-peso').innerText = `${produtoCompleto.peso || 0}g`;
        document.getElementById('modal-preco').innerText = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(precoFinal);
        
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
                // Produto sem variações ganha um contador padrão
                containerVariacoes.innerHTML = `
                    <div class="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                        <span class="text-sm text-zinc-400">Quantidade Desejada:</span>
                        <div class="flex items-center gap-2">
                            <button onclick="window.ajustarQtdVar('padrao', -1)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">-</button>
                            <input type="number" id="qtd-var-padrao" value="1" min="1" class="w-12 h-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" readonly>
                            <button onclick="window.ajustarQtdVar('padrao', 1)" class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white">+</button>
                        </div>
                    </div>
                `;
            }
        }

        modal.classList.remove('hidden');
    }
};

window.ajustarQtdVar = function(id, delta) {
    const input = document.getElementById(`qtd-var-${id}`);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 0) val = 0;
    input.value = val;
};
