'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, Dumbbell, MessageCircle, User } from 'lucide-react';

export default function BottomTabBar() {
  const pathname = usePathname();

  // Non mostrare tab bar su login/register/onboarding
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/reset-password' ||
    pathname === '/onboarding' ||
    pathname === '/privacy' ||
    pathname === '/termini' ||
    pathname === '/genitori' ||
    pathname === '/pricing'
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
            // /sos e /allenamento/* fanno parte dell'hub Strumenti: tab accesa anche lì
            const isActive =
              pathname === tab.href ||
              (tab.href === '/strumenti' && (pathname === '/sos' || pathname.startsWith('/allenamento')));

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
                <Icon
                  aria-hidden="true"
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
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
