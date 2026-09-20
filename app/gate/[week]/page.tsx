'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, DayProgress } from '@/lib/dayUnlockLogic';
import { GATE_DAY } from '@/lib/constants';
import SaveErrorBanner from '@/components/SaveErrorBanner';
import { Check, Key, PenLine, Target } from 'lucide-react';
import { AppLoader, BackButton, Badge, Button, Card, Field, SectionTitle, Textarea } from '@/components/ui';

export default function GatePage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);

  const [loading, setLoading] = useState(true);
  const [paywall, setPaywall] = useState(false);
  const [userId, setUserId] = useState('');
  const [giorno, setGiorno] = useState<any>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const uid = session.user.id;
      setUserId(uid);

      // Controlla se il gate (giorno 7) è sbloccato (time-gate)
      const { data: progressData } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, completed_at, compressed, created_at')
        .eq('user_id', uid)
        .eq('completed', true);

      const completedDays: DayProgress[] = (progressData || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
        startedAt: p.created_at || null,
      }));

      if (!isDayUnlocked(weekNumber, GATE_DAY, completedDays)) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      const res = await authFetch(`/api/gate?week=${weekNumber}&userId=${uid}`);
      const data = await res.json();

      // Settimana gratis: il gate è il primo punto a pagamento ("si paga per continuare").
      if (res.status === 403 && data?.error === 'payment_required') {
        setPaywall(true);
        setLoading(false);
        return;
      }

      if (data.error) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      setGiorno(data.giorno);
      setQuestions(data.questions || []);
      setCompleted(data.completed);

      if (data.answers) {
        setAnswers(data.answers);
      } else {
        // Bozza autosalvata: se aveva iniziato a scrivere e ha chiuso, riprende da lì
        let draft: Record<string, string> | null = null;
        try {
          const saved = localStorage.getItem(`gateDraft-w${weekNumber}`);
          if (saved) draft = JSON.parse(saved);
        } catch { /* ignora */ }

        if (draft) {
          setAnswers(draft);
        } else {
          const empty: Record<string, string> = {};
          (data.questions || []).forEach((_: string, i: number) => {
            empty[`q${i + 1}`] = '';
          });
          setAnswers(empty);
        }
      }

      setLoading(false);
    };

    init();
  }, [weekNumber, router]);

  // Autosave bozza risposte (debounce 600ms) — persa solo al submit riuscito
  useEffect(() => {
    if (loading || completed) return;
    const hasText = Object.values(answers).some(v => (v || '').trim().length > 0);
    if (!hasText) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`gateDraft-w${weekNumber}`, JSON.stringify(answers));
      } catch { /* ignora */ }
    }, 600);
    return () => clearTimeout(t);
  }, [answers, loading, completed, weekNumber]);

  // Guard: con 0 domande (Notion vuoto/errore) .every() sarebbe true e il gate
  // si passerebbe a vuoto — senza domande il submit resta disabilitato.
  const allAnswered =
    questions.length > 0 &&
    questions.every((_, i) => (answers[`q${i + 1}`] || '').trim().length > 0);

  const handleSubmit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);
    setSaveError(false);

    try {
      const res = await authFetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber, answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');

      try {
        localStorage.removeItem(`gateDraft-w${weekNumber}`);
      } catch { /* ignora */ }
      setCompleted(true);
      setShowCelebration(true);
    } catch (err: any) {
      console.error('Errore gate:', err.message);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLoader label="Caricamento Gate…" />;

  if (paywall) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center pt-safe pb-6 px-6 text-white animate-fadeIn">
        <div className="flex flex-col items-center text-center max-w-sm w-full">
          <div className="flex justify-center mb-5 text-forest-100" aria-hidden><Key size={56} /></div>
          <h1 className="font-display text-title-1 font-bold mb-3">Hai finito la settimana {weekNumber}</h1>
          <p className="text-forest-100 text-body leading-relaxed mb-2">
            Sette giorni, uno strumento tuo. Il Gate è il momento in cui lo fissi: tre domande che chiudono la settimana e aprono la prossima.
          </p>
          <p className="text-white text-body leading-relaxed mb-8">
            Da qui in avanti è Season 1: il Gate, le settimane 2-12 e il Coach sempre con te.
          </p>
          <Button variant="inverse" size="lg" fullWidth onClick={() => router.push('/pricing?from=gate')}>
            Sblocca Season 1
          </Button>
          <Button variant="ghost" onClick={() => router.push(`/settimana/${weekNumber}`)} className="mt-3 text-forest-100">
            Torna alla settimana
          </Button>
        </div>
      </main>
    );
  }

  if (showCelebration) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center p-6 text-white">
        <div className="text-7xl mb-6" aria-hidden>🏆</div>
        <h1 className="font-display text-title-1 font-bold mb-2 text-center">Settimana {weekNumber} completata!</h1>
        <p className="text-white text-center mb-2 text-body">Hai superato il Gate</p>
        <p className="text-white text-body text-center mb-8 max-w-xs leading-relaxed">
          Ogni settimana è un mattone. La prossima si sblocca domattina —
          oggi hai chiuso il cerchio.
        </p>
        {giorno?.missioneSettimana && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-card px-5 py-4 mb-8 max-w-sm text-center">
            <p className="text-forest-100 text-overline font-bold uppercase tracking-wider mb-1.5 inline-flex items-center gap-1.5">
              <Target size={14} aria-hidden /> La tua missione per la prossima settimana
            </p>
            <p className="text-white text-body leading-relaxed">{giorno.missioneSettimana}</p>
          </div>
        )}
        <Button variant="inverse" size="lg" onClick={() => router.push(`/week-complete/${weekNumber}`)}>
          Vedi il riepilogo
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="max-w-xl mx-auto space-y-5">

        <BackButton tone="light" label={`Settimana ${weekNumber}`} onClick={() => router.push(`/settimana/${weekNumber}`)} />

        {/* Header Gate */}
        <Card className="border-l-4 border-l-forest-500">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge tone="accent" icon={<Key size={12} aria-hidden />}>Gate · Settimana {weekNumber}</Badge>
            {completed && (
              <Badge tone="success" icon={<Check size={12} strokeWidth={3} aria-hidden />}>Completato</Badge>
            )}
          </div>
          <h1 className="font-display text-title-1 font-bold text-app">Chiusura settimana</h1>
          <p className="text-muted text-body-sm mt-1">Giorno 7 — Il punto sulla settimana</p>
        </Card>

        {/* Apertura */}
        {giorno?.apertura && (
          <Card>
            <p className="text-app text-body-lg leading-relaxed whitespace-pre-line">
              {giorno.apertura}
            </p>
          </Card>
        )}

        {/* Prima di rispondere */}
        {giorno?.pratica && (
          <Card variant="accent" padding="sm">
            <SectionTitle as="h3" title="Prima di rispondere" icon={<Target size={18} />} className="mb-2" />
            <p className="text-app text-body leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>
          </Card>
        )}

        {/* Le domande del Gate */}
        <Card className="space-y-5">
          <SectionTitle
            title="Le domande del Gate"
            icon={<PenLine size={18} />}
            subtitle={`Rispondi a ${questions.length > 1 ? `tutte e ${questions.length}` : 'tutto'} per sbloccare la settimana successiva`}
          />

          {questions.length === 0 && (
            <SaveErrorBanner message="Non siamo riusciti a caricare le domande. Ricarica la pagina — se il problema resta, scrivici." />
          )}

          {questions.map((q, i) => {
            const key = `q${i + 1}`;
            const value = answers[key] || '';
            return (
              <Field key={i} label={<span className="text-body font-medium leading-relaxed">{q}</span>} htmlFor={`gate-${key}`} counter={{ value: value.length, max: 1500 }}>
                <Textarea
                  id={`gate-${key}`}
                  value={value}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                  disabled={completed}
                  rows={5}
                  maxLength={1500}
                  placeholder="Scrivi qui…"
                />
              </Field>
            );
          })}
        </Card>

        {/* Bottone */}
        {!completed ? (
          <div className="space-y-2">
            {saveError && (
              <SaveErrorBanner
                message="Il Gate non è stato salvato. Le tue risposte sono al sicuro qui — riprova."
                onRetry={handleSubmit}
              />
            )}
            <Button
              variant="hero"
              size="lg"
              fullWidth
              icon={<Key size={20} aria-hidden />}
              onClick={handleSubmit}
              disabled={!allAnswered}
              loading={saving}
            >
              {saving ? 'Salvataggio…' : 'Completa il Gate'}
            </Button>
            {!allAnswered && questions.length > 0 && (
              <p className="text-body-sm text-muted text-center">
                Rispondi a {questions.length > 1 ? `tutte e ${questions.length} le domande` : 'la domanda'} per continuare
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Card variant="accent" padding="sm" className="text-center">
              <p className="text-forest-300 font-semibold text-body inline-flex items-center gap-1.5">
                <Check size={18} strokeWidth={3} aria-hidden /> Gate già completato
              </p>
            </Card>
            <Button variant="secondary" size="lg" fullWidth onClick={() => router.push(`/week-complete/${weekNumber}`)}>
              Vedi riepilogo settimana
            </Button>
          </div>
        )}

        <div className="h-4" />
      </div>
    </main>
  );
}
