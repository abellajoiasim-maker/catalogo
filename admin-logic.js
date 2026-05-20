// =========================================================================
// CONFIGURAÇÃO OFICIAL DO FIREBASE (MÁSCARA CONTROLADORA DA INFRAESTRUTURA)
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

const cacheModulos = {};
let listenersAtivos = {};

// Cache global de segurança e memória de estado do ecossistema
window.todosPedidosLocal = {};
window.pedidoEditando = null;

// Utilitário de Formatação de Uso Geral no Ecossistema BR
window.fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// =========================================================================
// INTERRUPÇÃO ASSÍNCRONA E INJEÇÃO DE ESCOPO ISOLADO
// =========================================================================
async function mudarAbaDinamica(nomeAba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // Ajuste Visual da Sidebar
    document.querySelectorAll('#menu-navegacao .tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    const btnAtivo = document.getElementById(`btn-${nomeAba}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // Mata conexões específicas anteriores do Firebase para evitar concorrência de renderização
    if (listenersAtivos['orders']) {
        db.ref('orders').off();
        delete listenersAtivos['orders'];
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 font-mono text-xs animate-pulse">Injetando componente ${nomeAba}.html...</div>`;

    try {
        if (!cacheModulos[nomeAba]) {
            const resposta = await fetch(`${nomeAba}.html`);
            if (!resposta.ok) throw new Error(`Arquivo ${nomeAba}.html não mapeado.`);
            cacheModulos[nomeAba] = await resposta.text();
        }

        container.innerHTML = cacheModulos[nomeAba];

        // Força o Navegador a executar códigos Javascript dentro da página injetada
        const scripts = container.querySelectorAll("script");
        scripts.forEach(scriptAntigo => {
            const scriptNovo = document.createElement("script");
            if (scriptAntigo.src) {
                scriptNovo.src = scriptAntigo.src;
            } else {
                scriptNovo.textContent = scriptAntigo.textContent;
            }
            document.body.appendChild(scriptNovo).parentNode.removeChild(scriptNovo);
        });

        // Se a aba injetada for a de pedidos, ativa o sincronizador central imediatamente
        if (nomeAba === 'pedidos') {
            window.forcarCargaFirebase();
        }

    } catch (erro) {
        container.innerHTML = `
            <div class="bg-red-950/20 border border-red-900 text-red-400 p-4 rounded-xl text-xs font-mono">
                <p class="font-bold">⚠️ Falha ao renderizar componente: ${nomeAba}.html</p>
                <p class="text-zinc-500 mt-1">${erro.message}</p>
            </div>
        `;
    }
}

// =========================================================================
// SINCRONIZADOR CENTRAL RESTRITO DO FIREBASE (DRIVE DE DADOS)
// =========================================================================
window.forcarCargaFirebase = function() {
    listenersAtivos['orders'] = true;
    
    db.ref('orders').on('value', snapshot => {
        window.todosPedidosLocal = snapshot.val() || {};
        
        // Se a função de renderização visual da tabela existir no escopo atual, executa ela
        if (typeof window.renderizarTabelaPedidosVisivel === 'function') {
            window.renderizarTabelaPedidosVisivel();
        }
    }, erro => {
        console.error("🚨 Falha crítica de leitura no Firebase Realtime Database:", erro);
    });
};

// =========================================================================
// MÓDULO CONTROLADOR COESIVO - GERENCIAMENTO AVANÇADO DE PEDIDOS
// =========================================================================
window.abrirEditorPedido = function(id) {
    window.pedidoEditando = id;
    const p = window.todosPedidosLocal[id];
    if (!p) return;

    // Vinculação protegida contra elementos ausentes
    const elId = document.getElementById('idPedidoInterno');
    if (elId) elId.innerText = id;

    const elNome = document.getElementById('edClienteNome');
    if (elNome) elNome.value = p.nome || p.cliente || '';

    const elTel = document.getElementById('edClienteTel');
    if (elTel) elTel.value = p.whats || p.telefone || '';

    const elRua = document.getElementById('edRua');
    if (elRua) elRua.value = p.rua || '';

    const elCidade = document.getElementById('edCidade');
    if (elCidade) elCidade.value = p.cidade || '';

    const elDescPromo = document.getElementById('edDescPromo');
    if (elDescPromo) elDescPromo.value = p.descontoPromo || p.desconto || 0;

    const elDescPix = document.getElementById('edDescPix');
    if (elDescPix) elDescPix.value = p.descontoPix || 0;

    const elFrete = document.getElementById('edFrete');
    if (elFrete) elFrete.value = p.frete || 0;

    // ORDENAÇÃO DE A-Z POR SKU: Carga dos itens no Editor Master
    if (p.itens && Array.isArray(p.itens)) {
        p.itens = p.itens.filter(i => i !== null);
        p.itens.sort((a, b) => {
            const skuA = (a.sku || '').toString().toUpperCase().trim();
            const skuB = (b.sku || '').toString().toUpperCase().trim();
            return skuA.localeCompare(skuB, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
    }

    const boxItens = document.getElementById('edItens');
    if (boxItens) {
        boxItens.innerHTML = '';
        if (p.itens && Array.isArray(p.itens)) {
            p.itens.forEach((item, index) => {
                const itemQtd = item.quantidade || item.qtd || 1;
                const itemPreco = item.precoFinal || item.price || item.preco || 0;
                const itemPeso = item.peso || item.weight || '0g';
                const itemSku = item.sku || 'N/A';
                const itemNome = item.name || item.nome || 'Sem Descrição';

                boxItens.innerHTML += `
                    <div class="flex items-center gap-2 bg-black/40 p-2 border border-zinc-800 rounded-lg font-mono text-[11px]">
                        <div class="w-16 font-bold text-zinc-400 truncate">${itemSku}</div>
                        <div class="flex-1 text-white truncate uppercase">${itemNome}</div>
                        <div class="w-16 text-zinc-400 text-center">${itemPeso}</div>
                        <div class="w-20">
                            <input type="number" step="0.01" value="${itemPreco}" class="w-full bg-[#0b0b0b] border border-zinc-700 text-right p-1 rounded text-white text-[11px] focus:border-[#caa85c] outline-none" oninput="window.atualizarObjetoItem(${index}, 'preco', this.value)">
                        </div>
                        <div class="w-14">
                            <input type="number" value="${itemQtd}" class="w-full bg-[#0b0b0b] border border-zinc-700 text-center p-1 rounded text-white text-[11px] font-bold focus:border-[#caa85c] outline-none" oninput="window.atualizarObjetoItem(${index}, 'qtd', this.value)">
                        </div>
                        <button onclick="window.removerItemEditor(${index})" class="text-red-400 hover:text-red-300 font-bold px-2">✕</button>
                    </div>
                `;
            });
        }
    }

    window.recalcularTotalEd();

    const modalEditor = document.getElementById('editorPedido');
    if (modalEditor) modalEditor.classList.remove('hidden');
};

window.atualizarObjetoItem = function(index, campo, valor) {
    const p = window.todosPedidosLocal[window.pedidoEditando];
    if (!p || !p.itens || !p.itens[index]) return;

    if (campo === 'preco') p.itens[index].precoFinal = parseFloat(valor) || 0;
    if (campo === 'qtd') p.itens[index].quantidade = parseInt(valor) || 0;
    window.recalcularTotalEd();
};

window.removerItemEditor = function(index) {
    const p = window.todosPedidosLocal[window.pedidoEditando];
    if (!p || !p.itens) return;
    
    if (confirm("Deseja remover este item da lista de compras do pedido?")) {
        p.itens.splice(index, 1);
        window.abrirEditorPedido(window.pedidoEditando);
    }
};

window.recalcularTotalEd = function() {
    const p = window.todosPedidosLocal[window.pedidoEditando];
    if (!p) return;

    if (p.itens && Array.isArray(p.itens)) {
        p.itens.sort((a, b) => {
            const skuA = (a.sku || '').toString().toUpperCase().trim();
            const skuB = (b.sku || '').toString().toUpperCase().trim();
            return skuA.localeCompare(skuB, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
    }

    let subtotal = 0, totalQtd = 0;
    if (p.itens && Array.isArray(p.itens)) {
        p.itens.forEach(i => {
            const qtd = parseInt(i.quantidade || i.qtd || 0);
            const preco = parseFloat(i.precoFinal || i.price || i.preco || 0);
            subtotal += (preco * qtd);
            totalQtd += qtd;
        });
    }

    const elDescPromo = document.getElementById('edDescPromo');
    const elDescPix = document.getElementById('edDescPix');
    const elFrete = document.getElementById('edFrete');

    const descPromo = elDescPromo ? (parseFloat(elDescPromo.value) || 0) : 0;
    const descPix = elDescPix ? (parseFloat(elDescPix.value) || 0) : 0;
    const frete = elFrete ? (parseFloat(elFrete.value) || 0) : 0;

    const liquidoGeral = subtotal - descPromo - descPix + frete;

    const elTotalPreview = document.getElementById('totalPreview');
    if (elTotalPreview) elTotalPreview.innerText = window.fMoeda(liquidoGeral);

    const elQtdTotal = document.getElementById('edQtdTotal');
    if (elQtdTotal) elQtdTotal.value = totalQtd;
};

window.salvarPedidoEditado = function() {
    const id = window.pedidoEditando;
    const p = window.todosPedidosLocal[id];
    if (!p) return;

    p.nome = document.getElementById('edClienteNome')?.value.trim() || p.nome;
    p.whats = document.getElementById('edClienteTel')?.value.trim() || p.whats;
    p.rua = document.getElementById('edRua')?.value.trim() || p.rua;
    p.cidade = document.getElementById('edCidade')?.value.trim() || p.cidade;
    p.descontoPromo = parseFloat(document.getElementById('edDescPromo')?.value) || 0;
    p.descontoPix = parseFloat(document.getElementById('edDescPix')?.value) || 0;
    p.frete = parseFloat(document.getElementById('edFrete')?.value) || 0;

    let subtotal = 0;
    if (p.itens && Array.isArray(p.itens)) {
        p.itens.sort((a, b) => {
            return (a.sku || '').toString().toUpperCase().trim().localeCompare((b.sku || '').toString().toUpperCase().trim(), 'pt-BR', {numeric: true});
        });
        p.itens.forEach(i => {
            subtotal += (parseFloat(i.precoFinal || i.price || i.preco || 0) * parseInt(i.quantidade || i.qtd || 0));
        });
    }
    p.total = subtotal - p.descontoPromo - p.descontoPix + p.frete;

    db.ref('orders/' + id).set(p).then(() => {
        alert("✅ Pedido gravado e sincronizado!");
        window.fecharEditorPedido();
    }).catch(err => {
        alert("🚨 Erro ao salvar: " + err.message);
    });
};

window.excluirPedido = function() {
    if (confirm("🚨 Deletar permanentemente este pedido?")) {
        db.ref('orders/' + window.pedidoEditando).remove().then(() => {
            alert("Pedido excluído!");
            window.fecharEditorPedido();
        });
    }
};

window.fecharEditorPedido = function() {
    const modalEditor = document.getElementById('editorPedido');
    if (modalEditor) modalEditor.classList.add('hidden');
    window.pedidoEditando = null;
};

window.fecharPreviewRomaneio = function() {
    const modalPreview = document.getElementById('previewRomaneio');
    if (modalPreview) modalPreview.classList.add('hidden');
};

window.confirmarImpressaoFisica = function() {
    window.print();
};

// Start
document.addEventListener("DOMContentLoaded", () => {
    mudarAbaDinamica('pedidos');
});
