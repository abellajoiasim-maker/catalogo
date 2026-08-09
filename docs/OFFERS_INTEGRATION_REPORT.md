# Integração do módulo Ofertas

## Diagnóstico

O painel de Ofertas gravava campanhas em `abella/settings/descontos/regrasCategoria`, mas a página pública de produtos não carregava `ConfigService` nem `DescontoService`. Além disso, o serviço consultava uma propriedade privada inexistente (`ConfigService._cache`) e procurava apenas alguns nomes de campo de categoria. Como resultado, as campanhas eram salvas no Firebase, mas não chegavam ao cálculo dos cards, do modal e do carrinho.

## Correções aplicadas

A página `produtos.html` passou a carregar os serviços de configuração e descontos e aguarda o carregamento das configurações antes de renderizar os produtos. O `ConfigService` agora disponibiliza uma leitura controlada do último cache carregado, sem expor diretamente o estado interno.

O `DescontoService` passou a reconhecer `categoriaId`, `categoryId`, `category`, `categoria`, `subcategoriaId`, `subcategoryId`, `subcategory` e `subcategoria`. Campanhas por subcategoria usam a chave composta `categoria__subcategoria`; campanhas por categoria continuam usando a chave da categoria. Uma campanha específica tem prioridade sobre o desconto global, e o desconto global só é aplicado quando estiver ativo.

O renderizador de cards agora mostra o preço final calculado, o preço anterior e a etiqueta de oferta. Também foram incluídos os campos de preço promocional explícito usados pelo painel de produtos: `promocao`, `promo` e `precoPromocional`.

## Validação

Foram executados testes automatizados para campanhas de categoria, subcategoria, desconto global e preço promocional explícito. Todos foram aprovados. Também foram validados os scripts JavaScript e as páginas principais.

## Observação operacional

As regras do Firebase não foram alteradas. Para que uma nova campanha apareça no catálogo, o painel deve salvar a oferta e o usuário deve recarregar a página pública para que o cache seja atualizado. A blindagem das regras de acesso permanece como etapa separada.
