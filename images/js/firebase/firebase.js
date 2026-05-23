// CONFIGURAÇÃO CENTRAL E INICIALIZAÇÃO DO FIREBASE COLETIVO
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

// Verifica se o SDK tradicional (compat) está presente na janela global
if (typeof window.firebase !== "undefined") {
    if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
    }
    // Garante que db esteja disponível globalmente para códigos soltos nos HTMLs
    if (!window.db) {
        window.db = window.firebase.database();
    }
}

// Exporta para os serviços modulares usarem via importação ES6
const db = window.db || (typeof window.firebase !== "undefined" ? window.firebase.database() : null);
export { db, firebaseConfig };
