// FILE: /js/firebase/firebase.js

// Configuração estrita do Firebase Realtime Database para Abella Joias
const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com"
};

// Inicialização segura e isolada sem duplicação de instâncias
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportação global limpa da instância do banco de dados (Sem tags <script> internas)
const db = firebase.database();