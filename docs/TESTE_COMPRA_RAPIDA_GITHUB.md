# Teste isolado da Compra Rápida no GitHub

Este pacote é uma **cópia completa do projeto**, não um clone Git: o ZIP original não contém `.git` nem credenciais de autenticação do GitHub. A configuração Firebase original e os arquivos existentes foram mantidos na cópia entregue. Nenhum repositório foi conectado ou alterado por este processo.

## Atenção antes de publicar

1. **Não teste finalização de pedidos contra o Firebase de produção.** O checkout grava pedidos no Realtime Database. Uma compra de teste com a configuração original pode aparecer no painel e nos registros reais.
2. Crie/use um **projeto Firebase separado para homologação** (Auth, Realtime Database e Storage, se necessários). Migre uma cópia dos dados de catálogo para ele e configure regras equivalentes às planejadas — não use regras abertas como `read, write: if true`.
3. No clone/pasta local usada para teste, substitua apenas a configuração cliente em `js/firebase/firebase-config.js` pelos dados do projeto de homologação. **Não sobrescreva o arquivo original do pacote nem faça commit de credenciais privadas ou service accounts.** A configuração cliente do Firebase não é uma credencial administrativa; permissões dependem das regras Firebase.
4. Para um repositório de teste separado, remova o arquivo `CNAME` somente da cópia de homologação antes de habilitar Pages. O arquivo incluído aponta para o domínio da loja; não associe nem altere o DNS do domínio principal durante o teste. Mantenha `CNAME` intacto no repositório principal.
5. Não publique o painel administrativo em um repositório público sem revisar autenticação e regras Firebase. Prefira repositório privado para o teste.

## Opção recomendada: repositório privado separado

1. Baixe e extraia `catalogo-main-compra-rapida.zip` (o nome do arquivo depende de como foi salvo). Entre na pasta `catalogo-main`; os arquivos do site — `index.html`, `produtos.html`, `CNAME` etc. — ficam diretamente nessa raiz.
2. Faça outra cópia chamada `catalogo-main-homologacao`. Nela, configure o Firebase de homologação em `js/firebase/firebase-config.js` e apague `CNAME`. Não apague nem altere esses arquivos na cópia original.
3. Crie no GitHub um repositório **privado**, por exemplo `catalogo-abella-homologacao`. Suba o conteúdo interno de `catalogo-main-homologacao` para a raiz do repositório; não suba uma pasta externa `catalogo-main/` envolvendo tudo.
4. Use sua sessão GitHub já autenticada localmente, ou conecte o repositório pelo método habitual. Este pacote não leva nem altera tokens, sessão de `gh`, chaves SSH ou configuração global do Git. Nunca cole um token no código, no README ou em uma URL versionada.
5. Se o plano da conta permitir GitHub Pages para esse repositório privado, em **Settings → Pages** selecione **Deploy from a branch** e publique a branch de homologação e a pasta raiz. Não configure domínio personalizado. Se Pages não estiver disponível para o repositório privado, use o teste local abaixo em vez de tornar público o repositório sem revisar a exposição do painel e dos dados.
6. Acesse `https://SEU-USUARIO.github.io/catalogo-abella-homologacao/`. Se a raiz do Pages não abrir por ser um projeto em subcaminho, teste localmente com servidor HTTP simples (abaixo) ou configure a publicação conforme a documentação atual do Pages; não altere links da loja principal somente para compensar o teste.

O pacote mantém sem alterações o arquivo original chamado `.github/workflows`. Como ele não tem extensão `.yml`/`.yaml` e não está dentro de uma pasta `.github/workflows/`, o GitHub Actions normalmente não o interpreta como workflow. Não conte com esse arquivo para publicar o teste; a orientação acima usa Pages pela branch e não renomeia nem ativa automações existentes.

## Teste local antes do Pages

Com Node.js 20+ instalado, na raiz da cópia de homologação:

```bash
npx serve .
```

Abra o endereço local impresso pelo comando. Evite abrir `index.html` diretamente como `file://`, pois os scripts Firebase e a navegação do site precisam de origem HTTP/HTTPS.

## Roteiro funcional

- Home: abra “Compra rápida”; confirme que “Explorar Coleções” continua disponível.
- Compra rápida sem filtro: não deve despejar todos os itens; deve pedir categoria ou busca.
- Escolha uma categoria com subcategorias; confirme que aparecem as subcategorias reais; escolha uma e confira se os produtos correspondem.
- Use “Ver todos desta categoria” apenas quando quiser abrir a categoria completa; confirme busca por nome ou SKU, que pesquisa o catálogo e não exige saber a categoria.
- Adicione um produto simples: confira quantidade e total na barra fixa e na sacola; altere quantidade e remova o item na sacola.
- Produto com variações: confira que “Escolher variação” ainda abre o modal existente e que o produto vai para a mesma sacola.
- Produto com estoque controlado: teste disponível e esgotado usando dados de homologação.
- Alterne para Compra completa e confirme que a navegação e o modal originais continuam funcionando.
- No checkout, use apenas Firebase de homologação; confirme envio e gravação do pedido de teste nesse ambiente.
- Repita em largura de desktop, tablet e celular; confira teclado, foco, botões, cabeçalho, rodapé e a sacola fixa.

## Voltar à versão anterior
Como o teste ocorre em cópia/repositório separado, basta parar o deploy do repositório de homologação ou excluir essa cópia após salvar os resultados. A publicação, o CNAME, o Firebase e a autenticação do repositório principal não são alterados por esse teste.
