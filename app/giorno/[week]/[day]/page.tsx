'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isDayUnlocked, isTimeLocked, DayProgress } from '@/lib/dayUnlockLogic';
import { GATE_DAY, WEEK_TOOLS, DAY_NAMES } from '@/lib/constants';
import PracticePopup from '@/components/PracticePopup';

export default function GiornoPage() {
  const params = useParams();
  const router = useRouter();
  const weekNumber = parseInt(params.week as string);
  const dayNumber = parseInt(params.day as string);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [giorno, setGiorno] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false); // giornata: giorno iniziato ma non completato
  const [savedResponse, setSavedResponse] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [prePraticaResponse, setPrePraticaResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [savingCheck, setSavingCheck] = useState(false);
  const [settimanaData, setSettimanaData] = useState<any>(null);

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showPracticePopup, setShowPracticePopup] = useState(false);
  const [calendarData, setCalendarData] = useState<{ trainingDays: number[]; matchDays: number[] } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const uid = session.user.id;
      setUserId(uid);

      // Controlla se il giorno e sbloccato
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

      if (!isDayUnlocked(weekNumber, dayNumber, completedDays)) {
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Se e il gate (giorno 7) → redirect alla pagina gate
      if (dayNumber === GATE_DAY) {
        router.push(`/gate/${weekNumber}`);
        return;
      }

      // Fetch contenuto giorno + calendario + settimana in parallelo
      const [giornoRes, calendarRes, settimanaRes] = await Promise.all([
        fetch(`/api/giorno?week=${weekNumber}&day=${dayNumber}&userId=${uid}`),
        fetch(`/api/calendar?userId=${uid}&week=${weekNumber}`),
        fetch(`/api/settimana?week=${weekNumber}`),
      ]);

      const data = await giornoRes.json();

      if (data.error) {
        console.error('Errore caricamento giorno:', data.error);
        router.push(`/settimana/${weekNumber}`);
        return;
      }

      // Carica calendario settimanale
      try {
        const calData = await calendarRes.json();
        if (calData.trainingDays && calData.trainingDays.length > 0) {
          setCalendarData({ trainingDays: calData.trainingDays, matchDays: calData.matchDays || [] });
        }
      } catch { /* calendario non configurato — ignora */ }

      // Carica dati settimana (per pratica pre-partita)
      try {
        const settimanaJson = await settimanaRes.json();
        setSettimanaData(settimanaJson.settimana);
      } catch { /* ignora */ }

      setGiorno(data.giorno);
      setCompleted(data.completed);
      setStarted(data.started && !data.completed); // "in corso" solo se started ma non completed
      if (data.response) {
        setSavedResponse(data.response);
        setResponse(data.response);
      }
      if (data.prePraticaResponse) {
        setPrePraticaResponse(data.prePraticaResponse);
      }

      // Mostra check del giorno precedente se non ancora risposto
      if (
        data.giorno?.haCheckPrecedente &&
        data.previousDayCheck === null &&
        !(weekNumber === 1 && dayNumber === 1)
      ) {
        setShowCheck(true);
      }

      setLoading(false);
    };

    init();
  }, [weekNumber, dayNumber, router]);

  // Costruisci array slide dinamico
  const slides: { type: string; label: string }[] = [];
  if (giorno) {
    if (giorno.apertura) slides.push({ type: 'apertura', label: 'Apertura' });
    if (giorno.domandaPrePratica) slides.push({ type: 'domanda_pre_pratica', label: 'Riflessione' });
    if (giorno.pratica) slides.push({ type: 'pratica', label: 'Pratica' });
    if (giorno.haNotaCampo && giorno.notaCampo) slides.push({ type: 'nota', label: 'Nota Campo' });
    if (giorno.domanda) slides.push({ type: 'domanda', label: 'Riflessione' });
    // Se non c'e domanda, aggiungi slide completamento
    if (!giorno.domanda) slides.push({ type: 'completa', label: 'Completa' });
  }

  // Per giornata "in corso": salta alla slide della domanda (ultima)
  const isGiornataReturning = started && !completed && giorno?.tipoPratica === 'giornata';

  const totalSlides = slides.length;
  const effectiveSlide = isGiornataReturning ? totalSlides : currentSlide;
  const currentSlideData = slides[effectiveSlide - 1];
  const isLastSlide = effectiveSlide === totalSlides;
  const hasPracticeTimer = giorno?.durataMinuti > 0;
  const weekTool = WEEK_TOOLS[weekNumber] || undefined;
  // Usa il giorno REALE della settimana (1=Lun, 7=Dom), non il dayNumber del percorso
  const jsDay = new Date().getDay();
  const todayWeekday = jsDay === 0 ? 7 : jsDay;
  const isMatchDay = calendarData?.matchDays?.includes(todayWeekday) ?? false;
  const isPreMatchDay = calendarData?.matchDays?.some(
    (matchDay: number) => (matchDay === 1 ? 7 : matchDay - 1) === todayWeekday
  ) ?? false;

  // Calcola il prossimo allenamento basato sul giorno della settimana corrente
  const getNextTrainingMessage = (): string | null => {
    if (!calendarData || calendarData.trainingDays.length === 0) return null;
    // JS: 0=Dom, 1=Lun, ..., 6=Sab → converti a 1=Lun, 7=Dom
    const jsDay = new Date().getDay();
    const today = jsDay === 0 ? 7 : jsDay;
    const sorted = [...calendarData.trainingDays].sort((a, b) => a - b);
    // Trova il prossimo giorno di allenamento (oggi incluso o successivo)
    const next = sorted.find(d => d >= today) || sorted[0];
    if (next === today) {
      return '📅 Oggi è giorno di allenamento. Prova questo in campo!';
    }
    return `📅 Il tuo prossimo allenamento è ${DAY_NAMES[next]}. Prova questo in campo!`;
  };

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
          prePraticaResponse: prePraticaResponse.trim() || null,
          reflectionQuestion: giorno.domanda || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');

      setCompleted(true);
      setShowSuccess(true);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (err: any) {
      console.error('Errore completamento:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCheck = async (value: 1 | 2 | 3) => {
    setSavingCheck(true);
    try {
      await fetch('/api/giorno', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, weekNumber, dayNumber, previousDayCheck: value }),
      });
    } catch { /* non bloccante */ }
    setShowCheck(false);
    setSavingCheck(false);
  };

  const handleContinue = () => {
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
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-gray-500">Caricamento giorno...</p>
        </div>
      </main>
    );
  }

  if (!giorno) return null;

  // Schermata successo dopo completamento
  if (showSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-forest-600 to-forest-800 flex flex-col items-center justify-center p-6 text-white animate-fadeIn">
        <div className="flex flex-col items-center animate-scaleIn">
          <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6 shadow-2xl">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">Giorno {dayNumber} completato</h1>
          <p className="text-forest-100 text-sm text-center mb-1">Settimana {weekNumber}</p>
          <p className="text-white text-sm text-center mb-8 max-w-xs">
            Ogni giorno conta. Stai costruendo qualcosa di reale.
          </p>
          <p className="text-forest-50 text-xs text-center mb-10 max-w-xs opacity-80">
            Il prossimo giorno sarà disponibile domani
          </p>
        </div>
        <button
          onClick={handleContinue}
          className="bg-white text-forest-600 font-bold py-4 px-10 rounded-2xl text-lg shadow-lg hover:bg-forest-50 transition-all"
        >
          {dayNumber + 1 === GATE_DAY
            ? 'Vai al Gate →'
            : dayNumber + 1 > GATE_DAY
            ? 'Avanti →'
            : `Vai al Giorno ${dayNumber + 1} →`}
        </button>
        <button
          onClick={() => router.push(`/settimana/${weekNumber}`)}
          className="mt-4 text-forest-50 text-sm hover:text-white transition-colors"
        >
          Torna alla settimana
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-tabbar-lg">

      {/* Immersive header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-6 pb-16">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.push(`/settimana/${weekNumber}`)}
            className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
          >
            ← Settimana {weekNumber}
          </button>
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Settimana {weekNumber} · Giorno {dayNumber}
            {giorno.durataMinuti > 0 ? ` · ${giorno.durataMinuti} min` : ''}
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {giorno.titolo?.replace(/^W\d+-G\d+ — /, '') || `Giorno ${dayNumber}`}
          </h1>
          {completed && (
            <span className="inline-block mt-2 text-xs font-semibold text-forest-100 bg-white/15 px-3 py-1 rounded-full">
              ✅ Già completato
            </span>
          )}
          {/* Progress dots inside header */}
          {totalSlides > 1 && (
            <div className="flex gap-2 mt-5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === effectiveSlide
                      ? 'w-8 bg-white'
                      : i + 1 < effectiveSlide
                      ? 'w-2 bg-white/60'
                      : 'w-2 bg-white/25'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area — pulled up over header */}
      <div className="max-w-xl mx-auto px-4 -mt-10 space-y-4">

        {/* Check giorno precedente */}
        {showCheck && giorno && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-amber-800 mb-2">🔄 Come è andata l'ultima pratica?</p>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">{giorno.testoCheck}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => saveCheck(1)}
                disabled={savingCheck}
                className="text-left bg-white border border-forest-200 text-forest-800 text-sm font-medium py-3 px-4 rounded-xl hover:bg-forest-50 transition-all disabled:opacity-50"
              >
                ✅ Bene! Andiamo avanti
              </button>
              <button
                onClick={() => {
                  saveCheck(0 as any);
                  const prompt = encodeURIComponent(
                    `Non ho capito bene la pratica di ieri: "${giorno.testoCheck}" — puoi aiutarmi a capirla meglio?`
                  );
                  router.push(`/chat?prompt=${prompt}`);
                }}
                disabled={savingCheck}
                className="text-left bg-white border border-amber-200 text-amber-800 text-sm font-medium py-3 px-4 rounded-xl hover:bg-amber-50 transition-all disabled:opacity-50"
              >
                🤖 Preferisco parlarne col Coach AI
              </button>
            </div>
          </div>
        )}

        {/* Slide content */}
        {currentSlideData?.type === 'apertura' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Apertura</h2>
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line italic">
              {giorno.apertura}
            </p>
          </div>
        )}

        {currentSlideData?.type === 'domanda_pre_pratica' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              ✏️ Prima di iniziare
            </h2>
            <p className="text-gray-600 text-base mb-3 leading-relaxed">{giorno.domandaPrePratica}</p>
            <textarea
              value={prePraticaResponse}
              onChange={(e) => setPrePraticaResponse(e.target.value)}
              disabled={completed}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all"
              rows={4}
              maxLength={1000}
              placeholder="Scrivi qui la tua risposta (opzionale)..."
            />
            {!completed && prePraticaResponse.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">{prePraticaResponse.length}/1000</p>
            )}
          </div>
        )}

        {currentSlideData?.type === 'pratica' && (
          <div className="bg-forest-50 rounded-2xl shadow-sm p-5 border border-forest-100">
            <h2 className="text-sm font-bold text-forest-700 mb-3 flex items-center gap-2">
              🎯 La Pratica
              {giorno.durataMinuti > 0 && (
                <span className="font-normal text-forest-500">({giorno.durataMinuti} min)</span>
              )}
            </h2>
            {prePraticaResponse && (
              <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm text-gray-700 italic leading-relaxed">
                <p className="text-xs font-semibold text-gray-400 not-italic mb-1">Quello che hai scritto:</p>
                {prePraticaResponse}
              </div>
            )}

            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
              {giorno.pratica}
            </p>

            {/* Perché funziona */}
            {giorno.contesto && giorno.contesto.trim() !== '' && (
              <div className="bg-green-50 border-l-4 border-green-600 rounded-r-lg px-4 py-4 mt-4">
                <h3 className="text-base font-semibold text-green-700 mb-2">
                  💡 Perché funziona
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {giorno.contesto}
                </p>
              </div>
            )}

            {/* Bottone pratica guidata */}
            {hasPracticeTimer && (
              <button
                onClick={() => setShowPracticePopup(true)}
                className={`mt-4 w-full font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 ${
                  completed
                    ? 'bg-forest-100 text-forest-700 border border-forest-300 hover:bg-forest-200'
                    : 'bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white'
                }`}
              >
                {completed
                  ? `🔄 Rifai la pratica (${giorno.durataMinuti} min)`
                  : `▶ Inizia pratica guidata (${giorno.durataMinuti} min)`}
              </button>
            )}
          </div>
        )}

        {currentSlideData?.type === 'nota' && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-forest-700 mb-1.5">⚽ Nota in campo</h3>
            <p className="text-forest-700 text-base leading-relaxed whitespace-pre-line">
              {giorno.notaCampo}
            </p>
            {getNextTrainingMessage() && (
              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-amber-700 text-xs font-medium">
                  {getNextTrainingMessage()}
                </p>
              </div>
            )}
          </div>
        )}

        {currentSlideData?.type === 'domanda' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            {isGiornataReturning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-center">
                <p className="text-sm text-amber-700">
                  ☀️ Bentornato! Com'è andata la pratica durante la giornata?
                </p>
              </div>
            )}
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              ✍️ Riflessione
            </h2>
            <p className="text-gray-600 text-base mb-3 leading-relaxed">{giorno.domanda}</p>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={completed}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all"
              rows={4}
              maxLength={1000}
              placeholder="Scrivi qui la tua risposta (opzionale)..."
            />
            {!completed && response.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">{response.length}/1000</p>
            )}
          </div>
        )}

        {currentSlideData?.type === 'completa' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Pronto a completare?</h2>
            <p className="text-sm text-gray-500">
              Hai letto l'apertura e praticato. Segna il giorno come completato.
            </p>
          </div>
        )}

        {/* Pratica pre-partita: oggi è giorno partita OPPURE domani è giorno partita */}
        {isLastSlide && isMatchDay && settimanaData?.praticaPrePartita && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-green-700 mb-2">🟢 Oggi giochi — pratica pre-partita</p>
            <p className="text-green-800 text-sm leading-relaxed whitespace-pre-line">
              {settimanaData.praticaPrePartita}
            </p>
          </div>
        )}
        {isLastSlide && !isMatchDay && isPreMatchDay && settimanaData?.praticaPrePartita && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-green-700 mb-2">🟢 Domani giochi — pratica pre-partita</p>
            <p className="text-green-800 text-sm leading-relaxed whitespace-pre-line">
              {settimanaData.praticaPrePartita}
            </p>
          </div>
        )}

        {/* Navigazione slide */}
        <div className="flex gap-3">
          {effectiveSlide > 1 && !isGiornataReturning && (
            <button
              onClick={() => setCurrentSlide(s => s - 1)}
              className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all text-sm"
            >
              ← Indietro
            </button>
          )}

          {!isLastSlide && (
            <button
              onClick={() => setCurrentSlide(s => s + 1)}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              Continua →
            </button>
          )}

          {isLastSlide && !completed && (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio...' : '✅ Segna come completato'}
            </button>
          )}

          {isLastSlide && completed && (
            <button
              onClick={handleContinue}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3 rounded-xl shadow-lg hover:from-forest-600 hover:to-forest-700 transition-all text-sm"
            >
              {dayNumber + 1 === GATE_DAY
                ? 'Vai al Gate →'
                : `Vai al Giorno ${dayNumber + 1} →`}
            </button>
          )}
        </div>

        {/* Stato gia completato */}
        {completed && (
          <div className="bg-forest-50 border border-forest-200 rounded-xl p-3 text-center">
            <p className="text-forest-700 font-semibold text-xs">✅ Giorno gia completato — puoi rileggere le slide</p>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Practice Popup */}
      {showPracticePopup && (
        <PracticePopup
          titolo={giorno.titolo || `Giorno ${dayNumber}`}
          pratica={giorno.pratica}
          durataMinuti={giorno.durataMinuti}
          weekTool={weekTool}
          durataInspira={giorno.durataInspira || undefined}
          durataEspira={giorno.durataEspira || undefined}
          tipoPratica={giorno.tipoPratica || 'respirazione'}
          onComplete={async () => {
            setShowPracticePopup(false);
            // Per tipo "giornata": segna come "started" e mostra messaggio uscita
            if (giorno.tipoPratica === 'giornata' && !started && !completed) {
              try {
                await fetch('/api/giorno', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    weekNumber,
                    dayNumber,
                    prePraticaResponse: prePraticaResponse.trim() || null,
                  }),
                });
                setStarted(true);
              } catch { /* non bloccante */ }
            }
          }}
          onSkip={() => setShowPracticePopup(false)}
        />
      )}
    </main>
  );
}
