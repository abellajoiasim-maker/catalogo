# Atualização: estoque individual por variação — Abella Joias

## Arquivos incluídos

Extraia este pacote na raiz do projeto, mantendo a estrutura de pastas e substituindo os arquivos correspondentes:

- `modulo/editor.html`
- `produtos.html`
- `js/services/carrinhoService.js`
- `carrinho.html`
- `checkout.html`

Antes de substituir, faça uma cópia de segurança dos cinco arquivos atuais.

## O que foi alterado

- O editor salva a quantidade individual de cada medida e registra o estado `Esgotado` quando o saldo chega a zero.
- O catálogo mostra `Esgotado` na variação sem saldo e impede selecioná-la, salvo quando a opção explícita `vender sem estoque` estiver ativa.
- Carrinho e checkout revalidam os saldos antes de concluir o fluxo.
- Ao gravar um pedido no checkout, o sistema baixa o saldo individual da variação no Firebase por transação; se também houver estoque global controlado, respeita e atualiza os dois saldos.
- A transação evita saldo negativo em compras simultâneas. Um identificador por pedido evita uma segunda baixa do mesmo pedido. Se uma baixa parcial falhar antes da conclusão, o sistema tenta estornar as baixas já feitas e marca o pedido como não confirmado.
- O fluxo de envio de sacola pelo WhatsApp não baixa estoque: a baixa ocorre no checkout, quando o registro do pedido é criado. O pedido é inicialmente salvo como `Processando estoque` e passa para `Novo` após a atualização do saldo.

## Atenção: permissões e segurança do Firebase

Para produtos com estoque controlado, o checkout precisa conseguir ler e gravar o nó correspondente em `abella/products/{id}` para executar a transação. Este projeto não inclui regras do Realtime Database nem Cloud Functions; por isso, confirme as regras atuais antes de publicar. **Não** resolva uma falha de permissão liberando escrita pública para todos os produtos.

A transação protege contra concorrência acidental, mas a baixa roda no navegador. Para uma garantia de segurança contra clientes modificados, o próximo passo recomendado é mover a operação para uma Cloud Function/backend confiável e restringir as regras do Firebase. Se a gravação da transação for negada, o checkout cancela a tentativa em vez de concluir o pedido sem confirmar o estoque.

A baixa acontece quando o pedido é criado no sistema e antes da abertura do WhatsApp; não significa confirmação de pagamento. Cancelar posteriormente um pedido já criado não devolve estoque automaticamente — essa rotina deve ser adicionada separadamente se fizer parte do processo da loja.
