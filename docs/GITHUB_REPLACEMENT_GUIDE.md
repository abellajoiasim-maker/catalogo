# Guia para substituir o projeto antigo no GitHub

## Antes de começar

Faça o procedimento em uma pasta local e mantenha o projeto antigo intacto até confirmar que o novo está funcionando. Não apague o repositório antigo antes de criar um backup ou uma tag de segurança.

O pacote deve ser extraído. Dentro dele existe a pasta `catalogo-main`; os arquivos que irão para o GitHub são os arquivos **dentro** dessa pasta, não a pasta contêiner adicional.

## Opção recomendada: preservar o repositório e substituir o conteúdo

### 1. Baixe e extraia o pacote

Extraia `catalogo-main-refatorado(2).zip` em uma pasta local. Renomeie a pasta extraída para `catalogo-main-novo` para não confundi-la com o clone antigo.

### 2. Faça um backup do projeto antigo

No terminal, dentro da pasta onde ficam seus projetos:

```bash
mv catalogo-main catalogo-main-backup-$(date +%Y%m%d-%H%M%S)
```

Se o projeto antigo estiver em um clone Git, é ainda melhor criar uma tag antes da troca:

```bash
cd catalogo-main-backup-AAAAmmdd-HHMMSS
git tag backup-antes-da-refatoracao
git push origin backup-antes-da-refatoracao
```

Substitua o nome da pasta pelo nome real criado no seu computador.

### 3. Coloque o novo projeto no mesmo local

Mova a pasta nova para o nome usado pelo projeto:

```bash
mv catalogo-main-novo catalogo-main
cd catalogo-main
```

Confirme que estes arquivos estão diretamente na raiz:

```bash
ls index.html produtos.html subcategorias.html CNAME package.json
```

O arquivo `CNAME` deve continuar contendo:

```text
catalogo.abellajoias.com.br
```

### 4. Inicialize o Git local

Se o ZIP não tiver a pasta `.git`, execute:

```bash
git init
git branch -M main
git add .
git commit -m "refactor: consolidar catalogo e corrigir fluxo de produtos"
```

Se a pasta já contiver `.git`, não execute `git init`; apenas confira o estado:

```bash
git status
git branch --show-current
```

### 5. Crie um backup remoto opcional

Antes de substituir o conteúdo no GitHub, crie uma tag no repositório antigo ou um branch de backup:

```bash
git fetch origin
git checkout -b backup/antes-da-refatoracao

git push -u origin backup/antes-da-refatoracao
```

Volte para a branch principal:

```bash
git checkout main
```

### 6. Conecte o novo projeto ao repositório existente

Use a URL real do seu repositório:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

Se já existir um `origin` apontando para o endereço correto, não adicione outro. Confira:

```bash
git remote -v
```

Se estiver incorreto, substitua:

```bash
git remote set-url origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

### 7. Substitua o conteúdo remoto

Depois de confirmar que o commit local contém o projeto correto:

```bash
git add .
git commit -m "refactor: publicar versao consolidada do catalogo"
git push -u origin main
```

Se o Git bloquear porque o remoto possui histórico diferente, **não use `--force` imediatamente**. Primeiro faça:

```bash
git fetch origin
git log --oneline --decorate --graph --all -20
```

Se o objetivo for substituir deliberadamente o conteúdo remoto e você já tiver backup, prefira o push protegido:

```bash
git push --force-with-lease origin main
```

Use `--force-with-lease` somente após confirmar que ninguém publicou mudanças novas no repositório.

## Opção alternativa: manter o histórico antigo e trocar os arquivos manualmente

Esta é a opção mais segura quando o repositório antigo já está conectado a deploy, colaboradores ou configurações importantes.

Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git catalogo-main
cd catalogo-main
```

Crie uma branch de backup:

```bash
git checkout -b backup/antes-da-refatoracao
git push -u origin backup/antes-da-refatoracao
git checkout main
```

Apague somente os arquivos rastreados antigos, mantendo `.git`, e copie para a raiz o conteúdo interno de `catalogo-main` do pacote novo. No Linux/macOS:

```bash
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R ../catalogo-main-novo/. .
```

Depois valide e publique:

```bash
npm run seo:sitemap
npm run seo:merchant
git add .
git commit -m "refactor: substituir catalogo pela versao revisada"
git push origin main
```

No Windows, faça a mesma operação pelo Explorador de Arquivos, mas preserve a pasta oculta `.git`.

## Configuração do GitHub Pages

No GitHub, abra **Settings → Pages**. Em **Build and deployment**, selecione **Deploy from a branch**. Escolha a branch `main` e a pasta `/ (root)`. Salve.

Se o domínio personalizado for usado, mantenha `CNAME` na raiz. No provedor DNS, confirme um registro CNAME apontando `catalogo.abellajoias.com.br` para `SEU_USUARIO.github.io`, conforme o usuário real do GitHub. Não remova o domínio antigo até o novo deploy estar disponível.

Depois que o DNS estiver correto, habilite **Enforce HTTPS** quando o GitHub liberar a opção.

## Checklist após o deploy

Abra o domínio em uma janela anônima e confirme:

- Home com categorias.
- Clique em categoria e depois em subcategoria.
- Página de produtos com banner vitrine no topo e produtos da subcategoria abaixo.
- Imagem no modal de compra.
- Preço e selo de ofertas.
- Carrinho e checkout.
- Links de retorno de todos os módulos administrativos.
- Sitemap e robots.txt.
- Console do navegador sem erros críticos.

Antes de liberar o painel para uso, faça a etapa separada de revisão das regras do Firebase: Authentication, Realtime Database e Storage. Não publique regras permissivas como `read, write: if true`.
