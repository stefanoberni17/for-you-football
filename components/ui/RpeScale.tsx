'use client';

/**
 * Scala di sforzo 1-10 su UNA riga (Ste, 25/9: "tutta sulla stessa linea da 1 a 10, semplice e
 * chiaro da capire a che livello corrisponde il singolo numero"). Unica per tutta l'app:
 * serie nel player, EMOM, voto della seduta, sforzo con la squadra nel setup.
 *
 * Ogni numero ha un colore per zona (verde → giallo → rosso) e, sotto la riga, tre ancore fisse
 * (facile · giusta · al limite) più la frase del numero scelto ("7 · Dura, potevi farne ancora 3").
 * Per le serie la frase parla di ripetizioni in riserva; per la seduta di come si sta alla fine.
 */
export type RpeTipo = 'serie' | 'seduta' | 'sforzo';

const FRASI: Record<RpeTipo, string[]> = {
  serie: [
    'Facilissima, come niente', 'Molto facile', 'Facile, potevi farne il doppio', 'Tranquilla, ne restavano tante',
    'Giusta, ne restavano 5', 'Impegnativa, ne restavano 4', 'Dura, ne restavano 3', 'Molto dura, ne restavano 2',
    'Al limite, ne restava 1', 'Massimo: non ne avevi un\'altra',
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
};

/** Zona del numero: 1-3 facile, 4-6 giusta, 7-8 dura, 9-10 al limite. */
const zona = (n: number) => (n <= 3 ? 'facile' : n <= 6 ? 'giusta' : n <= 8 ? 'dura' : 'limite');
const CLS: Record<ReturnType<typeof zona>, { on: string; off: string }> = {
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
          const z = zona(n); const on = value === n;
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
        <span>facile</span><span>giusta</span><span>dura</span><span>al limite</span>
      </div>
      <p className="text-body-sm font-semibold text-center mt-1.5 min-h-[21px]" aria-live="polite">
        {value !== null ? <><span className="tabular-nums">{value}</span> · {rpeFrase(value, tipo)}</> : <span className="text-faint font-normal">Tocca un numero</span>}
      </p>
    </div>
  );
}
