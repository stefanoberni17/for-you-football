import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessoCoach, finestraGratis, FREE_COACH_GIORNI, testoCoachChiuso } from '@/lib/coachGratis';
import { FREE_COACH_MESSAGES } from '@/lib/constants';

// I casi chiesti da Ste il 9/11: gratis valido, gratis scaduto con messaggi rimasti, prova attiva, prova scaduta,
// pacchetto solo Corpo, Mente, Completo; più beta, pausa, cancellazione e paywall spento.
const ADESSO = new Date('2026-11-20T12:00:00Z').getTime();
const giorniFa = (n: number) => new Date(ADESSO - n * 86_400_000).toISOString();
const traGiorni = (n: number) => new Date(ADESSO + n * 86_400_000).toISOString();

describe('Coach gratis: chi si è registrato con la prova con la carta (interruttore acceso)', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', '1'));
  afterEach(() => vi.unstubAllEnvs());

  const nuovo = { created_at: giorniFa(3) };

  it('prova del Mente in corso: 20 messaggi fino alla fine della prova', () => {
    const p = { ...nuovo, subscription_status: 'trialing', piano: 'mentale', trial_ends_at: traGiorni(4) };
    expect(accessoCoach(p, { usati: 0, adesso: ADESSO })).toEqual({ ok: true, illimitato: false, rimasti: FREE_COACH_MESSAGES, fino: p.trial_ends_at, tipo: 'prova' });
    expect(accessoCoach(p, { usati: 19, adesso: ADESSO })).toMatchObject({ ok: true, rimasti: 1 });
    expect(accessoCoach(p, { usati: 20, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'limite_gratis' });
  });

  it('prova del Completo in corso: come il Mente', () => {
    const p = { ...nuovo, subscription_status: 'trialing', piano: 'completo', trial_ends_at: traGiorni(4) };
    expect(accessoCoach(p, { usati: 5, adesso: ADESSO })).toMatchObject({ ok: true, illimitato: false, rimasti: 15 });
  });

  it('prova scaduta senza pagamento: chiuso anche con messaggi rimasti', () => {
    const p = { ...nuovo, subscription_status: 'canceled', piano: 'mentale', trial_ends_at: giorniFa(1) };
    expect(accessoCoach(p, { usati: 4, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'prova_finita' });
  });

  it('stato ancora "trialing" ma la data di fine è passata: chiuso (il webhook non è ancora arrivato)', () => {
    const p = { ...nuovo, subscription_status: 'trialing', piano: 'mentale', trial_ends_at: giorniFa(1) };
    expect(accessoCoach(p, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'prova_finita' });
  });

  it('prova non ancora iniziata: il Coach si apre con la prova', () => {
    expect(accessoCoach({ ...nuovo, subscription_status: 'none' }, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'prova_da_iniziare' });
  });

  it('restare alla settimana 1 non allunga niente: la regola non guarda il percorso', () => {
    const p = { ...nuovo, subscription_status: 'canceled', piano: 'mentale', trial_ends_at: giorniFa(30), current_week: 1 };
    expect(accessoCoach(p, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'prova_finita' });
  });

  it('pacchetto solo Corpo, in prova o attivo: il Coach non c\'è', () => {
    for (const s of ['trialing', 'active']) {
      const p = { ...nuovo, subscription_status: s, piano: 'fisico_medio', trial_ends_at: traGiorni(4) };
      expect(accessoCoach(p, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'non_nel_pacchetto' });
    }
  });

  it('Mente e Completo attivi o in tolleranza: senza limite', () => {
    for (const piano of ['mentale', 'completo']) {
      for (const s of ['active', 'past_due']) {
        expect(accessoCoach({ ...nuovo, subscription_status: s, piano }, { usati: 500, adesso: ADESSO })).toEqual({ ok: true, illimitato: true });
      }
    }
  });
});

describe('Coach gratis: chi non passa dalla prova (interruttore spento o iscritto prima)', () => {
  beforeEach(() => vi.stubEnv('NEXT_PUBLIC_PROVA_CON_CARTA', ''));
  afterEach(() => vi.unstubAllEnvs());

  it(`gratis ancora valido: ${FREE_COACH_GIORNI} giorni dalla registrazione`, () => {
    const p = { created_at: giorniFa(2), subscription_status: 'none' };
    const e = accessoCoach(p, { usati: 3, adesso: ADESSO });
    expect(e).toMatchObject({ ok: true, illimitato: false, rimasti: 17, tipo: 'iscrizione' });
    expect(finestraGratis(p)?.fino).toBe(new Date(new Date(p.created_at).getTime() + FREE_COACH_GIORNI * 86_400_000).toISOString());
  });

  it('gratis scaduto con messaggi rimasti: chiuso', () => {
    const p = { created_at: giorniFa(FREE_COACH_GIORNI + 1), subscription_status: 'none' };
    expect(accessoCoach(p, { usati: 2, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'gratis_finito' });
  });

  it('nel periodo, 20 messaggi usati: chiuso', () => {
    expect(accessoCoach({ created_at: giorniFa(1) }, { usati: 20, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'limite_gratis' });
  });

  it('senza data di registrazione: niente periodo gratis', () => {
    expect(accessoCoach({ subscription_status: 'none' }, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'gratis_finito' });
  });
});

describe('Coach gratis: accessi autorizzati e blocchi', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('beta e Season 1: senza limite, anche dopo mesi', () => {
    expect(accessoCoach({ is_beta_free: true, created_at: giorniFa(200) }, { usati: 999, adesso: ADESSO })).toEqual({ ok: true, illimitato: true });
    expect(accessoCoach({ season1_access: true, created_at: giorniFa(200) }, { usati: 999, adesso: ADESSO })).toEqual({ ok: true, illimitato: true });
  });

  it('in pausa: chiuso, anche con il Mente', () => {
    const p = { subscription_status: 'active', piano: 'mentale', pausa_fino: traGiorni(10) };
    expect(accessoCoach(p, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'pausa', fino: p.pausa_fino });
  });

  it('account in cancellazione: chiuso, anche beta', () => {
    expect(accessoCoach({ is_beta_free: true, deleted_at: giorniFa(1) }, { usati: 0, adesso: ADESSO })).toMatchObject({ ok: false, motivo: 'cancellazione' });
  });

  it('paywall spento (Stripe non configurato): aperto', () => {
    expect(accessoCoach({ created_at: giorniFa(300) }, { usati: 99, adesso: ADESSO, paywall: false })).toEqual({ ok: true, illimitato: true });
  });

  it('ogni motivo ha il suo testo', () => {
    for (const m of ['cancellazione', 'pausa', 'limite_gratis', 'gratis_finito', 'prova_finita', 'prova_da_iniziare', 'non_nel_pacchetto'] as const) {
      expect(testoCoachChiuso(m, traGiorni(1)).length).toBeGreaterThan(20);
    }
    expect(testoCoachChiuso('prova_finita', '2026-11-19T10:00:00Z')).toContain('19 novembre');
  });
});
