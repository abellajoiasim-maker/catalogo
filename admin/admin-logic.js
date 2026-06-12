
(function inicializarFirebaseAdmin() {
    var firebaseConfig = {
        apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
        authDomain: "catalogo-abella-joias.firebaseapp.com",
        databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
        projectId: "catalogo-abella-joias",
        storageBucket: "catalogo-abella-joias.firebasestorage.app",
        messagingSenderId: "727568435294",
        appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
    };

    // Guard: não inicializa duas vezes se outro script já o fez
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        window.db = firebase.database();
    } else {
        console.error("❌ [Admin] SDK do Firebase não encontrado. Verifique os scripts CDN no admin.html.");
    }
})();

// INSTANCIAÇÃO E MAPEAMENTO DE ESCOPO GLOBAL ABSOLUTO
// window.db já foi definido acima pela IIFE de inicialização
window.todosPedidosLocal = {};
window.todosProdutosLocal = {};
window.todasCategoriasLocal = {};
window.todasGalvanicasLocal = {};
window.configuracoesGlobaisLocal = {};

// Cache operacional interno para filtros de visualização
window.filtroStatusPedidoAtual = "Todos";

// ==========================================================================
// UTILS GLOBAIS DE CONVERSÃO E INTERCEPTAÇÃO DE PROTOCOLOS E MOEDAS
// ==========================================================================
window.resolverUrlImagem = function(urlStr) {
    if (!urlStr) return 'https://via.placeholder.com/250?text=Sem+Imagem+Abella';
    if (typeof urlStr === 'string' && urlStr.startsWith('gs://')) {
        try {
            var semPrefixo = urlStr.replace('gs://', '');
            var primeiraBarra = semPrefixo.indexOf('/');
            var bucket = semPrefixo.substring(0, primeiraBarra);
            var caminhoArquivo = semPrefixo.substring(primeiraBarra + 1);
            var caminhoCodificado = encodeURIComponent(caminhoArquivo);
            return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${caminhoCodificado}?alt=media`;
        } catch (e) {
            console.error("Falha ao interceptar URI do Storage:", e);
            return urlStr;
        }
    }
    return urlStr;
};

window.formatarMoedaReal = function(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ==========================================================================
// ABELLA SERVICES BOOTSTRAP
// ==========================================================================

async function sincronizarDadosGlobais() {

    try {

        if (window.pedidoService) {
            window.todosPedidosLocal =
                await pedidoService.getAll();
        }

        if (window.produtoService) {
            window.todosProdutosLocal =
                await produtoService.getAll();
        }

        if (window.categoriaService) {
            window.todasCategoriasLocal =
                await categoriaService.getAll();
        }

        if (window.galvanicaService) {
            window.todasGalvanicasLocal =
                await galvanicaService.getAll();
        }

        if (window.settingsService) {
            window.configuracoesGlobaisLocal =
                await settingsService.get();
        }

    } catch (erro) {

        console.error(
            '[sync global]',
            erro
        );
    }
}

// ==========================================================================
// ROTEADOR DINÂMICO DE FRAGMENTOS (FETCH INTERCEPTOR ENGINE)
// ==========================================================================
window.mudarAbaDinamica = function(aba) {
    var container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // Gerenciamento visual do menu lateral de navegação
    document.querySelectorAll('#menu-navegacao button').forEach(function(btn) {
        btn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all bg-zinc-900 text-gray-400 hover:text-white";
    });

    var idBotao = (aba === 'categories' || aba === 'categorias') ? 'btn-categories' : `btn-${aba}`;
    var btnAtivo = document.getElementById(idBotao);
    if (btnAtivo) {
        btnAtivo.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all bg-[#caa85c] text-black";
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-600 italic text-xs font-mono animate-pulse">Sincronizando fragmento operacional [${aba.toUpperCase()}]...</div>`;

    var pathAba = (aba === 'categories') ? 'categorias' : aba;
    var tentativa1 = `../modulo/${pathAba}.html`;
    var tentativa2 = `modulo/${pathAba}.html`;

    fetch(tentativa1)
        .then(function(res) { if (!res.ok) return fetch(tentativa2); return res; })
        .then(function(res) {
            if (!res.ok) throw new Error("Não foi possível encontrar a rota do fragmento.");
            return res.text();
        })
        .then(function(html) {
            // 1. Injeta o HTML primeiro
            container.innerHTML = html;
            
            // 2. Registra e prepara as funções do submódulo
            window.orquestrarBindsSubmodulo(pathAba);
            
            // 3. GATILHO DE SEGURANÇA: Garante que os dados locais salvos do Firebase apareçam imediatamente
            if (pathAba === 'pedidos' && typeof window.renderizarTabelaPedidosVisivel === 'function') {
                setTimeout(function() { window.renderizarTabelaPedidosVisivel(); }, 50);
            } else if (pathAba === 'produtos' && typeof window.carregarBlocoProdutos === 'function') {
                setTimeout(function() { window.carregarBlocoProdutos(true); }, 50);
            } else if (pathAba === 'categorias' && typeof window.carregarBlocoCategorias === 'function') {
                setTimeout(function() { window.carregarBlocoCategorias(); }, 50);
            }
        })
        .catch(function(err) {
            console.error("Erro ao carregar aba assíncrona:", err);
            container.innerHTML = `
                <div class="p-6 bg-red-950/20 border border-red-900 text-red-400 text-xs font-mono rounded-2xl max-w-lg mx-auto mt-12 text-center shadow-xl">
                    ⚠️ Erro de carregamento assíncrono: Módulo <b>modulo/${pathAba}.html</b> indisponível ou inacessível.
                </div>
            `;
        });
};

// ==========================================================================
// ORQUESTRAÇÃO DE BINDS E MÉTODOS DOS SUBMÓDULOS
// ==========================================================================
window.orquestrarBindsSubmodulo = function(modulo) {
    console.log(`⚡ Conectando canais globais para o módulo ativo: [${modulo.toUpperCase()}]`);

    // ----------------------------------------------------------------------
    // BINDS DO MÓDULO DE PEDIDOS
    // ----------------------------------------------------------------------
if (modulo === 'pedidos') {

    window.renderizarTabelaPedidosVisivel =
        async function() {

            const pedidos =
                await pedidoService.getAll();

            window.todosPedidosLocal =
                pedidos;

            const container =
                document.getElementById(
                    'listaPedidos'
                );

            if (!container) return;

            container.innerHTML = '';

            const lista =
                Object.entries(pedidos)
                .reverse();

            if (!lista.length) {

                container.innerHTML =
                    '<div class="text-center py-10">Nenhum pedido encontrado</div>';

                return;
            }

            lista.forEach(
                ([id, pedido]) => {

                    const card =
                        document.createElement(
                            'div'
                        );

                    card.className =
                        'bg-zinc-950 border border-zinc-900 rounded-xl p-4';

                    card.innerHTML = `
                        <h3>${pedido.nome || pedido.cliente || ''}</h3>
                        <p>${id}</p>
                    `;

                    container.appendChild(card);
                }
            );
        };

    renderizarTabelaPedidosVisivel();
}, function(error) {
                console.error("Erro de permissão ou conexão na ramificação /abella/orders:", error);
            });
        }

        window.renderizarTabelaPedidosVisivel = function() {
            var container = document.getElementById('listaPedidos');
            if (!container) {
                console.warn("⚠️ Elemento #listaPedidos ainda não foi encontrado no DOM.");
                return;
            }

            container.innerHTML = '';
            var chaves = Object.keys(window.todosPedidosLocal || {}).reverse();

            if (window.filtroStatusPedidoAtual && window.filtroStatusPedidoAtual !== "Todos") {
                chaves = chaves.filter(function(k) {
                    var p = window.todosPedidosLocal[k];
                    if (!p) return false;
                    var statusReal = p.status || (p.resumo ? p.resumo.status : "Novo");
                    return statusReal.toLowerCase() === window.filtroStatusPedidoAtual.toLowerCase();
                });
            }

            if (chaves.length === 0) {
                var statusTxt = window.filtroStatusPedidoAtual || "Todos";
                container.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 font-mono italic text-xs">Nenhum pedido localizado para a seleção [${statusTxt}].</div>`;
                return;
            }

            chaves.forEach(function(key) {
                var p = window.todosPedidosLocal[key];
                if (!p) return;
                
                var totalNum = p.total || (p.resumo ? p.resumo.total : 0);
                var totalStr = window.formatarMoedaReal ? window.formatarMoedaReal(totalNum) : "R$ " + totalNum.toFixed(2);
                var dataStr = p.data || "Sem Data";
                // CORRIGIDO: substituído 'p.cliente' (variável duplicada) por 'pedido.cliente'
                var clienteNome = p.nome || p.cliente || (p.entrega ? p.entrega.nome : 'Cliente Abella');
                var numeroPedido = key.slice(-6).toUpperCase();

                let totalPecas = p.totalPecas || (p.resumo ? p.resumo.totalPecas : 0);
                if (!totalPecas && p.itens) {
                    const itensArray = Array.isArray(p.itens) ? p.itens : Object.values(p.itens);
                    itensArray.forEach(i => {
                        if (i) totalPecas += (parseInt(i.quantidade || i.qtd) || 1);
                    });
                }

                var divCard = document.createElement('div');
                divCard.className = "bg-[#111] border border-zinc-900 p-4 rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-all text-xs space-y-4 text-left h-full";
                
                divCard.innerHTML = `
                    <div class="space-y-2">
                        <div class="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                            <span class="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded text-[10px]">Pedido #${numeroPedido}</span>
                            <span>${dataStr}</span>
                        </div>
                        <h4 class="text-base font-bold text-white uppercase tracking-tight pt-1 truncate" title="${clienteNome}">${clienteNome}</h4>
                        <p class="text-xs text-gray-400 font-mono">📱 ${p.whats || p.telefone || 'Não informado'}</p>
                        <p class="text-xs text-zinc-400 font-mono">📦 Volume Total: <span class="text-[#caa85c] font-bold">${totalPecas} pçs</span></p>
                        <p class="text-xs text-zinc-500 truncate" title="${p.rua || (p.entrega ? p.entrega.rua : '')}">📍 ${p.rua || (p.entrega ? p.entrega.rua : 'Retirada / Não informado')}</p>
                        
                        <div class="pt-2 flex justify-between items-center border-t border-zinc-900/80 mt-2">
                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Líquido</span>
                            <span class="text-base font-black text-[#caa85c] font-mono">${totalStr}</span>
                        </div>
                    </div>

                    <div class="bg-black/60 p-2 rounded-lg border border-zinc-900 mt-2">
                        <div class="flex gap-2">
                            <select id="select-romaneio-${key}" class="bg-zinc-900 border border-zinc-800 text-[11px] text-white p-1.5 rounded flex-1 outline-none focus:border-[#caa85c]">
                                <option value="1">1. Conferência de Separação</option>
                                <option value="2">2. Financeiro e Faturamento</option>
                                <option value="3">3. Vitrine (Conferência Fotográfica)</option>
                                <option value="4">4. Grade Comparativa Conf.</option>
                                <option value="5">5. Grade Financeira Expandida</option>
                                <option value="6">6. Grade Consolidada Total</option>
                            </select>
                            <button onclick="const tipo = document.getElementById('select-romaneio-${key}').value; window.pedidoEditando = '${key}'; window.gerarPdfConferenciaPedido('${key}');" class="bg-[#caa85c] text-black font-bold text-[10px] px-3 py-1.5 rounded hover:brightness-110 uppercase tracking-wider transition-all shrink-0">Visualizar</button>
                        </div>
                    </div>

                    <div class="flex gap-2 pt-2 border-t border-zinc-900 mt-2">
                        <button onclick="window.abrirDetalhesPedidoModal('${key}')" class="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-2 px-2 rounded-lg transition-all text-center text-[11px]">⚙️ Gerenciar / Editar</button>
                        <button onclick="window.excluirPedidoAcao('${key}')" class="bg-red-950/20 hover:bg-red-900/50 text-red-400 border border-red-900/40 py-2 px-3 rounded-lg transition-all">🗑️</button>
                    </div>
                `;
                container.appendChild(divCard);
            });
        };

        window.mudarFiltroStatusPedido = function(status) {
            window.filtroStatusPedidoAtual = status;
            document.querySelectorAll('.btn-filtro-pedido').forEach(function(btn) {
                btn.classList.remove('bg-[#caa85c]', 'text-black');
                btn.classList.add('bg-zinc-900', 'text-gray-400');
            });
            var idBotao = status.toLowerCase() === "em separação" ? "filter-ped-separacao" : `filter-ped-${status.toLowerCase()}`;
            var btnAtivo = document.getElementById(idBotao);
            if (btnAtivo) {
                btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
                btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
            }
            window.renderizarTabelaPedidosVisivel();
        };

        window.abrirDetalhesPedidoModal = function(id) {
            // CORRIGIDO: variável era 'pedido', não 'p'. Removido 'p.cliente' inexistente.
            var pedido = window.todosPedidosLocal[id];
            if (!pedido) return;
            var numPecas = pedido.totalPecas || (pedido.resumo ? pedido.resumo.totalPecas : 0);
            alert(`Lendo metadados de itens do comprador: ${pedido.nome || pedido.cliente || 'Cliente Abella'}\nTotal de Peças: ${numPecas}\nID: ${id}`);
        };

        window.gerarPdfConferenciaPedido = function(id) {
            alert(`Iniciando romaneio de expedição física para as galvânicas de Limeira. ID: ${id}`);
        };

        window.excluirPedidoAcao = function(id) {
            if(confirm("🚨 Deseja deletar definitivamente este pedido na ramificação /abella?")) {
                window.db.ref('abella/orders/' + id).remove().then(function() {
                    alert("Pedido excluído com sucesso!");
                });
            }
        };
        
        window.renderizarTabelaPedidosVisivel();
    }

    // ----------------------------------------------------------------------
    // BINDS DO MÓDULO DE PRODUTOS
    // ----------------------------------------------------------------------
if (modulo === 'produtos') {

    // ==========================================================
    // RENDERIZAÇÃO DOS PRODUTOS
    // ==========================================================
window.carregarBlocoProdutos = function(forcarLimpezaDOM) {

    var grid = document.getElementById('grid-produtos');
    if (!grid) return;

    if (forcarLimpezaDOM === true) {
        grid.innerHTML = '';
    }

    var produtos = window.todosProdutosLocal || {};

    if (Array.isArray(produtos)) {
        produtos = produtos.reduce(function(acc, item, index) {
            if (item) acc[index] = item;
            return acc;
        }, {});
    }

    var listaProdutos = Object.entries(produtos)
        .filter(function(entry) {
            return entry[1];
        })
        .sort(function(a, b) {

            var nomeA =
                (a[1].name || a[1].nome || '')
                .toLowerCase();

            var nomeB =
                (b[1].name || b[1].nome || '')
                .toLowerCase();

            return nomeA.localeCompare(nomeB);

        });

    if (!listaProdutos.length) {

        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-zinc-600 italic font-mono">
                Nenhum produto cadastrado em /abella/products.
            </div>
        `;

        return;
    }

    var html = '';

    listaProdutos.forEach(function(item) {

        var key = item[0];
        var prod = item[1];

        var preco =
            Number(
                prod.price ??
                prod.precoFinal ??
                prod.preco ??
                0
            );

        var peso =
            prod.weight ??
            prod.peso ??
            0;

        var imagem =
            prod.image ||
            prod.imagem ||
            '';

        var nome =
            prod.name ||
            prod.nome ||
            'Produto sem nome';

        var sku =
            prod.sku ||
            'N/A';

        var categoria =
            prod.category ||
            prod.categoria ||
            'Geral';

        var subcategoria =
            prod.subcategory ||
            prod.subcategoria ||
            '';

        var pausado =
            prod.paused === true;

        var imgTratada =
            window.resolverUrlImagem(imagem);

        html += `
            <div class="bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3 hover:border-zinc-800 transition-all text-left relative">

                <div class="h-40 bg-black rounded-lg border border-zinc-900 overflow-hidden relative flex items-center justify-center">

                    <img
                        src="${imgTratada}"
                        loading="lazy"
                        class="w-full h-full object-cover"
                        onerror="this.src='https://via.placeholder.com/400x400?text=Sem+Imagem';"
                    >

                    ${
                        pausado
                        ? `
                            <span class="absolute top-2 right-2 bg-red-950 text-red-400 border border-red-900 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                                Pausado
                            </span>
                        `
                        : ''
                    }

                </div>

                <div class="space-y-1">

                    <h3 class="text-white text-xs font-bold truncate">
                        ${nome}
                    </h3>

                    <p class="text-[10px] text-zinc-500 font-mono truncate">
                        SKU: ${sku}
                    </p>

                    <p class="text-[10px] text-zinc-400 font-mono truncate">
                        ${categoria}
                        ${subcategoria ? ' / ' + subcategoria : ''}
                    </p>

                    <p class="text-[10px] text-zinc-400 font-mono">
                        Peso: ${peso}g
                    </p>

                    <p class="text-xs text-[#caa85c] font-bold font-mono">
                        ${window.formatarMoedaReal(preco)}
                    </p>

                </div>

                <div class="grid grid-cols-2 gap-2 pt-1">

                    <button
                        onclick="window.editarProdutoItem('${key}')"
                        class="bg-zinc-900 text-gray-300 hover:text-white border border-zinc-800 text-[10px] font-bold uppercase py-1.5 rounded-lg text-center transition-all">
                        Editar
                    </button>

                    <button
                        onclick="window.alternarPausaProduto('${key}', ${pausado})"
                        class="text-[10px] font-bold uppercase py-1.5 rounded-lg text-center border transition-all ${
                            pausado
                                ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900'
                                : 'bg-amber-950/20 text-amber-400 border-amber-900'
                        }">

                        ${pausado ? 'Ativar' : 'Pausar'}

                    </button>

                </div>

            </div>
        `;

    });

    grid.innerHTML = html;

    console.log(
        '📦 Produtos renderizados:',
        listaProdutos.length
    );
};
    // ==========================================================
    // ABRIR MODAL
    // ==========================================================
window.abrirModalProduto = function() {

    var modal =
        document.getElementById('modalFormProduto');

    if (!modal) {
        console.warn(
            "modalFormProduto não encontrado"
        );
        return;
    }

    modal.classList.remove('hidden');

    var titulo =
        document.getElementById(
            'modalFormProdutoTitulo'
        );

    if (titulo) {
        titulo.innerText =
            'Cadastrar Novo Produto';
    }

    var form =
        document.getElementById(
            'formProdutoReal'
        );

    if (form) {
        form.reset();
    }

    [
        'prodId',
        'prodNome',
        'prodSku',
        'prodCategoria',
        'prodSubcategoria',
        'prodPeso',
        'prodPreco',
        'prodPrecoPromocional',
        'prodDescricao',
        'prodEstoque',
        'prodGalvanica',
        'prodUrlImagem'
    ].forEach(function(idCampo) {

        var campo =
            document.getElementById(idCampo);

        if (campo) {
            campo.value = '';
        }

    });

    var preview =
        document.getElementById(
            'previewProduto'
        );

    if (preview) {
        preview.src =
            'https://via.placeholder.com/400x400?text=Produto';
    }
};

window.fecharModalProduto = function() {

    var modal =
        document.getElementById(
            'modalFormProduto'
        );

    if (!modal) return;

    modal.classList.add('hidden');
};

    // ==========================================================
    // EDITAR
    // ==========================================================
window.editarProdutoItem = function(id) {

    var prod = (window.todosProdutosLocal || {})[id];

    if (!prod) {
        alert("Produto não localizado.");
        return;
    }

    window.abrirModalProduto();

    var titulo = document.getElementById('modalFormProdutoTitulo');
    if (titulo) {
        titulo.innerText = 'Editar Produto';
    }

    function preencher(campo, valor) {
        var el = document.getElementById(campo);
        if (el) {
            el.value = valor ?? '';
        }
    }

    preencher('prodId', id);

    preencher('prodNome',
        prod.name ||
        prod.nome
    );

    preencher('prodSku',
        prod.sku
    );

    preencher('prodCategoria',
        prod.category ||
        prod.categoria
    );

    preencher('prodSubcategoria',
        prod.subcategory ||
        prod.subcategoria
    );

    preencher('prodPeso',
        prod.weight ||
        prod.peso
    );

    preencher('prodPreco',
        prod.price ??
        prod.precoFinal ??
        prod.preco
    );

    preencher('prodPrecoPromocional',
        prod.precoPromo ??
        prod.promotionalPrice ??
        ''
    );

    preencher('prodGalvanica',
        prod.galvanica
    );

    preencher('prodEstoque',
        prod.stock ??
        prod.estoque ??
        0
    );

    preencher('prodDescricao',
        prod.description ||
        prod.descricao
    );

    preencher('prodUrlImagem',
        prod.image ||
        prod.imagem
    );

    var imgPreview =
        document.getElementById('previewProduto');

    if (imgPreview) {

        var img =
            prod.image ||
            prod.imagem ||
            '';

        imgPreview.src =
            window.resolverUrlImagem(img);

        imgPreview.onerror = function() {

            this.src =
                'https://via.placeholder.com/400x400?text=Sem+Imagem';

        };
    }

    console.log(
        "📝 Produto carregado para edição:",
        id,
        prod
    );
};

    // ==========================================================
    // SALVAR
    // ==========================================================
window.salvarProdutoFirebase = function() {

    if (!window.db) {
        alert("Firebase indisponível.");
        return;
    }

    var id = document.getElementById('prodId')?.value || '';

    var name = document.getElementById('prodNome')?.value.trim() || '';
    var sku = document.getElementById('prodSku')?.value.trim() || '';
    var category = document.getElementById('prodCategoria')?.value.trim() || '';
    var weight = document.getElementById('prodPeso')?.value.trim() || '';
    var image = document.getElementById('prodUrlImagem')?.value.trim() || '';

    var price = parseFloat(
        document.getElementById('prodPreco')?.value || 0
    );

    if (!name) {
        alert("⚠️ Informe o nome do produto.");
        return;
    }

    var dados = {
        id: id || null,
        name: name,
        sku: sku,
        category: category,
        weight: weight,
        peso: weight,
        image: image,
        price: price,
        precoFinal: price,
        updatedAt: Date.now()
    };

    var operacao;

    if (id) {

        operacao = window.db
            .ref('abella/products/' + id)
            .update(dados);

    } else {

        dados.createdAt = Date.now();
        dados.paused = false;

        operacao = window.db
            .ref('abella/products')
            .push(dados);
    }

    operacao
        .then(function() {

            window.fecharModalProduto();

            if (typeof window.carregarBlocoProdutos === 'function') {
                window.carregarBlocoProdutos(true);
            }

            console.log(
                "✅ Produto salvo:",
                name
            );

        })
        .catch(function(error) {

            console.error(
                "Erro ao salvar produto:",
                error
            );

            alert(
                "Erro ao salvar produto:\n" +
                error.message
            );
        });
};

    // Alias compatível com HTML
    window.salvarDadosProdutoDoForm =
        window.salvarProdutoFirebase;

    // ==========================================================
    // PAUSAR / ATIVAR
    // ==========================================================
window.alternarPausaProduto = function(id, statusAtual) {

    if (!window.db) {
        alert("Firebase indisponível.");
        return;
    }

    var novoStatus = !statusAtual;

    window.db
        .ref('abella/products/' + id)
        .update({
            paused: novoStatus,
            updatedAt: Date.now()
        })
        .then(function() {

            console.log(
                "✅ Status atualizado:",
                id,
                novoStatus
            );

        })
        .catch(function(error) {

            console.error(
                "Erro ao alterar status:",
                error
            );

            alert(
                "Falha ao atualizar produto:\n" +
                error.message
            );

        });
};

    // ----------------------------------------------------------------------
    // BINDS DO MÓDULO DE CATEGORIAS / DESCONTOS
    // ----------------------------------------------------------------------
    if (modulo === 'categorias') {
        window.carregarBlocoCategorias = function() {
            var grid = document.getElementById('grid-categorias');
            if (!grid) return;

            grid.innerHTML = '';
            var chaves = Object.keys(window.todasCategoriasLocal);

            if (chaves.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 italic font-mono">Nenhuma categoria/coleção cadastrada.</div>`;
                return;
            }

            chaves.forEach(function(key) {
                var cat = window.todasCategoriasLocal[key];
                var div = document.createElement('div');
                div.className = "bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4 text-left relative";
                
                var isPromoAtiva = cat.promoStatus === "ATIVA" || cat.promoAtiva === true;
                var pctDesconto = cat.promoPct || cat.discount || 0;

                var statusPromo = isPromoAtiva ? 
                    `<span class="bg-emerald-950/60 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">Promoção Ativa (-${pctDesconto}%)</span>` : 
                    `<span class="bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">Sem Desconto Coletivo</span>`;

                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-white text-sm font-bold font-sans">${cat.name || cat.nome}</h4>
                            <p class="text-[10px] text-zinc-500 font-mono mt-0.5">Slug ID: ${key}</p>
                        </div>
                        <button onclick="window.excluirCategoriaItem('${key}')" class="text-zinc-600 hover:text-rose-500 font-bold transition-all text-xs">✕</button>
                    </div>
                    <div class="border-t border-zinc-900/60 pt-3 space-y-2">
                        <div class="flex items-center gap-2">${statusPromo}</div>
                        ${cat.promoName ? `<p class="text-[10px] text-zinc-400 font-mono truncate">Etiqueta: <b class="text-amber-400">${cat.promoName}</b></p>` : ''}
                    </div>
                    <button onclick="window.abrirConfiguracaoDescontoCategoria('${key}')" class="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider text-center transition-all">Configurar Descontos</button>
                `;
                grid.appendChild(div);
            });
        };

        window.abrirModalCategoria = function() {
            var modal = document.getElementById('modalCategoria');
            if (modal) {
                modal.classList.remove('hidden');
                document.getElementById('catId').value = '';
                document.getElementById('catNome').value = '';
                // Verifica existência dos campos antes de acessar (módulo categorias tem form simplificado)
                if(document.getElementById('catPromoAtiva')) document.getElementById('catPromoAtiva').value = 'INATIVA';
                if(document.getElementById('catPromoPorcentagem')) document.getElementById('catPromoPorcentagem').value = '0';
                if(document.getElementById('catPromoNome')) document.getElementById('catPromoNome').value = '';
                if(document.getElementById('catOpcoesPersonalizadas')) document.getElementById('catOpcoesPersonalizadas').value = '';
            }
        };

        window.fecharModalCategoria = function() {
            var modal = document.getElementById('modalCategoria');
            if (modal) modal.classList.add('hidden');
        };

        window.abrirConfiguracaoDescontoCategoria = function(id) {
            var cat = window.todasCategoriasLocal[id];
            if (!cat) return;

            window.abrirModalCategoria();
            document.getElementById('catId').value = id;
            document.getElementById('catNome').value = cat.name || cat.nome || '';
        };

        window.salvarCategoriaFirebase = function() {
            var id = document.getElementById('catId').value.trim();
            var name = document.getElementById('catNome').value.trim();

            if (!name) { alert("⚠️ Nome é obrigatório!"); return; }

            var slug = id ? id : name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");

            var dados = {
                name: name,
                slug: slug,
                paused: false
            };

            window.db.ref(`abella/categories/${slug}`).update(dados).then(function() {
                window.fecharModalCategoria();
                window.carregarBlocoCategorias();
            });
        };

        // ADICIONADO: Alias para o nome chamado pelo botão em modulo/categorias.html
        // O botão chama window.salvarNovaCategoriaItem() mas a função era salvarCategoriaFirebase()
        window.salvarNovaCategoriaItem = window.salvarCategoriaFirebase;

        window.excluirCategoriaItem = function(id) {
            if (confirm(`⚠️ Deseja remover a categoria [${id}]?`)) {
                window.db.ref(`abella/categories/${id}`).remove();
            }
        };
    }
};

// ==========================================================================
// BOOTSTRAP AUTOSTART (INICIALIZAÇÃO AUTOMÁTICA SEGURA)
// CORRIGIDO: Eliminado o duplo bootstrap que podia causar dupla chamada.
// Agora usa apenas DOMContentLoaded com verificação segura de estado.
// ==========================================================================
function bootstrapAdmin() {
    if (window.mudarAbaDinamica && !document.getElementById('listaPedidos')) {
        window.mudarAbaDinamica('pedidos');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapAdmin);
} else {
    // DOM já carregado (script carregou tarde, mas o DOM está pronto)
    bootstrapAdmin();
}

// =========================================================================
// MOTOR DE INTEGRAÇÃO DO MÓDULO DE CONFIGURAÇÕES (ABELLA JOIAS)
// =========================================================================

// Função global para carregar os dados do Firebase para a tela de configurações
window.buscarConfiguracoesFirebase = function() {
    // Captura a conexão ativa que o admin-logic.js já possui
    const database = window.db || (typeof db !== "undefined" ? db : null);
    
    if (!database) {
        console.warn("⚠️ Banco de dados não disponível no barramento principal.");
        return;
    }

    console.log("💎 Lendo configurações em abella/settings...");
    database.ref('abella/settings').once('value').then((snapshot) => {
        const config = snapshot.val();
        
        if (!config) {
            if (document.getElementById('cfgUltimaAtualizacao')) {
                document.getElementById('cfgUltimaAtualizacao').innerText = "Banco conectado (Nó vazio)";
            }
            return;
        }

        // Preenche os campos se eles existirem na tela atual
        if (document.getElementById('cfgNome')) document.getElementById('cfgNome').value = config.name || "Abella Joias";
        if (document.getElementById('cfgSlogan')) document.getElementById('cfgSlogan').value = config.slogan || "Atacado de Joias no Bruto";
        if (document.getElementById('cfgWhatsapp')) document.getElementById('cfgWhatsapp').value = config.whatsapp || "";
        if (document.getElementById('cfgDescPix')) document.getElementById('cfgDescPix').value = config.pix !== undefined ? config.pix : 5;
        if (document.getElementById('cfgParcelas')) document.getElementById('cfgParcelas').value = config.parcelas || 6;
        if (document.getElementById('cfgValorMinimo')) document.getElementById('cfgValorMinimo').value = config.pedidoMinimo || 0;
        if (document.getElementById('cfgFreteFixo')) document.getElementById('cfgFreteFixo').value = config.freteFixo || 0;
        if (document.getElementById('cfgFreteGratisAlvo')) document.getElementById('cfgFreteGratisAlvo').value = config.freteGratisAlvo !== undefined ? config.freteGratisAlvo : 100;
        if (document.getElementById('cfgStatusLoja')) document.getElementById('cfgStatusLoja').value = config.statusLoja || 'aberto';
        if (document.getElementById('cfgTextoAviso')) document.getElementById('cfgTextoAviso').value = config.bannerTexto || "";
        if (document.getElementById('cfgAtivarAviso')) document.getElementById('cfgAtivarAviso').checked = !!config.bannerAtivo;

        if (document.getElementById('cfgUltimaAtualizacao')) {
            document.getElementById('cfgUltimaAtualizacao').innerText = config.ultimaAtualizacao ? `Sincronizado: ${config.ultimaAtualizacao}` : "Sincronizado";
        }
    }).catch(err => {
        console.error("Erro na leitura do nó abella/settings:", err);
    });
};

// Função global disparada pelo clique do botão Salvar
window.salvarConfiguracoes = function() {
    const btn = document.getElementById('btnSalvarConfig');
    const nomeValidado = document.getElementById('cfgNome') ? document.getElementById('cfgNome').value.trim() : "Abella Joias";

    if (btn) { btn.disabled = true; btn.innerText = "⏳ SALVANDO NO FIREBASE..."; }

    const database = window.db || (typeof db !== "undefined" ? db : null);
    if (!database) {
        alert("❌ Erro: O barramento do Firebase está inacessível.");
        if (btn) { btn.disabled = false; btn.innerText = "💾 Salvar e Criar no Firebase"; }
        return;
    }

    const dataHoraAtual = new Date().toLocaleString('pt-BR');
    
    const pacoteDados = {
        name: nomeValidado,
        slogan: document.getElementById('cfgSlogan') ? document.getElementById('cfgSlogan').value.trim() : "",
        whatsapp: document.getElementById('cfgWhatsapp') ? document.getElementById('cfgWhatsapp').value.trim() : "",
        pix: document.getElementById('cfgDescPix') ? (parseFloat(document.getElementById('cfgDescPix').value) || 0) : 0,
        parcelas: document.getElementById('cfgParcelas') ? (parseInt(document.getElementById('cfgParcelas').value) || 1) : 1,
        pedidoMinimo: document.getElementById('cfgValorMinimo') ? (parseFloat(document.getElementById('cfgValorMinimo').value) || 0) : 0,
        freteFixo: document.getElementById('cfgFreteFixo') ? (parseFloat(document.getElementById('cfgFreteFixo').value) || 0) : 0,
        freteGratisAlvo: document.getElementById('cfgFreteGratisAlvo') ? (parseFloat(document.getElementById('cfgFreteGratisAlvo').value) || 0) : 0,
        statusLoja: document.getElementById('cfgStatusLoja') ? document.getElementById('cfgStatusLoja').value : "aberto",
        bannerTexto: document.getElementById('cfgTextoAviso') ? document.getElementById('cfgTextoAviso').value.trim() : "",
        bannerAtivo: document.getElementById('cfgAtivarAviso') ? document.getElementById('cfgAtivarAviso').checked : false,
        ultimaAtualizacao: dataHoraAtual
    };

    // Salva direto no nó liberado pelas Regras do Realtime Database
    database.ref('abella/settings').update(pacoteDados)
        .then(() => {
            if (document.getElementById('cfgUltimaAtualizacao')) {
                document.getElementById('cfgUltimaAtualizacao').innerText = `Salvo: ${dataHoraAtual}`;
            }
            alert("💎 Sucesso! Configurações salvas e aplicadas na nuvem!");
        })
        .catch(erro => {
            console.error("Erro ao salvar:", erro);
            alert("Erro de gravação: " + erro.message);
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.innerText = "💾 Salvar e Criar no Firebase"; }
        });
};

// Observador reativo: Toda vez que o painel mudar de aba e injetar a tela de config, executa a leitura automática dos dados
const observerConfig = new MutationObserver((mutations) => {
    if (document.getElementById('cfgNome') && document.getElementById('cfgUltimaAtualizacao') && document.getElementById('cfgUltimaAtualizacao').innerText === "Conectando ao banco...") {
        window.buscarConfiguracoesFirebase();
    }
});
observerConfig.observe(document.body, { childList: true, subtree: true });

// ============================================================================
// EXTENSÃO GESTÃO DE CATEGORIAS (Injetado diretamente no escopo do admin-logic.js)
// ============================================================================

(function IniciarEscopoCategorias() {
    var cacheLocalCategorias = {};
    var abaAtivaCategorias = 'mae';

    // Captura automática do banco de dados que seu admin-logic já usa
    function obterReferenciaBanco() {
        if (window.db && typeof window.db.ref === 'function') return window.db.ref('abella/categories');
        if (window.firebase && typeof window.firebase.database === 'function') return window.firebase.database().ref('abella/categories');
        return null;
    }

    function gerarSlug(txt) {
        return (txt || '').toLowerCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

// Variable global de fallback (Imunidade contra quedas de servidores externos de placeholder)
var IMG_RESERVA_BASE64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 100 100' style='background-color:%23141414;'><rect width='100' height='100' fill='%23141414'/><path d='M50 35 L65 50 L50 65 L35 50 Z' fill='none' stroke='%23caa85c' stroke-width='1.5'/><text x='50%' y='75%' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='5' fill='%2352525b'>SEM IMAGEM</text></svg>";

function converterGsParaHttp(url) {
    if (!url) return '';
    var s = url.trim();
    
    // Filtro de Segurança: Ignora strings textuais de exemplo ou inválidas do banco
    if (s.toUpperCase() === 'URL IMAGEM' || s === '' || s.indexOf('.') === -1) {
        return '';
    }
    
    // Se não for um link do Storage (gs://), retorna ele mesmo (caso cole um link https direto)
    if (!s.startsWith('gs://')) return s;
    
    // Remove o 'gs://' para isolar o balde (bucket) e o caminho
    var semPrefixo = s.replace('gs://', '');
    var primeiraBarra = semPrefixo.indexOf('/');
    if (primeiraBarra === -1) return s;
    
    // Separa o nome do seu bucket e o caminho do arquivo
    var bucketName = semPrefixo.substring(0, primeiraBarra); // Ex: catalogo-abella-joias.firebasestorage.app
    var filePath = semPrefixo.substring(primeiraBarra + 1);  // Ex: images/categorias/ANEIS.jpeg
    
    // O Firebase exige que as barras da pasta sejam transformadas em '%2F' na URL pública
    var filePathFormatado = encodeURIComponent(filePath);
    
    // Retorna a URL perfeitamente legível para qualquer navegador
    return 'https://firebasestorage.googleapis.com/v0/b/' + bucketName + '/o/' + filePathFormatado + '?alt=media';
}

window.atualizarPreviewModal = function(url) {
    var img = document.getElementById('previewImgModal');
    var ph  = document.getElementById('previewPlaceholder');
    if(!img || !ph) return;
    
    var http = converterGsParaHttp(url);
    
    if (http) {
        img.src = http;
        img.classList.remove('hidden');
        ph.classList.add('hidden');
    } else {
        // Se a URL for inválida, limpa o src para não forçar requisições 404 locais
        img.src = ''; 
        img.classList.add('hidden');
        ph.classList.remove('hidden');
    }
};

    window.mudarAba = function(aba) {
        abaAtivaCategorias = aba;
        var gridMae = document.getElementById('grid-mae');
        var gridSub = document.getElementById('grid-sub');
        var btnMae  = document.getElementById('aba-mae');
        var btnSub  = document.getElementById('aba-sub');

        if (aba === 'mae') {
            if(gridMae) gridMae.classList.remove('hidden');
            if(gridSub) gridSub.classList.add('hidden');
            if(btnMae) btnMae.className = 'px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-all bg-[#caa85c] text-black border-b-2 border-[#caa85c]';
            if(btnSub) btnSub.className = 'px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-all bg-zinc-900 text-zinc-400 border-b-2 border-transparent hover:text-white';
            renderizarMae(cacheLocalCategorias);
        } else {
            if(gridMae) gridMae.classList.add('hidden');
            if(gridSub) gridSub.classList.remove('hidden');
            if(btnSub) btnSub.className = 'px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-all bg-[#caa85c] text-black border-b-2 border-[#caa85c]';
            if(btnMae) btnMae.className = 'px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-all bg-zinc-900 text-zinc-400 border-b-2 border-transparent hover:text-white';
            renderizarSubcategorias();
        }
    };

    function renderizarMae(dados) {
        var grid = document.getElementById('grid-mae');
        if (!grid) return; 
        grid.innerHTML = '';

        var entradas = Object.entries(dados);
        if (!entradas.length) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-zinc-600 font-mono text-xs">Nenhuma categoria localizada no nó abella/categories.</div>';
            return;
        }

        entradas.forEach(function(entry) {
            var id = entry[0];
            var cat = entry[1];
            var numSub = cat.subcategories ? Object.keys(cat.subcategories).length : 0;
            var pausado = cat.paused === true;
            var img = converterGsParaHttp(cat.image || '');

            var nomeSafe = (cat.name || '').replace(/'/g, "\\'");
            var imagemSafe = (cat.image || '').replace(/'/g, "\\'");

            var card = document.createElement('div');
            card.className = 'bg-zinc-950 border ' + (pausado ? 'border-red-900/40 bg-zinc-950/40' : 'border-zinc-900') + ' rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-zinc-800 shadow-xl';

            // AQUÍ ESTÁ A LINHA DA TAG DE IMAGEM AJUSTADA COM O ERROR HANDLER LOCAL:
            card.innerHTML =
                '<div class="w-full aspect-square bg-[#141414] relative overflow-hidden border-b border-zinc-900 flex-shrink-0">' +
                    (img
                        ? '<img src="' + img + '" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" onerror="this.src=window.IMG_RESERVA_BASE64 || IMG_RESERVA_BASE64">'
                        : '<div class="w-full h-full flex items-center justify-center text-zinc-700 text-[10px] font-mono">Sem imagem configurada</div>'
                    ) +
                    (pausado ? '<span class="absolute top-3 right-3 bg-red-950 border border-red-800 text-red-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-md uppercase">Oculta na Vitrine</span>' : '') +
                    (numSub > 0 ? '<span class="absolute bottom-3 left-3 bg-indigo-950/80 border border-indigo-800 text-indigo-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-md">' + numSub + ' sub-coleções</span>' : '') +
                '</div>' +
                '<div class="p-4 flex-1 flex flex-col justify-between gap-4">' +
                    '<div>' +
                        '<span class="text-[8px] font-mono text-zinc-600 uppercase block">ID: ' + id + '</span>' +
                        '<h4 class="text-xs font-bold text-white tracking-wide uppercase truncate mt-0.5">' + (cat.name || id) + '</h4>' +
                    '</div>' +
                    '<div class="grid grid-cols-3 gap-1.5 border-t border-zinc-900 pt-3">' +
                        '<button onclick="window.editarCategoriaAcao(\'' + id + '\', \'' + nomeSafe + '\', \'' + imagemSafe + '\')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2 rounded-xl text-[9px] font-bold transition-all text-center">✏️ Edit</button>' +
                        '<button onclick="window.alternarPausaAcao(\'' + id + '\', ' + pausado + ')" class="border py-2 rounded-xl text-[9px] font-bold transition-all text-center ' + (pausado ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-amber-950/20 border-amber-900/50 text-amber-500') + '">' + (pausado ? '▶️ Ativar' : '⏸️ Pausar') + '</button>' +
                        '<button onclick="window.excluirCategoriaAcao(\'' + id + '\')" class="bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900 text-zinc-500 hover:text-red-400 py-2 rounded-xl text-[9px] font-bold transition-all text-center">🗑️ Excluir</button>' +
                    '</div>' +
                    '<button onclick="window.abrirModalNovaSubcat(\'' + id + '\', \'' + nomeSafe + '\')" class="w-full border border-dashed border-indigo-900/60 hover:border-indigo-600 text-indigo-400 hover:text-indigo-300 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all">+ Subcategoria</button>' +
                '</div>';

            grid.appendChild(card);
        });
    }

    function renderizarSubcategorias() {
        var grid = document.getElementById('grid-sub');
        if (!grid) return;
        grid.innerHTML = '';
        var total = 0;

        Object.entries(cacheLocalCategorias).forEach(function(entry) {
            var catSlug = entry[0];
            var cat = entry[1];
            if (!cat.subcategories) return;

            Object.entries(cat.subcategories).forEach(function(subEntry) {
                var subSlug = subEntry[0];
                var sub = subEntry[1];
                total++;

                var pausado = sub.paused === true;
                var img = converterGsParaHttp(sub.image || '');
                var nomeSafe = (sub.name || '').replace(/'/g, "\\'");
                var imagemSafe = (sub.image || '').replace(/'/g, "\\'");
                var catNomeSafe = (cat.name || '').replace(/'/g, "\\'");

                var card = document.createElement('div');
                card.className = 'bg-zinc-950 border ' + (pausado ? 'border-red-900/40' : 'border-indigo-900/40') + ' rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-indigo-800 shadow-xl';

                // AQUÍ TAMBÉM FOI AJUSTADO PARA USAR O SVG SE DER ERRO DE CONEXÃO:
                card.innerHTML =
                    '<div class="w-full aspect-square bg-[#141414] relative overflow-hidden border-b border-zinc-900 flex-shrink-0">' +
                        (img
                            ? '<img src="' + img + '" class="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" onerror="this.src=window.IMG_RESERVA_BASE64 || IMG_RESERVA_BASE64">'
                            : '<div class="w-full h-full flex items-center justify-center text-indigo-400 text-[10px] font-mono">Sem foto vinculada</div>'
                        ) +
                        '<span class="absolute top-3 left-3 bg-indigo-950/90 border border-indigo-800 text-indigo-400 text-[8px] font-bold px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">Sub-peça</span>' +
                        (pausado ? '<span class="absolute top-3 right-3 bg-red-950 border border-red-800 text-red-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded-md uppercase">Oculta</span>' : '') +
                    '</div>' +
                    '<div class="p-4 flex-1 flex flex-col justify-between gap-4">' +
                        '<div>' +
                            '<span class="text-[8px] font-mono text-zinc-600 block uppercase">Mãe: ' + (cat.name || catSlug) + '</span>' +
                            '<h4 class="text-xs font-bold text-white tracking-wide uppercase truncate mt-0.5">' + (sub.name || subSlug) + '</h4>' +
                        '</div>' +
                        '<div class="grid grid-cols-3 gap-1.5 border-t border-zinc-900 pt-3">' +
                            '<button onclick="window.editarSubcatAcao(\'' + catSlug + '\', \'' + subSlug + '\', \'' + nomeSafe + '\', \'' + imagemSafe + '\', \'' + catNomeSafe + '\')" class="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 py-2 rounded-xl text-[9px] font-bold transition-all text-center">✏️ Edit</button>' +
                            '<button onclick="window.alternarPausaSubcat(\'' + catSlug + '\', \'' + subSlug + '\', ' + pausado + ')" class="border py-2 rounded-xl text-[9px] font-bold transition-all text-center ' + (pausado ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-amber-950/20 border-amber-900/50 text-amber-500') + '">' + (pausado ? '▶️ Ativar' : '⏸️ Pausar') + '</button>' +
                            '<button onclick="window.excluirSubcatAcao(\'' + catSlug + '\', \'' + subSlug + '\')" class="bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900 text-zinc-500 hover:text-red-400 py-2 rounded-xl text-[9px] font-bold transition-all text-center">🗑️ Excluir</button>' +
                        '</div>' +
                    '</div>';

                grid.appendChild(card);
            });
        });

        if (!total) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-zinc-600 font-mono text-xs">Nenhuma subcategoria localizada. Use o botão "+ Subcategoria" nas categorias-mãe.</div>';
        }
    }
    // Configura o canal contínuo com o Firebase
    function loopConexaoCategorias() {
        var dbRef = obterReferenciaBanco();
        if (!dbRef) {
            setTimeout(loopConexaoCategorias, 300);
            return;
        }

        dbRef.on('value', function(snap) {
            cacheLocalCategorias = snap.val() || {};
            if (abaAtivaCategorias === 'mae') {
                renderizarMae(cacheLocalCategorias);
            } else {
                renderizarSubcategorias();
            }
        }, function(error) {
            console.error("Erro Firebase Categorias:", error);
        });
    }
    loopConexaoCategorias();

    // MAPEAMENTO DAS JANELAS MODAIS
    window.abrirModalCategoriaNova = function() {
        document.getElementById('catId').value = '';
        document.getElementById('catPaiId').value = '';
        document.getElementById('catNome').value = '';
        document.getElementById('catImagem').value = '';
        document.getElementById('modalCategoriaTitulo').innerText = 'Criar Nova Categoria-Mãe';
        document.getElementById('indicadorSubcat').classList.add('hidden');
        window.atualizarPreviewModal('');
        document.getElementById('modalCategoria').classList.remove('hidden');
    };

    window.abrirModalNovaSubcat = function(catPaiId, catPaiNome) {
        document.getElementById('catId').value = '';
        document.getElementById('catPaiId').value = catPaiId;
        document.getElementById('catNome').value = '';
        document.getElementById('catImagem').value = '';
        document.getElementById('modalCategoriaTitulo').innerText = 'Nova Subcategoria';
        document.getElementById('indicadorSubcat').classList.remove('hidden');
        document.getElementById('nomePaiLabel').innerText = catPaiNome;
        window.atualizarPreviewModal('');
        document.getElementById('modalCategoria').classList.remove('hidden');
    };

    window.editarCategoriaAcao = function(id, nome, imagem) {
        document.getElementById('catId').value = id;
        document.getElementById('catPaiId').value = '';
        document.getElementById('catNome').value = nome;
        document.getElementById('catImagem').value = imagem;
        document.getElementById('modalCategoriaTitulo').innerText = 'Modificar Categoria-Mãe';
        document.getElementById('indicadorSubcat').classList.add('hidden');
        window.atualizarPreviewModal(imagem);
        document.getElementById('modalCategoria').classList.remove('hidden');
    };

    window.editarSubcatAcao = function(catPaiId, subId, nome, imagem, catPaiNome) {
        document.getElementById('catId').value = subId;
        document.getElementById('catPaiId').value = catPaiId;
        document.getElementById('catNome').value = nome;
        document.getElementById('catImagem').value = imagem;
        document.getElementById('modalCategoriaTitulo').innerText = 'Modificar Subcategoria';
        document.getElementById('indicadorSubcat').classList.remove('hidden');
        document.getElementById('nomePaiLabel').innerText = catPaiNome;
        window.atualizarPreviewModal(imagem);
        document.getElementById('modalCategoria').classList.remove('hidden');
    };

    window.fecharModalCategoriaLocal = function() {
        document.getElementById('modalCategoria').classList.add('hidden');
    };

    window.salvarCategoriaDados = function() {
        var id = document.getElementById('catId').value.trim();
        var paiId = document.getElementById('catPaiId').value.trim();
        var nome = document.getElementById('catNome').value.trim();
        var imagem = document.getElementById('catImagem').value.trim();

        if (!nome) { alert('Informe o nome da coleção.'); return; }

        var dbRef = obterReferenciaBanco();
        if (!dbRef) { alert('Banco de dados inacessível no momento.'); return; }

        var slug = id || gerarSlug(nome);
        var payload = { name: nome, slug: slug, image: imagem };

        if (paiId) {
            if (!id) payload.paused = false;
            dbRef.child(paiId + '/subcategories/' + slug).update(payload)
                .then(function() { window.fecharModalCategoriaLocal(); })
                .catch(function(e) { alert('Erro ao salvar: ' + e.message); });
        } else {
            if (!id) payload.paused = false;
            dbRef.child(slug).update(payload)
                .then(function() { window.fecharModalCategoriaLocal(); })
                .catch(function(e) { alert('Erro ao salvar: ' + e.message); });
        }
    };

    window.alternarPausaAcao = function(id, statusAtual) {
        var dbRef = obterReferenciaBanco();
        if(dbRef) dbRef.child(id).update({ paused: !statusAtual });
    };

    window.alternarPausaSubcat = function(catId, subId, statusAtual) {
        var dbRef = obterReferenciaBanco();
        if(dbRef) dbRef.child(catId + '/subcategories/' + subId).update({ paused: !statusAtual });
    };

    window.excluirCategoriaAcao = function(id) {
        var dbRef = obterReferenciaBanco();
        if (dbRef && confirm('Deseja remover a categoria [' + id.toUpperCase() + '] de forma definitiva?')) {
            dbRef.child(id).remove();
        }
    };

    window.excluirSubcatAcao = function(catId, subId) {
        var dbRef = obterReferenciaBanco();
        if (dbRef && confirm('Deseja remover a subcategoria [' + subId.toUpperCase() + '] de forma definitiva?')) {
            dbRef.child(catId + '/subcategories/' + subId).remove();
        }
    };
})();
