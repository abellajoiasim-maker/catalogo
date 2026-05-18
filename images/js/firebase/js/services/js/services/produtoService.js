// FILE: /js/services/produtoService.js

import { db } from '../firebase/firebase.js';

/**
 * Service especializado no gerenciamento de dados de produtos da Abella Joias.
 * Realiza a interface direta com o Firebase Realtime Database de forma otimizada e assíncrona.
 */
class ProdutoService {
    constructor() {
        this.NODE_PATH = 'products'; // Mantém o nó exato de produtos estruturado no banco
    }

    /**
     * Busca todos os produtos ativos do catálogo diretamente do Firebase.
     * @returns {Promise<Array>} Promessa contendo a lista completa de produtos com ID mapeado.
     */
    async obterTodos() {
        try {
            const snapshot = await db.ref(this.NODE_PATH).once('value');
            const dados = snapshot.val();
            
            if (!dados) return [];

            // Mapeia o objeto do Firebase em um array estruturado, preservando chaves originais
            return Object.keys(dados).map(key => ({
                id: key,
                ...dados[key]
            }));
        } catch (error) {
            console.error("Erro ao buscar todos os produtos do Firebase:", error);
            throw error;
        }
    }

    /**
     * Busca um único produto por seu ID exclusivo para exibição de detalhes ou validações.
     * @param {string} idProduto - O ID do produto no Firebase.
     * @returns {Promise<Object|null>} Dados do produto ou null caso não encontrado.
     */
    async obterPorId(idProduto) {
        if (!idProduto) return null;
        try {
            const snapshot = await db.ref(`${this.NODE_PATH}/${idProduto}`).once('value');
            const dados = snapshot.val();
            
            if (!dados) return null;

            return {
                id: idProduto,
                ...dados
            };
        } catch (error) {
            console.error(`Erro ao buscar o produto ${idProduto}:`, error);
            throw error;
        }
    }

    /**
     * Filtra produtos por uma categoria específica mantendo compatibilidade com as tags visuais.
     * @param {string} categoriaNome - O nome exato da categoria para o filtro.
     * @returns {Promise<Array>} Lista de produtos filtrados.
     */
    async obterPorCategoria(categoriaNome) {
        if (!categoriaNome) return this.obterTodos();
        try {
            const produtos = await this.obterTodos();
            return produtos.filter(p => 
                p.categoria && p.categoria.toLowerCase() === categoriaNome.toLowerCase()
            );
        } catch (error) {
            console.error(`Erro ao filtrar produtos pela categoria ${categoriaNome}:`, error);
            return [];
        }
    }

    /**
     * Realiza uma busca textual por código ou nome do produto para o sistema de pesquisa do catálogo.
     * @param {string} termo - O termo de busca digitado pelo usuário.
     * @returns {Promise<Array>} Lista de produtos correspondentes.
     */
    async buscar(termo) {
        if (!termo || !termo.trim()) return this.obterTodos();
        const termoLimpo = termo.toLowerCase().trim();
        
        try {
            const produtos = await this.obterTodos();
            return produtos.filter(p => {
                const nome = (p.nome || '').toLowerCase();
                const codigo = (p.codigo || '').toLowerCase();
                return nome.includes(termoLimpo) || codigo.includes(termoLimpo);
            });
        } catch (error) {
            console.error(`Erro ao buscar produtos com o termo ${termo}:`, error);
            return [];
        }
    }
}

export const produtoService = new ProdutoService();