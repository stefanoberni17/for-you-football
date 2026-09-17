'use client';

import { useEffect, useRef, useState } from 'react';
import { clearSavedChats } from '@/components/ChatBot';
import { clearContentCache } from '@/lib/clientCache';
import { authFetch } from '@/lib/authFetch';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLAYER_LEVELS, SPORTS, SPORT_ROLES, SPORT_FEARS } from '@/lib/constants';
import { requestTelegramLinkUrl } from '@/lib/telegramLink';
import SubscriptionSection from '@/components/SubscriptionSection';
import { AppLoader, Badge, Button, Card, Chip, Field, Input, SectionTitle, Select, Textarea } from '@/components/ui';
import { Bot, Bell, LogOut, Lock, Users, Check } from 'lucide-react';

/**
 * /profilo — riordinato (review 16/9): prima Telegram e Push avevano i bottoni più
 * piccoli della pagina, le textarea che servono al Coach erano alla quarta schermata
 * e "Salva" a quattro schermate dal form.
 * Ordine: Chi sei → Il tuo percorso → Come ti raggiungo → Il tuo accesso → Esci.
 * "Salva" sticky in fondo, SOLO quando qualcosa è cambiato.
 */

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

// ── Riga "canale" (Telegram, Push): icona, stato, bottone a destra ───────────
function ChannelRow({
  icon, active, title, status, action, note,
}: { icon: React.ReactNode; active: boolean; title: string; status: React.ReactNode; action?: React.ReactNode; note?: string }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-forest-500/20 text-forest-400' : 'bg-surface-2 text-muted'}`} aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-app text-body">{title}</p>
          <p className="text-body-sm text-muted flex items-center gap-1">{status}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {note && <p className="text-caption text-muted mt-2 leading-relaxed pl-13">{note}</p>}
    </div>
  );
}

// I campi del form che finiscono in `profiles` (per capire se è cambiato qualcosa)
type FormSnapshot = {
  nome: string; eta: string; sport: string; roles: string; level: string; fears: string;
  goals: string; dream: string; currentSituation: string;
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfiloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
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

  // Valori caricati (o salvati): il form è "sporco" se si discosta da questi
  const [snapshot, setSnapshot] = useState<FormSnapshot | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleRole = (v: string) =>
    setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  const toggleFear = (v: string) =>
    setSelectedFears((prev) => prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]);

  const current: FormSnapshot = {
    nome, eta, sport, roles: selectedRoles.join(','), level, fears: selectedFears.join(','),
    goals, dream, currentSituation,
  };
  const dirty = !!snapshot && (Object.keys(current) as (keyof FormSnapshot)[]).some((k) => current[k] !== snapshot[k]);

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
        const roles: string[] = p.role ? p.role.split(',').filter(Boolean) : [];
        const fears: string[] = p.biggest_fear ? p.biggest_fear.split(',').filter(Boolean) : [];
        setNome(p.name || '');
        setEta(p.age?.toString() || '');
        setCurrentWeek(p.current_week?.toString() || '1');
        setTelegramId(p.telegram_id || '');
        setSport(p.sport || 'calcio');
        setLevel(p.level || '');
        setGoals(p.goals || '');
        setDream(p.dream || '');
        setCurrentSituation(p.current_situation || '');
        setSelectedRoles(roles);
        setSelectedFears(fears);
        setSnapshot({
          nome: p.name || '', eta: p.age?.toString() || '', sport: p.sport || 'calcio',
          roles: roles.join(','), level: p.level || '', fears: fears.join(','),
          goals: p.goals || '', dream: p.dream || '', currentSituation: p.current_situation || '',
        });
      } else {
        setSnapshot({ nome: '', eta: '', sport: 'calcio', roles: '', level: '', fears: '', goals: '', dream: '', currentSituation: '' });
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

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError('');
    setJustSaved(false);

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

      setSnapshot(current);
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2000);
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
    clearContentCache();
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

  const showSaveBar = dirty || justSaved || saving;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">

      {/* ── Header: avatar, nome, email, settimana ─────────────────────── */}
      <div className="max-w-xl mx-auto mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-e1 shrink-0" aria-hidden="true">
            <span className="text-white font-display font-bold text-title-1">
              {nome ? nome.charAt(0).toUpperCase() : '⚽'}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-title-1 font-bold text-app truncate">{nome || 'Il tuo profilo'}</h1>
            <p className="text-body-sm text-muted truncate">{email}</p>
            <Badge tone="accent" className="mt-1.5">Settimana {currentWeek}</Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-xl mx-auto space-y-5">

        {error && (
          <Card variant="danger" padding="sm"><p className="text-body-sm text-danger">{error}</p></Card>
        )}

        {/* ── (a) Chi sei ───────────────────────────────────────────────── */}
        <Card padding="md" as="section" aria-label="Chi sei" className="space-y-5">
          <SectionTitle title="Chi sei" />

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Nome" htmlFor="profilo-nome">
              <Input id="profilo-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required
                placeholder="Il tuo nome" autoComplete="given-name" />
            </Field>
            <Field label="Età" htmlFor="profilo-eta" className="w-24">
              <Input id="profilo-eta" type="number" value={eta} onChange={(e) => setEta(e.target.value)}
                placeholder="18" min="10" max="60" inputMode="numeric" />
            </Field>
          </div>

          <div>
            <p className="text-label font-semibold text-app mb-2">Che sport fai?</p>
            <ChipGroup
              options={SPORTS}
              selected={[sport]}
              onToggle={(v) => { setSport(v); setSelectedRoles([]); }}
            />
          </div>

          {(SPORT_ROLES[sport]?.length ?? 0) > 0 && (
            <div>
              <p className="text-label font-semibold text-app mb-2">
                Che ruolo hai? <span className="text-faint font-normal">(anche più di uno)</span>
              </p>
              <ChipGroup options={SPORT_ROLES[sport] || []} selected={selectedRoles} onToggle={toggleRole} />
            </div>
          )}

          <Field label="A che livello giochi?" htmlFor="profilo-livello">
            <Select id="profilo-livello" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Scegli…</option>
              {PLAYER_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
          </Field>

          <div>
            <p className="text-label font-semibold text-app mb-2">
              Cosa ti blocca in campo? <span className="text-faint font-normal">(anche più di una)</span>
            </p>
            <ChipGroup options={SPORT_FEARS[sport] || SPORT_FEARS['altro']} selected={selectedFears} onToggle={toggleFear} />
          </div>
        </Card>

        {/* ── (b) Il tuo percorso ───────────────────────────────────────── */}
        <Card padding="md" as="section" aria-label="Il tuo percorso" className="space-y-4">
          <SectionTitle title="Il tuo percorso" subtitle="Il Coach parte da qui: più è vero, più ti serve." />

          <Field label="Cosa vuoi migliorare con questo percorso?" htmlFor="profilo-goals" counter={{ value: goals.length, max: 500 }}>
            <Textarea id="profilo-goals" value={goals} onChange={(e) => setGoals(e.target.value)} rows={3}
              placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori…" maxLength={500} />
          </Field>

          <Field label="Dove vuoi arrivare?" htmlFor="profilo-dream" counter={{ value: dream.length, max: 300 }}>
            <Textarea id="profilo-dream" value={dream} onChange={(e) => setDream(e.target.value)} rows={2}
              placeholder="Es. Giocare in prima squadra, fare il salto di categoria…" maxLength={300} />
          </Field>

          <Field label="Come stai vivendo questo periodo in campo?" htmlFor="profilo-situazione" counter={{ value: currentSituation.length, max: 500 }}>
            <Textarea id="profilo-situazione" value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} rows={3}
              placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…" maxLength={500} />
          </Field>
        </Card>

        {/* ── (c) Come ti raggiungo ─────────────────────────────────────── */}
        <Card padding="md" as="section" aria-label="Come ti raggiungo" className="space-y-4">
          <SectionTitle title="Come ti raggiungo" />

          <ChannelRow
            icon={<Bot size={20} />}
            active={!!telegramId}
            title="Coach su Telegram"
            status={telegramId ? <><Check size={14} className="text-success" aria-hidden="true" /> Collegato</> : 'Non collegato'}
            action={
              <Button variant="secondary" size="sm" onClick={handleTelegramLink} loading={telegramLinkLoading}>
                {telegramId ? 'Ricollega' : 'Collega'}
              </Button>
            }
            note={telegramId ? undefined : 'Un tap: si apre Telegram e il collegamento è automatico. Poi scrivi al Coach quando vuoi.'}
          />

          {pushStatus !== 'unsupported' && pushStatus !== 'loading' && (
            <>
              <div className="border-t border-divider" />
              <ChannelRow
                icon={<Bell size={20} />}
                active={pushStatus === 'active'}
                title="Notifiche"
                status={
                  pushStatus === 'active' ? <><Check size={14} className="text-success" aria-hidden="true" /> Attive</>
                    : pushStatus === 'denied' ? 'Bloccate dal browser'
                      : 'Spente'
                }
                action={pushStatus !== 'denied' ? (
                  <Button variant="secondary" size="sm" onClick={handlePushToggle} loading={pushLoading}>
                    {pushStatus === 'active' ? 'Spegni' : 'Accendi'}
                  </Button>
                ) : undefined}
                note={pushStatus === 'denied' ? 'Le hai bloccate nelle impostazioni del browser: da lì si riaccendono.' : undefined}
              />
            </>
          )}
        </Card>

        {/* ── (d) Il tuo accesso ────────────────────────────────────────── */}
        <SubscriptionSection />

        {/* ── (e) Esci ──────────────────────────────────────────────────── */}
        <Button
          variant="danger"
          fullWidth
          onClick={handleLogout}
          icon={<LogOut size={18} aria-hidden="true" />}
        >
          Esci dall&apos;account
        </Button>

        {/* ── (f) Privacy / genitori ────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/privacy', '_blank', 'noopener,noreferrer')}
            icon={<Lock size={16} aria-hidden="true" />}
          >
            Privacy
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

        {/* ── Salva sticky: compare solo se qualcosa è cambiato ─────────── */}
        {showSaveBar && (
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 px-4 bg-app-bg/90 backdrop-blur pt-3 pb-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={saving}
              disabled={!dirty && !justSaved}
              icon={justSaved ? <Check size={20} aria-hidden="true" /> : undefined}
              aria-live="polite"
            >
              {saving ? 'Salvo…' : justSaved ? 'Salvato' : 'Salva'}
            </Button>
          </div>
        )}
      </form>
    </main>
  );
}
