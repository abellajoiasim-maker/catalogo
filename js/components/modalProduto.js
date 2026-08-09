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

