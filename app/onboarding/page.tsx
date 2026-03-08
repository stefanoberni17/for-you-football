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
    // SLIDE 1
    {
      title: "Benvenuto in Naruto Inner Path",
      subtitle: "La via del Guerriero Gentile",
      content: (
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-8xl mb-8">🍥</div>
          <p className="text-xl text-gray-700 leading-relaxed mb-6 font-medium">
            Naruto non è solo una storia da guardare.<br/>
            È un viaggio che parla di ognuno di noi.
          </p>
          <div className="bg-orange-50 rounded-xl p-6 text-left space-y-3 text-gray-700">
            <p className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">•</span>
              <span>Capire qualcosa in più di te stesso</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">•</span>
              <span>Vedere emozioni che vivi anche tu</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="text-orange-500 mt-1">•</span>
              <span>Crescere attraverso ciò che ti mette alla prova</span>
            </p>
          </div>
          <p className="text-gray-600 mt-6 italic">
            Questo percorso nasce per aiutarti a guardare Naruto<br/>
            in modo più profondo, più vero.
          </p>
        </div>
      )
    },

    // SLIDE 2
    {
      title: "Un cammino fatto di piccoli passi",
      subtitle: "",
      content: (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📺</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Episodi progressivi</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Gli episodi si sbloccano uno alla volta. Completa uno per passare al successivo. 
                  Non è una corsa. È un invito a darti tempo.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-5 border-l-4 border-orange-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📖</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Mini-riflessione + Versione estesa</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni episodio ha una breve lezione e una riflessione profonda. 
                  Guardi, osservi, riconosci ciò che senti.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-5 border-l-4 border-purple-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🗓️</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Settimane tematiche</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni 2 settimane esplori un tema fondamentale: la ferita del rifiuto, la presenza, il valore personale...
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-5 border-l-4 border-green-400">
            <div className="flex items-start gap-4">
              <span className="text-3xl">✨</span>
              <div>
                <h3 className="font-bold text-gray-800 mb-1">Pratiche semplici</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Ogni settimana ha pratiche concrete e un mantra per portare nella vita ciò che scopri.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 3
    {
      title: "Questo percorso ha un ritmo lento",
      subtitle: "E lo fa di proposito",
      content: (
        <div className="max-w-xl mx-auto text-center">
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Capire qualcosa è veloce.<br/>
            <strong>Assimilarla davvero, no.</strong>
          </p>
          
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-6 text-left">
            <p className="text-gray-700 mb-3 leading-relaxed">
              È come cucinare una torta: puoi preparare gli ingredienti in poco tempo, 
              ma <strong>la cottura ha bisogno del suo ritmo</strong>.
            </p>
            <p className="text-gray-600 text-sm italic">
              Se aumenti il calore per fare prima, la torta si brucia fuori e resta cruda dentro.
            </p>
          </div>

          <p className="text-gray-700 mb-8 font-medium">
            Qui non stiamo correndo verso un risultato.<br/>
            Stiamo costruendo basi che reggono nel tempo.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">💬</span>
              <h3 className="font-bold text-gray-800">Il tuo alleato: il Maestro AI</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Il chatbot conosce dove sei nel viaggio. Ti guida senza spoiler, 
              ti aiuta a riflettere, ti supporta nelle pratiche.
            </p>
          </div>
        </div>
      )
    },

    // SLIDE 4 - Telegram (facoltativo)
    {
      title: "Il Maestro AI anche su Telegram",
      subtitle: "Facoltativo, ma comodo",
      content: (
        <div className="max-w-xl mx-auto text-center">
          <div className="text-7xl mb-6">📱</div>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Puoi parlare con il Maestro AI direttamente su Telegram, 
            in qualsiasi momento della giornata — anche senza aprire l'app.
          </p>

          <div className="bg-blue-50 rounded-xl p-6 text-left mb-4">
            <p className="font-semibold text-gray-800 mb-4">Come collegarlo in 4 passi:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-gray-700 text-sm">Apri Telegram e cerca <strong>@getidsbot</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-gray-700 text-sm">Scrivili qualsiasi messaggio — ti risponde con il tuo ID numerico</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-gray-700 text-sm">Vai su <strong>Profilo</strong> nell'app e incolla il numero nel campo "Collega Telegram"</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                <p className="text-gray-700 text-sm">Cerca <strong>@Sensei_naruto_bot</strong> su Telegram e inizia a parlare</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-gray-500 italic">
              Puoi farlo ora o in qualsiasi momento dal tuo profilo. 
              Non è necessario per iniziare il percorso.
            </p>
          </div>
        </div>
      )
    },

    // SLIDE 5
    {
      title: "Sei pronto per iniziare?",
      subtitle: "",
      content: (
        <div className="max-w-xl mx-auto">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-8 mb-6 shadow-xl">
            <p className="text-sm text-orange-100 mb-2 uppercase tracking-wide font-semibold">Week 1-2</p>
            <h3 className="text-3xl font-bold mb-4">La ferita del rifiuto</h3>
            <p className="text-orange-50 mb-6 leading-relaxed">
              Il viaggio inizia dove fa più male: lì dove non ci siamo sentiti voluti.
            </p>
            <div className="space-y-2 text-sm bg-white/10 rounded-xl p-4">
              <p className="flex items-center gap-2">
                <span>📺</span> Episodi: 1–5
              </p>
              <p className="flex items-center gap-2">
                <span>🎯</span> Tema: Valore personale; bisogno di essere visti
              </p>
              <p className="flex items-center gap-2">
                <span>🔮</span> Mantra: "Io valgo, anche quando nessuno lo vede."
              </p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border-l-4 border-amber-400">
            <p className="text-gray-700 leading-relaxed text-sm">
              Questo percorso non ti chiede di diventare forte. 
              Ti chiede di <strong>smettere di nascondere la tua ferita</strong>.
            </p>
            <p className="text-gray-600 mt-3 text-sm italic">
              Il primo passo è sempre l'osservazione: guardare ciò che senti senza scappare.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentContent = slides[currentSlide - 1];
  const isLastSlide = currentSlide === slides.length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === currentSlide 
                  ? 'w-8 bg-orange-500' 
                  : 'w-2 bg-orange-300'
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
            <p className="text-center text-gray-500 mb-8 italic">{currentContent.subtitle}</p>
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
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-xl"
            >
              Continua →
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {completing ? (
                <>
                  <span className="animate-spin">⏳</span> Preparazione...
                </>
              ) : (
                <>🚀 Inizia il percorso</>
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