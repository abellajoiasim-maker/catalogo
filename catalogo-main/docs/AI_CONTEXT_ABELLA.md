# AI_CONTEXT_ABELLA.md

# CONTEXTO OFICIAL DO PROJETO

## ABELLA JOIAS

Última atualização: 01/07/2026 (revisado a partir do código-fonte real do repositório `abellajoiasim-maker/catalogo`, branch `main`)

---

# IDENTIFICAÇÃO

Projeto:

Abella Joias

Tipo:

Catálogo + Loja Atacado (Atacado de Joias no Bruto e Semijoias)

Hospedagem:

GitHub Pages

Banco:

Firebase Realtime Database

Storage:

Firebase Storage

Repositório:

https://github.com/abellajoiasim-maker/catalogo

---

# FIREBASE

Projeto:

catalogo-abella-joias

Database:

https://catalogo-abella-joias-default-rtdb.firebaseio.com

Storage:

catalogo-abella-joias.firebasestorage.app

authDomain:

catalogo-abella-joias.firebaseapp.com

appId:

1:727568435294:web:442c0179ecf0686dff4ccf

---

# ARQUITETURA OFICIAL

Raiz obrigatória:

abella

Toda consulta deve utilizar:

getAbellaPath()

Exemplo correto:

db.ref(getAbellaPath('products'))

Exemplo incorreto:

db.ref('abella/products')

Config canônica:

js/firebase/firebase-config.js

⚠️ INCONSISTÊNCIA DETECTADA (auditar):

`admin/admin-logic.js` declara seu **próprio** `firebaseConfig` local e reinicializa o Firebase de forma independente, em vez de reutilizar `window.firebaseApp` / `window.db` gerados por `firebase-config.js`. Isso viola a regra "Nunca criar firebaseConfig local" descrita mais abaixo. Deve ser tratado como item prioritário de refatoração/auditoria.

---

# HELPERS GLOBAIS

Disponíveis globalmente (definidos em `js/firebase/firebase-config.js`):

window.db

window.storage

window.auth

window.firebaseApp

window.getAbellaPath()

window.ABELLA_DB_ROOT

window.STORE_NAME

window.__ABELLA_FIREBASE_CONNECTED__

window.__ABELLA_FIREBASE_INITIALIZED__

Evento de conexão em tempo real:

`window.addEventListener('abella-connection', (e) => e.detail.connected)`

---

# ESTRUTURA OFICIAL DO BANCO

```
abella
│
├── products
├── categories
│     └── {slug}/subcategories/{slug}
├── orders
├── galvanicas
└── settings
```

---

# PRODUCTS

Path: `abella/products` (via `getAbellaPath('products')`)

Serviço responsável: `js/services/produtoService.js` (`ProdutoService.normalizarProduto`)

Estrutura normalizada real (campos espelhados em PT/EN para compatibilidade retroativa):

```json
{
  "id": "",
  "codigo": "",
  "sku": "",
  "nome": "",
  "name": "",
  "descricao": "",
  "precoOriginal": 0,
  "preco": 0,
  "price": 0,
  "precoFinal": 0,
  "imagem": "",
  "image": "",
  "categoriaId": "",
  "category": "",
  "subcategoriaId": "",
  "subcategory": "",
  "ativo": true,
  "paused": false,
  "estoque": 0,
  "destaque": false,
  "variacoes": [],
  "dizeres": [],
  "iniciais": [],
  "sayings": [],
  "initials": [],
  "peso": 0,
  "weight": 0,
  "metadados": {
    "finish": "",
    "loop": ""
  },
  "createdAt": 0
}
```

Regras:

- `paused = true` → Produto oculto na vitrine
- `paused = false` / `ativo = true` → Produto ativo
- `dizeres`/`iniciais` (e seus espelhos `sayings`/`initials`) suportam produtos personalizáveis (ex: pingentes com nome/frase)
- `metadados.finish` e `metadados.loop` guardam acabamento e tipo de passador
- Preço final exibido ao cliente pode ainda sofrer ajuste do `descontoService` (ver seção SETTINGS → descontos)

> Observação: campos antigos como `promo`, `variacaoTipo`, `opcoesPersonalizadas` e `updatedAt` citados em versões anteriores deste documento **não aparecem** no normalizador atual de `produtoService.js`. Se existirem em registros legados no banco, tratar como dados legados e não quebrar compatibilidade de leitura, mas não são mais gerados por escrita nova.

---

# CATEGORIES

Path: `abella/categories`

Serviço responsável: `js/services/categoriaService.js` (`normalizarCategoria`)

```json
{
  "id": "",
  "slug": "",
  "name": "",
  "nome": "",
  "image": "",
  "imagem": "",
  "imageOriginal": "",
  "order": 0,
  "ordem": 0,
  "active": true,
  "ativo": true,
  "subcategories": {},
  "createdAt": 0,
  "updatedAt": 0
}
```

## SUBCATEGORIES

Path: `abella/categories/{slug}/subcategories/{slug}`

Serviço responsável: `js/services/subcategoriaService.js` (`normalizarSubcategoria`)

```json
{
  "id": "",
  "slug": "",
  "name": "",
  "image": "",
  "paused": false,
  "active": true,
  "order": 0,
  "createdAt": 0,
  "updatedAt": 0
}
```

---

# ORDERS

Path: `abella/orders`

Serviço responsável: `js/services/pedidoService.js` (`normalizarPedido` / `normalizarItem`)

```json
{
  "id": "",
  "numeroPedido": "",
  "cliente": "",
  "whats": "",
  "cidade": "",
  "formaPagamento": "PIX",
  "observacoes": "",
  "subtotal": 0,
  "desconto": 0,
  "frete": 0,
  "total": 0,
  "totalPix": 0,
  "pesoTotal": 0,
  "totalPecas": 0,
  "status": "Recebido",
  "entrega": {
    "nome": "",
    "endereco": "",
    "numero": "",
    "bairro": "",
    "cidade": ""
  },
  "romaneio": {
    "subtotal": 0,
    "desconto": 0,
    "totalPix": 0,
    "pesoTotal": 0,
    "totalPecas": 0
  },
  "itens": []
}
```

Item do pedido:

```json
{
  "id": "",
  "sku": "",
  "nome": "",
  "image": "",
  "categoria": "",
  "subcategoria": "",
  "precoFinal": 0,
  "peso": 0,
  "quantidade": 1,
  "variacao": ""
}
```

Status:

`status` é uma string livre normalizada com fallback padrão `"Recebido"` (não é um enum fechado no código atual). Confirmar no painel `modulo/pedidos.html` quais valores o time realmente usa no fluxo operacional antes de tratar como enum fixo em novas features.

> Observação: a estrutura antiga descrita anteriormente (`data`, `pesoTotal` direto na raiz sem `romaneio`, `entrega.rua/local`) foi substituída por um objeto mais rico com `romaneio` (resumo financeiro/logístico duplicado para impressão) e `entrega.endereco/numero/bairro/cidade` (sem mais `rua`/`local`).

---

# GALVANICAS  *(não documentado nas versões anteriores)*

Path: `abella/galvanicas`

Serviço responsável: `js/services/galvanicaService.js`

Representa o diretório de **empresas parceiras de galvanoplastia** (acabamento/banho das joias em bruto), exibido publicamente em `galvanicas.html` e gerenciado no painel `modulo/galvanicas.html`.

```json
{
  "id": "",
  "nome": "",
  "selo": "PARCEIRO",
  "whatsapp": "",
  "telefone": "",
  "descricao": "",
  "endereco": "",
  "imagem": "",
  "image": "",
  "active": true,
  "createdAt": 0,
  "updatedAt": 0
}
```

Regra de negócio embutida: `verificarFreteGratis(totalPedido)` retorna `true` quando `totalPedido >= 100` — usado no contexto de galvânicas parceiras.

---

# SETTINGS

Path: `abella/settings`

Serviço responsável: `js/services/configService.js` (`ConfigService`, `SETTINGS_PATH = 'abella/settings'`)

⚠️ Estrutura **totalmente diferente** da documentada em versões anteriores. Estrutura real (`DEFAULT_SETTINGS`):

```json
{
  "nomeEmpresa": "Abella Joias",
  "slogan": "Atacado de Joias no Bruto e Semi-joias",
  "logo": "",
  "banner": "",
  "whatsEmpresa": "5519988207658",
  "email": "",
  "instagram": "",
  "endereco": "",
  "parcelasMax": 6,
  "pixDesc": 5,
  "descontos": {
    "ativo": false,
    "porcentagem": 0,
    "regrasCategoria": {}
  },
  "cores": {
    "primaria": "#caa85c",
    "secundaria": "#000000",
    "fundo": "#000000",
    "texto": "#ffffff"
  }
}
```

Regras:

- `descontos.ativo = true` habilita desconto global (`descontos.porcentagem`)
- `descontos.regrasCategoria[slugCategoria] = { ativo, porcentagem }` permite desconto específico por categoria, com prioridade sobre o desconto global (ver `descontoService.js` → `obterPercentualPromocao`)
- `cores.*` alimenta o tema visual dinâmico do catálogo
- Campos antigos (`statusLoja`, `pedidoMinimo`, `freteFixo`, `freteGratisAlvo`, `pix`, `parcelas`, `bannerAtivo`, `bannerTexto`, `ultimaAtualizacao`) **não existem** no `configService.js` atual. Se ainda usados em alguma tela específica, tratar como legado a ser migrado/removido — não inventar novas leituras desses campos sem confirmar no código.

---

# STORAGE

Estrutura observada (via `js/utils/image-helper.js` e `js/utils/storage.js`):

```
images/
├── banners/
├── categorias/
└── produtos/
```

Suporte a URLs:

- `https://` (URL pública direta)
- `gs://` (convertido para URL pública via helper quando necessário)

`js/utils/image-helper.js` é a fonte da verdade para resolução de imagem (slugs, mapeamentos, fallback), usado por `produtoCard.js`, `categoriaCard.js` e `categoriaService.js` (`resolverImagem`).

---

# REGRAS DE DESENVOLVIMENTO

Nunca recriar Firebase.

Nunca chamar `initializeApp` novamente.

Nunca criar `firebaseConfig` local.

Utilizar sempre a configuração global (`js/firebase/firebase-config.js`).

> ⚠️ Ver seção "ARQUITETURA OFICIAL" acima: `admin/admin-logic.js` hoje viola esta regra e precisa ser auditado/corrigido.

---

# REGRA DE CONSULTAS

Correto:

```js
db.ref(getAbellaPath('products'))
db.ref(getAbellaPath('orders'))
db.ref(getAbellaPath('categories'))
db.ref(getAbellaPath('settings'))
db.ref(getAbellaPath('galvanicas'))
```

Incorreto:

```js
db.ref('abella/products')
db.ref('products')
```

---

# ARQUITETURA DE ARQUIVOS (mapa real do repositório)

```
catalogo/
├── index.html                 → Vitrine / catálogo público
├── produtos.html               → Listagem de produtos por categoria
├── subcategorias.html          → Listagem de subcategorias
├── carrinho.html                → Carrinho de compras
├── checkout.html                → Finalização de pedido / romaneio
├── galvanicas.html              → Diretório público de galvânicas parceiras
├── importador.html              → "Super Importador Premium" (importação em massa de produtos)
├── admin/
│   ├── admin.html                → Painel administrativo (login/acesso)
│   └── admin-logic.js            → Lógica do painel admin (⚠️ Firebase local duplicado)
├── modulo/                       → Painel interno de gestão (uso operacional/lojista)
│   ├── config.html               → Configurações da loja (settings)
│   ├── editor.html               → "Super Editor V7" — gestão avançada de produtos/categorias
│   ├── galvanicas.html            → Painel corporativo de galvânicas parceiras
│   ├── impressao-pedido.html      → Impressão de romaneio
│   ├── ofertas.html               → Painel comercial (descontos/ofertas)
│   ├── pedidos.html               → Gestão/impressão de romaneio de pedidos
│   └── js/
│       ├── categoriaModule.js
│       ├── drawer.js               → Painel lateral responsivo (compartilhado)
│       ├── editorApp.js            → Orquestrador do Super Editor V7
│       ├── produtoModule.js
│       └── subcategoriaModule.js
├── js/
│   ├── firebase/
│   │   └── firebase-config.js     → Config canônica do Firebase (fonte da verdade)
│   ├── services/
│   │   ├── carrinhoService.js
│   │   ├── catalogService.js       → Agregação/leitura unificada do catálogo
│   │   ├── categoriaService.js
│   │   ├── checkout.js
│   │   ├── configService.js        → Único dono de abella/settings
│   │   ├── descontoService.js      → Cálculo de descontos/PIX por categoria
│   │   ├── galvanicaService.js
│   │   ├── pedidoService.js
│   │   ├── produtoService.js
│   │   ├── stateManager.js         → Estado reativo global / barramento de eventos
│   │   └── subcategoriaService.js
│   ├── components/
│   │   ├── categoriaCard.js
│   │   ├── header.js
│   │   ├── modalProduto.js
│   │   ├── produtoCard.js
│   │   └── progresso.js
│   └── utils/
│       ├── image-helper.js
│       ├── money.js                → Aritmética monetária segura (evita erro de ponto flutuante)
│       ├── peso.js                  → Aritmética de peso segura
│       └── storage.js
└── docs/
    └── AI_CONTEXT_ABELLA.md        → Este arquivo
```

Nota curiosa (não crítica, mas relevante para auditoria): o comentário de cabeçalho de `modulo/js/drawer.js` menciona "Abella Joias / Luary Shop / Marcinha Semijoias", sugerindo que este componente pode ter origem em um template/base de código compartilhado entre múltiplas lojas. Confirmar se há qualquer resquício de configuração de outra loja antes de generalizar o componente.

---

# SEGURANÇA

Estado atual:

Realtime Database aberto.

Regras:

```
.read = true
.write = true
```

Considerar ambiente sem autenticação obrigatória.

Qualquer funcionalidade crítica deve validar dados no frontend.

`admin/admin.html` + `admin-logic.js` implementam alguma forma de controle de acesso ao painel — auditar se é apenas cosmético (client-side) já que as regras do RTDB estão abertas para qualquer cliente.

---

# CHECKOUT

Serviço: `js/services/checkout.js` + `js/services/pedidoService.js`

Toda auditoria deve validar:

- subtotal
- total
- desconto
- totalPix
- frete
- pesoTotal / totalPecas
- gravação correta em `orders` (estrutura com `entrega` e `romaneio`)

Qualquer divergência financeira:

Classificar como ERRO CRÍTICO.

---

# CARRINHO

Serviço: `js/services/carrinhoService.js`

Toda auditoria deve validar:

- quantidade
- remoção
- persistência
- atualização de preços (integração com `descontoService.js`)
- atualização de peso

---

# EDITOR (Super Editor V7)

Arquivos: `modulo/editor.html`, `modulo/js/editorApp.js`, `modulo/js/produtoModule.js`, `modulo/js/categoriaModule.js`, `modulo/js/subcategoriaModule.js`

Toda auditoria deve validar:

- upload
- edição
- atualização
- status `paused`/`ativo`
- categoria / subcategoria
- imagens
- dizeres / iniciais (personalização de produto)

---

# INSTRUÇÃO PARA FUTURAS AUDITORIAS

Assuma que:

Firebase já está auditado — **exceto** `admin/admin-logic.js`, que precisa de revisão (config duplicada).

Services já estão auditados quanto à estrutura de dados documentada aqui.

Helpers já estão auditados.

Foque apenas no arquivo enviado pelo usuário.

Nunca inventar coleções.

Nunca inventar campos.

Nunca inventar serviços.

Sempre utilizar as estruturas descritas neste documento — elas foram extraídas diretamente do código-fonte real (`produtoService.js`, `categoriaService.js`, `subcategoriaService.js`, `pedidoService.js`, `galvanicaService.js`, `configService.js`), não de suposições.

Se encontrar divergência entre este documento e o código durante uma auditoria, o **código é a fonte da verdade**; atualizar este documento em seguida.
