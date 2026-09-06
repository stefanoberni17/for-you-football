#!/usr/bin/env node
/**
 * Everfit — assegnazione allenamenti al calendario di un cliente (API interna
 * dell'app coach, stessi endpoint della web app). Solo su richiesta esplicita
 * di Ste; ogni scrittura è loggata e verificabile con `history`.
 *
 *   EVERFIT_ACCESS_TOKEN=<x-access-token> node scripts/everfit-assign.mjs <cmd> ...
 *
 * Comandi:
 *   history <clientId> <MM-DD-YYYY> <MM-DD-YYYY>      assegnazioni nel periodo (titolo, id, stato)
 *   detail  <assignmentId> [out.json]                 dettaglio assegnazione (sections_target editabile)
 *   libdetail <workoutId> [out.json]                  dettaglio workout di libreria (sections)
 *   copy    <clientId> <MM-DD-YYYY> <assignmentId...> copia assegnazioni esistenti sulla data (bulk-copy)
 *   add     <clientId> <MM-DD-YYYY> <file.json>       nuova assegnazione da {title, description, sections_target}
 *   update  <assignmentId> <file.json>                aggiorna titolo/descrizione/sections_target di un'assegnazione
 *   delete  <assignmentId>                            elimina un'assegnazione
 */
import fs from 'node:fs';

const BASE = 'https://api-prod3.everfit.io';
const TOKEN = process.env.EVERFIT_ACCESS_TOKEN;
if (!TOKEN) { console.error('Manca EVERFIT_ACCESS_TOKEN'); process.exit(2); }
const HDR = { 'x-access-token': TOKEN, 'x-app-type': 'web-coach', agent: 'react', 'Content-Type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: HDR, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non JSON */ }
  if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}: ${text.slice(0, 400)}`);
  return json ?? text;
}
const data = (r) => (r && typeof r === 'object' && 'data' in r ? r.data : r);

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'history') {
    const [client, from, to] = args;
    const r = data(await call('GET', `/api/workout/v2/assignments/history?client=${client}&start_date=${from}&end_date=${to}`));
    const days = (r.day_data || []).sort((a, b) => (a.day.slice(6) + a.day.slice(0, 5)).localeCompare(b.day.slice(6) + b.day.slice(0, 5)));
    for (const d of days) for (const a of d.assignments) console.log(`${d.day} | ${a.title} | ${a._id} | status ${a.status}`);
    if (!days.length) console.log('(nessuna assegnazione)');
  } else if (cmd === 'detail' || cmd === 'libdetail') {
    const [id, out] = args;
    const r = data(await call('GET', cmd === 'detail' ? `/api/workout/v2/assignment/detail/${id}` : `/api/workout/v2/detail/${id}`));
    if (out) fs.writeFileSync(out, JSON.stringify(r, null, 1));
    const secs = r.sections_target || r.sections || [];
    console.log(`${r.title} — ${secs.length} sezioni`);
    for (const s of secs) for (const e of s.exercises || []) for (const ss of e.supersets || []) {
      const sets = (ss.training_sets || []).map((t) => [t.reps?.value && `${t.reps.value}r`, t.duration?.value && `${t.duration.value}"`, t.distance_short?.value && `${t.distance_short.value}m`, t.weight?.value && `${t.weight.value}kg`, t.rest?.value && `rec${t.rest.value}`].filter(Boolean).join(' '));
      console.log(`  - ${ss.exercise?.title || ss.exercise_instance?.title}${ss.each_side ? ' (lato)' : ''}: ${sets.join(' | ')}`);
    }
  } else if (cmd === 'copy') {
    const [clientId, toDate, ...assignmentIds] = args;
    const r = await call('POST', '/api/assignment/bulk-copy', { clientId, assignmentIds, toDate });
    console.log('copy →', JSON.stringify(data(r)).slice(0, 600));
  } else if (cmd === 'add') {
    const [client, day, file] = args;
    const w = JSON.parse(fs.readFileSync(file, 'utf8'));
    const body = { client, day, title: w.title, description: w.description ?? '', share: w.share ?? 0, background: w.background ?? null,
      sections_target: w.sections_target ?? w.sections, workout_settings: { hide_workout: false } };
    const r = data(await call('POST', '/api/workout/v2/assignment/add', body));
    console.log('add →', r?._id, r?.title, r?.day);
  } else if (cmd === 'update') {
    const [assignment, file] = args;
    const w = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cur = data(await call('GET', `/api/workout/v2/assignment/detail/${assignment}`));
    const body = { assignment, title: w.title ?? cur.title, description: w.description ?? cur.description ?? '', author: null,
      share: cur.share ?? 0, sections_target: w.sections_target ?? cur.sections_target, client: cur.client, background: cur.background ?? null };
    const r = data(await call('PUT', `/api/workout/v2/assignment/${assignment}/update`, body));
    console.log('update →', r?._id, r?.title, r?.day);
  } else if (cmd === 'delete') {
    const [assignment] = args;
    const r = await call('DELETE', `/api/workout/v2/assignment/${assignment}/delete`);
    console.log('delete →', JSON.stringify(data(r)).slice(0, 300));
  } else {
    console.error('comando sconosciuto'); process.exit(2);
  }
} catch (e) {
  console.error(e.message); process.exit(1);
}
