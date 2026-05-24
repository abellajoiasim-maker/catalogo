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
window.filtroCategoriaProdutoAtual = "Todas";

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

    // 1. Escuta contínua de Pedidos
    window.db.ref('abella/orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });

    // 2. Escuta contínua de Produtos
    window.db.ref('abella/products').on('value', function(snapshot) {
        window.todosProdutosLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoProdutos === 'function') {
            window.carregarBlocoProdutos(false);
        }
    });

    // 3. Escuta contínua de Categorias
    window.db.ref('abella/categories').on('value', function(snapshot) {
        window.todasCategoriasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoCategorias === 'function') {
            window.carregarBlocoCategorias();
        }
    });

    // 4. Escuta contínua de Galvânicas
    window.db.ref('abella/galvanicas').on('value', function(snapshot) {
        window.todasGalvanicasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoGalvanicas === 'function') {
            window.carregarBlocoGalvanicas();
        }
    });

    // 5. Escuta contínua de Parâmetros / Configurações
    window.db.ref('abella/config').on('value', function(snapshot) {
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
            container.innerHTML = html;
            // Invoca a amarração e binds lógicos imediatamente após a injeção do HTML no DOM
            window.orquestrarBindsSubmodulo(pathAba);
        })
        .catch(function(err) {
            container.innerHTML = `
                <div class="p-6 bg-red-950/20 border border-red-900 text-red-400 text-xs font-mono rounded-2xl max-w-lg mx-auto mt-12 text-center shadow-xl">
                    ⚠️ Erro de carregamento assíncrono: Módulo <b>modulo/${pathAba}.html</b> indisponível ou inacessível no GitHub.
                </div>
            `;
        });
};

// ==========================================================================
// ORQUESTRAÇÃO DE BINDS E MÉTODOS DOS SUBMÓDULOS (ANTI-QUEBRA DE ESCOPO)
// ==========================================================================
window.orquestrarBindsSubmodulo = function(modulo) {
    console.log(`⚡ Conectando canais globais para o módulo ativo: [${modulo.toUpperCase()}]`);

    // ----------------------------------------------------------------------
    // BINDS DO MÓDULO DE PEDIDOS
    // ----------------------------------------------------------------------
    if (modulo === 'pedidos') {
        window.renderizarTabelaPedidosVisivel = function() {
            var tbody = document.getElementById('listaPedidos');
            if (!tbody) return;

            tbody.innerHTML = '';
            var chaves = Object.keys(window.todosPedidosLocal).reverse();

            // Aplicação prática de filtros por status
            if (window.filtroStatusPedidoAtual !== "Todos") {
                chaves = chaves.filter(function(k) {
                    return window.todosPedidosLocal[k].status === window.filtroStatusPedidoAtual;
                });
            }

            if (chaves.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-zinc-600 font-mono italic">Nenhum pedido localizado para a seleção [${window.filtroStatusPedidoAtual}].</td></tr>`;
                return;
            }

            chaves.forEach(function(key) {
                var p = window.todosPedidosLocal[key];
                var totalStr = typeof p.total === 'number' ? window.formatarMoedaReal(p.total) : (p.total || window.formatarMoedaReal(0));
                var dataStr = p.data ? new Date(p.data).toLocaleString('pt-BR') : 'N/A';

                var tr = document.createElement('tr');
                tr.className = "border-b border-zinc-900 hover:bg-zinc-950/40 transition-all font-mono text-xs";
                tr.innerHTML = `
                    <td class="p-4 font-bold text-[#caa85c]">#${key.slice(-6).toUpperCase()}</td>
                    <td class="p-4 font-sans font-medium text-white">${p.nome || p.cliente || 'Consumidor'}</td>
                    <td class="p-4 text-zinc-500">${dataStr}</td>
                    <td class="p-4 text-emerald-400 font-bold">${totalStr}</td>
                    <td class="p-4">
                        <span class="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${p.status === 'Concluído' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'}">
                            ${p.status || 'Pendente'}
                        </span>
                    </td>
                    <td class="p-4 text-right">
                        <button onclick="window.abrirDetalhesPedidoModal('${key}')" class="bg-zinc-900 border border-zinc-800 hover:border-[#caa85c] text-white hover:text-[#caa85c] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Ver Lote</button>
                    </td>
                `;
                tbody.appendChild(tr);
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
            alert(`Lendo metadados de itens do comprador: ${pedido.nome || 'Abella Cliente'}\nID: ${id}`);
        };

        window.gerarPdfConferenciaPedido = function(id) {
            alert(`Iniciando jsPDF para romaneio de expedição física para as galvânicas de Limeira. ID: ${id}`);
        };

        window.renderizarTabelaPedidosVisivel();
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

        window.alternarPausaProduto = function(id, statusAtual) {
            window.db.ref(`abella/products/${id}`).update({ paused: !statusAtual });
        };

        window.carregarBlocoProdutos(true);
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
                
                var statusPromo = cat.promoAtiva ? 
                    `<span class="bg-emerald-950/60 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">Promoção Ativa (-${cat.promoPorcentagem}%)</span>` : 
                    `<span class="bg-zinc-900 text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">Sem Desconto Coletivo</span>`;

                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-white text-sm font-bold font-sans">${cat.nome || cat.name}</h4>
                            <p class="text-[10px] text-zinc-500 font-mono mt-0.5">Nó ID: ${key}</p>
                        </div>
                        <button onclick="window.excluirCategoriaItem('${key}')" class="text-zinc-600 hover:text-rose-500 font-bold transition-all text-xs">✕</button>
                    </div>
                    <div class="border-t border-zinc-900/60 pt-3 space-y-2">
                        <div class="flex items-center gap-2">${statusPromo}</div>
                        ${cat.promoNome ? `<p class="text-[10px] text-zinc-400 font-mono truncate">Etiqueta: <b class="text-amber-400">${cat.promoNome}</b></p>` : ''}
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
                document.getElementById('catPromoAtiva').value = 'false';
                document.getElementById('catPromoPorcentagem').value = '0';
                document.getElementById('catPromoNome').value = '';
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
            document.getElementById('catNome').value = cat.nome || cat.name || '';
            document.getElementById('catPromoAtiva').value = cat.promoAtiva ? 'true' : 'false';
            document.getElementById('catPromoPorcentagem').value = cat.promoPorcentagem || '0';
            document.getElementById('catPromoNome').value = cat.promoNome || '';
        };

        window.excluirCategoriaItem = function(id) {
            if (confirm(`⚠️ Tem certeza de que deseja remover a categoria [${id}]?\nIsso removerá as regras de desconto em lote.`)) {
                window.db.ref(`abella/categories/${id}`).remove();
            }
        };

        window.carregarBclocoCategorias = function() { window.carregarBlocoCategorias(); };
        window.carregarBlocoCategorias();
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
    }, 100);
}
