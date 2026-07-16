/*
==========================================================
ABELLA JOIAS — LUXURY EXPERIENCE V11 (Project AURORA)
Sprint 2 — Luxury UI Engine
Módulo: Render Engine

Arquivo:
luxury-v11/engine/render.js

Responsabilidade:
Transformar dados vindos do Firebase (categorias, subcategorias,
produtos) em HTML dos componentes do Sprint 1 — SEM decidir nada
sobre lógica de negócio (isso continua nos services existentes:
carrinhoService.js, produtoService.js etc.)

Este arquivo NÃO acessa o Firebase. Ele só recebe objetos já
carregados e devolve strings de HTML. Isso é o que o documento
mestre chama de "cada página é composição de componentes prontos".

Mantém, de propósito, o MESMO formato de dados que já existe hoje em
produção (subcategorias aninhadas em categoria.subcategories,
fallback de imagem image/imagem/cover/banner, filtro paused, etc.)
para não perder nada do catálogo atual.

Depende de: nenhum (puro JS + classes CSS do Sprint 1)
==========================================================
*/

(function () {
    'use strict';

    function slugify(texto) {
        return String(texto || '')
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
    }

    function resolveImage(url) {
        if (!url) return '';
        return (typeof window.resolverImagemFirebase === 'function')
            ? window.resolverImagemFirebase(url)
            : url;
    }

    function fallbackImg() {
        return window.AURORA_FALLBACK_IMAGE || 'images/fallback.jpg';
    }

    const AuroraRender = {

        /**
         * CategoryCard — usado na Home.
         * data: { nome|name, slug, imagem|image }
         */
        categoryCard(data) {
            const nome = data.nome || data.name || 'Joia';
            const slug = data.slug || data.categorySlug || slugify(nome);
            const img = resolveImage(data.imagem || data.image) || fallbackImg();

            return `
                <a class="aurora-card aurora-card--category" href="subcategorias.html?categoria=${encodeURIComponent(slug)}">
                    <div class="media">
                        <img src="${img}" alt="${nome}" loading="lazy" onerror="this.src='${fallbackImg()}'">
                        <div class="overlay"><h3 class="title">${nome}</h3></div>
                    </div>
                </a>
            `;
        },

        /**
         * SubcategoryCard — usado em subcategorias.html.
         * data: { nome|name, image|imagem|cover|banner }
         * imagemCategoriaFallback: imagem da categoria-mãe, usada se a subcategoria não tiver imagem própria.
         */
        subcategoryCard(subSlug, data, categoriaSlug, imagemCategoriaFallback) {
            const nome = data.nome || data.name || subSlug;
            const imgBruta = data.image || data.imagem || data.cover || data.banner || imagemCategoriaFallback || '';
            const img = resolveImage(imgBruta) || fallbackImg();

            return `
                <a class="aurora-card aurora-card--subcategory"
                   href="produtos.html?categoria=${encodeURIComponent(categoriaSlug)}&subcategoria=${encodeURIComponent(subSlug)}">
                    <div class="media">
                        <img src="${img}" alt="${nome}" loading="lazy" onerror="this.src='${fallbackImg()}'">
                    </div>
                    <div class="body"><p class="title">${nome}</p></div>
                </a>
            `;
        },

        /**
         * ProductCard — usado em produtos.html.
         * data: { nome|name, preco|price, precoAntigo|oldPrice, peso|weight, imagem|image, badge }
         */
        productCard(data, onClickHandlerName) {
            const nome = data.nome || data.name || 'Joia';
            const img = resolveImage(data.imagem || data.image) || fallbackImg();
            const preco = data.preco ?? data.price ?? 0;
            const precoAntigo = data.precoAntigo ?? data.oldPrice ?? null;
            const peso = data.peso ?? data.weight ?? null;
            const eyebrow = data.colecao || data.eyebrow || '';

            const precoFmt = (typeof window.formatarMoeda === 'function')
                ? window.formatarMoeda(preco)
                : `R$ ${Number(preco).toFixed(2).replace('.', ',')}`;

            const precoAntigoHTML = precoAntigo
                ? `<span class="price-old">${(typeof window.formatarMoeda === 'function') ? window.formatarMoeda(precoAntigo) : precoAntigo}</span>`
                : '';

            const badgeHTML = data.badge
                ? `<div class="badges"><span class="aurora-badge aurora-badge--${data.badge}">${data.badgeLabel || data.badge}</span></div>`
                : '';

            const clickAttr = onClickHandlerName ? `onclick="${onClickHandlerName}('${data.id || ''}')"` : '';

            return `
                <div class="aurora-card aurora-card--product" ${clickAttr}>
                    <div class="media">
                        <img src="${img}" alt="${nome}" loading="lazy" onerror="this.src='${fallbackImg()}'">
                        ${badgeHTML}
                    </div>
                    <div class="body">
                        ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
                        <p class="title">${nome}</p>
                        <div class="price-row"><span class="price">${precoFmt}</span>${precoAntigoHTML}</div>
                        ${peso ? `<p class="weight">${peso}g</p>` : ''}
                    </div>
                </div>
            `;
        },

        /**
         * BannerCard — banner de campanha full-bleed.
         */
        bannerCard(data) {
            const img = resolveImage(data.imagem || data.image) || fallbackImg();
            return `
                <div class="aurora-card aurora-card--banner">
                    <div class="media">
                        <img src="${img}" alt="${data.titulo || ''}" loading="lazy">
                        <div class="overlay"><h2 class="title">${data.titulo || data.title || ''}</h2></div>
                    </div>
                </div>
            `;
        },

        /**
         * CollectionCard — coleção em destaque, com descrição e CTA.
         */
        collectionCard(data) {
            const img = resolveImage(data.imagem || data.image) || fallbackImg();
            return `
                <div class="aurora-card aurora-card--collection">
                    <div class="media"><img src="${img}" alt="${data.nome || ''}" loading="lazy"></div>
                    <div class="body">
                        <p class="title">${data.nome || data.name || ''}</p>
                        <p class="description">${data.descricao || data.description || ''}</p>
                        ${data.link ? `<a class="aurora-btn aurora-btn--outline" style="width:fit-content;margin-top:var(--space-5);" href="${data.link}">Ver coleção</a>` : ''}
                    </div>
                </div>
            `;
        },

        /**
         * LookbookCard — puramente editorial, sem preço/CTA.
         */
        lookbookCard(data) {
            const img = resolveImage(data.imagem || data.image) || fallbackImg();
            return `
                <div class="aurora-card aurora-card--lookbook">
                    <div class="media"><img src="${img}" alt="" loading="lazy"></div>
                    <div class="body"><p class="caption">${data.legenda || data.caption || ''}</p></div>
                </div>
            `;
        },

        /**
         * Breadcrumb trail.
         * itens: [{ label, href }] — o último item vira o "is-current" (sem link).
         */
        breadcrumb(itens) {
            const partes = itens.map((item, i) => {
                const isLast = i === itens.length - 1;
                const sep = i > 0 ? `<span class="sep">/</span>` : '';
                const conteudo = isLast
                    ? `<span class="is-current">${item.label}</span>`
                    : `<a href="${item.href}">${item.label}</a>`;
                return sep + conteudo;
            });
            return `<nav class="aurora-breadcrumb" aria-label="breadcrumb">${partes.join('')}</nav>`;
        },

        /**
         * Skeleton de card, pra mostrar enquanto os dados reais carregam.
         */
        skeletonCard() {
            return `
                <div class="aurora-skeleton-card">
                    <div class="aurora-skeleton aurora-skeleton--image"></div>
                    <div class="aurora-skeleton aurora-skeleton--text"></div>
                    <div class="aurora-skeleton aurora-skeleton--text-sm"></div>
                </div>
            `;
        },

        skeletonGrid(qtd) {
            return Array.from({ length: qtd || 8 }).map(() => this.skeletonCard()).join('');
        },

        _slugify: slugify
    };

    window.AuroraRender = AuroraRender;
})();
