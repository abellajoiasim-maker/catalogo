// js/components/modalProduto.js
// Abella Joias - ModalProduto v3.5 (PMA V8 Ultra-Estável)

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
                            <input type="number" id="qtd-var-${variacao.id}" data-var-id="${variacao.id}" data-var-nome="${variacao.nome}" value="0" min="0" class="input-variacao-pma w-12 h-8 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-sm font-bold text-white" readonly>
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

        // --- ENCAIXE DO BOTÃO DE COMPRA DA BASE PMA V8 ---
        // Garante a existência do botão de ação ou o injeta dinamicamente no rodapé do modal
        const containerBotao = document.getElementById('modal-acao-container') || document.getElementById('modalProduto').querySelector('.modal-footer');
        if (containerBotao) {
            containerBotao.innerHTML = `
                <button onclick="window.adicionarAoCarrinhoDoModal()" class="w-full bg-[#caa85c] hover:bg-[#b0904e] text-zinc-950 font-black py-3.5 px-6 rounded-xl transition duration-200 uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#caa85c]/10">
                    🛒 ADICIONAR AO CARRINHO
                </button>
            `;
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

// --- FUNÇÃO DE ENGRENAGEM CRÍTICA PMA V8 ---
// Coleta todas as variações alteradas pelo cliente e acopla ao carrinho de forma estruturada
window.adicionarAoCarrinhoDoModal = function() {
    const produto = window.produtoAtual;
    if (!produto) {
        console.error("[PMA V8] Nenhum produto ativo na memória do modal.");
        return;
    }

    if (typeof carrinhoService === 'undefined') {
        alert("Erro técnico: O motor do carrinho não foi carregado corretamente.");
        return;
    }

    let quantidadeTotal = 0;
    let variacoesSelecionadas = {};
    const inputsVariacao = document.querySelectorAll('.input-variacao-pma');

    if (inputsVariacao.length > 0) {
        // Fluxo com Múltiplas Variações (Grades)
        inputsVariacao.forEach(input => {
            const qtd = parseInt(input.value) || 0;
            if (qtd > 0) {
                const nomeVar = input.getAttribute('data-var-nome');
                variacoesSelecionadas[nomeVar] = qtd;
                quantidadeTotal += qtd;
            }
        });

        if (quantidadeTotal === 0) {
            alert("Por favor, selecione a quantidade de pelo menos uma variação antes de adicionar.");
            return;
        }
    } else {
        // Fluxo de Produto Sem Variações (Padrão)
        const inputPadrao = document.getElementById('qtd-var-padrao');
        quantidadeTotal = inputPadrao ? (parseInt(inputPadrao.value) || 1) : 1;
    }

    const precoFinal = window.DescontoService?.calcularPrecoFinal 
        ? window.DescontoService.calcularPrecoFinal(produto)
        : (produto.preco || 0);

    // Monta o payload definitivo compatível com a varredura do carrinho.html
    const itemCarrinho = {
        id: produto.codigo || produto.sku || '',
        sku: produto.codigo || produto.sku || '',
        nome: produto.nome || produto.name || '',
        image: produto.imagem || produto.image || '',
        peso: parseFloat(produto.peso || produto.weight || 0),
        preco: parseFloat(precoFinal),
        quantidade: quantidadeTotal,
        variacoesSelecionadas: Object.keys(variacoesSelecionadas).length > 0 ? variacoesSelecionadas : null
    };

    try {
        // Salva e atualiza o estado global
        if (typeof carrinhoService.adicionar === 'function') {
            carrinhoService.adicionar(itemCarrinho);
        } else if (typeof carrinhoService.inserir === 'function') {
            carrinhoService.inserir(itemCarrinho);
        }
        
        // Fecha o modal e atualiza a interface visível do carrinho se ela existir na página
        const modal = document.getElementById('modalProduto');
        if (modal) modal.classList.add('hidden');
        
        if (typeof renderizarCarrinho === 'function') {
            renderizarCarrinho();
        }
        
    } catch (err) {
        console.error("[PMA V8] Erro ao injetar item no carrinhoService:", err);
    }
};
