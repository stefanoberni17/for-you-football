'use client';

import { Suspense, useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ActionsSetupSheet, { type SelectedAction } from '@/components/ActionsSetupSheet';
import type { ActionCategory, ActionPrinciple } from '@/lib/actionsCatalog';
import EmptyState from '@/components/EmptyState';
import { AppLoader, BackButton, Badge, Button, Card } from '@/components/ui';
import { Check, Flame, Pencil, Target } from 'lucide-react';

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
  const [streakThreshold, setStreakThreshold] = useState(3);
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
    if (typeof hData.threshold === 'number') setStreakThreshold(hData.threshold);
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
    } catch {
      // Rollback su errore — anche il contatore header, non solo la lista
      setActions(prev =>
        prev.map(a => (a.id === actionId ? { ...a, completed_today: !a.completed_today } : a))
      );
      setTodayCount(prev => {
        const a = actions.find(x => x.id === actionId);
        if (!a) return prev;
        return a.completed_today ? prev + 1 : prev - 1;
      });
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
    if (!res.ok) {
      // Propaga: ActionsSetupSheet mostra l'errore e lascia il foglio aperto
      throw new Error('save actions failed');
    }
    await reload(userId);
    setShowSetup(false);
    // Pulisci eventuale ?setup=1 dall'URL
    router.replace('/oggi');
  };

  if (loading) {
    return <AppLoader label="Caricamento azioni…" />;
  }

  const total = actions.length;
  const percent = total > 0 ? Math.round((todayCount / total) * 100) : 0;

  // Mappa azioni attive a SelectedAction[] per il setup sheet
  const initialSelected: SelectedAction[] = actions.map(a => ({
    key: a.catalog_id || a.id,
    text: a.action_text,
    source: a.source,
    catalog_id: a.catalog_id,
    category: a.category as ActionCategory,
    principle: (a.principle as ActionPrinciple) || null,
  }));

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">

      {/* Header immersive: data, numero grande, barra, streak */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 px-4 pt-safe-immersive pb-14">
        <div className="max-w-xl mx-auto">
          <BackButton href="/" label="Home" tone="light" className="mb-2" />
          <p className="text-forest-200 text-overline uppercase tracking-wider font-semibold mb-1.5">
            Oggi · {todayLongIt()}
          </p>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-title-1 font-bold text-white leading-tight">
              Le tue 5 azioni
            </h1>
            {streak > 0 && (
              <Badge tone="warn" icon={<Flame size={14} aria-hidden="true" />} className="mt-1 shrink-0">
                {streak} {streak === 1 ? 'giorno' : 'giorni'} di fila
              </Badge>
            )}
          </div>

          {total > 0 ? (
            <>
              <p className="mt-3 flex items-baseline gap-2 text-white">
                <span className="font-display text-display font-bold tabular-nums">{todayCount}/{total}</span>
                <span className="text-body-sm text-forest-100">fatte oggi</span>
              </p>
              <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden mt-2" role="progressbar" aria-valuenow={todayCount} aria-valuemin={0} aria-valuemax={total} aria-label="Azioni fatte oggi">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-forest-100 text-body-sm mt-2">
              Le stesse ogni giorno, per tutta la settimana. Le spunti quando le fai.
            </p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-xl mx-auto px-4 -mt-8 space-y-4">

        {total === 0 ? (
          <EmptyState
            icon={<Target className="w-6 h-6" aria-hidden="true" />}
            iconBg="bg-forest-500/15"
            iconColor="text-forest-400"
            title="Gioca già oggi come il giocatore che vuoi diventare"
            subtitle="Fino a 5 azioni concrete. Restano le stesse per tutta la settimana, le spunti ogni giorno."
            cta={{ label: 'Scegli le tue azioni', onClick: () => setShowSetup(true) }}
          />
        ) : (
          <>
            <Card padding="none" className="overflow-hidden">
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
                      {checked && <Check size={16} strokeWidth={3} className="text-white" />}
                    </span>
                    <p className={`flex-1 text-body leading-relaxed ${checked ? 'text-muted line-through decoration-1' : 'text-app'}`}>
                      {a.action_text}
                    </p>
                  </button>
                );
              })}
            </Card>

            <p className="text-caption text-muted px-1">
              Lo streak conta i giorni con almeno {streakThreshold} azioni fatte.
            </p>

            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowSetup(true)}
              icon={<Pencil size={18} aria-hidden="true" />}
            >
              Modifica le tue 5 azioni
            </Button>
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
    <Suspense fallback={<AppLoader />}>
      <OggiPageInner />
    </Suspense>
  );
}
