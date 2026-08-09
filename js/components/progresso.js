// ======================================================================
// js/components/progresso.js
// Abella Joias - ProgressoComponent v3.0
// Auditoria Forense Firebase + Refatoração Arquitetural
// ======================================================================

const ProgressoComponent = {

    _overlayId:
        'global-progress-overlay',

    _textId:
        'global-progress-text',

    _visible:
        false,

    // ==========================================================
    // HELPERS
    // ==========================================================

    _safeString(
        value = ''
    ) {

        return String(
            value || ''
        ).trim();

    },

    _getOverlay() {

        return document.getElementById(
            this._overlayId
        );

    },

    _getTextElement() {

        return document.getElementById(
            this._textId
        );

    },

    // ==========================================================
    // CRIAR OVERLAY
    // ==========================================================

    _createOverlay() {

        try {

            let overlay =
                this._getOverlay();

            if (overlay) {

                return overlay;

            }

            overlay =
                document.createElement(
                    'div'
                );

            overlay.id =
                this._overlayId;

            overlay.className = `

                fixed
                inset-0
                bg-black/80
                backdrop-blur-sm
                z-[9999]
                flex
                flex-col
                items-center
                justify-center
                space-y-4
                font-sans
                transition-opacity
                duration-200

            `
                .replace(/\s+/g, ' ')
                .trim();

            overlay.setAttribute(
                'aria-live',
                'polite'
            );

            overlay.setAttribute(
                'aria-busy',
                'true'
            );

            overlay.innerHTML = `

                <div
                    class="
                        w-12
                        h-12
                        border-4
                        border-[#caa85c]/20
                        border-t-[#caa85c]
                        rounded-full
                        animate-spin
                    "
                ></div>

                <p
                    id="${this._textId}"
                    class="
                        text-xs
                        font-mono
                        tracking-widest
                        text-gray-300
                        uppercase
                        animate-pulse
                        text-center
                        px-6
                    "
                >
                    Processando...
                </p>

            `;

            document.body.appendChild(
                overlay
            );

            return overlay;

        } catch (error) {

            console.error(
                '[ProgressoComponent:_createOverlay]',
                error
            );

            return null;

        }

    },

    // ==========================================================
    // SHOW
    // ==========================================================

    show(
        message =
            'Processando requisição...'
    ) {

        try {

            const overlay =
                this._createOverlay();

            if (!overlay) {

                return;

            }

            const textElement =
                this._getTextElement();

            if (textElement) {

                textElement.textContent =
                    this._safeString(
                        message
                    ) ||
                    'Processando...';

            }

            overlay.classList.remove(
                'hidden'
            );

            this._visible = true;

        } catch (error) {

            console.error(
                '[ProgressoComponent:show]',
                error
            );

        }

    },

    // ==========================================================
    // HIDE
    // ==========================================================

    hide() {

        try {

            const overlay =
                this._getOverlay();

            if (!overlay) {

                return;

            }

            overlay.classList.add(
                'hidden'
            );

            this._visible = false;

        } catch (error) {

            console.error(
                '[ProgressoComponent:hide]',
                error
            );

        }

    },

    // ==========================================================
    // TOGGLE
    // ==========================================================

    toggle(
        force = null
    ) {

        if (
            typeof force ===
            'boolean'
        ) {

            return force
                ? this.show()
                : this.hide();

        }

        return this._visible
            ? this.hide()
            : this.show();

    },

    // ==========================================================
    // UPDATE MESSAGE
    // ==========================================================

    updateMessage(
        message = ''
    ) {

        try {

            const textElement =
                this._getTextElement();

            if (!textElement) {

                return;

            }

            textElement.textContent =
                this._safeString(
                    message
                );

        } catch (error) {

            console.error(
                '[ProgressoComponent:updateMessage]',
                error
            );

        }

    },

    // ==========================================================
    // DESTROY
    // ==========================================================

    destroy() {

        try {

            const overlay =
                this._getOverlay();

            if (
                overlay &&
                overlay.parentNode
            ) {

                overlay.parentNode
                    .removeChild(
                        overlay
                    );

            }

            this._visible = false;

        } catch (error) {

            console.error(
                '[ProgressoComponent:destroy]',
                error
            );

        }

    }

};

// ==========================================================
// EXPORTS GLOBAIS
// ==========================================================

window.ProgressoComponent =
    ProgressoComponent;

window.progressoComponent =
    ProgressoComponent;

// ==========================================================
// LOG
// ==========================================================

console.log(
    '⏳ ProgressoComponent v3.0 carregado.'
);
