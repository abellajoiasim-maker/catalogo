// =========================================================================
// CONFIGURAÇÃO OFICIAL DO FIREBASE (COMPARTILHADA POR TODOS OS MÓDULOS)
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Utilitários de Formatação de Uso Geral no Ecossistema BR
const fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// Memória de Cache para evitar requisições repetidas ao carregar os HTMLs
const cacheModulos = {};
let listenersAtivos = {}; // Desconecta listeners antigos do Firebase ao trocar de aba para poupar memória

// =========================================================================
// MOTOR DE CARREGAMENTO DINÂMICO DE COMPONENTES DE INTERFACE (MÓDULOS)
// =========================================================================
async function mudarAbaDinamica(nomeAba) {
    const container = document.getElementById('conteudo-dinamico');
    
    // 1. Atualização visual da Sidebar (Botão Ativo)
    document.querySelectorAll('#menu-navegacao .tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    const btnAtivo = document.getElementById(`btn-${nomeAba}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // 2. Destruição segura de Listeners ativos do Firebase (Evita duplicidade de execução)
    if (listenersAtivos['orders']) {
        db.ref('orders').off('value');
        delete listenersAtivos['orders'];
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 font-mono text-xs animate-pulse">Injetando componente ${nomeAba}.html...</div>`;

    try {
        // 3. Busca o HTML correspondente de forma assíncrona (do disco ou cache)
        if (!cacheModulos[nomeAba]) {
            const resposta = await fetch(`${nomeAba}.html`);
            if (!resposta.ok) throw new Error(`Arquivo ${nomeAba}.html não localizado na raiz.`);
            cacheModulos[nomeAba] = await resposta.text();
        }

        // 4. Injeta o HTML puro isolado dentro da casca administrativa
        container.innerHTML = cacheModulos[nomeAba];

        // 5. Inicializa os gatilhos lógicos específicos de cada aba carregada
        if (nomeAba === 'pedidos') {
            inicializarModuloPedidos();
        } else if (nomeAba === 'ofertas' && typeof inicializarModuloOfertas === 'function') {
            inicializarModuloOfertas();
        } else if (nomeAba === 'galvanicas' && typeof inicializarModuloGalvanicas === 'function') {
            inicializarModuloGalvanicas();
        } else if (nomeAba === 'produtos' && typeof inicializarModuloProdutos === 'function') {
            inicializarModuloProdutos();
        }

    } catch (erro) {
        container.innerHTML = `
            <div class="bg-red-950/20 border border-red-900 text-red-400 p-4 rounded-xl text-xs space-y-2">
                <p class="font-bold">⚠️ Falha Crítica de Carregamento Modular</p>
                <p class="font-mono">${erro.message}</p>
                <p class="text-[11px] text-gray-500">Certifique-se de criar o arquivo <span class="text-white font-bold">${nomeAba}.html</span> na mesma pasta do repositório no GitHub.</p>
            </div>
        `;
    }
}

// =========================================================================
// ENGINE DE CONTROLE OPERACIONAL EXCLUSIVA DO MÓDULO DE PEDIDOS
// =========================================================================
let todosPedidos = {};
var pedidoEditando = null;

function inicializarModuloPedidos() {
    listenersAtivos['orders'] = true;

    db.ref('orders').on('value', snap => {
        const container = document.getElementById('lista-pedidos');
        const badgeCount = document.getElementById('qtd-pedidos');
        
        if (!container) return; // Proteção caso o usuário mude de aba antes do retorno assíncrono

        if (!snap.exists()) {
            container.innerHTML = '<p class="text-xs text-gray-500 italic col-span-full">Nenhum pedido ativo recebido...</p>';
            if (badgeCount) badgeCount.innerText = "0 pedidos";
            todosPedidos = {};
            return;
        }

        todosPedidos = snap.val();
        let count = 0;
        let stackHtml = [];

        Object.keys(todosPedidos).forEach(id => {
            const p = todosPedidos[id];
            count++;

            const nomeCliente = (p.nome || p.cliente || 'Cliente Oculto').toUpperCase();
            const whatsappCliente = p.whats || p.telefone || 'Não informado';
            
            let enderecoCliente = 'Retirada / Não informado';
            if (p.rua) {
                enderecoCliente = `${p.rua}${p.numero ? ', ' + p.numero : ''}${p.cidade ? ' - ' + p.cidade : ''}`;
            } else if (p.endereco) {
                enderecoCliente = p.endereco;
            }

            const rawTotal = p.total;
            const totalExibivel = typeof rawTotal === 'number' ? fMoeda(rawTotal) : (rawTotal || 'R$ 0,00');
            const dataPedido = p.data ? new Date(p.data).toLocaleString('pt-BR') : (p.criadoEm ? new Date(p.criadoEm).toLocaleString('pt-BR') : 'Data Indefinida');

            let totalPecas = 0;
            if (Array.isArray(p.itens)) {
                p.itens.forEach(i => totalPecas += (parseInt(i.quantidade || i.qtd) || 1));
            }

            const numeroPedido = id.substring(1, 10).toUpperCase();

            stackHtml.push(`
                <div class="card p-4 flex flex-col justify-between border border-zinc-800 bg-[#121212] rounded-xl hover:border-zinc-700 transition-all text-xs space-y-3">
                    <div class="space-y-1">
                        <div class="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                            <span class="font-bold text-white">Pedido #${numeroPedido}</span>
                            <span>${dataPedido}</span>
                        </div>
                        <div class="font-bold text-gray-200 uppercase tracking-wide truncate">${nomeCliente}</div>
                        <div class="text-zinc-400 flex items-center gap-1">
                            <span>📱 WhatsApp:</span>
                            <a href="https://wa.me/${whatsappCliente.replace(/\D/g,'')}" target="_blank" class="font-mono text-blue-400 underline">${whatsappCliente}</a>
                        </div>
                        <div class="text-zinc-400 flex items-center gap-1 font-mono text-[11px]">
                            <span>📦 Volume total:</span>
                            <span class="text-[#caa85c] font-bold">${totalPecas} pçs</span>
                        </div>
                        <div class="text-zinc-400 truncate">
                            <span>📍 Endereço:</span>
                            <span class="italic text-zinc-500">${enderecoCliente}</span>
                        </div>
                        <div class="pt-1.5 flex justify-between items-center border-t border-zinc-900 mt-1">
                            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Líquido</span>
                            <span class="text-sm font-black text-[#caa85c] font-mono">${totalExibivel}</span>
                        </div>
                    </div>
                    <div class="bg-black/40 p-2 rounded-lg border border-zinc-900 space-y-1.5">
                        <div class="flex gap-1.5">
                            <select id="select-romaneio-${id}" class="bg-zinc-900 border border-zinc-800 text-[11px] text-white p-1 rounded flex-1 outline-none">
                                <option value="1">1. Conferência de Separação</option>
                                <option value="2">2. Financeiro e Faturamento</option>
                                <option value="3">3. Vitrine (Fotográfica)</option>
                                <option value="4">4. Grade Comparativa</option>
                                <option value="5">5. Grade Financeira Expandida</option>
                                <option value="6">6. Grade Consolidada Total</option>
                            </select>
                            <button onclick="const tipo = document.getElementById('select-romaneio-${id}').value; pedidoEditando='${id}'; imprimirRomaneioDinamico(parseInt(tipo));" class="bg-[#caa85c] text-black font-bold text-[10px] px-2.5 py-1 rounded hover:brightness-110 uppercase tracking-wider">Imprimir</button>
                        </div>
                    </div>
                    <div class="flex gap-2 pt-2 border-t border-zinc-900">
                        <button onclick="abrirEditorPedidoDinamico('${id}')" class="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-1 px-2 rounded transition-all text-center">⚙️ Gerenciar</button>
                        <button onclick="pedidoEditando='${id}'; dectruirPedidoDinamico();" class="bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/30 font-medium py-1 px-2 rounded transition-all">🗑️ Excluir</button>
                    </div>
                </div>
            `);
        });

        container.innerHTML = stackHtml.reverse().join('');
        if (badgeCount) badgeCount.innerText = `${count} ${count === 1 ? 'pedido' : 'pedidos'}`;
    });
}

function abrirEditorPedidoDinamico(id) {
    pedidoEditando = id;
    const p = todosPedidos[id];
    if (!p) return;

    document.getElementById('edClienteNome').value = p.nome || p.cliente || '';
    document.getElementById('edClienteTel').value = p.whats || p.telefone || '';
    document.getElementById('edRua').value = p.rua || p.endereco || '';
    document.getElementById('edCidade').value = p.cidade || '';
    document.getElementById('edDescPromo').value = p.descontoPromo || p.desconto || 0;
    document.getElementById('edDescPix').value = p.descontoPix || 0;
    document.getElementById('edFrete').value = p.frete || 0;

    renderizarItensEditorDinamico(p.itens || []);
    recalcularTotalEdDinamico();
    document.getElementById('editorPedido').classList.remove('hidden');
}

function fecharEditorPedidoDinamico() {
    document.getElementById('editorPedido').classList.add('hidden');
    pedidoEditando = null;
}

function renderizarItensEditorDinamico(itens) {
    const container = document.getElementById('edItens');
    if (!container) return;
    container.innerHTML = '';

    itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "flex flex-col md:flex-row gap-2 bg-black/40 p-3 rounded-lg border border-zinc-900 text-xs";
        div.innerHTML = `
            <div class="flex-1">
                <input type="text" value="${item.nome || item.name || ''}" onchange="atualizarItemPropDinamico(${index}, 'nome', this.value)" class="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white">
            </div>
            <div class="w-24">
                <input type="text" value="${item.sku || ''}" readonly class="w-full bg-zinc-900/50 border border-zinc-800 p-1.5 rounded text-gray-400 cursor-not-allowed text-center">
            </div>
            <div class="w-20">
                <input type="number" value="${item.quantidade || item.qtd || 1}" oninput="atualizarItemPropDinamico(${index}, 'quantidade', parseInt(this.value) || 1)" class="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-center text-white">
            </div>
            <div class="w-28">
                <input type="number" step="0.01" value="${item.preco || item.price || 0}" oninput="atualizarItemPropDinamico(${index}, 'preco', parseFloat(this.value) || 0)" class="w-full bg-zinc-950 border border-zinc-800 p-1.5 rounded text-white font-mono">
            </div>
            <button onclick="removerItemEditorDinamico(${index})" class="bg-red-950 text-red-400 px-2.5 py-1.5 rounded border border-red-900/40 hover:bg-red-900">✕</button>
        `;
        container.appendChild(div);
    });
}

function atualizarItemPropDinamico(index, prop, valor) {
    if (!pedidoEditando || !todosPedidos[pedidoEditando].itens) return;
    todosPedidos[pedidoEditando].itens[index][prop] = valor;
    if (prop === 'quantidade' || prop === 'preco') recalcularTotalEdDinamico();
}

function removerItemEditorDinamico(index) {
    todosPedidos[pedidoEditando].itens.splice(index, 1);
    renderizarItensEditorDinamico(todosPedidos[pedidoEditando].itens);
    recalcularTotalEdDinamico();
}

function addItemEditorDinamico() {
    const sku = prompt("Digite o SKU exato do produto:");
    if (!sku) return;

    db.ref('products/' + sku.toUpperCase().trim()).once('value', snap => {
        let produto = { sku: sku.toUpperCase(), nome: "Item Sob Medida", preco: 0, quantidade: 1 };
        if (snap.exists()) {
            const d = snap.val();
            produto.nome = d.name || d.nome;
            produto.preco = parseFloat(d.price || d.precoFinal || 0);
        }
        if (!todosPedidos[pedidoEditando].itens) todosPedidos[pedidoEditando].itens = [];
        todosPedidos[pedidoEditando].itens.push(produto);
        renderizarItensEditorDinamico(todosPedidos[pedidoEditando].itens);
        recalcularTotalEdDinamico();
    });
}

function recalcularTotalEdDinamico() {
    const p = todosPedidos[pedidoEditando];
    if (!p) return;

    let subtotal = 0, qtdTotal = 0;
    if (Array.isArray(p.itens)) {
        p.itens.forEach(i => {
            const q = parseInt(i.quantidade || i.qtd || 1);
            subtotal += (q * parseFloat(i.preco || i.price || 0));
            qtdTotal += q;
        });
    }

    const descPromo = parseFloat(document.getElementById('edDescPromo').value) || 0;
    const descPix = parseFloat(document.getElementById('edDescPix').value) || 0;
    const frete = parseFloat(document.getElementById('edFrete').value) || 0;
    const totalLiquido = Math.max(0, (subtotal - descPromo - descPix) + frete);

    document.getElementById('totalPreview').innerText = fMoeda(totalLiquido);
    document.getElementById('edQtdTotal').value = qtdTotal;

    p.total = totalLiquido;
    p.subtotal = subtotal;
    p.descontoPromo = descPromo;
    p.descontoPix = descPix;
    p.frete = frete;
}

function salvarPedidoEditadoDinamico() {
    const p = todosPedidos[pedidoEditando];
    p.nome = document.getElementById('edClienteNome').value.trim();
    p.whats = document.getElementById('edClienteTel').value.trim();
    p.rua = document.getElementById('edRua').value.trim();
    p.cidade = document.getElementById('edCidade').value.trim();

    db.ref('orders/' + pedidoEditando).set(p).then(() => {
        alert("✅ Modificações salvas com absoluto sucesso!");
        fecharEditorPedidoDinamico();
    });
}

function dectruirPedidoDinamico() {
    if (confirm("Deletar permanentemente do Firebase?")) {
        db.ref('orders/' + pedidoEditando).remove();
    }
}

function imprimirRomaneioDinamico(tipo) {
    const p = todosPedidos[pedidoEditando];
    const printArea = document.getElementById('print-area');
    const numPedidoFriendly = pedidoEditando.substring(1, 10).toUpperCase();

    let trs = '';
    if (Array.isArray(p.itens)) {
        p.itens.forEach(i => {
            trs += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding:6px;">${i.sku}</td>
                    <td style="padding:6px;">${i.nome}</td>
                    <td style="padding:6px; text-align:center;">${i.quantidade || i.qtd} pçs</td>
                    <td style="padding:6px; text-align:right;">${tipo !== 1 ? fMoeda(i.preco) : ''}</td>
                </tr>
            `;
        });
    }

    printArea.innerHTML = `
        <div style="font-family:monospace; color:#000; padding:20px; font-size:12px;">
            <h2 style="text-align:center;">ABELLA JOIAS — MODULO ROMANEIO [${tipo}]</h2>
            <p><b>Pedido:</b> #${numPedidoFriendly} | <b>Cliente:</b> ${p.nome || p.cliente}</p>
            <table style="width:100%; border-collapse:collapse; margin-top:15px;">
                <thead style="background:#f4f4f4;">
                    <tr><th>SKU</th><th>Descrição</th><th>Qtd</th><th>${tipo !== 1 ? 'Preço' : ''}</th></tr>
                </thead>
                <tbody>${trs}</tbody>
            </table>
            ${tipo !== 1 ? `<p style="text-align:right; font-weight:bold; margin-top:15px;">Total Faturado: ${fMoeda(p.total)}</p>` : ''}
        </div>
    `;
    window.print();
}

// Inicialização Automática da Primeira Aba de Trabalho ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
    mudarAbaDinamica('pedidos');
});
