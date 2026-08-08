#!/usr/bin/env node
/**
 * Scansione segmenti rich-text — For You Football
 *
 * Fino al fix del mapper (agosto 2026) l'app leggeva SOLO il primo segmento
 * rich-text di ogni campo: una parola in grassetto/corsivo/link su Notion
 * troncava silenziosamente il campo. Questo script scandisce DB Giorni,
 * DB Settimane (e DB Difficoltà se configurato) e riporta, per ogni campo
 * con più di un segmento, cosa veniva SERVITO e cosa veniva PERSO.
 *
 * Uso (dalla root del progetto, dove c'è .env.local):
 *   node scripts/scan-richtext.mjs
 *
 * Zero dipendenze: legge .env.local a mano, usa fetch nativo (Node 18+).
 * Sola lettura: non modifica nulla, né su Notion né in locale.
 */

import { readFileSync, existsSync } from 'node:fs';

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv() {
  const env = { ...process.env };
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

const env = loadEnv();
const TOKEN = env.NOTION_TOKEN;
if (!TOKEN) {
  console.error('❌ NOTION_TOKEN non trovato (né in env né in .env.local). Lancia dalla root del progetto.');
  process.exit(1);
}

const DBS = [
  { label: 'DB Giorni', id: env.NOTION_DATABASE_GIORNI },
  { label: 'DB Settimane', id: env.NOTION_DATABASE_SETTIMANE },
  { label: 'DB Difficoltà', id: env.NOTION_DATABASE_DIFFICOLTA },
].filter((d) => d.id);

// ── Notion API ───────────────────────────────────────────────────────────────
async function notionQuery(dbId) {
  const pages = [];
  let cursor = undefined;
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor } : {}),
    });
    if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
    const data = await res.json();
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// ── analisi ──────────────────────────────────────────────────────────────────
const trunc = (s, n = 80) => {
  const t = s.replace(/\n/g, '⏎');
  return t.length > n ? t.slice(0, n) + '…' : t;
};

function pageLabel(props) {
  // DB Giorni: W#-G# — usa Numero Settimana/Giorno se presenti
  const w = props['Numero Settimana']?.number;
  const g = props['Numero Giorno']?.number;
  if (w != null && g != null) return `W${w}-G${g}`;
  if (w != null) return `Week ${w}`;
  // fallback: titolo (qualunque property di tipo title)
  for (const p of Object.values(props)) {
    if (p?.type === 'title') {
      return p.title.map((s) => s.plain_text).join('') || '(senza titolo)';
    }
  }
  return '(senza titolo)';
}

let totalIssues = 0;

for (const db of DBS) {
  console.log(`\n${'═'.repeat(70)}\n📚 ${db.label} (${db.id})\n${'═'.repeat(70)}`);
  let pages;
  try {
    pages = await notionQuery(db.id);
  } catch (e) {
    console.error(`  ⚠️ Errore query: ${e.message}`);
    continue;
  }
  console.log(`  ${pages.length} pagine.\n`);

  const rows = [];
  for (const page of pages) {
    const props = page.properties || {};
    const label = pageLabel(props);
    for (const [name, prop] of Object.entries(props)) {
      const segments = prop?.type === 'rich_text' ? prop.rich_text
                     : prop?.type === 'title' ? prop.title
                     : null;
      if (!segments || segments.length <= 1) continue;
      const served = segments[0]?.plain_text || '';
      const lost = segments.slice(1).map((s) => s?.plain_text || '').join('');
      if (!lost.trim()) continue; // segmenti extra vuoti: innocui
      rows.push({ label, name, served, lost, nSeg: segments.length });
    }
  }

  // ordina per settimana/giorno quando possibile
  rows.sort((a, b) => a.label.localeCompare(b.label, 'it', { numeric: true }));

  if (rows.length === 0) {
    console.log('  ✅ Nessun campo multi-segmento con contenuto: niente era troncato qui.');
    continue;
  }
  for (const r of rows) {
    totalIssues++;
    console.log(`  🔴 ${r.label} → ${r.name} (${r.nSeg} segmenti)`);
    console.log(`     SERVITO: "${trunc(r.served)}"`);
    console.log(`     PERSO  : "${trunc(r.lost, 160)}"\n`);
  }
  console.log(`  Totale campi affetti in ${db.label}: ${rows.length}`);
}

console.log(`\n${'═'.repeat(70)}`);
if (totalIssues === 0) {
  console.log('✅ Nessuna perdita: tutti i campi sono a segmento singolo.');
} else {
  console.log(`🔴 ${totalIssues} campi risultavano troncati per gli utenti prima del fix del mapper.`);
  console.log('   Col mapper aggiornato l\'app ora serve il testo COMPLETO di questi campi:');
  console.log('   verifica che il testo "PERSO" sia contenuto che VUOI mostrare (a volte è');
  console.log('   formattazione accidentale). Per pulire: riscrivi il campo come testo piatto.');
}
