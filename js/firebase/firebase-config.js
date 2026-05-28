// Configuração do Firebase Realtime Database da Abella Joias
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "abella-joias.firebaseapp.com",
    databaseURL: "https://abella-joias-default-rtdb.firebaseio.com",
    projectId: "abella-joias",
    storageBucket: "abella-joias.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:123456:web:abc123xyz"
};

// Inicializa o Firebase globalmente
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
