// FILE: /js/services/categoriaService.js

import { db } from '../firebase/firebase.js';

/**
 * Service especializado no gerenciamento de categorias do catálogo Abella Joias.
 * Consome os dados estruturados do Firebase Realtime Database de forma assíncrona.
 */
class CategoriaService {
    constructor() {
        this.NODE_PATH = 'categories'; // Mantém o nó exato de categorias no Firebase
    }

    /**
     * Busca todas as categorias cadastradas no banco para alimentar os menus e filtros.
     * @returns {Promise<Array>} Lista completa de categorias com ID mapeado.
     */
    async obterTodas() {
        try {
            const snapshot = await db.ref(this.NODE_PATH).once('value');
            const dados = snapshot.val();
            
            if (!dados) return [];

            // Mapeia o objeto do Firebase para formato de array utilizável pelos cards
            return Object.keys(dados).map(key => ({
                id: key,
                ...dados[key]
            }));
        } catch (error) {
            console.error("Erro ao buscar categorias do Firebase:", error);
            throw error;
        }
    }
}

export const categoriaService = new CategoriaService();