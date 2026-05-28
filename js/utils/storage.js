const StorageUtils = {
    salvar(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    },

    obter(chave) {
        const dados = localStorage.getItem(chave);
        return dados ? JSON.parse(dados) : null;
    },

    remover(chave) {
        localStorage.removeItem(chave);
    }
};
