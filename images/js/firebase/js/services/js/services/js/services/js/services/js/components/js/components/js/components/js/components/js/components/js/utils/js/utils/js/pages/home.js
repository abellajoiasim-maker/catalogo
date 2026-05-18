import { db, fetchCompanySettings, fetchCategories, fetchPromoSettings } from '../utils/firebase-medusa.js';
import { formatCurrency } from '../utils/helpers.js';

export async function initHome() {
    const nomeEl = document.getElementById('nome');
    const sloganEl = document.getElementById('slogan');
    const parcelamentoEl = document.getElementById('parcelamento');
    const pixEl = document.getElementById('pix');
    const whatsEl = document.getElementById('whats');
    const bannerEl = document.getElementById('banner');
    const bannerTextoEl = document.getElementById('bannerTexto');
    const gridEl = document.getElementById('grid');

    // 1. Carrega as Configurações Globais da Empresa e Promoções
    const [emp, promo] = await Promise.all([
        fetchCompanySettings(),
        fetchPromoSettings()
    ]);

    if (nomeEl) nomeEl.innerText = emp.nome || "Abella Joias";
    if (sloganEl) sloganEl.innerText = emp.slogan || "";
    if (parcelamentoEl) parcelamentoEl.innerText = `Até ${emp.parcelas || 1}x no cartão`;
    if (pixEl) pixEl.innerText = `${emp.pix || 0}% OFF no PIX`;
    if (whatsEl && emp.whatsapp) whatsEl.href = `https://wa.me/${emp.whatsapp}`;

    // 2. Banner de Ofertas Ativo
    if (promo && promo.ativa && bannerEl && bannerTextoEl) {
        bannerEl.classList.remove('hidden');
        bannerTextoEl.innerText = promo.texto || "Promoção ativa";
    }

    // 3. Renderização Dinâmica de Categorias (Coleções)
    fetchCategories((cats) => {
        if (!gridEl) return;
        gridEl.innerHTML = '';
        
        Object.entries(cats).forEach(([id, cat]) => {
            if (cat.paused) return;
            
            const promoTag = cat.promoAtiva 
                ? `<span class="badge" style="background:${cat.promoColor || '#caa85c'}">${cat.promoTag || 'OFERTA'}</span>` 
                : '';
                
            gridEl.innerHTML += `
                <div class="card relative cursor-pointer" onclick="location.href='produtos.html?id=${id}'">
                    ${promoTag}
                    <img src="${cat.image}" class="w-full aspect-square object-cover" loading="lazy">
                    <div class="p-4">
                        <h3 class="font-bold">${cat.name}</h3>
                        <p class="text-xs text-gray-400 mt-1">Clique para ver modelos</p>
                    </div>
                </div>
            `;
        });
    });
}