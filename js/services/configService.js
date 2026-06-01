// js/services/configService.js

const ConfigService = {
    _defaultSettings: {
        pixDesc: 5,
        parcelasMax: 6,
        whatsEmpresa: "5519988207658"
    },

    getSettings: async function() {
        try {
            const snap = await window.db.ref('abella/settings').once('value');
            if (snap.exists()) {
                const data = snap.val() || {};
                const emp = data.empresa || {};
                return {
                    pixDesc: parseFloat(data.pix || emp.pix || this._defaultSettings.pixDesc),
                    parcelasMax: parseInt(data.parcelas || emp.parcelas || this._defaultSettings.parcelasMax),
                    whatsEmpresa: String(data.whatsapp || emp.whatsapp || this._defaultSettings.whatsEmpresa).replace(/\D/g, '')
                };
            }
        } catch (e) {
            console.error("Falha ao recuperar configurações do Firebase:", e);
        }
        return this._defaultSettings;
    },

    saveSettings: async function(settingsData) {
        const payload = {
            pix: parseFloat(settingsData.pixDesc) || 5,
            parcelas: parseInt(settingsData.parcelasMax) || 6,
            whatsapp: String(settingsData.whatsEmpresa).replace(/\D/g, '')
        };
        await window.db.ref('abella/settings').update(payload);
    }
};

window.ConfigService = ConfigService;
