// ======================================================================
// js/firebase/firebase-config.js
// Abella Joias - Firebase Config v2.0
// ======================================================================

(function () {

    // ==========================================================
    // Verificação Firebase SDK
    // ==========================================================

    if (typeof firebase === 'undefined') {

        console.error(
            '[Firebase] SDK não carregado.'
        );

        return;
    }

    // ==========================================================
    // Configuração Firebase
    // ==========================================================

    const firebaseConfig = {

        apiKey:
            "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",

        authDomain:
            "catalogo-abella-joias.firebaseapp.com",

        databaseURL:
            "https://catalogo-abella-joias-default-rtdb.firebaseio.com",

        projectId:
            "catalogo-abella-joias",

        storageBucket:
            "catalogo-abella-joias.firebasestorage.app",

        messagingSenderId:
            "727568435294",

        appId:
            "1:727568435294:web:442c0179ecf0686dff4ccf"
    };

    // ==========================================================
    // Inicialização
    // ==========================================================

    try {

        if (!firebase.apps.length) {

            firebase.initializeApp(
                firebaseConfig
            );

            console.log(
                '[Firebase] Aplicação inicializada.'
            );
        }

    } catch (error) {

        console.error(
            '[Firebase] Erro ao inicializar:',
            error
        );

        return;
    }

    // ==========================================================
    // Serviços
    // ==========================================================

    let db = null;
    let storage = null;
    let auth = null;

    try {

        db =
            firebase.database();

    } catch (error) {

        console.error(
            '[Firebase Database]',
            error
        );
    }

    try {

        if (
            typeof firebase.storage ===
            'function'
        ) {

            storage =
                firebase.storage();
        }

    } catch (error) {

        console.error(
            '[Firebase Storage]',
            error
        );
    }

    try {

        if (
            typeof firebase.auth ===
            'function'
        ) {

            auth =
                firebase.auth();
        }

    } catch (error) {

        console.error(
            '[Firebase Auth]',
            error
        );
    }

    // ==========================================================
    // Exportação Global
    // ==========================================================

    window.firebaseApp =
        firebase.app();

    window.db =
        db;

    window.storage =
        storage;

    window.auth =
        auth;

    // ==========================================================
    // Teste de Conectividade
    // ==========================================================

    if (db) {

        db.ref('.info/connected')
            .on(
                'value',
                snapshot => {

                    const conectado =
                        snapshot.val();

                    console.log(
                        conectado
                            ? '[Firebase] Conectado.'
                            : '[Firebase] Desconectado.'
                    );
                }
            );
    }

})();
