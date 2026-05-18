// FILE: /js/utils/storage.js

/**
 * Utilitário wrapper seguro sobre a API nativa de localStorage.
 * Previne falhas de parsing de JSON e trata exceções de segurança do navegador.
 */
export const storage = {
    /**
     * Obtém e converte dados estruturados guardados no localStorage.
     * @param {string} chave - Chave identificadora do registro.
     * @returns {*} Dados parseados ou null em caso de erro.
     */
    get(chave) {
        try {
            const item = localStorage.getItem(chave);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Falha no parsing do storage chave [${chave}]:`, error);
            return null;
        }
    },

    /**
     * Serializa e salva qualquer tipo de dado ou estado de forma persistente.
     * @param {string} chave - Chave identificadora do registro.
     * @param {*} valor - Dado estruturado (Array, Objeto, String, etc) a ser armazenado.
     */
    set(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (error) {
            console.error(`Falha ao gravar no storage chave [${chave}]:`, error);
        }
    },

    /**
     * Remove um registro específico do armazenamento.
     * @param {string} chave - Chave a ser deletada.
     */
    remove(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (error) {
            console.error(`Falha ao remover chave [${chave}] do storage:`, error);
        }
    }
};