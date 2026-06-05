// ======================================================================
// js/utils/storage.js
// Abella Joias - StorageUtils v3.0
// AUDITORIA FORENSE FIREBASE STORAGE IQ200
// ======================================================================

const StorageUtils = (() => {

    // ==========================================================
    // CONFIG
    // ==========================================================

    const PLACEHOLDER =

        'https://via.placeholder.com/400/141414/caa85c?text=ABELLA';

    const FIREBASE_STORAGE_HOST =

        'https://firebasestorage.googleapis.com/v0/b';

    const ALLOWED_IMAGE_TYPES = [

        'image/jpeg',
        'image/png',
        'image/webp'

    ];

    // ==========================================================
    // HELPERS
    // ==========================================================

    function safeString(
        valor = ''
    ) {

        return String(valor || '')
            .trim();

    }

    function gerarNomeSeguro(
        nome = ''
    ) {

        return safeString(nome)

            .normalize('NFD')

            .replace(
                /[\u0300-\u036f]/g,
                ''
            )

            .replace(
                /[^a-zA-Z0-9.-]/g,
                '_'
            );

    }

    // ==========================================================
    // GS:// -> HTTPS
    // ==========================================================

    function converterUrlStorage(
        url = ''
    ) {

        try {

            url =
                safeString(url);

            if (!url) {

                return PLACEHOLDER;

            }

            // já é URL
            if (

                url.startsWith(
                    'http://'
                ) ||

                url.startsWith(
                    'https://'
                )

            ) {

                return url;

            }

            // não é gs://
            if (
                !url.startsWith(
                    'gs://'
                )
            ) {

                return url;

            }

            const semPrefixo =
                url.replace(
                    'gs://',
                    ''
                );

            const primeiraBarra =
                semPrefixo.indexOf('/');

            if (
                primeiraBarra === -1
            ) {

                return PLACEHOLDER;

            }

            const bucket =
                semPrefixo.substring(
                    0,
                    primeiraBarra
                );

            const caminho =
                semPrefixo.substring(
                    primeiraBarra + 1
                );

            return `${FIREBASE_STORAGE_HOST}/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;

        } catch (error) {

            console.error(
                '[StorageUtils:converterUrlStorage]',
                error
            );

            return PLACEHOLDER;

        }

    }

    // ==========================================================
    // BASE64
    // ==========================================================

    async function carregarImagemBase64(
        url
    ) {

        return new Promise(
            resolve => {

                try {

                    const img =
                        new Image();

                    img.crossOrigin =
                        'anonymous';

                    img.onload =
                        function () {

                            try {

                                const canvas =
                                    document.createElement(
                                        'canvas'
                                    );

                                canvas.width =
                                    img.naturalWidth;

                                canvas.height =
                                    img.naturalHeight;

                                const ctx =
                                    canvas.getContext(
                                        '2d'
                                    );

                                ctx.drawImage(
                                    img,
                                    0,
                                    0
                                );

                                const base64 =
                                    canvas
                                        .toDataURL(
                                            'image/jpeg',
                                            0.85
                                        )
                                        .split(',')[1];

                                resolve(
                                    base64
                                );

                            } catch (error) {

                                console.error(
                                    '[StorageUtils:base64]',
                                    error
                                );

                                resolve(
                                    null
                                );

                            }

                        };

                    img.onerror =
                        () =>
                            resolve(
                                null
                            );

                    img.src =

                        converterUrlStorage(
                            url
                        ) +

                        (
                            url.includes('?')
                                ? '&'
                                : '?'
                        ) +

                        `_cb=${Date.now()}`;

                } catch (error) {

                    console.error(
                        '[StorageUtils:carregarImagemBase64]',
                        error
                    );

                    resolve(null);

                }

            }
        );

    }

    // ==========================================================
    // UPLOAD FIREBASE STORAGE
    // ==========================================================

    async function uploadImagemProduto(
        file
    ) {

        try {

            // ==================================================
            // FIREBASE
            // ==================================================

            if (
                !window.storage
            ) {

                throw new Error(
                    'Firebase Storage não inicializado.'
                );

            }

            // ==================================================
            // FILE
            // ==================================================

            if (!file) {

                throw new Error(
                    'Arquivo obrigatório.'
                );

            }

            // ==================================================
            // MIME
            // ==================================================

            if (

                !ALLOWED_IMAGE_TYPES.includes(
                    file.type
                )

            ) {

                throw new Error(
                    'Formato de imagem inválido.'
                );

            }

            // ==================================================
            // NOME
            // ==================================================

            const nomeSeguro =
                gerarNomeSeguro(
                    file.name
                );

            const nomeArquivo =

                `abella/produtos/${Date.now()}_${nomeSeguro}`;

            // ==================================================
            // STORAGE REF
            // ==================================================

            const ref =
                window.storage.ref(
                    nomeArquivo
                );

            // ==================================================
            // METADATA
            // ==================================================

            const metadata = {

                contentType:
                    file.type,

                cacheControl:
                    'public,max-age=31536000'

            };

            // ==================================================
            // UPLOAD
            // ==================================================

            await ref.put(
                file,
                metadata
            );

            return await ref.getDownloadURL();

        } catch (error) {

            console.error(
                '[StorageUtils:uploadImagemProduto]',
                error
            );

            throw error;

        }

    }

    // ==========================================================
    // EXPORT
    // ==========================================================

    return Object.freeze({

        converterUrlStorage,

        carregarImagemBase64,

        uploadImagemProduto

    });

})();

// ==========================================================
// EXPORTS
// ==========================================================

window.StorageUtils =
    StorageUtils;

window.converterUrlStorage =
    StorageUtils.converterUrlStorage;

// ==========================================================
// INIT
// ==========================================================

console.log(
    '🗂️ StorageUtils v3.0 carregado.'
);
