const DescontoService = {
    async obterPromocoesAtivas() {
        return new Promise((resolve) => {
            database.ref('promocoes').once('value', (snapshot) => {
                const dados = snapshot.val();
                const ativas = dados ? Object.keys(dados)
                    .map(key => ({ id: key, ...dados[key] }))
                    .filter(p => p.ativa === true) : [];
                resolve(ativas);
            });
        });
    },

    calcularDesconto(precoOriginal, porcentagem) {
        if (!porcentagem || porcentagem <= 0) return precoOriginal;
        return precoOriginal * (1 - (porcentagem / 100));
    }
};
