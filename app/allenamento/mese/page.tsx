'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import { AppLoader, BackButton, Card } from '@/components/ui';
import type { SettimanaReplay } from '@/lib/trainingPlannerV2';
import { FOCUS_OPZIONI } from '@/lib/trainingRequest';

const FOCUS_LABEL: Record<string, string> = Object.fromEntries(FOCUS_OPZIONI.map((f) => [f.id, f.label]));
const dataIt = (ymd: string) => { const [y, m, d] = ymd.split('-'); return `${d}/${m}/${y.slice(2)}`; };

/**
 * "Le settimane passate" (Ste, 7/10: "capiamo se il deterministico funziona davvero bene o se serve un agente"):
 * per ogni lunedì, cosa avrebbe detto il conteggio del mese quel giorno (fatte per obiettivo, priorità, domande)
 * e il piano che è stato generato davvero (giornate, qualità, fatta o saltata, da chi). Solo lettura, solo i propri dati.
 */
export default function MesePage() {
  const router = useRouter();
  const [data, setData] = useState<{ obiettivi: string[]; settimane: SettimanaReplay[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await authFetch('/api/training/mese/replay?settimane=8');
      if (res.status === 403) { router.push('/strumenti'); return; }
      const json = res.ok ? await res.json() : null;
      if (!vivo) return;
      if (json) setData(json);
      setLoading(false);
    })();
    return () => { vivo = false; };
  }, [router]);

  if (loading || !data) return <AppLoader />;
  const settimane = [...data.settimane].reverse(); // la più recente in cima

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton href="/allenamento" label="Campo" className="mb-2" />
        <h1 className="font-display text-title-1 font-bold text-app mb-1">Le settimane passate</h1>
        <p className="text-body text-muted mb-1">Per ogni lunedì: cosa diceva il conto del mese quel giorno, e cosa è stato fatto davvero.</p>
        <p className="text-body-sm text-muted mb-5">Obiettivi di oggi: {data.obiettivi.length ? data.obiettivi.map((f) => FOCUS_LABEL[f] ?? f).join(' › ') : 'nessuno'}</p>

        <div className="space-y-3">
          {settimane.map((w) => (
            <Card key={w.lunedi} padding="sm">
              <p className="text-body-sm font-semibold text-app">Settimana del {dataIt(w.lunedi)}{w.inCorso ? ' · in corso' : ''}</p>

              <p className="text-label font-semibold text-muted mt-2">Cosa diceva il mese quel lunedì</p>
              {w.righe.length ? (
                <ul className="mt-1 space-y-0.5">
                  {w.righe.map((r) => <li key={r} className="text-body-sm text-muted leading-snug">· {r}</li>)}
                </ul>
              ) : (
                <p className="text-body-sm text-muted mt-1">Nessuna settimana con una seduta fatta prima di questa: niente da contare.</p>
              )}
              {w.priorita.length > 1 && (
                <p className="text-body-sm text-muted mt-1">Priorità: {w.priorita.join(' › ')}{w.riordinato ? ' (riordinate dal mese)' : ''}</p>
              )}
              {w.domande.length > 0 && (
                <p className="text-body-sm text-warning mt-1">Avrebbe chiesto: {w.domande.join(', ')} — vuoi davvero allenarla?</p>
              )}

              <p className="text-label font-semibold text-muted mt-3">Il piano di quella settimana</p>
              {w.piano ? (
                <>
                  <p className="text-caption text-faint mt-0.5">{w.piano.generatoDa === 'llm' ? 'dal preparatore AI' : 'settimana base'}{w.piano.nPiani > 1 ? ` · ${w.piano.nPiani} piani` : ''}</p>
                  <ul className="mt-1 space-y-1">
                    {w.piano.sedute.map((s) => (
                      <li key={s.giorno} className="text-body-sm leading-snug flex gap-2">
                        <span className={`shrink-0 w-14 ${s.fatta ? 'text-forest-400' : 'text-faint'}`}>{DAY_SHORT_NAMES[s.giorno]} {s.fatta ? '✓' : '–'}</span>
                        <span className="text-muted">{s.titolo}{s.voto != null ? ` (voto ${s.voto})` : ''}{s.qualita.length ? ` · ${s.qualita.join(', ')}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                  {w.piano.aggiustamenti.length > 0 && <p className="text-caption text-muted mt-1">Sistemato: {w.piano.aggiustamenti.join(' · ')}</p>}
                  {w.piano.violazioni.length > 0 && <p className="text-caption text-muted mt-1">Perché base: {w.piano.violazioni.slice(0, 2).join(' · ')}</p>}
                </>
              ) : (
                <p className="text-body-sm text-muted mt-1">Nessun piano.</p>
              )}
            </Card>
          ))}
        </div>
        <p className="text-caption text-faint mt-5">Serve a capire se il conto del mese decide bene: se le priorità ti sembrano sbagliate in più di una settimana su quattro, dillo a chi sviluppa.</p>
      </div>
    </main>
  );
}
