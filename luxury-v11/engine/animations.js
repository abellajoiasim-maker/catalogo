/*
==========================================================
ABELLA JOIAS — LUXURY EXPERIENCE V11 (Project AURORA)
Sprint 2 — Luxury UI Engine
Módulo: Animations

Arquivo:
luxury-v11/engine/animations.js

Regra do documento mestre (item 10):
"Duração: 150ms, 250ms, 350ms, 500ms. Nunca 2 segundos."

Todas as durações aqui usam exatamente os tokens definidos em
tokens.css — nenhum valor novo é inventado.
==========================================================
*/

(function () {
    'use strict';

    // ================= REVEAL ON SCROLL =================
    // Aplica em qualquer elemento com [data-aurora-reveal]

    function initReveal() {
        const alvos = document.querySelectorAll('[data-aurora-reveal]');
        if (!alvos.length) return;

        if (!('IntersectionObserver' in window)) {
            alvos.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        alvos.forEach(el => observer.observe(el));
    }

    // ================= RIPPLE NOS BOTÕES =================
    // Aplica em qualquer .aurora-btn automaticamente

    function initRipple() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.aurora-btn');
            if (!btn) return;

            const circle = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);

            circle.style.cssText = `
                position:absolute;
                width:${size}px; height:${size}px;
                left:${e.clientX - rect.left - size / 2}px;
                top:${e.clientY - rect.top - size / 2}px;
                background:rgba(255,255,255,.35);
                border-radius:50%;
                transform:scale(0);
                pointer-events:none;
                animation: aurora-ripple var(--duration-slower) var(--ease);
            `;

            const posicaoOriginal = getComputedStyle(btn).position;
            if (posicaoOriginal === 'static') btn.style.position = 'relative';
            btn.style.overflow = 'hidden';

            btn.appendChild(circle);
            circle.addEventListener('animationend', () => circle.remove());
        });
    }

    // Keyframe do ripple injetado uma única vez
    function injectRippleKeyframes() {
        if (document.getElementById('aurora-ripple-keyframes')) return;
        const style = document.createElement('style');
        style.id = 'aurora-ripple-keyframes';
        style.textContent = `
            @keyframes aurora-ripple {
                to { transform: scale(2.6); opacity: 0; }
            }
            [data-aurora-reveal]{
                opacity: 0;
                transform: translateY(18px);
                transition: opacity var(--duration-slower) var(--ease),
                            transform var(--duration-slower) var(--ease);
            }
            [data-aurora-reveal].is-visible{
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectRippleKeyframes();
        initReveal();
        initRipple();
    });

    window.AuroraAnimations = { initReveal, initRipple };
})();
