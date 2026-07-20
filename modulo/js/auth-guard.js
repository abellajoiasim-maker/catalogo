/*
==========================================================
ABELLA JOIAS — PAINEL ADMINISTRATIVO
Auth Guard

Arquivo:
modulo/js/auth-guard.js

Responsabilidade:
Proteger páginas do painel administrativo (editor, config,
pedidos) exigindo login via Firebase Authentication. Se não
houver usuário autenticado, redireciona para login.html.

Como usar:
1. Adicionar no <head>, como PRIMEIRA linha, antes de qualquer
   outra coisa: <style id="auth-guard-hide">html{visibility:hidden !important;}</style>
2. Incluir este script DEPOIS de "../js/firebase/firebase-config.js"
   (precisa que window.auth já exista).
3. Pronto — a página só aparece depois de confirmado o login.
==========================================================
*/

(function () {
    'use strict';

    function revelarPagina() {
        const estilo = document.getElementById('auth-guard-hide');
        if (estilo) estilo.remove();
        document.documentElement.style.visibility = 'visible';
    }

    function redirecionarParaLogin() {
        const destino = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `login.html?redirect=${destino}`;
    }

    function iniciarVerificacao() {
        if (!window.auth || typeof window.auth.onAuthStateChanged !== 'function') {
            console.error('[AuthGuard] Firebase Auth não disponível — verifique se firebase-config.js foi carregado antes deste script.');
            redirecionarParaLogin();
            return;
        }

        window.auth.onAuthStateChanged((user) => {
            if (user) {
                window.__ADMIN_USER__ = user;
                revelarPagina();
            } else {
                redirecionarParaLogin();
            }
        });
    }

    iniciarVerificacao();

    window.AuthGuard = {
        logout() {
            if (window.auth && typeof window.auth.signOut === 'function') {
                window.auth.signOut().then(() => {
                    window.location.href = 'login.html';
                });
            }
        },
        usuarioAtual() {
            return window.__ADMIN_USER__ || null;
        }
    };
})();
