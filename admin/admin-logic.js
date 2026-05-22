// =========================================================================
// CONFIGURAÇÃO E INICIALIZAÇÃO GLOBAL DO FIREBASE
// =========================================================================

const firebaseConfig = {
    apiKey: "AIzaSyDPBZSxW8XjtQmDMUknzAyIlFda51MvMJY",
    authDomain: "catalogo-abella-joias.firebaseapp.com",
    databaseURL: "https://catalogo-abella-joias-default-rtdb.firebaseio.com",
    projectId: "catalogo-abella-joias",
    storageBucket: "catalogo-abella-joias.firebasestorage.app",
    messagingSenderId: "727568435294",
    appId: "1:727568435294:web:442c0179ecf0686dff4ccf"
};

try {

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }

} catch (firebaseError) {

    console.error(
        '❌ Erro ao inicializar Firebase:',
        firebaseError
    );

}

const db = firebase.database();

// =========================================================================
// ESTADO GLOBAL CONTROLADO
// =========================================================================

const APP_STATE = {

    abaAtual: null,

    carregandoModulo: false,

    listeners: {},

    cache: {
        produtos: {},
        categorias: {},
        pedidos: {},
        galvanicas: {}
    }

};

// =========================================================================
// CACHE GLOBAL DO EDITOR IA
// =========================================================================

window._PRODUTOS_LOTE_CACHE = {};
window._FILA_PROCESSAMENTO = [];
window._INDICE_ATUAL_FILA = 0;

// =========================================================================
// HELPERS
// =========================================================================

function obterContainerPrincipal() {
    return document.getElementById('conteudo-dinamico');
}

function definirLoading(texto = 'Carregando módulo...') {

    const container = obterContainerPrincipal();

    if (!container) return;

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[300px] text-zinc-500 gap-4">
            <div class="w-10 h-10 border-2 border-[#333] border-t-[#caa85c] rounded-full animate-spin"></div>
            <div class="text-xs uppercase tracking-[0.25em] text-zinc-600 font-semibold">
                ${texto}
            </div>
        </div>
    `;
}

function definirErro(texto = 'Erro ao carregar módulo.') {

    const container = obterContainerPrincipal();

    if (!container) return;

    container.innerHTML = `
        <div class="bg-red-950/20 border border-red-900 text-red-400 rounded-2xl p-6 text-xs font-mono">
            ❌ ${texto}
        </div>
    `;
}

function resetarBotoesMenu() {

    document
        .querySelectorAll('#menu-navegacao .tab-btn')
        .forEach(btn => {

            btn.classList.remove(
                'active',
                'bg-[#caa85c]',
                'text-black'
            );

            btn.classList.add(
                'bg-zinc-900',
                'text-gray-400'
            );
        });
}

function ativarBotaoMenu(aba) {

    const btn = document.getElementById(`btn-${aba}`);

    if (!btn) return;

    btn.classList.remove(
        'bg-zinc-900',
        'text-gray-400'
    );

    btn.classList.add(
        'active',
        'bg-[#caa85c]',
        'text-black'
    );
}

function limparListenersAtivos() {

    try {

        Object.values(APP_STATE.listeners).forEach(refInfo => {

            if (
                refInfo &&
                refInfo.ref &&
                refInfo.callback
            ) {

                refInfo.ref.off(
                    'value',
                    refInfo.callback
                );
            }
        });

        APP_STATE.listeners = {};

    } catch (e) {

        console.warn(
            '⚠️ Erro ao limpar listeners:',
            e
        );
    }
}

function registrarListener(nome, ref, callback) {

    if (!nome || !ref || !callback) return;

    try {

        if (APP_STATE.listeners[nome]) {

            const antigo = APP_STATE.listeners[nome];

            antigo.ref.off(
                'value',
                antigo.callback
            );
        }

        ref.on('value', callback);

        APP_STATE.listeners[nome] = {
            ref,
            callback
        };

    } catch (e) {

        console.error(
            `❌ Falha ao registrar listener [${nome}]`,
            e
        );
    }
}

// =========================================================================
// ROTEADOR PRINCIPAL DE ABAS
// =========================================================================

(function () {

    const funcaoOriginal = window.mudarAbaDinamica;

    window.mudarAbaDinamica = async function (aba) {

        try {

            if (!aba) return;

            if (APP_STATE.carregandoModulo) return;

            APP_STATE.carregandoModulo = true;

            APP_STATE.abaAtual = aba;

            const container = obterContainerPrincipal();

            if (!container) {
                console.error('Container principal não encontrado.');
                return;
            }

            resetarBotoesMenu();
            ativarBotaoMenu(aba);

            definirLoading(
                `Inicializando módulo ${aba}...`
            );

            limparListenersAtivos();

            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            if (aba === 'editor') {

                container.classList.remove('p-8');

                await carregarTemplateEditorIA(container);

            } else {

                if (!container.classList.contains('p-8')) {
                    container.classList.add('p-8');
                }

                if (
                    typeof funcaoOriginal === 'function' &&
                    funcaoOriginal !== window.mudarAbaDinamica
                ) {

                    try {

                        await funcaoOriginal(aba);

                    } catch (e) {

                        console.warn(
                            '⚠️ Falha na função original. Usando fallback...',
                            e
                        );

                        await executarMapeamentoFallback(
                            aba,
                            container
                        );
                    }

                } else {

                    await executarMapeamentoFallback(
                        aba,
                        container
                    );
                }
            }

        } catch (erroGeral) {

            console.error(
                '❌ Erro crítico no roteador:',
                erroGeral
            );

            definirErro(
                erroGeral.message ||
                'Falha inesperada.'
            );

        } finally {

            APP_STATE.carregandoModulo = false;
        }
    };

})();

// =========================================================================
// ROTEADOR FALLBACK DOS MÓDULOS
// =========================================================================

async function executarMapeamentoFallback(aba, container) {

    if (!container) return;

    switch (aba) {

        case 'pedidos':

            if (typeof window.carregarPedidos === 'function') {

                window.carregarPedidos();

            } else if (typeof window.listarPedidos === 'function') {

                window.listarPedidos();

            } else if (
                typeof window.inicializarPainelPedidos === 'function'
            ) {

                container.innerHTML = `
                    <div class="space-y-4">
                        <h2 class="text-xl font-bold text-white flex items-center gap-2">
                            📦 Pedidos Recebidos
                        </h2>

                        <div class="text-zinc-500 italic text-xs animate-pulse">
                            Sincronizando pedidos com Firebase...
                        </div>
                    </div>
                `;

                window.inicializarPainelPedidos();

            } else {

                definirErro(
                    'Módulo de pedidos indisponível.'
                );
            }

            break;

        case 'produtos':

            if (typeof window.carregarProdutos === 'function') {

                window.carregarProdutos();

            } else if (typeof window.listarProdutos === 'function') {

                window.listarProdutos();

            } else {

                definirErro(
                    'Módulo de produtos indisponível.'
                );
            }

            break;

        case 'ofertas':

            if (typeof window.carregarOfertas === 'function') {

                window.carregarOfertas();

            } else {

                definirErro(
                    'Módulo de ofertas indisponível.'
                );
            }

            break;

        case 'galvanicas':

            if (typeof window.carregarGalvanicas === 'function') {

                window.carregarGalvanicas();

            } else {

                definirErro(
                    'Módulo de galvânicas indisponível.'
                );
            }

            break;

        case 'categorias':

            if (typeof window.carregarCategorias === 'function') {

                window.carregarCategorias();

            } else {

                definirErro(
                    'Módulo de categorias indisponível.'
                );
            }

            break;

        case 'config':

            if (typeof window.carregarConfiguracoes === 'function') {

                window.carregarConfiguracoes();

            } else {

                definirErro(
                    'Módulo de configurações indisponível.'
                );
            }

            break;

        default:

            container.innerHTML = `
                <div class="flex items-center justify-center min-h-[250px] text-zinc-500 italic text-xs">
                    Módulo [${String(aba).toUpperCase()}] inicializando...
                </div>
            `;
    }
}

// =========================================================================
// CARREGAMENTO DO TEMPLATE DO EDITOR IA
// =========================================================================

async function carregarTemplateEditorIA(targetContainer) {

    if (!targetContainer) return;

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 15000);

    try {

        const response = await fetch(
            `https://abellajoiasim-maker.github.io/catalogo/modulo/image-editor.html?v=${Date.now()}`,
            {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {

            throw new Error(
                `Servidor retornou ${response.status}`
            );
        }

        const html = await response.text();

        if (!html || html.length < 50) {

            throw new Error(
                'Template vazio ou corrompido.'
            );
        }

        targetContainer.innerHTML = html;

        if (
            typeof window.inicializarMapeamentoLote === 'function'
        ) {

            try {

                window.inicializarMapeamentoLote();

            } catch (e) {

                console.warn(
                    '⚠️ Erro ao iniciar lote:',
                    e
                );
            }
        }

    } catch (err) {

        console.error(
            '❌ Falha no editor IA:',
            err
        );

        definirErro(
            `Falha ao carregar image-editor.html: ${err.message}`
        );

    } finally {

        clearTimeout(timeout);
    }
}

// =========================================================================
// CONTROLE DE CICLO DE VIDA
// =========================================================================

window.addEventListener(
    'beforeunload',
    limparListenersAtivos
);

// =========================================================================
// BOOTSTRAP INICIAL
// =========================================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        try {

            if (
                typeof window.mudarAbaDinamica === 'function'
            ) {

                window.mudarAbaDinamica('pedidos');
            }

        } catch (e) {

            console.error(
                '❌ Erro ao iniciar painel:',
                e
            );

            definirErro(
                'Falha ao iniciar sistema administrativo.'
            );
        }
    },
    { once: true }
);
