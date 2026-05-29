// ==========================================================================
// ARQUIVO: js/services/categoriaService.js
// CORRIGIDO: 3 bugs críticos que tornavam este serviço completamente inoperante:
//
// 1. Nó errado: usava database.ref('categorias') mas o projeto grava em
//    'abella/categories'. Nenhuma categoria era retornada — array sempre vazio.
//
// 2. Variável errada: usava `database` (do firebase-config.js antigo que
//    exportava `const database = firebase.database()`) mas na nova estrutura
//    do projeto o padrão é `firebase.database()` ou `window.db`. Ajustado
//    para usar firebase.database() diretamente com guard de inicialização.
//
// 3. Campos errados: mapeava `dados[key]` diretamente, mas o projeto agora
//    usa name/image (não nome/imagem). Adicionada normalização de campos para
//    garantir compatibilidade com ambas as versões do banco.
// ==========================================================================

const CategoriaService = {

    /**
     * Obtém todas as categorias-mãe (sem parentId) do nó correto abella/categories.
     * @returns {Promise<Array>} Lista de categorias mapeadas com campos normalizados.
     */
    async obterTodas() {
        return new Promise((resolve) => {
            // CORRIGIDO: nó correto é 'abella/categories', não 'categorias'
            const db = (typeof firebase !== 'undefined' && firebase.apps.length)
                ? firebase.database()
                : null;

            if (!db) {
                console.error('[CategoriaService] Firebase não inicializado.');
                resolve([]);
                return;
            }

            db.ref('abella/categories').once('value', (snapshot) => {
                const dados = snapshot.val();
                if (!dados) { resolve([]); return; }

                const lista = Object.keys(dados)
                    .map(key => {
                        const cat = dados[key];
                        return {
                            id:     key,
                            // Normaliza ambos os campos para compatibilidade
                            name:   cat.name   || cat.nome  || key,
                            nome:   cat.name   || cat.nome  || key,
                            image:  cat.image  || cat.imagem || '',
                            imagem: cat.image  || cat.imagem || '',
                            slug:   cat.slug   || key,
                            paused: cat.paused || false,
                            subcategories: cat.subcategories || null,
                            ...cat
                        };
                    })
                    // Filtra subcategorias (parentId) e pausadas para o catálogo público
                    .filter(cat => !cat.parentId && !cat.paused);

                resolve(lista);
            });
        });
    },

    /**
     * Obtém uma categoria específica pelo seu slug/ID.
     * @param {string} id - Slug da categoria (ex: 'aneis', 'brincos').
     * @returns {Promise<Object|null>}
     */
    async obterPorId(id) {
        return new Promise((resolve) => {
            const db = (typeof firebase !== 'undefined' && firebase.apps.length)
                ? firebase.database()
                : null;

            if (!db) { resolve(null); return; }

            // CORRIGIDO: nó correto é 'abella/categories', não 'categorias'
            db.ref(`abella/categories/${id}`).once('value', (snapshot) => {
                const cat = snapshot.val();
                if (!cat) { resolve(null); return; }
                resolve({
                    id,
                    name:   cat.name   || cat.nome  || id,
                    nome:   cat.name   || cat.nome  || id,
                    image:  cat.image  || cat.imagem || '',
                    imagem: cat.image  || cat.imagem || '',
                    slug:   cat.slug   || id,
                    paused: cat.paused || false,
                    subcategories: cat.subcategories || null,
                    ...cat
                });
            });
        });
    }
};
