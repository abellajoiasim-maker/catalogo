import { Drawer } from './drawer.js';

// ─── Helpers de Tags (Dizeres / Iniciais) ────────────────────────────────────

function _criarTagRow(containerId, valor = '') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const safe = valor.replace(/"/g, '&quot;');
    const row = document.createElement('div');
    row.className = 'flex gap-2 mb-1 items-center tag-item-row';
    row.innerHTML = `
        <input type="text"
               class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-white tag-value-input"
               value="${safe}" placeholder="Ex: DEUS ou A">
        <button type="button"
                onclick="this.parentNode.remove()"
                class="shrink-0 bg-zinc-900 border border-zinc-800 text-red-400 px-3 py-2 rounded-xl hover:bg-red-950 text-xs font-bold transition-colors">✕</button>
    `;
    container.appendChild(row);
}

function _importarVariacoes(containerId) {
    const raw = prompt('Cole os valores separados por vírgula:\nEx: A, B, C   ou   DEUS, JESUS, AMOR');
    if (!raw) return;
    raw.split(',').map(v => v.trim()).filter(Boolean).forEach(v => _criarTagRow(containerId, v));
}

function _extrairTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('.tag-value-input'))
        .map(inp => inp.value.trim())
        .filter(Boolean);
}

function _popularTags(containerId, lista) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    (Array.isArray(lista) ? lista : []).forEach(v => _criarTagRow(containerId, v));
}

// ─── Bloco HTML reutilizável de variações ───────────────────────────────────

function _htmlVariacoes(prefixo) {
    const idDizeres  = `${prefixo}DizeresContainer`;
    const idIniciais = `${prefixo}IniciaisContainer`;
    return `
        <!-- Variações: Dizeres -->
        <div class="mb-1 border border-zinc-800 bg-zinc-900/20 p-3 rounded-xl">
            <div class="flex justify-between items-center mb-2">
                <label class="text-xs text-[#caa85c] font-bold uppercase tracking-wider">✍️ Variações de Dizeres</label>
                <div class="flex gap-1">
                    <button type="button"
                            onclick="_importarVariacoes('${idDizeres}')"
                            class="bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-[10px] hover:bg-zinc-700 font-bold transition-colors">
                        📋 Importar
                    </button>
                    <button type="button"
                            onclick="_criarTagRow('${idDizeres}')"
                            class="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded-lg text-[10px] hover:bg-zinc-800 font-bold transition-colors">
                        ➕ Add
                    </button>
                </div>
            </div>
            <div id="${idDizeres}" class="flex flex-col gap-1 min-h-[8px]"></div>
            <p class="text-[10px] text-zinc-600 mt-1">Use "Importar" para colar vários de uma vez (ex: DEUS, JESUS, AMOR)</p>
        </div>

        <!-- Variações: Iniciais -->
        <div class="border border-zinc-800 bg-zinc-900/20 p-3 rounded-xl">
            <div class="flex justify-between items-center mb-2">
                <label class="text-xs text-[#caa85c] font-bold uppercase tracking-wider">🔤 Variações de Iniciais</label>
                <div class="flex gap-1">
                    <button type="button"
                            onclick="_importarVariacoes('${idIniciais}')"
                            class="bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg text-[10px] hover:bg-zinc-700 font-bold transition-colors">
                        📋 Importar
                    </button>
                    <button type="button"
                            onclick="_criarTagRow('${idIniciais}')"
                            class="bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-1 rounded-lg text-[10px] hover:bg-zinc-800 font-bold transition-colors">
                        ➕ Add
                    </button>
                </div>
            </div>
            <div id="${idIniciais}" class="flex flex-col gap-1 min-h-[8px]"></div>
            <p class="text-[10px] text-zinc-600 mt-1">Use "Importar" para colar o alfabeto (ex: A, B, C, D, E...)</p>
        </div>
    `;
}

// ─── Expõe helpers no escopo global (usados pelo onclick do HTML gerado) ────
window._criarTagRow      = _criarTagRow;
window._importarVariacoes = _importarVariacoes;

// ─── Módulo Principal ────────────────────────────────────────────────────────

export const ProdutoModule = {
    dbRef: null,
    produtosEmMemoria: {},
    subcategoriasEmMemoria: {},
    categoriasEmMemoria: {},

    init(firebaseDb, categoriasCache = {}, subcategoriasCache = {}) {
        this.dbRef = firebaseDb.ref(
            typeof window.getAbellaPath === 'function'
                ? window.getAbellaPath('products')
                : 'abella/products'
        );
        this.categoriasEmMemoria   = categoriasCache   || {};
        this.subcategoriasEmMemoria = subcategoriasCache || {};

        this._configurarEventos();
        this.listarProdutos();
    },

    // Atualiza caches quando outros módulos carregam dados
    atualizarCaches(cats = {}, subs = {}) {
        this.categoriasEmMemoria    = cats;
        this.subcategoriasEmMemoria = subs;
    },

    _configurarEventos() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const acao = btn.getAttribute('data-action');
            const id   = btn.getAttribute('data-id');
            if (acao === 'editar')  ProdutoModule.abrirEditarProduto(id);
            if (acao === 'excluir') ProdutoModule.excluirProduto(id);
            if (acao === 'toggle')  ProdutoModule.togglePausado(id);
        });
    },

    listarProdutos() {
        if (!this.dbRef) return;
        this.dbRef.on('value', (snap) => {
            this.produtosEmMemoria = snap.val() || {};
            this.renderProdutos();
        });
    },

    renderProdutos() {
        const container = document.getElementById('lista-produtos-container');
        if (!container) return;

        const entradas = Object.entries(this.produtosEmMemoria);
        if (!entradas.length) {
            container.innerHTML = `<p class="text-center py-10 text-zinc-600 text-sm">Nenhum produto cadastrado.</p>`;
            return;
        }

        container.innerHTML = entradas.map(([id, p]) => {
            const pausado = p.paused === true;
            const temDizeres  = Array.isArray(p.dizeres)  && p.dizeres.length  > 0;
            const temIniciais = Array.isArray(p.iniciais) && p.iniciais.length > 0;
            const estoqueControlado = p.estoqueControlado === true || p.estoqueLimitadoAtivo === true || p.controleEstoque === true;
            const estoqueQuantidade = Math.max(0, parseInt(p.estoqueQuantidade ?? p.estoque ?? 0, 10) || 0);
            const badges = [
                temDizeres  ? `<span class="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-bold">✍️ ${p.dizeres.length} dizeres</span>`  : '',
                temIniciais ? `<span class="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] font-bold">🔤 ${p.iniciais.length} iniciais</span>` : '',
                estoqueControlado ? `<span class="px-1.5 py-0.5 bg-amber-950/40 text-amber-300 rounded text-[9px] font-bold">📦 ${estoqueQuantidade} em estoque</span>` : '',
            ].filter(Boolean).join('');

            return `
                <div class="flex items-center justify-between p-4 bg-zinc-950 border ${pausado ? 'border-red-900/40 opacity-60' : 'border-zinc-900'} rounded-2xl transition-all hover:border-zinc-800">
                    <div class="flex items-center gap-4 min-w-0">
                        <img src="${p.image || p.imagem || ''}" class="w-12 h-12 rounded-xl object-cover bg-zinc-900 shrink-0"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/>'">
                        <div class="min-w-0">
                            <div class="text-sm font-bold text-zinc-200 truncate">${p.nome || p.name || 'Sem Nome'}</div>
                            <div class="text-[10px] text-zinc-500 font-mono">SKU: ${p.sku || id}</div>
                            <div class="flex gap-1 mt-1 flex-wrap">${badges}</div>
                        </div>
                    </div>
                    <div class="flex gap-1.5 shrink-0 ml-3">
                        <button data-action="toggle" data-id="${id}"
                                class="p-2.5 border rounded-xl text-xs font-bold transition-all ${pausado ? 'bg-green-950/30 border-green-900/50 text-green-400 hover:bg-green-600 hover:text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-yellow-600 hover:text-white'}"
                                title="${pausado ? 'Ativar' : 'Pausar'}">
                            ${pausado ? '▶️' : '⏸️'}
                        </button>
                        <button data-action="editar" data-id="${id}"
                                class="p-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:bg-[#caa85c] hover:text-black transition-all">✏️</button>
                        <button data-action="excluir" data-id="${id}"
                                class="p-2.5 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ── NOVO PRODUTO ──────────────────────────────────────────────────────────
    abrirNovoProduto(cats = {}, subs = {}) {
        this.atualizarCaches(cats, subs);

        const optsCat = Object.entries(this.categoriasEmMemoria)
            .map(([id, c]) => `<option value="${id}">${c.nome || c.name || id}</option>`).join('');
        const optsSub = Object.entries(this.subcategoriasEmMemoria)
            .map(([id, s]) => `<option value="${id}">${s.nome || s.name || id}</option>`).join('');

        const html = `
            <div class="space-y-4">
                <!-- Linha 1: SKU + Peso -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">SKU</label>
                        <input type="text" id="new-sku" placeholder="Ex: ANL-001"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Peso (g)</label>
                        <input type="number" id="new-peso" placeholder="Ex: 3.5" step="0.1"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <!-- Nome -->
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Joia</label>
                    <input type="text" id="new-nome" placeholder="Ex: Anel Letinha Tranversal"
                           class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                </div>

                <!-- Linha 2: Preço + Promo -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Base (R$)</label>
                        <input type="number" id="new-preco" placeholder="0.00" step="0.01"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Promocional (R$)</label>
                        <input type="number" id="new-promo" placeholder="0.00" step="0.01"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <!-- Categoria + Subcategoria -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Principal</label>
                        <select id="new-categoria"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>${optsCat}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Subcategoria</label>
                        <select id="new-subcategoria"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>${optsSub}
                        </select>
                    </div>
                </div>

                <!-- Estoque limitado -->
                <div class="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <label class="text-xs text-amber-200 font-bold block">Contador de estoque limitado</label>
                            <p class="text-[10px] text-amber-100/60 mt-1">Use para peças de saldão ou fora de linha.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="new-estoque-controlado" class="sr-only peer">
                            <div class="w-10 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-[#caa85c]"></div>
                            <div class="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition-transform"></div>
                        </label>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Quantidade disponível</label>
                        <input type="number" id="new-estoque-quantidade" min="0" step="1" value="0" disabled
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white disabled:opacity-40 focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <!-- Variações -->
                ${_htmlVariacoes('new')}

                <!-- Imagem -->
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL da Imagem</label>
                    <input type="text" id="new-image" placeholder="https:// ou gs://"
                           class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]"
                           oninput="document.getElementById('new-preview').src=this.value">
                    <div class="mt-2 w-full h-36 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                        <img id="new-preview" src="" class="w-full h-full object-cover"
                             onerror="this.style.opacity='0'" onload="this.style.opacity='1'" style="opacity:0; transition:opacity .2s">
                    </div>
                </div>

                <button id="btn-inserir-produto"
                        class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                    ➕ Inserir no Catálogo
                </button>
            </div>
        `;

        Drawer.open({ title: '➕ NOVO PRODUTO', content: html, width: '700px' });
        const newEstoqueToggle = document.getElementById('new-estoque-controlado');
        const newEstoqueInput = document.getElementById('new-estoque-quantidade');
        newEstoqueToggle?.addEventListener('change', () => {
            newEstoqueInput.disabled = !newEstoqueToggle.checked;
            if (newEstoqueToggle.checked) newEstoqueInput.focus();
        });
        document.getElementById('btn-inserir-produto').onclick = () => this.salvarNovoProduto();
    },

    async salvarNovoProduto() {
        const nome  = document.getElementById('new-nome')?.value?.trim();
        const preco = parseFloat(document.getElementById('new-preco')?.value) || 0;

        if (!nome) return alert('Informe o nome do produto.');
        if (!preco) return alert('Informe o preço base.');

        const dizeres  = _extrairTags('newDizeresContainer');
        const iniciais = _extrairTags('newIniciaisContainer');
        const peso     = parseFloat(document.getElementById('new-peso')?.value) || 0;
        const promo    = parseFloat(document.getElementById('new-promo')?.value) || 0;
        const estoqueControlado = document.getElementById('new-estoque-controlado')?.checked === true;
        const estoqueQuantidade = Math.max(0, parseInt(document.getElementById('new-estoque-quantidade')?.value, 10) || 0);

        const dados = {
            sku:          document.getElementById('new-sku')?.value?.trim()          || '',
            nome,
            name:         nome,
            preco,
            price:        preco,
            precoFinal:   promo || preco,
            promocao:     promo || null,
            promo:        promo || null,
            peso,
            weight:       peso,
            category:     document.getElementById('new-categoria')?.value             || '',
            subcategoria: document.getElementById('new-subcategoria')?.value          || '',
            image:        document.getElementById('new-image')?.value?.trim()         || '',
            imagem:       document.getElementById('new-image')?.value?.trim()         || '',
            dizeres:      dizeres.length  > 0 ? dizeres  : null,
            sayings:      dizeres.length  > 0 ? dizeres  : null,
            iniciais:     iniciais.length > 0 ? iniciais : null,
            initials:     iniciais.length > 0 ? iniciais : null,
            paused:       false,
            estoqueControlado,
            estoqueQuantidade: estoqueControlado ? estoqueQuantidade : null,
            estoque: estoqueControlado ? estoqueQuantidade : null,
            createdAt:    Date.now(),
            updatedAt:    Date.now(),
        };

        // Remove nulls para não poluir o banco
        Object.keys(dados).forEach(k => dados[k] === null && delete dados[k]);

        const btn = document.getElementById('btn-inserir-produto');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            await this.dbRef.push(dados);
            Drawer.close();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar. Verifique o console.');
            btn.textContent = '➕ Inserir no Catálogo';
            btn.disabled = false;
        }
    },

    // ── EDITAR PRODUTO ────────────────────────────────────────────────────────
    abrirEditarProduto(id) {
        const p = this.produtosEmMemoria[id];
        if (!p) return;

        const optsCat = Object.entries(this.categoriasEmMemoria)
            .map(([cId, c]) => `<option value="${cId}" ${(p.category || p.categoria) === cId ? 'selected' : ''}>${c.nome || c.name || cId}</option>`).join('');
        const optsSub = Object.entries(this.subcategoriasEmMemoria)
            .map(([sId, s]) => `<option value="${sId}" ${p.subcategoria === sId ? 'selected' : ''}>${s.nome || s.name || sId}</option>`).join('');

        const html = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">SKU</label>
                        <input type="text" id="edit-sku" value="${p.sku || ''}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Peso (g)</label>
                        <input type="number" id="edit-peso" value="${p.peso || p.weight || ''}" step="0.1"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">Nome da Joia</label>
                    <input type="text" id="edit-nome" value="${p.nome || p.name || ''}"
                           class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Base (R$)</label>
                        <input type="number" id="edit-preco" value="${p.preco || p.price || ''}" step="0.01"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Preço Promocional (R$)</label>
                        <input type="number" id="edit-promo" value="${p.promocao || p.promo || ''}" step="0.01"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Categoria Principal</label>
                        <select id="edit-categoria"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>${optsCat}
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Subcategoria</label>
                        <select id="edit-subcategoria"
                                class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                            <option value="">Selecione...</option>${optsSub}
                        </select>
                    </div>
                </div>

                <!-- Estoque limitado -->
                <div class="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl space-y-3">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <label class="text-xs text-amber-200 font-bold block">Contador de estoque limitado</label>
                            <p class="text-[10px] text-amber-100/60 mt-1">Ative apenas para peças de saldão.</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="edit-estoque-controlado" class="sr-only peer" ${p.estoqueControlado === true || p.estoqueLimitadoAtivo === true || p.controleEstoque === true ? 'checked' : ''}>
                            <div class="w-10 h-5 bg-zinc-800 rounded-full peer peer-checked:bg-[#caa85c]"></div>
                            <div class="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full peer-checked:translate-x-5 transition-transform"></div>
                        </label>
                    </div>
                    <div>
                        <label class="text-xs text-zinc-400 font-bold block mb-1">Quantidade disponível</label>
                        <input type="number" id="edit-estoque-quantidade" min="0" step="1" value="${Math.max(0, parseInt(p.estoqueQuantidade ?? p.estoque ?? 0, 10) || 0)}"
                               class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]">
                    </div>
                </div>

                <!-- Variações -->
                ${_htmlVariacoes('edit')}

                <!-- Imagem -->
                <div>
                    <label class="text-xs text-zinc-400 font-bold block mb-1">URL da Imagem</label>
                    <input type="text" id="edit-image" value="${p.image || p.imagem || ''}"
                           class="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#caa85c]"
                           oninput="document.getElementById('edit-preview').src=this.value; document.getElementById('edit-preview').style.opacity='1'">
                    <div class="mt-2 w-full h-36 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
                        <img id="edit-preview" src="${p.image || p.imagem || ''}"
                             class="w-full h-full object-cover"
                             onerror="this.style.opacity='0'"
                             style="transition:opacity .2s">
                    </div>
                </div>

                <!-- Status -->
                <div class="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                    <input type="checkbox" id="edit-paused" ${p.paused ? 'checked' : ''}
                           class="w-4 h-4 accent-red-500">
                    <label for="edit-paused" class="text-xs text-zinc-400 font-bold cursor-pointer">
                        Produto pausado (não aparece na loja)
                    </label>
                </div>

                <button id="btn-salvar-produto"
                        class="w-full bg-[#caa85c] text-black font-black py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider">
                    💾 Salvar Alterações
                </button>
            </div>
        `;

        Drawer.open({ title: '✏️ EDITAR PRODUTO', content: html, width: '700px' });
        const editEstoqueToggle = document.getElementById('edit-estoque-controlado');
        const editEstoqueInput = document.getElementById('edit-estoque-quantidade');
        const syncEditEstoque = () => { editEstoqueInput.disabled = !editEstoqueToggle.checked; };
        editEstoqueToggle?.addEventListener('change', syncEditEstoque);
        syncEditEstoque();

        // Popula as tags após o DOM estar pronto
        requestAnimationFrame(() => {
            _popularTags('editDizeresContainer',  p.dizeres  || p.sayings  || []);
            _popularTags('editIniciaisContainer', p.iniciais || p.initials || []);
        });

        document.getElementById('btn-salvar-produto').onclick = () => this.salvarProduto(id);
    },

    async salvarProduto(id) {
        const nome  = document.getElementById('edit-nome')?.value?.trim();
        const preco = parseFloat(document.getElementById('edit-preco')?.value) || 0;

        if (!nome) return alert('Informe o nome do produto.');

        const dizeres  = _extrairTags('editDizeresContainer');
        const iniciais = _extrairTags('editIniciaisContainer');
        const peso     = parseFloat(document.getElementById('edit-peso')?.value)  || 0;
        const promo    = parseFloat(document.getElementById('edit-promo')?.value) || 0;
        const estoqueControlado = document.getElementById('edit-estoque-controlado')?.checked === true;
        const estoqueQuantidade = Math.max(0, parseInt(document.getElementById('edit-estoque-quantidade')?.value, 10) || 0);

        const dados = {
            sku:          document.getElementById('edit-sku')?.value?.trim()          || '',
            nome,
            name:         nome,
            preco,
            price:        preco,
            precoFinal:   promo || preco,
            promocao:     promo || null,
            promo:        promo || null,
            peso,
            weight:       peso,
            category:     document.getElementById('edit-categoria')?.value            || '',
            subcategoria: document.getElementById('edit-subcategoria')?.value         || '',
            image:        document.getElementById('edit-image')?.value?.trim()        || '',
            imagem:       document.getElementById('edit-image')?.value?.trim()        || '',
            dizeres:      dizeres.length  > 0 ? dizeres  : null,
            sayings:      dizeres.length  > 0 ? dizeres  : null,
            iniciais:     iniciais.length > 0 ? iniciais : null,
            initials:     iniciais.length > 0 ? iniciais : null,
            paused:       document.getElementById('edit-paused')?.checked || false,
            estoqueControlado,
            estoqueQuantidade: estoqueControlado ? estoqueQuantidade : null,
            estoque: estoqueControlado ? estoqueQuantidade : null,
            updatedAt:    Date.now(),
        };

        // Remove nulls
        Object.keys(dados).forEach(k => dados[k] === null && delete dados[k]);

        const btn = document.getElementById('btn-salvar-produto');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            await this.dbRef.child(id).update(dados);
            Drawer.close();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar. Verifique o console.');
            btn.textContent = '💾 Salvar Alterações';
            btn.disabled = false;
        }
    },

    // ── TOGGLE PAUSED ─────────────────────────────────────────────────────────
    async togglePausado(id) {
        const p = this.produtosEmMemoria[id];
        if (!p) return;
        await this.dbRef.child(id).update({ paused: !p.paused, updatedAt: Date.now() });
    },

    // ── EXCLUIR ───────────────────────────────────────────────────────────────
    async excluirProduto(id) {
        const p = this.produtosEmMemoria[id];
        const nome = p?.nome || p?.name || id;
        if (confirm(`Apagar o produto "${nome}" permanentemente?`)) {
            await this.dbRef.child(id).remove();
        }
    }
};
