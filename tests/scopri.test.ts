import { describe, expect, it } from 'vitest';
import { IMPOSTAZIONI_DEFAULT, type Impostazioni } from '@/lib/abbonamento';
import { PACCHETTI, type Pacchetto } from '@/lib/listino';
import { domandeFrequenti, MOMENTI_APP, passiIngresso, prezziPubblici } from '@/lib/scopri';
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

describe('pagina di vendita: testi', () => {
  it('ogni momento ha la sua schermata in public/scopri', () => {
    for (const m of MOMENTI_APP) expect(fs.existsSync(path.join(process.cwd(), 'public/scopri', `${m.id}.webp`)), m.id).toBe(true);
  });

  it('i giorni di prova vengono dalle impostazioni', () => {
    expect(passiIngresso(7)[1].titolo).toBe('7 giorni gratis');
    expect(passiIngresso(0)[1].titolo).not.toMatch(/gratis/);
    expect(domandeFrequenti(18).at(-1)?.risposta).toMatch(/18 anni/);
  });

  it('nessuna promessa di esito nei testi (regole del COMMERCIALE)', () => {
    const tutto = [...MOMENTI_APP.flatMap((m) => [m.titolo, m.testo]), ...domandeFrequenti(18).flatMap((d) => [d.domanda, d.risposta]), ...passiIngresso(7).map((p) => p.testo)].join(' ').toLowerCase();
    for (const vietata of ['giocherai meglio', 'supererai', 'garantit', 'ultimi posti', 'più sicuro di te']) expect(tutto).not.toContain(vietata);
  });
});
