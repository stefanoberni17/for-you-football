'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, LayoutDashboard, Dumbbell, MessageCircle, User } from 'lucide-react';
import { EVENTO as EVENTO_RESOCONTI, leggiPendenti } from '@/lib/resocontoPendente';

export default function BottomTabBar() {
  const pathname = usePathname();
  // Pallino su "Palestra" con un resoconto squadra/partita da dare (20/10): letto dal dispositivo, nessuna richiesta
  const [pendente, setPendente] = useState(false);
  useEffect(() => {
    const aggiorna = () => setPendente(leggiPendenti().length > 0);
    aggiorna();
    window.addEventListener(EVENTO_RESOCONTI, aggiorna);
    window.addEventListener('storage', aggiorna);
    return () => { window.removeEventListener(EVENTO_RESOCONTI, aggiorna); window.removeEventListener('storage', aggiorna); };
  }, [pathname]);

  // Non mostrare tab bar su login/register/onboarding
  if (
    pathname === '/login' ||
    pathname === '/completa-profilo' ||
    pathname.startsWith('/auth/') ||
    pathname === '/register' ||
    pathname === '/reset-password' ||
    pathname === '/onboarding' ||
    pathname === '/privacy' ||
    pathname === '/termini' ||
    pathname === '/genitori' ||
    pathname === '/pricing' ||
    pathname === '/riattiva'
  ) {
    return null;
  }

  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/settimane', label: 'Percorso', icon: LayoutDashboard },
    { href: '/strumenti', label: 'Palestra', icon: Dumbbell },
    { href: '/chat', label: 'Coach', icon: MessageCircle },
    { href: '/profilo', label: 'Profilo', icon: User },
  ];

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-t border-divider shadow-[0_-2px_12px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-stretch h-16 gap-1 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // /sos, /carta e /allenamento/* fanno parte della Palestra (Testa | Fisico): tab accesa anche lì
            const isActive =
              pathname === tab.href ||
              (tab.href === '/strumenti' && (pathname === '/sos' || pathname === '/carta' || pathname.startsWith('/allenamento')));
            const conPallino = tab.href === '/strumenti' && pendente;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-btn transition-colors relative ${
                  isActive ? 'text-accent-glow' : 'text-muted hover:text-app'
                }`}
              >
                <span className="relative">
                  <Icon
                    aria-hidden="true"
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {conPallino && (
                    <span aria-label="Hai un resoconto da dare" className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-accent-glow shadow-glow ring-2 ring-surface" />
                  )}
                </span>
                <span className={`text-overline mt-0.5 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-accent-glow shadow-glow"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
