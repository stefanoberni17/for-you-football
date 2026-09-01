#!/usr/bin/env node
/**
 * Export dati Everfit → docs/everfit-export/*.json (cartella in .gitignore:
 * può contenere nomi di clienti reali, non va committata).
 *
 * Uso:  EVERFIT_API_TOKEN=<token> node scripts/everfit-export.mjs
 *
 * Il token si genera dal workspace Everfit (Settings → API/Integrations;
 * l'accesso API è incluso nei piani superiori). Solo chiamate GET.
 * Scopo: capire quanta struttura espone davvero l'API (programmi, workout,
 * esercizi, parametri) per importare la libreria di Ste nel catalogo FYF.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://public-api.everfit.io/public-api';
const TOKEN = process.env.EVERFIT_API_TOKEN;
const OUT = 'docs/everfit-export';

if (!TOKEN) {
  console.error('Manca EVERFIT_API_TOKEN. Uso: EVERFIT_API_TOKEN=<token> node scripts/everfit-export.mjs');
  process.exit(1);
}

// Endpoint documentati + tentativi plausibili (i 404 sono attesi e innocui)
const ENDPOINTS = [
  'programs',
  'programs?page=1&per_page=50',
  'on-demand-workout/get-list-collection',
  'exercises',
  'exercises?page=1&per_page=50',
  'workouts',
  'workout-collections',
  'clients',
  'clients?page=1&per_page=50',
];

async function get(path) {
  const res = await fetch(`${BASE}/${path}`, { headers: { 'api-token': TOKEN, Accept: 'application/json' } });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 2000) }; }
  return { status: res.status, body };
}

const safeName = (p) => p.replace(/[^a-z0-9-]+/gi, '_').slice(0, 80);

await mkdir(OUT, { recursive: true });
const summary = [];

for (const ep of ENDPOINTS) {
  try {
    const { status, body } = await get(ep);
    const file = `${OUT}/${safeName(ep)}.json`;
    await writeFile(file, JSON.stringify(body, null, 2));
    const size = JSON.stringify(body).length;
    const count = Array.isArray(body) ? body.length
      : Array.isArray(body?.data) ? body.data.length : null;
    summary.push({ endpoint: ep, status, bytes: size, items: count });
    console.log(`${status}  ${ep}  →  ${file}  (${size} byte${count !== null ? `, ${count} item` : ''})`);
  } catch (err) {
    summary.push({ endpoint: ep, status: 'ERR', error: String(err?.message || err) });
    console.log(`ERR  ${ep}  →  ${err?.message || err}`);
  }
}

// Se /programs risponde con una lista, prova il dettaglio del primo programma
try {
  const progs = summary.find((s) => s.endpoint === 'programs' && s.status === 200);
  if (progs) {
    const { body } = await get('programs');
    const list = Array.isArray(body) ? body : body?.data;
    const first = Array.isArray(list) ? list[0] : null;
    const id = first?.id || first?._id || first?.program_id;
    if (id) {
      for (const detailPath of [`programs/${id}`, `programs/${id}/workouts`, `program/${id}`]) {
        const { status, body: detail } = await get(detailPath);
        const file = `${OUT}/${safeName(detailPath)}.json`;
        await writeFile(file, JSON.stringify(detail, null, 2));
        console.log(`${status}  ${detailPath}  →  ${file}`);
      }
    }
  }
} catch (err) {
  console.log('dettaglio programma: ', err?.message || err);
}

await writeFile(`${OUT}/_summary.json`, JSON.stringify(summary, null, 2));
console.log(`\nFatto. File in ${OUT}/ — guarda _summary.json per il quadro.`);
