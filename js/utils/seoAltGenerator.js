// ======================================================================
// js/utils/seoAltGenerator.js
// SEO IQ200 — Sistema ALT Automático (100% regras, sem IA/API paga)
// Gera texto alternativo rico em contexto para imagens de produto,
// combinando nome + categoria + subcategoria + acabamento + marca.
// ======================================================================

(function () {
    'use strict';

    function limparTexto(txt) {
        return String(txt || '').replace(/-/g, ' ').trim();
    }

    function capitalizar(txt) {
        return limparTexto(txt).replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Gera o alt text de um produto normal (vendável) para a grade/cards.
     * Ex: "Brinco Estrela — Brincos Fixos Médios — banhado a ouro — Abella Joias atacado"
     */
    function gerarAltProduto(produto) {
        if (!produto) return 'Abella Joias';

        const nome = capitalizar(produto.nome || produto.name || 'Produto');
        const categoria = capitalizar(produto.categoriaId || produto.category || '');
        const subcategoria = capitalizar(produto.subcategoriaId || produto.subcategory || '');
        const acabamento = limparTexto(
            (produto.metadados && produto.metadados.finish) || ''
        );

        const partes = [nome];

        // Evita repetir "categoria — subcategoria" quando são a mesma coisa
        if (subcategoria && subcategoria.toLowerCase() !== nome.toLowerCase()) {
            partes.push(subcategoria);
        } else if (categoria) {
            partes.push(categoria);
        }

        if (acabamento) partes.push(acabamento);

        partes.push('Abella Joias atacado');

        return partes.filter(Boolean).join(' — ');
    }

    /**
     * Gera o alt text de uma foto vitrine (ambientada), com foco no contexto de uso/estilo.
     * Ex: "Conjunto Médio — Brincos Fixos Médios — veja como fica no corpo — Abella Joias atacado"
     */
    function gerarAltVitrine(produto) {
        if (!produto) return 'Abella Joias';

        const nome = capitalizar(produto.nome || produto.name || 'Coleção');
        const categoria = capitalizar(produto.categoriaId || produto.category || '');
        const subcategoria = capitalizar(produto.subcategoriaId || produto.subcategory || '');

        return [nome, categoria, subcategoria, 'veja como fica no corpo', 'Abella Joias atacado']
            .filter(Boolean).join(' — ');
    }

    const SeoAltGenerator = Object.freeze({ gerarAltProduto, gerarAltVitrine });

    // Disponível tanto como módulo global (scripts clássicos) quanto via window
    window.SeoAltGenerator = SeoAltGenerator;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SeoAltGenerator;
    }
})();
