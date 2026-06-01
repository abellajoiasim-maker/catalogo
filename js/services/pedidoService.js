// js/services/pedidoService.js

const PedidoService = {
    create: async function(pedidoData) {
        const ref = window.db.ref('abella/orders').push();
        const payload = {
            cliente: pedidoData.cliente || pedidoData.nome || '',
            whats: pedidoData.whats || pedidoData.contato || '',
            cidade: pedidoData.cidade || '',
            formaPagamento: pedidoData.formaPagamento || 'PIX',
            total: parseFloat(pedidoData.total) || 0,
            pesoTotal: parseFloat(pedidoData.pesoTotal) || 0,
            totalPecas: parseInt(pedidoData.totalPecas) || 0,
            status: pedidoData.status || "Novo",
            criadoEm: pedidoData.criadoEm || Date.now(),
            entrega: pedidoData.entrega || {},
            itens: pedidoData.itens || []
        };
        await ref.set(payload);
        return ref.key;
    },

    getAll: async function() {
        const snapshot = await window.db.ref('abella/orders').once('value');
        const data = snapshot.val() || {};
        
        // Garante a migração em tempo de leitura para compatibilidade total
        Object.keys(data).forEach(id => {
            if (data[id] && !data[id].cliente && data[id].nome) {
                data[id].cliente = data[id].nome;
            }
            if (data[id] && !data[id].whats && data[id].contato) {
                data[id].whats = data[id].contato;
            }
            if (data[id] && !data[id].itens && data[id].produtos) {
                data[id].itens = data[id].produtos;
            }
        });
        
        return data;
    },

    updateStatus: async function(id, novoStatus) {
        await window.db.ref(`abella/orders/${id}/status`).set(novoStatus);
    },

    delete: async function(id) {
        await window.db.ref(`abella/orders/${id}`).remove();
    }
};

window.PedidoService = PedidoService;
