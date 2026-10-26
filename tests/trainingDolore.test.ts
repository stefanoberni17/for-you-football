import { describe, expect, it } from 'vitest';
import { distrettiZona, doloreAttivo, doloreRiga, doloreTesto, DOLORE_KG_SCALA, DOLORE_SERIE_SCALA, finoAlRientro, isZonaDolore, LIMITAZIONI_NOTA_MAX, limitazioniPerCoach, limitazioniRiga, limitazioniTesto, limitazioniVuote, parseLimitazioni, riduciPerDolore, ZONE_DOLORE } from '@/lib/trainingDolore';
import type { PlanItem, WeekPlan } from '@/lib/trainingEngine';

const OGGI = '2026-10-28'; // mercoledì
const item = (esercizio_id: string, serie = 3, carico_kg?: number): PlanItem => ({ esercizio_id, serie, quantita: 10, recupero_sec: 60, ...(carico_kg != null ? { carico_kg } : {}) } as PlanItem);
const piano = (): WeekPlan => ({
  sedute: [
    { giorno: 1, titolo: 'Lun', tipo: 'fisica', durata_min: 45, items: [item('squat-1', 4), item('push-1', 3)] },
    { giorno: 3, titolo: 'Mer', tipo: 'fisica', durata_min: 45, items: [item('squat-1', 4, 40), item('push-1', 3), item('tpal-palleggi-al-muro-1-tocco-libero', 2)] },
    { giorno: 5, titolo: 'Ven', tipo: 'fisica', durata_min: 45, items: [item('pull-1', 3), item('rdl-2', 3)] },
  ],
});

describe('dolore per zona (M9): zone e distretti', () => {
  it('le zone sono quelle del rolling più spalla, ginocchio, caviglia, anca e altro', () => {
    expect(ZONE_DOLORE).toContain('polpacci');
    expect(ZONE_DOLORE).toContain('ginocchio');
    expect(isZonaDolore('anca')).toBe(true);
    expect(isZonaDolore('testa')).toBe(false);
  });
  it('ginocchio → gambe, spalla → parte alta, schiena → tutto, altro → niente', () => {
    expect(distrettiZona('ginocchio')).toEqual(['gambe']);
    expect(distrettiZona('spalla')).toEqual(['alto']);
    expect(distrettiZona('schiena')).toEqual(['gambe', 'alto']);
    expect(distrettiZona('altro')).toEqual([]);
    expect(distrettiZona(null)).toEqual([]);
  });
  it('la riduzione è attiva con una zona e senza scadenza, o con la scadenza non passata', () => {
    expect(doloreAttivo({ zona: 'ginocchio' }, OGGI)).toBe(true);
    expect(doloreAttivo({ zona: 'ginocchio', fino: '2026-11-05' }, OGGI)).toBe(true);
    expect(doloreAttivo({ zona: 'ginocchio', fino: '2026-10-27' }, OGGI)).toBe(false);
    expect(doloreAttivo({ zona: null }, OGGI)).toBe(false);
    expect(doloreAttivo(null, OGGI)).toBe(false);
  });
  it('al rientro dalla pausa la zona resta ridotta per due settimane', () => {
    expect(finoAlRientro(OGGI)).toBe('2026-11-11');
  });
});

describe('dolore per zona (M9): la riduzione sul piano', () => {
  it('ginocchio: serie ×0,7 e kg ×0,8 solo sugli esercizi delle gambe, nelle sedute non fatte da oggi in poi', () => {
    const { plan, ridotti, righe } = riduciPerDolore(piano(), { dolore: { zona: 'ginocchio' }, oggi: OGGI, oggiDow: 3, fatteGiorni: new Set([1]) });
    const lun = plan.sedute[0], mer = plan.sedute[1], ven = plan.sedute[2];
    expect(lun.items[0].serie).toBe(4);                 // fatta: intatta
    expect(mer.items[0].serie).toBe(Math.round(4 * DOLORE_SERIE_SCALA));
    expect(mer.items[0].carico_kg).toBe(40 * DOLORE_KG_SCALA);
    expect(mer.items[0].adattamento).toBe('dolore');
    expect(mer.items[0].nota).toMatch(/Zona ginocchio/);
    expect(mer.items[1].serie).toBe(3);                 // parte alta: intatta
    expect(mer.items[1].adattamento).toBeUndefined();
    expect(mer.items[2].serie).toBe(2);                 // tecnica con la palla: intatta
    expect(ven.items[0].serie).toBe(3);                 // tirata: intatta
    expect(ven.items[1].serie).toBe(Math.round(3 * DOLORE_SERIE_SCALA));
    expect(ridotti).toBe(2);
    expect(righe[0]).toMatch(/^Ginocchio: serie ridotte .*Mercoledì, Venerdì.*finché non dici che è passato/);
    expect(plan.aggiustamenti).toEqual(righe);
  });
  it('spalla: solo la parte alta; schiena: tutto', () => {
    const spalla = riduciPerDolore(piano(), { dolore: { zona: 'spalla' }, oggi: OGGI, oggiDow: 1 });
    expect(spalla.plan.sedute[0].items[0].serie).toBe(4);
    expect(spalla.plan.sedute[0].items[1].serie).toBe(2);
    const schiena = riduciPerDolore(piano(), { dolore: { zona: 'schiena' }, oggi: OGGI, oggiDow: 1 });
    expect(schiena.plan.sedute[0].items.every((it) => it.adattamento === 'dolore')).toBe(true);
  });
  it('il piano salvato non cambia; "altro" e la scadenza passata non riducono niente; mai sotto 1 serie; idempotente', () => {
    const base = piano();
    riduciPerDolore(base, { dolore: { zona: 'ginocchio' }, oggi: OGGI, oggiDow: 1 });
    expect(base.sedute[0].items[0].serie).toBe(4);
    expect(riduciPerDolore(base, { dolore: { zona: 'altro' }, oggi: OGGI, oggiDow: 1 }).ridotti).toBe(0);
    expect(riduciPerDolore(base, { dolore: { zona: 'ginocchio', fino: '2026-10-20' }, oggi: OGGI, oggiDow: 1 }).ridotti).toBe(0);
    const uno: WeekPlan = { sedute: [{ giorno: 1, titolo: 'L', tipo: 'fisica', durata_min: 30, items: [item('squat-1', 1)] }] };
    expect(riduciPerDolore(uno, { dolore: { zona: 'ginocchio' }, oggi: OGGI, oggiDow: 1 }).plan.sedute[0].items[0].serie).toBe(1);
    const prima = riduciPerDolore(base, { dolore: { zona: 'ginocchio' }, oggi: OGGI, oggiDow: 1 }).plan;
    expect(riduciPerDolore(prima, { dolore: { zona: 'ginocchio' }, oggi: OGGI, oggiDow: 1 }).ridotti).toBe(0);
  });
  it('la nota dice fino a quando, dopo la pausa', () => {
    const { plan } = riduciPerDolore(piano(), { dolore: { zona: 'ginocchio', fino: '2026-11-11' }, oggi: OGGI, oggiDow: 3 });
    expect(plan.sedute[1].items[0].nota).toMatch(/fino al 11\/11, dopo la pausa/);
  });
});

describe('dolore per zona (M9): i testi', () => {
  it('riga dell\'hub e sezione del prompt', () => {
    expect(doloreRiga({ zona: 'ginocchio' }, OGGI)).toMatch(/^Ginocchio: serie ridotte .* finché non dici che è passato\.$/);
    expect(doloreRiga({ zona: 'altro' }, OGGI)).toMatch(/non riduce niente da sola/);
    expect(doloreRiga(null, OGGI)).toBeNull();
    const t = doloreTesto({ zona: 'ginocchio', da: '2026-10-27', intensita: 3 }, OGGI, false);
    expect(t).toMatch(/# DOLORE SEGNALATO/);
    expect(t).toMatch(/gambe, piede e fascia/);
    expect(t).toMatch(/non fa diagnosi/);
    expect(doloreTesto({ zona: 'spalla' }, OGGI, true)).toMatch(/IN PAUSA/);
    expect(doloreTesto(null, OGGI, true)).toMatch(/zona non indicata/);
    expect(doloreTesto(null, OGGI, false)).toBe('');
  });
});

describe('limitazioni del setup (punto 4, 26/10): riduzione cronica', () => {
  it('parseLimitazioni: zone valide senza doppioni (max 4), nota ripulita e tagliata; vuote = niente', () => {
    const l = parseLimitazioni({ zone: ['ginocchio', 'ginocchio', 'testa', 'caviglia', 'anca', 'spalla', 'polpacci'], nota: '  <b>rottura</b>  del crociato  2024  ' });
    expect(l.zone).toEqual(['ginocchio', 'caviglia', 'anca', 'spalla']);
    expect(l.nota).toBe('brottura/b del crociato 2024');
    expect(parseLimitazioni({ nota: 'x'.repeat(400) }).nota).toHaveLength(LIMITAZIONI_NOTA_MAX);
    expect(parseLimitazioni(null)).toEqual({ zone: [], nota: '' });
    expect(limitazioniVuote(parseLimitazioni({}))).toBe(true);
    expect(limitazioniVuote({ zone: [], nota: 'menisco' })).toBe(false);
  });
  it('una zona nel setup riduce come il dolore, senza scadenza, con il suo badge', () => {
    const { plan, ridotti, righe } = riduciPerDolore(piano(), { dolore: null, limitazioni: { zone: ['ginocchio'], nota: '' }, oggi: OGGI, oggiDow: 1 });
    expect(ridotti).toBe(3); // squat lun, squat mer, rdl ven
    expect(plan.sedute[0].items[0].serie).toBe(3);
    expect(plan.sedute[0].items[0].adattamento).toBe('limitazione');
    expect(plan.sedute[0].items[0].nota).toMatch(/^Limitazione \(ginocchio\): serie 4 → 3 \(dal tuo setup/);
    expect(plan.sedute[0].items[1].adattamento).toBeUndefined(); // parte alta intatta
    expect(righe).toHaveLength(1);
    expect(righe[0]).toMatch(/^Ginocchio \(limitazione dal setup\): .*Lunedì, Mercoledì, Venerdì.*finché la tieni/);
  });
  it('dolore e limitazione insieme: ogni esercizio si riduce una volta sola; sulla stessa zona vince il dolore (ha la finestra)', () => {
    const r = riduciPerDolore(piano(), { dolore: { zona: 'spalla', fino: '2026-11-05' }, limitazioni: { zone: ['ginocchio', 'spalla'], nota: '' }, oggi: OGGI, oggiDow: 1 });
    const lun = r.plan.sedute[0];
    expect(lun.items[0].adattamento).toBe('limitazione'); // squat: dal setup
    expect(lun.items[1].adattamento).toBe('dolore');      // push: la spalla segnalata, con la finestra
    expect(lun.items[1].nota).toMatch(/fino al 05\/11/);
    expect(r.righe).toHaveLength(2);
    expect(r.righe[0]).toMatch(/^Spalla:/);
    expect(r.righe[1]).toMatch(/^Ginocchio \(limitazione dal setup\)/);
    expect(riduciPerDolore(r.plan, { dolore: { zona: 'spalla' }, limitazioni: { zone: ['ginocchio'], nota: '' }, oggi: OGGI, oggiDow: 1 }).ridotti).toBe(0); // idempotente
  });
  it('"altro" e la sola nota non riducono niente; le sedute fatte restano intere', () => {
    expect(riduciPerDolore(piano(), { dolore: null, limitazioni: { zone: ['altro'], nota: 'ernia' }, oggi: OGGI, oggiDow: 1 }).ridotti).toBe(0);
    const r = riduciPerDolore(piano(), { dolore: null, limitazioni: { zone: ['ginocchio'], nota: '' }, oggi: OGGI, oggiDow: 3, fatteGiorni: new Set([1]) });
    expect(r.plan.sedute[0].items[0].serie).toBe(4);
    expect(r.ridotti).toBe(2);
  });
  it('i testi: hub, prompt, Coach', () => {
    expect(limitazioniRiga(null)).toBeNull();
    expect(limitazioniRiga({ zone: ['ginocchio', 'caviglia'], nota: '' })).toMatch(/^Limitazioni dal setup \(ginocchio, caviglia\): serie ridotte/);
    expect(limitazioniRiga({ zone: ['altro'], nota: 'x' })).toMatch(/non riduce niente da sola/);
    expect(limitazioniRiga({ zone: [], nota: 'ernia' })).toMatch(/il preparatore ne tiene conto/);
    const t = limitazioniTesto({ zone: ['ginocchio', 'spalla'], nota: 'crociato nel 2024, ok adesso' });
    expect(t).toMatch(/# LIMITAZIONI E INFORTUNI PASSATI/);
    expect(t).toMatch(/Zone: ginocchio, spalla\. Nota sua: "crociato nel 2024, ok adesso"/);
    expect(t).toMatch(/gambe, piede e fascia e parte alta, sempre/);
    expect(t).toMatch(/non fa diagnosi/);
    expect(limitazioniTesto({ zone: [], nota: '' })).toBe('');
    expect(limitazioniPerCoach({ zone: ['anca'], nota: 'operato' })).toMatch(/^- Nel setup del Campo ha scritto infortuni o limitazioni \(anca\): "operato"/);
    expect(limitazioniPerCoach(null)).toBeNull();
  });
});
