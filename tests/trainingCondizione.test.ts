import { describe, expect, it } from 'vitest';
import {
  acwrPerSettimana, CHECKIN_FRESCO_MIN, condizioneAtleta, condizioneRiga, famiglieDureDiFila, FATTORE_FRESCO, FATTORE_STANCO,
  ritestDaiDati, scaricoDaiDati, SCARICO_DISTANZA_MIN, TETTO_DURO_STANCO, type SedutaCondizione,
} from '@/lib/trainingCondizione';
import { calcolaCarico, type SettimanaCarico } from '@/lib/trainingLoad';

const OGGI = '2026-10-26'; // lunedì
const LUNEDI = '2026-10-26';
const giornoFa = (n: number) => {
  const d = new Date(`${OGGI}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};
const checkins = (n: number, fisico: number, recupero: number) => Array.from({ length: n }, (_, i) => ({ date: giornoFa(i), physical_state: fisico, recovery_quality: recupero }));
const seduta = (giorniFa: number, rpe: number | null, blocchi: { id: string; giudizio: 'facile' | 'ok' | 'duro' }[] = []): SedutaCondizione => ({ completed_at: `${giornoFa(giorniFa)}T18:00:00Z`, rpe, feedback_blocchi: blocchi });
const settimane = (carichi: number[]): SettimanaCarico[] => carichi.map((c, i) => ({ lunedi: `w${i}`, carico: c, sedute: c > 0 ? 3 : 0, corrente: i === carichi.length - 1 }));
const famiglia = (id: string) => (id.startsWith('plio-') ? 'Pliometria' : id.startsWith('fpb-') ? 'Forza Parte Bassa' : null);

describe('condizione dell\'atleta e tetto personale (Ste, 26/10)', () => {
  it('senza dati: normale, fattore 1', () => {
    const c = condizioneAtleta({ checkins: [], sedute: [], resoconti: [], oggi: OGGI });
    expect(c.stato).toBe('normale');
    expect(c.fattore).toBe(1);
    expect(condizioneRiga(c)).toBeNull();
  });

  it('stanco dai check-in: media fisico+recupero ≤ 5 su almeno 5 check-in → tetto −15 %, tetto duro −10 %', () => {
    const c = condizioneAtleta({ checkins: checkins(6, 5, 4), sedute: [seduta(2, 6)], resoconti: [], oggi: OGGI });
    expect(c.stato).toBe('stanco');
    expect(c.fattore).toBe(FATTORE_STANCO);
    expect(c.fattoreTettoDuro).toBe(TETTO_DURO_STANCO);
    expect(c.motivi[0]).toMatch(/4\.5\/10/);
    expect(condizioneRiga(c)).toMatch(/scende del 15 %/);
  });

  it('pochi check-in non dicono niente; i check-in vecchi (oltre 14 giorni) non contano', () => {
    expect(condizioneAtleta({ checkins: checkins(4, 3, 3), sedute: [], resoconti: [], oggi: OGGI }).stato).toBe('normale');
    const vecchi = checkins(6, 3, 3).map((k, i) => ({ ...k, date: giornoFa(20 + i) }));
    expect(condizioneAtleta({ checkins: vecchi, sedute: [], resoconti: [], oggi: OGGI }).stato).toBe('normale');
  });

  it('stanco dalle sedute: 2 sedute con voto ≥ 9 (o "duro" senza voto)', () => {
    const c = condizioneAtleta({ checkins: [], sedute: [seduta(1, 9), seduta(4, 10), seduta(8, 6)], resoconti: [], oggi: OGGI });
    expect(c.stato).toBe('stanco');
    expect(c.motivi[0]).toMatch(/2 sedute con voto 9/);
    const d = condizioneAtleta({ checkins: [], sedute: [{ completed_at: `${giornoFa(1)}T18:00:00Z`, rpe: null, feedback: 'duro' }, { completed_at: `${giornoFa(3)}T18:00:00Z`, rpe: null, feedback: 'duro' }], resoconti: [], oggi: OGGI });
    expect(d.stato).toBe('stanco');
  });

  it('stanco dai resoconti: 2 volte fatica ≥ 3 sopra il previsto', () => {
    const c = condizioneAtleta({ checkins: [], sedute: [], resoconti: [{ data: giornoFa(2), rpe: 9, rpe_previsto: 6 }, { data: giornoFa(5), rpe: 10, rpe_previsto: 6 }, { data: giornoFa(7), rpe: 7, rpe_previsto: 6 }], oggi: OGGI });
    expect(c.stato).toBe('stanco');
    expect(c.motivi[0]).toMatch(/2 volte/);
  });

  it('fresco: check-in ≥ 7,5, nessuna seduta dura, almeno 3 sedute tutte facili → tetto +15 %, tetto duro invariato', () => {
    const c = condizioneAtleta({ checkins: checkins(7, 8, 8), sedute: [seduta(1, 4), seduta(3, 5), seduta(6, 3)], resoconti: [], oggi: OGGI });
    expect(c.stato).toBe('fresco');
    expect(c.fattore).toBe(FATTORE_FRESCO);
    expect(c.fattoreTettoDuro).toBe(1);
    expect(c.segnali.checkinMedia).toBeGreaterThanOrEqual(CHECKIN_FRESCO_MIN);
    expect(condizioneRiga(c)).toMatch(/sale del 15 %/);
  });

  it('non fresco con una seduta "giusta" (voto 6), con poche sedute o senza check-in', () => {
    expect(condizioneAtleta({ checkins: checkins(7, 8, 8), sedute: [seduta(1, 4), seduta(3, 6), seduta(6, 3)], resoconti: [], oggi: OGGI }).stato).toBe('normale');
    expect(condizioneAtleta({ checkins: checkins(7, 8, 8), sedute: [seduta(1, 4), seduta(3, 4)], resoconti: [], oggi: OGGI }).stato).toBe('normale');
    expect(condizioneAtleta({ checkins: [], sedute: [seduta(1, 4), seduta(3, 4), seduta(5, 4)], resoconti: [], oggi: OGGI }).stato).toBe('normale');
  });

  it('stanco vince su fresco', () => {
    const c = condizioneAtleta({ checkins: checkins(7, 8, 8), sedute: [seduta(1, 4), seduta(3, 4), seduta(6, 4)], resoconti: [{ data: giornoFa(2), rpe: 9, rpe_previsto: 6 }, { data: giornoFa(5), rpe: 9, rpe_previsto: 6 }], oggi: OGGI });
    expect(c.stato).toBe('stanco');
  });

  it('il fattore entra nel carico: target e tetto ×0,85 e tetto duro ×0,9 se stanco; ×1,15 e tetto duro uguale se fresco', () => {
    const plans = [{ id: 'p', plan: { sedute: [{ giorno: 1, titolo: 'A', tipo: 'fisica' as const, durata_min: 60, items: [] }] } }];
    const compl = [21, 14, 7].flatMap((k) => [0, 2].map((d) => ({ session_key: `p#1`, plan_id: 'p', feedback: null, completed_at: `${giornoFa(k + d + 1)}T18:00:00Z`, rpe: 7 })));
    const base = calcolaCarico({ completions: compl, setRpe: [], plans, oggi: OGGI, lunedi: LUNEDI });
    expect(base.tetto).not.toBeNull();
    const stanco = calcolaCarico({ completions: compl, setRpe: [], plans, oggi: OGGI, lunedi: LUNEDI, condizione: { stato: 'stanco', fattore: FATTORE_STANCO, fattoreTettoDuro: TETTO_DURO_STANCO, motivi: ['x'] } });
    expect(stanco.tetto).toBe(Math.round(base.tetto! * FATTORE_STANCO));
    expect(stanco.target!.max).toBe(Math.round(base.target!.max * FATTORE_STANCO));
    expect(stanco.tettoDuro).toBe(Math.round(base.tettoDuro! * TETTO_DURO_STANCO));
    expect(stanco.condizione?.stato).toBe('stanco');
    const fresco = calcolaCarico({ completions: compl, setRpe: [], plans, oggi: OGGI, lunedi: LUNEDI, condizione: { stato: 'fresco', fattore: FATTORE_FRESCO, fattoreTettoDuro: 1, motivi: ['x'] } });
    expect(fresco.tetto).toBe(Math.round(base.tetto! * FATTORE_FRESCO));
    expect(fresco.tettoDuro).toBe(base.tettoDuro);
  });
});

describe('scarico dai dati (M11)', () => {
  const base = { squadra: 0, lunedi: LUNEDI, ultimoScarico: null, settimanaCalendario: 2, condizione: { stato: 'normale' as const }, famiglia };

  it('rapporto per settimana: ogni settimana completa contro la media delle complete prima', () => {
    expect(acwrPerSettimana(settimane([100, 150, 200, 50]), 0)).toEqual([null, 1.5, 1.6]);
    // con la squadra come base il rapporto si schiaccia
    expect(acwrPerSettimana(settimane([100, 150, 200, 50]), 1000)[2]).toBe(1.1);
  });

  it('niente segnali, settimana 2: niente scarico e nessun motivo', () => {
    const e = scaricoDaiDati({ ...base, settimane: settimane([300, 320, 330, 0]), sedute: [seduta(3, 6), seduta(6, 7)] });
    expect(e.isDeload).toBe(false);
    expect(e.rinviato).toBeNull();
  });

  it('rapporto sopra 1,3 per due settimane di fila → scarico anche a metà ciclo', () => {
    const e = scaricoDaiDati({ ...base, settimane: settimane([100, 150, 200, 0]), sedute: [seduta(3, 6)] });
    expect(e.isDeload).toBe(true);
    expect(e.motivo).toMatch(/sopra 1.3 da 2 settimane/);
  });

  it('voto medio delle sedute ≥ 8 (almeno 3 votate nelle ultime 2 settimane) → scarico', () => {
    const e = scaricoDaiDati({ ...base, settimane: settimane([300, 300, 300, 0]), sedute: [seduta(2, 8), seduta(5, 9), seduta(9, 8), seduta(20, 9)] });
    expect(e.isDeload).toBe(true);
    expect(e.motivo).toMatch(/voto medio di 8.3/);
    // due sole sedute votate non bastano
    expect(scaricoDaiDati({ ...base, settimane: settimane([300, 300, 300, 0]), sedute: [seduta(2, 9), seduta(5, 9)] }).isDeload).toBe(false);
  });

  it('una famiglia "duro" due volte di fila → scarico con il nome della famiglia', () => {
    const sedute = [seduta(2, 7, [{ id: 'plio-b2', giudizio: 'duro' }]), seduta(9, 7, [{ id: 'plio-b1', giudizio: 'duro' }, { id: 'fpb-b1', giudizio: 'ok' }]), seduta(16, 6, [{ id: 'plio-b1', giudizio: 'facile' }])];
    expect(famiglieDureDiFila(sedute, famiglia)).toEqual(['Pliometria']);
    const e = scaricoDaiDati({ ...base, settimane: settimane([300, 300, 300, 0]), sedute });
    expect(e.isDeload).toBe(true);
    expect(e.motivo).toMatch(/Pliometria: "duro" 2 volte di fila/);
    // duro poi ok: niente
    expect(famiglieDureDiFila([seduta(2, 7, [{ id: 'plio-b2', giudizio: 'ok' }]), seduta(9, 7, [{ id: 'plio-b1', giudizio: 'duro' }])], famiglia)).toEqual([]);
  });

  it('mai due scarichi a meno di 3 settimane: con i segnali la settimana resta normale e il motivo lo dice', () => {
    const e = scaricoDaiDati({ ...base, ultimoScarico: '2026-10-12', settimane: settimane([100, 150, 200, 0]), sedute: [] });
    expect(e.isDeload).toBe(false);
    expect(e.rinviato).toMatch(/2 settimane fa: ne servono almeno 3/);
    expect(e.segnali.length).toBe(1);
    const ok = scaricoDaiDati({ ...base, ultimoScarico: addDays(LUNEDI, -7 * SCARICO_DISTANZA_MIN), settimane: settimane([100, 150, 200, 0]), sedute: [] });
    expect(ok.isDeload).toBe(true);
  });

  it('quarta settimana del ciclo: resta come rete, con le settimane di lavoro alle spalle', () => {
    const e = scaricoDaiDati({ ...base, settimanaCalendario: 4, settimane: settimane([300, 310, 320, 0]), sedute: [] });
    expect(e.isDeload).toBe(true);
    expect(e.motivo).toMatch(/quarta settimana/);
  });

  it('quarta settimana ma poche sedute prima → rinviato; quarta settimana con l\'atleta fresco e senza segnali → si salta', () => {
    const poche = scaricoDaiDati({ ...base, settimanaCalendario: 4, settimane: settimane([0, 0, 300, 0]), sedute: [] });
    expect(poche.isDeload).toBe(false);
    expect(poche.rinviato).toMatch(/poche sedute/);
    const fresco = scaricoDaiDati({ ...base, settimanaCalendario: 4, condizione: { stato: 'fresco' }, settimane: settimane([300, 310, 320, 0]), sedute: [] });
    expect(fresco.isDeload).toBe(false);
    expect(fresco.rinviato).toMatch(/sei fresco/);
    // fresco ma con un segnale dai dati: lo scarico si fa
    const segnale = scaricoDaiDati({ ...base, settimanaCalendario: 4, condizione: { stato: 'fresco' }, settimane: settimane([100, 150, 200, 0]), sedute: [] });
    expect(segnale.isDeload).toBe(true);
  });

  it('lo scarico già avviato resta per tutta la settimana', () => {
    const e = scaricoDaiDati({ ...base, scaricoInCorso: true, settimane: settimane([300, 300, 300, 0]), sedute: [] });
    expect(e.isDeload).toBe(true);
    expect(e.motivo).toMatch(/già avviata/);
  });
});

describe('ri-test dai dati (M11)', () => {
  const base = { lunedi: LUNEDI, ultimoScarico: null, ultimoTest: null, famiglieAlTetto: [], settimanaCalendario: 2, isDeload: false };

  it('niente motivi → niente ri-test; nella settimana di scarico mai', () => {
    expect(ritestDaiDati(base)).toEqual({ settimanaRitest: false, ritestDue: false, motivo: null });
    expect(ritestDaiDati({ ...base, settimanaCalendario: 5, isDeload: true }).settimanaRitest).toBe(false);
  });

  it('le due settimane dopo uno scarico salvato (non la terza)', () => {
    expect(ritestDaiDati({ ...base, ultimoScarico: '2026-10-19', ultimoTest: '2026-09-20T10:00:00Z' })).toMatchObject({ settimanaRitest: true, ritestDue: true, motivo: 'dopo lo scarico si rifanno i test' });
    expect(ritestDaiDati({ ...base, ultimoScarico: '2026-10-12', ultimoTest: '2026-09-20T10:00:00Z' }).settimanaRitest).toBe(true);
    expect(ritestDaiDati({ ...base, ultimoScarico: '2026-10-05', ultimoTest: '2026-09-20T10:00:00Z' }).settimanaRitest).toBe(false);
  });

  it('senza uno scarico salvato vale il calendario (settimane 5-6, 9-10…); con lo scarico salvato il calendario non conta', () => {
    expect(ritestDaiDati({ ...base, settimanaCalendario: 5 }).settimanaRitest).toBe(true);
    expect(ritestDaiDati({ ...base, settimanaCalendario: 6 }).settimanaRitest).toBe(true);
    expect(ritestDaiDati({ ...base, settimanaCalendario: 7 }).settimanaRitest).toBe(false);
    expect(ritestDaiDati({ ...base, settimanaCalendario: 5, ultimoScarico: '2026-09-01' }).settimanaRitest).toBe(false);
  });

  it('un test chiuso da meno di 28 giorni spegne il "dovuto" ma la settimana resta di ri-test dopo lo scarico', () => {
    const e = ritestDaiDati({ ...base, ultimoScarico: '2026-10-19', ultimoTest: '2026-10-21T10:00:00Z' });
    expect(e.settimanaRitest).toBe(true);
    expect(e.ritestDue).toBe(false);
  });

  it('una famiglia a fine codici o 8 settimane senza test → ri-test, salvo un test recente', () => {
    const fam = ritestDaiDati({ ...base, famiglieAlTetto: ['Pliometria'], ultimoTest: '2026-09-01T10:00:00Z' });
    expect(fam.settimanaRitest).toBe(true);
    expect(fam.motivo).toMatch(/Pliometria/);
    expect(ritestDaiDati({ ...base, famiglieAlTetto: ['Pliometria'], ultimoTest: '2026-10-20T10:00:00Z' }).settimanaRitest).toBe(false);
    const otto = ritestDaiDati({ ...base, ultimoTest: '2026-08-24T10:00:00Z' });
    expect(otto.settimanaRitest).toBe(true);
    expect(otto.motivo).toMatch(/9 settimane dall'ultimo test/);
    expect(ritestDaiDati({ ...base, ultimoTest: '2026-09-14T10:00:00Z' }).settimanaRitest).toBe(false);
  });
});

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
