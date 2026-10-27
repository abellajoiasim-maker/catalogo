// scripts/generate-sitemap.mjs
// SEO IQ200 — Gerador de sitemap.xml
// Lê o Firebase Realtime Database (leitura pública, sem custo, sem API paga)
// e gera o sitemap.xml na raiz do projeto. Rodado via GitHub Actions.

import { writeFileSync } from 'fs';

const DB_URL = 'https://catalogo-abella-joias-default-rtdb.firebaseio.com';
const SITE_URL = 'https://catalogo.abellajoias.com.br';

async function fetchJson(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Falha ao ler ${path}: ${res.status}`);
  const data = await res.json();
  return data || {};
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  let date;
  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    let timestamp = Number(value);
    if (!Number.isFinite(timestamp)) return null;
    if (timestamp > 0 && timestamp < 1e12) timestamp *= 1000; // Unix seconds -> milliseconds
    date = new Date(timestamp);
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
function addLastmod(url, value) {
  const lastmod = toDate(value);
  return lastmod ? { ...url, lastmod } : url;
}

async function main() {
  const [categoriesRaw, productsRaw] = await Promise.all([
    fetchJson('abella/categories'),
    fetchJson('abella/products')
  ]);

  const products = Object.values(productsRaw || {});

  // Apenas produtos ativos e visíveis contam para mapear as combinações de categorias/subcategorias reais
  const produtosAtivos = products.filter(p => p && p.ativo !== false && p.paused !== true);

  const paresCategoriaSub = new Map(); // "categoria|subcategoria" -> lastmod mais recente
  const categoriasAtivas = new Map();  // "categoria" -> lastmod mais recente

  for (const p of produtosAtivos) {
    const cat = String(p.categoriaId || p.category || '').trim();
    const sub = String(p.subcategoriaId || p.subcategory || '').trim();
    const lastmod = p.updatedAt || p.createdAt || null;

    if (cat) {
      const atual = categoriasAtivas.get(cat) || null;
      if (lastmod !== null) categoriasAtivas.set(cat, Math.max(atual || 0, Number(lastmod) || new Date(lastmod).getTime()));
      else if (!categoriasAtivas.has(cat)) categoriasAtivas.set(cat, null);
    }
    if (cat && sub) {
      const chave = `${cat}|${sub}`;
      const atual = paresCategoriaSub.get(chave) || null;
      if (lastmod !== null) paresCategoriaSub.set(chave, Math.max(atual || 0, Number(lastmod) || new Date(lastmod).getTime()));
      else if (!paresCategoriaSub.has(chave)) paresCategoriaSub.set(chave, null);
    }
  }


  const urls = [];

  // 1. Páginas Estáticas Principais (Com prioridade impulsionada para Galvânicas)
  urls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' });
  urls.push({ loc: `${SITE_URL}/galvanicas.html`, priority: '0.85', changefreq: 'weekly' });

  // 2. Páginas de Categorias (subcategorias.html?categoria=X)
  for (const [cat, lastmod] of categoriasAtivas.entries()) {
    urls.push(addLastmod({
      loc: `${SITE_URL}/subcategorias.html?categoria=${encodeURIComponent(cat)}`,
      priority: '0.80',
      changefreq: 'weekly'
    }, lastmod));
  }

  // 3. Páginas de Subcategorias / Vitrines (produtos.html?categoria=X&subcategoria=Y)
  for (const [chave, lastmod] of paresCategoriaSub.entries()) {
    const [cat, sub] = chave.split('|');
    urls.push(addLastmod({
      loc: `${SITE_URL}/produtos.html?categoria=${encodeURIComponent(cat)}&subcategoria=${encodeURIComponent(sub)}`,
      priority: '0.85',
      changefreq: 'weekly'
    }, lastmod));
  }

  const body = urls.map(u => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  writeFileSync(new URL('../sitemap.xml', import.meta.url), xml, 'utf8');
  console.log(`✅ sitemap.xml gerado com sucesso! Total de ${urls.length} URLs indexadas (${categoriasAtivas.size} categorias, ${paresCategoriaSub.size} subcategorias).`);
}

main().catch(err => {
  console.error('❌ Erro ao gerar sitemap:', err);
  process.exit(1);
});
