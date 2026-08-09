/*
==========================================================
ABELLA JOIAS — LUXURY EXPERIENCE V11 (Project AURORA)
Sprint 2 — Luxury UI Engine
Módulo: Mobile Navigation

Arquivo:
engine/mobile-nav.js

Problema que resolve:
No Header (Sprint 1), ".nav-links" simplesmente desaparece no
celular (regra de responsividade), sem nenhum substituto — ou
seja, no mobile, hoje não existe como navegar entre Coleções /
Galvânicas / Sob Encomenda.

Este módulo cria um botão hambúrguer (só aparece no mobile via
CSS) e abre o menu dentro do Drawer já existente do Sprint 1 —
sem inventar um componente novo de menu.

Depende de: drawer.css, header.css
==========================================================
*/

(function () {
    'use strict';

    function buildMobileDrawer(navLinksHTML) {
        if (document.getElementById('auroraMobileNav')) return;

        const overlay = document.createElement('div');
        overlay.className = 'aurora-drawer-overlay';
        overlay.id = 'auroraMobileNav';
        overlay.innerHTML = `
            <div class="aurora-drawer" style="right:0;">
                <div class="header">
                    <p class="title">Menu</p>
                    <button class="close-btn" id="auroraMobileNavClose">✕</button>
                </div>
                <div class="body">
                    <nav style="display:flex; flex-direction:column; gap: var(--space-5); font-size:14px; letter-spacing:.08em; text-transform:uppercase;">
                        ${navLinksHTML}
                    </nav>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('is-open');
        });
        document.getElementById('auroraMobileNavClose').addEventListener('click', () => {
            overlay.classList.remove('is-open');
        });
    }

    function initMobileNav() {
        const header = document.querySelector('.aurora-header');
        if (!header) return;

        const navLinks = header.querySelector('.nav-links');
        const actions = header.querySelector('.actions');
        if (!navLinks || !actions) return;

        buildMobileDrawer(navLinks.innerHTML);

        const toggle = document.createElement('button');
        toggle.className = 'aurora-mobile-toggle';
        toggle.setAttribute('aria-label', 'Abrir menu');
        toggle.innerHTML = '☰';
        toggle.style.cssText = `
            display: none;
            width: 40px; height: 40px;
            background: transparent; border: none; cursor: pointer;
            font-size: 20px; color: var(--color-text);
        `;
        toggle.addEventListener('click', () => {
            document.getElementById('auroraMobileNav').classList.add('is-open');
        });

        actions.prepend(toggle);

        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px){
                .aurora-mobile-toggle{ display: flex !important; align-items:center; justify-content:center; }
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', initMobileNav);

    window.AuroraMobileNav = { init: initMobileNav };
})();
