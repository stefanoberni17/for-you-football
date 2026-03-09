'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('❌ Errore update onboarding:', error);
        alert('Errore nel salvataggio. Riprova.');
        setCompleting(false);
        return;
      }

      console.log('✅ Onboarding completato!');
      router.push('/');

    } catch (error) {
      console.error('❌ Errore imprevisto:', error);
      alert('Errore imprevisto. Riprova.');
      setCompleting(false);
    }
  };

  const slides = [
    // ── SLIDE 1 ──────────────────────────────────────────────────────────────
    {
      title: 'Benvenuto in For You Football',
      subtitle: 'Allenamento mentale per calciatori',
      content: (
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-8xl mb-8">⚽</div>
          <p className="text-xl text-gray-700 leading-relaxed mb-6 font-medium">
            La mente è il tuo strumento più potente in campo.<br />
            Questo percorso ti insegna ad usarla.
          </p>
          <div className="bg-emerald-50 rounded-xl p-6 text-left space-y-3 text-gray-700">
            <p className="flex items-start gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Gestire la pressione e i momenti difficili</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Restare presente e concentrato durante la partita</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Costruire strumenti mentali concreti e allenabili</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-emerald-500 mt-1">•</span>
              <span>Diventare il calciatore che puoi essere</span>
            </p>
          </div>
          <p className="text-gray-600 mt-6 italic text-sm">
            Un percorso di 4 settimane, 7 giorni a settimana.<br />
            Bastano 5–15 minuti al giorno.
          </p>
        </div>
      ),
    },

    // ── SLIDE 2 ──────────────────────────────────────────────────────────────
    {
      title: 'Come funziona il percorso',
      subtitle: '',
      content: (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-emerald-50 rounded-xl p-5 border-l-4 border-emerald-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">7 giorni a settimana</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni settimana ha 7 giorni di allenamento mentale. I giorni si
                  sbloccano progressivamente: completa uno per passare al successivo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-5 border-l-4 border-amber-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🔑</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Il Giorno Gate (Giorno 7)</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  L&apos;ultimo giorno di ogni settimana è il <strong>Gate</strong>: una review
                  settimanale per consolidare ciò che hai imparato. È obbligatorio per
                  sbloccare la settimana successiva.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🔧</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Uno strumento mentale per settimana</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni settimana costruisci uno strumento specifico: Il Reset, L&apos;Observer,
                  Il Body Check, Il Protocollo Pressione. Strumenti da usare subito in campo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-5 border-l-4 border-green-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⏱</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Breve e concreto</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni giorno dura 5–15 minuti. Lettura, pratica guidata, riflessione.
                  Pensato per calciatori con poco tempo.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // ── SLIDE 3 ──────────────────────────────────────────────────────────────
    {
      title: 'Le 4 settimane del percorso',
      subtitle: 'Blocco 1 — Costruire lo strumento',
      content: (
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              week: 1,
              tool: 'Il Reset',
              principle: 'Presenza',
              desc: 'Impara a tornare al momento presente in 3 respiri. Il fondamentale mentale.',
              color: 'bg-emerald-500',
            },
            {
              week: 2,
              tool: "L'Observer",
              principle: 'Osservazione',
              desc: "Diventa lo spettatore dei tuoi pensieri. Osserva senza farti trascinare.",
              color: 'bg-blue-500',
            },
            {
              week: 3,
              tool: 'Il Body Check',
              principle: 'Ascolto',
              desc: 'Leggi i segnali del corpo prima che diventino blocchi. Ascolto corporeo in campo.',
              color: 'bg-violet-500',
            },
            {
              week: 4,
              tool: 'Il Protocollo Pressione',
              principle: 'Ascolto applicato',
              desc: 'Combina i 3 strumenti precedenti per reggere i momenti di massima pressione.',
              color: 'bg-orange-500',
            },
          ].map((w) => (
            <div key={w.week} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
              <div className={`${w.color} text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0`}>
                {w.week}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">
                  Settimana {w.week} — {w.tool}
                </p>
                <p className="text-xs text-gray-500 mb-1">🧭 {w.principle}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },

    // ── SLIDE 4 ──────────────────────────────────────────────────────────────
    {
      title: 'Il tuo Coach AI',
      subtitle: 'Sempre con te, in campo e fuori',
      content: (
        <div className="max-w-xl mx-auto text-center">
          <div className="text-7xl mb-6">🧠</div>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Hai accesso a un <strong>Coach AI</strong> dedicato che conosce il
            tuo percorso e può guidarti in qualsiasi momento.
          </p>

          <div className="bg-emerald-50 rounded-xl p-6 text-left mb-4 space-y-3">
            <p className="font-semibold text-gray-800 mb-2">Il Coach AI può aiutarti a:</p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-emerald-500">✓</span>
              Applicare gli strumenti mentali alle tue situazioni reali
            </p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-emerald-500">✓</span>
              Elaborare un errore o una partita difficile
            </p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-emerald-500">✓</span>
              Prepararsi mentalmente alla partita
            </p>
            <p className="flex items-center gap-3 text-sm text-gray-700">
              <span className="text-emerald-500">✓</span>
              Rispondere alle tue domande sul percorso
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-gray-500 italic">
              Puoi anche collegarlo su <strong>Telegram</strong> per parlare con il
              Coach direttamente dal tuo telefono. Trovi l&apos;opzione nel profilo.
            </p>
          </div>
        </div>
      ),
    },

    // ── SLIDE 5 ──────────────────────────────────────────────────────────────
    {
      title: 'Sei pronto a scendere in campo?',
      subtitle: '',
      content: (
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-8 mb-6 shadow-xl">
            <p className="text-sm text-emerald-100 mb-2 uppercase tracking-wide font-semibold">Settimana 1</p>
            <h3 className="text-3xl font-bold mb-4">Il Reset</h3>
            <p className="text-emerald-50 mb-6 leading-relaxed">
              Inizia dal fondamentale: tornare al presente in qualsiasi momento.
              Tre respiri. Una mente libera.
            </p>
            <div className="space-y-2 text-sm bg-white/10 rounded-xl p-4">
              <p className="flex items-center gap-2">
                <span>🗓</span> 7 giorni di pratica guidata
              </p>
              <p className="flex items-center gap-2">
                <span>🧭</span> Principio: Presenza
              </p>
              <p className="flex items-center gap-2">
                <span>🔑</span> Giorno 7: Gate settimanale
              </p>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-5 border-l-4 border-emerald-400">
            <p className="text-gray-700 leading-relaxed text-sm">
              Non è un corso teorico. È un allenamento quotidiano che porta
              risultati concreti <strong>nelle partite, negli allenamenti, nella testa</strong>.
            </p>
            <p className="text-gray-600 mt-3 text-sm italic">
              Il primo passo: 5 minuti al giorno, per 7 giorni. Inizia oggi.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentContent = slides[currentSlide - 1];
  const isLastSlide = currentSlide === slides.length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === currentSlide
                  ? 'w-8 bg-emerald-500'
                  : 'w-2 bg-emerald-200'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-6 min-h-[32rem]">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 text-center mb-2">
            {currentContent.title}
          </h1>
          {currentContent.subtitle && (
            <p className="text-center text-emerald-600 font-semibold mb-6 text-sm uppercase tracking-widest">
              {currentContent.subtitle}
            </p>
          )}
          <div className="mt-8">
            {currentContent.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {currentSlide > 1 && (
            <button
              onClick={() => setCurrentSlide(s => s - 1)}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-600 font-semibold py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              ← Indietro
            </button>
          )}

          {!isLastSlide ? (
            <button
              onClick={() => setCurrentSlide(s => s + 1)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-xl"
            >
              Continua →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {completing ? (
                <>
                  <span className="animate-spin">⏳</span> Preparazione...
                </>
              ) : (
                <>⚽ Inizia il percorso</>
              )}
            </button>
          )}
        </div>

        {/* Skip link */}
        {!isLastSlide && (
          <button
            onClick={handleComplete}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4 transition-colors"
          >
            Salta introduzione →
          </button>
        )}

      </div>
    </main>
  );
}
