// Le schermate della pagina di vendita (/scopri, 6/11): public/scopri/<momento>.webp, 600 × 1298.
// Si fanno sull'app vera (di solito il Preview) con un account di PROVA: mai i dati di un ragazzo.
// L'account deve avere il Mente (is_beta_free) e il Fisico (training_access) e un piano della settimana.
// La Carta usa numeri di esempio (la risposta di /api/carta viene ritoccata qui); il Coach risponde davvero.
//
//   BASE=https://<preview>.vercel.app EMAIL=... PASSWORD=... [BYPASS=<token protezione Vercel>] \
//     node scripts/scopri-screenshots.mjs [giorno reset coach carta fisico seduta recupero]
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

const momenti = {
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
  recupero: async () => {
    await go('/allenamento', 800); await pulisciSeduta();
    await go('/allenamento/sessione/' + (process.env.GIORNO || '6'), 8000);
    await page.getByRole('button', { name: /Inizia la seduta/i }).first().click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Salta l.apertura/i }).first().click({ timeout: 2000 }).catch(() => {});
    // fino al primo recupero: "Lato destro fatto", "Lato sinistro fatto" o "Fatta"
    for (let i = 0; i < 3; i++) {
      if (await page.getByText(/^Recupero$/i).count()) break;
      await page.getByRole('button', { name: /fatto|fatta/i }).first().click().catch(() => {});
      await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(1000);
    await shot('recupero');
    await pulisciSeduta();
  },
};

const scelti = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(momenti);
for (const id of scelti) {
  try { await momenti[id](); } catch (e) { console.error('non riuscito', id, e.message.slice(0, 200)); }
}
await browser.close();
