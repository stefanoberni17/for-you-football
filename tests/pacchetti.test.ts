import { describe, expect, it } from 'vitest';
import {
  INFO_PACCHETTI, inizioFinestra, letturaPrice, messaggiPreparatoreRimasti, obiettiviPerLivello, pacchettoDi,
  riprogrammazioniRimaste, sedutePerLivello,
} from '@/lib/listino';
import { fisicoInProva, hasActiveAccess, haAccessoOProva, inPausa, inProva, livelloFisico } from '@/lib/checkAccess';
import {
  codicePersonale, esitoInvito, esitoPausa, mesiInfortunio, motivoInfortunio, piuMesi, premiatiNellaFinestra, ritornoValido,
} from '@/lib/pausaInviti';
import { pianoSettimanaBlocco, settimanaDelBlocco } from '@/lib/trainingBlocco';
import type { WeekPlan } from '@/lib/trainingEngine';

describe('pacchetti (3/11)', () => {
  it('cosa dà ogni pacchetto; un abbonamento di prima del 3/11 è Mente', () => {
    expect(INFO_PACCHETTI.completo).toMatchObject({ mente: true, fisico: 'pro' });
    expect(INFO_PACCHETTI.fisico_medio).toMatchObject({ mente: false, fisico: 'medio' });
    expect(pacchettoDi(null)).toBe('mentale');
    expect(pacchettoDi('fisico_base')).toBe('fisico_base');
    expect(letturaPrice({ lookup_key: 'fyf_completo_lancio' })).toEqual({ pacchetto: 'completo', tipo: 'lancio' });
    expect(letturaPrice({ lookup_key: 'altro' })).toEqual({ pacchetto: null, tipo: null });
  });

  it('accessi: il Fisico da solo non apre il Mente; il Completo apre tutti e due; la pausa chiude', () => {
    const fisico = { subscription_status: 'active', piano: 'fisico_medio' };
    expect(hasActiveAccess(fisico)).toBe(false);
    expect(livelloFisico(fisico)).toBe('medio');
    expect(haAccessoOProva(fisico)).toBe(true);
    const completo = { subscription_status: 'active', piano: 'completo' };
    expect(hasActiveAccess(completo)).toBe(true);
    expect(livelloFisico(completo)).toBe('pro');
    const mente = { subscription_status: 'active', piano: 'mentale' };
    expect(livelloFisico(mente)).toBeNull();
    // prima del 3/11: piano vuoto = Mente
    expect(hasActiveAccess({ subscription_status: 'active', piano: null })).toBe(true);
    // il flag a mano vale Pro anche senza abbonamento
    expect(livelloFisico({ training_access: true })).toBe('pro');
    // in prova sul Fisico: il Mente non è in prova
    const provaFisico = { subscription_status: 'trialing', piano: 'fisico_base' };
    expect(inProva(provaFisico)).toBe(false);
    expect(fisicoInProva(provaFisico)).toBe(true);
    // pausa: niente Mente, livello che resta (la pausa chiude le scritture), poi riprende da solo
    const adesso = Date.parse('2026-12-10T10:00:00Z');
    const pausa = { subscription_status: 'active', piano: 'completo', pausa_fino: '2027-02-10T10:00:00Z' };
    expect(inPausa(pausa, adesso)).toBe(true);
    expect(inPausa({ ...pausa, pausa_fino: '2026-12-01T00:00:00Z' }, adesso)).toBe(false);
    expect(livelloFisico({ subscription_status: 'canceled', piano: 'fisico_pro' })).toBeNull();
    expect(livelloFisico({ subscription_status: 'active', piano: 'fisico_pro', deleted_at: '2026-12-01' })).toBeNull();
  });

  it('livelli: aree, giornate, riprogrammazioni, messaggi al preparatore', () => {
    expect(obiettiviPerLivello('base', ['gambe', 'parte_alta'])).toEqual(['gambe']);
    expect(obiettiviPerLivello('medio', ['tutto'])).toEqual([]);
    expect(obiettiviPerLivello('medio', ['gambe', 'parte_alta', 'velocita'])).toEqual(['gambe', 'parte_alta']);
    expect(obiettiviPerLivello('pro', ['tutto'])).toEqual(['tutto']);
    expect(sedutePerLivello('base', 4)).toBe(2);
    expect(sedutePerLivello('medio', 4)).toBe(3);
    expect(sedutePerLivello('pro', 6)).toBe(6);
    expect(riprogrammazioniRimaste('base', { usate: 0, inProva: false, usateInProva: 0 })).toBe(1);
    expect(riprogrammazioniRimaste('medio', { usate: 1, inProva: false, usateInProva: 0 })).toBe(1);
    expect(riprogrammazioniRimaste('pro', { usate: 2, inProva: false, usateInProva: 0 })).toBe(0);
    expect(riprogrammazioniRimaste('pro', { usate: 0, inProva: true, usateInProva: 1 })).toBe(0);
    expect(messaggiPreparatoreRimasti('base', 0)).toBe(0);
    expect(messaggiPreparatoreRimasti('medio', 4)).toBe(6);
    expect(messaggiPreparatoreRimasti('pro', 400)).toBeNull();
    expect(inizioFinestra('2026-12-17', 'mese')).toBe('2026-12-01');
    expect(inizioFinestra('2026-12-17', 'settimana')).toBe('2026-12-14'); // giovedì → lunedì
    expect(inizioFinestra('2026-12-14', 'settimana')).toBe('2026-12-14');
  });

  it('pausa: 2 mesi, una volta ogni 12; mai in prova o senza abbonamento; infortunio 1-6 mesi', () => {
    const adesso = new Date('2027-01-20T10:00:00Z');
    expect(esitoPausa({ stato: 'active', inPausa: false, pause: [], adesso })).toEqual({ ok: true, fino: new Date('2027-03-20T10:00:00Z') });
    expect(esitoPausa({ stato: 'trialing', inPausa: false, pause: [], adesso })).toEqual({ ok: false, motivo: 'in_prova' });
    expect(esitoPausa({ stato: 'canceled', inPausa: false, pause: [], adesso })).toEqual({ ok: false, motivo: 'non_abbonato' });
    expect(esitoPausa({ stato: 'active', inPausa: true, pause: [], adesso })).toEqual({ ok: false, motivo: 'gia_in_pausa' });
    const usata = esitoPausa({ stato: 'active', inPausa: false, pause: [{ inizio: '2026-06-01T00:00:00Z', tipo: 'standard', stato: 'finita' }], adesso });
    expect(usata).toMatchObject({ ok: false, motivo: 'gia_usata' });
    // l'infortunio non conta, una pausa di 13 mesi fa nemmeno
    expect(esitoPausa({ stato: 'active', inPausa: false, pause: [{ inizio: '2026-12-01T00:00:00Z', tipo: 'infortunio', stato: 'finita' }], adesso }).ok).toBe(true);
    expect(esitoPausa({ stato: 'active', inPausa: false, pause: [{ inizio: '2025-12-01T00:00:00Z', tipo: 'standard', stato: 'finita' }], adesso }).ok).toBe(true);
    expect(piuMesi(new Date('2027-01-31T00:00:00Z'), 1).toISOString().slice(0, 10)).toBe('2027-02-28');
    expect(motivoInfortunio('  crociato,   fermo  ')).toBe('crociato, fermo');
    expect(motivoInfortunio('')).toBeNull();
    expect(mesiInfortunio('4')).toBe(4);
    expect(mesiInfortunio(7)).toBeNull();
    expect(ritornoValido({ price_id: 'price_1', coupon_id: null, fino: '2027-06-01' }, Date.parse('2027-01-01'))).toBe(true);
    expect(ritornoValido({ price_id: 'price_1', coupon_id: null, fino: '2026-06-01' }, Date.parse('2027-01-01'))).toBe(false);
  });

  it('inviti: premio dopo 14 giorni senza rimborso, carta diversa, massimo 10 in 12 mesi', () => {
    const adesso = new Date('2027-01-20T10:00:00Z');
    const inv = { id: 'i1', invitante: 'a', invitato: 'b', pagato_at: '2027-01-01T10:00:00Z', rimborsato: false, stato: 'in_attesa' as const };
    const ok = { adesso, premiatiUltimi12Mesi: 0, stessaCarta: false };
    expect(esitoInvito(inv, ok)).toEqual({ azione: 'premia' });
    expect(esitoInvito({ ...inv, pagato_at: '2027-01-10T10:00:00Z' }, ok)).toEqual({ azione: 'aspetta' });
    expect(esitoInvito({ ...inv, pagato_at: null }, ok)).toEqual({ azione: 'aspetta' });
    expect(esitoInvito({ ...inv, rimborsato: true }, ok)).toEqual({ azione: 'scarta', motivo: 'rimborsato' });
    expect(esitoInvito(inv, { ...ok, stessaCarta: true })).toEqual({ azione: 'scarta', motivo: 'stessa_carta' });
    expect(esitoInvito(inv, { ...ok, premiatiUltimi12Mesi: 10 })).toEqual({ azione: 'scarta', motivo: 'tetto' });
    expect(esitoInvito({ ...inv, invitato: 'a' }, ok)).toEqual({ azione: 'scarta', motivo: 'auto_invito' });
    expect(esitoInvito({ ...inv, stato: 'premiato' }, ok)).toEqual({ azione: 'aspetta' });
    expect(premiatiNellaFinestra([
      { stato: 'premiato', premiato_at: '2026-12-01T00:00:00Z' },
      { stato: 'premiato', premiato_at: '2025-12-01T00:00:00Z' },
      { stato: 'scartato', premiato_at: null },
    ], adesso)).toBe(1);
    const cod = codicePersonale('Niccolò', () => 0);
    expect(cod).toMatch(/^NCCL[A-Z2-9]{4}$/);
    expect(codicePersonale(null, () => 0.5)).toMatch(/^FYF[A-Z2-9]{4}$/);
  });

  it('Fisico Base a blocchi: settimane 2-3 un passo in più, 4 di scarico, stessi giorni', () => {
    const s1: WeekPlan = {
      sedute: [{
        giorno: 2, titolo: 'Gambe', tipo: 'fisica', durata_min: 40,
        items: [
          { esercizio_id: 'squat-1', serie: 3, quantita: 10, recupero_sec: 90 },
          { esercizio_id: 'squat-1', serie: 3, quantita: 3, recupero_sec: 0, schema: 'emom', emom_gruppo: 'g' },
          { esercizio_id: 'x', serie: 4, quantita: 6, recupero_sec: 120, carico_kg: 40 },
        ],
      }],
    };
    const s2 = pianoSettimanaBlocco(s1, 2, '2026-12-07');
    expect(s2.sedute[0].giorno).toBe(2);
    expect(s2.sedute[0].items[0].quantita).toBe(11);
    expect(s2.sedute[0].items[1].quantita).toBe(3); // EMOM fermo
    expect(s2.sedute[0].items[2].carico_kg).toBe(41);
    expect(s2.blocco).toEqual({ inizio: '2026-12-07', settimana: 2, di: 4 });
    const s3 = pianoSettimanaBlocco(s1, 3, '2026-12-07');
    expect(s3.sedute[0].items[0].quantita).toBe(12);
    const s4 = pianoSettimanaBlocco(s1, 4, '2026-12-07');
    expect(s4.scarico).toBe(true);
    expect(s4.sedute[0].items[0].serie).toBe(2);
    expect(s4.sedute[0].items[0].quantita).toBe(10);
    expect(s1.sedute[0].items[0].quantita).toBe(10); // la settimana 1 non si tocca
    expect(settimanaDelBlocco('2026-12-07', '2026-12-21')).toBe(3);
    expect(settimanaDelBlocco('2026-12-07', '2027-01-04')).toBeNull(); // finito: blocco nuovo
    expect(settimanaDelBlocco(null, '2026-12-07')).toBeNull();
  });
});

// ─── Il Campo per livello sui piani veri (atleti finti, piano base senza Claude) ─────────────────────────────
import { contextFinto, SCENARI } from '@/lib/trainingSimulazione';
import { generaPianoV2, validateCtxFor } from '@/lib/trainingPlannerV2';
import { validatePlan as validaPiano, type PlanSession } from '@/lib/trainingEngine';
import { FOCUS_QUALITA } from '@/lib/trainingRequest';
import { applicaResoconti, type Resoconto } from '@/lib/trainingResoconto';
import { bloccoCopre } from '@/lib/trainingVelocita';

const sempre = ['fascia-prevenzione', 'mobilita-recupero'];
const fisiche = (sedute: PlanSession[]) => sedute.filter((s) => s.tipo === 'fisica' || s.tipo === 'mix');

describe('Campo per livello: aree e giornate (3/11)', () => {
  for (const sc of SCENARI.filter((x) => !x.richiesta)) {
    for (const livello of ['base', 'medio', 'pro'] as const) {
      it(`${sc.id} · ${livello}: il piano base sta nel pacchetto e passa dal validatore`, async () => {
        const ctx = contextFinto(sc.atleta, livello);
        const e = await generaPianoV2(ctx, undefined, {}, { senzaClaude: true });
        expect(validaPiano(e.plan, validateCtxFor(e.ctx))).toEqual([]);
        if (livello === 'pro') return;
        const aree = livello === 'base' ? 1 : 2;
        expect(e.ctx.obiettivi.length).toBeLessThanOrEqual(aree);
        expect(e.ctx.obiettivi).not.toContain('tutto');
        expect(e.plan.sedute.length).toBeLessThanOrEqual(livello === 'base' ? 2 : 3);
        // nessun blocco di lavoro fuori dalle aree scelte
        const ammesse = e.ctx.obiettivi.flatMap((f) => [...FOCUS_QUALITA[f]]);
        for (const s of e.plan.sedute) for (const b of s.blocchi ?? []) {
          if (sempre.includes(b.qualita) || b.id === 'risc-velocita') continue;
          const bl = e.ctx.blocchi.find((x) => x.id === b.id);
          expect(bl ? bloccoCopre(bl, ammesse) : ammesse.includes(b.qualita), `${sc.id} ${livello}: ${b.id} (${b.qualita}) fuori da ${e.ctx.obiettivi.join(',')}`).toBe(true);
        }
        expect(fisiche(e.plan.sedute).length).toBeLessThanOrEqual(livello === 'base' ? 2 : 3);
      });
    }
  }
});

describe('Base e Medio: il feedback non rimodula il resto del piano (3/11)', () => {
  const lunedi = '2026-11-02';
  const seduta = (giorno: number): PlanSession => ({
    giorno, titolo: `G${giorno}`, tipo: 'fisica', durata_min: 40,
    items: [{ esercizio_id: 'squat-2', serie: 4, quantita: 10, recupero_sec: 90 }],
  });
  const plan = { sedute: [seduta(3), seduta(4), seduta(6)] };
  const alta: Resoconto = { data: '2026-11-02', tipo: 'squadra', rpe: 9, durata_min: 90, qualita: [], stanchezza: null, fastidio_zona: null, testa: null, testa_nota: null, voti: null, rpe_previsto: 6 } as unknown as Resoconto;
  it('fatica alta: al Pro le sedute dei 2 giorni dopo più leggere, al Base/Medio solo la prima', () => {
    const pro = applicaResoconti(plan, { weekStart: lunedi, oggi: '2026-11-03', resoconti: [alta], fatteGiorni: new Set() }).plan;
    const bm = applicaResoconti(plan, { weekStart: lunedi, oggi: '2026-11-03', resoconti: [alta], fatteGiorni: new Set(), soloSicurezza: true }).plan;
    expect(pro.sedute.find((s) => s.giorno === 3)!.items[0].serie).toBe(3);
    expect(bm.sedute.find((s) => s.giorno === 3)!.items[0].serie).toBe(3);
    expect(bm.sedute.find((s) => s.giorno === 4)!.items[0].serie).toBe(4);
  });
  it('più fatica del previsto (livello 1): al Pro serie facoltative, al Base/Medio niente', () => {
    const r: Resoconto = { ...alta, rpe: 8, rpe_previsto: 5 } as Resoconto;
    const pro = applicaResoconti(plan, { weekStart: lunedi, oggi: '2026-11-03', resoconti: [r], fatteGiorni: new Set() }).plan;
    const bm = applicaResoconti(plan, { weekStart: lunedi, oggi: '2026-11-03', resoconti: [r], fatteGiorni: new Set(), soloSicurezza: true }).plan;
    expect(pro.sedute.some((s) => s.items.some((it) => it.facoltativo))).toBe(true);
    expect(bm.sedute.some((s) => s.items.some((it) => it.facoltativo))).toBe(false);
  });
});
