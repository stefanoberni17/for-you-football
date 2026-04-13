'use client';

import { useEffect, useState } from 'react';

interface InstallBannerProps {
  totalCompleted: number;
}

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

const DISMISS_KEY = 'install_banner_dismissed_at';
const REMIND_DAYS = 3;
const MIN_DAYS_COMPLETED = 0;

export default function InstallBanner({ totalCompleted }: InstallBannerProps) {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    // Non mostrare se già installata come PWA
    if (isStandalone()) return;

    // Non mostrare se non ha completato abbastanza giorni
    if (totalCompleted < MIN_DAYS_COMPLETED) return;

    // Non mostrare su desktop
    const p = detectPlatform();
    if (p === 'other') return;
    setPlatform(p);

    // Controlla se è stato rimandato di recente
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismiss = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < REMIND_DAYS) return;
    }

    setShow(true);
  }, [totalCompleted]);

  const handleRemindLater = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setShow(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem(DISMISS_KEY, 'never');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-forest-50 to-forest-100 rounded-2xl shadow-sm p-5 border border-forest-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl flex-shrink-0">📲</div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 text-sm">Installa l'app sul telefono</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Per un'esperienza migliore e per sfruttare al massimo l'app, aggiungila alla schermata Home del tuo telefono.
          </p>
        </div>
      </div>

      {!showSteps ? (
        <button
          onClick={() => setShowSteps(true)}
          className="w-full bg-forest-500 hover:bg-forest-600 text-white font-bold py-2.5 rounded-xl text-sm transition-all mb-2"
        >
          Come si fa? →
        </button>
      ) : (
        <div className="bg-white rounded-xl p-4 mb-3 border border-forest-100">
          {platform === 'ios' ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-forest-700 uppercase tracking-wide">iPhone / iPad</p>
              <div className="space-y-2">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-gray-700">Apri questa pagina in <strong>Safari</strong> (non Chrome)</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-gray-700">Tocca il pulsante <strong>Condividi</strong> <span className="inline-block text-base align-middle">⬆️</span> in basso</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-gray-700">Scorri e tocca <strong>"Aggiungi alla schermata Home"</strong></p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p className="text-sm text-gray-700">Conferma toccando <strong>"Aggiungi"</strong></p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-bold text-forest-700 uppercase tracking-wide">Android</p>
              <div className="space-y-2">
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <p className="text-sm text-gray-700">Apri questa pagina in <strong>Chrome</strong></p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <p className="text-sm text-gray-700">Tocca i <strong>3 puntini</strong> ⋮ in alto a destra</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <p className="text-sm text-gray-700">Tocca <strong>"Installa app"</strong> o <strong>"Aggiungi a schermata Home"</strong></p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-5 h-5 rounded-full bg-forest-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <p className="text-sm text-gray-700">Conferma e <strong>l'app appare sulla home</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleRemindLater}
          className="flex-1 text-gray-500 text-xs py-2 hover:text-gray-700 transition-colors"
        >
          Ricordamelo tra qualche giorno
        </button>
        <button
          onClick={handleNeverShow}
          className="text-gray-400 text-xs py-2 px-3 hover:text-gray-600 transition-colors"
        >
          Non mostrare
        </button>
      </div>
    </div>
  );
}
