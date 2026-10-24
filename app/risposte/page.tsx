'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { GATE_DAY } from '@/lib/constants';
import { rispostaChiaveInfo, type RispostaRow } from '@/lib/risposteChiave';
import { BookOpen, ChevronRight, Key, PenLine, Star } from 'lucide-react';
import ModificaRispostaSheet from '@/components/ModificaRispostaSheet';
import { AppLoader, BackButton, Badge, Button, Card, SectionTitle } from '@/components/ui';

interface Settimana { weekNumber: number; titolo: string; strumento?: string }

/**
 * Le tue risposte (22/10, review W11): tutto quello che il ragazzo ha scritto durante il percorso,
 * settimana per settimana (risposta del giorno, intenzione prima della pratica, le tre risposte
 * del Gate). Le risposte chiave (lib/risposteChiave.ts) hanno la stella: sono quelle che la W11
 * chiede di riprendere. Sola lettura: si scrive nei giorni, non qui.
 */
export default function RispostePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RispostaRow[]>([]);
  const [errore, setErrore] = useState(false);
  const [settimane, setSettimane] = useState<Record<number, Settimana>>({});
  const [modifica, setModifica] = useState<RispostaRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const [res, sett] = await Promise.all([
        authFetch('/api/risposte').catch(() => null),
        cachedJson<{ settimane?: Settimana[] }>('settimane', () => authFetch('/api/settimane')).catch(() => null),
      ]);
      if (sett?.settimane) {
        const mappa: Record<number, Settimana> = {};
        for (const s of sett.settimane) mappa[s.weekNumber] = s;
        setSettimane(mappa);
      }
      if (!res || !res.ok) { setErrore(true); setLoading(false); return; }
      const data = await res.json();
      setRows(Array.isArray(data?.risposte) ? data.risposte : []);
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <AppLoader label="Le tue risposte" />;

  const perSettimana = new Map<number, RispostaRow[]>();
  for (const r of rows) {
    const lista = perSettimana.get(r.week) || [];
    lista.push(r);
    perSettimana.set(r.week, lista);
  }
  const settimaneOrdinate = [...perSettimana.keys()].sort((a, b) => b - a);
  const chiaviScritte = rows.filter((r) => rispostaChiaveInfo(r.week, r.day));

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">
        <BackButton tone="light" label="Profilo" onClick={() => router.push('/profilo')} />

        <Card className="border-l-4 border-l-forest-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-10 h-10 rounded-full bg-forest-500/20 text-forest-300 flex items-center justify-center shrink-0" aria-hidden><BookOpen size={18} /></span>
            <h1 className="font-display text-title-1 font-bold text-app">Le tue risposte</h1>
          </div>
          <p className="text-muted text-body-sm">Quello che hai scritto lungo il percorso, con le tue parole. Si scrive nei giorni: qui si rilegge.</p>
        </Card>

        {errore && (
          <Card variant="warn">
            <p className="text-body text-app">Non sono riuscito a caricare le tue risposte. Riprova tra un momento.</p>
            <Button variant="secondary" className="mt-3" onClick={() => window.location.reload()}>Riprova</Button>
          </Card>
        )}

        {!errore && rows.length === 0 && (
          <Card>
            <p className="text-body text-app">Ancora niente. Le risposte che scrivi nei giorni del percorso finiscono qui, settimana per settimana.</p>
            <Button variant="secondary" className="mt-3" href="/settimane">Vai al percorso</Button>
          </Card>
        )}

        {chiaviScritte.length > 0 && (
          <Card variant="accent">
            <SectionTitle as="h2" title="Le risposte chiave" icon={<Star size={18} />} subtitle="Quelle che il percorso ti chiede di riprendere più avanti" className="mb-2" />
            <ul className="divide-y divide-divider">
              {chiaviScritte.map((r) => {
                const info = rispostaChiaveInfo(r.week, r.day)!;
                return (
                  <li key={`k-${r.week}-${r.day}`}>
                    <a href={`#g-${r.week}-${r.day}`} className="min-h-[44px] flex items-center gap-2 text-body font-semibold text-forest-300">
                      <span className="flex-1">{info.label}</span>
                      <span className="text-caption text-muted font-normal">{info.quando}</span>
                      <ChevronRight size={16} className="text-muted shrink-0" aria-hidden />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {settimaneOrdinate.map((week) => {
          const giorni = perSettimana.get(week)!;
          const s = settimane[week];
          return (
            <section key={week} className="space-y-3">
              <SectionTitle
                as="h2"
                title={`Settimana ${week}`}
                subtitle={s ? [s.titolo, s.strumento].filter(Boolean).join(' · ') : undefined}
              />
              {giorni.map((r) => {
                const chiave = rispostaChiaveInfo(r.week, r.day);
                const isGate = r.day === GATE_DAY;
                return (
                  <Card key={`${r.week}-${r.day}`} padding="md" className={chiave ? 'border-forest-500/40' : ''}>
                    <div id={`g-${r.week}-${r.day}`} className="flex items-center gap-2 mb-2 flex-wrap scroll-mt-20">
                      <p className="text-body font-semibold text-app flex-1">{isGate ? 'Gate' : `Giorno ${r.day}`}</p>
                      {chiave && <Badge tone="accent" icon={<Star size={12} aria-hidden />}>{chiave.label}</Badge>}
                      {isGate && !chiave && <Badge tone="neutral" icon={<Key size={12} aria-hidden />}>Chiusura</Badge>}
                    </div>
                    {r.prePratica && (
                      <div className="mb-3">
                        <p className="text-caption text-muted">Prima della pratica</p>
                        <p className="text-body-sm text-app leading-relaxed whitespace-pre-line">{r.prePratica}</p>
                      </div>
                    )}
                    {r.risposta && (
                      <div>
                        {r.domanda && <p className="text-caption text-muted mb-1">{r.domanda}</p>}
                        <p className="text-body text-app leading-relaxed whitespace-pre-line">{r.risposta}</p>
                      </div>
                    )}
                    {r.gate && (
                      <ol className="space-y-2">
                        {r.gate.map((g, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-caption text-muted font-bold pt-1 shrink-0">{i + 1}.</span>
                            <p className="text-body text-app leading-relaxed whitespace-pre-line">{g}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                    {r.aggiornataIl && <p className="text-caption text-faint mt-2">Aggiornata il {new Date(r.aggiornataIl).toLocaleDateString('it-IT')}{r.versioni ? ` · ${r.versioni} versioni` : ''}</p>}
                    <div className="flex flex-wrap gap-1 mt-2 -ml-3">
                      {chiave && !isGate && (
                        <Button variant="ghost" size="sm" icon={<PenLine size={16} aria-hidden />} onClick={() => setModifica(r)}>Modifica</Button>
                      )}
                      {!isGate && (
                        <Button variant="ghost" size="sm" href={`/giorno/${r.week}/${r.day}`} icon={<ChevronRight size={16} aria-hidden />}>
                          Apri il giorno
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </section>
          );
        })}
      </div>
      {modifica && (
        <ModificaRispostaSheet
          week={modifica.week}
          day={modifica.day}
          testoIniziale={modifica.risposta || ''}
          open
          onClose={() => setModifica(null)}
          onSalvata={(t) => setRows((prev) => prev.map((r) => (r.week === modifica.week && r.day === modifica.day ? { ...r, risposta: t, versioni: (r.versioni || 0) + 1, aggiornataIl: new Date().toISOString() } : r)))}
        />
      )}
    </main>
  );
}
