const GalvanicaService = {
    async obterParceiros() {
        return new Promise((resolve) => {
            database.ref('galvanicas_parceiras').once('value', (snapshot) => {
                const dados = snapshot.val();
                resolve(dados ? Object.keys(dados).map(key => ({ id: key, ...dados[key] })) : []);
            });
        });
    },

    verificarFreteGratis(totalPedido) {
        // Regra: Frete grátis para galvânicas de Limeira nas compras acima de R$100
        return totalPedido >= 100;
    }
};
