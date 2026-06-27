// ======================================================================
// js/services/stateManager.js
// Abella Joias - StateManager v8.0 (Arquitetura PMA V8)
// Centralizador de Estado Reativo e Barramento de Eventos Unificado
// ======================================================================

(function () {
    'use strict';

    // Repositório privado de dados em tempo de execução
    const _state = {
        store: { id: 'abella', nome: 'Abella Joias' },
        catalog: { produtos: [], categorias: [], configuracoes: {} },
        cart: [],
        filters: { categoriaAtiva: null, subcategoriaAtiva: null, busca: '', ordenacao: 'padrao' },
        ui: { loadingGlobal: false, painelEditorAtivo: false }
    };

    // Coleção estruturada de ouvintes vinculados por fatias de estado
    const _listeners = new Map();

    /**
     * Compara de forma rasa ou profunda se dois estados são estritamente iguais
     * para evitar disparos desnecessários no ecossistema de UI.
     */
    const _hasChanged = function (oldVal, newVal) {
        if (typeof oldVal !== typeof newVal) return true;
        if (typeof oldVal !== 'object' || oldVal === null) return oldVal !== newVal;
        return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    };

    const StateManager = {

        /**
         * Retorna uma cópia isolada de uma fatia específica do estado global
         * @param {string} key - Identificador do nó de estado
         */
        getState(key) {
            if (!(key in _state)) {
                console.warn(`[PMA V8] [StateManager] Tentativa de leitura em chave inexistente: "${key}"`);
                return undefined;
            }
            return structuredClone(_state[key]);
        },

        /**
         * Atualiza atomicamente uma fatia de estado e notifica os assinantes se houver mutação real
         * @param {string} key - Identificador do nó de estado
         * @param {*} newValue - Novo payload de dados ou objeto de atualização parcial
         */
        setState(key, newValue) {
            if (!(key in _state)) {
                console.warn(`[PMA V8] [StateManager] Injeção dinâmica de nova chave de estado rejeitada: "${key}"`);
                return false;
            }

            const oldValue = _state[key];
            let resolvedValue;

            // Suporta mesclagem parcial se o estado atual e o novo forem objetos puros (não arrays)
            if (typeof oldValue === 'object' && oldValue !== null && !Array.isArray(oldValue) && 
                typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
                resolvedValue = { ...oldValue, ...newValue };
            } else {
                resolvedValue = newValue;
            }

            // Valida se houve modificação real para mitigar gargalos de re-render
            if (!_hasChanged(oldValue, resolvedValue)) {
                return false;
            }

            // Armazena e congela o novo estado para prevenir mutações externas diretas
            _state[key] = typeof resolvedValue === 'object' && resolvedValue !== null 
                ? Object.freeze(resolvedValue) 
                : resolvedValue;

            // Dispara notificações em cascata para a lista de ouvintes indexados
            if (_listeners.has(key)) {
                const clonedState = structuredClone(_state[key]);
                _listeners.get(key).forEach(callback => {
                    try {
                        callback(clonedState);
                    } catch (error) {
                        console.error(`[PMA V8] [StateManager] Falha na execução de listener para chave "${key}":`, error);
                    }
                });
            }

            return true;
        },

        /**
         * Registra um ouvinte para interceptar alterações em um nó de dados específico
         * @param {string} key - Identificador do nó de estado
         * @param {function} callback - Função acionada no disparo da mutação
         */
        subscribe(key, callback) {
            if (!(key in _state)) {
                console.error(`[PMA V8] [StateManager] Assinatura bloqueada. Chave inválida: "${key}"`);
                return false;
            }
            if (typeof callback !== 'function') {
                console.error(`[PMA V8] [StateManager] Listener fornecido precisa ser uma função executável.`);
                return false;
            }

            if (!_listeners.has(key)) {
                _listeners.set(key, new Set());
            }

            _listeners.get(key).add(callback);

            // Executa um disparo síncrono imediato com o estado atual para sincronização de inicialização
            callback(structuredClone(_state[key]));
            return true;
        },

        /**
         * Remove o registro de um ouvinte para mitigar estouros de alocação de memória
         * @param {string} key - Identificador do nó de estado
         * @param {function} callback - Referência da função cadastrada anteriormente
         */
        unsubscribe(key, callback) {
            if (_listeners.has(key)) {
                const set = _listeners.get(key);
                set.delete(callback);
                if (set.size === 0) {
                    _listeners.delete(key);
                }
                return true;
            }
            return false;
        },

        /**
         * Restaura todas as chaves operacionais para seus valores originais de fábrica
         */
        resetToFactory() {
            this.setState('cart', []);
            this.setState('filters', { categoriaAtiva: null, subcategoriaAtiva: null, busca: '', ordenacao: 'padrao' });
            this.setState('ui', { loadingGlobal: false, painelEditorAtivo: false });
            console.info('[PMA V8] [StateManager] Estado operacional limpo para os padrões de fábrica da Abella Joias.');
        }
    };

    // CONGELAMENTO DA CAMADA DO SERVIÇO NO ESCOPO WINDOW DE FORMA IMUTÁVEL
    Object.defineProperty(window, 'StateManager', {
        value: Object.freeze(StateManager),
        writable: false,
        configurable: false
    });

    console.info('[PMA V8] [StateManager] Orquestrador reativo de estados globais ativado para Abella Joias.');
})();
