// FILE: js/utils/storage.js

/**
 * Utilitário de gerenciamento e persistência de estado local protegido.
 */
export const storage = {
    /**
     * Recupera um item convertido em objeto do localStorage.
     * @param {string} chave - Identificador do recurso no armazenamento.
     * @returns {any|null} Dados desserializados ou null.
     */
    get(chave) {
        try {
            const dado = localStorage.getItem(chave);
            return dado ? JSON.parse(dado) : null;
        } catch (error) {
            console.error(`[Storage Error] Falha na leitura da chave ${chave}:`, error);
            return null;
        }
    },

    /**
     * Persiste dados serializados no localStorage.
     * @param {string} chave - Identificador do recurso.
     * @param {any} valor - Objeto ou dado primitivo a ser armazenado.
     */
    set(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
        } catch (error) {
            console.error(`[Storage Error] Falha na escrita da chave ${chave}:`, error);
        }
    },

    /**
     * Remove um registro do armazenamento local.
     * @param {string} chave - Identificador do recurso.
     */
    remove(chave) {
        try {
            localStorage.removeItem(chave);
        } catch (error) {
            console.error(`[Storage Error] Falha na remoção da chave ${chave}:`, error);
        }
    }
};
