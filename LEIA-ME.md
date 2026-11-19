[LEIA-ME.md](https://github.com/user-attachments/files/35084725/LEIA-ME.md)
# Ajuste da compra rápida para celular

Este pacote melhora a primeira tela da compra rápida sem alterar regras de estoque, carrinho, checkout ou dados do Firebase.

## Arquivos incluídos

- `produtos.html`
- `components/compra-rapida.css`
- `js/compra-rapida.js`

## Como aplicar

1. Faça uma cópia de segurança dos três arquivos atuais.
2. Extraia este ZIP na raiz do projeto do catálogo, mantendo as pastas e permitindo substituir os arquivos existentes.
3. Publique o site pelo processo habitual do projeto.

## O que muda

- Busca e botão **Buscar** ficam na mesma linha, economizando uma faixa vertical.
- O texto da busca fica mais curto e direto.
- No modo rápido em celulares, o breadcrumb repetido e o espaçamento excessivo do topo são reduzidos.
- Subcategorias passam a ocupar uma grade de duas colunas, quebrando linhas automaticamente em vez de exigir rolagem horizontal.
- A orientação para selecionar uma subcategoria foi encurtada.
- O layout do modo completo e o comportamento da sacola continuam preservados.

## Verificação realizada

A sintaxe do HTML e do JavaScript foi verificada; a busca foi testada; e o layout foi conferido em larguras de 320, 360, 390 e 430 px, sem rolagem horizontal.

Este pacote contém apenas a atualização dos arquivos; ele não altera nem publica o site automaticamente.
