# Decisão de arquitetura — catalogo-main

## Arquitetura oficial

A implementação oficial do site será a estrutura da **raiz do repositório**, composta pelas páginas `index.html`, `produtos.html`, `subcategorias.html`, `carrinho.html`, `checkout.html` e `galvanicas.html`, pelos componentes compartilhados em `components/`, pelo engine em `engine/`, pelos tokens em `tokens.css` e pelos serviços/utilitários em `js/`.

## Motivo da decisão

A raiz já é a estrutura usada pelo GitHub Pages e pelas referências canônicas de SEO. Ela também possui os componentes compartilhados diretamente no local esperado pelos documentos do projeto. A pasta `luxury-v11/` contém uma segunda cópia do catálogo, componentes, engine e temas, e sua própria documentação orienta copiar essa versão para a raiz. Isso caracteriza uma implementação de transição/protótipo, não uma segunda aplicação que deva permanecer publicada em paralelo.

## Tratamento da duplicidade

A pasta `luxury-v11/` foi removida da árvore de publicação do projeto e preservada no ponto de restauração externo criado antes da refatoração. A remoção evita que duas versões do catálogo sejam indexadas, corrigidas de forma divergente ou mantidas por engano.

## Fora do escopo desta etapa

As regras do Firebase, as permissões do Realtime Database, o Storage e a blindagem da autenticação não foram alterados nesta fase. A configuração canônica continua em `js/firebase/firebase-config.js` e será tratada em uma etapa específica.
