// scripts/generate-merchant-feed.mjs
// SEO IQ200 — Gerador gratuito de Feed para Google Merchant Center
// Lê o Firebase Realtime Database (leitura pública, sem custo, sem API paga)
// e gera merchant-feed.xml na raiz do projeto (formato RSS 2.0 + namespace g:,
// aceito gratuitamente pelo Google Merchant Center via "Buscar conteúdo" agendado).

import { writeFileSync } from 'fs';

const DB_URL = 'https://catalogo-abella-joias-default-rtdb.firebaseio.com';
const SITE_URL = 'https://catalogo.abellajoias.com.br';
const BRAND = 'Abella Joias';

async function fetchJson(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error(`Falha ao ler ${path}: ${res.status}`);
  const data = await res.json();
  return data || {};
}

function xmlEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function linkDoProduto(p) {
  const cat = String(p.categoriaId || p.category || '').trim();
  const sub = String(p.subcategoriaId || p.subcategory || '').trim();
  if (cat && sub) {
    return `${SITE_URL}/produtos.html?categoria=${encodeURIComponent(cat)}&subcategoria=${encodeURIComponent(sub)}`;
  }
  if (cat) return `${SITE_URL}/produtos.html?categoria=${encodeURIComponent(cat)}`;
  return `${SITE_URL}/produtos.html`;
}

function precoFormatado(p) {
  const valor = Number(p.precoFinal || p.preco || p.price || 0);
  return `${valor.toFixed(2)} BRL`;
}

async function main() {
  const productsRaw = await fetchJson('abella/products');
  const products = Object.values(productsRaw || {});

  // Regras do feed: só produtos ativos, não pausados e que NÃO sejam a foto vitrine (não vendável)
  const vendaveis = products.filter(p => {
    if (!p) return false;
    if (p.ativo === false || p.paused === true) return false;
    const ehVitrine = p.vitrine === true || p.isVitrine === true || p.showcase === true || p.tipo === 'vitrine';
    if (ehVitrine) return false;
    if (!p.nome && !p.name) return false;
    return true;
  });

  const items = vendaveis.map(p => {
    const id = xmlEscape(p.sku || p.codigo || p.id);
    const nome = xmlEscape(p.nome || p.name);
    const descricao = xmlEscape(p.descricao || `${p.nome || p.name} — Atacado de semijoias Abella Joias, direto de fábrica em Limeira-SP.`);
    const link = xmlEscape(linkDoProduto(p));
    const imagem = xmlEscape(p.imagem || p.image || '');
    const disponibilidade = (Number(p.estoque) > 0 || p.estoque === undefined) ? 'in_stock' : 'out_of_stock';

    if (!imagem) return null; // Merchant Center rejeita item sem imagem — pula em vez de quebrar o feed inteiro

    return `  <item>
    <g:id>${id}</g:id>
    <title>${nome}</title>
    <description>${descricao}</description>
    <link>${link}</link>
    <g:image_link>${imagem}</g:image_link>
    <g:availability>${disponibilidade}</g:availability>
    <g:price>${precoFormatado(p)}</g:price>
    <g:brand>${xmlEscape(BRAND)}</g:brand>
    <g:condition>new</g:condition>
    <g:identifier_exists>false</g:identifier_exists>
  </item>`;
  }).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Abella Joias — Catálogo Atacado</title>
  <link>${SITE_URL}/</link>
  <description>Feed de produtos Abella Joias para Google Merchant Center</description>
${items.join('\n')}
</channel>
</rss>
`;

  writeFileSync(new URL('../merchant-feed.xml', import.meta.url), xml, 'utf8');
  console.log(`merchant-feed.xml gerado com ${items.length} produtos (de ${products.length} no banco, ${vendaveis.length} vendáveis).`);
}

main().catch(err => {
  console.error('Erro ao gerar feed do Merchant Center:', err);
  process.exit(1);
});
