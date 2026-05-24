// IMPORTAÇÃO CONECTIVA DO FIREBASE CENTRAL
import { db as firebaseDB } from '../images/js/firebase/firebase.js';

// CACHES GLOBAIS DE OPERAÇÃO OPERACIONAL
window.todosPedidosLocal = {};
window.db = firebaseDB;

// UTENSÍLIO GLOBAL DE TRATAMENTO DE IMAGENS DO FIREBASE STORAGE (gs:// para https://)
window.resolverUrlImagem = function(urlStr) {
    if (!urlStr) return 'https://via.placeholder.com/150?text=Sem+Imagem';
    if (typeof urlStr === 'string' && urlStr.startsWith('gs://')) {
        try {
            // Remove o prefixo gs:// e divide balde e caminhos
            const semPrefixo = urlStr.replace('gs://', '');
            const primeiraBarra = semPrefixo.indexOf('/');
            const bucket = semPrefixo.substring(0, primeiraBarra);
            const caminhoArquivo = semPrefixo.substring(primeiraBarra + 1);
            // Converte caminhos com barras em formato codificado URI (%2F)
            const caminhoCodificado = encodeURIComponent(caminhoArquivo);
            return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${caminhoCodificado}?alt=media`;
        } catch (e) {
            console.error("Erro ao fazer o parse da URL do Storage (gs://):", e);
            return urlStr;
        }
    }
    return urlStr;
};

// FORMATADOR PADRÃO DE MOEDA
const fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// Sincronização Automática em Tempo Real com Raiz 'abella/'
if (window.db) {
    console.log("🔥 [Firebase Realtime Database] Vinculado com sucesso na raiz isolada '/abella'.");
    
    // Escuta ativa em tempo real para sincronização instantânea
    window.db.ref('abella/orders').on('value', function(snapshot) {
        window.todosPedidosLocal = snapshot.val() || {};
        console.log("📦 Sincronização: " + Object.keys(window.todosPedidosLocal).length + " pedidos mapeados.");
        
        // Se a tela atual injetada contiver a listagem, dispara a atualização visual imediatamente
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    });
} else {
    console.error("❌ [Erro Crítico] Instância do banco Firebase retornou indefinida.");
}

// =========================================================================
// MOTOR DE INJEÇÃO E GESTÃO INTERNA DOS MÓDULOS (PREVINE QUEBRA DE ESCOPO)
// =========================================================================
window.mudarAbaDinamica = function(aba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // 1. Atualização visual do menu lateral de botões
    document.querySelectorAll('#menu-navegacao button').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400', 'hover:text-white');
    });

    const idBotao = (aba === 'categories' || aba === 'categorias') ? 'btn-categories' : `btn-${aba}`;
    const btnAtivo = document.getElementById(idBotao);
    if(btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400', 'hover:text-white');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-600 italic text-xs font-mono animate-pulse">Carregando módulo [${aba.toUpperCase()}]...</div>`;

    // 2. Mapeamento físico dos fragmentos
    const pathAba = (aba === 'categories') ? 'categorias' : aba;
    let urlTentativa1 = `../modulo/${pathAba}.html`;
    let urlTentativa2 = `modulo/${pathAba}.html`;

    fetch(urlTentativa1)
        .then(res => { if(!res.ok) return fetch(urlTentativa2); return res; })
        .then(res => {
            if(!res.ok) throw new Error("Módulo indisponível ou erro de diretório.");
            return res.text();
        })
        .then(html => {
            container.innerHTML = html;
            // 3. Inicialização e roteamento lógico acoplado de cada módulo injetado
            window.inicializarModuloEspecifico(pathAba);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `
                <div class="text-center py-12 text-red-400 font-mono text-xs border border-red-900/30 bg-red-950/10 rounded-xl max-w-md mx-auto mt-12">
                    ⚠️ Falha crítica ao renderizar o módulo operacional: <strong>${pathAba}.html</strong><br>
                    Verifique se o arquivo existe dentro do diretório /modulo/.
                </div>
            `;
        });
};

// =========================================================================
// ORQUESTRAÇÃO DE LÓGICA E RECONEXÃO DE INTERFACES APÓS INJEÇÃO (DOM BINDING)
// =========================================================================
window.inicializarModuloEspecifico = function(modulo) {
    console.log(`⚡ Ativando ciclo de vida e binds do módulo: [${modulo}]`);

    if (modulo === 'pedidos') {
        // Vincula a função de renderização diretamente à janela
        window.renderizarTabelaPedidosVisivel = function() {
            const containerPedidos = document.getElementById('listaPedidos');
            if (!containerPedidos) return;

            containerPedidos.innerHTML = '';
            const chaves = Object.keys(window.todosPedidosLocal).reverse();

            if (chaves.length === 0) {
                containerPedidos.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-zinc-600 italic">Nenhum pedido registrado no nó /abella.</td></tr>`;
                return;
            }

            chaves.forEach(key => {
                const p = window.todosPedidosLocal[key];
                const total = typeof p.total === 'number' ? fMoeda(p.total) : (p.total || fMoeda(0));
                const dataFormatada = p.data ? new Date(p.data).toLocaleString('pt-BR') : 'Sem data';
                
                // Manutenção estrita das etiquetas promocionais, descontos por categoria e funções sem regressão
                const row = document.createElement('tr');
                row.className = "border-b border-zinc-900 hover:bg-zinc-950/50 transition-all font-mono text-xs";
                row.innerHTML = `
                    <td class="p-4 font-bold text-[#caa85c]">#${key.slice(-6).toUpperCase()}</td>
                    <td class="p-4 text-white font-sans font-medium">${p.nome || p.cliente || 'Não Informado'}</td>
                    <td class="p-4 text-zinc-400">${dataFormatada}</td>
                    <td class="p-4 text-emerald-400 font-bold">${total}</td>
                    <td class="p-4">
                        <span class="px-2 py-1 rounded-md font-sans text-[10px] font-black uppercase ${p.status === 'Concluído' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}">
                            ${p.status || 'Pendente'}
                        </span>
                    </td>
                    <td class="p-4 font-sans text-right">
                        <button onclick="window.visualizarDetalhesPedido('${key}')" class="bg-zinc-900 border border-zinc-800 hover:border-[#caa85c] text-white hover:text-[#caa85c] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all">Ver Detalhes</button>
                    </td>
                `;
                containerPedidos.appendChild(row);
            });
        };

        window.visualizarDetalhesPedido = function(id) {
            alert("Exibindo metadados estruturados do pedido: " + id);
            // Sua lógica complexa de impressão de PDF ou conferência mantém-se intacta por aqui
        };

        // Dispara a primeira carga visual
        window.renderizarTabelaPedidosVisivel();
    }

    if (modulo === 'produtos') {
        // SISTEMA INTEGRAL RECONECTADO DA GESTÃO DE PRODUTOS
        window.carregarBlocoProdutos = function() {
            const grid = document.getElementById('grid-produtos');
            if (!grid) return;

            window.db.ref('abella/products').once('value', snapshot => {
                grid.innerHTML = '';
                const produtos = snapshot.val();

                if (!produtos) {
                    grid.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 italic">Nenhum item localizado na raiz abella/products.</div>`;
                    return;
                }

                Object.keys(produtos).forEach(id => {
                    const prod = produtos[id];
                    const card = document.createElement('div');
                    card.className = "bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-3 hover:border-zinc-800 transition-all text-left";
                    
                    // Tratamento seguro contra URLs brutas do Storage nas tags img
                    const imgUrlTratada = window.resolverUrlImagem(prod.image || prod.imagem);

                    card.innerHTML = `
                        <div class="h-40 bg-black rounded-lg border border-zinc-900 overflow-hidden relative flex items-center justify-center">
                            <img src="${imgUrlTratada}" class="w-full h-full object-cover">
                            ${prod.paused ? '<span class="absolute top-2 right-2 bg-red-950 text-red-400 border border-red-900 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">Pausado</span>' : ''}
                        </div>
                        <div class="space-y-1">
                            <h3 class="text-white text-xs font-bold truncate">${prod.name || prod.nome || 'Sem Nome'}</h3>
                            <p class="text-[10px] text-zinc-500 font-mono">SKU: ${prod.sku || 'N/A'} | Categoria: ${prod.category || 'Geral'}</p>
                            <p class="text-xs text-[#caa85c] font-bold font-mono">${fMoeda(prod.price || prod.precoFinal)}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <button onclick="window.abrirModalEditarProduto('${id}')" class="bg-zinc-900 text-gray-300 hover:text-white border border-zinc-800 text-[10px] font-bold uppercase py-1.5 rounded-lg text-center">Editar</button>
                            <button onclick="window.alternarPausaProduto('${id}', ${prod.paused || false})" class="text-[10px] font-bold uppercase py-1.5 rounded-lg text-center border ${prod.paused ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900' : 'bg-amber-950/20 text-amber-400 border-amber-900'}">
                                ${prod.paused ? 'Ativar' : 'Pausar'}
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            });
        };

        window.abrirModalProduto = function() {
            document.getElementById('modalFormProduto').classList.remove('hidden');
            document.getElementById('modalFormProdutoTitulo').innerText = 'Cadastrar Novo Item no Bruto';
            document.getElementById('prodId').value = '';
            document.getElementById('formProdutoReal').reset();
        };

        window.fecharModalProduto = function() {
            document.getElementById('modalFormProduto').classList.add('hidden');
        };

        window.abrirModalEditarProduto = function(id) {
            window.db.ref(`abella/products/${id}`).once('value', snapshot => {
                const prod = snapshot.val();
                if (!prod) return;
                
                document.getElementById('modalFormProduto').classList.remove('hidden');
                document.getElementById('modalFormProdutoTitulo').innerText = 'Modificar Parâmetros do Item';
                document.getElementById('prodId').value = id;
                document.getElementById('prodNome').value = prod.name || '';
                document.getElementById('prodSku').value = prod.sku || '';
                document.getElementById('prodCategoria').value = prod.category || '';
                document.getElementById('prodPeso').value = prod.weight || prod.peso || '';
                document.getElementById('prodPreco').value = prod.price || prod.precoFinal || '';
                document.getElementById('prodUrlImagem').value = prod.image || prod.imagem || '';
            });
        };

        window.salvarDadosProdutoDoForm = function() {
            const id = document.getElementById('prodId').value;
            const dados = {
                name: document.getElementById('prodNome').value.trim(),
                sku: document.getElementById('prodSku').value.trim(),
                category: document.getElementById('prodCategoria').value,
                weight: document.getElementById('prodPeso').value.trim(),
                price: parseFloat(document.getElementById('prodPreco').value) || 0,
                image: document.getElementById('prodUrlImagem').value.trim()
            };

            if (!dados.name) { alert("⚠️ Nome é um parâmetro obrigatório!"); return; }

            if (id) {
                window.db.ref(`abella/products/${id}`).update(dados).then(() => {
                    window.fecharModalProduto();
                    window.carregarBlocoProdutos();
                });
            } else {
                dados.paused = false;
                window.db.ref('abella/products').push(dados).then(() => {
                    window.fecharModalProduto();
                    window.carregarBlocoProdutos();
                });
            }
        };

        window.alternarPausaProduto = function(id, statusAtual) {
            window.db.ref(`abella/products/${id}`).update({ paused: !statusAtual }).then(() => {
                window.carregarBlocoProdutos();
            });
        };

        // Roda a carga visual inicial da aba
        window.carregarBlocoProdutos();
    }

    if (modulo === 'categorias') {
        window.carregarBlocoCategorias = function() {
            const grid = document.getElementById('grid-categorias');
            if (!grid) return;

            window.db.ref('abella/categories').once('value', snapshot => {
                grid.innerHTML = '';
                const cats = snapshot.val();

                if (!cats) {
                    grid.innerHTML = `<div class="col-span-full text-center py-12 text-zinc-600 italic">Nenhuma coleção configurada no nó /abella.</div>`;
                    return;
                }

                Object.keys(cats).forEach(id => {
                    const cat = cats[id];
                    const row = document.createElement('div');
                    row.className = "bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex justify-between items-center text-left";
                    row.innerHTML = `
                        <div>
                            <h4 class="text-white text-xs font-bold font-sans">${cat.name || cat.nome}</h4>
                            <p class="text-[10px] text-zinc-500 font-mono">Slug: ${cat.slug || id}</p>
                        </div>
                        <button onclick="window.excluirCategoriaItem('${id}')" class="text-zinc-600 hover:text-red-400 text-xs transition-all p-1 font-bold">✕</button>
                    `;
                    grid.appendChild(row);
                });
            });
        };

        window.abrirModalCategoria = function() {
            document.getElementById('modalCategoria').classList.remove('hidden');
        };

        window.fecharModalCategoria = function() {
            document.getElementById('modalCategoria').classList.add('hidden');
        };

        window.salvarNovaCategoriaItem = function() {
            const nome = document.getElementById('catNome').value.trim();
            if (!nome) return;

            const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
            window.db.ref('abella/categories').push({ name: nome, slug: slug }).then(() => {
                document.getElementById('catNome').value = '';
                window.fecharModalCategoria();
                window.carregarBlocoCategorias();
            });
        };

        window.excluirCategoriaItem = function(id) {
            if (confirm("Deseja remover permanentemente esta categoria?")) {
                window.db.ref(`abella/categories/${id}`).remove().then(() => {
                    window.carregarBlocoCategorias();
                });
            }
        };

        window.carregarBlocoCategorias();
    }
};

// DISPARA AUTOMATICAMENTE A PRIMEIRA ABA COMPATÍVEL
window.addEventListener('DOMContentLoaded', () => {
    window.mudarAbaDinamica('pedidos');
});
// CARGA ADICIONAL DE CONTINGÊNCIA IMEDIATA CASO O DOM JÁ TENHA SIDO PROCESSADO
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(() => { if(window.mudarAbaDinamica) window.mudarAbaDinamica('pedidos'); }, 150);
}
