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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex justify-around items-center h-16 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all ${
                  isActive
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-xs mt-0.5 font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}