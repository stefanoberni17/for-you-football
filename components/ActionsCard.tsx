'use client';

import Link from 'next/link';
import { Target, ChevronRight, Flame } from 'lucide-react';

interface ActionsCardProps {
  total: number;
  todayCount: number;
  streak?: number;
}

/**
 * Card compatta sulla dashboard che mostra lo stato delle "5 azioni di oggi".
 * Tre varianti:
 *   - empty (total === 0): CTA "Pianifica le tue azioni della settimana"
 *   - normal (todayCount < total): "Azioni di oggi · X/Y"
 *   - all-done (todayCount === total): celebrativa con streak
 */
export default function ActionsCard({ total, todayCount, streak }: ActionsCardProps) {
  const empty = total === 0;
  const allDone = !empty && todayCount === total;

  if (empty) {
    return (
      <Link
        href="/oggi?setup=1"
        className="block bg-amber-50 border border-amber-200 rounded-2xl shadow-sm p-4 transition-all hover:shadow-md active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-amber-600" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">Pianifica le tue azioni della settimana</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Cose concrete che fai ogni giorno
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  if (allDone) {
    return (
      <Link
        href="/oggi"
        className="block bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-2xl shadow-lg p-4 transition-all hover:shadow-xl active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Tutte e {total} fatte oggi</p>
            <p className="text-xs text-forest-100 mt-0.5 flex items-center gap-1">
              {streak && streak > 0 ? (
                <>
                  <Flame className="w-3 h-3" aria-hidden="true" /> {streak} giorni di fila
                </>
              ) : (
                'Identità in costruzione'
              )}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-white flex-shrink-0" aria-hidden="true" />
        </div>
      </Link>
    );
  }

  // Normal state
  const percent = Math.round((todayCount / total) * 100);
  return (
    <Link
      href="/oggi"
      className="block bg-white rounded-2xl shadow-sm p-4 border border-gray-100 transition-all hover:shadow-md hover:border-forest-200 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-forest-50 flex items-center justify-center flex-shrink-0">
          <Target className="w-5 h-5 text-forest-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-gray-800">Le tue azioni durante il giorno</p>
            <p className="text-xs font-semibold text-forest-600 tabular-nums">
              {todayCount}/{total}
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-forest-400 to-forest-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" aria-hidden="true" />
      </div>
    </Link>
  );
}
