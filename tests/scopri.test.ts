import { describe, expect, it } from 'vitest';
import { IMPOSTAZIONI_DEFAULT, type Impostazioni } from '@/lib/abbonamento';
import { PACCHETTI, type Pacchetto } from '@/lib/listino';
import { APERTURA, CHIUSURA, CONOSCI_CHIUSURA, domandeFrequenti, DOVE_PORTA, FISICO_SEZIONE, FISICO_TEASER, MENTE_INCLUDE, MOMENTI_APP, MOMENTI_CONOSCI, MOMENTI_FISICO, MOMENTI_TESTA, NON_POSITIVO, NOTA_CODICE, NOTA_VALORE, passiIngresso, prezziPubblici, RACCONTI, STORIA, STORIA_FOTO, ALBUM_FOTO, PERCHE_TESTA, PERCHE_FISICO } from '@/lib/scopri';
import fs from 'node:fs';
import path from 'node:path';

const voce = (listino: number | null, lancio: number | null) => ({
  listino, lancio, conCodice: listino != null ? listino - 10 : null,
  priceListino: listino != null ? 'price_lis' : null, priceLancio: lancio != null ? 'price_lan' : null,
});
const LISTINO = Object.fromEntries(PACCHETTI.map((p) => [p, voce(39, 19)])) as Record<Pacchetto, ReturnType<typeof voce>>;
const imp = (x: Partial<Impostazioni> = {}): Impostazioni => ({ ...IMPOSTAZIONI_DEFAULT, ...x });

describe('pagina di vendita: prezzi pubblici', () => {
  it('con il lancio aperto il visitatore vede il prezzo di lancio, come nella pagina prezzi', () => {
    const p = prezziPubblici({ listino: LISTINO, imp: imp({ lancioAperto: true }), iscrittiMente: 3, iscrittiCampo: 0 });
    expect(p.mentale).toMatchObject({ euro: 19, tipo: 'lancio', aperto: true });
  });

  it('a lancio chiuso il listino, mai il prezzo con codice', () => {
    const p = prezziPubblici({ listino: LISTINO, imp: imp({ lancioAperto: false }), iscrittiMente: 3, iscrittiCampo: 0 });
    expect(p.mentale).toMatchObject({ euro: 39, tipo: 'listino', aperto: true });
  });

  it('il Fisico chiuso finché le iscrizioni del Campo non sono aperte; il Completo pure', () => {
    const p = prezziPubblici({ listino: LISTINO, imp: imp({ iscrizioniCampoAperte: false }), iscrittiMente: 0, iscrittiCampo: 0 });
    expect(p.fisico_pro.aperto).toBe(false);
    expect(p.completo.aperto).toBe(false);
    const q = prezziPubblici({ listino: LISTINO, imp: imp({ iscrizioniCampoAperte: true, tettoCampo: null }), iscrittiMente: 0, iscrittiCampo: 0 });
    expect(q.fisico_pro.aperto).toBe(true);
  });

  it('tetto pieno o prezzo mancante: non si vende', () => {
    const pieno = prezziPubblici({ listino: LISTINO, imp: imp({ tettoIscritti: 25 }), iscrittiMente: 25, iscrittiCampo: 0 });
    expect(pieno.mentale.aperto).toBe(false);
    const senza = { ...LISTINO, mentale: voce(null, null) };
    expect(prezziPubblici({ listino: senza, imp: imp(), iscrittiMente: 0, iscrittiCampo: 0 }).mentale.aperto).toBe(false);
  });
});

function tuttiITesti(): string[] {
  return [
    ...Object.values(APERTURA), ...MOMENTI_CONOSCI, CONOSCI_CHIUSURA, STORIA.citazione, ...STORIA.paragrafi, DOVE_PORTA.titolo, DOVE_PORTA.intro, ...DOVE_PORTA.punti, DOVE_PORTA.chiusura, NON_POSITIVO.titolo, ...NON_POSITIVO.paragrafi,
    ...[...MOMENTI_TESTA, ...MOMENTI_FISICO].flatMap((m) => [m.titolo, m.testo, ...m.dettaglio, m.inCampo ?? '']),
    ...PERCHE_TESTA.paragrafi, ...PERCHE_TESTA.studi, PERCHE_TESTA.titolo, PERCHE_TESTA.domanda, ...PERCHE_TESTA.chiusura,
    PERCHE_FISICO.titolo, PERCHE_FISICO.intro, ...PERCHE_FISICO.figure.flatMap((f) => [f.chi, f.limite]), ...PERCHE_FISICO.altalena, PERCHE_FISICO.scelta, PERCHE_FISICO.problema, ...PERCHE_FISICO.variabili, PERCHE_FISICO.domanda, ...PERCHE_FISICO.ai,
    ...Object.values(FISICO_TEASER), FISICO_SEZIONE.titolo, FISICO_SEZIONE.intro, ...FISICO_SEZIONE.origine, ...MENTE_INCLUDE, NOTA_VALORE, NOTA_CODICE, ...CHIUSURA,
    ...domandeFrequenti(18).flatMap((d) => [d.domanda, d.risposta]), ...passiIngresso(7).flatMap((p) => [p.titolo, p.testo]),
  ];
}

describe('pagina di vendita: testi', () => {
  it('ogni momento ha la sua schermata in public/scopri', () => {
    for (const m of [...MOMENTI_TESTA, ...MOMENTI_FISICO]) expect(fs.existsSync(path.join(process.cwd(), 'public/scopri', `${m.id}.webp`)), m.id).toBe(true);
    // il telefono dell'apertura gira sulle schermate della Testa
    expect(MOMENTI_APP.map((m) => m.id)).toEqual(MOMENTI_TESTA.map((m) => m.id));
  });

  it('ogni scheda di «Come funziona» ha il suo dentro e la riga «In campo»', () => {
    for (const m of MOMENTI_TESTA) { expect(m.dettaglio.length, m.id).toBeGreaterThan(2); expect(m.inCampo, m.id).toBeTruthy(); }
    for (const m of MOMENTI_FISICO) expect(m.dettaglio.length, m.id).toBeGreaterThan(2);
  });

  it('niente trattini lunghi e niente «tap» (regole dei testi v2)', () => {
    const t = tuttiITesti().join(' ');
    expect(t).not.toMatch(/[—–]/);
    expect(t).not.toMatch(/\btap\b/i);
  });

  it('le foto della storia: file presente, testo alternativo, scritte non vuote, posto valido', () => {
    for (const f of [...STORIA_FOTO, ...ALBUM_FOTO]) {
      expect(fs.existsSync(path.join(process.cwd(), 'public', f.src)), f.src).toBe(true);
      expect(f.alt.trim().length, f.src).toBeGreaterThan(0);
      if (f.quando !== undefined) expect(f.quando.trim().length, f.src).toBeGreaterThan(0);
      if (f.didascalia !== undefined) expect(f.didascalia.trim().length, f.src).toBeGreaterThan(0);
      expect(Number.isInteger(f.prima) && f.prima >= 0 && f.prima <= STORIA.paragrafi.length, f.src).toBe(true);
    }
  });

  it('dopo «In campo:» la frase comincia in minuscolo (v3)', () => {
    for (const m of MOMENTI_TESTA) expect(m.inCampo?.[0], m.id).toBe(m.inCampo?.[0]?.toLowerCase());
  });

  it('la sezione dei racconti resta vuota finché non ci sono racconti veri', () => {
    for (const r of RACCONTI) { expect(r.testo.length).toBeGreaterThan(0); expect(r.chi.length).toBeGreaterThan(0); }
  });

  it('i giorni di prova vengono dalle impostazioni', () => {
    expect(passiIngresso(7)[1].titolo).toBe('7 giorni gratis');
    expect(passiIngresso(0)[1].titolo).not.toMatch(/gratis/);
    expect(domandeFrequenti(18).at(-1)?.risposta).toMatch(/18 anni/);
  });

  it('nessuna promessa di esito nei testi (regole del COMMERCIALE)', () => {
    const tutto = [...MOMENTI_APP.flatMap((m) => [m.titolo, m.testo]), ...tuttiITesti(), ...domandeFrequenti(18).flatMap((d) => [d.domanda, d.risposta]), ...passiIngresso(7).map((p) => p.testo)].join(' ').toLowerCase();
    for (const vietata of ['giocherai meglio', 'supererai', 'garantit', 'ultimi posti', 'più sicuro di te', 'giocherai', 'migliorerai', 'non avrai più']) expect(tutto).not.toContain(vietata);
  });
});
