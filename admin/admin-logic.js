// FILE: admin/admin-logic.js

// CONFIGURAÇÃO DO AMBIENTE CORE DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com"
};

// Inicialização segura sem duplicação de instâncias
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}
const firebaseDB = window.firebase.database();

// EXPOSIÇÃO GLOBAL DOS RECURSOS DA ARQUITETURA
window.db = firebaseDB;
window.todosPedidosLocal = {};
window.todosProdutosLocal = {};
window.todasCategoriasLocal = {};
window.todasGalvanicasLocal = {};
window.configuracoesGlobaisLocal = {};
window.filtroStatusPedidoAtual = "Todos";

// UTILITÁRIOS OPERACIONAIS DE FORMATTAÇÃO
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

// SINCRONIZADORES EM TEMPO REAL (REALTIME SYNC BACKGROUND)
if (window.db) {
    console.log("🔥 [Firebase Core Master] Sincronização ativa no nó unificado /abella.");
    
    window.db.ref('abella/orders').on('value', function(snapshot) {
        var dadosBrutos = snapshot.val() || {};
        var pedidosFiltrados = {};
        Object.keys(dadosBrutos).forEach(function(key) {
            pedidosFiltrados[key] = dadosBrutos[key];
        });
        window.todosPedidosLocal = pedidosFiltrados;
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });

    window.db.ref('abella/products').on('value', function(snapshot) {
        window.todosProdutosLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoProdutos === 'function') {
            window.carregarBlocoProdutos(false);
        }
    });

    window.db.ref('abella/categories').on('value', function(snapshot) {
        window.todasCategoriasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoCategorias === 'function') {
            window.carregarBlocoCategorias();
        }
    });

    window.db.ref('abella/galvanicas').on('value', function(snapshot) {
        window.todasGalvanicasLocal = snapshot.val() || {};
        if (typeof window.carregarBlocoGalvanicas === 'function') {
            window.carregarBlocoGalvanicas();
        }
    });

    window.db.ref('abella/settings').on('value', function(snapshot) {
        window.configuracoesGlobaisLocal = snapshot.val() || {};
        if (typeof window.renderizarCamposConfiguracao === 'function') {
            window.renderizarCamposConfiguracao();
        }
    });
}

// ROTEAMENTO ASSÍNCRONO DE FRAGMENTOS HTML
window.mudarAbaDinamica = function(aba) {
    var container = document.getElementById('conteudo-dinamico');
    if (!container) return;

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
        .then(function(res) { if (!res.ok) throw new Error("Não foi possível encontrar a rota do fragmento."); return res.text(); })
        .then(function(html) {
            container.innerHTML = html;
            window.orquestrarBindsSubmodulo(pathAba);
        })
        .catch(function(err) {
            console.error(err);
            container.innerHTML = `<div class="p-8 text-center text-red-500 font-mono text-xs">Erro ao renderizar fragmento dinâmico.</div>`;
        });
};

// ORQUESTRADOR DE EVENTOS E FUNÇÕES DOS SUBMÓDULOS (BINDS)
window.orquestrarBindsSubmodulo = function(aba) {
    if (aba === 'pedidos') {
        window.renderizarTabelaPedidosVisivel();
    } else if (aba === 'produtos') {
        window.carregarBlocoProdutos(true);
    } else if (aba === 'categorias' || aba === 'categories') {
        window.carregarBlocoCategorias();
    } else if (aba === 'galvanicas') {
        window.carregarBlocoGalvanicas();
    } else if (aba === 'config') {
        window.renderizarCamposConfiguracao();
    }
};

// CORREÇÃO DOS GAPS DE CONCLUSÃO: IMPLEMENTAÇÃO DOS ALIASES DE ACESSO VIA WINDOW
window.salvarDadosProdutoDoForm = function() {
    if (typeof window.salvarProdutoFirebase === 'function') {
        window.salvarProdutoFirebase();
    } else {
        console.error("Função salvarProdutoFirebase não carregada no escopo.");
    }
};

window.salvarNovaCategoriaItem = function() {
    if (typeof window.salvarCategoriaFirebase === 'function') {
        window.salvarCategoriaFirebase();
    } else {
        console.error("Função salvarCategoriaFirebase não carregada no escopo.");
    }
};

// OPERAÇÕES COMPLEMENTARES CORRIGIDAS (Exemplo: Modal Detalhes do Pedido)
window.abrirDetalhesPedidoModal = function(idPedido) {
    var pedido = window.todosPedidosLocal[idPedido];
    if (!pedido) return;
    
    // CORRIGIDO: Removida a referência à variável inexistente 'p'
    var clienteNome = pedido.nome || pedido.cliente || "Não Identificado";
    document.getElementById('modalDetalheCliente').innerText = clienteNome;
    
    // Lógica interna de exibição do modal...
    var modal = document.getElementById('modalDetalhesPedido');
    if (modal) modal.classList.remove('hidden');
};

// INICIALIZAÇÃO CONTROLADA UNIFICADA (PROTEÇÃO DE DUPLO BOOTSTRAP)
let _appInicializado = false;
function initApp() {
    if (_appInicializado) return;
    _appInicializado = true;
    console.log("🚀 Sistema Operacional Base Inicializado com Sucesso.");
    window.mudarAbaDinamica('pedidos');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initApp();
} else {
    document.addEventListener('DOMContentLoaded', initApp);
}
