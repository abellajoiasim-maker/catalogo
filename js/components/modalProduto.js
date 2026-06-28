// js/components/modalProduto.js
// Abella Joias - ModalProduto v4.0 (PMA V8 Ultra-Estável - Alinhado)

const ModalProduto = {
    abrir(produtoCompleto) {
        if (!produtoCompleto) return;
        
        // Sincroniza com o estado global esperado pela página produtos.html
        window.produtoAtual = produtoCompleto; 
        
        // Delega a abertura e renderização visual para a engenharia matricial estável da página
        if (typeof window.abrirModalProduto === 'function') {
            // Localiza o índice do produto na lista global para abrir nativamente
            const idx = (window.produtosFiltrados || []).findIndex(p => 
                (p.sku || p.codigo) === (produtoCompleto.sku || produtoCompleto.codigo) || p.nome === produtoCompleto.nome
            );
            if (idx !== -1) {
                window.abrirModalProduto(idx);
                return;
            }
        }

        // Fallback de renderização caso não seja chamado via grid de produtos.html
        const modal = document.getElementById('modalProduto');
        if (!modal) return;

        const imgPrincipal = window.ImageHelper?.obterImagem 
            ? window.ImageHelper.obterImagem(produtoCompleto)
            : (produtoCompleto.imagem || produtoCompleto.image || 'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA');

        const precoFinal = parseFloat(produtoCompleto.preco || 0);
        
        if(document.getElementById('modalNome')) document.getElementById('modalNome').innerText = produtoCompleto.nome || 'Produto';
        if(document.getElementById('modalSku')) document.getElementById('modalSku').innerText = `Ref: ${produtoCompleto.codigo || produtoCompleto.sku || '-'}`;
        if(document.getElementById('modalDescricao')) document.getElementById('modalDescricao').innerText = produtoCompleto.descricao || 'Sem descrição disponível.';
        if(document.getElementById('modalPeso')) document.getElementById('modalPeso').innerText = `${produtoCompleto.peso || 0} g`;
        
        if(document.getElementById('modalPreco')) {
            document.getElementById('modalPreco').innerText = window.MoneyUtils?.format
                ? window.MoneyUtils.format(precoFinal)
                : 'R$ ' + precoFinal.toFixed(2);
        }
        
        const mImg = document.getElementById('modalImagem');
        if (mImg) {
            mImg.src = imgPrincipal;
        }

        // Invoca a construção da grade matricial de variações
        if (typeof window._construirGradeDeCompra === 'function') {
            window._construirGradeDeCompra(produtoCompleto);
        }

        modal.classList.remove('hidden');
    }
};

// Exposição global nativa
window.ModalProduto = ModalProduto;

// --- FUNÇÃO DE INJEÇÃO CRÍTICA PMA V8 ---
// Substitui a antiga lógica e conecta a grade matricial do modal ao carrinhoService de forma limpa
window.adicionarGradeAoCarrinho = function() {
    if (!window.produtoAtual) {
        console.error("[PMA V8] Nenhum produto ativo na memória do modal.");
        return;
    }

    if (typeof window.carrinhoService === 'undefined' || typeof window.carrinhoService.adicionar !== 'function') {
        alert('Infraestrutura de carrinho não identificada no escopo local.');
        return;
    }

    const inputs = document.querySelectorAll('.input-grade-qtd');
    let itensAdicionados = 0;

    inputs.forEach(input => {
        const qtd = parseInt(input.value) || 0;
        if (qtd > 0) {
            // Captura o nome exato da variação gerada na matriz (ex: "Macho • Letra A")
            const labelVariacao = input.getAttribute('data-variacao-nome') || '';
            
            // Injeta cirurgicamente no carrinho com sua respectiva variação
            window.carrinhoService.adicionar(window.produtoAtual, qtd, labelVariacao);
            itensAdicionados++;
        }
    });

    if (itensAdicionados === 0) {
        alert('Por favor, insira a quantidade desejada em pelo menos um item da grade.');
        return;
    }

    // Atualiza o contador visual do Header (Mini Carrinho)
    if (typeof window.atualizarMiniCarrinho === 'function') {
        window.atualizarMiniCarrinho();
    } else if (typeof window.renderizarCarrinho === 'function') {
        window.renderizarCarrinho();
    }
    
    // Fecha o modal limpando o estado de forma segura
    if (typeof window.fecharModalProduto === 'function') {
        window.fecharModalProduto();
    } else {
        const modal = document.getElementById('modalProduto');
        if (modal) modal.classList.add('hidden');
        window.produtoAtual = null;
    }
};
