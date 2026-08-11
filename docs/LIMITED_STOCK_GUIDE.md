# Estoque limitado para produtos do saldão

## Onde configurar

O painel usado pelo catálogo é `admin/admin.html`. Dentro dele, clique em **Editor Visual**. O painel abrirá `modulo/editor.html` em um iframe. Na aba **Produtos**, clique em **Novo Produto** ou edite um produto existente e role o formulário até o bloco **Estoque limitado**.

## Como usar

Crie ou edite a categoria promocional no painel de categorias e informe o nome desejado, por exemplo: `Saldão — Últimas Unidades`. Depois, no cadastro do produto do saldão, configure os três controles:

| Controle | Função |
|---|---|
| **Ativar estoque limitado** | Habilita o limite para aquela peça. |
| **Quantidade disponível** | Define o saldo máximo permitido. |
| **Exibir contador de estoque no grid de produtos** | Mostra ou oculta a mensagem de quantidade nos cards públicos. O limite continua valendo mesmo quando a mensagem fica oculta. |
| **Permitir venda mesmo sem estoque** | Permite vender quando a quantidade chegar a zero. Deixe desativado para bloquear a venda ao atingir o limite. |

Depois de configurar, clique em **Salvar Alterações**.

## Comportamento público

Quando o seletor está ativo, o catálogo mostra no card a quantidade disponível ou o estado `Esgotado`. O modal de compra mostra o saldo e impede selecionar uma quantidade maior que o estoque informado. O carrinho também bloqueia novas adições que ultrapassem o limite, inclusive quando o mesmo produto é adicionado em momentos diferentes ou em variações distintas.

Quando **Ativar estoque limitado** está desativado, o produto funciona como antes. Produtos antigos sem os novos campos continuam compatíveis. Os campos persistidos são `estoqueControlado`, `estoqueQuantidade`, `mostrarEstoqueGrid` e `venderSemEstoque`.

## Observação

Nesta etapa, o contador representa o estoque informado no cadastro e protege o fluxo do catálogo/carrinho. A redução automática do saldo após a confirmação do pedido depende da implementação do fluxo de pedidos e deverá ser feita junto com a revisão das regras e permissões do Firebase.
