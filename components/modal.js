/*
==========================================================
ABELLA JOIAS — LUXURY EXPERIENCE V11 (Project AURORA)
Sprint 1 — Component Library
Componente: Modal (controlador JS)

Arquivo:
components/modal.js

Um único modal na página (#auroraModal). Todo conteúdo
(produto, confirmação, aviso) passa por AuroraModal.open(),
que troca título/corpo/rodapé sem criar um modal novo.
==========================================================
*/

(function () {
    'use strict';

    function getOverlay() {
        return document.getElementById('auroraModal');
    }

    const AuroraModal = {
        open({ title = '', bodyHTML = '', footerHTML = '' } = {}) {
            const overlay = getOverlay();
            if (!overlay) {
                console.warn('[AuroraModal] Elemento #auroraModal não encontrado na página.');
                return;
            }
            const titleEl = document.getElementById('auroraModalTitle');
            const bodyEl = document.getElementById('auroraModalBody');
            const footerEl = document.getElementById('auroraModalFooter');

            if (titleEl) titleEl.textContent = title;
            if (bodyEl) bodyEl.innerHTML = bodyHTML;
            if (footerEl) footerEl.innerHTML = footerHTML;

            overlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        },

        close() {
            const overlay = getOverlay();
            if (!overlay) return;
            overlay.classList.remove('is-open');
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'auroraModal') {
            AuroraModal.close();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') AuroraModal.close();
    });

    window.AuroraModal = AuroraModal;
})();
