# Projeto SEO do catálogo Abella Joias

## Diagnóstico

O funil atual é correto em conceito — Home → categoria → subcategoria → produtos → modal/carrinho —, mas depende de páginas genéricas com query string e de metadados injetados somente depois da leitura do Firebase. O sitemap acompanha esse padrão e ainda não materializa páginas individuais de produto. A camada de renderização já suporta imagens próprias para subcategorias, porém usa a imagem da categoria como fallback e não cria conteúdo editorial suficiente para busca.

## Arquitetura aprovada

1. **Home (`/`)**: descoberta de categorias com imagem, texto introdutório comercial e links HTML para subcategorias e coleções prioritárias.
2. **Subcategorias (`/subcategorias.html?categoria=...`)**: título e descrição derivados do Firebase, imagem ambientada individual, breadcrumbs, texto de intenção de compra e cards com links diretos para a vitrine.
3. **Produtos (`/produtos.html?categoria=...&subcategoria=...`)**: banner/vitrine da subcategoria, título claro, resumo da coleção, filtros de busca, grade de produtos, breadcrumbs e dados estruturados `ItemList`.
4. **Produto individual**: fase posterior recomendada. Criar uma rota estável com slug e página pública própria antes de incluir URLs individuais no sitemap; o modal não deve ser tratado como página indexável.
5. **Compartilhamento**: cada página pública deve ter `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, imagem absoluta e fallback seguro. A imagem da subcategoria deve ser preferida à imagem da categoria.
6. **Sitemap**: manter apenas URLs públicas e estáveis que realmente renderizam conteúdo. Não incluir carrinho, checkout, painel ou URLs de busca interna.
7. **Conversão**: CTA persistente para WhatsApp/carrinho, condições comerciais visíveis (5% PIX, 3x sem juros e frete grátis para galvânicas de Limeira-SP acima de R$ 100), e saída clara da descoberta visual para compra.

## Implementação nesta rodada

- Melhorar o renderizador compartilhado para escape de HTML, alt text e imagem ambientada.
- Criar bloco editorial e metadados mais completos na página de subcategorias.
- Reforçar heading, breadcrumbs, resumo e imagem social na página de produtos.
- Corrigir defaults comerciais visíveis da home para 5% PIX e 3x sem juros.
- Preservar compatibilidade com Firebase, query strings existentes, modal, carrinho e estoque.
- Não alterar regras de negócio nem publicar URLs individuais no sitemap sem uma página individual real.

## Referências técnicas

[1] Google Search Central — Include structured data relevant to ecommerce: https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce
[2] Google Search Central — JavaScript SEO basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
[3] Open Graph protocol: https://ogp.me/
