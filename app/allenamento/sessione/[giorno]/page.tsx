'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_NAMES } from '@/lib/constants';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import TrainingSessionPlayer, { type PlayerProgress, type SetLogInput } from '@/components/TrainingSessionPlayer';
import { esercizioAny, unitaLabel } from '@/lib/trainingExercise';
import { AlertTriangle, Calendar, Check, Info, Lightbulb, Pause, Play, Timer } from 'lucide-react';
import { AppLoader, BackButton, Button, Card, Chip, Textarea } from '@/components/ui';

interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string; carico_kg?: number; blocco_id?: string; adattamento?: 'sali' | 'scendi' | 'gradino' | 'lato' | 'leggero'; lato_extra?: 'dx' | 'sx'
  per_lato?: boolean;
}
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; qualita: string; durataMin: number }[] }

type Phase = 'preview' | 'playing' | 'feedback' | 'done';

// Etichetta italiana del tipo di seduta (l'enum del planner non si mostra all'atleta)
const TIPO_LABEL: Record<string, string> = {
  fisica: 'Fisica', mix: 'Fisica e tecnica', tecnica: 'Tecnica', skill: 'Tecnica', fascia: 'Fascia e prevenzione', recupero: 'Recupero',
};

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

  const inviaFeedback = async (feedback: 'facile' | 'ok' | 'duro') => {
    if (!planId) return;
    setSending(true);
    try {
      await authFetch('/api/training/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, giorno, feedback, note: note.trim() || undefined }),
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
    // appoggiava al body, che su PWA iOS si blocca (stesso bug risolto su /chat)
    return (
      <main className="bg-app flex flex-col overflow-hidden" style={{ height: '100vh', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
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
              <h1 className="font-display text-title-1 font-bold text-app mb-2">Seduta completata!</h1>
              <p className="text-body text-muted mb-8">Segnata sul piano — il feedback aiuta il preparatore a calibrare la prossima settimana.</p>
              <Button size="lg" fullWidth onClick={() => router.push('/allenamento')}>Torna al Campo</Button>
            </>
          ) : (
            <>
              <h1 className="font-display text-title-1 font-bold text-app mb-2">Com&apos;è andata?</h1>
              <p className="text-body text-muted mb-6">Un tap — serve a calibrare la settimana prossima.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(['facile', 'ok', 'duro'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => inviaFeedback(f)} disabled={sending}
                    className="bg-surface border border-divider rounded-card py-5 text-app font-bold disabled:opacity-50 active:scale-[0.98] transition-transform">
                    <span className="text-2xl" aria-hidden>{f === 'facile' ? '😀' : f === 'ok' ? '👌' : '🥵'}</span><br /><span className="text-body-sm">{f}</span>
                  </button>
                ))}
              </div>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={400}
                placeholder="Note? (es. un fastidio, un esercizio troppo difficile) — opzionale" aria-label="Note sulla seduta"
                className="text-left" />
            </>
          )}
        </div>
      </main>
    );
  }

  // Preview seduta
  const num = 'font-semibold tabular-nums';
  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton onClick={() => router.push('/allenamento')} label="Campo" className="mb-2" />
        <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mb-1">{DAY_NAMES[giorno]} · {TIPO_LABEL[sessione.tipo] ?? sessione.tipo}</p>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="font-display text-title-1 font-bold text-app">{sessione.titolo}</h1>
          <span className="shrink-0 inline-flex items-center gap-1 text-body-sm font-bold text-forest-300 bg-forest-500/15 border border-forest-500/30 rounded-full px-3 py-1 tabular-nums mt-1">
            <Timer size={14} aria-hidden /> ~{durataLabel(sessione.durata_min)}
          </span>
        </div>
        {sessione.spiegazione && (
          <p className="text-body text-muted leading-relaxed mb-4 flex gap-2">
            <Lightbulb size={18} className="text-forest-400 shrink-0 mt-1" aria-hidden />
            <span>{sessione.spiegazione}</span>
          </p>
        )}
        {alreadyDone && (
          <Card variant="accent" padding="sm" className="mb-4">
            <p className="text-body-sm font-semibold text-forest-300 flex items-center gap-2"><Check size={16} aria-hidden /> Già completata — puoi rifarla, il piano resta segnato.</p>
          </Card>
        )}
        {painHold && isFisica && (
          <Card variant="danger" padding="sm" className="mb-4">
            <p className="text-body-sm text-danger flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />
              <span>Hai un dolore segnalato: questa seduta fisica è in pausa. Sbloccala dal Campo quando è passato.</span>
            </p>
          </Card>
        )}
        {faticaAlta && isFisica && !alreadyDone && !painHold && (
          <Card variant="warn" padding="sm" className="mb-4">
            <p className="text-body-sm text-warning leading-relaxed">
              Il check-in di oggi segna fatica alta (riposo/recupero bassi). Meglio alleggerire: una serie in meno per esercizio.
            </p>
            <div className="mt-2">
              <Chip tone="warn" selected={scarico} onClick={() => setScarico(!scarico)}>
                {scarico ? 'Modalità scarico attiva (−1 serie), tocca per annullare' : 'Alleggerisci la seduta (−1 serie)'}
              </Chip>
            </div>
          </Card>
        )}

        <div className="space-y-2 mb-5">
          {sessione.items.map((it, i) => {
            const ex = esercizioAny(it.esercizio_id);
            if (!ex) return null;
            const isOpen = descOpen === i;
            const blocco = it.blocco_id && it.blocco_id !== sessione.items[i - 1]?.blocco_id ? sessione.blocchi?.find((b) => b.id === it.blocco_id) : undefined;
            return (
              <div key={i}>
              {blocco && (
                <p className="text-overline uppercase tracking-wider font-semibold text-forest-400 mt-3 mb-1.5 px-1">{nomeBloccoAtleta(blocco.nome)} · ~{blocco.durataMin}&apos;</p>
              )}
              <Card padding="sm">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-surface-2 text-muted text-caption font-bold flex items-center justify-center shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-app leading-snug">{ex.nome}</p>
                    <p className="text-body-sm text-app">
                      {it.schema === 'emom'
                        ? <>EMOM <span className={num}>{it.serie}&apos;</span> · <span className={num}>{it.quantita}</span>/min</>
                        : <>
                            <span className={num}>{it.serie}×{unitaLabel(ex.unita, it.quantita)}</span>
                            {it.carico_kg ? <> @ <span className={num}>{it.carico_kg} kg</span></> : null}
                            {it.per_lato ? ' per lato' : ex.perLato ? ' (dx+sx)' : ''}
                            {' · rec '}<span className={num}>{it.recupero_sec}&quot;</span>
                          </>}
                    </p>
                  </div>
                </div>
                {it.adattamento && it.nota && (
                  <p className={`text-body-sm mt-1.5 ml-10 leading-snug ${it.adattamento === 'scendi' || it.adattamento === 'leggero' ? 'text-warning' : 'text-forest-300'}`}>{it.nota}</p>
                )}
                {storico[it.esercizio_id] && (
                  <p className={`text-body-sm mt-1.5 ml-10 ${storico[it.esercizio_id].suggerimento === 'sali' ? 'text-forest-300' : storico[it.esercizio_id].suggerimento === 'scendi' ? 'text-warning' : 'text-muted'}`}>
                    {storico[it.esercizio_id].suggerimento === 'sali' ? '↑ ' : storico[it.esercizio_id].suggerimento === 'scendi' ? '↓ ' : '→ '}{storico[it.esercizio_id].testo}
                  </p>
                )}
                {ex.descrizione && (
                  <div className="mt-1 ml-6">
                    <Button variant="ghost" size="sm" icon={<Info size={16} />} onClick={() => setDescOpen(isOpen ? null : i)}>
                      {isOpen ? 'Nascondi descrizione' : 'Come si esegue'}
                    </Button>
                  </div>
                )}
                {isOpen && ex.descrizione && (
                  <p className="text-body-sm text-muted leading-relaxed mt-1 ml-10 pr-1">{ex.descrizione}</p>
                )}
              </Card>
              </div>
            );
          })}
        </div>

        {savedProgress ? (
          <div className="space-y-3">
            <Card variant="warn" padding="sm">
              <p className="text-body-sm text-warning flex items-center gap-2">
                <Pause size={16} className="shrink-0" aria-hidden />
                <span>Seduta interrotta all&apos;esercizio {Math.min(savedProgress.itemIdx + 1, sessione.items.length)} di {sessione.items.length}.</span>
              </p>
            </Card>
            <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} disabled={painHold && isFisica}
              onClick={() => { setResume(true); setPhase('playing'); }}>
              Riprendi da dove eri
            </Button>
            <Button variant="secondary" fullWidth disabled={painHold && isFisica}
              onClick={() => {
                if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* no-op */ } }
                setSavedProgress(null); setResume(false); setPhase('playing');
              }}>
              Ricomincia da capo
            </Button>
          </div>
        ) : (
          <Button variant="hero" size="lg" fullWidth icon={<Play size={20} />} disabled={painHold && isFisica}
            onClick={() => { setResume(false); setPhase('playing'); }}>
            Inizia la seduta
          </Button>
        )}
        {isFisica && (
          <p className="text-body-sm text-warning leading-relaxed text-center mt-3 px-2">
            Se oggi hai un dolore o non ti senti bene, salta la seduta. Se un esercizio fa male, fermati: il dolore non si allena.
          </p>
        )}
      </div>
    </main>
  );
}
