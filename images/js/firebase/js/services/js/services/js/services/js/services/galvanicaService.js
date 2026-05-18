// FILE: /js/services/galvanicaService.js

import { db } from '../firebase/firebase.js';

/**
 * Service encarregado de gerenciar a listagem de galvânicas parceiras (Limeira).
 * Fornece os dados necessários para a tela informativa de frete grátis e parcerias logísticas.
 */
class GalvanicaService {
    constructor() {
        this.NODE_PATH = 'galvanicas'; // Alinhado com o nó do Realtime Database correspondente
    }

    /**
     * Recupera a lista completa de empresas galvânicas parceiras cadastradas.
     * @returns {Promise<Array>} Lista de galvânicas integradas.
     */
    async obterTodas() {
        try {
            const snapshot = await db.ref(this.NODE_PATH).once('value');
            const dados = snapshot.val();
            
            if (!dados) return [];

            return Object.keys(dados).map(key => ({
                id: key,
                ...dados[key]
            }));
        } catch (error) {
            console.error("Erro ao buscar galvânicas parceiras:", error);
            throw error;
        }
    }
}

export const galvanicaService = new GalvanicaService();