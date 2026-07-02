'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BETA_MAX_WEEK, SPORT_FEARS, PLAYER_FEARS } from '@/lib/constants';

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

      // ── Il tuo prima e dopo: le sue parole dell'inizio percorso ───────────
      const fearOptions = SPORT_FEARS[profile.sport || 'calcio'] || PLAYER_FEARS;
      const paure = (profile.biggest_fear || '')
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
        situazioneIniziale: profile.current_situation || null,
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
      window.location.href = `mailto:foryou.innerpath@gmail.com?subject=${subject}&body=${body}`;
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
        <div className="bg-surface rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-app mb-2">
            Ce l&apos;hai fatta, {name}.
          </h1>
          <p className="text-muted leading-relaxed">
            Hai completato tutte le {BETA_MAX_WEEK} settimane disponibili.
            Hai costruito lo strumento — Presenza, Osservazione, Ascolto, Protocollo Pressione —
            e hai imparato a giocare nelle difficoltà: Accettazione, Lasciare Andare, Perdono.
          </p>
          <p className="text-muted leading-relaxed mt-3">
            L&apos;ultimo blocco — Giocare libero, il ritorno al centro — sta arrivando.
            Ti scriveremo non appena sarà disponibile.
          </p>
        </div>

        {/* ── Il tuo prima e dopo — le sue parole, non le nostre ────────────── */}
        {hasMirrorContent && (
          <div className="bg-surface rounded-3xl shadow-lg p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-app">Il tuo prima e dopo</h2>
              <p className="text-sm text-muted mt-1">
                Non te lo diciamo noi, com&apos;è andata. Te lo dicono le tue parole.
              </p>
            </div>

            {(mirror.situazioneIniziale || mirror.paure.length > 0) && (
              <div className="bg-surface-2 border border-divider rounded-2xl p-4">
                <p className="text-xs font-bold text-faint uppercase tracking-wide mb-2">
                  Da dove sei partito — all&apos;inizio del percorso
                </p>
                {mirror.situazioneIniziale && (
                  <p className="text-sm text-app italic leading-relaxed">
                    &ldquo;{mirror.situazioneIniziale}&rdquo;
                  </p>
                )}
                {mirror.paure.length > 0 && (
                  <p className="text-xs text-muted mt-2">
                    La tua paura: {mirror.paure.join(' · ')}
                  </p>
                )}
              </div>
            )}

            {mirror.gateW1 && (
              <div className="bg-surface-2 border border-divider rounded-2xl p-4">
                <p className="text-xs font-bold text-faint uppercase tracking-wide mb-2">
                  Fine Settimana 1 — scrivevi:
                </p>
                <p className="text-sm text-app italic leading-relaxed">
                  &ldquo;{mirror.gateW1}&rdquo;
                </p>
              </div>
            )}

            {mirror.gateFinal && (
              <div className="bg-forest-500/15 border border-forest-500/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-forest-300 uppercase tracking-wide mb-2">
                  Fine Settimana {BETA_MAX_WEEK} — hai scritto:
                </p>
                <p className="text-sm text-forest-100 italic leading-relaxed">
                  &ldquo;{mirror.gateFinal}&rdquo;
                </p>
              </div>
            )}

            {/* I numeri — piccoli, le parole grandi */}
            <div className="flex gap-3 text-center">
              <div className="flex-1 bg-surface-2 rounded-xl py-3">
                <p className="text-xl font-bold text-app">{mirror.giorniCompletati}</p>
                <p className="text-[11px] text-faint">giorni completati</p>
              </div>
              {mirror.mentalePrima !== null && mirror.mentaleDopo !== null && (
                <div className="flex-1 bg-surface-2 rounded-xl py-3">
                  <p className="text-xl font-bold text-app">
                    {mirror.mentalePrima} → {mirror.mentaleDopo}
                  </p>
                  <p className="text-[11px] text-faint">stato mentale, prima e ultima settimana</p>
                </div>
              )}
            </div>

            <div className="border-t border-divider pt-4">
              <p className="text-sm text-app leading-relaxed mb-3">
                Rileggi il ragazzo che ha scritto quelle righe.{' '}
                <strong>Cosa sa adesso, che lui non sapeva?</strong>
              </p>
              <button
                onClick={() => router.push(`/chat?prompt=${encodeURIComponent(mirrorPrompt)}`)}
                className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                💬 Rifletti col Coach
              </button>
            </div>
          </div>
        )}

        {/* ── Cosa ti resta ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-app mb-1">Cosa ti resta</h2>
          <p className="text-sm text-muted mb-4">
            Il percorso si ferma qui (per ora). Gli strumenti no — sono tuoi.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/strumenti')}
              className="w-full bg-surface-2 hover:bg-[#293429] text-app font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              🧰 La tua cassetta degli attrezzi
            </button>
            <button
              onClick={() => router.push('/carta')}
              className="w-full bg-surface border border-forest-500/40 text-forest-300 font-bold py-3 rounded-xl hover:bg-surface-2 transition-all text-sm flex items-center justify-center gap-2"
            >
              🎴 La tua Carta del Giocatore
            </button>
          </div>
        </div>

        <div className="bg-surface rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-app mb-2">Com&apos;è andata?</h2>
          <p className="text-sm text-muted mb-3">
            Il tuo feedback ci aiuta a costruire il resto del percorso. Due righe vanno benissimo.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Cosa ha funzionato? Cosa cambieresti?"
            rows={5}
            className="w-full rounded-xl bg-surface-2 border border-divider p-3 text-sm text-app focus:outline-none focus:border-forest-400"
          />
          <button
            onClick={sendFeedback}
            disabled={sending || !feedback.trim() || sent}
            className="mt-3 w-full bg-forest-500 hover:bg-forest-600 disabled:bg-surface-2 disabled:text-faint text-white font-bold py-3 rounded-xl transition-all"
          >
            {sent ? '✓ Grazie' : sending ? 'Invio…' : 'Invia feedback'}
          </button>
        </div>

        <div className="bg-surface rounded-3xl shadow-lg p-6 space-y-3">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-surface-2 hover:bg-[#293429] text-forest-300 font-bold py-3 rounded-xl transition-all"
          >
            💬 Parla con il Coach
          </button>
          <button
            onClick={() => router.push('/statistiche')}
            className="w-full bg-surface border border-forest-500/40 text-forest-300 font-bold py-3 rounded-xl hover:bg-surface-2 transition-all"
          >
            📊 Rivedi le tue statistiche
          </button>
          <button
            onClick={() => router.push('/settimane')}
            className="w-full bg-surface border border-divider text-app font-bold py-3 rounded-xl hover:bg-surface-2 transition-all"
          >
            🗺️ Torna al percorso
          </button>
        </div>
      </div>
    </main>
  );
}
