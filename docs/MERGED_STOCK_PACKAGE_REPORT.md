# Pacote mesclado: estoque limitado

Este pacote foi gerado a partir do ZIP que estava no GitHub e recebeu o recurso de estoque limitado por mesclagem de três vias.

## Preservado do GitHub

- Lógica de descontos por faixa de valor no `js/services/carrinhoService.js`.
- Comportamento de ocultar a vitrine durante buscas em `produtos.html`.
- Estrutura e demais arquivos do ZIP original.

## Incorporado

- Seletor de estoque limitado no cadastro e edição de produtos.
- Campo de quantidade disponível.
- Persistência dos campos `estoqueControlado` e `estoqueQuantidade`.
- Contador nos cards públicos.
- Saldo no modal de compra.
- Bloqueio de quantidade acima do estoque no modal e no carrinho.

## Validação

Todos os arquivos JavaScript/MJS passaram no `node --check`. Não foram encontrados marcadores reais de conflito de mesclagem. O pacote não contém a pasta `.git`, permitindo copiar os arquivos para o repositório sem carregar o histórico local do ambiente de auditoria.
