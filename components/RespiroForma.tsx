'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ETICHETTA_FASE, RITMI_QUADRATO, fasiRespiro, posizione, verticiForma,
  type FormaRespiro, type RitmoQuadrato,
} from '@/lib/respiroForme';
import { Chip } from '@/components/ui';

/**
 * La forma del respiro (14/11): il quadrato o il triangolo, una pallina che ne percorre il perimetro e, dentro,
 * la fase e i secondi che mancano. Si sale inspirando, si va in piano trattenendo, si scende espirando.
 * Sul quadrato si sceglie il ritmo (4, 6, 8 secondi per lato): cambiarlo fa ripartire il giro dall'inizio.
 * Il tempo è a timestamp (come il timer della pratica): con lo schermo spento il giro non si sfasa.
 */
export default function RespiroForma({ forma }: { forma: FormaRespiro }) {
  const [ritmo, setRitmo] = useState<RitmoQuadrato>(4);
  const inizio = useRef<number>(0);
  const [ms, setMs] = useState(0);

  useEffect(() => {
    inizio.current = performance.now();
    let id = 0;
    const giro = (now: number) => { setMs(now - inizio.current); id = requestAnimationFrame(giro); };
    id = requestAnimationFrame(giro);
    return () => cancelAnimationFrame(id);
  }, [ritmo, forma]);

  const fasi = fasiRespiro(forma, ritmo);
  const v = verticiForma(forma);
  const pos = posizione(forma, fasi, ms);
  const lati = v.map((a, i) => ({ a, b: v[(i + 1) % v.length], i }));
  // La scritta sta dove la forma è più larga: nel triangolo con la punta in basso, nel terzo alto
  const centroY = forma === 'triangolo' ? v[1].y + (v[0].y - v[1].y) * 0.3 : 50;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[240px] h-[240px] md:w-72 md:h-72">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {lati.map(({ a, b, i }) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeLinecap="round"
              strokeWidth={2.5} className={i === pos.indice ? 'stroke-forest-400/35' : 'stroke-white/15'} />
          ))}
          {/* La parte del lato già fatta, piena */}
          <line x1={v[pos.indice].x} y1={v[pos.indice].y} x2={pos.punto.x} y2={pos.punto.y}
            strokeLinecap="round" strokeWidth={3} className="stroke-forest-400" />
          <circle cx={pos.punto.x} cy={pos.punto.y} r={7} className="fill-forest-400/25" />
          <circle cx={pos.punto.x} cy={pos.punto.y} r={4.2} className="fill-white" />
        </svg>
        <div className="absolute inset-x-0 flex -translate-y-1/2 flex-col items-center" style={{ top: `${centroY}%` }} aria-live="polite">
          <p className="font-display text-title-2 font-bold text-app">{ETICHETTA_FASE[pos.fase]}</p>
          <p className="font-display text-title-1 font-bold tabular-nums text-forest-300">{pos.restanti}</p>
        </div>
      </div>
      {forma === 'quadrato' ? (
        <div className="flex gap-2" role="group" aria-label="Secondi per lato">
          {RITMI_QUADRATO.map(r => (
            <Chip key={r} selected={r === ritmo} showCheck={false} onClick={() => setRitmo(r)} ariaLabel={`${r} secondi per lato`}>
              {r}-{r}-{r}-{r}
            </Chip>
          ))}
        </div>
      ) : (
        <p className="text-body-sm text-muted">4 inspira · 6 trattieni · 8 espira</p>
      )}
    </div>
  );
}
