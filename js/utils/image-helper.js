// ======================================================================
// js/utils/image-helper.js
// Abella Joias - ImageHelper v2.0
// AUDITORIA FORENSE FIREBASE + STORAGE IQ200
// ======================================================================

window.ImageHelper = (() => {

    // ==========================================================
    // CONFIG
    // ==========================================================

    const PLACEHOLDER =

        'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA';

    const FIREBASE_STORAGE_HOST =

        'https://firebasestorage.googleapis.com/v0/b';

    // ==========================================================
    // HELPERS
    // ==========================================================

    function safeString(valor = '') {

        return String(valor || '')
            .trim();

    }

    function isValidString(valor) {

        return (
            typeof valor === 'string' &&
            valor.trim() !== ''
        );

    }

    // ==========================================================
    // DETECTA URL ABSOLUTA
    // ==========================================================

    function isHttpUrl(url = '') {

        return (

            url.startsWith('http://') ||

            url.startsWith('https://')

        );

    }

    // ==========================================================
    // DETECTA GS://
    // ==========================================================

    function isGsUrl(url = '') {

        return url.startsWith(
            'gs://'
        );

    }

    // ==========================================================
    // NORMALIZA PATH RELATIVO
    // ==========================================================

    function normalizarPathRelativo(url = '') {

        return safeString(url)
            .replace(/^\/+/, '');

    }

    // ==========================================================
    // CONVERTE GS:// PARA HTTPS
    // ==========================================================

    function converterGsUrl(url = '') {

        try {

            url =
                safeString(url);

            if (!url) {

                return PLACEHOLDER;

            }

            // ==================================================
            // URL HTTPS
            // ==================================================

            if (
                isHttpUrl(url)
            ) {

                return url;

            }

            // ==================================================
            // GS:// FIREBASE STORAGE
            // ==================================================

            if (
                isGsUrl(url)
            ) {

                const semGs =
                    url.replace(
                        'gs://',
                        ''
                    );

                const primeiraBarra =
                    semGs.indexOf('/');

                if (
                    primeiraBarra === -1
                ) {

                    console.warn(
                        '[ImageHelper] gs:// inválido:',
                        url
                    );

                    return PLACEHOLDER;

                }

                const bucket =
                    semGs.substring(
                        0,
                        primeiraBarra
                    );

                const caminho =
                    semGs.substring(
                        primeiraBarra + 1
                    );

                if (
                    !bucket ||
                    !caminho
                ) {

                    console.warn(
                        '[ImageHelper] bucket/caminho inválido:',
                        url
                    );

                    return PLACEHOLDER;

                }

                return `${FIREBASE_STORAGE_HOST}/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;

            }

            // ==================================================
            // PATH RELATIVO LEGADO
            // ==================================================

            if (

                url.startsWith('/images/') ||

                url.startsWith('images/') ||

                url.startsWith('/storage/') ||

                url.startsWith('storage/')

            ) {

                return normalizarPathRelativo(
                    url
                );

            }

            // ==================================================
            // FALLBACK DEFAULT
            // ==================================================

            return url;

        } catch (error) {

            console.error(
                '[ImageHelper:converterGsUrl]',
                error
            );

            return PLACEHOLDER;

        }

    }

    // ==========================================================
    // OBTÉM IMAGEM PRINCIPAL
    // ==========================================================

    function obterImagem(item = {}) {

        try {

            if (
                !item ||
                typeof item !== 'object'
            ) {

                return PLACEHOLDER;

            }

            // ==================================================
            // PRIORIDADES
            // ==================================================

            const imagem =

                item.image ||

                item.imagem ||

                item.foto ||

                item.thumbnail ||

                item.thumb ||

                item.capa ||

                // ==================================================
                // ARRAYS
                // ==================================================

                (

                    Array.isArray(
                        item.images
                    ) &&

                    item.images.length > 0

                        ? item.images[0]

                        : null

                ) ||

                (

                    Array.isArray(
                        item.imagens
                    ) &&

                    item.imagens.length > 0

                        ? item.imagens[0]

                        : null

                ) ||

                PLACEHOLDER;

            return converterGsUrl(
                imagem
            );

        } catch (error) {

            console.error(
                '[ImageHelper:obterImagem]',
                error
            );

            return PLACEHOLDER;

        }

    }

    // ==========================================================
    // FALLBACK AUTOMÁTICO IMG
    // ==========================================================

    function aplicarFallback(img) {

        try {

            if (
                !img ||
                typeof img !== 'object'
            ) {

                return;

            }

            img.onerror = () => {

                img.onerror = null;

                img.src =
                    PLACEHOLDER;

            };

        } catch (error) {

            console.error(
                '[ImageHelper:aplicarFallback]',
                error
            );

        }

    }

    // ==========================================================
    // DEFINE SRC COM FALLBACK
    // ==========================================================

    function aplicarImagem(
        img,
        imagem
    ) {

        try {

            if (!img) {

                return;

            }

            aplicarFallback(
                img
            );

            img.src =
                obterImagem({
                    image: imagem
                });

        } catch (error) {

            console.error(
                '[ImageHelper:aplicarImagem]',
                error
            );

        }

    }

    // ==========================================================
    // VALIDA URL
    // ==========================================================

    function possuiImagem(valor) {

        return isValidString(
            valor
        );

    }

    // ==========================================================
    // EXPORTS
    // ==========================================================

    return {

        PLACEHOLDER,

        converterGsUrl,

        obterImagem,

        aplicarFallback,

        aplicarImagem,

        possuiImagem,

        isGsUrl,

        isHttpUrl

    };

})();

// ==========================================================
// LEGADO
// ==========================================================

window.imageHelper =
    window.ImageHelper;

// ==========================================================
// INIT
// ==========================================================

console.log(
    '🖼️ ImageHelper v2.0 carregado.'
);
