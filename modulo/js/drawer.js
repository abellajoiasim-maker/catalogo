/**
 * Módulo Drawer - Abella Joias / Luary Shop / Marcinha Semijoias
 * Gerenciamento centralizado do painel lateral responsivo
 */

export const Drawer = {
    elements: {
        container: null, // O overlay/fundo escuro
        panel: null,     // O corpo do painel deslizante
        title: null,     // Elemento do título
        body: null       // Container flex-1 onde entra o formulário
    },

    /**
     * Inicializa a estrutura do Drawer injetando o HTML dinamicamente no body,
     * se ele já não existir, e configura os listeners globais.
     */
    init() {
        // Evita duplicar a estrutura se o init for chamado mais de uma vez
        if (document.getElementById('global-drawer-container')) return;

        const drawerHtml = `
            <div id="global-drawer-container" class="fixed inset-0 z-50 hidden transition-opacity duration-300 bg-black/60 opacity-0 backdrop-blur-sm flex justify-end">
                <div id="global-drawer-panel" class="h-full w-full sm:max-w-[500px] md:max-w-[900px] bg-[#09090b] border-l border-zinc-800 flex flex-col translate-x-full transition-transform duration-300 ease-out shadow-2xl">
                    <!-- Cabeçalho -->
                    <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
                        <h3 id="global-drawer-title" class="text-sm font-bold text-[#caa85c] uppercase tracking-wider"></h3>
                        <button id="global-drawer-close-btn" type="button" class="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-900 transition-colors">
                            <span class="text-xs font-bold mr-1">✕</span> FECHAR
                        </button>
                    </div>
                    <!-- Conteúdo Dinâmico com Scroll Embutido -->
                    <div id="global-drawer-body" class="flex-1 overflow-y-auto p-6 custom-scrollbar text-zinc-300"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', drawerHtml);

        // Mapeia os elementos na memória do objeto
        this.elements.container = document.getElementById('global-drawer-container');
        this.elements.panel = document.getElementById('global-drawer-panel');
        this.elements.title = document.getElementById('global-drawer-title');
        this.elements.body = document.getElementById('global-drawer-body');

        this._setupListeners();
    },

    /**
     * Abre o drawer com conteúdo e configurações específicas
     * @param {Object} params
     * @param {string} params.title - Título do painel
     * @param {string} params.content - HTML String do formulário/conteúdo
     * @param {string} [params.width] - Configuração opcional de largura máxima (ex: '600px')
     */
    open({ title, content, width }) {
        if (!this.elements.container) this.init();

        this.setTitle(title);
        this.setContent(content);

        // Ajusta largura customizada se fornecida (respeitando o limite responsivo)
        if (width && window.innerWidth > 640) {
            this.elements.panel.style.maxWidth = width;
        } else {
            this.elements.panel.style.maxWidth = ''; // Mantém classes padrões do Tailwind
        }

        // Remove o 'hidden' e aciona as transições de opacidade e movimento separadas por um frame
        this.elements.container.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            this.elements.container.classList.remove('opacity-0');
            this.elements.panel.classList.remove('translate-x-full');
        });
    },

    /**
     * Fecha o drawer executando as animações reversas de forma limpa
     */
    close() {
        if (!this.elements.container || this.elements.container.classList.contains('hidden')) return;

        this.elements.container.classList.add('opacity-0');
        this.elements.panel.classList.add('translate-x-full');

        // Aguarda os 300ms da animação do Tailwind antes de ocultar e limpar a árvore do DOM
        setTimeout(() => {
            this.elements.container.classList.add('hidden');
            this.clear();
        }, 300);
    },

    /**
     * Define o HTML interno do container de conteúdo
     * @param {string} html 
     */
    setContent(html) {
        if (this.elements.body) {
            this.elements.body.innerHTML = html;
        }
    },

    /**
     * Define o texto do título do topo do painel
     * @param {string} text 
     */
    setTitle(text) {
        if (this.elements.title) {
            this.elements.title.textContent = text;
        }
    },

    /**
     * Limpa o conteúdo interno para evitar vazamento de memória e travamento de inputs antigos
     */
    clear() {
        if (this.elements.body) this.elements.body.innerHTML = '';
        if (this.elements.title) this.elements.title.textContent = '';
    },

    /**
     * Configura escutadores de eventos privados (Overlay, Esc, Botão fechar)
     * @private
     */
    _setupListeners() {
        // Evento do botão fechar padrão
        document.getElementById('global-drawer-close-btn')?.addEventListener('click', () => this.close());

        // Fechamento ao clicar fora (Overlay)
        this.elements.container.addEventListener('click', (e) => {
            // Garante que o clique foi no fundo escuro e não dentro do formulário
            if (e.target === this.elements.container) {
                this.close();
            }
        });

        // Fechamento via Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.elements.container.classList.contains('hidden')) {
                this.close();
            }
        });
    }
};
