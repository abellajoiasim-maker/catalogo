// =====================================================================
// image-helper.js
// =====================================================================

window.ImageHelper = (() => {

    const PLACEHOLDER =
        'https://via.placeholder.com/800x800/111111/caa85c?text=ABELLA';

    // =========================================================
    // CONVERTE gs:// PARA URL HTTPS
    // =========================================================

    function converterGsUrl(url){

        try{

            if(!url) return PLACEHOLDER;

            if(typeof url !== 'string')
                return PLACEHOLDER;

            // já é http
            if(
                url.startsWith('http://') ||
                url.startsWith('https://')
            ){
                return url;
            }

            // firebase storage
            if(url.startsWith('gs://')){

                const semGs =
                    url.replace('gs://','');

                const primeiraBarra =
                    semGs.indexOf('/');

                const bucket =
                    semGs.substring(
                        0,
                        primeiraBarra
                    );

                const caminho =
                    semGs.substring(
                        primeiraBarra + 1
                    );

                return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;
            }

            // caminho relativo antigo
            if(
                url.startsWith('/images/') ||
                url.startsWith('images/')
            ){

                return url.replace(/^\/?/,'');
            }

            return url;

        }catch(err){

            console.error(
                '[ImageHelper] erro:',
                err
            );

            return PLACEHOLDER;
        }

    }

    // =========================================================
    // OBTÉM A IMAGEM PRINCIPAL DO OBJETO
    // =========================================================

    function obterImagem(item){

        try{

            if(!item)
                return PLACEHOLDER;

            // prioridade máxima
            const imagem =

                item.image ||
                item.imagem ||
                item.foto ||
                item.thumbnail ||

                // arrays
                (Array.isArray(item.images)
                    ? item.images[0]
                    : null) ||

                (Array.isArray(item.imagens)
                    ? item.imagens[0]
                    : null) ||

                PLACEHOLDER;

            return converterGsUrl(imagem);

        }catch(e){

            return PLACEHOLDER;
        }

    }

    // =========================================================
    // FALLBACK AUTOMÁTICO
    // =========================================================

    function aplicarFallback(img){

        img.onerror = () => {

            img.src = PLACEHOLDER;
        };

    }

    return {

        PLACEHOLDER,

        converterGsUrl,

        obterImagem,

        aplicarFallback

    };

})();
