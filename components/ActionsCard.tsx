'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, ChevronRight, ChevronDown, Flame, Pencil } from 'lucide-react';

export type DashboardAction = {
  id: string;
  action_text: string;
  completed_today: boolean;
};

interface ActionsCardProps {
  total: number;
  todayCount: number;
  streak?: number;
  /** Lista azioni — necessaria per il rendering della checklist espandibile. */
  actions?: DashboardAction[];
  /** Handler tick/untick. Se assente, la card resta in modalità "solo navigazione" (legacy). */
  onToggle?: (actionId: string) => void;
}

const STORAGE_KEY = 'actionsCard.expanded';

/**
 * Default smart per lo stato espanso:
 * - all-done (todayCount === total) → collassato (celebrazione compatta)
 * - già iniziato (todayCount > 0) → collassato (non disturbare chi ha già tickato)
 * - mattina vuota (0 ticks, 6:00–14:00) → espanso (reminder visivo)
 * - resto → collassato
 */
function defaultExpanded(total: number, todayCount: number): boolean {
  if (total === 0) return false;
  if (todayCount === total) return false;
  if (todayCount > 0) return false;
  const hour = new Date().getHours();
  return hour >= 6 && hour < 14;
}

/**
 * Card "Le tue azioni durante il giorno" sulla dashboard.
 * Tre varianti automatiche:
 *  - empty (total === 0): CTA amber "Pianifica le tue azioni"
 *  - normal (todayCount < total): checklist espandibile + progress bar
 *  - all-done (todayCount === total): celebrativa gradient verde + streak (espandibile)
 *
 * La checklist è collassabile in-place (no salto a /oggi). Stato persistito su localStorage.
 */
export default function ActionsCard({
  total,
  todayCount,
  streak = 0,
  actions = [],
  onToggle,
}: ActionsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: leggi il default solo dopo il mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setExpanded(
        stored !== null ? stored === '1' : defaultExpanded(total, todayCount)
      );
    } catch {
      setExpanded(defaultExpanded(total, todayCount));
    }
    // L'utente non vuole che il default si ricalcoli ad ogni tick — calcolato solo al mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      /* localStorage non disponibile — ignora */
    }
  };

  // ─── Variante 1: empty (no azioni pianificate) ──────────────────────
  if (total === 0) {
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
            <p className="text-sm font-bold text-amber-800">
              Pianifica le tue azioni della settimana
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Cose concrete che fai ogni giorno
            </p>
          </div>
          <ChevronRight
            className="w-5 h-5 text-amber-600 flex-shrink-0"
            aria-hidden="true"
          />
        </div>
      </Link>
    );
  }

  const allDone = todayCount === total;
  const percent = Math.round((todayCount / total) * 100);
  const hasInteractiveList = actions.length > 0 && typeof onToggle === 'function';

  // Container: gradient verde su all-done, bianco altrimenti
  const containerCls = allDone
    ? 'bg-gradient-to-r from-forest-500 to-forest-600 text-white border-transparent shadow-lg'
    : 'bg-white border-gray-100 shadow-sm';

  return (
    <section
      aria-label="Le tue azioni durante il giorno"
      className={`rounded-2xl border overflow-hidden transition-all ${containerCls}`}
    >
      {/* HEADER — tap toggla expand */}
      <button
        type="button"
        onClick={hasInteractiveList ? toggleExpand : undefined}
        aria-expanded={hasInteractiveList ? expanded : undefined}
        aria-controls={hasInteractiveList ? 'actions-card-list' : undefined}
        disabled={!hasInteractiveList}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-transform ${
          hasInteractiveList ? 'active:scale-[0.995]' : ''
        } disabled:cursor-default`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            allDone ? 'bg-white/20' : 'bg-forest-50'
          }`}
        >
          <Target
            className={`w-5 h-5 ${allDone ? 'text-white' : 'text-forest-600'}`}
            aria-hidden="true"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`text-sm font-bold ${
                allDone ? 'text-white' : 'text-gray-800'
              }`}
            >
              {allDone ? `Tutte e ${total} fatte oggi` : 'Le tue azioni'}
            </p>
            <p
              className={`text-xs font-semibold tabular-nums ${
                allDone ? 'text-white' : 'text-forest-600'
              }`}
            >
              {todayCount}/{total}
            </p>
          </div>

          {/* Riga 2: progress bar (non all-done) o streak (all-done) */}
          {!allDone ? (
            <div className="w-full bg-gray-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-forest-400 to-forest-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          ) : (
            <p className="text-xs text-forest-100 mt-0.5 flex items-center gap-1">
              {streak > 0 ? (
                <>
                  <Flame className="w-3 h-3" aria-hidden="true" /> {streak}{' '}
                  giorni di fila
                </>
              ) : (
                'Identità in costruzione'
              )}
            </p>
          )}
        </div>

        {/* Chevron solo se c'è una lista interattiva */}
        {hasInteractiveList ? (
          <ChevronDown
            className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
              expanded ? 'rotate-180' : ''
            } ${allDone ? 'text-white' : 'text-gray-400'}`}
            aria-hidden="true"
          />
        ) : (
          <ChevronRight
            className={`w-5 h-5 flex-shrink-0 ${
              allDone ? 'text-white' : 'text-gray-300'
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* BODY — checklist espandibile (solo se abbiamo `actions` + `onToggle`) */}
      {hasInteractiveList && (
        <div
          id="actions-card-list"
          className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
            mounted && expanded ? 'max-h-[800px]' : 'max-h-0'
          }`}
          aria-hidden={!expanded}
        >
          <ul
            className={`divide-y ${
              allDone
                ? 'divide-white/15 border-t border-white/15'
                : 'divide-gray-100 border-t border-gray-100'
            }`}
          >
            {actions.map((a) => {
              const checked = a.completed_today;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        typeof navigator !== 'undefined' &&
                        'vibrate' in navigator &&
                        !checked
                      ) {
                        navigator.vibrate(30);
                      }
                      onToggle!(a.id);
                    }}
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={a.action_text}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 min-h-[52px] transition-colors ${
                      allDone ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? allDone
                            ? 'bg-white border-white'
                            : 'bg-forest-500 border-forest-500'
                          : allDone
                          ? 'border-white/50 bg-transparent'
                          : 'border-gray-300 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg
                          className={`w-4 h-4 ${
                            allDone ? 'text-forest-600' : 'text-white'
                          }`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <p
                      className={`flex-1 text-sm leading-snug ${
                        checked
                          ? allDone
                            ? 'text-white/70 line-through decoration-1'
                            : 'text-gray-400 line-through decoration-1'
                          : allDone
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                    >
                      {a.action_text}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer "Modifica" — porta a /oggi?setup=1 (riusa ActionsSetupSheet) */}
          <Link
            href="/oggi?setup=1"
            className={`flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-colors ${
              allDone
                ? 'text-white/85 hover:text-white border-t border-white/15'
                : 'text-forest-700 hover:text-forest-800 border-t border-gray-100 bg-gray-50/50'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            Modifica le 5 della settimana
          </Link>
        </div>
      )}
    </section>
  );
}
