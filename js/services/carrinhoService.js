// ======================================================================
// js/services/carrinhoService.js
// Abella Joias • CarrinhoService Premium v5.2.0 (Auditado)
// ======================================================================

const CarrinhoService = {

    STORAGE_KEY: 'abella_carrinho_v7',
    LEGACY_KEY: 'abella_carrinho',

    // =====================================================
    // HELPERS
    // =====================================================

    _safeParse(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            console.error('[Carrinho] Erro parse JSON:', e);
            return [];
        }
    },

    _safeNumber(valor, fallback = 0) {
        const n = Number(valor);
        return Number.isFinite(n) ? n : fallback;
    },

    _normalizarTexto(valor) {
        return (valor || '').toString().trim();
    },

    // =====================================================
    // ACESSO AOS DADOS
    // =====================================================

    getItens() {
        const novo = localStorage.getItem(this.STORAGE_KEY);
        const antigo = localStorage.getItem(this.LEGACY_KEY);
        return this._safeParse(novo || antigo || '[]');
    },

    obterItens() {
        return this.getItens();
    },

    salvar(itens) {
        try {
            const json = JSON.stringify(itens);
            localStorage.setItem(this.STORAGE_KEY, json);
            this.notificarMudanca();
        } catch (e) {
            console.error('[Carrinho] Erro ao persistir itens:', e);
        }
    },

    limpar() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.LEGACY_KEY);
        this.notificarMudanca();
    },

    // =====================================================
    // CORE DO FLUXO — ADICIONAR ITEM CONFORME CONTRATO
    // =====================================================

    adicionar(produto, quantidade = 1, variacaoNome = '') {
        if (!produto || !produto.id) return;

        const itens = this.getItens();
        const qtdAdicionar = parseInt(quantidade) || 1;
        if (qtdAdicionar <= 0) return;

        // Determinação correta do preço final do contrato de dados
        let precoFinal = this._safeNumber(produto.preco);
        if (produto.precoPromocional && produto.precoPromocional > 0 && produto.precoPromocional < produto.preco) {
            precoFinal = this._safeNumber(produto.precoPromocional);
        }

        const codProduto = this._normalizarTexto(produto.codigo);
        const nomeProduto = this._normalizarTexto(produto.nome);
        const vNomeTratado = this._normalizarTexto(variacaoNome || produto.variacaoSelecionada);

        // Chave de unicidade combinando o ID do produto e a sua variação de tamanho/cor
        const itemExistente = itens.find(item => 
            item.id === produto.id && 
            this._normalizarTexto(item.variacaoSelecionada) === vNomeTratado
        );

        if (itemExistente) {
            itemExistente.quantidade += qtdAdicionar;
        } else {
            itens.push({
                id: produto.id,
                codigo: codProduto,
                nome: nomeProduto,
                categoria: this._normalizarTexto(produto.categoria),
                preco: precoFinal,
                peso: this._safeNumber(produto.peso),
                thumbnail: this._normalizarTexto(produto.thumbnail),
                variacaoSelecionada: vNomeTratado,
                quantidade: qtdAdicionar
            });
        }

        this.salvar(itens);
    },

    remover(produtoId, variacaoNome = '') {
        let itens = this.getItens();
        const vNomeTratado = this._normalizarTexto(variacaoNome);

        itens = itens.filter(item => !(
            item.id === produtoId && 
            this._normalizarTexto(item.variacaoSelecionada) === vNomeTratado
        ));

        this.salvar(itens);
    },

    atualizarQuantidade(produtoId, variacaoNome = '', novaQuantidade) {
        const itens = this.getItens();
        const qtd = parseInt(novaQuantidade) || 0;
        const vNomeTratado = this._normalizarTexto(variacaoNome);

        if (qtd <= 0) {
            this.remover(produtoId, variacaoNome);
            return;
        }

        const item = itens.find(i => 
            i.id === produtoId && 
            this._normalizarTexto(i.variacaoSelecionada) === vNomeTratado
        );

        if (item) {
            item.quantidade = qtd;
            this.salvar(itens);
        }
    },

    // =====================================================
    // ENGENHARIA FINANCEIRA E TOTAIS (SEM DUPLICIDADES)
    // =====================================================

    calcularTotais(descontoPixPercentual = 5) {
        const itens = this.getItens();
        let subtotal = 0;
        let pesoTotal = 0;
        let totalPecas = 0;

        itens.forEach(item => {
            const preco = this._safeNumber(item.preco);
            const qtd = parseInt(item.quantidade) || 1;

            subtotal += preco * qtd;
            pesoTotal += this._safeNumber(item.peso) * qtd;
            totalPecas += qtd;
        });

        const descontoPix = subtotal * (descontoPixPercentual / 100);

        return {
            subtotal,
            pesoTotal,
            totalPecas,
            descontoPix,
            totalPix: subtotal - descontoPix
        };
    },

    getResumo() {
        return this.calcularTotais();
    },

    obterResumo() {
        return this.getResumo();
    },

    possuiItens() {
        return this.getItens().length > 0;
    },

    notificarMudanca() {
        window.dispatchEvent(new Event('carrinhoAtualizado'));
    }
};

window.CarrinhoService = CarrinhoService;
window.carrinhoService = CarrinhoService;
