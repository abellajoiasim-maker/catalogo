/**
 * Abella Joias - PMA V8
 * Service: carrinhoService
 * Descrição: Gerenciamento unificado, seguro e reativo do carrinho de compras integrado ao sistema de descontos.
 */

(function () {
    'use strict';

    // Chave de isolamento do LocalStorage para multi-lojas
    const STORAGE_KEY = 'pma_v8_carrinho_itens';

    function estoqueAtivo(produto) {
        return produto?.estoqueControlado === true
            || produto?.estoqueLimitadoAtivo === true
            || produto?.controleEstoque === true;
    }

    function quantidadeEstoque(valor) {
        return Math.max(0, parseInt(valor, 10) || 0);
    }

    function normalizarVariacao(texto) {
        return String(texto || '').trim().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    }

    function nomeVariacao(valor, indice = 0) {
        if (typeof valor === 'string' || typeof valor === 'number') return String(valor).trim();
        if (!valor || typeof valor !== 'object') return '';
        const candidatos = [valor.texto, valor.valor, valor.value, valor.letra, valor.nome,
            valor.name, valor.label, valor.titulo, valor.medida, valor.descricao, valor.id];
        const encontrado = candidatos.find(v => v !== null && v !== undefined && String(v).trim());
        return encontrado === undefined ? `Medida ${indice + 1}` : String(encontrado).trim();
    }

    function variacoesProduto(produto) {
        const medidas = Array.isArray(produto?.medidas) ? produto.medidas
            : (produto?.medidas && typeof produto.medidas === 'object' ? Object.values(produto.medidas) : []);
        if (medidas.length) return medidas;
        const dizeres = Array.isArray(produto?.dizeres) ? produto.dizeres
            : (Array.isArray(produto?.sayings) ? produto.sayings : []);
        return dizeres.some(v => v && typeof v === 'object') ? dizeres : [];
    }

    function resolverEstoqueVariacao(produto, variacao) {
        const opcoes = variacoesProduto(produto);
        const temQuantidadeIndividual = opcoes.some(v => v && typeof v === 'object'
            && Object.prototype.hasOwnProperty.call(v, 'quantidade'));
        const individual = produto?.variacoesEstoqueModo === 'individual' || temQuantidadeIndividual;
        if (!individual) return { individual: false, encontrada: true, quantidade: null };

        const alvo = normalizarVariacao(variacao);
        const indice = opcoes.findIndex((v, i) => normalizarVariacao(nomeVariacao(v, i)) === alvo);
        if (indice < 0) return { individual: true, encontrada: false, quantidade: 0 };
        const opcao = opcoes[indice];
        const temCampo = opcao && typeof opcao === 'object'
            && Object.prototype.hasOwnProperty.call(opcao, 'quantidade');
        return {
            individual: true,
            encontrada: true,
            quantidade: temCampo ? quantidadeEstoque(opcao.quantidade) : 0
        };
    }

    function mesmaVariacao(a, b) {
        return normalizarVariacao(a) === normalizarVariacao(b);
    }

    function recalcularDisponibilidadeCarrinho(itens, produtoId) {
        const linhas = itens.filter(item => String(item.id) === String(produtoId));
        if (!linhas.length) return;
        const totalProduto = linhas.reduce((total, item) => total + quantidadeEstoque(item.quantidade), 0);
        const limiteGlobal = linhas
            .filter(item => item.estoqueControlado === true && quantidadeEstoque(item.estoqueQuantidade) > 0)
            .map(item => quantidadeEstoque(item.estoqueQuantidade))
            .reduce((menor, atual) => Math.min(menor, atual), Infinity);
        const globalIndisponivel = Number.isFinite(limiteGlobal) && totalProduto > limiteGlobal;
        const grupos = new Map();
        linhas.forEach(item => {
            if (item.estoqueVariacaoControlado !== true) return;
            const chave = normalizarVariacao(item.variacao);
            if (!grupos.has(chave)) grupos.set(chave, { total: 0, saldo: quantidadeEstoque(item.estoqueVariacaoQuantidade) });
            const grupo = grupos.get(chave);
            grupo.total += quantidadeEstoque(item.quantidade);
            grupo.saldo = Math.min(grupo.saldo, quantidadeEstoque(item.estoqueVariacaoQuantidade));
        });
        linhas.forEach(item => {
            const grupo = item.estoqueVariacaoControlado === true ? grupos.get(normalizarVariacao(item.variacao)) : null;
            item.estoqueIndisponivel = item.venderSemEstoque !== true && (
                globalIndisponivel || Boolean(grupo && grupo.total > grupo.saldo)
            );
        });
    }

    /**
     * Recupera os itens do carrinho com tratamento seguro de erros
     * @returns {Array} Lista de itens do carrinho
     */
    // Sacola compartilhada aberta via link (?s=...). Fica só em memória:
    // não toca no localStorage de quem está visualizando.
    let itensTemporarios = null;

    function obterItens() {
        if (itensTemporarios) return itensTemporarios;
        try {
            const dados = localStorage.getItem(STORAGE_KEY);
            return dados ? JSON.parse(dados) : [];
        } catch (error) {
            console.error('[carrinhoService] Erro ao ler itens do localStorage:', error);
            return [];
        }
    }

    /**
     * Salva o estado atual do carrinho no LocalStorage
     * @param {Array} itens - Lista de itens atualizada
     */
    function salvarItens(itens) {
        if (itensTemporarios) { itensTemporarios = itens; return; }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
        } catch (error) {
            console.error('[carrinhoService] Erro ao salvar itens no localStorage:', error);
        }
    }

    // Chave separada para o cupom aplicado (independente dos itens, sobrevive a alterações de quantidade)
    const CUPOM_KEY = 'pma_v8_cupom_aplicado';

    function obterCupomSalvo() {
        if (itensTemporarios) return null;
        try {
            const dados = localStorage.getItem(CUPOM_KEY);
            return dados ? JSON.parse(dados) : null;
        } catch (error) {
            console.error('[carrinhoService] Erro ao ler cupom do localStorage:', error);
            return null;
        }
    }


    // ------------------------------------------------------------------
    // Link compartilhável da sacola
    // Formato: carrinho.html?s=1.<base64url(JSON)>, JSON = [[id, qtd, variacao, preco, peso], ...]
    // ------------------------------------------------------------------
    const VERSAO_LINK = '1';

    function b64urlEncode(texto) {
        const bytes = new TextEncoder().encode(texto);
        let bin = '';
        bytes.forEach(b => { bin += String.fromCharCode(b); });
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function b64urlDecode(codigo) {
        const b64 = codigo.replace(/-/g, '+').replace(/_/g, '/');
        const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
        const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
        return new TextDecoder().decode(bytes);
    }

    function codificarItens(itens) {
        const compacto = itens.map(i => [
            i.id,
            parseInt(i.quantidade, 10) || 1,
            i.variacao || '',
            parseFloat(i.preco) || 0,
            parseFloat(i.peso) || 0
        ]);
        return VERSAO_LINK + '.' + b64urlEncode(JSON.stringify(compacto));
    }

    function decodificarItens(codigo) {
        try {
            const [versao, corpo] = String(codigo || '').split('.');
            if (versao !== VERSAO_LINK || !corpo) return [];
            const lista = JSON.parse(b64urlDecode(corpo));
            if (!Array.isArray(lista)) return [];
            return lista
                .filter(l => Array.isArray(l) && l[0] !== undefined && l[0] !== '')
                .map(l => ({
                    id: String(l[0]),
                    quantidade: Math.max(1, parseInt(l[1], 10) || 1),
                    variacao: String(l[2] || ''),
                    preco: Math.max(0, parseFloat(l[3]) || 0),
                    peso: Math.max(0, parseFloat(l[4]) || 0)
                }));
        } catch (error) {
            console.error('[carrinhoService] Link de sacola inválido:', error);
            return [];
        }
    }

    // Completa nome/foto/estoque/categoria com os dados atuais do produto no Firebase.
    async function hidratarItens(basicos) {
        const base = (typeof window.getAbellaPath === 'function') ? window.getAbellaPath('products') : 'abella/products';
        const ids = [...new Set(basicos.map(i => i.id))];
        const produtos = {};
        await Promise.all(ids.map(async id => {
            try {
                if (!window.db) return;
                const snap = await window.db.ref(base).child(id).once('value');
                produtos[id] = snap.val();
            } catch (e) { produtos[id] = null; }
        }));

        const resultado = [];
        const indisponiveis = [];
        basicos.forEach(b => {
            const p = produtos[b.id];
            if (!p || p.paused === true || p.ativo === false) {
                indisponiveis.push(b.id);
                return;
            }
            const estoqueGlobalControlado = estoqueAtivo(p);
            const estoqueQuantidade = quantidadeEstoque(p.estoqueQuantidade ?? p.estoque ?? 0);
            const estoqueVariacao = resolverEstoqueVariacao(p, b.variacao);
            const estoqueControlado = estoqueGlobalControlado || estoqueVariacao.individual;
            const venderSemEstoque = p.venderSemEstoque === true;
            let quantidade = b.quantidade;
            if (!venderSemEstoque && estoqueVariacao.individual) {
                if (!estoqueVariacao.encontrada || estoqueVariacao.quantidade <= 0) {
                    indisponiveis.push(`${b.id}:${b.variacao}`); return;
                }
                if (quantidade > estoqueVariacao.quantidade) indisponiveis.push(`${b.id}:${b.variacao}`);
                quantidade = Math.min(quantidade, estoqueVariacao.quantidade);
            } else if (!venderSemEstoque && estoqueGlobalControlado) {
                if (estoqueQuantidade <= 0) { indisponiveis.push(b.id); return; }
                if (quantidade > estoqueQuantidade) indisponiveis.push(b.id);
                quantidade = Math.min(quantidade, estoqueQuantidade);
            }
            if (quantidade <= 0) { indisponiveis.push(`${b.id}:${b.variacao}`); return; }
            resultado.push({
                id: b.id,
                sku: p.sku || p.codigo || b.id,
                codigo: p.codigo || p.sku || b.id,
                name: p.nome || p.name || 'Produto',
                preco: b.preco || parseFloat(p.preco ?? p.price ?? 0) || 0,
                category: p.categoriaId || p.category || p.categoria || '',
                subcategory: p.subcategoriaId || p.subcategory || p.subcategoria || '',
                image: p.imagem || p.image || p.img || '',
                peso: b.peso || parseFloat(p.peso || p.weight || 0) || 0,
                quantidade,
                variacao: b.variacao,
                estoqueControlado,
                estoqueQuantidade: estoqueGlobalControlado ? estoqueQuantidade : null,
                estoqueVariacaoControlado: estoqueVariacao.individual,
                estoqueVariacaoQuantidade: estoqueVariacao.individual ? estoqueVariacao.quantidade : null,
                estoqueIndisponivel: false,
                venderSemEstoque
            });
        });
        return { itens: resultado, indisponiveis };
    }

    // Instanciação do serviço com os métodos públicos
    const carrinhoService = {
        

        /**
         * Gera o link que reabre esta sacola em qualquer aparelho. Retorna '' se vazia.
         */
        gerarLinkCompartilhavel: function () {
            const itens = obterItens();
            if (!itens.length) return '';
            const base = window.location.href.split('#')[0].split('?')[0];
            return base + '?s=' + codificarItens(itens);
        },

        /**
         * Abre uma sacola compartilhada em modo visualização (somente memória).
         * Retorna { itens, indisponiveis }.
         */
        carregarCompartilhada: async function (codigo) {
            const basicos = decodificarItens(codigo);
            if (!basicos.length) return { itens: [], indisponiveis: [] };
            const r = await hidratarItens(basicos);
            itensTemporarios = r.itens;
            return r;
        },

        /** true enquanto uma sacola compartilhada está sendo visualizada. */
        emModoVisualizacao: function () {
            return itensTemporarios !== null;
        },

        /** Grava a sacola compartilhada no localStorage do visitante (substitui a atual). */
        usarSacolaCompartilhada: function () {
            if (!itensTemporarios) return false;
            const itens = itensTemporarios;
            itensTemporarios = null;
            salvarItens(itens);
            return true;
        },

        /**
         * Retorna todos os itens do carrinho com os cálculos de desconto atualizados dinamicamente
         */
        listar: function () {
            const itens = obterItens();
            
            // Injeta em tempo real os descontos vigentes do ecossistema para cada item
            return itens.map(item => {
                if (window.descontoService && typeof window.descontoService.calcularPrecoComDesconto === 'function') {
                    const precoFinal = window.descontoService.calcularPrecoComDesconto(item);
                    const badge = window.descontoService.obterEtiquetaOferta(item);
                    return {
                        ...item,
                        precoVendaUnitario: precoFinal,
                        possuiDesconto: precoFinal < (parseFloat(item.preco) || 0),
                        badgePromocional: badge
                    };
                }
                // Fallback de segurança caso o descontoService falhe ou não tenha carregado
                return {
                    ...item,
                    precoVendaUnitario: parseFloat(item.preco) || 0,
                    possuiDesconto: false,
                    badgePromocional: null
                };
            });
        },

        /**
         * Retorna a lista de itens brutos (utilizado por componentes externos)
         */
        obterItens: function() {
            return obterItens();
        },

        /** Valida um lote inteiro antes de persistir qualquer linha no carrinho. */
        validarAdicoes: function (produto, adicoes = []) {
            if (!produto || !Array.isArray(adicoes) || !adicoes.length) return false;
            const id = String(produto.id || produto.codigo || produto.sku || '');
            const atuais = obterItens();
            const infoVariacoes = new Map();
            const quantidadesPedidas = new Map();
            let somaPedido = 0;
            for (const adicao of adicoes) {
                const label = String(adicao.variacao || '').trim();
                const qtd = parseInt(adicao.qtd ?? adicao.quantidade, 10);
                if (!Number.isFinite(qtd) || qtd <= 0) return false;
                somaPedido += qtd;
                const info = resolverEstoqueVariacao(produto, label);
                if (info.individual) {
                    if (!info.encontrada) return false;
                    const key = normalizarVariacao(label);
                    infoVariacoes.set(key, info);
                    quantidadesPedidas.set(key, (quantidadesPedidas.get(key) || 0) + qtd);
                }
            }
            const permiteSemEstoque = produto.venderSemEstoque === true;
            if (permiteSemEstoque) return true;
            if (infoVariacoes.size) {
                for (const [key, qtdNova] of quantidadesPedidas) {
                    const qtdAtual = atuais.filter(i => String(i.id) === id && mesmaVariacao(i.variacao, key))
                        .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                    if (qtdAtual + qtdNova > infoVariacoes.get(key).quantidade) return false;
                }
                if (estoqueAtivo(produto)) {
                    const saldoGlobal = quantidadeEstoque(produto.estoqueQuantidade ?? produto.estoque ?? 0);
                    const totalAtual = atuais.filter(i => String(i.id) === id)
                        .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                    if (saldoGlobal > 0 && totalAtual + somaPedido > saldoGlobal) return false;
                }
                return true;
            }
            if (estoqueAtivo(produto)) {
                const qtdAtual = atuais.filter(i => String(i.id) === id)
                    .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                const saldo = quantidadeEstoque(produto.estoqueQuantidade ?? produto.estoque ?? 0);
                if (qtdAtual + somaPedido > saldo) return false;
            }
            return true;
        },

        /** Atualiza saldos do carrinho com o Firebase e marca linhas que ficaram indisponíveis. */
        sincronizarEstoqueAtual: async function () {
            const itens = obterItens();
            if (!itens.length) return { valido: true, indisponiveis: [] };
            if (!window.db) {
                const indisponiveis = itens.filter(i => (i.estoqueControlado || i.estoqueVariacaoControlado) && i.venderSemEstoque !== true);
                indisponiveis.forEach(i => { i.estoqueIndisponivel = true; });
                salvarItens(itens);
                return { valido: indisponiveis.length === 0, indisponiveis };
            }
            const base = typeof window.getAbellaPath === 'function' ? window.getAbellaPath('products') : 'abella/products';
            const ids = [...new Set(itens.map(i => String(i.id)))];
            const produtos = {};
            await Promise.all(ids.map(async id => {
                try {
                    const snap = await window.db.ref(base).child(id).once('value');
                    produtos[id] = snap.exists() ? snap.val() : null;
                } catch (e) { produtos[id] = null; }
            }));

            const grupos = new Map();
            const gruposVariacoes = new Map();
            const indisponiveis = [];
            for (const item of itens) {
                const p = produtos[String(item.id)];
                if (!p) {
                    item.estoqueIndisponivel = Boolean((item.estoqueControlado || item.estoqueVariacaoControlado) && item.venderSemEstoque !== true);
                    if (item.estoqueIndisponivel) indisponiveis.push(item);
                    continue;
                }
                const globalControlado = estoqueAtivo(p);
                const saldoGlobal = quantidadeEstoque(p.estoqueQuantidade ?? p.estoque ?? 0);
                const saldoVariacao = resolverEstoqueVariacao(p, item.variacao);
                const controleAtivo = globalControlado || saldoVariacao.individual;
                const permiteSemEstoque = p.venderSemEstoque === true;
                item.estoqueControlado = controleAtivo;
                item.estoqueQuantidade = globalControlado ? saldoGlobal : null;
                item.estoqueVariacaoControlado = saldoVariacao.individual;
                item.estoqueVariacaoQuantidade = saldoVariacao.individual ? saldoVariacao.quantidade : null;
                item.venderSemEstoque = permiteSemEstoque;
                item.estoqueDisponivel = saldoVariacao.individual ? saldoVariacao.quantidade : (globalControlado ? saldoGlobal : null);
                item.estoqueIndisponivel = false;
                if (!permiteSemEstoque && saldoVariacao.individual
                    && (!saldoVariacao.encontrada || quantidadeEstoque(item.quantidade) > saldoVariacao.quantidade)) {
                    item.estoqueIndisponivel = true;
                }
                if (!permiteSemEstoque && saldoVariacao.individual && saldoVariacao.quantidade <= 0) item.estoqueIndisponivel = true;
                if (item.estoqueIndisponivel) indisponiveis.push(item);
                if (saldoVariacao.individual && !permiteSemEstoque) {
                    const chaveVariacao = `${String(item.id)}\u001f${normalizarVariacao(item.variacao)}`;
                    if (!gruposVariacoes.has(chaveVariacao)) {
                        gruposVariacoes.set(chaveVariacao, { saldo: saldoVariacao.quantidade, linhas: [], total: 0 });
                    }
                    const grupoVariacao = gruposVariacoes.get(chaveVariacao);
                    grupoVariacao.saldo = Math.min(grupoVariacao.saldo, saldoVariacao.quantidade);
                    grupoVariacao.linhas.push(item);
                    grupoVariacao.total += quantidadeEstoque(item.quantidade);
                }
                if (!grupos.has(String(item.id))) grupos.set(String(item.id), { p, globalControlado, saldoGlobal, permiteSemEstoque, temVariacao: saldoVariacao.individual, linhas: [] });
                const grupo = grupos.get(String(item.id));
                grupo.temVariacao = grupo.temVariacao || saldoVariacao.individual;
                grupo.linhas.push(item);
            }
            for (const grupo of grupos.values()) {
                if (grupo.permiteSemEstoque || !grupo.globalControlado) continue;
                if (grupo.temVariacao && grupo.saldoGlobal <= 0) continue;
                const total = grupo.linhas.reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                if (total > grupo.saldoGlobal) {
                    grupo.linhas.forEach(i => {
                        if (!i.estoqueIndisponivel) { i.estoqueIndisponivel = true; indisponiveis.push(i); }
                    });
                }
            }
            for (const grupo of gruposVariacoes.values()) {
                if (grupo.total > grupo.saldo) {
                    grupo.linhas.forEach(i => {
                        if (!i.estoqueIndisponivel) { i.estoqueIndisponivel = true; indisponiveis.push(i); }
                    });
                }
            }
            salvarItens(itens);
            return { valido: indisponiveis.length === 0, indisponiveis };
        },

        /**
         * Adiciona um produto ou incrementa sua quantidade caso já exista (considerando a variação)
         * @param {Object} produto - Objeto do produto a ser adicionado
         * @param {number} quantidade - Quantidade desejada (padrão 1)
         * @param {string} variacao - String contendo o nome da variação/grade (opcional)
         */
        adicionar: function (produto, quantidade = 1, variacao = '') {
            if (!produto || (!produto.id && !produto.codigo && !produto.sku)) {
                console.error('[carrinhoService] Produto inválido para adição.');
                return false;
            }

            const pId = String(produto.id || produto.codigo || produto.sku);
            const labelVariacao = variacao ? String(variacao).trim() : '';
            const qtdSolicitada = parseInt(quantidade, 10);
            if (!Number.isFinite(qtdSolicitada) || qtdSolicitada <= 0) return false;
            const itens = obterItens();
            const estoqueGlobalControlado = estoqueAtivo(produto);
            const estoqueQuantidade = quantidadeEstoque(produto.estoqueQuantidade ?? produto.estoque ?? 0);
            const estoqueVariacao = resolverEstoqueVariacao(produto, labelVariacao);
            const estoqueControlado = estoqueGlobalControlado || estoqueVariacao.individual;
            const venderSemEstoque = produto.venderSemEstoque === true;
            if (!venderSemEstoque && estoqueVariacao.individual) {
                if (!estoqueVariacao.encontrada) return false;
                const qtdAtualVariacao = itens.filter(item => String(item.id) === pId && mesmaVariacao(item.variacao, labelVariacao))
                    .reduce((total, item) => total + quantidadeEstoque(item.quantidade), 0);
                if (qtdAtualVariacao + qtdSolicitada > estoqueVariacao.quantidade) {
                    console.warn('[carrinhoService] Limite de estoque atingido para a variação', pId, labelVariacao);
                    return false;
                }
                if (estoqueGlobalControlado && estoqueQuantidade > 0) {
                    const totalAtual = itens.filter(item => String(item.id) === pId)
                        .reduce((total, item) => total + quantidadeEstoque(item.quantidade), 0);
                    if (totalAtual + qtdSolicitada > estoqueQuantidade) return false;
                }
            } else if (!venderSemEstoque && estoqueGlobalControlado) {
                const totalAtual = itens.filter(item => String(item.id) === pId)
                    .reduce((total, item) => total + quantidadeEstoque(item.quantidade), 0);
                if (totalAtual + qtdSolicitada > estoqueQuantidade) {
                    console.warn('[carrinhoService] Limite de estoque atingido para', pId);
                    return false;
                }
            }

            // Busca por ID E pela variação exata para não somar itens de grades diferentes na mesma linha
            const index = itens.findIndex(item => String(item.id) === pId && mesmaVariacao(item.variacao, labelVariacao));

            if (index !== -1) {
                itens[index].quantidade = quantidadeEstoque(itens[index].quantidade) + qtdSolicitada;
                itens[index].estoqueControlado = estoqueControlado;
                itens[index].estoqueQuantidade = estoqueGlobalControlado ? estoqueQuantidade : null;
                itens[index].estoqueVariacaoControlado = estoqueVariacao.individual;
                itens[index].estoqueVariacaoQuantidade = estoqueVariacao.individual ? estoqueVariacao.quantidade : null;
                itens[index].estoqueDisponivel = estoqueVariacao.individual ? estoqueVariacao.quantidade : (estoqueGlobalControlado ? estoqueQuantidade : null);
                itens[index].estoqueIndisponivel = false;
                itens[index].venderSemEstoque = venderSemEstoque;
            } else {
                // Guarda apenas os dados brutos essenciais estruturais no storage
                itens.push({
                    id: pId,
                    sku: produto.sku || produto.codigo || pId,
                    codigo: produto.codigo || produto.sku || pId,
                    name: produto.nome || produto.name,
                    preco: parseFloat(produto.preco) || 0,
                    category: produto.categoriaId || produto.category || produto.categoria || '',
                    subcategory: produto.subcategoriaId || produto.subcategory || produto.subcategoria || '',
                    image: produto.imagem || produto.image || '',
                    peso: parseFloat(produto.peso || 0),
                    quantidade: qtdSolicitada,
                    variacao: labelVariacao, // Persistência estável da grade escolhida
                    estoqueControlado,
                    estoqueQuantidade: estoqueGlobalControlado ? estoqueQuantidade : null,
                    estoqueVariacaoControlado: estoqueVariacao.individual,
                    estoqueVariacaoQuantidade: estoqueVariacao.individual ? estoqueVariacao.quantidade : null,
                    estoqueDisponivel: estoqueVariacao.individual ? estoqueVariacao.quantidade : (estoqueGlobalControlado ? estoqueQuantidade : null),
                    estoqueIndisponivel: false,
                    venderSemEstoque
                });
            }

            salvarItens(itens);
            console.info(`[carrinhoService] Produto ID ${pId} (${labelVariacao || 'Sem Variação'}) adicionado/atualizado.`);
            return true;
        },

        /**
         * Remove completamente um item do carrinho pelo ID e sua variação específica
         * @param {string|number} produtoId - ID do produto
         * @param {string} variacao - Nome da variação para diferenciação
         */
        remover: function (produtoId, variacao = '') {
            let itens = obterItens();
            const tamanhoOriginal = itens.length;
            const labelVariacao = variacao ? variacao.trim() : '';
            
            itens = itens.filter(item => !(String(item.id) === String(produtoId) && mesmaVariacao(item.variacao, labelVariacao)));

            if (itens.length < tamanhoOriginal) {
                recalcularDisponibilidadeCarrinho(itens, produtoId);
                salvarItens(itens);
                console.info(`[carrinhoService] Produto ID ${produtoId} (${labelVariacao}) removido do carrinho.`);
                return true;
            }
            return false;
        },

        /**
         * Atualiza diretamente a quantidade de um item específico filtrado por variação
         */
        atualizarQuantidade: function (produtoId, novaQuantidade, variacao = '') {
            if (novaQuantidade <= 0) {
                return this.remover(produtoId, variacao);
            }

            const itens = obterItens();
            const labelVariacao = variacao ? variacao.trim() : '';
            const item = itens.find(item => String(item.id) === String(produtoId) && mesmaVariacao(item.variacao, labelVariacao));

            if (item) {
                const qtdNova = parseInt(novaQuantidade, 10);
                if (!Number.isFinite(qtdNova) || qtdNova <= 0) return false;
                const permiteSemEstoque = item.venderSemEstoque === true;
                const quantidadeOutrasLinhasVariacao = item.estoqueVariacaoControlado === true
                    ? itens.filter(i => String(i.id) === String(produtoId) && i !== item && mesmaVariacao(i.variacao, labelVariacao))
                        .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0)
                    : 0;
                if (!permiteSemEstoque && item.estoqueVariacaoControlado === true
                    && quantidadeOutrasLinhasVariacao + qtdNova > quantidadeEstoque(item.estoqueVariacaoQuantidade)) {
                    console.warn('[carrinhoService] Quantidade acima do saldo desta variação.');
                    return false;
                }
                if (!permiteSemEstoque && item.estoqueVariacaoControlado === true
                    && quantidadeEstoque(item.estoqueQuantidade) > 0) {
                    const totalOutrasLinhas = itens.filter(i => String(i.id) === String(produtoId) && i !== item)
                        .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                    if (totalOutrasLinhas + qtdNova > quantidadeEstoque(item.estoqueQuantidade)) return false;
                }
                if (!permiteSemEstoque && item.estoqueControlado === true && item.estoqueVariacaoControlado !== true) {
                    const totalOutrasLinhas = itens.filter(i => String(i.id) === String(produtoId) && i !== item)
                        .reduce((s, i) => s + quantidadeEstoque(i.quantidade), 0);
                    if (totalOutrasLinhas + qtdNova > quantidadeEstoque(item.estoqueQuantidade)) {
                        console.warn('[carrinhoService] Quantidade total acima do estoque disponível.');
                        return false;
                    }
                }
                item.quantidade = qtdNova;
                recalcularDisponibilidadeCarrinho(itens, produtoId);
                salvarItens(itens);
                console.info(`[carrinhoService] Quantidade do produto ID ${produtoId} (${labelVariacao}) atualizada para ${novaQuantidade}.`);
                return true;
            }
            return false;
        },

        /**
         * Limpa totalmente os itens salvos no carrinho
         */
        limpar: function () {
            try {
                localStorage.removeItem(STORAGE_KEY);
                console.info('[carrinhoService] Carrinho esvaziado com sucesso.');
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao limpar carrinho:', error);
                return false;
            }
        },

        /**
         * Calcula o total de itens (soma das quantidades) presentes no carrinho
         */
        obterContagem: function () {
            return obterItens().reduce((total, item) => total + (parseInt(item.quantidade) || 0), 0);
        },

        /**
         * Calcula o valor BRUTO total acumulado (sem qualquer tipo de desconto)
         */
        obterTotalBruto: function () {
            return obterItens().reduce((total, item) => {
                const precoOriginal = parseFloat(item.preco) || 0;
                return total + (precoOriginal * (parseInt(item.quantidade) || 0));
            }, 0);
        },

        /**
         * Calcula o valor LÍQUIDO total real de cobrança aplicando as regras do descontoService
         * e, se houver, o cupom de código aplicado pelo cliente + a faixa de desconto por valor.
         */
        obterTotal: function () {
            const itensComDesconto = this.listar();
            const subtotalComDescontoCategoria = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            const descontoCupom = this.obterDescontoCupom();
            const descontoFaixa = this.obterDescontoFaixaValor();
            return Math.max(0, subtotalComDescontoCategoria - descontoCupom - descontoFaixa);
        },

        /**
         * Calcula o valor em R$ do desconto automático por faixa de valor de compra (sem código).
         */
        obterDescontoFaixaValor: function () {
            if (!window.descontoService) return 0;

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            const faixa = window.descontoService.obterMelhorFaixaValor(subtotal);
            if (!faixa) return 0;

            const percentual = Math.min(100, Math.max(0, parseFloat(faixa.percentual) || 0));
            return Math.round((subtotal * (percentual / 100) + Number.EPSILON) * 100) / 100;
        },

        /**
         * Retorna a faixa de valor atualmente aplicada (ou null), útil para exibir a etiqueta na UI.
         */
        obterFaixaValorAplicada: function () {
            if (!window.descontoService) return null;
            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);
            return window.descontoService.obterMelhorFaixaValor(subtotal);
        },

        /**
         * Retorna o progresso até a próxima meta de desconto por valor.
         * O cálculo usa o subtotal após ofertas de produto/categoria, antes da faixa.
         */
        obterProgressoFaixaValor: function () {
            if (!window.descontoService || typeof window.descontoService.obterProgressoFaixaValor !== 'function') {
                return null;
            }

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            return window.descontoService.obterProgressoFaixaValor(subtotal);
        },

        /**
         * Aplica um cupom já validado (objeto retornado por cupomService.validar) ao carrinho atual.
         */
        aplicarCupom: function (cupom) {
            try {
                localStorage.setItem(CUPOM_KEY, JSON.stringify(cupom));
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao aplicar cupom:', error);
                return false;
            }
        },

        /**
         * Remove o cupom atualmente aplicado ao carrinho.
         */
        removerCupom: function () {
            try {
                localStorage.removeItem(CUPOM_KEY);
                return true;
            } catch (error) {
                console.error('[carrinhoService] Erro ao remover cupom:', error);
                return false;
            }
        },

        /**
         * Retorna o cupom atualmente aplicado (ou null se nenhum estiver ativo).
         */
        obterCupomAplicado: function () {
            return obterCupomSalvo();
        },

        /**
         * Calcula o valor em R$ do desconto do cupom aplicado, já sobre o subtotal com desconto de categoria.
         */
        obterDescontoCupom: function () {
            const cupom = obterCupomSalvo();
            if (!cupom || !window.cupomService) return 0;

            const itensComDesconto = this.listar();
            const subtotal = itensComDesconto.reduce((total, item) => {
                return total + (item.precoVendaUnitario * (parseInt(item.quantidade) || 0));
            }, 0);

            return window.cupomService.calcularDesconto(cupom, subtotal);
        }
    };

    // Aplicação do congelamento estrito (Imutabilidade de Runtime)
    Object.freeze(carrinhoService);

    // Exposição segura no escopo global (window)
    window.carrinhoService = carrinhoService;

})();
