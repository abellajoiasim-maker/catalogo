// scripts/generate-sitemap.mjs
// SEO IQ200 — Gerador gratuito de sitemap.xml
// Lê o Firebase Realtime Database (leitura pública, sem custo, sem API paga)
// e gera o sitemap.xml na raiz do projeto. Rodado via GitHub Actions (grátis).

import { writeFileSync } from 'fs';

const DB_URL = 'https://catalogo-abella-joias-default-rtdb.firebaseio.com';
const SITE_URL = 'https://www.abellajoias.com.br';

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const [categoriesRaw, productsRaw] = await Promise.all([
    fetchJson('abella/categories'),
    fetchJson('abella/products')
  ]);

  const categories = Object.values(categoriesRaw || {});
  const products = Object.values(productsRaw || {});

  // Só produtos ativos/visíveis contam para decidir quais combinações categoria+subcategoria existem de verdade
  const produtosAtivos = products.filter(p => p && p.ativo !== false && p.paused !== true);

  const paresCategoriaSub = new Map(); // chave "categoria|subcategoria" -> lastmod mais recente
  const categoriasAtivas = new Map();  // categoria -> lastmod mais recente

  for (const p of produtosAtivos) {
    const cat = String(p.categoriaId || p.category || '').trim();
    const sub = String(p.subcategoriaId || p.subcategory || '').trim();
    const lastmod = p.updatedAt || p.createdAt || Date.now();

    if (cat) {
      const atual = categoriasAtivas.get(cat) || 0;
      categoriasAtivas.set(cat, Math.max(atual, lastmod));
    }
    if (cat && sub) {
      const chave = `${cat}|${sub}`;
      const atual = paresCategoriaSub.get(chave) || 0;
      paresCategoriaSub.set(chave, Math.max(atual, lastmod));
    }
  }

  const toDate = (ts) => {
    try { return new Date(ts).toISOString().slice(0, 10); }
    catch { return todayISO(); }
  };

  const urls = [];

  // Páginas fixas
  urls.push({ loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily', lastmod: todayISO() });
  urls.push({ loc: `${SITE_URL}/produtos.html`, priority: '0.9', changefreq: 'daily', lastmod: todayISO() });
  urls.push({ loc: `${SITE_URL}/galvanicas.html`, priority: '0.5', changefreq: 'weekly', lastmod: todayISO() });

  // Categorias (subcategorias.html?categoria=X)
  for (const [cat, lastmod] of categoriasAtivas.entries()) {
    urls.push({
      loc: `${SITE_URL}/subcategorias.html?categoria=${encodeURIComponent(cat)}`,
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: toDate(lastmod)
    });
  }

  // Subcategorias (produtos.html?categoria=X&subcategoria=Y) — as 47+ vitrines
  for (const [chave, lastmod] of paresCategoriaSub.entries()) {
    const [cat, sub] = chave.split('|');
    urls.push({
      loc: `${SITE_URL}/produtos.html?categoria=${encodeURIComponent(cat)}&subcategoria=${encodeURIComponent(sub)}`,
      priority: '0.85',
      changefreq: 'weekly',
      lastmod: toDate(lastmod)
    });
  }

  const body = urls.map(u => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  writeFileSync(new URL('../sitemap.xml', import.meta.url), xml, 'utf8');
  console.log(`sitemap.xml gerado com ${urls.length} URLs (${categoriasAtivas.size} categorias, ${paresCategoriaSub.size} subcategorias).`);
}

main().catch(err => {
  console.error('Erro ao gerar sitemap:', err);
  process.exit(1);
});
