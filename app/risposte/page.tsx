'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { cachedJson } from '@/lib/clientCache';
import { GATE_DAY } from '@/lib/constants';
import { gateLista, rispostaChiaveInfo, testoDaModificare, type RispostaRow } from '@/lib/risposteChiave';
import { ChevronRight, Key, PenLine, Star } from 'lucide-react';
import ModificaRispostaSheet from '@/components/ModificaRispostaSheet';
import { AppLoader, Badge, Button, Card, Chip, SectionTitle, Testata } from '@/components/ui';
import RispostaGateStorica from '@/components/RispostaGateStorica';

interface Settimana { weekNumber: number; titolo: string; strumento?: string }

/**
 * Le tue risposte (22/10, review W11): tutto quello che il ragazzo ha scritto durante il percorso,
 * settimana per settimana (risposta del giorno, intenzione prima della pratica, le tre risposte
 * del Gate). Le risposte chiave (lib/risposteChiave.ts) hanno la stella: sono quelle che la W11
 * chiede di riprendere. Sola lettura: si scrive nei giorni, non qui.
 * Dal 9/11 (Ste: «più facilmente navigabile, non la lista completa, filtrare per settimana, scritte troppo piccole»):
 * in cima i chip delle settimane (si apre sull'ultima) e «Le chiave», una settimana alla volta, testo più grande.
 */
export default function RispostePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RispostaRow[]>([]);
  const [errore, setErrore] = useState(false);
  const [settimane, setSettimane] = useState<Record<number, Settimana>>({});
  const [modifica, setModifica] = useState<RispostaRow | null>(null);
  // La settimana in vista: un numero, oppure 'chiave' per le sole risposte chiave di tutto il percorso
  const [filtro, setFiltro] = useState<number | 'chiave' | null>(null);

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
  const vista = filtro ?? settimaneOrdinate[0] ?? null;
  // Le sezioni da mostrare: una settimana sola, oppure le chiave raggruppate per settimana
  const sezioni: [number, RispostaRow[]][] = vista === 'chiave'
    ? settimaneOrdinate.map((w) => [w, perSettimana.get(w)!.filter((r) => rispostaChiaveInfo(r.week, r.day))] as [number, RispostaRow[]]).filter(([, l]) => l.length > 0)
    : vista != null && perSettimana.has(vista) ? [[vista, perSettimana.get(vista)!]] : [];

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">
        <Testata indietro={{ back: '/profilo', label: 'Profilo' }} titolo="Le tue risposte" sotto="Quello che hai scritto nel percorso, con le tue parole." />

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

        {settimaneOrdinate.length > 0 && (
          <div role="tablist" aria-label="Scegli la settimana" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chiaviScritte.length > 0 && (
              <Chip size="lg" showCheck={false} selected={vista === 'chiave'} onClick={() => setFiltro('chiave')} icon={<Star size={16} aria-hidden />} className="shrink-0">
                Le chiave
              </Chip>
            )}
            {settimaneOrdinate.map((w) => (
              <Chip key={w} size="lg" showCheck={false} selected={vista === w} onClick={() => setFiltro(w)} className="shrink-0">
                Sett. {w}
              </Chip>
            ))}
          </div>
        )}

        {sezioni.map(([week, giorni]) => {
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
                      <p className="text-body-lg font-semibold text-app flex-1">{isGate ? 'Gate' : `Giorno ${r.day}`}</p>
                      {chiave && <Badge tone="accent" icon={<Star size={12} aria-hidden />}>{chiave.label}</Badge>}
                      {isGate && !chiave && <Badge tone="neutral" icon={<Key size={12} aria-hidden />}>Chiusura</Badge>}
                    </div>
                    {r.prePratica && (
                      <div className="mb-3">
                        <p className="text-body-sm font-semibold text-muted">Prima della pratica</p>
                        <p className="text-body-lg text-app leading-relaxed whitespace-pre-line">{r.prePratica}</p>
                      </div>
                    )}
                    {r.risposta && (
                      <div>
                        {r.domanda && <p className="text-body-sm text-muted mb-1.5 leading-relaxed whitespace-pre-line">{r.domanda}</p>}
                        <p className="text-body-lg text-app leading-relaxed whitespace-pre-line">{r.risposta}</p>
                      </div>
                    )}
                    {r.gateRighe?.length ? (
                      <ol className="space-y-3">
                        {r.gateRighe.map((g, i) => (
                          <li key={i}>
                            <RispostaGateStorica n={i + 1} domanda={g.domanda} risposta={g.risposta} avviso={g.avviso} data={r.completedAt} compatta />
                          </li>
                        ))}
                      </ol>
                    ) : r.gate && (
                      <ol className="space-y-2">
                        {r.gate.map((g, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-body-sm text-muted font-bold pt-0.5 shrink-0">{i + 1}.</span>
                            <p className="text-body-lg text-app leading-relaxed whitespace-pre-line">{g}</p>
                          </li>
                        ))}
                      </ol>
                    )}
                    {r.aggiornataIl && <p className="text-body-sm text-faint mt-2">Aggiornata il {new Date(r.aggiornataIl).toLocaleDateString('it-IT')}{r.versioni ? ` · ${r.versioni} ${r.versioni === 1 ? 'versione' : 'versioni'}` : ''}</p>}
                    <div className="flex flex-wrap gap-1 mt-2 -ml-3">
                      {chiave && (!isGate || chiave.gateQ) && (
                        <Button variant="ghost" size="sm" icon={<PenLine size={16} aria-hidden />} onClick={() => setModifica(r)}>{chiave.gateQ ? `Modifica: ${chiave.label.toLowerCase()}` : 'Modifica'}</Button>
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
          testoIniziale={testoDaModificare(modifica, rispostaChiaveInfo(modifica.week, modifica.day) ?? {})}
          open
          onClose={() => setModifica(null)}
          onSalvata={(t) => setRows((prev) => prev.map((r) => {
            if (r.week !== modifica.week || r.day !== modifica.day) return r;
            const q = rispostaChiaveInfo(r.week, r.day)?.gateQ;
            // La mappa è la prima risposta del Gate 3: si aggiorna quella, non la risposta del giorno
            if (q) {
              const gateQ = { ...(r.gateQ ?? {}), [q]: t };
              return { ...r, gateQ, gate: gateLista(gateQ), versioni: (r.versioni || 0) + 1, aggiornataIl: new Date().toISOString() };
            }
            return { ...r, risposta: t, versioni: (r.versioni || 0) + 1, aggiornataIl: new Date().toISOString() };
          }))}
        />
      )}
    </main>
  );
}
