'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_NAMES } from '@/lib/constants';
import { nomeBloccoAtleta, durataLabel } from '@/lib/trainingLabels';
import TrainingSessionPlayer, { type PlayerProgress, type SetLogInput } from '@/components/TrainingSessionPlayer';
import { esercizioAny, unitaLabel } from '@/lib/trainingExercise';
import { ArrowLeft, Info, Play } from 'lucide-react';

interface PlanItem { esercizio_id: string; serie: number; quantita: number; recupero_sec: number; schema?: string; nota?: string; carico_kg?: number; blocco_id?: string
  per_lato?: boolean;
}
interface PlanSession { giorno: number; titolo: string; tipo: string; durata_min: number; items: PlanItem[]; spiegazione?: string; blocchi?: { id: string; nome: string; qualita: string; durataMin: number }[] }

type Phase = 'preview' | 'playing' | 'feedback' | 'done';

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
    return <main className="min-h-screen bg-app flex items-center justify-center"><div className="text-4xl animate-ball-bounce">⚽</div></main>;
  }
  if (!sessione) {
    return (
      <main className="min-h-screen bg-app pt-safe px-5">
        <div className="max-w-md mx-auto text-center pt-20">
          <p className="text-muted mb-4">Nessuna seduta per questo giorno.</p>
          <button onClick={() => router.push('/allenamento')} className="text-forest-400 font-semibold">← Torna al Campo</button>
        </div>
      </main>
    );
  }

  if (saltata) {
    return (
      <main className="min-h-screen bg-app pt-safe px-5">
        <div className="max-w-md mx-auto text-center pt-20">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-app font-semibold mb-1">Seduta saltata</p>
          <p className="text-muted text-sm mb-6">Era {DAY_NAMES[giorno]}: si poteva recuperare il giorno dopo. Resta in memoria e, se la settimana finisce senza farla, il preparatore la ripropone uguale nella prossima.</p>
          <button onClick={() => router.push('/allenamento')} className="text-forest-400 font-semibold">← Torna al Campo</button>
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
              <h1 className="text-2xl font-bold text-app mb-2">Seduta completata!</h1>
              <p className="text-muted text-sm mb-8">Segnata sul piano — il feedback aiuta il preparatore a calibrare la prossima settimana.</p>
              <button onClick={() => router.push('/allenamento')}
                className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3.5 rounded-2xl">
                Torna al Campo
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-app mb-2">Com&apos;è andata?</h1>
              <p className="text-muted text-sm mb-6">Un tap — serve a calibrare la settimana prossima.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {(['facile', 'ok', 'duro'] as const).map((f) => (
                  <button key={f} onClick={() => inviaFeedback(f)} disabled={sending}
                    className="bg-surface border border-divider rounded-2xl py-5 text-app font-bold disabled:opacity-50">
                    {f === 'facile' ? '😀' : f === 'ok' ? '👌' : '🥵'}<br /><span className="text-sm">{f}</span>
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={400}
                placeholder="Note? (es. un fastidio, un esercizio troppo difficile) — opzionale"
                className="w-full px-3 py-2.5 bg-surface border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 resize-none" />
            </>
          )}
        </div>
      </main>
    );
  }

  // Preview seduta
  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.push('/allenamento')} className="inline-flex items-center gap-1.5 text-sm text-muted mb-3">
          <ArrowLeft size={16} /> Campo
        </button>
        <p className="text-xs uppercase tracking-widest text-forest-400 font-bold mb-1">{DAY_NAMES[giorno]} · {sessione.tipo}</p>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold text-app">{sessione.titolo}</h1>
          <span className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-forest-300 bg-forest-500/15 border border-forest-500/30 rounded-xl px-2.5 py-1 tabular-nums mt-1">⏱ ~{durataLabel(sessione.durata_min)}</span>
        </div>
        {sessione.spiegazione && <p className="text-sm text-muted leading-relaxed mb-4">💡 {sessione.spiegazione}</p>}
        {alreadyDone && (
          <p className="text-xs font-semibold text-forest-300 bg-forest-500/10 border border-forest-500/30 rounded-xl px-3 py-2 mb-4">✓ Già completata — puoi rifarla, il piano resta segnato.</p>
        )}
        {painHold && isFisica && (
          <p className="text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 mb-4">
            ⚠️ Hai un dolore segnalato: questa seduta fisica è in pausa. Sbloccala dal Campo quando è passato.
          </p>
        )}
        {faticaAlta && isFisica && !alreadyDone && !painHold && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 mb-4">
            <p className="text-xs text-amber-200 leading-relaxed">
              😮‍💨 Il check-in di oggi segna fatica alta (riposo/recupero bassi). Meglio alleggerire: una serie in meno per esercizio.
            </p>
            <button onClick={() => setScarico(!scarico)}
              className={`mt-2 text-xs font-bold rounded-lg px-3 py-1.5 border ${scarico ? 'bg-amber-500/25 border-amber-400/40 text-amber-100' : 'bg-surface-2 border-divider text-app'}`}>
              {scarico ? '✓ Modalità scarico attiva (−1 serie) — tocca per annullare' : 'Alleggerisci la seduta (−1 serie)'}
            </button>
          </div>
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
                <p className="text-[11px] uppercase tracking-widest text-forest-400 font-bold mt-3 mb-1.5 px-1">{nomeBloccoAtleta(blocco.nome)} · ~{blocco.durataMin}&apos;</p>
              )}
              <div className="bg-surface border border-divider rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-surface-2 text-faint text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-app leading-snug">{ex.nome}</p>
                    <p className="text-xs text-faint">
                      {it.schema === 'emom'
                        ? `EMOM ${it.serie}' · ${it.quantita}/min`
                        : `${it.serie}×${unitaLabel(ex.unita, it.quantita)}${it.carico_kg ? ` @ ${it.carico_kg} kg` : ''}${it.per_lato ? ' per lato' : ex.perLato ? ' (dx+sx)' : ''} · rec ${it.recupero_sec}"`}
                    </p>
                  </div>
                  {ex.videoUrl && <span className="text-[10px] text-forest-400 font-bold shrink-0">▶ video</span>}
                </div>
                {storico[it.esercizio_id] && (
                  <p className={`text-[11px] mt-1.5 ml-10 ${storico[it.esercizio_id].suggerimento === 'sali' ? 'text-forest-300' : storico[it.esercizio_id].suggerimento === 'scendi' ? 'text-amber-300' : 'text-faint'}`}>
                    {storico[it.esercizio_id].suggerimento === 'sali' ? '↑ ' : storico[it.esercizio_id].suggerimento === 'scendi' ? '↓ ' : '→ '}{storico[it.esercizio_id].testo}
                  </p>
                )}
                {ex.descrizione && (
                  <button onClick={() => setDescOpen(isOpen ? null : i)}
                    className="inline-flex items-center gap-1 text-[11px] text-forest-400 font-semibold mt-2 ml-10">
                    <Info size={12} /> {isOpen ? 'Nascondi descrizione' : 'Come si esegue'}
                  </button>
                )}
                {isOpen && ex.descrizione && (
                  <p className="text-xs text-muted leading-relaxed mt-1.5 ml-10 pr-1">{ex.descrizione}</p>
                )}
              </div>
              </div>
            );
          })}
        </div>

        {savedProgress ? (
          <div className="space-y-3">
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              ⏸ Seduta interrotta all&apos;esercizio {Math.min(savedProgress.itemIdx + 1, sessione.items.length)} di {sessione.items.length}.
            </p>
            <button onClick={() => { setResume(true); setPhase('playing'); }} disabled={painHold && isFisica}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-4 rounded-2xl text-lg inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Play size={18} /> Riprendi da dove eri
            </button>
            <button onClick={() => {
              if (storageKey) { try { localStorage.removeItem(storageKey); } catch { /* no-op */ } }
              setSavedProgress(null); setResume(false); setPhase('playing');
            }} disabled={painHold && isFisica}
              className="w-full bg-surface border border-divider text-app font-semibold py-3 rounded-2xl text-sm disabled:opacity-50">
              Ricomincia da capo
            </button>
          </div>
        ) : (
          <button onClick={() => { setResume(false); setPhase('playing'); }} disabled={painHold && isFisica}
            className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-4 rounded-2xl text-lg inline-flex items-center justify-center gap-2 disabled:opacity-50">
            <Play size={18} /> Inizia la seduta
          </button>
        )}
      </div>
    </main>
  );
}
