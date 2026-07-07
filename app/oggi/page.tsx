'use client';

import { Suspense, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ActionsSetupSheet, { type SelectedAction } from '@/components/ActionsSetupSheet';
import EmptyState from '@/components/EmptyState';
import { Flame, Pencil, Target } from 'lucide-react';

type ApiAction = {
  id: string;
  action_text: string;
  source: 'catalog' | 'custom';
  catalog_id: string | null;
  category: string;
  principle: string | null;
  position: number;
  completed_today: boolean;
};

function todayLongIt(): string {
  return new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function OggiPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [actions, setActions] = useState<ApiAction[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);

  const reload = async (uid: string) => {
    const [aRes, hRes] = await Promise.all([
      authFetch(`/api/actions?userId=${uid}`),
      authFetch(`/api/actions/history?userId=${uid}&days=30`),
    ]);
    const aData = await aRes.json();
    const hData = await hRes.json();
    setActions(aData.actions || []);
    setTodayCount(aData.today_count || 0);
    setStreak(hData.current_streak || 0);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const uid = session.user.id;
      setUserId(uid);

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_week')
        .eq('user_id', uid)
        .single();
      setCurrentWeek(profile?.current_week || 1);

      await reload(uid);
      setLoading(false);

      // Apri il setup se richiesto via query
      if (searchParams.get('setup') === '1') {
        setShowSetup(true);
      }
    };
    init();
  }, [router, searchParams]);

  const handleToggle = async (actionId: string) => {
    if (pendingToggleId) return;
    setPendingToggleId(actionId);

    // Optimistic update
    setActions(prev =>
      prev.map(a => (a.id === actionId ? { ...a, completed_today: !a.completed_today } : a))
    );
    setTodayCount(prev => {
      const a = actions.find(x => x.id === actionId);
      if (!a) return prev;
      return a.completed_today ? prev - 1 : prev + 1;
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const a = actions.find(x => x.id === actionId);
      if (a && !a.completed_today) {
        navigator.vibrate(30);
      }
    }

    try {
      const res = await authFetch('/api/actions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, actionId }),
      });
      if (!res.ok) throw new Error('toggle failed');
      // Ricarica per coerenza con server (anche per streak)
      await reload(userId);
    } catch (err) {
      // Rollback su errore
      setActions(prev =>
        prev.map(a => (a.id === actionId ? { ...a, completed_today: !a.completed_today } : a))
      );
    } finally {
      setPendingToggleId(null);
    }
  };

  const handleSaveSetup = async (selected: SelectedAction[]) => {
    const payload = selected.map((s, idx) => ({
      action_text: s.text,
      source: s.source,
      catalog_id: s.catalog_id,
      category: s.category,
      principle: s.principle,
      position: idx + 1,
    }));
    const res = await authFetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, actions: payload }),
    });
    if (res.ok) {
      await reload(userId);
      setShowSetup(false);
      // Pulisci eventuale ?setup=1 dall'URL
      router.replace('/oggi');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-muted">Caricamento azioni…</p>
        </div>
      </main>
    );
  }

  const total = actions.length;
  const percent = total > 0 ? Math.round((todayCount / total) * 100) : 0;

  // Mappa azioni attive a SelectedAction[] per il setup sheet
  const initialSelected: SelectedAction[] = actions.map(a => ({
    key: a.catalog_id || a.id,
    text: a.action_text,
    source: a.source,
    catalog_id: a.catalog_id,
    category: a.category as any,
    principle: (a.principle as any) || null,
  }));

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Immersive header */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-16">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1 text-forest-100 hover:text-white text-sm mb-5 transition-colors"
          >
            ← Home
          </button>
          <p className="text-forest-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Oggi · {todayLongIt()}
          </p>
          <h1 className="text-2xl font-bold text-white leading-tight mb-3">
            Le tue 5 azioni
          </h1>

          {total > 0 ? (
            <>
              <div className="flex items-baseline justify-between text-forest-100 text-xs mb-1.5">
                <span className="font-medium">{todayCount}/{total} fatte oggi</span>
                <span className="font-semibold">{percent}%</span>
              </div>
              <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-forest-100 text-sm">
              Pianifica le tue 5 azioni: le stesse ogni giorno, per tutta la settimana.
            </p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-xl mx-auto px-4 -mt-10 space-y-4">

        {total === 0 ? (
          <EmptyState
            icon={<Target className="w-6 h-6" aria-hidden="true" />}
            iconBg="bg-amber-500/20"
            iconColor="text-amber-300"
            title="Comportati già oggi come il giocatore che vuoi diventare"
            subtitle="Scegli fino a 5 azioni concrete. Le tieni stesse per la settimana, le ticki ogni giorno. La consistenza vince sulla perfezione."
            cta={{ label: 'Pianifica le tue 5 azioni', onClick: () => setShowSetup(true) }}
          />
        ) : (
          <>
            <div className="bg-surface rounded-2xl shadow-sm border border-divider overflow-hidden">
              {actions.map((a, i) => {
                const checked = a.completed_today;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleToggle(a.id)}
                    disabled={pendingToggleId === a.id}
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={a.action_text}
                    className={`w-full text-left flex items-start gap-3 px-4 py-4 transition-colors min-h-[60px] ${
                      i !== actions.length - 1 ? 'border-b border-divider' : ''
                    } ${checked ? 'bg-forest-500/10' : 'hover:bg-surface-2'}`}
                  >
                    <span
                      className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checked
                          ? 'bg-forest-500 border-forest-500'
                          : 'border-divider bg-surface-2'
                      }`}
                      aria-hidden="true"
                    >
                      {checked && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    <p className={`flex-1 text-sm leading-relaxed ${checked ? 'text-muted line-through decoration-1' : 'text-app'}`}>
                      {a.action_text}
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowSetup(true)}
              className="w-full bg-surface border border-divider text-app font-semibold py-3 rounded-xl hover:bg-surface-2 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Modifica le tue 5 azioni
            </button>

            {streak > 0 && (
              <div className="bg-surface border border-orange-500/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-orange-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-app">
                    {streak} {streak === 1 ? 'giorno' : 'giorni'} di fila
                  </p>
                  <p className="text-xs text-muted">
                    Hai fatto almeno 3 azioni al giorno. Continua così.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-2" />
      </div>

      {showSetup && (
        <ActionsSetupSheet
          currentWeek={currentWeek}
          initialActions={initialSelected}
          onClose={() => {
            setShowSetup(false);
            router.replace('/oggi');
          }}
          onSave={handleSaveSetup}
        />
      )}
    </main>
  );
}

export default function OggiPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-muted">Caricamento…</p>
        </div>
      </main>
    }>
      <OggiPageInner />
    </Suspense>
  );
}
