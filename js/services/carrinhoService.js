// FILE: js/services/carrinhoService.js
import { storage } from '../utils/storage.js';

class CarrinhoService {
    constructor() {
        this.CHAVE_STORAGE = 'carrinho';
    }

    obterItens() {
        return storage.get(this.CHAVE_STORAGE) || [];
    }

    salvarLista(lista) {
        storage.set(this.CHAVE_STORAGE, lista);
        // Desparacha evento customizado para sincronismo em tempo real de contadores externos
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    }

    limpar() {
        storage.remove(this.CHAVE_STORAGE);
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    }
}

export const carrinhoService = new CarrinhoService();
