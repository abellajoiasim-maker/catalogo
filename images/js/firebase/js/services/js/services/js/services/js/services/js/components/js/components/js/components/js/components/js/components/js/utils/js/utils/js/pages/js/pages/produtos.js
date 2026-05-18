import { db } from '../utils/firebase-medusa.js';
import { formatCurrency } from '../utils/helpers.js';
import { addToCart, updateCartHeaderSummary } from '../components/cart.js';

let produtoTemp = null;
let settings = { pixDesconto: 5, parcelas: 6 };

export function initProdutos() {
    const params = new URLSearchParams(window.location.search);
    const categoriaId = params.get('id');
    const gridProdutos = document.getElementById('gridProdutos');

    if (!categoriaId) {
        if (gridProdutos) gridProdutos.innerHTML = '<p class="text-center col-span-full">Coleção não informada.</p>';
        return;
    }

    // Sincroniza regras de parcelamento e desconto dinâmico
    db.ref('settings').on('value', snap => {
        const s = snap.val() || {};
        settings.pixDesconto = s.pixDesconto || 5;
        settings.parcelas = s.parcelas || 6;
    });

    // Carrega produtos da categoria selecionada
    db.ref('products').orderByChild('category').equalTo(categoriaId).on('value', snap => {
        if (!gridProdutos) return;
        gridProdutos.innerHTML = '';

        if (!snap.exists()) {
            gridProdutos.innerHTML = '<p class="text-center col-span-full text-gray-500">Nenhum produto cadastrado nesta coleção.</p>';
            return;
        }

        snap.forEach(child => {
            const p = child.val() || {};
            if (p.paused) return;
            const id = child.key;

            const precoBase = parseFloat(p.precoFinal ?? p.price ?? 0);
            const precoFinal = p.promoPrice > 0 ? parseFloat(p.promoPrice) : precoBase;
            const peso = parseFloat(p.peso ?? p.weight ?? 0);
            const pesoFormatado = peso > 0 ? peso.toFixed(2) + 'g' : '--';

            gridProdutos.innerHTML += `
                <div class="card-produto bg-[#111] rounded-2xl overflow-hidden flex flex-col shadow-lg">
                    <div class="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        ${p.promoPrice ? `<span class="bg-red-600 text-white text-[9px] px-2 py-1 rounded font-bold">PROMO</span>` : ''}
                        ${p.destaque ? `<span class="bg-[#caa85c] text-black text-[9px] px-2 py-1 rounded font-bold">DESTAQUE</span>` : ''}
                    </div>
                    <img src="${p.image || ''}" class="w-full aspect-square object-contain bg-[#111] p-2" loading="lazy">
                    <div class="p-4 flex flex-col flex-grow">
                        <div class="flex justify-between text-[10px] text-gray-500 font-bold mb-1">
                            <span>${p.sku || ''}</span>
                            <span>${pesoFormatado}</span>
                        </div>
                        <h3 class="text-white text-sm font-semibold mb-2">${p.name || ''}</h3>
                        <div class="mb-2">
                            ${p.promoPrice ? `
                                <p class="text-gray-500 line-through text-[11px]">${formatCurrency(precoBase)}</p>
                                <p class="text-red-500 text-lg font-black">${formatCurrency(precoFinal)}</p>
                            ` : `
                                <p class="text-[#caa85c] text-lg font-black">${formatCurrency(precoBase)}</p>
                            `}
                        </div>
                        <p class="text-green-400 text-[11px] font-bold">
                            ${formatCurrency(precoFinal * (1 - (settings.pixDesconto / 100)))} no PIX
                        </p>
                        <p class="text-gray-400 text-[10px] mb-2">
                            ou ${settings.parcelas}x de ${formatCurrency(precoFinal / settings.parcelas)}
                        </p>
                        <button class="w-full mt-auto bg-white text-black text-[11px] font-extrabold py-3 rounded-xl hover:bg-[#caa85c]"
                            id="btn-prod-${id}">
                            ${p.variacaoTipo ? 'Escolher Opções' : 'Adicionar'}
                        </button>
                    </div>
                </div>
            `;

            // Atribuição de evento isolado via delegação/ID seguro contra injeção de escopo global
            setTimeout(() => {
                const btn = document.getElementById(`btn-prod-${id}`);
                if (btn) {
                    btn.onclick = () => abrirCheckVariacao(id, p.name || '', precoFinal, p.variacaoTipo || '', p.opcoesPersonalizadas || '');
                };
            }, 50);
        });
    });

    window.fecharModalVariacao = () => {
        document.getElementById('modalVariacao')?.classList.add('hidden');
        produtoTemp = null;
    };

    window.confirmarVariacoesModal = () => {
        const inputs = document.querySelectorAll('.input-qtd');
        let total = 0;
        let resumo = [];

        inputs.forEach(i => {
            const qtd = parseInt(i.value);
            if (qtd > 0) {
                total += qtd;
                resumo.push(`${qtd}x ${i.dataset.item}`);
            }
        });

        if (total === 0) {
            alert("Por favor, selecione a quantidade de pelo menos um item.");
            return;
        }

        addToCart(produtoTemp.id, produtoTemp.nome, produtoTemp.preco, total, resumo.join(", "));
        window.fecharModalVariacao();
    };
}

function abrirCheckVariacao(id, nome, preco, tipo, opcoes) {
    produtoTemp = { id, nome, preco };
    if (tipo === "Lista" && opcoes) {
        const lista = opcoes.split(',').map(v => v.trim()).filter(v => v);
        montarModal(lista, nome);
        return;
    }
    if (tipo === "Aro") {
        montarModal(["12", "14", "16", "18", "20", "22"], "Escolha o tamanho do Aro");
        return;
    }
    // Adição Direta sem variação
    addToCart(id, nome, preco, 1, "");
}

function montarModal(lista, titulo) {
    const modalTitle = document.getElementById('modalTitle');
    const container = document.getElementById('listaVariacoes');
    
    if (modalTitle) modalTitle.innerText = titulo;
    if (container) {
        container.innerHTML = '';
        lista.forEach(item => {
            container.innerHTML += `
                <div class="flex justify-between items-center bg-[#222] p-2 rounded">
                    <span class="text-xs">${item}</span>
                    <input type="number" min="0" value="0" data-item="${item}" class="input-qtd w-12 text-center bg-black text-white text-sm font-bold p-1 rounded border border-gray-800">
                </div>`;
        });
    }
    document.getElementById('modalVariacao')?.classList.remove('hidden');
}