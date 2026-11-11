// scripts/check-images.mjs
// Auditoria de imagens: lê produtos/categorias do Firebase (leitura pública),
// resolve cada imagem EXATAMENTE como o site faz (js/utils/image-helper.js) e
// confere no CDN (HEAD) quais existem. Gera relatorio-imagens.csv.
//
// Uso:   node scripts/check-images.mjs
// Opções:
//   --db-json=arquivo.json   usa um JSON local {products:{}, categories:{}} em vez do Firebase
//   --concurrency=12         requisições simultâneas (padrão 12)
// Variável opcional: CDN_BASE_OVERRIDE=http://127.0.0.1:9999 (apenas para testes)
import { writeFileSync, readFileSync } from 'node:fs';
import { carregarImageHelper } from './lib/image-resolver.mjs';

const DB_URL = 'https://catalogo-abella-joias-default-rtdb.firebaseio.com';
const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true];
}));
const CONCURRENCY = Number(args.concurrency) || 12;
const H = carregarImageHelper();
const base = process.env.CDN_BASE_OVERRIDE;
const reescrever = (url) => base ? url.replace(H.CDN_BASE, base) : url;

async function lerDb() {
  if (args['db-json']) return JSON.parse(readFileSync(args['db-json'], 'utf8'));
  const get = async (p) => {
    const r = await fetch(`${DB_URL}/abella/${p}.json`);
    if (!r.ok) throw new Error(`Falha ao ler ${p}: HTTP ${r.status}`);
    return (await r.json()) || {};
  };
  return { products: await get('products'), categories: await get('categories') };
}

const lista = (obj) => Array.isArray(obj)
  ? obj.map((v, i) => [String(i), v]).filter(([, v]) => v)
  : Object.entries(obj || {});

function coletar(db) {
  const itens = [];
  for (const [id, p] of lista(db.products)) {
    if (!p) continue;
    itens.push({ tipo: 'produto', id, sku: p.sku || p.codigo || id, nome: p.nome || p.name || '',
      bruto: String(p.imagem || p.image || '').trim(), ativo: p.ativo !== false && p.paused !== true });
  }
  for (const [slug, c] of lista(db.categories)) {
    if (!c) continue;
    itens.push({ tipo: 'categoria', id: slug, sku: slug, nome: c.nome || c.name || slug,
      bruto: String(c.imagem || c.image || '').trim(), ativo: c.paused !== true });
    for (const [sub, s] of lista(c.subcategories || c.subcategorias)) {
      if (!s) continue;
      itens.push({ tipo: 'subcategoria', id: `${slug}/${sub}`, sku: sub, nome: s.nome || s.name || sub,
        bruto: String(s.image || s.imagem || s.cover || s.banner || '').trim(), ativo: s.paused !== true });
    }
  }
  return itens;
}

async function existe(url) {
  for (const metodo of ['HEAD', 'GET']) {          // alguns proxies rejeitam HEAD
    try {
      const r = await fetch(url, { method: metodo, redirect: 'follow' });
      if (r.ok) return { ok: true, status: r.status };
      if (metodo === 'GET' || r.status === 404) return { ok: false, status: r.status };
    } catch (e) {
      if (metodo === 'GET') return { ok: false, status: `erro:${e.cause?.code || e.message}` };
    }
  }
}

async function emLotes(itens, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < itens.length) { const it = itens[i++]; await fn(it); }
  }));
}

const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const db = await lerDb();
const itens = coletar(db);
console.log(`Auditando ${itens.length} imagens (${CONCURRENCY} simultâneas)...`);

// URLs iguais são checadas uma vez só.
const cache = new Map();
for (const it of itens) {
  it.url = it.bruto ? H.obterImagem({ image: it.bruto }) : '';
  it.causa = '';
  if (!it.bruto) it.causa = 'SEM_IMAGEM_NO_CADASTRO';
  else if (it.url === H.PLACEHOLDER) it.causa = 'VALOR_NAO_RECONHECIDO (caiu no placeholder)';
  else if (it.url.includes('firebasestorage')) it.causa = 'AINDA_APONTA_PARA_FIREBASE';
}
const unicas = [...new Set(itens.filter(i => !i.causa).map(i => i.url))];
await emLotes(unicas, async (u) => { cache.set(u, await existe(reescrever(u))); });

for (const it of itens) {
  if (it.causa) continue;
  const r = cache.get(it.url);
  if (r.ok) it.causa = 'OK';
  else if (String(r.status).startsWith('erro')) it.causa = `FALHA_DE_REDE (${r.status})`;
  else it.causa = `ARQUIVO_NAO_EXISTE_NO_CDN (HTTP ${r.status})`;
  // Dica: o nome do arquivo difere do SKU do produto?
  if (it.tipo === 'produto' && it.causa !== 'OK') {
    const stem = decodeURIComponent(it.url.split('/').pop()).replace(/\.webp$/i, '');
    if (stem.toUpperCase() !== String(it.sku).toUpperCase()) it.dica = `arquivo "${stem}" ≠ SKU "${it.sku}"`;
  }
}

const resumo = {};
for (const it of itens) { const k = it.causa.split(' ')[0]; resumo[k] = (resumo[k] || 0) + 1; }
console.table(resumo);

const problemas = itens.filter(i => !i.causa.startsWith('OK'));
const linhas = [['tipo', 'id', 'sku', 'nome', 'ativo', 'valor_no_banco', 'url_resolvida', 'problema', 'dica']
  .map(csv).join(',')];
for (const i of problemas) {
  linhas.push([i.tipo, i.id, i.sku, i.nome, i.ativo, i.bruto, i.url, i.causa, i.dica || ''].map(csv).join(','));
}
writeFileSync('relatorio-imagens.csv', '﻿' + linhas.join('\n'), 'utf8');
console.log(`\n${problemas.length} problema(s) -> relatorio-imagens.csv (abra no Excel/Planilhas).`);
console.log('Ativos com problema:', problemas.filter(i => i.ativo).length);
process.exitCode = problemas.some(i => i.ativo) ? 1 : 0;
