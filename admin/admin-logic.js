// FILE: admin/admin-logic.js

// CENTRALIZAÇÃO DA CONFIGURAÇÃO DO AMBIENTE CORE DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com"
};

// Inicialização única e blindada de instâncias do Firebase Compat
if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
}
const firebaseDB = window.firebase.database();

// EXPOSIÇÃO OPERACIONAL EM ESCOPO GLOBAL (WINDOW)
window.db = firebaseDB;
window.todosPedidosLocal = {};
window.todosProdutosLocal = {};
window.todasCategoriasLocal = {};
window.todasGalvanicasLocal = {};
window.configuracoesGlobaisLocal = {};
window.filtroStatusPedidoAtual = "Todos";

// AUXILIARES DE TRATAMENTO DE DADOS
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
            console.error("Falha ao tratar URI do Storage do Firebase:", e);
            return urlStr;
        }
    }
    return urlStr;
};

window.formatarMoedaReal = function(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
};

// ESCUTAS EM TEMPO REAL SRE (REALTIME DATA SYNC BACKGROUND)
if (window.db) {
    console.log("🔥 [Firebase Core Master] Conectado e escutando o nó /abella em tempo real.");
    
    window.db.ref('abella/orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
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

// INJETOR DINÂMICO E ROTEADOR DE FRAGMENTOS OPERACIONAIS (SPA)
window.mudarAbaDinamica = function(aba) {
    var container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // Atualização estética do menu lateral de navegação
    document.querySelectorAll('#menu-navegacao button').forEach(function(btn) {
        btn.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all bg-zinc-900 text-gray-400 hover:text-white";
    });

    var idBotao = (aba === 'categories' || aba === 'categorias') ? 'btn-categories' : `btn-${aba}`;
    var btnAtivo = document.getElementById(idBotao);
    if (btnAtivo) {
        btnAtivo.className = "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all bg-[#caa85c] text-black";
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-600 italic text-xs font-mono animate-pulse">Buscando fragmento assíncrono [${aba.toUpperCase()}]...</div>`;

    var pathAba = (aba === 'categories') ? 'categorias' : aba;
    var tentativa1 = `../modulo/${pathAba}.html`;
    var tentativa2 = `modulo/${pathAba}.html`;

    fetch(tentativa1)
        .then(function(res) { if (!res.ok) return fetch(tentativa2); return res; })
        .then(function(res) { if (!res.ok) throw new Error("Não foi possível localizar o caminho físico da rota."); return res.text(); })
        .then(function(html) {
            container.innerHTML = html;
            window.orquestrarBindsSubmodulo(pathAba);
        })
        .catch(function(err) {
            console.error(err);
            container.innerHTML = `<div class="p-8 text-center text-red-500 font-mono text-xs">Erro 404: Fragmento de visualização inacessível.</div>`;
        });
};

// ORQUESTRADOR DE VINCULAÇÃO E EXECUÇÃO DE CALLBACKS (BINDS)
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

// CORREÇÃO CRÍTICA DO GAP: RETROCOMPATIBILIDADE E ALIASES INJETADOS VIA WINDOW
window.salvarDadosProdutoDoForm = function() {
    if (typeof window.salvarProdutoFirebase === 'function') {
        window.salvarProdutoFirebase();
    } else {
        console.error("Critical: Função 'salvarProdutoFirebase' ainda não instanciada no escopo.");
    }
};

window.salvarNovaCategoriaItem = function() {
    if (typeof window.salvarCategoriaFirebase === 'function') {
        window.salvarCategoriaFirebase();
    } else {
        console.error("Critical: Função 'salvarCategoriaFirebase' não registrada no contexto global.");
    }
};

// EXIBIÇÃO DE DETALHES DE PEDIDOS (CORREÇÃO DA VARIÁVEL 'p' INEXISTENTE)
window.abrirDetalhesPedidoModal = function(idPedido) {
    var pedido = window.todosPedidosLocal[idPedido];
    if (!pedido) return;
    
    // CORRIGIDO: Removido por completo o 'p.cliente' que quebrava o script, utilizando o mapeamento robusto do nó 'pedido'
    var nomeFinalDoCliente = pedido.nome || pedido.cliente || "Cliente Não Informado";
    
    var elCliente = document.getElementById('modalDetalheCliente');
    if (elCliente) elCliente.innerText = nomeFinalDoCliente;
    
    var modal = document.getElementById('modalDetalhesPedido');
    if (modal) modal.classList.remove('hidden');
};

// ANTI-DUPLO BOOTSTRAP (INITIALIZATION SHIELD GUARD)
let _painelBootstrapCarregado = false;
function inicializarPainelAdmin() {
    if (_painelBootstrapCarregado) return;
    _painelBootstrapCarregado = true;
    console.log("⚙️ Master Core do Admin inicializado com proteção de concorrência.");
    window.mudarAbaDinamica('pedidos');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    inicializarPainelAdmin();
} else {
    document.addEventListener('DOMContentLoaded', inicializarPainelAdmin);
}
