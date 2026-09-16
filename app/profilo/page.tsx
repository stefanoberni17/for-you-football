'use client';

import { useEffect, useState } from 'react';
import { clearSavedChats } from '@/components/ChatBot';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLAYER_LEVELS, SPORTS, SPORT_ROLES, SPORT_FEARS } from '@/lib/constants';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import SubscriptionSection from '@/components/SubscriptionSection';
import { AppLoader, Button, Card, Chip, Field, Input, Select, Textarea } from '@/components/ui';
import { Bot, Bell, Target, Save, LogOut, Lock, Users, Check } from 'lucide-react';

// ── Chip multi-select riusabile (anche single-select: sport) ─────────────────
function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: string; label: string; icon?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Chip
          key={opt.value}
          selected={selected.includes(opt.value)}
          onClick={() => onToggle(opt.value)}
          icon={opt.icon ? <span aria-hidden="true">{opt.icon}</span> : undefined}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}

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

  // Telegram deep-link
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);

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

  // Quando l'utente torna dall'app Telegram dopo il deep-link, ricarica lo
  // stato del collegamento (il bot ha scritto telegram_id mentre era via)
  useEffect(() => {
    if (!userId) return;
    const refresh = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data } = await supabase
        .from('profiles')
        .select('telegram_id')
        .eq('user_id', userId)
        .single();
      setTelegramId(data?.telegram_id || '');
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [userId]);

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
          // telegram_id NON è incluso: lo scrive solo il bot via deep-link.
          // Includerlo qui sovrascriverebbe un collegamento appena fatto su
          // Telegram con il valore stantio caricato al mount della pagina.
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore');
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

      await authFetch('/api/push/subscribe', {
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
    clearSavedChats(); // la chat col Coach resta sul dispositivo solo finché si è loggati
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/login');
    else setError('Errore durante il logout');
  };

  /**
   * Deep-link Telegram: genera un codice usa-e-getta e apre la chat col bot.
   * Il bot riceve /start <codice> e salva da solo il telegram_id reale.
   */
  const handleTelegramLink = async () => {
    setTelegramLinkLoading(true);
    setError('');
    try {
      const url = await requestTelegramLinkUrl();
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore');
      setTelegramLinkLoading(false);
    }
  };

  if (loading) {
    return <AppLoader />;
  }

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">

      {/* Header */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-e1">
            <span className="text-white font-display font-bold text-title-2">
              {nome ? nome.charAt(0).toUpperCase() : '⚽'}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-title-1 font-bold text-app">Il tuo Profilo</h1>
            <p className="text-body-sm text-muted truncate">{email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-xl mx-auto space-y-5">

        {error && (
          <Card variant="danger" padding="sm"><p className="text-body-sm text-danger">{error}</p></Card>
        )}

        {/* ── Coach Telegram (IN ALTO) ──────────────────────────────────────── */}
        <Card padding="md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${telegramId ? 'bg-forest-500/20 text-forest-400' : 'bg-info/15 text-info'}`} aria-hidden="true">
                <Bot size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-app text-body">Coach su Telegram</p>
                <p className="text-body-sm text-muted flex items-center gap-1">
                  {telegramId ? <><Check size={14} className="text-success" aria-hidden="true" /> Collegato</> : 'Non ancora collegato'}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTelegramLink}
              loading={telegramLinkLoading}
            >
              {telegramId ? 'Ricollega' : 'Collega'}
            </Button>
          </div>
          {!telegramId && (
            <p className="text-body-sm text-muted mt-3 leading-relaxed">
              Un tap: si apre Telegram e il collegamento è automatico. Poi puoi scrivere al Coach ovunque, in qualsiasi momento.
            </p>
          )}
        </Card>

        {/* ── Notifiche Push ─────────────────────────────────────────────── */}
        {pushStatus !== 'unsupported' && pushStatus !== 'loading' && (
          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${pushStatus === 'active' ? 'bg-forest-500/20 text-forest-400' : 'bg-surface-2 text-muted'}`} aria-hidden="true">
                  <Bell size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-app text-body">Notifiche push</p>
                  <p className="text-body-sm text-muted">
                    {pushStatus === 'active' && 'Attive — ricevi messaggi dal Coach'}
                    {pushStatus === 'inactive' && 'Non attive'}
                    {pushStatus === 'denied' && 'Bloccate dal browser'}
                  </p>
                </div>
              </div>
              {pushStatus !== 'denied' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePushToggle}
                  loading={pushLoading}
                >
                  {pushStatus === 'active' ? 'Disattiva' : 'Attiva'}
                </Button>
              )}
            </div>
            {pushStatus === 'denied' && (
              <p className="text-body-sm text-muted mt-3 leading-relaxed">
                Hai bloccato le notifiche nelle impostazioni del browser. Per riattivarle, vai nelle impostazioni del sito.
              </p>
            )}
          </Card>
        )}

        {/* ── Settimana corrente ───────────────────────────────────────────── */}
        <Card variant="accent" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-500/20 text-forest-400 flex items-center justify-center flex-shrink-0" aria-hidden="true">
              <Target size={20} />
            </div>
            <div>
              <p className="font-display text-title-3 font-bold text-app">Settimana {currentWeek}</p>
              <p className="text-body-sm text-muted">Si aggiorna automaticamente completando i giorni</p>
            </div>
          </div>
        </Card>

        {/* ── Abbonamento ──────────────────────────────────────────────────── */}
        <SubscriptionSection />

        {/* ── Dati personali ───────────────────────────────────────────────── */}
        <Card padding="md" className="space-y-4">
          <h3 className="font-display text-title-3 font-bold text-app">Dati personali</h3>

          <Field label="Nome" htmlFor="profilo-nome">
            <Input id="profilo-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
              placeholder="Il tuo nome" autoComplete="given-name" />
          </Field>

          <Field label="Età" htmlFor="profilo-eta" optional>
            <Input id="profilo-eta" type="number" value={eta} onChange={(e) => setEta(e.target.value)}
              placeholder="Es. 18" min="10" max="60" inputMode="numeric" />
          </Field>
        </Card>

        {/* ── Profilo calciatore ───────────────────────────────────────────── */}
        <Card padding="md" className="space-y-5">
          <h3 className="font-display text-title-3 font-bold text-app">Il tuo profilo da atleta</h3>

          {/* Sport */}
          <div>
            <p className="text-label font-semibold text-app mb-2">Che sport pratichi?</p>
            <ChipGroup
              options={SPORTS}
              selected={[sport]}
              onToggle={(v) => { setSport(v); setSelectedRoles([]); }}
            />
          </div>

          {/* Ruoli (dinamici per sport) */}
          {(SPORT_ROLES[sport]?.length ?? 0) > 0 && (
          <div>
            <p className="text-label font-semibold text-app mb-2">
              Che ruolo hai? <span className="text-faint font-normal">(anche più di uno)</span>
            </p>
            <ChipGroup options={SPORT_ROLES[sport] || []} selected={selectedRoles} onToggle={toggleRole} />
          </div>
          )}

          {/* Livello */}
          <Field label="A che livello giochi?" htmlFor="profilo-livello">
            <Select id="profilo-livello" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Seleziona…</option>
              {PLAYER_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
          </Field>

          {/* Paure */}
          <div>
            <p className="text-label font-semibold text-app mb-1">
              Cosa ti blocca mentalmente in campo?
            </p>
            <p className="text-caption text-muted mb-2">Puoi selezionarne più di una</p>
            <ChipGroup options={SPORT_FEARS[sport] || SPORT_FEARS['altro']} selected={selectedFears} onToggle={toggleFear} />
          </div>
        </Card>

        {/* ── Percorso ────────────────────────────────────────────────────── */}
        <Card padding="md" className="space-y-4">
          <h3 className="font-display text-title-3 font-bold text-app">Il tuo percorso</h3>

          <Field label="Cosa vuoi migliorare con questo percorso?" htmlFor="profilo-goals" counter={{ value: goals.length, max: 500 }}>
            <Textarea id="profilo-goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={3}
              placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori…" maxLength={500} />
          </Field>

          <Field label="Dove vuoi arrivare nel tuo sport?" htmlFor="profilo-dream" counter={{ value: dream.length, max: 300 }}>
            <Input id="profilo-dream" type="text" value={dream} onChange={(e) => setDream(e.target.value)}
              placeholder="Es. Giocare in prima squadra, fare il salto di categoria…" maxLength={300} />
          </Field>

          <Field label="Come stai vivendo questo periodo in campo e nel tuo sport?" htmlFor="profilo-situazione" counter={{ value: currentSituation.length, max: 500 }}>
            <Textarea id="profilo-situazione" value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} rows={2}
              placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…" maxLength={500} />
          </Field>
        </Card>

        {/* ── Salva ───────────────────────────────────────────────────────── */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          icon={success ? <Check size={20} aria-hidden="true" /> : <Save size={20} aria-hidden="true" />}
        >
          {saving ? 'Salvataggio…' : success ? 'Salvato!' : 'Salva modifiche'}
        </Button>

        {/* Logout + Privacy */}
        <Button
          variant="danger"
          fullWidth
          onClick={handleLogout}
          icon={<LogOut size={18} aria-hidden="true" />}
        >
          Esci dall&apos;account
        </Button>

        <div className="pb-4 flex flex-wrap justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/privacy', '_blank', 'noopener,noreferrer')}
            icon={<Lock size={16} aria-hidden="true" />}
          >
            Privacy Policy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/genitori', '_blank', 'noopener,noreferrer')}
            icon={<Users size={16} aria-hidden="true" />}
          >
            Per i genitori
          </Button>
        </div>
      </form>
    </main>
  );
}
