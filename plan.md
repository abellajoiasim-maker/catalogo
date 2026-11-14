# Plano — Compra rápida responsiva

## Objetivo
Acrescentar ao catálogo uma alternativa de compra rápida, sem substituir o modo completo já publicado. A navegação rápida prioriza categoria → subcategoria → produtos, permite busca por nome/SKU em todo o catálogo e expõe a sacola continuamente em telas menores.

## Implementação
- Preservar o mecanismo atual de Firebase, serviço de produtos, descontos, modal de variações, controle de estoque, carrinho, checkout, SEO, painel e páginas existentes.
- Acrescentar um seletor de modo na listagem de produtos. O modo completo permanece padrão; o modo rápido é ativado pelo parâmetro `modo=rapida`.
- Criar camada JavaScript isolada para carregar categorias e subcategorias do Firebase, filtrar a navegação e oferecer adição direta para produtos sem variação. Produtos com grade continuam passando pelo modal de compra existente.
- Criar CSS separado, responsivo para desktop/tablet/mobile, com busca global, filtros categóricos, CTA de adição e resumo fixo da sacola.
- Acrescentar uma entrada de compra rápida na Home e documentar como testar em cópia/repositório separado.
- Não alterar configuração Firebase existente, workflows, domínio, regras do banco, nem efetuar operações GitHub remotas.

## Estrutura afetada
- `index.html`: entrada para a compra rápida.
- `produtos.html`: seletor dos modos e ponto de integração com a listagem atual.
- `js/compra-rapida.js`: estado de navegação, categorias/subcategorias, busca e adição direta.
- `components/compra-rapida.css`: estilos isolados da nova experiência.
- `docs/TESTE_COMPRA_RAPIDA_GITHUB.md`: passos para teste seguro em repositório e Firebase de homologação.

## Direção de design
Manter o tema premium já existente e favorecer leitura, controles grandes para toque e contexto claro. Para cerca de 1.800 itens, não despejar o catálogo inteiro como lista inicial do modo rápido: exigir categoria, subcategoria ou busca explícita antes de renderizar resultados. Em telas menores, apresentar categorias e subcategorias como controles roláveis e deixar a sacola acessível.
