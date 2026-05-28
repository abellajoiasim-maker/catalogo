const CategoriaService = {
    async obterTodas() {
        return new Promise((resolve) => {
            database.ref('categorias').once('value', (snapshot) => {
                const dados = snapshot.val();
                const lista = dados ? Object.keys(dados).map(key => ({ id: key, ...dados[key] })) : [];
                resolve(lista);
            });
        });
    }
};
