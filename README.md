# catalogo

Atacado de Joias no Bruto — catálogo e painel operacional da Abella Joias.

## Arquitetura oficial

A versão publicada do catálogo é a estrutura da raiz do repositório. As páginas principais são `index.html`, `produtos.html`, `subcategorias.html`, `carrinho.html`, `checkout.html` e `galvanicas.html`. Componentes compartilhados ficam em `components/`, o engine em `engine/`, os serviços e utilitários em `js/` e os estilos de tema em `themes/`.

A implementação paralela `luxury-v11/` foi retirada da árvore de publicação para evitar duas versões do catálogo em paralelo. O ponto de restauração completo foi preservado fora do projeto em `catalogo-main-backup-before-refactor` durante esta sessão.

## Escopo desta etapa

As referências inexistentes ao `js/utils/imagens.js` foram removidas porque o projeto já possui o `js/utils/image-helper.js`, que exporta os atalhos de imagem utilizados pelas páginas. Também foi corrigido um typo no fallback de imagens de subcategorias.

As regras do Firebase, as permissões do Realtime Database, o Storage e a blindagem da autenticação **não foram alterados**. Esses itens serão tratados separadamente após a estabilização do código.

## Scripts

O projeto exige Node.js 20 ou superior para os scripts de SEO. Para gerar sitemap e feed Merchant localmente:

```bash
npm run seo:generate
```

Os comandos individuais são:

```bash
npm run seo:sitemap
npm run seo:merchant
```

## Diagnóstico de imagens

Imagens "sumindo" quase sempre significam que o arquivo esperado não existe no CDN (`abella-joias-cdn`). Duas ferramentas ajudam:

- **No navegador:** abra qualquer página com `?debugImagens=1` — imagens que caíram no placeholder ganham borda vermelha tracejada. No console, `ImageHelper.relatorioFalhas()` lista as URLs que deram erro.
- **Auditoria completa:** `npm run images:check` lê o Firebase, resolve cada imagem com o mesmo `image-helper.js` do site e confere no CDN. Gera `relatorio-imagens.csv` com o motivo de cada falha (sem imagem, arquivo inexistente, nome ≠ SKU, ainda no Firebase...). Requer Node 20+.

O feed do Merchant (`npm run seo:merchant`) agora grava `image_link` como URL absoluta do CDN.
