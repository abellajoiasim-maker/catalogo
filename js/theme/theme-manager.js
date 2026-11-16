/*
=========================================================
ABELLA VISUAL ENGINE — Theme Manager v3.0
=========================================================
Aplica na loja o tema escolhido em
Módulo Administrativo > Configurações > Tema Visual
(gravado em abella/settings/theme).

Como funciona:
 1. Aplica NA HORA o último tema conhecido (localStorage),
    para a página já abrir com o visual certo, sem "piscar".
 2. Confere no Firebase (abella/settings/theme). Se mudou,
    troca o tema e atualiza o cache.
 3. Sem tema salvo => mantém o visual padrão (tokens.css).

Uso: incluir no <head>, logo DEPOIS de components/index.css,
para que o tema sobrescreva os componentes e as <style>
inline de cada página continuem tendo a última palavra.
=========================================================
*/
(function () {
    'use strict';

    var VALID_THEMES = ['modern', 'luxury', 'minimal', 'dark'];
    var FILES = ['theme.css', 'header.css', 'cards.css', 'buttons.css',
                 'forms.css', 'modal.css', 'footer.css', 'animations.css'];
    var CACHE_KEY = 'abella_theme';
    var SETTINGS_THEME_PATH = 'abella/settings/theme';

    // Pasta /themes/ resolvida a partir do próprio script (funciona em qualquer página)
    var scriptEl = document.currentScript;
    var THEMES_BASE = scriptEl && scriptEl.src
        ? new URL('../../themes/', scriptEl.src).href
        : 'themes/';

    function isValid(t) { return VALID_THEMES.indexOf(t) !== -1; }

    function readCache() {
        try { return localStorage.getItem(CACHE_KEY) || ''; } catch (e) { return ''; }
    }
    function writeCache(t) {
        try {
            if (t) localStorage.setItem(CACHE_KEY, t);
            else localStorage.removeItem(CACHE_KEY);
        } catch (e) { /* storage indisponível: ignora */ }
    }

    var ThemeManager = {
        currentTheme: null,
        initialized: false,

        // Insere os <link> logo após components/index.css (antes das <style> inline)
        _anchor: function () {
            var links = document.head.querySelectorAll('link[rel="stylesheet"]');
            var anchor = null;
            for (var i = 0; i < links.length; i++) {
                if (/components\/index\.css/.test(links[i].getAttribute('href') || '')) anchor = links[i];
            }
            return anchor;
        },

        _removeLinks: function (exceptTheme) {
            document.head.querySelectorAll('link[data-abella-theme]').forEach(function (l) {
                if (l.dataset.abellaTheme !== exceptTheme) l.remove();
            });
        },

        _setAttr: function (theme) {
            if (theme) {
                document.documentElement.setAttribute('data-theme', theme);
                if (document.body) document.body.dataset.theme = theme;
            } else {
                document.documentElement.removeAttribute('data-theme');
                if (document.body) delete document.body.dataset.theme;
            }
        },

        // Aplica um tema (ou remove, se vazio/inválido => visual padrão)
        applyTheme: function (theme) {
            theme = isValid(theme) ? theme : '';
            if (this.currentTheme === theme) return;

            var previous = this.currentTheme;
            this.currentTheme = theme;

            if (!theme) {
                this._removeLinks(null);
                this._setAttr('');
                return;
            }

            var self = this;
            var anchor = this._anchor();
            var last = anchor;
            var pending = FILES.length;

            FILES.forEach(function (file) {
                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = THEMES_BASE + theme + '/' + file;
                link.dataset.abellaTheme = theme;
                link.dataset.file = file;

                // Só remove o tema anterior quando o novo terminou de carregar (sem "flash" sem estilo)
                var done = function () {
                    pending--;
                    if (pending === 0 && self.currentTheme === theme) self._removeLinks(theme);
                };
                link.addEventListener('load', done);
                link.addEventListener('error', done);

                if (last && last.parentNode) {
                    last.parentNode.insertBefore(link, last.nextSibling);
                } else {
                    document.head.appendChild(link);
                }
                last = link;
            });

            this._setAttr(theme);
            console.info('[ThemeManager] Tema aplicado:', theme, previous ? '(antes: ' + previous + ')' : '');
        },

        // Compatibilidade com a API anterior
        change: function (theme) { this.applyTheme(theme); },
        getTheme: function () { return this.currentTheme; },

        // Busca o tema salvo no admin
        _fetchRemote: function () {
            if (!window.db || typeof window.db.ref !== 'function') return Promise.resolve(undefined);
            return window.db.ref(SETTINGS_THEME_PATH).once('value')
                .then(function (snap) { return snap.exists() ? String(snap.val()).trim() : ''; })
                .catch(function (e) {
                    console.warn('[ThemeManager] Não foi possível ler o tema no Firebase:', e);
                    return undefined; // undefined = falha: mantém o que já está aplicado
                });
        },

        init: function () {
            if (this.initialized) return;
            this.initialized = true;

            // 1) Aplica imediatamente o tema em cache
            var cached = readCache();
            if (isValid(cached)) this.applyTheme(cached);

            // 2) Confere o tema oficial no Firebase
            var self = this;
            var sync = function () {
                self._fetchRemote().then(function (remote) {
                    if (remote === undefined) return;          // falha de rede: mantém
                    if (!isValid(remote)) remote = '';          // vazio/ inválido => padrão
                    writeCache(remote);
                    self.applyTheme(remote);
                    self._setAttr(self.currentTheme);           // garante data-theme no <body>
                });
            };

            if (document.readyState === 'loading') {
                // Os scripts do final do <body> (firebase-config.js) já terão rodado em DOMContentLoaded
                document.addEventListener('DOMContentLoaded', sync);
            } else {
                sync();
            }
        }
    };

    window.ThemeManager = ThemeManager;
    ThemeManager.init();
})();
