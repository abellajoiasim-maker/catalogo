// ======================================================================
// js/firebase/firebase-config.js
// Firebase Config Global • Abella Joias
// Compatível com GitHub Pages + Firebase Compat SDK
// Estrutura Oficial: abella/*
// Arquitetura Homologada PMA V8 - Arquivo Completo
// ======================================================================

(function () {
    'use strict';

    // VERIFICAÇÃO INTEGRAL DO FIREBASE SDK
    if (typeof window.firebase === 'undefined') {
        console.error('[PMA V8] [Firebase] SDK principal não foi localizado no escopo global.');
        return;
    }

    // CONTROLE DE REINICIALIZAÇÃO DO CONTEXTO
    if (window.__ABELLA_FIREBASE_INITIALIZED__ === true) {
        console.warn('[PMA V8] [Firebase] Contexto de conexão global já instanciado anteriormente.');
        return;
    }

    // CONFIGURAÇÃO OFICIAL DA CONTA INSTITUCIONAL (IMUTÁVEL)
    const firebaseConfig = Object.freeze({
        apiKey: 'AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY',
        authDomain: 'catalogo-abella-joias.firebaseapp.com',
        databaseURL: 'https://catalogo-abella-joias-default-rtdb.firebaseio.com',
        projectId: 'catalogo-abella-joias',
        storageBucket: 'catalogo-abella-joias.firebasestorage.app',
        messagingSenderId: '727568435294',
        appId: '1:727568435294:web:442c0179ecf0686dff4ccf'
    });

    // INICIALIZAÇÃO DO CORE APPLICATION INTERFACE
    let app = null;
    try {
        app = firebase.apps.length > 0
            ? firebase.app()
            : firebase.initializeApp(firebaseConfig);
    } catch (error) {
        console.error('[PMA V8] [Firebase] Falha crítica durante a inicialização do Core App:', error);
        return;
    }

    // INSTÂNCIAS DE MÓDULOS ESPECÍFICOS
    let db = null;
    let storage = null;
    let auth = null;

    // INICIALIZAÇÃO COMPAT REALTIME DATABASE
    try {
        if (typeof firebase.database === 'function') {
            db = firebase.database();
        } else {
            console.error('[PMA V8] [Firebase Database] Módulo RTDB não disponível.');
        }
    } catch (error) {
        console.error('[PMA V8] [Firebase Database] Erro de instância:', error);
    }

    // INICIALIZAÇÃO COMPAT FIREBASE STORAGE
    try {
        if (typeof firebase.storage === 'function') {
            storage = firebase.storage();
        } else {
            console.warn('[PMA V8] [Firebase Storage] Módulo Storage não disponível.');
        }
    } catch (error) {
        console.error('[PMA V8] [Firebase Storage] Erro de instância:', error);
    }

    // INICIALIZAÇÃO COMPAT FIREBASE AUTHENTICATION
    try {
        if (typeof firebase.auth === 'function') {
            auth = firebase.auth();
        }
    } catch (error) {
        console.error('[PMA V8] [Firebase Auth] Erro de instância:', error);
    }

    // EXPORTAÇÃO COMPATÍVEL PROTEGIDA CONTRA ESCALABILIDADE DE ESCRITA
    Object.defineProperty(window, 'firebaseApp', { value: app, writable: false, configurable: false });
    Object.defineProperty(window, 'db', { value: db, writable: false, configurable: false });
    Object.defineProperty(window, 'storage', { value: storage, writable: false, configurable: false });
    Object.defineProperty(window, 'auth', { value: auth, writable: false, configurable: false });

    // DEFINIÇÃO DO ROOT DIRECTORY DO BANCO EM PRODUÇÃO
    Object.defineProperty(window, 'ABELLA_DB_ROOT', { value: 'abella', writable: false, configurable: false });

    // HELPER COMPATÍVEL DE DIRECIONAMENTO DE PATHS
    const getAbellaPath = function (path = '') {
        const serialized = String(path || '').trim();
        const cleanPath = serialized.replace(/^\/+/, '').replace(/\/+$/, '');
        
        if (!cleanPath) {
            return window.ABELLA_DB_ROOT;
        }
        return `${window.ABELLA_DB_ROOT}/${cleanPath}`;
    };

    Object.defineProperty(window, 'getAbellaPath', { value: getAbellaPath, writable: false, configurable: false });

    // ESTADO PADRÃO DE CONEXÃO ANTES DO LISTENER
    window.__ABELLA_FIREBASE_CONNECTED__ = false;

    // PROVIMENTO DO MONITOR INTEGRADO DE CONEXÃO
    if (db && typeof db.ref === 'function') {
        try {
            db.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val() === true;
                window.__ABELLA_FIREBASE_CONNECTED__ = connected;

                window.dispatchEvent(
                    new CustomEvent('abella-connection', {
                        detail: { connected }
                    })
                );
            });
        } catch (error) {
            console.error('[PMA V8] [Firebase] Monitoramento em tempo real falhou:', error);
        }
    }

    // MARCAÇÃO DA CONCLUSÃO DA INICIALIZAÇÃO DO ARQUIVO DE BASE
    window.__ABELLA_FIREBASE_INITIALIZED__ = true;
    console.info('[PMA V8] [Firebase] Configuração de infraestrutura de dados fixada com sucesso.');
})();
