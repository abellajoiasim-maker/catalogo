# AI_CONTEXT_ABELLA.md

# CONTEXTO OFICIAL DO PROJETO

## ABELLA JOIAS

Última atualização: Junho/2026

---

# IDENTIFICAÇÃO

Projeto:

Abella Joias

Tipo:

Catálogo + Loja Atacado

Hospedagem:

GitHub Pages

Banco:

Firebase Realtime Database

Storage:

Firebase Storage

---

# FIREBASE

Projeto:

catalogo-abella-joias

Database:

https://catalogo-abella-joias-default-rtdb.firebaseio.com

Storage:

catalogo-abella-joias.firebasestorage.app

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

---

# HELPERS GLOBAIS

Disponíveis globalmente:

window.db

window.storage

window.auth

window.firebaseApp

window.getAbellaPath()

window.ABELLA_DB_ROOT

window.**ABELLA_FIREBASE_CONNECTED**

window.**ABELLA_FIREBASE_INITIALIZED**

---

# ESTRUTURA OFICIAL DO BANCO

abella
│
├── products
├── categories
├── orders
└── settings

---

# PRODUCTS

Estrutura padrão:

{
"id": "",
"sku": "",
"name": "",
"nome": "",
"category": "",
"price": 0,
"precoFinal": 0,
"promo": 0,
"peso": 0,
"weight": 0,
"image": "",
"imagem": "",
"paused": false,
"variacaoTipo": "",
"opcoesPersonalizadas": "",
"createdAt": 0,
"updatedAt": 0
}

Regras:

paused=true

Produto oculto

paused=false

Produto ativo

---

# CATEGORIES

Estrutura:

{
"name": "",
"slug": "",
"paused": false,
"subcategories": {}
}

Subcategoria:

{
"name": "",
"slug": "",
"paused": false
}

---

# ORDERS

Estrutura:

{
"cliente": "",
"cidade": "",
"data": "",
"formaPagamento": "",
"status": "Novo",
"pesoTotal": 0,
"total": 0,
"entrega": {
"bairro": "",
"cidade": "",
"local": "",
"numero": "",
"rua": ""
},
"itens": {}
}

Item:

{
"image": "",
"nome": "",
"peso": 0,
"preco": 0,
"quantidade": 0,
"sku": ""
}

---

# SETTINGS

Estrutura:

{
"name": "Abella Joias",
"slogan": "",
"whatsapp": "",
"statusLoja": "aberto",
"pedidoMinimo": 300,
"freteFixo": 15,
"freteGratisAlvo": 100,
"pix": 10,
"parcelas": 10,
"bannerAtivo": true,
"bannerTexto": "",
"ultimaAtualizacao": ""
}

---

# STORAGE

Estrutura atual:

images/
├── banners/
├── categorias/
└── produtos/

Suporte a URLs:

https://

Suporte a URLs Storage:

gs://

Converter gs:// para URL pública quando necessário.

---

# REGRAS DE DESENVOLVIMENTO

Nunca recriar Firebase.

Nunca chamar initializeApp novamente.

Nunca criar firebaseConfig local.

Utilizar sempre a configuração global.

---

# REGRA DE CONSULTAS

Correto:

db.ref(getAbellaPath('products'))

db.ref(getAbellaPath('orders'))

db.ref(getAbellaPath('categories'))

db.ref(getAbellaPath('settings'))

Incorreto:

db.ref('abella/products')

db.ref('products')

---

# REGRAS DE REFATORAÇÃO

Ao auditar arquivos:

1. Não alterar estrutura do banco.

2. Não alterar nomes dos nós.

3. Não alterar campos existentes.

4. Preservar compatibilidade com pedidos antigos.

5. Preservar compatibilidade com produtos antigos.

6. Preservar compatibilidade com categorias antigas.

7. Preservar compatibilidade com Storage atual.

---

# SEGURANÇA

Estado atual:

Realtime Database aberto.

Regras:

.read = true

.write = true

Considerar ambiente sem autenticação obrigatória.

Qualquer funcionalidade crítica deve validar dados no frontend.

---

# CHECKOUT

Toda auditoria deve validar:

* total
* subtotal
* descontos
* PIX
* frete
* pedido mínimo
* gravação correta em orders

Qualquer divergência financeira:

Classificar como ERRO CRÍTICO.

---

# CARRINHO

Toda auditoria deve validar:

* quantidade
* remoção
* persistência
* atualização de preços
* atualização de peso

---

# EDITOR

Toda auditoria deve validar:

* upload
* edição
* atualização
* status paused
* categoria
* subcategoria
* imagens

---

# INSTRUÇÃO PARA FUTURAS AUDITORIAS

Assuma que:

Firebase já está auditado.

Services já estão auditados.

Helpers já estão auditados.

Foque apenas no arquivo enviado pelo usuário.

Nunca inventar coleções.

Nunca inventar campos.

Nunca inventar serviços.

Sempre utilizar as estruturas descritas neste documento.
