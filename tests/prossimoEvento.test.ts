import { describe, it, expect } from 'vitest';
import { fraseProssimoEvento, giorniA, giornoPrima, preferenzaDallaNota, prossimoEvento, statoPartita } from '@/lib/prossimoEvento';

const cal = { trainingDays: [1, 3], matchDays: [6] }; // lun, mer; partita sabato

describe('prossimo evento (nota campo, 24/10)', () => {
  it('la settimana gira: da sabato a lunedì mancano 2 giorni, il giorno prima di lunedì è domenica', () => {
    expect(giorniA(6, 1)).toBe(2);
    expect(giorniA(3, 3)).toBe(0);
    expect(giornoPrima(1)).toBe(7);
  });

  it('il primo evento in arrivo: giovedì la partita di sabato viene prima del lunedì', () => {
    expect(prossimoEvento(cal, 4)).toMatchObject({ tipo: 'partita', giorno: 6, tra: 2, oggi: false });
    expect(fraseProssimoEvento(prossimoEvento(cal, 4))).toBe('La tua prossima partita è sabato. Prova questo in campo!');
    expect(prossimoEvento(cal, 7)).toMatchObject({ tipo: 'allenamento', giorno: 1, tra: 1 });
    expect(fraseProssimoEvento(prossimoEvento(cal, 1))).toBe('Oggi è giorno di allenamento. Prova questo in campo!');
    expect(fraseProssimoEvento(prossimoEvento(cal, 6))).toBe('Oggi giochi. Prova questo in campo!');
  });

  it('la nota che nomina la partita guarda solo la partita, anche se l\'allenamento è prima', () => {
    expect(preferenzaDallaNota('Il Protocollo aggiornato: alla prossima partita, entra da lì.')).toBe('partita');
    expect(preferenzaDallaNota('Al prossimo allenamento prova il Reset.')).toBe('allenamento');
    expect(preferenzaDallaNota('Fallo quando vuoi.')).toBeNull();
    expect(prossimoEvento(cal, 7, 'partita')).toMatchObject({ tipo: 'partita', giorno: 6, tra: 6 });
    expect(prossimoEvento({ trainingDays: [1], matchDays: [] }, 7, 'partita')).toBeNull();
  });

  it('senza calendario niente riga', () => {
    expect(prossimoEvento(null, 3)).toBeNull();
    expect(fraseProssimoEvento(null)).toBeNull();
    expect(prossimoEvento({ trainingDays: [], matchDays: [] }, 3)).toBeNull();
  });

  it('partita oggi o domani: domenica con il giorno prima sabato, due partite vicine', () => {
    expect(statoPartita({ trainingDays: [], matchDays: [7] }, 6)).toEqual({ oggi: false, domani: true });
    expect(statoPartita({ trainingDays: [], matchDays: [7] }, 7)).toEqual({ oggi: true, domani: false });
    // sabato E domenica: sabato è giorno di partita (vince), non "domani giochi"
    expect(statoPartita({ trainingDays: [], matchDays: [6, 7] }, 6)).toEqual({ oggi: true, domani: false });
    expect(statoPartita({ trainingDays: [], matchDays: [6, 7] }, 5)).toEqual({ oggi: false, domani: true });
    expect(statoPartita(null, 5)).toEqual({ oggi: false, domani: false });
  });
});
