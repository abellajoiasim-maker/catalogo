// ======================================================================
// js/components/categoriaCard.js
// Abella Joias - CategoriaCard v3.0
// Refatorado conforme Auditoria Forense Firebase
// ======================================================================

const CategoriaCard = {

// ==========================================================
// HELPERS
// ==========================================================

_safeString(value = '') {

    return String(value || '')
        .trim();
},

_escapeHTML(text = '') {

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
},

// ==========================================================
// NORMALIZADOR
// ==========================================================

normalizeCategory(
    slug,
    data = {}
) {

    return {

        slug:
            this._safeString(
                slug
            ),

        nome:
            this._escapeHTML(

                data.name ||
                data.nome ||
                slug

            ),

        imagem:

            window.ImageHelper
                ?.obterImagem?.(
                    data
                ) ||

            '',

        raw:
            data
    };
},

// ==========================================================
// URL DESTINO
// ==========================================================

getDestinationUrl(

    slug,
    isSubcategory = false,
    parentSlug = ''

) {

    const safeSlug =
        encodeURIComponent(
            slug
        );

    const safeParent =
        encodeURIComponent(
            parentSlug
        );

    return isSubcategory

        ? `produtos.html?id=${safeParent}&sub=${safeSlug}`

        : `subcategorias.html?id=${safeSlug}`;
},

// ==========================================================
// TEMPLATE
// ==========================================================

createHTML(

    slug,
    data,
    isSubcategory = false,
    parentSlug = ''

) {

    try {

        const categoria =
            this.normalizeCategory(
                slug,
                data
            );

        const url =
            this.getDestinationUrl(

                categoria.slug,
                isSubcategory,
                parentSlug

            );

        return `

            <div
                class="abella-categoria-card card cursor-pointer flex flex-col justify-between"
                data-url="${url}"
            >

                <div class="aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center">

                    <img
                        src="${categoria.imagem}"
                        alt="${categoria.nome}"
                        loading="lazy"
                        class="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                    >

                </div>

                <div class="p-4 bg-zinc-900/20 border-t border-zinc-900/60 flex items-center justify-between">

                    <span class="text-xs font-bold uppercase text-white truncate tracking-wide">

                        ${categoria.nome}

                    </span>

                    <span class="gold text-xs">

                        ➔

                    </span>

                </div>

            </div>

        `;

    } catch (error) {

        console.error(
            '[CategoriaCard:createHTML]',
            error
        );

        return '';
    }
},

// ==========================================================
// EVENTOS
// ==========================================================

bindEvents(container = document) {

    try {

        container
            .querySelectorAll(
                '.abella-categoria-card'
            )
            .forEach(card => {

                if (
                    card.dataset.bound ===
                    'true'
                ) {
                    return;
                }

                card.dataset.bound =
                    'true';

                card.addEventListener(
                    'click',
                    () => {

                        const url =
                            card.dataset.url;

                        if (url) {

                            window.location.href =
                                url;
                        }
                    }
                );
            });

    } catch (error) {

        console.error(
            '[CategoriaCard:bindEvents]',
            error
        );
    }
}

};

window.CategoriaCard =
CategoriaCard;

console.log(
'🧩 CategoriaCard v3.0 carregado.'
);
