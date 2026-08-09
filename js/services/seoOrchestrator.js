// js/services/seoOrchestrator.js
class SeoOrchestrator {
  constructor() {
    this.version = "1.0.0-IQ200";
  }

  async processProductPipeline(productId, productData) {
    console.log(`[IQ200 Orchestrator] Executando pipeline para o produto: ${productId}`);

    const slug = this.generateSlug(productData.nome);
    const seoPayload = this.buildSeoPayload(productData, slug);
    const ogPayload = this.buildOpenGraphPayload(productData, slug);
    const merchantPayload = this.buildMerchantPayload(productData);
    const schemaPayload = this.buildSchemaPayload(productData, slug);

    return {
      slug,
      seo: seoPayload,
      openGraph: ogPayload,
      merchant: merchantPayload,
      schemas: schemaPayload,
      updatedAt: new Date().toISOString()
    };
  }

  generateSlug(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  buildSeoPayload(product, slug) {
    return {
      title: `${product.nome} | Atacado Abella Joias`,
      description: product.descricao || `Compre ${product.nome} no atacado direto de fábrica em Limeira.`,
      canonical: `https://catalogo.abellajoias.com.br/produto/${slug}`,
      robots: "index, follow"
    };
  }

  buildOpenGraphPayload(product, slug) {
    return {
      ogTitle: `${product.nome} | Abella Joias`,
      ogDescription: product.descricao || "Atacado de Joias no Bruto.",
      ogImage: product.imagemPrincipal || `https://catalogo.abellajoias.com.br/images/produto-vitrine/${slug}.jpg`,
      ogUrl: `https://catalogo.abellajoias.com.br/produto/${slug}`,
      ogType: "product"
    };
  }

  buildMerchantPayload(product) {
    return {
      availability: product.estoque > 0 ? "in_stock" : "out_of_stock",
      condition: "new",
      brand: "Abella Joias",
      price: product.preco || 0
    };
  }

  buildSchemaPayload(product, slug) {
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.nome,
      "image": [product.imagemPrincipal],
      "description": product.descricao,
      "brand": {
        "@type": "Brand",
        "name": "Abella Joias"
      },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "BRL",
        "price": product.preco,
        "availability": "https://schema.org/InStock"
      }
    };
  }
}

export const iq200Orchestrator = new SeoOrchestrator();
