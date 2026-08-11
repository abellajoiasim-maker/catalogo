# Estoque limitado para produtos do saldão

## Como usar

1. Crie ou edite a categoria promocional no painel de categorias e informe o nome desejado, por exemplo: `Saldão — Últimas Unidades`.
2. Abra o cadastro de cada produto que fará parte do saldão.
3. Ative o seletor **Contador de estoque limitado**.
4. Informe a quantidade disponível no campo **Quantidade disponível**.
5. Salve o produto.

## Comportamento público

Quando o seletor está ativo, o catálogo mostra no card a quantidade disponível ou o estado `Esgotado`. O modal de compra mostra o saldo e impede selecionar uma quantidade maior que o estoque informado. O carrinho também bloqueia novas adições que ultrapassem o limite, inclusive quando o mesmo produto é adicionado em momentos diferentes ou em variações distintas.

Quando o seletor está desativado, o produto funciona como antes e não exibe contador. Produtos antigos sem os novos campos continuam compatíveis.

## Observação

Nesta etapa, o contador representa o estoque informado no cadastro e protege o fluxo do catálogo/carrinho. A redução automática do saldo após a confirmação do pedido depende da implementação do fluxo de pedidos e deverá ser feita junto com a revisão das regras e permissões do Firebase.
