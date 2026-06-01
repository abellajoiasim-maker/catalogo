// js/utils/storage.js

const StorageUtils = {
    converterUrlStorage: function(url) {
        if (!url) return 'https://via.placeholder.com/400/141414/818cf8?text=Sem+Imagem';
        const s = url.trim();
        if (!s.startsWith('gs://')) return s;
        
        try {
            const semPrefixo = s.replace('gs://', '');
            const primeiraBarra = semPrefixo.indexOf('/');
            if (primeiraBarra === -1) return s;
            
            const bucket = semPrefixo.substring(0, primeiraBarra);
            const caminho = semPrefixo.substring(primeiraBarra + 1);
            return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(caminho)}?alt=media`;
        } catch (e) {
            console.error("Erro ao converter URL gs://", e);
            return s;
        }
    },
    
    carregarImagemBase64: function(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = function () {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                try {
                    resolve(canvas.toDataURL('image/jpeg', 0.85).split(',')[1]);
                } catch (e) {
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
            img.src = url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now();
        });
    }
};

window.StorageUtils = StorageUtils;
window.converterUrlStorage = StorageUtils.converterUrlStorage;
StorageUtils.uploadImagemProduto =
async function(file){

    if(!window.storage)
        throw new Error(
            "Firebase Storage não iniciado"
        );

    const nomeArquivo =
        `produtos/${
            Date.now()
        }_${file.name}`;

    const ref =
        storage.ref(nomeArquivo);

    await ref.put(file);

    return await ref.getDownloadURL();
};
