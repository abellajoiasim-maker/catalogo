// js/services/seoInjector.js
export class SeoInjector {
  static applyMetaTags(seoData, ogData, schemaData) {
    if (!seoData) return;

    // 1. Title & Description
    document.title = seoData.title;
    this.setMetaTag('name', 'description', seoData.description);
    this.setMetaTag('rel', 'canonical', seoData.canonical);

    // 2. Open Graph (WhatsApp / Redes Sociais)
    if (ogData) {
      this.setMetaTag('property', 'og:title', ogData.ogTitle);
      this.setMetaTag('property', 'og:description', ogData.ogDescription);
      this.setMetaTag('property', 'og:image', ogData.ogImage);
      this.setMetaTag('property', 'og:url', ogData.ogUrl);
      this.setMetaTag('property', 'og:type', ogData.ogType || 'website');
    }

    // 3. Schema.org (JSON-LD para o Google)
    if (schemaData) {
      let scriptTag = document.getElementById('iq200-schema');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'iq200-schema';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schemaData);
    }
  }

  static setMetaTag(attrType, attrValue, content) {
    if (!content) return;
    let selector = `meta[${attrType}="${attrValue}"]`;
    if (attrType === 'rel') selector = `link[rel="${attrValue}"]`;

    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement(attrType === 'rel' ? 'link' : 'meta');
      element.setAttribute(attrType, attrValue);
      document.head.appendChild(element);
    }
    if (attrType === 'rel') {
      element.setAttribute('href', content);
    } else {
      element.setAttribute('content', content);
    }
  }
}
