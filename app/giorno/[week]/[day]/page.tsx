'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, DayProgress } from '@/lib/dayUnlockLogic';
import { GATE_DAY } from '@/lib/constants';

export default function GiornoPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);
  const dayNumber = parseInt(params.day as string);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [giorno, setGiorno] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [savedResponse, setSavedResponse] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const uid = session.user.id;
      setUserId(uid);

      // Controlla se il giorno è sbloccato
      const { data: progressData } = await supabase
        .from('user_day_progress')
        .select('week_number, day_number, completed, compressed')
        .eq('user_id', uid)
        .eq('completed', true);

      const completedDays: DayProgress[] = (progressData || []).map((p: any) => ({
        weekNumber: p.week_number,
        dayNumber: p.day_number,
        completed: p.completed,
        compressed: p.compressed || false,
      }));

      if (!isDayUnlocked(weekNumber, dayNumber, completedDays)) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Se è il gate (giorno 7) → redirect alla pagina gate
      if (dayNumber === GATE_DAY) {
        router.push(`/gate/${weekNumber}`);
        return;
      }

      // Fetch contenuto giorno
      const res = await fetch(`/api/giorno?week=${weekNumber}&day=${dayNumber}&userId=${uid}`);
      const data = await res.json();

      if (data.error) {
        console.error('Errore caricamento giorno:', data.error);
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      setGiorno(data.giorno);
      setCompleted(data.completed);
      if (data.response) {
        setSavedResponse(data.response);
        setResponse(data.response);
      }

      setLoading(false);
    };

    init();
  }, [weekNumber, dayNumber, router]);

  const handleComplete = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch('/api/giorno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekNumber,
          dayNumber,
          response: response.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');

      setCompleted(true);
      setShowSuccess(true);
    } catch (err: any) {
      console.error('Errore completamento:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    // Vai al prossimo giorno (o gate se è il giorno 6)
    const nextDay = dayNumber + 1;
    if (nextDay === GATE_DAY) {
      router.push(`/gate/${weekNumber}`);
    } else if (nextDay > GATE_DAY) {
      router.push(`/settimana/${weekNumber + 1}`);
    } else {
      router.push(`/giorno/${weekNumber}/${nextDay}`);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚽</div>
          <p className="text-gray-500">Caricamento giorno...</p>
        </div>
      </main>
    );
  }

  if (!giorno) return null;

  // Schermata successo dopo completamento
  if (showSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-500 to-green-700 flex flex-col items-center justify-center p-6 text-white">
        <div className="text-7xl mb-6">🎯</div>
        <h1 className="text-3xl font-bold mb-2 text-center">Giorno {dayNumber} completato!</h1>
        <p className="text-emerald-100 text-center mb-2">Settimana {weekNumber}</p>
        <p className="text-emerald-100 text-sm text-center mb-10 max-w-xs">
          Ogni giorno conta. Stai costruendo qualcosa di reale.
        </p>
        <button
          onClick={handleContinue}
          className="bg-white text-emerald-700 font-bold py-4 px-10 rounded-2xl text-lg shadow-lg hover:bg-emerald-50 transition-all"
        >
          {dayNumber + 1 === GATE_DAY
            ? 'Vai al Gate →'
            : dayNumber + 1 > GATE_DAY
            ? 'Avanti →'
            : `Vai al Giorno ${dayNumber + 1} →`}
        </button>
        <button
          onClick={() => router.push(`/settimana/${weekNumber}`)}
          className="mt-4 text-emerald-200 text-sm hover:text-white transition-colors"
        >
          Torna alla settimana
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 py-8 px-4 pb-28">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Nav */}
        <button
          onClick={() => router.push(`/settimana/${weekNumber}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
        >
          ← Settimana {weekNumber}
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              Settimana {weekNumber} · Giorno {dayNumber}
            </span>
            {giorno.durataMinuti > 0 && (
              <span className="text-xs text-gray-400">⏱ {giorno.durataMinuti} min</span>
            )}
            {completed && (
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                ✅ Completato
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            {giorno.titolo?.replace(/^W\d-G\d — /, '') || `Giorno ${dayNumber}`}
          </h1>
        </div>

        {/* Apertura */}
        {giorno.apertura && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line italic">
              {giorno.apertura}
            </p>
          </div>
        )}

        {/* Pratica */}
        {giorno.pratica && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-sm p-5 border border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              🎯 La Pratica
              {giorno.durataMinuti > 0 && (
                <span className="font-normal text-emerald-600">({giorno.durataMinuti} min)</span>
              )}
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>
          </div>
        )}

        {/* Nota campo (contestuale) */}
        {giorno.haNotaCampo && giorno.notaCampo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-amber-800 mb-1.5">⚽ Nota in campo</h3>
            <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-line">
              {giorno.notaCampo}
            </p>
          </div>
        )}

        {/* Domanda */}
        {giorno.domanda && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              ✍️ Riflessione
            </h2>
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">{giorno.domanda}</p>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={completed}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all"
              rows={4}
              maxLength={1000}
              placeholder="Scrivi qui la tua risposta (opzionale)..."
            />
            {!completed && response.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">{response.length}/1000</p>
            )}
          </div>
        )}

        {/* Bottone */}
        {!completed ? (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 rounded-2xl text-base shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio...' : '✅ Segna come completato'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-green-700 font-semibold text-sm">✅ Giorno già completato</p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all"
            >
              {dayNumber + 1 === GATE_DAY
                ? 'Vai al Gate →'
                : `Vai al Giorno ${dayNumber + 1} →`}
            </button>
          </div>
        )}

        <div className="h-4" />
      </div>
    </main>
  );
}
