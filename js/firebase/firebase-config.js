// ======================================================================
// js/firebase/firebase-config.js
// Catálogo Multi-Lojas - Firebase Config v3.0 (Dinâmico)
// ======================================================================

(function () {

    // ==========================================================
    // Verificação Firebase SDK
    // ==========================================================
    if (typeof firebase === 'undefined') {
        console.error('[Firebase] SDK não carregado nas dependências HTML.');
        return;
    }

    // ==========================================================
    // Configuração Firebase (Projeto Unificado)
    // ==========================================================
    const firebaseConfig = {
        apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
        authDomain: "catalogo-abella-joias.firebaseapp.com",
        databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
        projectId: "catalogo-abella-joias",
        storageBucket: "catalogo-abella-joias.firebasestorage.app",
        messagingSenderId: "727568435294",
        appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
    };

    // ==========================================================
    // Inicialização do Aplicativo
    // ==========================================================
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            console.log('[Firebase] Aplicação inicializada com sucesso.');
        }
    } catch (error) {
        console.error('[Firebase] Erro crítico ao inicializar aplicativo:', error);
        return;
    }

    // ==========================================================
    // Instanciação dos Serviços
    // ==========================================================
    let db = null;
    let storage = null;
    let auth = null;

    try { db = firebase.database(); } catch (e) { console.error('[Firebase DB] Erro:', e); }
    try { if (typeof firebase.storage === 'function') storage = firebase.storage(); } catch (e) { console.error('[Firebase Storage] Erro:', e); }
    try { if (typeof firebase.auth === 'function') auth = firebase.auth(); } catch (e) { console.error('[Firebase Auth] Erro:', e); }

    // ==========================================================
    // 🧠 LÓGICA MULTI-TENANT (Mapeamento Dinâmico de Marcas)
    // ==========================================================
    // Detecta qual loja está acessando através do domínio/URL atual
    const hostname = window.location.hostname.toLowerCase();
    let currentTenant = 'abella_joias'; // Valor padrão de fallback

    if (hostname.includes('luary') || hostname.includes('luaryshop')) {
        currentTenant = 'luary_shop';
    } else if (hostname.includes('marcinha') || hostname.includes('marcinhasemijoias')) {
        currentTenant = 'marcinha_semijoias';
    } else if (hostname.includes('abella') || hostname.includes('abellajoias')) {
        currentTenant = 'abella_joias';
    } else {
        // Fallback alternativo para testes em localhost ou IP (ex: localhost:5500?loja=luary)
        const urlParams = new URLSearchParams(window.location.search);
        const lojaParam = urlParams.get('loja');
        if (lojaParam) {
            if (lojaParam === 'luary') currentTenant = 'luary_shop';
            if (lojaParam === 'marcinha') currentTenant = 'marcinha_semijoias';
        }
    }

    console.log(`[Multi-Tenant] Ambiente detectado para a marca: ${currentTenant.toUpperCase()}`);

    // ==========================================================
    // Exportação Global Segura
    // ==========================================================
    window.firebaseApp = firebase.app();
    window.db = db;
    window.storage = storage;
    window.auth = auth;
    
    // Caminho base que TODAS as chamadas do Realtime Database deverão usar
    // Ex: db.ref(window.dbTenantPath + '/produtos')
    window.dbTenantPath = `lojas/${currentTenant}`; 
    window.currentTenantName = currentTenant;

    // ==========================================================
    // Teste de Conectividade do Banco
    // ==========================================================
    if (db) {
        db.ref('.info/connected').on('value', snapshot => {
            console.log(snapshot.val() ? '[Firebase] Conectado à nuvem.' : '[Firebase] Sem conexão.');
        });
    }

})();
