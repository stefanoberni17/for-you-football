#!/usr/bin/env node
/**
 * Export dalla API INTERNA di Everfit (quella usata dall'app web, molto più
 * ricca dell'API pubblica) → docs/everfit-export/*.json (cartella gitignored).
 *
 * Uso:
 *   EVERFIT_ACCESS_TOKEN=<x-access-token> node scripts/everfit-internal-export.mjs [path ...]
 *
 * Il token è l'header `x-access-token` che l'app manda a api-prod3.everfit.io
 * (DevTools → Network → filtro "everfit" → una richiesta → Request Headers).
 * Scade da solo (~10 giorni). Solo chiamate GET.
 *
 * I path si passano come argomenti (copiati dalla riga `:path` in DevTools);
 * se un path contiene `page=N`, lo script scorre tutte le pagine finché la
 * risposta è vuota (max 100 pagine). Senza argomenti usa i path di default.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://api-prod3.everfit.io';
const TOKEN = process.env.EVERFIT_ACCESS_TOKEN;
const OUT = 'docs/everfit-export';

if (!TOKEN) {
  console.error('Manca EVERFIT_ACCESS_TOKEN (header x-access-token dell\'app Everfit).');
  process.exit(1);
}

const HEADERS = {
  'x-access-token': TOKEN,
  'x-app-type': 'web-coach',
  agent: 'react',
  timezone: 'Europe/Rome',
  accept: 'application/json, text/plain, */*',
  origin: 'https://app.everfit.io',
  referer: 'https://app.everfit.io/',
};

// Path di default: quello visto in DevTools + tentativi plausibili (404 innocui)
const DEFAULT_PATHS = [
  '/api/tag/get-list-tag-by-team/?sorter=most_recent&per_page=50&page=1&sort=-1&type=2&text_search=',
  '/api/exercise/search?per_page=50&page=1',
  '/api/exercise/get-list?per_page=50&page=1',
  '/api/workout/get-list?per_page=50&page=1',
  '/api/workout/list?per_page=50&page=1',
  '/api/program/get-list?per_page=50&page=1',
  '/api/program/list?per_page=50&page=1',
];

const paths = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PATHS;
const safeName = (p) => p.replace(/^\//, '').replace(/[^a-z0-9-]+/gi, '_').slice(0, 90);

async function get(path) {
  const res = await fetch(`${BASE}${path.startsWith('/') ? path : `/${path}`}`, { headers: HEADERS });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 2000) }; }
  return { status: res.status, body };
}

const items = (body) => {
  if (Array.isArray(body)) return body;
  for (const k of ['data', 'items', 'results', 'list']) if (Array.isArray(body?.[k])) return body[k];
  if (Array.isArray(body?.data?.data)) return body.data.data;
  if (Array.isArray(body?.data?.list)) return body.data.list;
  return null;
};

await mkdir(OUT, { recursive: true });
const summary = [];

for (const p of paths) {
  const paginated = /[?&]page=\d+/.test(p);
  let page = 1;
  let all = [];
  let firstBody = null;
  let status = null;
  try {
    while (page <= 100) {
      const path = paginated ? p.replace(/([?&]page=)\d+/, `$1${page}`) : p;
      const r = await get(path);
      status = r.status;
      if (firstBody === null) firstBody = r.body;
      const list = items(r.body);
      if (r.status !== 200 || !list) break;
      all = all.concat(list);
      if (!paginated || list.length === 0) break;
      page++;
    }
    const out = all.length ? { _pages: page, _count: all.length, items: all, _first: firstBody } : firstBody;
    const file = `${OUT}/${safeName(p.split('?')[0])}.json`;
    await writeFile(file, JSON.stringify(out, null, 2));
    summary.push({ path: p, status, items: all.length || null });
    console.log(`${status}  ${p}  →  ${file}${all.length ? `  (${all.length} item, ${page} pag.)` : ''}`);
  } catch (err) {
    summary.push({ path: p, status: 'ERR', error: String(err?.message || err) });
    console.log(`ERR  ${p}  →  ${err?.message || err}`);
  }
}

await writeFile(`${OUT}/_summary-internal.json`, JSON.stringify(summary, null, 2));
console.log(`\nFatto. File in ${OUT}/ — guarda _summary-internal.json.`);
