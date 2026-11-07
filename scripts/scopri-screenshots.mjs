// Le schermate della pagina di vendita (/scopri, 6/11): public/scopri/<momento>.webp, 600 × 1298.
// Si fanno sull'app vera (di solito il Preview) con un account di PROVA: mai i dati di un ragazzo.
// L'account deve avere il Mente (is_beta_free) e il Fisico (training_access) e un piano della settimana.
// La Carta, le abitudini e il check-in usano numeri di esempio (le risposte delle API vengono sostituite qui);
// il Coach risponde davvero.
//
//   BASE=https://<preview>.vercel.app EMAIL=... PASSWORD=... [BYPASS=<token protezione Vercel>] \
//     node scripts/scopri-screenshots.mjs [percorso difficolta coach parole obiettivi setup fisico seduta recupero resoconto test]
//
// Serve Playwright (nelle sessioni cloud c'è già). Le immagini vanno controllate a occhio prima del commit.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright/index.js'); }
const sharp = require('sharp');

const { BASE, EMAIL, PASSWORD, BYPASS } = process.env;
if (!BASE || !EMAIL || !PASSWORD) { console.error('Servono BASE, EMAIL e PASSWORD'); process.exit(1); }
const OUT = path.join(process.cwd(), 'public/scopri');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'scopri-'));
const DOMANDA = process.env.DOMANDA || 'Domenica ho sbagliato un rigore e da allora in partita ho paura di sbagliare ancora. Cosa faccio?';

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'it-IT' });
if (BYPASS) await ctx.route(BASE + '/**', (r) => r.continue({ headers: { ...r.request().headers(), 'x-vercel-protection-bypass': BYPASS } }));
const page = await ctx.newPage();
const go = async (p, ms = 7000) => { await page.goto(BASE + p, { waitUntil: 'networkidle' }).catch(() => {}); await page.waitForTimeout(ms); };
const pulisciSeduta = () => page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('trainingSession')) localStorage.removeItem(k); });
const shot = async (id) => {
  const png = path.join(TMP, id + '.png');
  await page.screenshot({ path: png });
  await sharp(png).resize(600).webp({ quality: 80 }).toFile(path.join(OUT, id + '.webp'));
  console.log('ok', id);
};

// Entra
await go('/login', 2000);
await page.locator('input[type=email]').fill(EMAIL);
await page.locator('input[type=password]').fill(PASSWORD);
await page.getByRole('button', { name: /^Accedi|^Entra/i }).first().click();
await page.waitForTimeout(6000);

async function esempioStatistiche() {
  const giorni = []; const base = Date.now();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(base - i * 864e5); const t = (59 - i) / 59; const w = Math.sin(i / 2.3);
    giorni.push({ date: d.toISOString().slice(0, 10), physical_state: Math.round(5 + 2 * t + w), sleep_hours: Math.round((6.3 + 1.2 * t + 0.6 * Math.sin(i / 1.7)) * 2) / 2, recovery_quality: Math.round(5 + 2 * t + Math.cos(i / 2)), mental_state: Math.round(4.5 + 2.5 * t + 0.8 * Math.sin(i / 3)), presence_yesterday: Math.round(4 + 3 * t) });
  }
  await page.route('**/api/checkin/history**', (r) => r.fulfill({ json: { checkins: giorni } }));
  const by_date = giorni.slice(-30).map((g, i) => ({ date: g.date, completed: [3, 4, 5, 2, 4, 5, 3][i % 7] }));
  const a = (id, testo, n) => ({ action_id: id, action_text: testo, completion_rate: n / 30, completed_days: n, total_days: 30 });
  await page.route('**/api/actions/history**', (r) => r.fulfill({ json: { by_date, current_streak: 6, longest_streak: 11, active_count: 5, threshold: 3, by_action: [
    a('a1', 'Un Reset prima di entrare in campo', 27), a('a2', 'Dopo un errore: un respiro, prossima azione', 24), a('a3', 'A letto entro le 23', 18),
    a('a4', 'Telefono via a cena', 15), a('a5', 'Chiamo la palla in allenamento', 21)] } }));
}

const momenti = {
  percorso: async () => { await go('/settimane', 7000); await shot('percorso'); },
  difficolta: async () => { await go('/sos', 7000); await shot('difficolta'); },
  // La Carta, parte mentale: le parole scritte nel percorso (risposte di ESEMPIO al posto di /api/risposte)
  parole: async () => {
    const riga = (week, day, x) => ({ week, day, domanda: null, risposta: null, prePratica: null, gate: null, gateQ: null, completedAt: '2026-10-20T18:00:00Z', versioni: 1, aggiornataIl: '2026-10-20T18:00:00Z', ...x });
    const mappa = 'Spalle e mascella: dopo un errore si chiudono. Lo stomaco, la sera prima della partita.';
    await page.route('**/api/risposte**', (r) => r.fulfill({ json: { risposte: [
      riga(1, 3, { risposta: 'Riparto qui.' }),
      riga(3, 3, { risposta: 'Piedi leggeri, respiro lungo, spalle basse. Chiedo palla senza pensarci.' }),
      riga(3, 7, { gate: [mappa], gateQ: { q1: mappa } }),
      riga(4, 6, { risposta: 'Sento lo stomaco che si chiude. Nomino: è il futuro, non è adesso. Torno: un respiro, il gesto, «Riparto qui».' }),
    ] } }));
    await go('/carta', 9000);
    await page.getByText(/Il mio mantra/i).first().evaluate((el) => { document.scrollingElement.scrollTop += el.getBoundingClientRect().top - 245; });
    await page.waitForTimeout(1000);
    await shot('parole');
  },
  giorno: async () => { await go('/giorno/1/1'); await shot('giorno'); },
  reset: async () => {
    await go('/strumenti');
    await page.getByRole('button', { name: /Reset rapido/i }).first().click();
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Inizia il Reset/i }).click();
    await page.waitForTimeout(2600);
    await shot('reset');
  },
  coach: async () => {
    await go('/chat', 5000);
    await page.getByPlaceholder('Scrivi al Coach…').fill(DOMANDA);
    await page.keyboard.press('Enter');
    for (let i = 0; i < 60; i++) { await page.waitForTimeout(1000); if (i > 8 && (await page.locator('.animate-bounce').count()) === 0) break; }
    await page.waitForTimeout(1500);
    await shot('coach');
  },
  carta: async () => {
    await page.route('**/api/carta', async (route) => {
      const r = await route.fetch(); const d = await r.json();
      const v = { mente: [58, 36], recupero: [64, 52], forza: [55, 42], esplosiva: [47, 38], resistenza: [44, 40], velocita: [52, 46], tecnica: [61, 47] };
      for (const t of d.tre60 ?? []) { const k = Object.keys(v).find((x) => t.key.startsWith(x.slice(0, 4))); const w = k ? v[k] : [50, 42]; t.score = w[0]; t.scoreIniziale = w[1]; t.delta = w[0] - w[1]; }
      (d.mente?.punte ?? []).forEach((p, i) => { const s = [62, 71, 55, 49][i] ?? 55; Object.assign(p, { score: s, score7: s + 3, valore: s, tendenza: 'su', scoreIniziale: 35, delta: s - 35 }); });
      if (d.mente) Object.assign(d.mente, { media: 58, haPartenza: true });
      if (d.recupero) Object.assign(d.recupero, { valore: 6.8, score: 64, score7: 66, tendenza: 'su', scoreIniziale: 52, delta: 12 });
      await route.fulfill({ response: r, json: d });
    });
    await go('/carta', 9000);
    await shot('carta');
  },
  fisico: async () => { await go('/allenamento', 800); await page.evaluate(() => localStorage.setItem('campo.vista', 'settimana')); await go('/allenamento', 12000); await shot('fisico'); },
  seduta: async () => { await go('/allenamento', 800); await pulisciSeduta(); await go('/allenamento/sessione/' + (process.env.GIORNO || '6'), 9000); await shot('seduta'); },
  // L'ultimo recupero di un esercizio: voto della serie aperto (7), ripetizioni, lato più duro, «Com'è venuto?».
  // Le serie votate finiscono in training_set_logs dell'account di prova: si possono cancellare dopo.
  recupero: async () => {
    await go('/allenamento', 800); await pulisciSeduta();
    await go('/allenamento/sessione/' + (process.env.GIORNO || '6'), 8000);
    await page.getByRole('button', { name: /Inizia la seduta/i }).first().click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Salta l.apertura/i }).first().click({ timeout: 2000 }).catch(() => {});
    // fino all'ultimo recupero del primo esercizio
    for (let i = 0; i < 8; i++) {
      if (await page.getByRole('button', { name: /Vai al prossimo/i }).count()) break;
      const salta = page.getByRole('button', { name: /Salta il recupero/i });
      if (await salta.count()) { await salta.first().click(); await page.waitForTimeout(1200); continue; }
      await page.getByRole('button', { name: /fatto|completato|fatta/i }).first().click().catch(() => {});
      await page.waitForTimeout(1300);
    }
    await page.getByRole('button', { name: /Vota la serie/i }).click({ timeout: 2000 }).catch(() => {});
    await page.locator('[role=radio]').nth(6).click({ timeout: 2000 }).catch(() => {});
    await page.getByRole('button', { name: /Com.è venuto/i }).click({ timeout: 2000 }).catch(() => {});
    await page.getByText(/Com.è andata la serie/i).first().evaluate((el) => {
      let n = el.parentElement;
      while (n && n !== document.body) { const o = getComputedStyle(n).overflowY; if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) { n.scrollTop += el.getBoundingClientRect().top - 140; return; } n = n.parentElement; }
    }).catch(() => {});
    await page.waitForTimeout(800);
    await shot('recupero');
    await pulisciSeduta();
  },
  obiettivi: async () => {
    await go('/allenamento/setup', 9000);
    await page.getByText(/Su cosa vuoi lavorare/i).first().evaluate((el) => {
      let n = el.parentElement;
      while (n && n !== document.body) { const o = getComputedStyle(n).overflowY; if ((o === 'auto' || o === 'scroll') && n.scrollHeight > n.clientHeight) break; n = n.parentElement; }
      const c = n && n !== document.body ? n : document.scrollingElement; c.scrollTop += el.getBoundingClientRect().top - 90;
    });
    await page.waitForTimeout(800);
    await shot('obiettivi');
  },
  setup: async () => { await go('/allenamento/setup', 9000); await shot('setup'); },
  test: async () => { await go('/allenamento/test', 9000); await shot('test'); },
  // Il resoconto dopo la squadra: si forza «da chiedere» per ieri, sforzo 8 selezionato (non si salva)
  resoconto: async () => {
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('resoconto')) localStorage.removeItem(k); for (const k of Object.keys(sessionStorage)) if (k.startsWith('resoconto')) sessionStorage.removeItem(k); }).catch(() => {});
    const ieri = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const forza = async (route) => { const r = await route.fetch(); const d = await r.json(); d.resocontiDaChiedere = [{ data: ieri, tipo: 'squadra' }]; await route.fulfill({ response: r, json: d }); };
    await page.route('**/api/training/oggi**', forza); await page.route('**/api/training/state**', forza);
    await go('/allenamento', 12000);
    await page.getByRole('radio', { name: /Sforzo 8/ }).first().click().catch(() => {});
    await page.waitForTimeout(800);
    await shot('resoconto');
  },
  // Abitudini e check-in: dati di ESEMPIO (le risposte di /api/checkin/history e /api/actions/history vengono sostituite)
  azioni: async () => { await esempioStatistiche(); await go('/statistiche', 6000); await shot('azioni'); },
  stato: async () => { await esempioStatistiche(); await go('/statistiche', 6000); await page.evaluate(() => { document.scrollingElement.scrollTop += 560; }); await page.waitForTimeout(1200); await shot('stato'); },
};

const scelti = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(momenti);
for (const id of scelti) {
  try { await momenti[id](); } catch (e) { console.error('non riuscito', id, e.message.slice(0, 200)); }
}
await browser.close();
