const GalvanicaService = {
    async obterParceiros() {
        return new Promise((resolve) => {
            database.ref('abella/galvanicas').once('value', (snapshot) => {
                const dados = snapshot.val();
                resolve(dados ? Object.keys(dados).map(key => ({ id: key, ...dados[key] })) : []);
            });// js/services/galvanicaService.js

const GalvanicaService = {
    getAll: async function() {
        const snapshot = await window.db.ref('abella/galvanicas').once('value');
        return snapshot.val() || {};
    },

    save: async function(id, data) {
        const record = {
            nome: data.nome || '',
            selo: data.selo || 'PARCEIRO',
            whatsapp: data.whatsapp || '',
            descricao: data.descricao || '',
            endereco: data.endereco || '',
            telefone: data.telefone || '',
            active: data.active !== false,
            imagem: data.imagem || ''
        };

        if (id) {
            await window.db.ref(`abella/galvanicas/${id}`).set(record);
            return id;
        } else {
            const newRef = window.db.ref('abella/galvanicas').push();
            await newRef.set(record);
            return newRef.key;
        }
    },

    delete: async function(id) {
        await window.db.ref(`abella/galvanicas/${id}`).remove();
    }
};

window.GalvanicaService = GalvanicaService;
        });
    },

    verificarFreteGratis(totalPedido) {
        // Regra: Frete grátis para galvânicas de Limeira nas compras acima de R$100
        return totalPedido >= 100;
    }
};
