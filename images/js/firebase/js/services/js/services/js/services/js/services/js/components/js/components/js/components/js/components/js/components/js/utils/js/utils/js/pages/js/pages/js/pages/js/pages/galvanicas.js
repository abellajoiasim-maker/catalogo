import { db } from '../utils/firebase-medusa.js';

export function initGalvanicas() {
    const gridGalvanicas = document.getElementById('gridGalvanicas');
    
    if (!gridGalvanicas) return;

    db.ref('galvanicas').on('value', snap => {
        gridGalvanicas.innerHTML = "";
        
        if (!snap.exists()) {
            gridGalvanicas.innerHTML = "<p class='text-center col-span-full text-gray-500 py-10'>Nenhuma galvânica homologada encontrada no momento.</p>";
            return;
        }

        snap.forEach(child => {
            const g = child.val();
            gridGalvanicas.innerHTML += `
                <div class="card">
                    <div>
                        ${g.selo ? `<div class="selo-parceiro">${g.selo}</div>` : ''}
                        <div class="card-logo">
                            <img src="${g.imagem || 'https://via.placeholder.com/300x150?text=Logo+Indisponível'}" alt="${g.nome}" loading="lazy">
                        </div>
                        <h2 class="serif">${g.nome}</h2>
                        <div class="info-row"><b>Endereço:</b> ${g.endereco || 'Consultar endereço com consultor'}</div>
                        ${g.telefone ? `<div class="info-row"><b>Fixo:</b> ${g.telefone}</div>` : ''}
                    </div>
                    <div>
                        <a href="https://wa.me/${g.whatsapp}?text=Olá%20${g.nome}.%20Sou%20cliente%20da%20Abella%20Joias..." target="_blank" class="whatsapp-link">
                            WhatsApp 📲
                        </a>
                        <div class="slogan">${g.descricao || 'Parceiro homologado Abella Joias.'}</div>
                    </div>
                </div>
            `;
        });
    });
}