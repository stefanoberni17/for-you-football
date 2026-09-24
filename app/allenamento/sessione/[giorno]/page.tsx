'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_NAMES } from '@/lib/constants';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import TrainingSessionPlayer, { type PlayerProgress, type SetLogInput } from '@/components/TrainingSessionPlayer';
import { esercizioAny, unitaItem, unitaLabel } from '@/lib/trainingExercise';
import { AlertTriangle, Calendar, Check, Info, Pause, Play } from 'lucide-react';
import { AppLoader, BackButton, Badge, Button, Card, Chip, Field, SectionTitle, Textarea } from '@/components/ui';

interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string; carico_kg?: number; blocco_id?: string; adattamento?: 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero'; lato_extra?: 'dx' | 'sx'
  per_lato?: boolean;
}
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; qualita: string; durataMin: number }[] }

type Phase = 'preview' | 'playing' | 'feedback' | 'done';

// Etichetta italiana del tipo di seduta (l'enum del planner non si mostra all'atleta)
const TIPO_LABEL: Record<string, string> = {
  fisica: 'Fisica', mix: 'Fisica e tecnica', tecnica: 'Tecnica', skill: 'Tecnica', fascia: 'Fascia e prevenzione', recupero: 'Recupero',
};
const ADATTAMENTO_LABEL: Record<NonNullable<PlanItem['adattamento']>, string> = {
  sali: 'Un passo in più', scendi: 'Più leggera', gradino: 'Il tuo gradino', lato: 'Lato debole', leggero: 'Più leggero',
};
type Giudizio = 'facile' | 'ok' | 'duro';
const GIUDIZI: { key: Giudizio; label: string }[] = [{ key: 'facile', label: 'Facile' }, { key: 'ok', label: 'Giusto' }, { key: 'duro', label: 'Duro' }];
const rpeCls = (n: number, sel: number | null) => sel === n
  ? (n <= 3 ? 'bg-success text-white border-success' : n <= 6 ? 'bg-forest-500 text-white border-forest-500' : n <= 8 ? 'bg-warning text-app border-warning' : 'bg-danger text-white border-danger')
  : 'bg-surface-2 text-app border-divider';

export default function SessionePage() {
  const router = useRouter();
  const params = useParams();
  const giorno = parseInt(String(params.giorno), 10);

  const [planId, setPlanId] = useState<string | null>(null);
  const [sessione, setSessione] = useState<PlanSession | null>(null);
  const [painHold, setPainHold] = useState(false);
  const [faticaAlta, setFaticaAlta] = useState(false); // dal check-in di oggi
  const [scarico, setScarico] = useState(false); // alleggerisci: −1 serie sugli esercizi
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [saltata, setSaltata] = useState(false); // passata da 2+ giorni senza farla: il calendario è andato avanti
  const [phase, setPhase] = useState<Phase>('preview');
  const [descOpen, setDescOpen] = useState<number | null>(null); // indice item con descrizione aperta
  const [savedProgress, setSavedProgress] = useState<PlayerProgress | null>(null); // seduta interrotta
  const [storico, setStorico] = useState<Record<string, { testo: string; suggerimento: string }>>({}); // ultima volta per esercizio (log serie)
  const [resume, setResume] = useState(false); // true = riprendi da savedProgress
  const [note, setNote] = useState('');
  const [rpeSeduta, setRpeSeduta] = useState<number | null>(null); // voto 1-10 sulla seduta intera (Ste, 23/9)
  const [giudizi, setGiudizi] = useState<Record<string, Giudizio>>({}); // giudizio per blocco
  const [spiegazioneOpen, setSpiegazioneOpen] = useState(false); // "Leggi tutto" sulla spiegazione del planner
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) {
      const data = await res.json();
      setPainHold(data.painHold);
      setFaticaAlta(data.faticaAlta === true);
      // Piano di una settimana passata: non si aprono più le sue sedute
      const s = data.planStale ? null : (data.plan?.plan?.sedute || []).find((x: PlanSession) => x.giorno === giorno);
      setSessione(s || null);
      setPlanId(data.plan?.id || null);
      setStorico(data.storicoSerie || {});
      const fatta = (data.completions || []).some((c: { session_key: string }) => Number(c.session_key.split('#')[1]) === giorno);
      setAlreadyDone(fatta);
      setSaltata(!fatta && typeof data.oggiDow === 'number' && giorno < data.oggiDow - 1);
      // Seduta interrotta? (progresso salvato dal player in localStorage)
      if (data.plan?.id && s) {
        try {
          const raw = localStorage.getItem(`trainingSession:${data.plan.id}#${giorno}`);
          if (raw) {
            const p = JSON.parse(raw) as PlayerProgress;
            if (p.itemIdx > 0 || p.serieFatte > 0 || p.lato === 'sx') setSavedProgress(p);
          }
        } catch { /* no-op */ }
      }
    }
    setLoading(false);
  }, [router, giorno]);

  useEffect(() => { load(); }, [load]);

  // Fine seduta (Ste, 23/9): voto 1-10 sulla seduta, giudizio per blocco, nota. Il server ricava
  // anche il vecchio facile/ok/duro dal voto; senza voto si salva comunque il completamento.
  const inviaFeedback = async () => {
    if (!planId) return;
    setSending(true);
    try {
      const blocchi = (sessione?.blocchi || []).filter((b) => giudizi[b.id]).map((b) => ({ id: b.id, nome: nomeBloccoAtleta(b.nome), giudizio: giudizi[b.id] }));
      await authFetch('/api/training/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, giorno, rpe: rpeSeduta ?? undefined, blocchi, note: note.trim() || undefined }),
      });
      setPhase('done');
    } finally { setSending(false); }
  };

  if (loading) {
    return <AppLoader />;
  }
  if (!sessione) {
    return (
      <main className="min-h-screen bg-app pt-safe px-5">
        <div className="max-w-md mx-auto text-center pt-20">
          <p className="text-body text-muted mb-4">Nessuna seduta per questo giorno.</p>
          <Button variant="secondary" onClick={() => router.push('/allenamento')}>Torna al Campo</Button>
        </div>
      </main>
    );
  }

  if (saltata) {
    return (
      <main className="min-h-screen bg-app pt-safe px-5">
        <div className="max-w-md mx-auto text-center pt-20">
          <Calendar size={40} className="text-muted mx-auto mb-3" aria-hidden />
          <p className="font-display text-title-2 font-bold text-app mb-1">Seduta saltata</p>
          <p className="text-body text-muted mb-6">Era {DAY_NAMES[giorno]}: si poteva recuperare il giorno dopo. Resta in memoria e, se la settimana finisce senza farla, il preparatore la ripropone uguale nella prossima.</p>
          <Button variant="secondary" onClick={() => router.push('/allenamento')}>Torna al Campo</Button>
        </div>
      </main>
    );
  }

  const isFisica = ['mix', 'fisica', 'skill'].includes(sessione.tipo);

  // Player full-screen
  const storageKey = planId ? `trainingSession:${planId}#${giorno}` : undefined;
  // Modalità scarico: −1 serie su tutto tranne gli EMOM (mai sotto 1)
  const itemsEffettivi = scarico
    ? sessione.items.map((it) => (it.schema === 'emom' ? it : { ...it, serie: Math.max(1, it.serie - 1) }))
    : sessione.items;

  if (phase === 'playing') {
    // Altezza fissa + scroll interno al player: con min-h-screen lo scroll si
    // appoggiava al body, che su PWA iOS si blocca (stesso bug risolto su /chat).
    // 100dvh, non 100vh (Ste, 21/9: "taglia qualche pulsante"): su Safari iOS con la barra del
    // browser 100vh sfora sotto il bordo visibile e la riga sotto la CTA finiva dietro la tab bar.
    // Stessa utility della chat (h-dvh-screen: 100vh con ripiego, 100dvh dove esiste).
    return (
      <main className="bg-app flex flex-col overflow-hidden h-dvh-screen" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <TrainingSessionPlayer
          items={itemsEffettivi}
          titolo={scarico ? `${sessione.titolo} (scarico)` : sessione.titolo}
          storageKey={storageKey}
          initialProgress={resume ? savedProgress : null}
          blocchi={sessione.blocchi}
          onSetLog={(log: SetLogInput) => {
            if (!planId) return;
            authFetch('/api/training/set-log', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plan_id: planId, giorno, ...log }),
            }).catch(() => { /* fire-and-forget: la seduta non si ferma */ });
          }}
          onComplete={() => { setSavedProgress(null); setResume(false); setPhase('feedback'); }}
          onExit={() => {
            // Il progresso resta salvato: al rientro si può riprendere da qui
            if (storageKey) {
              try {
                const raw = localStorage.getItem(storageKey);
                setSavedProgress(raw ? (JSON.parse(raw) as PlayerProgress) : null);
              } catch { /* no-op */ }
            }
            setResume(false);
            setPhase('preview');
          }}
        />
      </main>
    );
  }

  if (phase === 'feedback' || phase === 'done') {
    return (
      <main className="min-h-screen bg-app pt-safe pb-tabbar px-5">
        <div className="max-w-md mx-auto text-center pt-16">
          {phase === 'done' ? (
            <>
              <div className="text-5xl mb-4">💪</div>
              <h1 className="font-display text-title-1 font-bold text-app mb-2">Seduta fatta</h1>
              <p className="text-body text-muted mb-8">Segnata sul piano. Quello che hai detto serve a calibrare la settimana prossima.</p>
              <Button size="lg" fullWidth onClick={() => router.push('/allenamento')}>Torna al Campo</Button>
            </>
          ) : (
            <>
              <h1 className="font-display text-title-1 font-bold text-app mb-2">Com&apos;è andata?</h1>
              <p className="text-body text-muted mb-5">Venti secondi. Serve a costruire la settimana prossima.</p>
              <div className="text-left mb-5">
                <p className="text-label font-semibold text-app mb-2">La seduta, da 1 a 10</p>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" onClick={() => { setRpeSeduta(n); try { navigator.vibrate?.(15); } catch { /* no-op */ } }}
                      aria-label={`Voto ${n}`} aria-pressed={rpeSeduta === n}
                      className={`h-12 rounded-btn text-body font-bold border tabular-nums transition-colors ${rpeCls(n, rpeSeduta)}`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-caption text-muted text-center mt-1.5">1-3 facile · 5 giusta · 7-8 dura · 10 al limite</p>
              </div>
              {(sessione?.blocchi?.length ?? 0) > 0 && (
                <div className="text-left mb-5">
                  <p className="text-label font-semibold text-app mb-2">Blocco per blocco</p>
                  <div className="space-y-2.5">
                    {sessione!.blocchi!.map((b) => (
                      <div key={b.id} className="flex items-center justify-between gap-3">
                        <p className="text-body text-app min-w-0 truncate">{nomeBloccoAtleta(b.nome)}</p>
                        <div className="flex gap-1.5 shrink-0">
                          {GIUDIZI.map((g) => (
                            <Chip key={g.key} selected={giudizi[b.id] === g.key} onClick={() => setGiudizi((prev) => ({ ...prev, [b.id]: g.key }))}>{g.label}</Chip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Field label="Note" optional htmlFor="seduta-note" className="text-left" counter={{ value: note.length, max: 400 }}>
                <Textarea id="seduta-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={400}
                  placeholder="Un fastidio, un esercizio troppo difficile, troppo lunga…" />
              </Field>
              <Button size="lg" fullWidth loading={sending} disabled={rpeSeduta === null} onClick={inviaFeedback} className="mt-4">Salva</Button>
              <div className="mt-1"><Button variant="ghost" size="sm" disabled={sending} onClick={inviaFeedback}>Segna fatta senza voto</Button></div>
            </>
          )}
        </div>
      </main>
    );
  }

  // Preview seduta: header → avvisi → esercizi per blocco → CTA sticky in fondo
  const num = 'font-semibold tabular-nums';
  const nEsercizi = sessione.items.filter((it) => esercizioAny(it.esercizio_id)).length;
  // Esercizi raggruppati per blocco (ordine del piano); senza blocco → gruppo "Esercizi"
  const gruppi: { id: string; nome: string; durataMin?: number; items: { it: PlanItem; i: number }[] }[] = [];
  sessione.items.forEach((it, i) => {
    const last = gruppi[gruppi.length - 1];
    if (last && last.id === (it.blocco_id ?? '')) { last.items.push({ it, i }); return; }
    const b = it.blocco_id ? sessione.blocchi?.find((x) => x.id === it.blocco_id) : undefined;
    gruppi.push({ id: it.blocco_id ?? '', nome: b ? nomeBloccoAtleta(b.nome) : 'Esercizi', durataMin: b?.durataMin, items: [{ it, i }] });
  });
  const spiegazioneLunga = (sessione.spiegazione?.length ?? 0) > 160;
  const bloccata = painHold && isFisica;

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton onClick={() => router.push('/allenamento')} label="Campo" className="mb-2" />
        <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{DAY_NAMES[giorno]} · {TIPO_LABEL[sessione.tipo] ?? 'Seduta'}</p>
        <h1 className="font-display text-title-1 font-bold text-app mb-1">{sessione.titolo}</h1>
        <p className="text-body-sm text-muted tabular-nums mb-3">~{durataLabel(sessione.durata_min)} · {nEsercizi} esercizi</p>
        {sessione.spiegazione && (
          <div className="mb-5">
            <p className={`text-body text-muted leading-relaxed ${spiegazioneOpen ? '' : 'line-clamp-3'}`}>{sessione.spiegazione}</p>
            {spiegazioneLunga && !spiegazioneOpen && (
              <div className="-ml-4"><Button variant="ghost" size="sm" onClick={() => setSpiegazioneOpen(true)}>Leggi tutto</Button></div>
            )}
          </div>
        )}
        {alreadyDone && (
          <Card variant="accent" padding="sm" className="mb-4">
            <p className="text-body-sm font-semibold text-forest-300 flex items-center gap-2"><Check size={16} aria-hidden /> Già fatta. Puoi rifarla: sul piano resta segnata.</p>
          </Card>
        )}
        {bloccata && (
          <Card variant="danger" padding="sm" className="mb-4">
            <p className="text-body-sm text-danger flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />
              <span>Hai segnalato un dolore: questa seduta è in pausa. La riapri dal Campo quando è passato.</span>
            </p>
          </Card>
        )}
        {faticaAlta && isFisica && !alreadyDone && !painHold && (
          <Card variant="warn" padding="sm" className="mb-4">
            <p className="text-body-sm text-app leading-relaxed mb-3">Dal check-in di oggi sei scarico. Più leggera = una serie in meno per esercizio.</p>
            <div className="grid grid-cols-2 gap-2">
              <Chip size="lg" selected={!scarico} onClick={() => setScarico(false)} className="w-full">Normale</Chip>
              <Chip size="lg" tone="warn" selected={scarico} onClick={() => setScarico(true)} className="w-full">Più leggera</Chip>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {gruppi.map((g) => (
            <Card key={`${g.id}-${g.items[0].i}`} padding="sm">
              <SectionTitle as="h2" title={g.nome} subtitle={`${g.items.length} esercizi${g.durataMin ? ` · ~${g.durataMin}'` : ''}`} className="px-1 mb-1" />
              <div className="divide-y divide-divider">
                {g.items.map(({ it, i }) => {
                  const ex = esercizioAny(it.esercizio_id);
                  if (!ex) return null;
                  const isOpen = descOpen === i;
                  const unita = unitaItem(it, ex);
                  const sug = unita === ex.unita ? storico[it.esercizio_id] : undefined; // a tempo in un EMOM: il log a reps di un altro blocco non c'entra
                  return (
                    <div key={i} className="py-3 px-1">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-surface-2 text-muted text-caption font-bold flex items-center justify-center shrink-0 tabular-nums mt-0.5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-semibold text-app leading-snug">{ex.nome}</p>
                          <p className="text-body-sm text-muted tabular-nums">
                            {it.schema === 'emom'
                              ? <>EMOM · <span className={num}>{it.serie}</span> {it.serie === 1 ? 'giro' : 'giri'} · <span className={num}>{unitaLabel(unita, it.quantita)}</span> al minuto, poi riposo fino allo scadere</>
                              : <>
                                  <span className={num}>{it.serie} × {unitaLabel(unita, it.quantita)}</span>
                                  {it.carico_kg ? <> · <span className={num}>{it.carico_kg} kg</span></> : null}
                                  {it.per_lato ? ' per lato' : ex.perLato ? ' (dx+sx)' : ''}
                                  {' · recupero '}<span className={num}>{it.recupero_sec}&quot;</span>
                                </>}
                          </p>
                          {it.nota && (
                            <div className="mt-1.5 flex items-start gap-2">
                              <Badge tone={it.adattamento === 'scendi' || it.adattamento === 'leggero' ? 'warn' : 'accent'} className="shrink-0 mt-0.5">
                                {it.adattamento ? ADATTAMENTO_LABEL[it.adattamento] : 'Nota'}
                              </Badge>
                              <p className="text-body-sm text-app leading-snug">{it.nota}</p>
                            </div>
                          )}
                          {sug && (
                            <p className={`text-body-sm mt-1 ${sug.suggerimento === 'sali' ? 'text-forest-300' : sug.suggerimento === 'scendi' ? 'text-warning' : 'text-muted'}`}>
                              {sug.suggerimento === 'sali' ? '↑ ' : sug.suggerimento === 'scendi' ? '↓ ' : '→ '}{sug.testo}
                            </p>
                          )}
                          {ex.descrizione && (
                            <div className="-ml-4 mt-0.5">
                              <Button variant="ghost" size="sm" icon={<Info size={16} />} onClick={() => setDescOpen(isOpen ? null : i)}>
                                {isOpen ? 'Nascondi' : 'Come si esegue'}
                              </Button>
                            </div>
                          )}
                          {isOpen && ex.descrizione && (
                            <p className="text-body-sm text-muted leading-relaxed mt-1 pr-1">{ex.descrizione}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {savedProgress && (
          <Card variant="warn" padding="sm" className="mt-4">
            <p className="text-body-sm text-warning flex items-center gap-2">
              <Pause size={16} className="shrink-0" aria-hidden />
              <span>Ti eri fermato all&apos;esercizio {Math.min(savedProgress.itemIdx + 1, sessione.items.length)} di {sessione.items.length}.</span>
            </p>
          </Card>
        )}

        {/* CTA sticky in fondo: si vede subito anche con 13 esercizi */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -mx-5 px-5 pt-3 pb-1 mt-4 bg-app-bg/90 backdrop-blur">
          {savedProgress ? (
            <div className="space-y-2">
              <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} disabled={bloccata}
                onClick={() => { setResume(true); setPhase('playing'); }}>
                Riprendi da dove eri
              </Button>
              <Button variant="secondary" fullWidth disabled={bloccata}
                onClick={() => {
                  if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* no-op */ } }
                  setSavedProgress(null); setResume(false); setPhase('playing');
                }}>
                Ricomincia da capo
              </Button>
            </div>
          ) : (
            <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} disabled={bloccata}
              onClick={() => { setResume(false); setPhase('playing'); }}>
              Inizia la seduta
            </Button>
          )}
          {isFisica && (
            <p className="text-caption text-muted text-center mt-2 truncate">Se un esercizio fa male, fermati: il dolore non si allena.</p>
          )}
        </div>
      </div>
    </main>
  );
}
