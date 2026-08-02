// ======================================================================
// js/analytics.js
// SEO IQ200 — Rastreamento gratuito (GA4 + Microsoft Clarity)
// Específico do site institucional (www.abellajoias.com.br).
// ======================================================================

(function () {
    'use strict';

    var GA4_MEASUREMENT_ID = 'G-5E1DFV4YMQ';
    var CLARITY_PROJECT_ID = 'xvs3aht3ue';

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

    (function carregarClarity() {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
    })();
})();
