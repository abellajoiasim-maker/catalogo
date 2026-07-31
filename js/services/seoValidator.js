// ======================================================================
// js/services/seoValidator.js
// SEO IQ200 — Validador / Motor de Regras / IQ200 Score
// 100% JavaScript, sem IA e sem API paga. Avalia um produto e devolve
// uma pontuação de 0 a 100 + a lista de regras que passaram/falharam.
// ======================================================================

(function () {
    'use strict';

    const NIVEL = {
        BOM: 'bom',
        ATENCAO: 'atencao',
        CRITICO: 'critico'
    };

    function nivelPorScore(score) {
        if (score >= 80) return NIVEL.BOM;
        if (score >= 50) return NIVEL.ATENCAO;
        return NIVEL.CRITICO;
    }

    function ehVitrine(p) {
        return p && (p.vitrine === true || p.isVitrine === true || p.showcase === true || p.tipo === 'vitrine');
    }

    // Regras para produtos vendáveis (grade normal)
    function regrasProdutoVendavel(p) {
        const nome = String(p.nome || p.name || '').trim();
        const descricao = String(p.descricao || '').trim();
        const imagem = String(p.imagem || p.image || '').trim();
        const preco = Number(p.preco ?? p.price ?? 0);
        const sku = String(p.sku || p.codigo || '').trim();
        const categoria = String(p.categoriaId || p.category || '').trim();
        const subcategoria = String(p.subcategoriaId || p.subcategory || '').trim();

        return [
            { id: 'nome', label: 'Nome do produto preenchido', peso: 10, ok: nome.length >= 3, dica: 'Preencha um nome com ao menos 3 caracteres.' },
            { id: 'nome_tamanho', label: 'Nome com tamanho ideal para título (≤ 70 caracteres)', peso: 5, ok: nome.length > 0 && nome.length <= 70, dica: 'Nomes muito longos são cortados pelo Google nos resultados de busca.' },
            { id: 'descricao', label: 'Descrição preenchida', peso: 15, ok: descricao.length > 0, dica: 'Produtos sem descrição perdem a chance de aparecer em buscas mais específicas.' },
            { id: 'descricao_tamanho', label: 'Descrição com bom tamanho (50–300 caracteres)', peso: 10, ok: descricao.length >= 50 && descricao.length <= 300, dica: 'Descrições muito curtas têm pouco contexto; muito longas diluem a palavra-chave principal.' },
            { id: 'imagem', label: 'Imagem principal presente', peso: 15, ok: imagem.length > 0, dica: 'Sem imagem, o produto não pode ser indexado no Google Imagens nem no Merchant Center.' },
            { id: 'preco', label: 'Preço maior que zero', peso: 15, ok: preco > 0, dica: 'Preço zerado impede a inclusão no feed do Google Merchant Center.' },
            { id: 'sku', label: 'SKU/código preenchido', peso: 10, ok: sku.length > 0, dica: 'O SKU é usado como identificador único no feed de produtos.' },
            { id: 'categoria', label: 'Categoria definida', peso: 10, ok: categoria.length > 0, dica: 'Sem categoria, o produto não entra na navegação nem no sitemap por categoria.' },
            { id: 'subcategoria', label: 'Subcategoria definida', peso: 10, ok: subcategoria.length > 0, dica: 'Sem subcategoria, o produto não recebe uma URL de catálogo filtrada própria.' }
        ];
    }

    // Regras para peças vitrine (fotos ambientadas, não vendáveis)
    function regrasVitrine(p) {
        const nome = String(p.nome || p.name || '').trim();
        const legenda = String(p.legendaVitrine || '').trim();
        const imagem = String(p.imagem || p.image || '').trim();
        const categoria = String(p.categoriaId || p.category || '').trim();
        const subcategoria = String(p.subcategoriaId || p.subcategory || '').trim();

        return [
            { id: 'nome', label: 'Nome da coleção preenchido', peso: 20, ok: nome.length >= 3, dica: 'Preencha um nome com ao menos 3 caracteres.' },
            { id: 'legenda', label: 'Legenda vitrine descritiva (≥ 20 caracteres)', peso: 30, ok: legenda.length >= 20, dica: 'A legenda vira o texto ao redor da imagem — importante para o Google Imagens entender o contexto.' },
            { id: 'imagem', label: 'Imagem ambientada presente', peso: 30, ok: imagem.length > 0, dica: 'Sem imagem, a vitrine não aparece e perde toda a função de isca de SEO.' },
            { id: 'categoria_sub', label: 'Categoria e subcategoria definidas', peso: 20, ok: categoria.length > 0 && subcategoria.length > 0, dica: 'Sem categoria/subcategoria, o link da vitrine não sabe para onde levar o visitante.' }
        ];
    }

    function avaliarProduto(produto) {
        if (!produto) return { score: 0, nivel: NIVEL.CRITICO, ehVitrine: false, regras: [] };

        const vitrine = ehVitrine(produto);
        const regras = vitrine ? regrasVitrine(produto) : regrasProdutoVendavel(produto);

        const pesoTotal = regras.reduce((acc, r) => acc + r.peso, 0) || 1;
        const pesoObtido = regras.reduce((acc, r) => acc + (r.ok ? r.peso : 0), 0);
        const score = Math.round((pesoObtido / pesoTotal) * 100);

        return {
            score,
            nivel: nivelPorScore(score),
            ehVitrine: vitrine,
            regras
        };
    }

    function avaliarCatalogo(produtos) {
        const lista = (produtos || []).map(p => ({ produto: p, ...avaliarProduto(p) }));
        const scoreMedio = lista.length
            ? Math.round(lista.reduce((acc, i) => acc + i.score, 0) / lista.length)
            : 0;

        return {
            itens: lista,
            scoreMedio,
            criticos: lista.filter(i => i.nivel === NIVEL.CRITICO).length,
            atencao: lista.filter(i => i.nivel === NIVEL.ATENCAO).length,
            bons: lista.filter(i => i.nivel === NIVEL.BOM).length
        };
    }

    window.SeoValidator = Object.freeze({ NIVEL, avaliarProduto, avaliarCatalogo });
})();
