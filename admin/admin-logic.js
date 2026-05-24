// ==========================================================================
// CENTRAL COLOGIC ENGINE - SYSTEM CONTROL BAR (ABELLA JOIAS MASTER)
// ==========================================================================
import { db as firebaseDB } from '../images/js/firebase/firebase.js';

// INSTANCIAÇÃO E MAPEAMENTO DE ESCOPO GLOBAL ABSOLUTO
window.db = firebaseDB;
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
// SINCRONIZADORES EM TEMPO REAL (REALTIME BACKGROUND SYNC)
// ==========================================================================
if (window.db) {
    console.log("🔥 [Firebase Core] Conexão estabelecida e ativa no nó unificado /abella.");

    // 1. Escuta contínua de Pedidos (Nó: abella/orders)
    window.db.ref('abella/orders').on('value', function(snapshot) {
        var dadosBrutos = snapshot.val() || {};
        var pedidosFiltrados = {};
        Object.keys(dadosBrutos).forEach(function(key) {
            if (key !== 'products' && key !== 'settings' && key !== 'categories' && key !== 'galvanicas') {
                pedidosFiltrados[key] = dadosBrutos[key];
            }
        });
        window.todosPedidosLocal = pedidosFiltrados;
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });

    // 2. Escuta contínua de Produtos (Nó: abella/products)
    window.db.ref('abella/products').on('value', function(snapshot) {
        window.todosProdutosLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoProdutos === 'function') {
            window.carregarBlocoProdutos(false);
        }
    });

    // 3. Escuta contínua de Categorias (Nó: abella/categories)
    window.db.ref('abella/categories').on('value', function(snapshot) {
        window.todasCategoriasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoCategorias === 'function') {
            window.carregarBlocoCategorias();
        }
    });

    // 4. Escuta contínua de Galvânicas (Nó: abella/galvanicas)
    window.db.ref('abella/galvanicas').on('value', function(snapshot) {
        window.todasGalvanicasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoGalvanicas === 'function') {
            window.carregarBlocoGalvanicas();
        }
    });

    // 5. Escuta contínua de Parâmetros / Configurações (Nó: abella/settings)
    window.db.ref('abella/settings').on('value', function(snapshot) {
        window.configuracoesGlobaisLocal = snapshot.val() || {};
        if (typeof window.renderizarCamposConfiguracao === 'function') {
            window.renderizarCamposConfiguracao();
        }
    });
} else {
    console.error("❌ [Erro Fatal] O barramento do Firebase Realtime Database falhou na inicialização.");
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
            
            // 3. GATILHO DE SEGURANÇA: Garante que os dados locais salvos do Firebase apareçam na tela imediatamente
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
        window.renderizarTabelaPedidosVisivel = function() {
            var container = document.getElementById('listaPedidos');
            if (!container) {
                console.warn("⚠️ Elemento #listaPedidos ainda não foi encontrado no DOM.");
                return;
            }

            container.innerHTML = '';
            var chaves = Object.keys(window.todosPedidosLocal).reverse();

            if (window.filtroStatusPedidoAtual !== "Todos") {
                chaves = chaves.filter(function(k) {
                    var p = window.todosPedidosLocal[k];
                    var statusReal = p.status || (p.resumo ? p.resumo.status : "Novo");
                    return statusReal.toLowerCase() === window.filtroStatusPedidoAtual.toLowerCase();
                });
            }

            if (chaves.length === 0) {
                container.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 font-mono italic text-xs">Nenhum pedido localizado para a seleção [${window.filtroStatusPedidoAtual}].</div>`;
                return;
            }

            chaves.forEach(function(key) {
                var p = window.todosPedidosLocal[key];
                
                var totalNum = p.total || (p.resumo ? p.resumo.total : 0);
                var totalStr = window.formatarMoedaReal(totalNum);
                var dataStr = p.data || "Sem Data";
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
                        <p class="text-xs text-zinc-500 truncate" title="${p.rua || ''}">📍 ${p.rua || 'Retirada / Não informado'}</p>
                        
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
                            <button onclick="const tipo = document.getElementById('select-romaneio-${key}').value; window.pedidoEditando = '${key}'; window.imprimirRomaneio ? window.imprimirRomaneio(parseInt(tipo)) : window.gerarPdfConferenciaPedido('${key}');" class="bg-[#caa85c] text-black font-bold text-[10px] px-3 py-1.5 rounded hover:brightness-110 uppercase tracking-wider transition-all shrink-0">Visualizar</button>
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
            var btnAtivo = document.getElementById(`filter-ped-${status.toLowerCase()}`);
            if (btnAtivo) {
                btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
                btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
            }
            window.renderizarTabelaPedidosVisivel();
        };

        window.abrirDetalhesPedidoModal = function(id) {
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
    }

    // ----------------------------------------------------------------------
    // BINDS DO MÓDULO DE PRODUTOS
    // ----------------------------------------------------------------------
    if (modulo === 'produtos') {
        window.carregarBlocoProdutos = function(forçarLimpezaDOM) {
            var grid = document.getElementById('grid-produtos');
            if (!grid) return;

            if (forçarLimpezaDOM) grid.innerHTML = '';
            
            var chaves = Object.keys(window.todosProdutosLocal);
            if (chaves.length === 0) {
                grid.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 italic font-mono">Nenhum produto cadastrado na ramificação /products.</div>`;
                return;
            }

            grid.innerHTML = '';
            chaves.forEach(function(key) {
                var prod = window.todosProdutosLocal[key];
                var imgTratada = window.resolverUrlImagem(prod.image || prod.imagem);

                var div = document.createElement('div');
                div.className = "bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3 hover:border-zinc-800 transition-all text-left relative";
                div.innerHTML = `
                    <div class="h-40 bg-black rounded-lg border border-zinc-900 overflow-hidden relative flex items-center justify-center">
                        <img src="${imgTratada}" class="w-full h-full object-cover">
                        ${prod.paused ? '<span class="absolute top-2 right-2 bg-red-950 text-red-400 border border-red-900 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Pausado</span>' : ''}
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-white text-xs font-bold truncate">${prod.name || 'Joia Sem Nome'}</h3>
                        <p class="text-[10px] text-zinc-500 font-mono truncate">SKU: ${prod.sku || 'N/A'} | Cat: ${prod.category || 'Geral'}</p>
                        <p class="text-[10px] text-zinc-400 font-mono">Peso: ${prod.weight || prod.peso || '0'}g</p>
                        <p class="text-xs text-[#caa85c] font-bold font-mono">${window.formatarMoedaReal(prod.price || prod.precoFinal)}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-1 font-sans">
                        <button onclick="window.editarProdutoItem('${key}')" class="bg-zinc-900 text-gray-300 hover:text-white border border-zinc-800 text-[10px] font-bold uppercase py-1.5 rounded-lg text-center transition-all">Editar</button>
                        <button onclick="window.alternarPausaProduto('${key}', ${prod.paused || false})" class="text-[10px] font-bold uppercase py-1.5 rounded-lg text-center border transition-all ${prod.paused ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900' : 'bg-amber-950/20 text-amber-400 border-amber-900'}">
                            ${prod.paused ? 'Ativar' : 'Pausar'}
                        </button>
                    </div>
                `;
                grid.appendChild(div);
            });
        };

        window.abrirModalProduto = function() {
            var modal = document.getElementById('modalFormProduto');
            if (modal) {
                modal.classList.remove('hidden');
                document.getElementById('modalFormProdutoTitulo').innerText = 'Cadastrar Novo Item no Bruto';
                document.getElementById('formProdutoReal').reset();
                document.getElementById('prodId').value = '';
            }
        };

        window.fecharModalProduto = function() {
            var modal = document.getElementById('modalFormProduto');
            if (modal) modal.classList.add('hidden');
        };

        window.editarProdutoItem = function(id) {
            var prod = window.todosProdutosLocal[id];
            if (!prod) return;

            window.abrirModalProduto();
            document.getElementById('modalFormProdutoTitulo').innerText = 'Modificar Parâmetros do Item';
            document.getElementById('prodId').value = id;
            document.getElementById('prodNome').value = prod.name || '';
            document.getElementById('prodSku').value = prod.sku || '';
            document.getElementById('prodCategoria').value = prod.category || '';
            document.getElementById('prodPeso').value = prod.weight || prod.peso || '';
            document.getElementById('prodPreco').value = prod.price || prod.precoFinal || '';
            document.getElementById('prodUrlImagem').value = prod.image || prod.imagem || '';
            if(document.getElementById('prodVariType')) document.getElementById('prodVariType').value = prod.variacaoTipo || '';
            if(document.getElementById('prodOpcoes')) document.getElementById('prodOpcoes').value = prod.opcoesPersonalizadas || '';
        };

        window.salvarProdutoFirebase = function() {
            var id = document.getElementById('prodId').value;
            var name = document.getElementById('prodNome').value.trim();
            var sku = document.getElementById('prodSku').value.trim();
            var category = document.getElementById('prodCategoria').value.trim();
            var weight = document.getElementById('prodPeso').value.trim();
            var price = parseFloat(document.getElementById('prodPreco').value) || 0;
            var variacaoTipo = document.getElementById('prodVariType') ? document.getElementById('prodVariType').value.trim() : 'Lista';
            var opcoesPersonalizadas = document.getElementById('prodOpcoes') ? document.getElementById('prodOpcoes').value.trim() : '';
            var image = document.getElementById('prodUrlImagem').value.trim();

            if (!name) { alert("⚠️ O nome é obrigatório!"); return; }

            var btn = document.getElementById('btnSalvarProduto');
            if (btn) btn.disabled = true;

            var dados = { 
                name: name, 
                sku: sku, 
                category: category, 
                weight: weight, 
                peso: weight, 
                price: price, 
                precoFinal: price, 
                variacaoTipo: variacaoTipo, 
                opcoesPersonalizadas: opcoesPersonalizadas, 
                image: image 
            };

            if (id) {
                window.db.ref(`abella/products/${id}`).update(dados).then(function() { fecharLimpar(); });
            } else {
                dados.paused = false;
                window.db.ref('abella/products').push(dados).then(function() { fecharLimpar(); });
            }

            function fecharLimpar() {
                window.fecharModalProduto();
                if (btn) btn.disabled = false;
                window.carregarBlocoProdutos(true);
            }
        };

        window.irParaEditorIA = function() {
            var idProduto = document.getElementById('prodId').value;
            var urlImagem = encodeURIComponent(document.getElementById('prodUrlImagem').value.trim());
            if(confirm("✨ Deseja abrir o Editor Full Master para tratar fotos com IA?")) {
                window.location.href = `../edit/editor.html?id=${idProduto}&img=${urlImagem}`;
            }
        };

        window.alternarPausaProduto = function(id, statusAtual) {
            window.db.ref(`abella/products/${id}`).update({ paused: !statusAtual });
        };
    }

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
                document.getElementById('catPromoAtiva').value = 'INATIVA';
                document.getElementById('catPromoPorcentagem').value = '0';
                document.getElementById('catPromoNome').value = '';
                document.getElementById('catOpcoesPersonalizadas').value = '';
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
            document.getElementById('catPromoAtiva').value = cat.promoStatus || (cat.promoAtiva ? 'ATIVA' : 'INATIVA');
            document.getElementById('catPromoPorcentagem').value = cat.promoPct || cat.discount || '0';
            document.getElementById('catPromoNome').value = cat.promoName || '';
            document.getElementById('catOpcoesPersonalizadas').value = cat.opcoesPersonalizadas || '';
        };

        window.salvarCategoriaFirebase = function() {
            var id = document.getElementById('catId').value.trim();
            var name = document.getElementById('catNome').value.trim();
            var promoStatus = document.getElementById('catPromoAtiva').value;
            var promoPct = parseInt(document.getElementById('catPromoPorcentagem').value) || 0;
            var promoName = document.getElementById('catPromoNome').value.trim();
            var opcoes = document.getElementById('catOpcoesPersonalizadas').value.trim();

            if (!name) { alert("⚠️ Nome é obrigatório!"); return; }

            var slug = id ? id : name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");

            var dados = {
                name: name,
                slug: slug,
                promoStatus: promoStatus,
                promoAtiva: promoStatus === "ATIVA",
                promoPct: promoPct,
                discount: promoPct,
                promoName: promoName,
                opcoesPersonalizadas: opcoes
            };

            window.db.ref(`abella/categories/${slug}`).update(dados).then(function() {
                window.fecharModalCategoria();
                window.carregarBlocoCategorias();
            });
        };

        window.excluirCategoriaItem = function(id) {
            if (confirm(`⚠️ Deseja remover a categoria [${id}]?`)) {
                window.db.ref(`abella/categories/${id}`).remove();
            }
        };
    }
};

// ==========================================================================
// BOOTSTRAP AUTOSTART (INICIALIZAÇÃO AUTOMÁTICA SEGURA)
// ==========================================================================
window.addEventListener('DOMContentLoaded', function() {
    window.mudarAbaDinamica('pedidos');
});

if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(function() {
        if (window.mudarAbaDinamica && !document.getElementById('listaPedidos')) {
            window.mudarAbaDinamica('pedidos');
        }
    }, 150);
}
