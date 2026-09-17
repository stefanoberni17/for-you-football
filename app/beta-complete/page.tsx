'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BETA_MAX_WEEK, SPORT_FEARS, PLAYER_FEARS } from '@/lib/constants';
import { BarChart3, Check, Dumbbell, IdCard, Map, MessageCircle } from 'lucide-react';
import { Button, Card, Field, SectionTitle, Textarea } from '@/components/ui';

interface MirrorData {
  situazioneIniziale: string | null;
  paure: string[]; // label leggibili
  gateW1: string | null; // risposta q3 gate W1 ("Hai percepito qualcosa di diverso?")
  gateFinal: string | null; // risposta al gate dell'ultima settimana disponibile
  giorniCompletati: number;
  mentalePrima: number | null; // media stato mentale prima settimana di check-in
  mentaleDopo: number | null; // media ultima settimana
}

export default function BetaCompletePage() {
  const router = useRouter();
  const [name, setName] = useState('Campione');
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [mirror, setMirror] = useState<MirrorData | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const uid = session.user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, current_week, current_situation, biggest_fear, sport')
        .eq('user_id', uid)
        .single();

      if (profile?.name) setName(profile.name);

      // Se non ha davvero completato la beta, torna in home
      if (!profile || profile.current_week <= BETA_MAX_WEEK) {
        router.push('/');
        return;
      }

      // ── Il tuo prima e dopo: le sue parole dell'INIZIO percorso ───────────
      // Fonte primaria: profile_snapshots (baseline T0 immutabile, migration 007).
      // profiles è il fallback per chi si è registrato prima dello snapshot:
      // lì i campi sono editabili, quindi il "prima" può essere già il "dopo".
      const { data: snapshot } = await supabase
        .from('profile_snapshots')
        .select('current_situation, biggest_fear')
        .eq('user_id', uid)
        .order('snapshot_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const situazioneT0 = snapshot?.current_situation ?? profile.current_situation;
      const paureT0 = snapshot?.biggest_fear ?? profile.biggest_fear;

      const fearOptions = SPORT_FEARS[profile.sport || 'calcio'] || PLAYER_FEARS;
      const paure = (paureT0 || '')
        .split(',')
        .filter(Boolean)
        .map((v: string) => fearOptions.find(f => f.value === v)?.label || v);

      const [{ data: gates }, { count: completedCount }, { data: checkins }] = await Promise.all([
        supabase
          .from('user_day_progress')
          .select('week_number, gate_answers')
          .eq('user_id', uid)
          .eq('day_number', 7)
          .in('week_number', [1, BETA_MAX_WEEK]),
        supabase
          .from('user_day_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('completed', true),
        supabase
          .from('daily_checkin')
          .select('date, mental_state')
          .eq('user_id', uid)
          .order('date', { ascending: true }),
      ]);

      const gateW1Answers = gates?.find(g => g.week_number === 1)?.gate_answers;
      const gateFinalAnswers = gates?.find(g => g.week_number === BETA_MAX_WEEK)?.gate_answers;

      const mentals = (checkins || [])
        .filter(c => c.mental_state !== null)
        .map(c => c.mental_state as number);
      const avg = (arr: number[]) =>
        arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

      setMirror({
        situazioneIniziale: situazioneT0 || null,
        paure,
        gateW1: gateW1Answers?.q3 || gateW1Answers?.q2 || null,
        gateFinal: gateFinalAnswers?.q2 || gateFinalAnswers?.q3 || gateFinalAnswers?.q1 || null,
        giorniCompletati: completedCount || 0,
        mentalePrima: mentals.length >= 6 ? avg(mentals.slice(0, 7)) : null,
        mentaleDopo: mentals.length >= 6 ? avg(mentals.slice(-7)) : null,
      });
    };
    load();
  }, [router]);

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      const subject = encodeURIComponent('Feedback Beta For You Football');
      const body = encodeURIComponent(feedback);
      window.location.href = `mailto:info@foryoufootball.it?subject=${subject}&body=${body}`;
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const mirrorPrompt =
    'Ho appena riletto quello che avevo scritto all\'inizio del percorso e le risposte dei miei gate. Vorrei riflettere con te su cosa è cambiato in queste settimane.';

  const hasMirrorContent =
    mirror && (mirror.situazioneIniziale || mirror.gateW1 || mirror.gateFinal);

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center">
          <div className="text-6xl mb-4" aria-hidden>🏆</div>
          <h1 className="font-display text-title-1 font-bold text-app mb-2">
            Ce l&apos;hai fatta, {name}.
          </h1>
          <p className="text-body text-muted leading-relaxed">
            Hai completato tutte le {BETA_MAX_WEEK} settimane disponibili.
            Hai costruito lo strumento — Presenza, Osservazione, Ascolto, Protocollo Pressione —
            e hai imparato a giocare nelle difficoltà: Accettazione, Lasciare Andare, Perdono.
          </p>
          <p className="text-body text-muted leading-relaxed mt-3">
            L&apos;ultimo blocco — Giocare libero, il ritorno al centro — sta arrivando.
            Ti scriveremo non appena sarà disponibile.
          </p>
        </Card>

        {/* ── Il tuo prima e dopo — le sue parole, non le nostre ────────────── */}
        {hasMirrorContent && (
          <Card className="space-y-5">
            <SectionTitle
              size="lg"
              title="Il tuo prima e dopo"
              subtitle="Non te lo diciamo noi, com'è andata. Te lo dicono le tue parole."
            />

            {(mirror.situazioneIniziale || mirror.paure.length > 0) && (
              <Card variant="raised" padding="sm">
                <p className="text-overline font-bold text-faint uppercase tracking-wider mb-2">
                  Da dove sei partito — all&apos;inizio del percorso
                </p>
                {mirror.situazioneIniziale && (
                  <p className="font-quote text-body-lg text-app leading-relaxed">
                    &ldquo;{mirror.situazioneIniziale}&rdquo;
                  </p>
                )}
                {mirror.paure.length > 0 && (
                  <p className="text-body-sm text-muted mt-2">
                    La tua paura: {mirror.paure.join(' · ')}
                  </p>
                )}
              </Card>
            )}

            {mirror.gateW1 && (
              <Card variant="raised" padding="sm">
                <p className="text-overline font-bold text-faint uppercase tracking-wider mb-2">
                  Fine Settimana 1 — scrivevi:
                </p>
                <p className="font-quote text-body-lg text-app leading-relaxed">
                  &ldquo;{mirror.gateW1}&rdquo;
                </p>
              </Card>
            )}

            {mirror.gateFinal && (
              <Card variant="accent" padding="sm">
                <p className="text-overline font-bold text-forest-300 uppercase tracking-wider mb-2">
                  Fine Settimana {BETA_MAX_WEEK} — hai scritto:
                </p>
                <p className="font-quote text-body-lg text-forest-100 leading-relaxed">
                  &ldquo;{mirror.gateFinal}&rdquo;
                </p>
              </Card>
            )}

            {/* I numeri — piccoli, le parole grandi */}
            <div className="flex gap-3 text-center">
              <div className="flex-1 bg-surface-2 rounded-card py-3">
                <p className="font-display text-title-2 font-bold text-app tabular-nums">{mirror.giorniCompletati}</p>
                <p className="text-caption text-faint">giorni completati</p>
              </div>
              {mirror.mentalePrima !== null && mirror.mentaleDopo !== null && (
                <div className="flex-1 bg-surface-2 rounded-card py-3">
                  <p className="font-display text-title-2 font-bold text-app tabular-nums">
                    {mirror.mentalePrima} → {mirror.mentaleDopo}
                  </p>
                  <p className="text-caption text-faint">stato mentale, prima e ultima settimana</p>
                </div>
              )}
            </div>

            <div className="border-t border-divider pt-4">
              <p className="text-body text-app leading-relaxed mb-3">
                Rileggi il ragazzo che ha scritto quelle righe.{' '}
                <strong>Cosa sa adesso, che lui non sapeva?</strong>
              </p>
              <Button
                variant="primary"
                fullWidth
                icon={<MessageCircle size={18} aria-hidden />}
                onClick={() => router.push(`/chat?prompt=${encodeURIComponent(mirrorPrompt)}`)}
              >
                Rifletti col Coach
              </Button>
            </div>
          </Card>
        )}

        {/* ── Cosa ti resta ──────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle
            size="lg"
            title="Cosa ti resta"
            subtitle="Il percorso si ferma qui (per ora). Gli strumenti no — sono tuoi."
            className="mb-4"
          />
          <div className="space-y-3">
            <Button variant="secondary" fullWidth icon={<Dumbbell size={18} aria-hidden />} onClick={() => router.push('/strumenti')}>
              Vai in Palestra — gli strumenti sono tuoi
            </Button>
            <Button variant="secondary" fullWidth icon={<IdCard size={18} aria-hidden />} onClick={() => router.push('/carta')}>
              La tua Carta del Giocatore
            </Button>
          </div>
        </Card>

        <Card>
          <SectionTitle
            size="lg"
            title="Com'è andata?"
            subtitle="Il tuo feedback ci aiuta a costruire il resto del percorso. Due righe vanno benissimo."
            className="mb-3"
          />
          <Field label="Il tuo feedback" htmlFor="beta-feedback">
            <Textarea
              id="beta-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Cosa ha funzionato? Cosa cambieresti?"
              rows={5}
            />
          </Field>
          <Button
            variant="primary"
            fullWidth
            className="mt-3"
            onClick={sendFeedback}
            disabled={!feedback.trim() || sent}
            loading={sending}
            icon={sent ? <Check size={18} aria-hidden /> : undefined}
          >
            {sent ? 'Grazie' : sending ? 'Invio…' : 'Invia feedback'}
          </Button>
        </Card>

        <Card className="space-y-3">
          <Button variant="secondary" fullWidth icon={<MessageCircle size={18} aria-hidden />} onClick={() => router.push('/chat')}>
            Parla con il Coach
          </Button>
          <Button variant="secondary" fullWidth icon={<BarChart3 size={18} aria-hidden />} onClick={() => router.push('/statistiche')}>
            Rivedi le tue statistiche
          </Button>
          <Button variant="secondary" fullWidth icon={<Map size={18} aria-hidden />} onClick={() => router.push('/settimane')}>
            Torna al percorso
          </Button>
        </Card>
      </div>
    </main>
  );
}
