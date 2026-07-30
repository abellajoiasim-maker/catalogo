// Central SEO IQ200 - Orquestrador de Metadados e Dados Estruturados
class CentralSeoIQ200 {
  constructor(config = {}) {
    this.siteName = config.siteName || "Abella Joias";
    this.defaultImage = config.defaultImage || "https://sualoja.com/assets/default-share.jpg";
  }

  // Atualiza todas as tags de SEO e Redes Sociais com base no produto ativo
  atualizarMetaProduto(produto) {
    if (!produto) return;

    const tituloFormatado = `${produto.nome} | ${this.siteName}`;
    const descricaoFormatada = produto.descricao || `Compre ${produto.nome} no atacado com os melhores preços.`;
    const imagemProduto = produto.imagemUrl || this.defaultImage;
    const urlAtual = window.location.href;

    // 1. SEO Básicos
    document.title = tituloFormatado;
    this.definirMetaTag('name', 'description', descricaoFormatada);
    this.definirMetaTag('name', 'robots', 'index, follow');

    // 2. Open Graph (WhatsApp, Facebook, Instagram)
    this.definirMetaTag('property', 'og:title', tituloFormatado);
    this.definirMetaTag('property', 'og:description', descricaoFormatada);
    this.definirMetaTag('property', 'og:image', imagemProduto);
    this.definirMetaTag('property', 'og:url', urlAtual);
    this.definirMetaTag('property', 'og:type', 'product');

    // 3. Twitter Card
    this.definirMetaTag('name', 'twitter:card', 'summary_large_image');
    this.definirMetaTag('name', 'twitter:title', tituloFormatado);
    this.definirMetaTag('name', 'twitter:description', descricaoFormatada);
    this.definirMetaTag('name', 'twitter:image', imagemProduto);

    // 4. Dados Estruturados JSON-LD (Google Shopping / Rich Snippets)
    this.injetarJsonLd(produto, urlAtual, imagemProduto);
  }

  // Utilitário para criar ou atualizar meta tags dinamicamente no Head
  definirMetaTag(atributo, valorAtributo, conteudo) {
    let element = document.querySelector(`meta[${atributo}="${valorAtributo}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(atributo, valorAtributo);
      document.head.appendChild(element);
    }
    element.setAttribute('content', conteudo);
  }

  // Injeção de Dados Estruturados Schema.org para e-commerce
  injetarJsonLd(produto, url, imagem) {
    let scriptId = 'seo-iq200-jsonld';
    let scriptElement = document.getElementById(scriptId);
    
    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    const jsonLdData = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": produto.nome,
      "image": [imagem],
      "description": produto.descricao || produto.nome,
      "sku": produto.id || "",
      "brand": {
        "@type": "Brand",
        "name": this.siteName
      },
      "offers": {
        "@type": "Offer",
        "url": url,
        "priceCurrency": "BRL",
        "price": produto.preco || "0.00",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock"
      }
    };

    scriptElement.textContent = JSON.stringify(jsonLdData);
  }
}

// Instância global pronta para uso nos modais ou páginas de produtos
const seoIQ200 = new CentralSeoIQ200({ siteName: "Abella Joias" });
