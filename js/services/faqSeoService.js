// ======================================================================
// js/services/faqSeoService.js
// SEO IQ200 — FAQ Schema (FAQPage) 100% gratuito
// Lê abella/seo_faq no Firebase Realtime Database. Se estiver vazio,
// usa um conjunto padrão de perguntas coerente com abella/settings
// (parcelamento, PIX, WhatsApp) para nunca ficar sem conteúdo.
// ======================================================================

(function () {
    'use strict';

    const FAQ_PATH = 'abella/seo_faq';

    function faqsPadrao(settings) {
        const parcelas = settings?.parcelasMax || 6;
        const pix = settings?.pixDesc || 5;

        return [
            {
                pergunta: 'A Abella Joias vende no atacado ou no varejo?',
                resposta: 'A Abella Joias trabalha exclusivamente com venda no atacado de semijoias e joias no bruto, direto de fábrica em Limeira-SP.'
            },
            {
                pergunta: 'Existe pedido mínimo para comprar no atacado?',
                resposta: 'Não trabalhamos com pedido mínimo! Na Abella Joias você pode comprar exatamente a quantidade que precisa, seja para testar modelos ou repor o seu estoque'
            },
            {
                pergunta: 'Quais as formas de pagamento aceitas?',
                resposta: `Aceitamos PIX (com ${pix}% de desconto) e parcelamento em até ${parcelas}x no cartão.`
            },
            {
                pergunta: 'As peças são banhadas ou folheadas?',
                resposta: 'Nossas peças são vendidas totalmente no bruto (sem banho), permitindo que você escolha o padrão de acabamento e a espessura de galvanoplastia ideais para a sua marca.'
            },
            {
                pergunta: 'Como faço um pedido no catálogo?',
                resposta: 'Basta navegar pelas categorias, montar seu carrinho e finalizar o pedido — nossa equipe entra em contato pelo WhatsApp para confirmar pagamento e entrega.'
            }
        ];
    }

    async function obterFaqs() {
        try {
            if (!window.db) return faqsPadrao();
            const snap = await window.db.ref(FAQ_PATH).once('value');
            const raw = snap.val();

            if (Array.isArray(raw) && raw.length > 0) {
                return raw.filter(f => f && f.pergunta && f.resposta);
            }
            if (raw && typeof raw === 'object') {
                const lista = Object.values(raw).filter(f => f && f.pergunta && f.resposta);
                if (lista.length > 0) return lista;
            }

            // Sem conteúdo cadastrado ainda — usa padrão coerente com as settings atuais
            let settings = null;
            try {
                settings = window.ConfigService ? await window.ConfigService.getSettings() : null;
            } catch (_) { /* segue com padrão sem settings */ }

            return faqsPadrao(settings);
        } catch (error) {
            console.error('[SEO IQ200] [FaqSeoService] Falha ao ler FAQ:', error);
            return faqsPadrao();
        }
    }

    async function salvarFaqs(lista) {
        try {
            if (!window.db) return false;
            await window.db.ref(FAQ_PATH).set(lista || []);
            return true;
        } catch (error) {
            console.error('[SEO IQ200] [FaqSeoService] Falha ao salvar FAQ:', error);
            return false;
        }
    }

    window.FaqSeoService = Object.freeze({ obterFaqs, salvarFaqs, FAQ_PATH });
})();
