// ======================================================================
// js/firebase/firebase-config.js
// Firebase Config Global • Abella Joias
// Compatível com GitHub Pages + Firebase Compat SDK
// Estrutura Oficial: abella/*
// ======================================================================

(function () {

    'use strict';

    // ==========================================================
    // VERIFICAÇÃO FIREBASE SDK
    // ==========================================================
    if (typeof window.firebase === 'undefined') {

        console.error(
            '[Firebase] SDK principal não carregado.'
        );

        return;
    }

    // ==========================================================
    // EVITA REINICIALIZAÇÃO DUPLICADA
    // ==========================================================
    if (window.__ABELLA_FIREBASE_INITIALIZED__ === true) {

        console.warn(
            '[Firebase] Instância global já inicializada.'
        );

        return;
    }

    // ==========================================================
    // CONFIGURAÇÃO OFICIAL FIREBASE
    // ==========================================================
    const firebaseConfig = Object.freeze({

        apiKey:
            'AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY',

        authDomain:
            'catalogo-abella-joias.firebaseapp.com',

        databaseURL:
            'https://catalogo-abella-joias-default-rtdb.firebaseio.com',

        projectId:
            'catalogo-abella-joias',

        storageBucket:
            'catalogo-abella-joias.firebasestorage.app',

        messagingSenderId:
            '727568435294',

        appId:
            '1:727568435294:web:442c0179ecf0686dff4ccf'

    });

    // ==========================================================
    // INICIALIZAÇÃO SEGURA
    // ==========================================================
    let app = null;

    try {

        app = firebase.apps.length > 0
            ? firebase.app()
            : firebase.initializeApp(firebaseConfig);

    } catch (error) {

        console.error(
            '[Firebase] Falha crítica ao inicializar aplicação:',
            error
        );

        return;
    }

    // ==========================================================
    // INSTÂNCIAS GLOBAIS
    // ==========================================================
    let db = null;
    let storage = null;
    let auth = null;

    // ==========================================================
    // DATABASE
    // ==========================================================
    try {

        if (
            typeof firebase.database === 'function'
        ) {

            db = firebase.database();

        } else {

            console.error(
                '[Firebase Database] SDK não carregado.'
            );

        }

    } catch (error) {

        console.error(
            '[Firebase Database] Erro ao instanciar:',
            error
        );

    }

    // ==========================================================
    // STORAGE
    // ==========================================================
    try {

        if (
            typeof firebase.storage === 'function'
        ) {

            storage = firebase.storage();

        } else {

            console.warn(
                '[Firebase Storage] SDK não carregado.'
            );

        }

    } catch (error) {

        console.error(
            '[Firebase Storage] Erro ao instanciar:',
            error
        );

    }

    // ==========================================================
    // AUTH
    // ==========================================================
    try {

        if (
            typeof firebase.auth === 'function'
        ) {

            auth = firebase.auth();

        }

    } catch (error) {

        console.error(
            '[Firebase Auth] Erro ao instanciar:',
            error
        );

    }

    // ==========================================================
    // EXPORTAÇÃO GLOBAL
    // ==========================================================
    window.firebaseApp = app;

    window.db = db;

    window.storage = storage;

    window.auth = auth;

    // ==========================================================
    // RAIZ OFICIAL DO PROJETO
    // ==========================================================
    window.ABELLA_DB_ROOT = 'abella';

    // ==========================================================
    // HELPER OFICIAL
    // ==========================================================
    window.getAbellaPath = function (path = '') {

        const cleanPath = String(
            path || ''
        ).replace(/^\/+/, '');

        return cleanPath
            ? `${window.ABELLA_DB_ROOT}/${cleanPath}`
            : window.ABELLA_DB_ROOT;
    };

    // ==========================================================
    // MONITOR DE CONEXÃO
    // ==========================================================
    if (
        db &&
        typeof db.ref === 'function'
    ) {

        try {

            db.ref('.info/connected')
                .on('value', (snapshot) => {

                    const connected =
                        snapshot.val() === true;

                    window.__ABELLA_FIREBASE_CONNECTED__ =
                        connected;

                    window.dispatchEvent(
                        new CustomEvent(
                            'abella-connection',
                            {
                                detail: {
                                    connected
                                }
                            }
                        )
                    );

                });

        } catch (error) {

            console.error(
                '[Firebase] Falha monitor conexão:',
                error
            );

        }
    }

    // ==========================================================
    // FLAGS GLOBAIS
    // ==========================================================
    window.__ABELLA_FIREBASE_CONNECTED__ =
        false;

    window.__ABELLA_FIREBASE_INITIALIZED__ =
        true;

    console.info(
        '[Firebase] Inicialização concluída com sucesso.'
    );

})();
