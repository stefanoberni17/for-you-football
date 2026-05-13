'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutDashboard, MessageCircle, User } from 'lucide-react';

export default function BottomTabBar() {
  const pathname = usePathname();

  // Non mostrare tab bar su login/register/onboarding
  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding' || pathname === '/privacy') {
    return null;
  }

  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/settimane', label: 'Percorso', icon: LayoutDashboard },
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
        <div className="flex justify-around items-center h-16 gap-1 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all relative group"
              >
                <div
                  className={`flex flex-col items-center justify-center transition-all duration-200 ${
                    isActive ? 'scale-105' : 'scale-100 opacity-60 group-hover:opacity-90'
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-[#2dd17a]' : 'text-muted'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-[11px] mt-0.5 transition-colors ${
                      isActive ? 'text-[#2dd17a] font-semibold' : 'text-muted font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#2dd17a] shadow-[0_0_8px_rgba(45,209,122,0.5)]"
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
