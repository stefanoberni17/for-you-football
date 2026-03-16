'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, DayProgress } from '@/lib/dayUnlockLogic';
import { GATE_DAY } from '@/lib/constants';

export default function GatePage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [giorno, setGiorno] = useState<any>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
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
        .select('week_number, day_number, completed, completed_at, compressed')
        .eq('user_id', uid)
        .eq('completed', true);

      const completedDays: DayProgress[] = (progressData || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        completedAt: p.completed_at || null,
        compressed: p.compressed || false,
      }));

      if (!isDayUnlocked(weekNumber, GATE_DAY, completedDays)) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      const res = await fetch(`/api/gate?week=${weekNumber}&userId=${uid}`);
      const data = await res.json();

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
        const empty: Record<string, string> = {};
        (data.questions || []).forEach((_: string, i: number) => {
          empty[`q${i + 1}`] = '';
        });
        setAnswers(empty);
      }

      setLoading(false);
    };

    init();
  }, [weekNumber, router]);

  const allAnswered = questions.every((_, i) => (answers[`q${i + 1}`] || '').trim().length > 0);

  const handleSubmit = async () => {
    if (!allAnswered || saving) return;
    setSaving(true);

    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber, answers }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');

      setCompleted(true);
      setShowCelebration(true);
    } catch (err: any) {
      console.error('Errore gate:', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔑</div>
          <p className="text-gray-500">Caricamento Gate...</p>
        </div>
      </main>
    );
  }

  if (showCelebration) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center p-6 text-white">
        <div className="text-7xl mb-6">🏆</div>
        <h1 className="text-3xl font-bold mb-2 text-center">Settimana {weekNumber} completata!</h1>
        <p className="text-white text-center mb-2 text-sm">Hai superato il Gate</p>
        <p className="text-white text-sm text-center mb-10 max-w-xs leading-relaxed">
          Ogni settimana è un mattone. La prossima si sblocca adesso.
        </p>
        <button
          onClick={() => router.push(`/week-complete/${weekNumber}`)}
          className="bg-white text-forest-500 font-bold py-4 px-10 rounded-2xl text-lg shadow-lg hover:bg-forest-50 transition-all"
        >
          Vedi il riepilogo →
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-28">
      <div className="max-w-xl mx-auto space-y-5">

        <button
          onClick={() => router.push(`/settimana/${weekNumber}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-forest-500 transition-colors"
        >
          ← Settimana {weekNumber}
        </button>

        {/* Header Gate */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-forest-500">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold text-forest-700 bg-forest-100 px-2.5 py-1 rounded-full">
              🔑 Gate · Settimana {weekNumber}
            </span>
            {completed && (
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                ✅ Completato
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800">Chiusura settimana</h1>
          <p className="text-gray-500 text-sm mt-1">Giorno 7 — Review settimanale</p>
        </div>

        {/* Apertura */}
        {giorno?.apertura && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-gray-700 text-sm leading-relaxed italic whitespace-pre-line">
              {giorno.apertura}
            </p>
          </div>
        )}

        {/* Prima di rispondere */}
        {giorno?.pratica && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-forest-700 mb-2">🎯 Prima di rispondere</h3>
            <p className="text-forest-700 text-sm leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>
          </div>
        )}

        {/* Le 3 domande */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              ✍️ Le tre domande del Gate
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rispondi a tutte e 3 per sbloccare la settimana successiva
            </p>
          </div>

          {questions.map((q, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-gray-700 mb-2 leading-relaxed">
                {q}
              </label>
              <textarea
                value={answers[`q${i + 1}`] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [`q${i + 1}`]: e.target.value }))}
                disabled={completed}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all"
                rows={3}
                maxLength={800}
                placeholder="Scrivi qui..."
              />
            </div>
          ))}
        </div>

        {/* Bottone */}
        {!completed ? (
          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || saving}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-4 rounded-2xl text-base shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : '🔑 Completa il Gate'}
            </button>
            {!allAnswered && (
              <p className="text-xs text-gray-400 text-center">
                Rispondi a tutte e 3 le domande per continuare
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 text-center">
              <p className="text-forest-700 font-semibold text-sm">✅ Gate già completato</p>
            </div>
            <button
              onClick={() => router.push(`/week-complete/${weekNumber}`)}
              className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
            >
              Vedi riepilogo settimana →
            </button>
          </div>
        )}

        <div className="h-4" />
      </div>
    </main>
  );
}
