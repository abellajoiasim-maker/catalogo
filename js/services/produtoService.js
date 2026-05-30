const ProdutoService = {
    async obterTodos() {
        return new Promise((resolve) => {
            database.ref('abella/products').once('value', (snapshot) => {
                const dados = snapshot.val();
                const lista = dados ? Object.keys(dados).map(key => ({ id: key, ...dados[key] })) : [];
                resolve(lista);
            });
        });
    },

    async obterPorId(id) {
        return new Promise((resolve) => {
            database.ref(`abella/products/${id}`).once('value', (snapshot) => {
                resolve(snapshot.val());
            });
        });
    }
};
