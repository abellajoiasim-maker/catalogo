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
const storage = firebase.storage(); // Inicializado para permitir conversão de imagens

const cacheModulos = {};
let listenersAtivos = {};

// Cache local de segurança para manipulação dinâmica de pedidos inter-abas
window.todosPedidosLocal = window.todosPedidosLocal || {};
window.pedidoEditando = window.pedidoEditando || null;

// Utilitário de Formatação de Uso Geral no Ecossistema BR
window.fMoeda = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

// =========================================================================
// AJUSTE FINAL: CONVERSOR DE IMAGENS (GS:// -> HTTPS://)
// =========================================================================
async function obterLinkPublico(caminhoGS) {
    if (!caminhoGS || typeof caminhoGS !== 'string' || caminhoGS.startsWith('http')) return caminhoGS;
    if (caminhoGS.startsWith('gs://')) {
        try {
            return await storage.refFromURL(caminhoGS).getDownloadURL();
        } catch (error) {
            console.error("Erro ao converter link GS:", error);
            return null;
        }
    }
    return caminhoGS;
}

// =========================================================================
// INTERRUPÇÃO ASSÍNCRONA E INJEÇÃO DE ESCOPO ISOLADO (RESOLUÇÃO DE CACHE)
// =========================================================================
async function mudarAbaDinamica(nomeAba) {
    const container = document.getElementById('conteudo-dinamico');
    if (!container) return;

    // Normaliza o nome para evitar problemas se o HTML passar 'configuracoes' ou 'config'
    let nomeArquivo = nomeAba;
    if (nomeAba === 'configuracoes' || nomeAba === 'config') {
        nomeArquivo = 'config';
    }
    if (nomeAba === 'pedidos') {
        nomeArquivo = 'pedidos';
    }

    // Ajuste Visual da Sidebar
    document.querySelectorAll('#menu-navegacao .tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#caa85c]', 'text-black');
        btn.classList.add('bg-zinc-900', 'text-gray-400');
    });
    
    // Tenta iluminar o botão correto na sidebar (trata as duas IDs possíveis)
    const btnAtivo = document.getElementById(`btn-${nomeAba}`) || document.getElementById(`btn-${nomeArquivo}`);
    if (btnAtivo) {
        btnAtivo.classList.remove('bg-zinc-900', 'text-gray-400');
        btnAtivo.classList.add('bg-[#caa85c]', 'text-black');
    }

    // Mata conexões globais anteriores do Firebase para evitar concorrência ou lentidão
    if (listenersAtivos['orders']) {
        db.ref('orders').off();
        delete listenersAtivos['orders'];
    }

    container.innerHTML = `<div class="flex items-center justify-center h-full text-zinc-500 font-mono text-xs animate-pulse">Injetando componente ../modulo/${nomeArquivo}.html...</div>`;

    try {
        if (!cacheModulos[nomeArquivo]) {
            // Requisição apontando estritamente para o arquivo físico real
            const resposta = await fetch(`../modulo/${nomeArquivo}.html`);
            
            if (!resposta.ok) {
                throw new Error(`O arquivo "${nomeArquivo}.html" não foi encontrado dentro da pasta "modulo".`);
            }
            
            cacheModulos[nomeArquivo] = await resposta.text();
        }

        container.innerHTML = cacheModulos[nomeArquivo];

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

    } catch (erro) {
        container.innerHTML = `
            <div class="bg-red-950/20 border border-red-900 text-red-400 p-4 rounded-xl text-xs font-mono">
                <p class="font-bold">⚠️ Falha ao renderizar componente: ${nomeAba}.html</p>
                <p class="text-zinc-500 mt-1">${erro.message}</p>
                <p class="text-[10px] text-zinc-400 mt-2 font-bold bg-black/50 p-2 rounded">Alvo real do sistema: catalogo/modulo/${nomeArquivo}.html</p>
            </div>
        `;
    }
}
// MÓDULO CONTROLADOR COESIVO - GERENCIAMENTO AVANÇADO DE PEDIDOS (SEGURANÇA DE ELEMENTOS)
// =========================================================================
window.abrirEditorPedido = function(id) {
    window.pedidoEditando = id;
    const p = window.todosPedidosLocal[id];
    if (!p) {
        console.warn("🚨 Pedido não encontrado no mapeamento local do ecossistema.");
        return;
    }

    // Aplicação das diretrizes de segurança contra elementos nulos no DOM principal
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

    // AJUSTE SOLICITADO: Ordenação Alfabética por SKU (A-Z) na carga inicial dos itens do Editor
    if (p.itens && Array.isArray(p.itens)) {
        p.itens = p.itens.filter(i => i !== null);
        p.itens.sort((a, b) => {
            const skuA = (a.sku || '').toString().toUpperCase().trim();
            const skuB = (b.sku || '').toString().toUpperCase().trim();
            return skuA.localeCompare(skuB, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
    }

    // Renderização segura das linhas dos produtos no editor
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
                    <div class="flex items-center gap-2 bg-black/40 p-2 border border-zinc-800 rounded-lg font-mono text-[11px]" data-index="${index}">
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

    if (campo === 'preco') {
        p.itens[index].precoFinal = parseFloat(valor) || 0;
    } else if (campo === 'qtd') {
        p.itens[index].quantidade = parseInt(valor) || 0;
    }
    window.recalcularTotalEd();
};

window.removerItemEditor = function(index) {
    const p = window.todosPedidosLocal[window.pedidoEditando];
    if (!p || !p.itens) return;
    
    if (confirm("Deseja remover este item da lista de compras do pedido?")) {
        p.itens.splice(index, 1);
        window.abrirEditorPedido(window.pedidoEditando); // Recarrega e ordena dinamicamente
    }
};

window.recalcularTotalEd = function() {
    const p = window.todosPedidosLocal[window.pedidoEditando];
    if (!p) return;

    // AJUSTE SOLICITADO: Garante a ordenação por SKU (A-Z) sempre que houver mutação ou cálculo dos dados
    if (p.itens && Array.isArray(p.itens)) {
        p.itens.sort((a, b) => {
            const skuA = (a.sku || '').toString().toUpperCase().trim();
            const skuB = (b.sku || '').toString().toUpperCase().trim();
            return skuA.localeCompare(skuB, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
    }

    let subtotal = 0;
    let totalQtd = 0;

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

    const elNome = document.getElementById('edClienteNome');
    if (elNome) p.nome = elNome.value.trim();

    const elTel = document.getElementById('edClienteTel');
    if (elTel) p.whats = elTel.value.trim();

    const elRua = document.getElementById('edRua');
    if (elRua) p.rua = elRua.value.trim();

    const elCidade = document.getElementById('edCidade');
    if (elCidade) p.cidade = elCidade.value.trim();

    const elDescPromo = document.getElementById('edDescPromo');
    if (elDescPromo) p.descontoPromo = parseFloat(elDescPromo.value) || 0;

    const elDescPix = document.getElementById('edDescPix');
    if (elDescPix) p.descontoPix = parseFloat(elDescPix.value) || 0;

    const elFrete = document.getElementById('edFrete');
    if (elFrete) p.frete = parseFloat(elFrete.value) || 0;

    let subtotal = 0;
    if (p.itens && Array.isArray(p.itens)) {
        // Salva com a lista higienizada e ordenada de A-Z por SKU
        p.itens.sort((a, b) => {
            const skuA = (a.sku || '').toString().toUpperCase().trim();
            const skuB = (b.sku || '').toString().toUpperCase().trim();
            return skuA.localeCompare(skuB, 'pt-BR', { sensitivity: 'base', numeric: true });
        });
        p.itens.forEach(i => {
            subtotal += (parseFloat(i.precoFinal || i.price || i.preco || 0) * parseInt(i.quantidade || i.qtd || 0));
        });
    }
    p.total = subtotal - (p.descontoPromo || 0) - (p.descontoPix || 0) + (p.frete || 0);

    db.ref('orders/' + id).set(p).then(() => {
        alert("✅ Pedido atualizado e reordenado com sucesso!");
        window.fecharEditorPedido();
        if (typeof window.carregarPedidos === 'function') {
            window.carregarPedidos();
        }
    }).catch(err => {
        alert("🚨 Erro ao salvar alterações no Firebase: " + err.message);
    });
};

window.excluirPedido = function() {
    if (confirm("🚨 Deseja deletar definitivamente este pedido do Firebase? Esta ação não pode ser desfeita.")) {
        db.ref('orders/' + window.pedidoEditando).remove().then(() => {
            alert("Pedido excluído!");
            window.fecharEditorPedido();
            if (typeof window.carregarPedidos === 'function') {
                window.carregarPedidos();
            }
        });
    }
};

window.fecharEditorPedido = function() {
    const modalEditor = document.getElementById('editorPedido');
    if (modalEditor) modalEditor.classList.add('hidden');
    window.pedidoEditando = null;
};

// =========================================================================
// GESTÃO OPERACIONAL DE PRÉ-VISUALIZAÇÃO (PREVIEW INTERNO E EVENTOS FISICOS)
// =========================================================================
window.fecharPreviewRomaneio = function() {
    const modalPreview = document.getElementById('previewRomaneio');
    if (modalPreview) modalPreview.classList.add('hidden');
};

window.confirmarImpressaoFisica = function() {
    window.print();
};

// Inicializador Nativo do Ecossistema Operacional
document.addEventListener("DOMContentLoaded", () => {
    mudarAbaDinamica('pedidos');
});
