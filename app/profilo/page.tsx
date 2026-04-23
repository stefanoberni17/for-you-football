'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLAYER_LEVELS, SPORTS, SPORT_ROLES, SPORT_FEARS } from '@/lib/constants';
import SubscriptionSection from '@/components/SubscriptionSection';

// ── Chip multi-select riusabile ───────────────────────────────────────────────
function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
              active
                ? 'bg-forest-500 text-white border-forest-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300 hover:text-forest-700'
            }`}
          >
            {active ? '✓ ' : ''}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Passi guida Telegram ──────────────────────────────────────────────────────
const TELEGRAM_STEPS = [
  {
    emoji: '📱',
    title: 'Apri Telegram',
    description: 'Cerca il bot che ti dà il tuo ID:',
    bot: '@userinfobot',
    detail: 'Aprilo e premi Start (o scrivi qualcosa).',
    link: 'https://t.me/userinfobot',
    linkLabel: 'Apri @userinfobot →',
  },
  {
    emoji: '⌨️',
    title: 'Scrivi /start',
    description: 'Manda questo comando al bot:',
    bot: '/start',
    detail: 'Il bot risponderà con il tuo ID numerico.',
    link: null,
    linkLabel: null,
  },
  {
    emoji: '📋',
    title: 'Incolla il tuo ID',
    description: 'Copia il numero che ti ha risposto il bot e incollalo qui:',
    bot: null,
    detail: 'È un numero tipo: 766672351',
    link: null,
    linkLabel: null,
    hasInput: true,
  },
  {
    emoji: '🤖',
    title: 'Ora sei pronto!',
    description: 'Cerca il tuo Coach su Telegram:',
    bot: '@foryoufootballcoach_bot',
    detail: 'Scrivili qualcosa per iniziare il tuo allenamento mentale.',
    link: 'https://t.me/foryoufootballcoach_bot',
    linkLabel: 'Apri il Coach →',
  },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfiloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [eta, setEta] = useState('');
  const [currentWeek, setCurrentWeek] = useState('1');
  const [telegramId, setTelegramId] = useState('');

  // Telegram modal
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramStep, setTelegramStep] = useState(0);
  const [savingTelegram, setSavingTelegram] = useState(false);

  // Push notifications
  const [pushStatus, setPushStatus] = useState<'loading' | 'unsupported' | 'denied' | 'active' | 'inactive'>('loading');
  const [pushLoading, setPushLoading] = useState(false);

  // Profilo atleta
  const [sport, setSport] = useState('calcio');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [selectedFears, setSelectedFears] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [dream, setDream] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');

  const toggleRole = (v: string) =>
    setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  const toggleFear = (v: string) =>
    setSelectedFears((prev) => prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (p) {
        setNome(p.name || '');
        setEta(p.age?.toString() || '');
        setCurrentWeek(p.current_week?.toString() || '1');
        setTelegramId(p.telegram_id || '');
        setSport(p.sport || 'calcio');
        setLevel(p.level || '');
        setGoals(p.goals || '');
        setDream(p.dream || '');
        setCurrentSituation(p.current_situation || '');
        setSelectedRoles(p.role ? p.role.split(',').filter(Boolean) : []);
        setSelectedFears(p.biggest_fear ? p.biggest_fear.split(',').filter(Boolean) : []);
      }

      // Check push notification status
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        if (Notification.permission === 'denied') {
          setPushStatus('denied');
        } else if (Notification.permission === 'granted') {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            setPushStatus(sub ? 'active' : 'inactive');
          } catch {
            setPushStatus('inactive');
          }
        } else {
          setPushStatus('inactive');
        }
      } else {
        setPushStatus('unsupported');
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: nome.trim(),
          age: eta ? parseInt(eta) : null,
          sport: sport || 'calcio',
          role: selectedRoles.length ? selectedRoles.join(',') : null,
          level: level || null,
          biggest_fear: selectedFears.length ? selectedFears.join(',') : null,
          goals: goals.trim() || null,
          dream: dream.trim() || null,
          current_situation: currentSituation.trim() || null,
          telegram_id: telegramId.trim() || null,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async () => {
    if (pushStatus === 'active') {
      // Unsubscribe
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
        setPushStatus('inactive');
      } catch {
        // ignore
      }
      return;
    }

    // Subscribe
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus(permission === 'denied' ? 'denied' : 'inactive');
        setPushLoading(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });

      setPushStatus('active');
    } catch (err) {
      console.error('Push subscription failed:', err);
    } finally {
      setPushLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/login');
    else setError('Errore durante il logout');
  };

  const handleSaveTelegram = async () => {
    if (!telegramId.trim()) return;
    setSavingTelegram(true);
    await supabase
      .from('profiles')
      .update({ telegram_id: telegramId.trim() })
      .eq('user_id', userId);
    setSavingTelegram(false);
    setTelegramStep(3);
  };

  const openTelegramModal = () => {
    setTelegramStep(0);
    setShowTelegramModal(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-xl text-gray-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  const currentStep = TELEGRAM_STEPS[telegramStep];
  const isLastStep = telegramStep === TELEGRAM_STEPS.length - 1;
  const isInputStep = telegramStep === 2;

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-tabbar-lg">

      {/* ── Telegram Modal ─────────────────────────────────────────────────── */}
      {showTelegramModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTelegramModal(false); }}
        >
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl">

            {/* Step dots */}
            <div className="flex justify-center items-center gap-1.5 pt-5 pb-1">
              {TELEGRAM_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === telegramStep ? 'bg-forest-500 w-6' : i < telegramStep ? 'bg-forest-300 w-1.5' : 'bg-gray-200 w-1.5'
                  }`}
                />
              ))}
            </div>

            {/* Slide content */}
            <div className="px-7 py-5 text-center min-h-[240px] flex flex-col items-center justify-center gap-3">
              <div className="text-5xl">{currentStep.emoji}</div>
              <h3 className="text-xl font-bold text-gray-800">{currentStep.title}</h3>
              <p className="text-sm text-gray-500">{currentStep.description}</p>

              {currentStep.bot && (
                <div className="bg-gray-100 rounded-xl px-5 py-3 w-full">
                  <p className="text-lg font-bold text-gray-800 font-mono tracking-wide">{currentStep.bot}</p>
                </div>
              )}

              {isInputStep && (
                <input
                  type="text"
                  inputMode="numeric"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Es. 766672351"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm text-center text-lg font-mono"
                  autoFocus
                />
              )}

              <p className="text-xs text-gray-400">{currentStep.detail}</p>

              {currentStep.link && (
                <a
                  href={currentStep.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest-600 text-sm font-semibold hover:underline"
                >
                  {currentStep.linkLabel}
                </a>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6 flex gap-3">
              {telegramStep > 0 && (
                <button
                  type="button"
                  onClick={() => setTelegramStep((s) => s - 1)}
                  className="flex-none py-3 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  ←
                </button>
              )}

              {isLastStep ? (
                <button
                  type="button"
                  onClick={() => setShowTelegramModal(false)}
                  className="flex-1 py-3 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-sm font-bold transition-all"
                >
                  ✓ Fatto!
                </button>
              ) : isInputStep ? (
                <button
                  type="button"
                  onClick={handleSaveTelegram}
                  disabled={!telegramId.trim() || savingTelegram}
                  className="flex-1 py-3 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {savingTelegram ? 'Salvataggio…' : 'Salva e continua →'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTelegramStep((s) => s + 1)}
                  className="flex-1 py-3 rounded-xl bg-forest-500 hover:bg-forest-600 text-white text-sm font-bold transition-all"
                >
                  Avanti →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-xl">
              {nome ? nome.charAt(0).toUpperCase() : '⚽'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Il tuo Profilo</h1>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-xl mx-auto space-y-5">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* ── Coach Telegram (IN ALTO) ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${telegramId ? 'bg-forest-100' : 'bg-blue-50'}`}>
                🤖
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">Coach su Telegram</p>
                <p className="text-xs text-gray-500">
                  {telegramId ? `Collegato · ID ${telegramId}` : 'Non ancora collegato'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openTelegramModal}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                telegramId
                  ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  : 'text-white bg-forest-500 hover:bg-forest-600 shadow-sm'
              }`}
            >
              {telegramId ? 'Modifica' : 'Collega'}
            </button>
          </div>
          {!telegramId && (
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Chatta con il tuo Coach AI direttamente su Telegram — ovunque, in qualsiasi momento.
            </p>
          )}
        </div>

        {/* ── Notifiche Push ─────────────────────────────────────────────── */}
        {pushStatus !== 'unsupported' && pushStatus !== 'loading' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${pushStatus === 'active' ? 'bg-forest-100' : 'bg-gray-100'}`}>
                  🔔
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Notifiche push</p>
                  <p className="text-xs text-gray-500">
                    {pushStatus === 'active' && 'Attive — ricevi messaggi dal Coach'}
                    {pushStatus === 'inactive' && 'Non attive'}
                    {pushStatus === 'denied' && 'Bloccate dal browser'}
                  </p>
                </div>
              </div>
              {pushStatus !== 'denied' && (
                <button
                  type="button"
                  onClick={handlePushToggle}
                  disabled={pushLoading}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-40 ${
                    pushStatus === 'active'
                      ? 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                      : 'text-white bg-forest-500 hover:bg-forest-600 shadow-sm'
                  }`}
                >
                  {pushLoading ? '...' : pushStatus === 'active' ? 'Disattiva' : 'Attiva'}
                </button>
              )}
            </div>
            {pushStatus === 'denied' && (
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Hai bloccato le notifiche nelle impostazioni del browser. Per riattivarle, vai nelle impostazioni del sito.
              </p>
            )}
          </div>
        )}

        {/* ── Settimana corrente ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-forest-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-gray-800">Settimana {currentWeek}</p>
              <p className="text-xs text-gray-500">Si aggiorna automaticamente completando i giorni</p>
            </div>
          </div>
        </div>

        {/* ── Abbonamento ──────────────────────────────────────────────────── */}
        <SubscriptionSection />

        {/* ── Dati personali ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Dati personali</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm"
              placeholder="Il tuo nome" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Età</label>
            <input type="number" value={eta} onChange={(e) => setEta(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm"
              placeholder="Es. 18" min="10" max="60" />
          </div>
        </div>

        {/* ── Profilo calciatore ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Il tuo profilo da atleta</h3>

          {/* Sport */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Che sport pratichi?</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setSport(s.value); setSelectedRoles([]); }}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                    sport === s.value
                      ? 'bg-forest-500 text-white border-forest-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-forest-300 hover:text-forest-700'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ruoli (dinamici per sport) */}
          {(SPORT_ROLES[sport]?.length ?? 0) > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Che ruolo hai? <span className="text-gray-400 font-normal">(anche più di uno)</span>
            </label>
            <ChipGroup options={SPORT_ROLES[sport] || []} selected={selectedRoles} onToggle={toggleRole} />
          </div>
          )}

          {/* Livello */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">A che livello giochi?</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm bg-white">
              <option value="">Seleziona…</option>
              {PLAYER_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Paure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cosa ti blocca mentalmente in campo?
            </label>
            <p className="text-xs text-gray-400 mb-2">Puoi selezionarne più di una</p>
            <ChipGroup options={SPORT_FEARS[sport] || SPORT_FEARS['altro']} selected={selectedFears} onToggle={toggleFear} />
          </div>
        </div>

        {/* ── Percorso ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Il tuo percorso</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Cosa vuoi migliorare con questo percorso?
            </label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori…" maxLength={500} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dove vuoi arrivare nel tuo sport?</label>
            <input type="text" value={dream} onChange={(e) => setDream(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm"
              placeholder="Es. Giocare in prima squadra, fare il salto di categoria…" maxLength={300} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Come stai vivendo questo periodo in campo e nel tuo sport?
            </label>
            <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…" maxLength={500} />
          </div>
        </div>

        {/* ── Salva ───────────────────────────────────────────────────────── */}
        <button type="submit" disabled={saving}
          className={`w-full font-bold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-sm ${
            success ? 'bg-forest-500' : 'bg-forest-500 hover:bg-forest-600'
          }`}>
          {saving ? 'Salvataggio…' : success ? '✅ Salvato!' : '💾 Salva modifiche'}
        </button>

        {/* Logout + Privacy */}
        <button type="button" onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100">
          <span>🚪</span><span>Esci dall&apos;account</span>
        </button>

        <div className="text-center pb-4">
          <a href="/privacy" target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-500 underline">
            🔒 Privacy Policy
          </a>
        </div>
      </form>
    </main>
  );
}
