#!/usr/bin/env node
/**
 * Lint a "cricchetto": il numero di errori ESLint può solo scendere.
 *
 * Il repo ha ~100 errori storici (quasi tutti `any`). Invece di bloccare la CI
 * finché non sono tutti sistemati, si fissa una base in scripts/lint-baseline.json:
 *  - errori > base  → la CI fallisce (qualcuno ne ha aggiunti)
 *  - errori < base  → la CI passa e ricorda di abbassare la base
 *  - `node scripts/lint-ratchet.mjs --update` riscrive la base con il conteggio attuale
 *
 * I warning non contano.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'scripts', 'lint-baseline.json');
const update = process.argv.includes('--update');

let raw;
try {
  raw = execFileSync('npx', ['eslint', '-f', 'json'], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
} catch (e) {
  // eslint esce con 1 quando ci sono errori: il JSON è comunque su stdout
  raw = e.stdout;
  if (!raw) { console.error('lint-ratchet: eslint non ha prodotto output'); process.exit(2); }
}
const results = JSON.parse(raw);
const errors = results.reduce((n, f) => n + f.errorCount, 0);
const warnings = results.reduce((n, f) => n + f.warningCount, 0);
const perRule = {};
for (const f of results) for (const m of f.messages) if (m.severity === 2) perRule[m.ruleId ?? '(parse)'] = (perRule[m.ruleId ?? '(parse)'] ?? 0) + 1;

if (update) {
  writeFileSync(baselinePath, JSON.stringify({ errors, aggiornata: new Date().toISOString().slice(0, 10), perRule }, null, 2) + '\n');
  console.log(`lint-ratchet: base aggiornata a ${errors} errori`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
console.log(`lint-ratchet: ${errors} errori (base ${baseline.errors}), ${warnings} warning`);
if (errors > baseline.errors) {
  console.error(`lint-ratchet: ${errors - baseline.errors} errori in più della base. Errori per regola:`);
  for (const [rule, n] of Object.entries(perRule).sort((a, b) => b[1] - a[1])) {
    const prima = baseline.perRule?.[rule] ?? 0;
    if (n > prima) console.error(`  ${rule}: ${n} (base ${prima})`);
  }
  console.error('Sistema i nuovi errori (eslint <file> li elenca) oppure, se sono voluti, aggiorna la base con: node scripts/lint-ratchet.mjs --update');
  process.exit(1);
}
if (errors < baseline.errors) console.log(`lint-ratchet: ${baseline.errors - errors} errori in meno della base: abbassala con node scripts/lint-ratchet.mjs --update`);
