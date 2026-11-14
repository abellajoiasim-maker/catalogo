/* Abella Joias — camada opcional de compra rápida.
 * O modo completo e os serviços existentes permanecem como fluxo padrão.
 */
(function () {
    'use strict';

    const paramsIniciais = new URLSearchParams(window.location.search);
    const estado = {
        ativo: paramsIniciais.get('modo') === 'rapida',
        categorias: [],
        categoriaAtual: null
    };

    const normalizar = valor => String(valor || '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');

    const categoriasAtivas = raw => Object.entries(raw || {})
        .filter(([, categoria]) => categoria && categoria.ativo !== false
            && categoria.active !== false && categoria.paused !== true)
        .map(([id, categoria]) => {
            const filhos = categoria.subcategorias || categoria.subcategories || {};
            const subcategorias = Object.entries(filhos)
                .filter(([, sub]) => sub && sub.ativo !== false && sub.active !== false && sub.paused !== true)
                .map(([subId, sub]) => ({
                    id: String(sub.slug || subId),
                    chave: String(subId),
                    nome: String(sub.nome || sub.name || sub.title || subId),
                    ordem: Number(sub.ordem ?? sub.order ?? 0)
                }))
                .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
            return {
                id: String(id),
                slug: String(categoria.slug || id),
                nome: String(categoria.nome || categoria.name || id),
                ordem: Number(categoria.ordem ?? categoria.order ?? 0),
                subcategorias
            };
        })
        .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));

    function categoriaPorId(valor) {
        const alvo = normalizar(valor);
        return estado.categorias.find(c => normalizar(c.id) === alvo || normalizar(c.slug) === alvo) || null;
    }

    function urlAtualizada({ categoria, subcategoria, todos, busca, removerBusca = false, limparContexto = false } = {}) {
        const url = new URL(window.location.href);
        url.searchParams.set('modo', 'rapida');
        url.searchParams.delete('id');
        url.searchParams.delete('sub');

        if (limparContexto) {
            url.searchParams.delete('categoria');
            url.searchParams.delete('subcategoria');
            url.searchParams.delete('todos');
        } else {
            if (categoria !== undefined) {
                if (categoria) url.searchParams.set('categoria', categoria);
                else url.searchParams.delete('categoria');
            }
            if (subcategoria !== undefined) {
                if (subcategoria) url.searchParams.set('subcategoria', subcategoria);
                else url.searchParams.delete('subcategoria');
            }
            if (todos !== undefined) {
                if (todos) url.searchParams.set('todos', '1');
                else url.searchParams.delete('todos');
            }
        }

        if (removerBusca) url.searchParams.delete('busca');
        if (busca !== undefined) {
            if (busca) url.searchParams.set('busca', busca);
            else url.searchParams.delete('busca');
        }
        return url;
    }

    function navegar(opcoes) {
        window.location.href = urlAtualizada(opcoes).toString();
    }

    function temGrade(produto) {
        const temLista = valor => Array.isArray(valor) ? valor.length > 0
            : Boolean(valor && typeof valor === 'object' && Object.keys(valor).length > 0);
        return temLista(produto.medidas) || temLista(produto.dizeres) || temLista(produto.iniciais);
    }

    function formatarMoeda(valor) {
        if (window.MoneyUtils && typeof window.MoneyUtils.format === 'function') {
            return window.MoneyUtils.format(valor);
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
    }

    function atualizarSacola() {
        if (!estado.ativo || !window.carrinhoService) return;
        const quantidade = document.getElementById('quick-cart-count');
        const total = document.getElementById('quick-cart-total');
        const cabecalho = document.getElementById('cart-count');
        const qtd = Number(window.carrinhoService.obterContagem?.() || 0);
        const valor = Number(window.carrinhoService.obterTotal?.() || 0);
        if (quantidade) quantidade.textContent = `${qtd} ${qtd === 1 ? 'item' : 'itens'}`;
        if (total) total.textContent = formatarMoeda(valor);
        if (cabecalho) cabecalho.textContent = String(qtd);
    }

    function mostrarMensagem(texto) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(texto);
            return;
        }
        const status = document.getElementById('quick-buy-status');
        if (status) status.textContent = texto;
    }

    function adicionarProduto(produtoId, produtos) {
        const produto = (produtos || []).find(item => String(item.id) === String(produtoId));
        if (!produto) return;

        const ehVitrine = produto._ehVitrine === true || produto.vitrine === true
            || produto.isVitrine === true || produto.showcase === true || produto.tipo === 'vitrine';
        if (ehVitrine || temGrade(produto)) {
            if (typeof window.abrirProduto === 'function') window.abrirProduto(produto.id);
            return;
        }

        if (!window.carrinhoService || typeof window.carrinhoService.adicionar !== 'function') {
            mostrarMensagem('A sacola está indisponível no momento. Tente novamente.');
            return;
        }

        const estoqueControlado = produto.estoqueControlado === true
            || produto.estoqueLimitadoAtivo === true || produto.controleEstoque === true;
        const estoqueQuantidade = Math.max(0, parseInt(produto.estoqueQuantidade ?? produto.estoque ?? 0, 10) || 0);
        if (estoqueControlado && estoqueQuantidade < 1 && produto.venderSemEstoque !== true) {
            mostrarMensagem('Este produto está esgotado no momento.');
            return;
        }

        const adicionou = window.carrinhoService.adicionar(produto, 1, '');
        if (adicionou === false) {
            mostrarMensagem('Não foi possível adicionar. Verifique o estoque disponível.');
            return;
        }
        atualizarSacola();
        mostrarMensagem(`${produto.nome || produto.name || 'Produto'} adicionado à sacola.`);
        window.dispatchEvent(new CustomEvent('abella:cart-updated'));
    }

    function decorarGrade(grade, produtos) {
        if (!estado.ativo || !grade) return;
        grade.querySelectorAll('[data-produto-id]').forEach(cardExterno => {
            const id = cardExterno.getAttribute('data-produto-id');
            const produto = (produtos || []).find(item => String(item.id) === String(id));
            if (!produto || produto._ehVitrine || cardExterno.querySelector('.quick-buy-add')) return;
            const card = cardExterno.querySelector('.aurora-card--product');
            const corpo = card && card.querySelector('.body');
            if (!corpo) return;

            const comVariacoes = temGrade(produto);
            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'quick-buy-add';
            botao.textContent = comVariacoes ? 'Escolher variação' : '＋ Adicionar';
            botao.setAttribute('aria-label', `${comVariacoes ? 'Escolher variação de' : 'Adicionar'} ${produto.nome || produto.name || 'produto'}`);
            botao.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                adicionarProduto(id, produtos);
            });
            corpo.appendChild(botao);
        });
    }

    function atualizarVisibilidade() {
        if (!estado.ativo) return;
        const url = new URL(window.location.href);
        const categoriaSlug = url.searchParams.get('categoria') || url.searchParams.get('id') || '';
        const subcategoriaSlug = url.searchParams.get('subcategoria') || url.searchParams.get('sub') || '';
        const busca = (url.searchParams.get('busca') || '').trim();
        const todos = url.searchParams.get('todos') === '1';
        const categoria = categoriaPorId(categoriaSlug);
        const precisaEscolherCategoria = !busca && !categoriaSlug;
        const precisaEscolherSubcategoria = !busca && Boolean(categoria)
            && categoria.subcategorias.length > 0 && !subcategoriaSlug && !todos;
        const navegacaoPendente = precisaEscolherCategoria || precisaEscolherSubcategoria;
        const grade = document.getElementById('grid-produtos');
        const semResultados = document.getElementById('no-result');
        if (grade) grade.classList.toggle('quick-buy-grid-hidden', navegacaoPendente);
        if (semResultados && navegacaoPendente) semResultados.classList.add('hidden');

        const status = document.getElementById('quick-buy-status');
        if (status) {
            if (busca) status.textContent = `Buscando “${busca}” no catálogo. Os resultados podem incluir qualquer categoria.`;
            else if (precisaEscolherCategoria) status.textContent = 'Escolha uma categoria ou busque um produto pelo nome ou SKU.';
            else if (precisaEscolherSubcategoria) status.textContent = 'Agora escolha uma subcategoria ou selecione “Ver todos desta categoria”.';
            else if (categoria) status.textContent = `Produtos em ${categoria.nome}.`;
            else status.textContent = '';
        }
    }

    function preencherNavegacaoCategorias() {
        const seletor = document.getElementById('quick-buy-category');
        const listaSubcategorias = document.getElementById('quick-buy-subcategories');
        if (!seletor || !listaSubcategorias) return;

        const url = new URL(window.location.href);
        const categoriaParam = url.searchParams.get('categoria') || url.searchParams.get('id') || '';
        const subcategoriaParam = url.searchParams.get('subcategoria') || url.searchParams.get('sub') || '';
        const categoriaSelecionada = categoriaPorId(categoriaParam);
        estado.categoriaAtual = categoriaSelecionada;

        seletor.replaceChildren(new Option('Selecione uma categoria', ''));
        estado.categorias.forEach(categoria => {
            seletor.add(new Option(categoria.nome, categoria.id));
        });
        seletor.value = categoriaSelecionada ? categoriaSelecionada.id : '';

        listaSubcategorias.replaceChildren();
        if (!categoriaSelecionada) {
            listaSubcategorias.setAttribute('aria-label', 'Subcategorias disponíveis após escolher uma categoria');
            atualizarVisibilidade();
            return;
        }

        const categoria = categoriaSelecionada;
        if (categoria.subcategorias.length > 0) {
            const todas = document.createElement('button');
            todas.type = 'button';
            todas.className = `quick-buy-chip${url.searchParams.get('todos') === '1' ? ' is-active' : ''}`;
            todas.textContent = 'Ver todos desta categoria';
            todas.addEventListener('click', () => navegar({
                categoria: categoria.id, subcategoria: '', todos: true, removerBusca: true
            }));
            listaSubcategorias.appendChild(todas);

            categoria.subcategorias.forEach(subcategoria => {
                const botao = document.createElement('button');
                botao.type = 'button';
                botao.className = `quick-buy-chip${normalizar(subcategoria.id) === normalizar(subcategoriaParam)
                    || normalizar(subcategoria.chave) === normalizar(subcategoriaParam) ? ' is-active' : ''}`;
                botao.textContent = subcategoria.nome;
                botao.addEventListener('click', () => navegar({
                    categoria: categoria.id, subcategoria: subcategoria.chave, todos: false, removerBusca: true
                }));
                listaSubcategorias.appendChild(botao);
            });
        } else {
            const aviso = document.createElement('span');
            aviso.className = 'quick-buy-category-note';
            aviso.textContent = 'Esta categoria não possui subcategorias.';
            listaSubcategorias.appendChild(aviso);
        }
        atualizarVisibilidade();
    }

    async function carregarCategorias() {
        try {
            if (!window.db) throw new Error('Firebase indisponível');
            const snapshot = await window.db.ref('abella/categories').once('value');
            estado.categorias = categoriasAtivas(snapshot && snapshot.exists() ? snapshot.val() : {});
            preencherNavegacaoCategorias();
        } catch (error) {
            console.warn('[CompraRapida] Não foi possível carregar categorias para a navegação rápida.', error);
            const status = document.getElementById('quick-buy-status');
            if (status && estado.ativo) status.textContent = 'Não foi possível carregar as categorias. Você ainda pode buscar por nome ou SKU.';
            atualizarVisibilidade();
        }
    }

    function inicializarControles() {
        const seletor = document.getElementById('quick-buy-category');
        const busca = document.getElementById('busca');
        const botaoBusca = document.getElementById('quick-buy-search-submit');
        const linkRapida = document.getElementById('modo-compra-rapida');
        const linkCompleta = document.getElementById('modo-compra-completa');

        if (linkRapida) {
            const url = new URL(window.location.href);
            url.searchParams.set('modo', 'rapida');
            linkRapida.href = url.toString();
            linkRapida.setAttribute('aria-current', estado.ativo ? 'page' : 'false');
        }
        if (linkCompleta) {
            const url = new URL(window.location.href);
            url.searchParams.delete('modo');
            url.searchParams.delete('todos');
            const temContexto = url.searchParams.has('categoria') || url.searchParams.has('id')
                || url.searchParams.has('subcategoria') || url.searchParams.has('sub')
                || url.searchParams.has('busca') || url.searchParams.has('lancamentos');
            linkCompleta.href = temContexto ? url.toString() : 'index.html#categorias';
            linkCompleta.setAttribute('aria-current', estado.ativo ? 'false' : 'page');
        }

        if (seletor) seletor.addEventListener('change', () => {
            const categoria = categoriaPorId(seletor.value);
            if (!categoria) {
                navegar({ categoria: '', subcategoria: '', todos: false, removerBusca: true });
                return;
            }
            navegar({
                categoria: categoria.id,
                subcategoria: '',
                todos: categoria.subcategorias.length === 0,
                removerBusca: true
            });
        });

        const enviarBusca = () => {
            const termo = (busca && busca.value || '').trim();
            if (!termo) {
                navegar({ limparContexto: true, removerBusca: true });
                return;
            }
            navegar({ busca: termo, limparContexto: true });
        };
        if (botaoBusca) botaoBusca.addEventListener('click', enviarBusca);
        if (busca) {
            busca.addEventListener('keydown', event => {
                if (event.key === 'Enter' && estado.ativo) {
                    event.preventDefault();
                    enviarBusca();
                }
            });
            busca.addEventListener('input', () => {
                if (estado.ativo && !busca.value.trim()) {
                    const url = new URL(window.location.href);
                    if (url.searchParams.has('busca') && !url.searchParams.has('categoria')
                        && !url.searchParams.has('subcategoria')) {
                        navegar({ limparContexto: true, removerBusca: true });
                    }
                }
            });
        }

        window.addEventListener('storage', atualizarSacola);
        window.addEventListener('abella:cart-updated', atualizarSacola);
        atualizarSacola();
        atualizarVisibilidade();
    }

    window.CompraRapida = Object.freeze({
        ativo: estado.ativo,
        decorarGrade,
        atualizarSacola,
        atualizarVisibilidade,
        inicializarControles
    });

    document.addEventListener('DOMContentLoaded', () => {
        inicializarControles();
        if (estado.ativo) carregarCategorias();
    });
})();
