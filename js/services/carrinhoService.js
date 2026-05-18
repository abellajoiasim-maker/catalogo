// FILE: /js/services/carrinhoService.js

import { storage } from '../utils/storage.js';

/**
 * Service responsável pelo gerenciamento de estado e persistência do carrinho de compras.
 * Mantém intactas as regras de persistência via localStorage exigidas pelo catálogo Abella Joias.
 */
class CarrinhoService {
    constructor() {
        this.STORAGE_KEY = 'abella_joias_carrinho';
        this.itens = this.carregar();
        this.listeners = [];
    }

    /**
     * Carrega os itens salvos de forma segura do localStorage.
     * @returns {Array} Lista de itens do carrinho.
     */
    carregar() {
        const dados = storage.get(this.STORAGE_KEY);
        return Array.isArray(dados) ? dados : [];
    }

    /**
     * Salva o estado atual do carrinho no localStorage e notifica os componentes dependentes.
     */
    salvar() {
        storage.set(this.STORAGE_KEY, this.itens);
        this.notificarListeners();
    }

    /**
     * Retorna a lista atual de itens presentes no carrinho.
     * @returns {Array}
     */
    obterItens() {
        return this.itens;
    }

    /**
     * Adiciona um produto ao carrinho ou incrementa sua quantidade caso já exista.
     * Mantém os campos originais de preço e metadados vindos do Realtime Database.
     * @param {Object} produto - Dados completos do produto bruto/semijoia.
     * @param {number} quantidade - Quantidade a ser adicionada.
     */
    adicionarItem(produto, quantidade = 1) {
        if (!produto || !produto.id) return;

        const itemExistente = this.itens.find(item => item.id === produto.id);

        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            this.itens.push({
                id: produto.id,
                nome: produto.nome || '',
                preco: Number(produto.preco) || 0,
                imagem: produto.imagem || '',
                codigo: produto.codigo || '',
                categoria: produto.categoria || '',
                quantidade: quantidade
            });
        }

        this.salvar();
    }

    /**
     * Remove completamente um item do carrinho através de seu ID exclusivo.
     * @param {string} idProduto - ID do produto a ser removido.
     */
    removerItem(idProduto) {
        this.itens = this.itens.filter(item => item.id !== idProduto);
        this.salvar();
    }

    /**
     * Atualiza a quantidade de um item específico de forma controlada e sem reloads de página.
     * @param {string} idProduto - ID do item a ser alterado.
     * @param {number} novaQuantidade - Nova quantidade absoluta para o item.
     */
    atualizarQuantidade(idProduto, novaQuantidade) {
        const item = this.itens.find(item => item.id === idProduto);
        if (item) {
            item.quantidade = Math.max(1, parseInt(novaQuantidade, 10) || 1);
            this.salvar();
        }
    }

    /**
     * Limpa de forma integral todos os itens do carrinho no estado e no armazenamento.
     */
    limparCarrinho() {
        this.itens = [];
        this.salvar();
    }

    /**
     * Calcula o valor bruto subtotal somando os itens multiplicados por suas respectivas quantidades.
     * Esta função fornece a base numérica pura para o cálculo de descontos subsequente.
     * @returns {number} Valor bruto total em formato flutuante.
     */
    calcularSubtotal() {
        return this.itens.reduce((total, item) => {
            const preco = Number(item.preco) || 0;
            const qtd = parseInt(item.quantidade, 10) || 0;
            return total + (preco * qtd);
        }, 0);
    }

    /**
     * Retorna a contagem total física de unidades de itens presentes dentro do carrinho.
     * @returns {number}
     */
    obterTotalItens() {
        return this.itens.reduce((total, item) => total + (parseInt(item.quantidade, 10) || 0), 0);
    }

    /**
     * Registra um callback para monitorar as alterações de estado do carrinho (Pattern Observer).
     * @param {Function} callback - Função chamada a cada modificação do carrinho.
     */
    onChange(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    /**
     * Executa todos os callbacks registrados notificando a alteração de dados.
     * @private
     */
    notificarListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.itens);
            } catch (error) {
                console.error("Erro ao notificar listener do carrinho:", error);
            }
        });
    }
}

export const carrinhoService = new CarrinhoService();