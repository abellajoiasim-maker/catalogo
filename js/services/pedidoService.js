// ======================================================================// js/firebase/services/pedidoService.js// Abella Joias - PedidoService Premium v7.0 FORENSE// ======================================================================

const PedidoService = {

_cache: {},
_cacheTimestamp: 0,
_cacheTTL: 30000,

// ==========================================================
// FIREBASE
// ==========================================================

_db() {

    if (!window.db) {

        throw new Error(
            'Firebase Database não inicializado.'
        );

    }

    return window.db;

},

// ==========================================================
// PATH
// ==========================================================

_path(path = '') {

    return getAbellaPath(path);

},

_ref(path = '') {

    return this
        ._db()
        .ref(
            this._path(path)
        );

},

// ==========================================================
// CACHE
// ==========================================================

_isCacheValid() {

    return (

        Object.keys(
            this._cache
        ).length > 0 &&

        (
            Date.now() -
            this._cacheTimestamp
        ) < this._cacheTTL

    );

},

invalidateCache() {

    this._cache = {};
    this._cacheTimestamp = 0;

},

// ==========================================================
// HELPERS
// ==========================================================

    _safeString(valor = '') {

        if (valor === null || valor === undefined) return '';

        if (typeof valor === 'object') {
            return this._safeString(
                valor.nome || valor.name || valor.label || valor.valor || valor.value || valor.medida || valor.tamanho || ''
            );
        }

        return String(valor || '')
            .trim();

    },

    _normalizarVariacao(valor = '') {

        if (valor && typeof valor === 'object') {
            return this._safeString(
                valor.nome || valor.name || valor.label || valor.valor || valor.value || valor.medida || valor.tamanho || ''
            );
        }

        return this._safeString(valor);

    },

_safeNumber(valor = 0) {

    const numero =
        Number(valor);

    return Number.isFinite(numero)
        ? numero
        : 0;

},

_safeArray(valor) {

    return Array.isArray(valor)
        ? valor
        : [];

},

_safeObject(valor) {

    return (
        valor &&
        typeof valor === 'object' &&
        !Array.isArray(valor)
    )
        ? valor
        : {};

},

_normalizeStatus(status = '') {

    const valor =
        this
            ._safeString(status);

    return valor || 'Recebido';

},

// ==========================================================
// NORMALIZADOR ITEM
// ==========================================================

normalizarItem(item = {}) {

        const variacao = this._normalizarVariacao(
            item.variacao || item.variation || item.medida || item.tamanho
        );

        return {

        id:
            this._safeString(
                item.id || item.codigo || item.sku
            ),

        sku:
            this._safeString(
                item.sku || item.codigo || item.id
            ),

        codigo:
            this._safeString(
                item.codigo || item.sku || item.id
            ),

        nome:
            this._safeString(
                item.nome ||
                item.name
            ),

        image:
            this._safeString(
                item.image ||
                item.imagem
            ),

        imagem:
            this._safeString(
                item.imagem ||
                item.image
            ),

        categoria:
            this._safeString(
                item.categoria ||
                item.category
            ),

        subcategoria:
            this._safeString(
                item.subcategoria ||
                item.subcategory
            ),

        precoOriginal:
            this._safeNumber(
                item.precoOriginal ??
                item.priceOriginal ??
                item.preco ??
                item.price
            ),

        preco:
            this._safeNumber(
                item.preco ??
                item.price ??
                item.precoFinal
            ),

        price:
            this._safeNumber(
                item.price ??
                item.preco ??
                item.precoFinal
            ),

        precoFinal:
            this._safeNumber(
                item.precoFinal ??
                item.precoVendaUnitario ??
                item.preco ??
                item.price
            ),

        peso:
            this._safeNumber(
                item.peso ??
                item.weight
            ),

        weight:
            this._safeNumber(
                item.weight ??
                item.peso
            ),

        pesoTotal:
            this._safeNumber(
                item.pesoTotal ??
                ((item.peso ?? item.weight ?? 0) * (parseInt(item.quantidade) || 1))
            ),

        subtotal:
            this._safeNumber(
                item.subtotal ??
                ((item.precoFinal ?? item.preco ?? item.price ?? 0) * (parseInt(item.quantidade) || 1))
            ),

        quantidade:
            Math.max(
                1,
                parseInt(
                    item.quantidade
                ) || 1
            ),

        variacao,

        name:
            this._safeString(item.name || item.nome),

        variation:
            variacao,

        descontoOferta:
            this._safeNumber(item.descontoOferta)

    };

},

// ==========================================================
// NORMALIZADOR PEDIDO
// ==========================================================

normalizarPedido(
    id,
    raw = {}
) {

    raw =
        this._safeObject(raw);

    const entregaLegada =
        this._safeObject(
            raw.enderecoEntrega
        );

    const entregaRaw =
        (raw.entrega && typeof raw.entrega === 'object')
            ? raw.entrega
            : entregaLegada;

    const entrega =
        this._safeObject(
            entregaRaw
        );

    const romaneio =
        this._safeObject(
            raw.romaneio
        );

    return {

        // ==================================================
        // IDENTIFICAÇÃO
        // ==================================================

        id:
            this._safeString(id),

        numeroPedido:
            this._safeString(
                raw.numeroPedido
            ),

        // ==================================================
        // CLIENTE
        // ==================================================

        cliente:
            this._safeString(
                raw.cliente || raw.nome
            ),

        nome:
            this._safeString(
                raw.nome || raw.cliente
            ),

        whats:
            this._safeString(
                raw.whats || raw.whatsapp || raw.contato
            ),

        whatsapp:
            this._safeString(
                raw.whatsapp || raw.whats || raw.contato
            ),

        contato:
            this._safeString(
                raw.contato || raw.whats || raw.whatsapp
            ),

        cidade:
            this._safeString(
                raw.cidade || raw.cidadeCliente || entrega.cidade
            ),

        cidadeCliente:
            this._safeString(
                raw.cidadeCliente || raw.cidade
            ),

        // ==================================================
        // PAGAMENTO
        // ==================================================

        formaPagamento:
            this._safeString(
                raw.formaPagamento || raw.pagamento
            ) || 'PIX',

        pagamento:
            this._safeString(
                raw.pagamento || raw.formaPagamento
            ) || 'PIX',

        observacoes:
            this._safeString(
                raw.observacoes
            ),

        // ==================================================
        // VALORES
        // ==================================================

        subtotal:
            this._safeNumber(
                raw.subtotal
            ),

        desconto:
            this._safeNumber(
                raw.desconto
            ),

        frete:
            this._safeNumber(
                raw.frete
            ),

        total:
            this._safeNumber(
                raw.total
            ),

        totalPix:
            this._safeNumber(
                raw.totalPix
            ),

        pesoTotal:
            this._safeNumber(
                raw.pesoTotal
            ),

        totalPecas:
            this._safeNumber(
                raw.totalPecas
            ),

        // ==================================================
        // STATUS
        // ==================================================

        status:
            this._normalizeStatus(
                raw.status
            ),

        // ==================================================
        // ENTREGA
        // ==================================================

        entrega: {

            nome:
                this._safeString(
                    entrega.nome || entrega.local
                ),

            endereco:
                this._safeString(
                    entrega.endereco
                ),

            numero:
                this._safeString(
                    entrega.numero
                ),

            bairro:
                this._safeString(
                    entrega.bairro
                ),

            cidade:
                this._safeString(
                    entrega.cidade || raw.cidadeEnt
                )

        },

        enderecoEntrega: {
            local: this._safeString(entrega.local || entrega.nome),
            rua: this._safeString(entrega.rua || entrega.endereco),
            numero: this._safeString(entrega.numero),
            bairro: this._safeString(entrega.bairro),
            cidade: this._safeString(entrega.cidade || raw.cidadeEnt)
        },

        // ==================================================
        // ROMANEIO
        // ==================================================

        romaneio: {

            subtotal:
                this._safeNumber(
                    romaneio.subtotal
                ),

            desconto:
                this._safeNumber(
                    romaneio.desconto
                ),

            totalPix:
                this._safeNumber(
                    romaneio.totalPix
                ),

            pesoTotal:
                this._safeNumber(
                    romaneio.pesoTotal
                ),

            totalPecas:
                this._safeNumber(
                    romaneio.totalPecas
                )

        },

        // ==================================================
        // ITENS
        // ==================================================

        itens:

            this
                ._safeArray(
                    raw.itens || raw.produtos
                )
                .map(item =>

                    this.normalizarItem(
                        item
                    )

                ),

        // ==================================================
        // DATAS
        // ==================================================

        createdAt:
            this._safeNumber(
                raw.createdAt
            ) || Date.now(),

        updatedAt:
            this._safeNumber(
                raw.updatedAt || raw.createdAt
            ) || Date.now(),

        dataCriacao:
            this._safeString(raw.dataCriacao || raw.data),

        data:
            this._safeString(raw.data || raw.dataCriacao),

        subtotalBruto:
            this._safeNumber(raw.subtotalBruto || raw.subtotal),

        descontoOfertas:
            this._safeNumber(raw.descontoOfertas),

        descontoPix:
            this._safeNumber(raw.descontoPix || raw.desconto),

        qtd:
            this._safeNumber(raw.qtd || raw.totalPecas),

        valorTotal:
            this._safeNumber(raw.valorTotal || raw.total),

        cupomAplicado: raw.cupomAplicado || null,
        descontoCupom: this._safeNumber(raw.descontoCupom),
        faixaValorAplicada: raw.faixaValorAplicada ?? null,
        descontoFaixaValor: this._safeNumber(raw.descontoFaixaValor),
        percentualDescontoPix: this._safeNumber(raw.percentualDescontoPix),
        percentualDescontoFaixa: this._safeNumber(raw.percentualDescontoFaixa)

    };

},

// ==========================================================
// CONTADOR DE PEDIDOS
// ==========================================================

_counterRef() {

    return this._ref(
        'counters/pedidos'
    );

},

async _getNextOrderNumber() {

    const counterRef =
        this._counterRef();

    const resultado =
        await counterRef.transaction(

            valorAtual => {

                valorAtual =
                    Number(valorAtual) || 0;

                return valorAtual + 1;

            }

        );

    if (
        !resultado.committed
    ) {

        throw new Error(
            'Falha ao gerar número do pedido.'
        );

    }

    const sequencial =
        Number(
            resultado.snapshot.val()
        );

    return (
        'AB' +
        String(
            sequencial
        ).padStart(
            6,
            '0'
        )
    );

},

// ==========================================================
// CREATE
// ==========================================================

async create(
    pedidoData = {}
) {

    try {

        const numeroPedido =
            await this
                ._getNextOrderNumber();

        const ref =
            this
                ._ref('orders')
                .push();

        const now =
            Date.now();

        const payload =
            this.normalizarPedido(

                ref.key,

                {

                    ...pedidoData,

                    numeroPedido,

                    status:
                        pedidoData.status ||
                        'Recebido',

                    createdAt:
                        pedidoData.createdAt ||
                        now,

                    updatedAt:
                        now

                }

            );

        await ref.set(
            payload
        );

        this._cache[
            ref.key
        ] = payload;

        return {

            success: true,

            id:
                ref.key,

            numeroPedido,

            pedido:
                payload

        };

    } catch (error) {

        console.error(
            '[PedidoService:create]',
            error
        );

        return {

            success: false,

            error:
                error?.message ||
                'Erro ao criar pedido.'

        };

    }

},
// ==========================================================
// GET ALL
// ==========================================================

async getAll(
    forceRefresh = false
) {

    try {

        if (

            !forceRefresh &&
            this._isCacheValid()

        ) {

            return this._cache;

        }

        const snapshot =

            await this
                ._ref('orders')
                .once('value');

        const data =
            snapshot.val() || {};

        this._cache = {};

        Object.entries(data)
            .forEach(
                ([id, raw]) => {

                    this._cache[id] =

                        this.normalizarPedido(
                            id,
                            raw
                        );

                }
            );

        this._cacheTimestamp =
            Date.now();

        return this._cache;

    } catch (error) {

        console.error(
            '[PedidoService:getAll]',
            error
        );

        return {};

    }

},

// ==========================================================
// GET BY ID
// ==========================================================

async getById(id) {

    try {

        id =
            this._safeString(id);

        if (!id) {

            return null;

        }

        if (
            this._cache[id]
        ) {

            return this._cache[id];

        }

        const snapshot =

            await this
                ._ref(
                    `orders/${id}`
                )
                .once('value');

        const data =
            snapshot.val();

        if (!data) {

            return null;

        }

        const pedido =

            this.normalizarPedido(
                id,
                data
            );

        this._cache[id] =
            pedido;

        return pedido;

    } catch (error) {

        console.error(
            '[PedidoService:getById]',
            error
        );

        return null;

    }

},

// ==========================================================
// UPDATE STATUS
// ==========================================================

async updateStatus(
    id,
    status
) {

    try {

        id =
            this._safeString(id);

        if (!id) {

            throw new Error(
                'ID obrigatório.'
            );

        }

        const payload = {

            status:
                this._normalizeStatus(
                    status
                ),

            updatedAt:
                Date.now()

        };

        await this
            ._ref(
                `orders/${id}`
            )
            .update(
                payload
            );

        if (
            this._cache[id]
        ) {

            this._cache[id] = {

                ...this._cache[id],

                ...payload

            };

        }

        return true;

    } catch (error) {

        console.error(
            '[PedidoService:updateStatus]',
            error
        );

        return false;

    }

},

// ==========================================================
// UPDATE
// ==========================================================

async update(
    id,
    partialData = {}
) {

    try {

        id =
            this._safeString(id);

        if (!id) {

            throw new Error(
                'ID obrigatório.'
            );

        }

        const atual =
            await this.getById(id);

        if (!atual) {

            throw new Error(
                'Pedido não encontrado.'
            );

        }

        const payload =
            this.normalizarPedido(

                id,

                {

                    ...atual,

                    ...partialData,

                    updatedAt:
                        Date.now()

                }

            );

        await this
            ._ref(
                `orders/${id}`
            )
            .update(
                payload
            );

        this._cache[id] =
            payload;

        return true;

    } catch (error) {

        console.error(
            '[PedidoService:update]',
            error
        );

        return false;

    }

},

// ==========================================================
// DELETE
// ==========================================================

async delete(id) {

    try {

        id =
            this._safeString(id);

        if (!id) {

            return false;

        }

        await this
            ._ref(
                `orders/${id}`
            )
            .remove();

        delete this._cache[id];

        return true;

    } catch (error) {

        console.error(
            '[PedidoService:delete]',
            error
        );

        return false;

    }

},

// ==========================================================
// REALTIME
// ==========================================================

subscribe(callback) {

    try {

        const ref =
            this._ref('orders');

        ref.on(

            'value',

            snapshot => {

                const data =
                    snapshot.val() || {};

                this._cache = {};

                Object.entries(data)
                    .forEach(
                        ([id, raw]) => {

                            this._cache[id] =

                                this.normalizarPedido(
                                    id,
                                    raw
                                );

                        }
                    );

                this._cacheTimestamp =
                    Date.now();

                if (
                    typeof callback ===
                    'function'
                ) {

                    callback(
                        this._cache
                    );

                }

            }

        );

        return ref;

    } catch (error) {

        console.error(
            '[PedidoService:subscribe]',
            error
        );

    }

},

// ==========================================================
// UNSUBSCRIBE
// ==========================================================

unsubscribe(ref) {

    try {

        if (ref) {

            ref.off();

        }

    } catch (error) {

        console.error(
            '[PedidoService:unsubscribe]',
            error
        );

    }

}

};

// ==========================================================// EXPORTS// ==========================================================

window.PedidoService =PedidoService;

window.pedidoService =PedidoService;

// ==========================================================// LEGACY// ==========================================================

PedidoService.criarPedido =PedidoService.create.bind(PedidoService);

PedidoService.buscarPorId =PedidoService.getById.bind(PedidoService);

PedidoService.listarTodos = PedidoService.getAll.bind(PedidoService);
PedidoService.atualizarStatus = PedidoService.updateStatus.bind(PedidoService);
PedidoService.excluir = PedidoService.delete.bind(PedidoService);

// ==========================================================// INIT// ==========================================================

console.log('📦 PedidoService Premium v7.0 FORENSE carregado.');
