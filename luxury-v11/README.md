# Abella Joias — Luxury Experience V11 (Project AURORA)

Esta pasta é paralela ao projeto em produção. **Nada aqui substitui os arquivos
da raiz** — o site em `catalogo.abellajoias.com.br` continua servindo os
arquivos atuais normalmente até a V11 ser aprovada e trocada oficialmente.

Base visual: Conceito 1 — Ouro Clássico (Ivory / White / Gold / Black / Gray).

## Progresso

- [x] Sprint 0 — Design Tokens (`tokens.css`)
- [x] Sprint 1 — Component Library
  - [x] Button (`components/button.css`)
  - [x] Input / Select / Checkbox / Radio (`components/forms.css`)
  - [x] Badge (`components/badge.css`)
  - [x] Card — CategoryCard, SubcategoryCard, ProductCard, CollectionCard, BannerCard, LookbookCard (`components/cards.css`)
  - [x] Header (`components/header.css`)
  - [x] Footer (`components/footer.css`)
  - [x] Modal único e inteligente (`components/modal.css` + `components/modal.js`)
  - [x] Skeleton (`components/skeleton.css`)
  - [x] Breadcrumb (`components/breadcrumb.css`)
  - [x] Drawer (`components/drawer.css`)
  - [x] `components/index.css` — importa tudo em um único include
  - [x] `showcase.html` — vitrine com todos os componentes juntos, pra testar antes do Sprint 2
- [x] Sprint 2 — Luxury UI Engine
  - [x] Render Engine (`engine/render.js`) — CategoryCard, **SubcategoryCard** (mesmo formato de dados do `subcategorias.html` real: subcategorias aninhadas em `categoria.subcategories`, fallback de imagem, filtro `paused`), ProductCard, BannerCard, CollectionCard, LookbookCard, Breadcrumb, Skeleton
  - [x] Animations (`engine/animations.js`) — reveal on scroll, ripple nos botões, usando só as durações de `tokens.css`
  - [x] Mobile Navigation (`engine/mobile-nav.js`) — corrige uma lacuna real do Header do Sprint 1 (o menu simplesmente sumia no celular sem substituto); agora abre pelo Drawer
  - [x] `engine-test.html` — prova end-to-end: dados falsos → engine → HTML renderizado, incluindo o fluxo Categoria → Subcategoria
- [ ] Sprint 3 — Páginas
  - [x] Home (`pages/index.html`) — ligada ao Firebase real (`abella/settings`, `abella/categories`)
  - [x] Subcategorias (`pages/subcategorias.html`) — mesmo formato de dados do arquivo real, inclusive o "pula direto pra produtos se não houver subcategoria"
  - [x] Produtos (`pages/produtos.html`) — usa `produtoService.listarTodos()` real, modal de produto novo (Aurora Modal) e `carrinhoService.adicionar()` real
  - [x] Carrinho (`pages/carrinho.html`) — usa `carrinhoService.listar()/atualizarQuantidade()/remover()/obterTotal()` reais, sem recalcular nada por conta própria
  - [x] Checkout (`pages/checkout.html`) — replica fiel do `js/services/checkout.js` real (o que de fato roda em produção, não o script inline solto que ele sobrescreve): mesmos nomes de campo de configuração, mesma fórmula de desconto PIX/frete, mesma validação obrigatória, e o payload salvo em `abella/orders` é byte-a-byte igual ao original — o `pedidos.html` continua lendo normalmente.

### Nota de segurança sobre o Checkout (resolvida)

Descoberta importante durante a auditoria: o `checkout.html` original tem duas
fontes de lógica — um `<script>` inline na própria página, e o arquivo
`js/services/checkout.js`, carregado por último. Como os dois declaram
funções de mesmo nome (`finalizarPedido`, `atualizarResumo`, `fecharModal`),
a última a carregar (`checkout.js`) **sobrescreve** as anteriores — então a
lógica que de fato roda em produção é a do `checkout.js`, e o script inline
correspondente é código morto. `pages/checkout.html` replica exatamente a
versão de `checkout.js` (a real).

Também corrigi, de novo, aquele bug do texto solto (`"prep: estrutura de
temas..."`) depois do `</html>` — ele reapareceu no `checkout.html` também.

Abra também `luxury-v11/engine-test.html` para ver o Render Engine (Sprint 2)
funcionando de ponta a ponta com dados falsos — incluindo o fluxo
Categoria → Subcategoria igual ao `subcategorias.html` real (uma das
subcategorias de teste está marcada como `paused: true` de propósito,
pra confirmar que o filtro funciona). Redimensione a janela para menos
de 768px para testar o menu mobile (☰) abrindo pelo Drawer.

## Como testar as páginas reais (Sprint 3)

Diferente do `showcase.html`/`engine-test.html` (dados falsos, isolados),
as páginas em `pages/` são **reais** — precisam estar dentro da estrutura
do projeto (mesmo nível de `js/`, `images/`, `checkout.html`) porque usam
caminhos relativos (`../../js/...`) e o Firebase de verdade. Copie a pasta
`luxury-v11/` inteira para a raiz do projeto (ao lado de `index.html`,
`js/` etc.) e abra `luxury-v11/pages/index.html`.

## Como testar (vitrines isoladas, dados falsos)

Abra `luxury-v11/showcase.html` diretamente no navegador (não precisa do
projeto todo rodando — é uma vitrine isolada, só com CSS/JS locais desta
pasta). Lá dá pra ver e clicar em todos os componentes prontos: botões,
badges, campos de formulário, os 6 cards, header, footer, breadcrumb,
skeleton, modal e drawer.

## Regra de ouro

Nenhum componente usa cor, espaçamento, radius, sombra ou duração fora do que
está declarado em `tokens.css`. Ver documento mestre "ABELLA LUXURY EXPERIENCE
V11" para as regras completas de cada item.
