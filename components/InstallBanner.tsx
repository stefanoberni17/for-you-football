'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Banner } from '@/components/ui';

interface InstallBannerProps {
  totalCompleted: number;
  /** Notifica il parent quando il banner è effettivamente visibile (per la
   *  policy "un banner alla volta": il push prompt aspetta). */
  onVisibilityChange?: (visible: boolean) => void;
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
// L'invito a installare arriva dopo il primo giorno completato: al primissimo
// accesso l'utente ha già check-in + Reset + Giorno 1 davanti, non serve altro.
const MIN_DAYS_COMPLETED = 1;

const STEPS: Record<Exclude<Platform, 'other'>, { title: string; steps: React.ReactNode[] }> = {
  ios: {
    title: 'iPhone / iPad',
    steps: [
      <>Apri questa pagina in <strong>Safari</strong> (non Chrome)</>,
      <>Tocca il pulsante <strong>Condividi</strong> in basso</>,
      <>Scorri e tocca <strong>&ldquo;Aggiungi alla schermata Home&rdquo;</strong></>,
      <>Conferma toccando <strong>&ldquo;Aggiungi&rdquo;</strong></>,
    ],
  },
  android: {
    title: 'Android',
    steps: [
      <>Apri questa pagina in <strong>Chrome</strong></>,
      <>Tocca i <strong>3 puntini</strong> in alto a destra</>,
      <>Tocca <strong>&ldquo;Installa app&rdquo;</strong> o <strong>&ldquo;Aggiungi a schermata Home&rdquo;</strong></>,
      <>Conferma e <strong>l&apos;app appare sulla home</strong></>,
    ],
  },
};

export default function InstallBanner({ totalCompleted, onVisibilityChange }: InstallBannerProps) {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    onVisibilityChange?.(show);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    // Non mostrare se già installata come PWA
    if (isStandalone()) return;

    // Non mostrare se non ha completato abbastanza giorni
    if (totalCompleted < MIN_DAYS_COMPLETED) return;

    // Non mostrare su desktop
    const p = detectPlatform();
    if (p === 'other') return;
    setPlatform(p);

    // Controlla se è stato rimandato di recente o nascosto per sempre
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt === 'never') return;
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      // Valore corrotto/non parsabile → tratta come dismiss permanente
      if (isNaN(dismissDate.getTime())) return;
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

  const guide = platform === 'ios' ? STEPS.ios : STEPS.android;

  // X = "Non mostrare" (per sempre); "Ricordamelo" = rimanda di qualche giorno;
  // l'accordion "come si fa" si apre dall'azione secondaria e vive nel corpo.
  return (
    <Banner
      tone="accent"
      icon={<Smartphone size={20} />}
      title="Installa l'app sul telefono"
      action={{ label: 'Ricordamelo tra qualche giorno', onClick: handleRemindLater }}
      secondary={{ label: showSteps ? 'Nascondi le istruzioni' : 'Come si fa?', onClick: () => setShowSteps(v => !v) }}
      onClose={handleNeverShow}
    >
      <p>Per un&apos;esperienza migliore e per sfruttare al massimo l&apos;app, aggiungila alla schermata Home del tuo telefono.</p>

      {showSteps && (
        <div className="bg-surface-2 rounded-card p-4 mt-3 border border-divider space-y-3">
          <p className="text-overline uppercase tracking-wider font-semibold text-forest-300">{guide.title}</p>
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="w-6 h-6 rounded-full bg-forest-500 text-white text-caption font-bold flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">{i + 1}</span>
                <p className="text-body-sm text-app">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Banner>
  );
}
