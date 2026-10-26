'use client';

/**
 * Scala di sforzo 1-10 su UNA riga (Ste, 25/9: "tutta sulla stessa linea da 1 a 10, semplice e
 * chiaro da capire a che livello corrisponde il singolo numero"). Unica per tutta l'app:
 * serie nel player, EMOM, voto della seduta, sforzo con la squadra nel setup.
 *
 * Ogni numero ha un colore per zona (verde → giallo → rosso) e, sotto la riga, quattro ancore fisse
 * più la frase del numero scelto ("7 · Dura, ne restavano 3").
 * Per le serie la frase parla di ripetizioni in riserva; per le tenute a tempo di quanto potevi tenere ancora;
 * per la seduta di come si sta alla fine; per il giudizio (voti tecnica e fisico del resoconto) 1 è male e 10
 * benissimo, con i colori rovesciati. Zone e soglie stanno in `lib/rpeScala.ts` (25/10): le stesse che legge il codice.
 */
import { zonaVoto, type RpeTipo, type ZonaVoto } from '@/lib/rpeScala';
export type { RpeTipo } from '@/lib/rpeScala';

const FRASI: Record<RpeTipo, string[]> = {
  serie: [
    'Facilissima, come niente', 'Molto facile', 'Facile, potevi farne il doppio', 'Tranquilla, ne restavano tante',
    'Giusta, ne restavano 5', 'Impegnativa, ne restavano 4', 'Dura, ne restavano 3', 'Molto dura, ne restavano 2',
    'Al limite, ne restava 1', 'Massimo: non ne avevi un\'altra',
  ],
  // Tenute e lavori a tempo (25/10): "ne restavano 3" su un plank non vuol dire niente
  tempo: [
    'Facilissima, come niente', 'Molto facile', 'Facile, potevi tenere il doppio', 'Tranquilla, tanto margine',
    'Giusta, un bel margine', 'Impegnativa, un po\' di margine', 'Dura, potevi tenere ancora un po\'', 'Molto dura, quasi al limite',
    'Al limite, ultimi secondi', 'Massimo: non un secondo di più',
  ],
  seduta: [
    'Una passeggiata', 'Molto leggera', 'Leggera', 'Tranquilla',
    'Giusta, finita bene', 'Impegnativa', 'Dura', 'Molto dura',
    'Al limite', 'Massimo: svuotato',
  ],
  sforzo: [
    'Leggerissimo', 'Molto leggero', 'Leggero', 'Tranquillo',
    'Medio', 'Impegnativo', 'Duro', 'Molto duro',
    'Al limite', 'Massimo',
  ],
  // Tecnica (Ste, 28/9): non "quanto è stata dura" ma "quanto ti è riuscito"; 7+ = difficile → ripasso
  tecnica: [
    'Pulitissimo', 'Molto pulito', 'Pulito, facile', 'Bene, qualche sbavatura',
    'Riuscito', 'Riuscito con fatica', 'Difficile, tanti errori', 'Molto difficile',
    'Quasi non riesce', 'Non mi riesce',
  ],
  // Giudizio (25/10): voti tecnica e fisico del resoconto, 1 male → 10 benissimo
  giudizio: [
    'Malissimo', 'Molto male', 'Male', 'Così così',
    'Discreto', 'Bene', 'Buono', 'Molto bene',
    'Ottimo', 'Perfetto',
  ],
};
const ANCORE: Record<RpeTipo, [string, string, string, string]> = {
  serie: ['facile', 'giusta', 'dura', 'al limite'], tempo: ['facile', 'giusta', 'dura', 'al limite'],
  seduta: ['facile', 'giusta', 'dura', 'al limite'],
  sforzo: ['leggero', 'medio', 'duro', 'al limite'], tecnica: ['pulito', 'riuscito', 'difficile', 'non riesce'],
  giudizio: ['male', 'così così', 'bene', 'benissimo'],
};

const CLS: Record<ZonaVoto, { on: string; off: string }> = {
  facile: { on: 'bg-success border-success text-white', off: 'bg-success/12 border-success/25 text-app' },
  giusta: { on: 'bg-forest-500 border-forest-500 text-white', off: 'bg-forest-500/15 border-forest-500/30 text-app' },
  dura:   { on: 'bg-warning border-warning text-app-bg', off: 'bg-warning/15 border-warning/30 text-app' },
  limite: { on: 'bg-danger border-danger text-white', off: 'bg-danger/15 border-danger/30 text-app' },
};

export function rpeFrase(n: number, tipo: RpeTipo = 'serie'): string {
  return FRASI[tipo][Math.min(10, Math.max(1, Math.round(n))) - 1];
}

export default function RpeScale({ value, onChange, tipo = 'serie', label, ariaPrefix = 'Sforzo', className = '' }: {
  value: number | null;
  onChange: (n: number) => void;
  tipo?: RpeTipo;
  label?: string;            // titolo sopra la scala (es. "Com'è andata la serie 2?")
  ariaPrefix?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <p className="text-label font-semibold text-app mb-2">{label}</p>}
      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label={label ?? 'Scala da 1 a 10'}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const z = zonaVoto(n, tipo); const on = value === n;
          return (
            <button key={n} type="button" role="radio" aria-checked={on} aria-label={`${ariaPrefix} ${n}: ${rpeFrase(n, tipo)}`}
              onClick={() => { onChange(n); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}
              className={`h-12 min-w-0 rounded-lg border text-body font-bold tabular-nums transition-colors ${on ? CLS[z].on : CLS[z].off}`}>
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-caption text-muted mt-1.5 px-0.5" aria-hidden>
        {ANCORE[tipo].map((a) => <span key={a}>{a}</span>)}
      </div>
      <p className="text-body-sm font-semibold text-center mt-1.5 min-h-[21px]" aria-live="polite">
        {value !== null ? <><span className="tabular-nums">{value}</span> · {rpeFrase(value, tipo)}</> : <span className="text-faint font-normal">Tocca un numero</span>}
      </p>
    </div>
  );
}
