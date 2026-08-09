// ======================================================================
// js/analytics.js
// SEO IQ200 — Rastreamento gratuito (GA4 + Microsoft Clarity)
// Específico do subdomínio do catálogo (catalogo.abellajoias.com.br).
// Centralizado aqui para trocar o ID em um único lugar no futuro.
// ======================================================================

(function () {
    'use strict';

    var GA4_MEASUREMENT_ID = 'G-C8M4VV60CZ';
    var CLARITY_PROJECT_ID = 'xvsc3y0wc3';

    // ---------------------------------------------------------------
    // Google Analytics 4
    // ---------------------------------------------------------------
    (function carregarGA4() {
        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { window.dataLayer.push(arguments); }
        window.gtag = gtag;

        gtag('js', new Date());
        gtag('config', GA4_MEASUREMENT_ID);
    })();

    // ---------------------------------------------------------------
    // Microsoft Clarity
    // ---------------------------------------------------------------
    (function carregarClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
    })();
})();
