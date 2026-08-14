/*
==========================================================
ABELLA JOIAS — LUXURY EXPERIENCE V11 (Project AURORA)
Sprint 2 — Luxury UI Engine
Módulo: Render Engine

Arquivo:
engine/render.js

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

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeUrl(value) {
        const url = String(value || '').trim();
        return /^(https?:|data:image\/|\/|\.\/|\.\.\/)/i.test(url) ? url : fallbackImg();
    }

    const AuroraRender = {

        /**
         * CategoryCard — usado na Home.
         * data: { nome|name, slug, imagem|image }
         */
        categoryCard(data) {
            const nome = data.nome || data.name || 'Joia';
            const slug = data.slug || data.categorySlug || slugify(nome);
            const img = safeUrl(resolveImage(data.imagem || data.image) || fallbackImg());
            const nomeEsc = escapeHtml(nome);
            const fallbackEsc = escapeHtml(fallbackImg());

            return `
                <a class="aurora-card aurora-card--category" href="subcategorias.html?categoria=${encodeURIComponent(slug)}" aria-label="Ver subcategorias de ${nomeEsc}">
                    <div class="media">
                        <img src="${img}" alt="${nomeEsc}" loading="lazy" onerror="this.src='${fallbackEsc}'">
                        <div class="overlay"><h3 class="title">${nomeEsc}</h3></div>
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
            const descricao = data.descricao || data.description || `Explore ${nome} no atacado.`;
            const imgBruta = data.image || data.imagem || data.cover || data.banner || data.imagemAmbientada || data.imagemSubcategoria || imagemCategoriaFallback || '';
            const img = safeUrl(resolveImage(imgBruta) || fallbackImg());
            const nomeEsc = escapeHtml(nome);
            const descricaoEsc = escapeHtml(descricao);
            const fallbackEsc = escapeHtml(fallbackImg());

            return `
                <a class="aurora-card aurora-card--subcategory" data-subcategoria-slug="${escapeHtml(subSlug)}"
                   href="produtos.html?categoria=${encodeURIComponent(categoriaSlug)}&subcategoria=${encodeURIComponent(subSlug)}"
                   aria-label="Ver produtos de ${nomeEsc}">
                    <div class="media">
                        <img src="${img}" alt="${nomeEsc} — Abella Joias" loading="lazy" onerror="this.src='${fallbackEsc}'">
                    </div>
                    <div class="body">
                        <p class="title">${nomeEsc}</p>
                        <p class="description" style="font-size:12px;color:var(--color-secondary);line-height:1.5;">${descricaoEsc}</p>
                        <span class="aurora-btn aurora-btn--outline" style="margin-top:var(--space-3);width:fit-content;">Ver produtos</span>
                    </div>
                </a>
            `;
        },

        /**
         * ProductCard — usado em produtos.html.
         * data: { nome|name, preco|price, precoAntigo|oldPrice, peso|weight, imagem|image, badge }
         */
        productCard(data, onClickHandlerName) {
            const nome = data.nome || data.name || 'Joia';
            const img = safeUrl(resolveImage(data.imagem || data.image) || fallbackImg());
            const precoOriginal = data.preco ?? data.price ?? 0;
            const precoAntigoInformado = data.precoAntigo ?? data.oldPrice ?? data.precoOriginal ?? null;
            const precoCalculado = (window.descontoService && typeof window.descontoService.calcularPrecoComDesconto === 'function')
                ? window.descontoService.calcularPrecoComDesconto(data)
                : Number(precoOriginal) || 0;
            const preco = Number(precoCalculado) || 0;
            const precoAntigo = Number(precoAntigoInformado) > preco
                ? Number(precoAntigoInformado)
                : (Number(precoOriginal) > preco ? Number(precoOriginal) : null);
            const peso = data.peso ?? data.weight ?? null;
            const eyebrow = data.colecao || data.eyebrow || '';
            const sku = data.sku || data.codigo || '';
            const estoqueControlado = data.estoqueControlado === true || data.estoqueLimitadoAtivo === true || data.controleEstoque === true;
            const estoqueQuantidade = Math.max(0, parseInt(data.estoqueQuantidade ?? data.estoque ?? 0, 10) || 0);
            const estoqueHTML = estoqueControlado && data.mostrarEstoqueGrid !== false
                ? `<p class="stock-counter ${estoqueQuantidade === 0 ? 'stock-counter--soldout' : ''}" aria-label="${estoqueQuantidade === 0 ? 'Produto esgotado' : `${estoqueQuantidade} unidades disponíveis`}">${estoqueQuantidade === 0 ? 'Esgotado' : `Últimas ${estoqueQuantidade} unidades`}</p>`
                : '';

            const precoFmt = (typeof window.formatarMoeda === 'function')
                ? window.formatarMoeda(preco)
                : `R$ ${Number(preco).toFixed(2).replace('.', ',')}`;

            const precoAntigoHTML = precoAntigo
                ? `<span class="price-old">${(typeof window.formatarMoeda === 'function') ? window.formatarMoeda(precoAntigo) : precoAntigo}</span>`
                : '';

            const etiquetaOferta = (window.descontoService && typeof window.descontoService.obterEtiquetaOferta === 'function')
                ? window.descontoService.obterEtiquetaOferta(data)
                : null;
            const badgeHTML = etiquetaOferta
                ? `<div class="badges"><span class="aurora-badge aurora-badge--offer">${etiquetaOferta}</span></div>`
                : (data.badge
                    ? `<div class="badges"><span class="aurora-badge aurora-badge--${data.badge}">${data.badgeLabel || data.badge}</span></div>`
                    : '');

            const clickAttr = onClickHandlerName ? `onclick="${onClickHandlerName}('${data.id || ''}')"` : '';

            const altTexto = (typeof window.SeoAltGenerator !== 'undefined')
                ? window.SeoAltGenerator.gerarAltProduto(data)
                : nome;

            return `
                <div class="aurora-card aurora-card--product" ${clickAttr}>
                    <div class="media">
                        <img src="${img}" alt="${altTexto}" loading="lazy" onerror="this.src='${fallbackImg()}'">
                        ${badgeHTML}
                    </div>
                    <div class="body">
                        ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
                        ${sku ? `<p style="font-size:11px; color:var(--color-secondary); letter-spacing:.04em; margin-bottom:2px;">SKU: ${sku}</p>` : ''}
                        <p class="title">${nome}</p>
                        <div class="price-row"><span class="price">${precoFmt}</span>${precoAntigoHTML}</div>
                        ${estoqueHTML}
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
