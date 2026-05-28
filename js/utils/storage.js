// ==========================================================================
// ARQUIVO: js/utils/storage.js
// CRIADO: Este arquivo estava AUSENTE no projeto original.
// O carrinhoService.js importava este módulo mas ele nunca existiu,
// causando falha total na inicialização do serviço de carrinho.
// ==========================================================================

/**
 * Utilitário seguro de abstração sobre o localStorage.
 * Encapsula JSON.parse/stringify e captura erros silenciosamente.
 */
export const storage = {
    /**
     * Recupera um item do localStorage e faz o parse do JSON de forma segura.
     * @param {string} key - Chave de armazenamento.
     * @returns {any|null} O valor parseado, ou null em caso de erro/ausência.
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return null;
            return JSON.parse(item);
        } catch (error) {
            console.error(`[Storage] Erro ao ler a chave "${key}":`, error);
            return null;
        }
    },

    /**
     * Salva um valor no localStorage convertendo para JSON.
     * @param {string} key - Chave de armazenamento.
     * @param {any} value - Valor a ser serializado e salvo.
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`[Storage] Erro ao salvar a chave "${key}":`, error);
        }
    },

    /**
     * Remove um item do localStorage pelo nome da chave.
     * @param {string} key - Chave a ser removida.
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`[Storage] Erro ao remover a chave "${key}":`, error);
        }
    }
};
