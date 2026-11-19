# Compra completa: busca e navegação responsivas

Este pacote reúne o ajuste de navegação entre compra rápida e completa e a busca por produto na tela de subcategorias, com layout para celular, tablet e desktop.

## Arquivos incluídos

- `produtos.html`
- `subcategorias.html`
- `components/compra-rapida.css`
- `js/compra-rapida.js`

## O que muda

- Na tela de subcategorias da compra completa, há um campo para buscar produto por nome ou SKU, acima dos banners.
- A busca conserva a categoria escolhida e abre os produtos filtrados nela.
- O campo e o botão se adaptam a celular/tablet sem gerar rolagem horizontal; a grade de subcategorias mantém duas colunas em tablet e uma coluna no celular, conforme os breakpoints do site.
- Ao sair da compra rápida para a completa com uma categoria selecionada e sem subcategoria, o fluxo abre `subcategorias.html` para que a cliente veja os banners das coleções.
- A caixa de busca e o modo compacto seguem restritos às regras apropriadas, sem alterar o estoque ou os dados do Firebase.

## Aplicação

Faça backup dos arquivos atuais. Extraia o ZIP na raiz do projeto e substitua os quatro arquivos nos mesmos caminhos. Depois, publique pelo processo habitual do GitHub Pages. Este pacote não publica alterações automaticamente.

## Verificações

Validada a sintaxe HTML/JavaScript e testados os tamanhos 320, 390, 600, 768 e 1024 px, a submissão da busca com categoria e termo, e a exibição do campo de busca também na página de produtos em celular, tablet e desktop.
