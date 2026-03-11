'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLAYER_ROLES, PLAYER_LEVELS, PLAYER_FEARS } from '@/lib/constants';

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

  // Profilo calciatore
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
        setLevel(p.level || '');
        setGoals(p.goals || '');
        setDream(p.dream || '');
        setCurrentSituation(p.current_situation || '');
        // Multi-select: stored as comma-separated string
        setSelectedRoles(p.role ? p.role.split(',').filter(Boolean) : []);
        setSelectedFears(p.biggest_fear ? p.biggest_fear.split(',').filter(Boolean) : []);
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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/login');
    else setError('Errore durante il logout');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚽</div>
          <p className="text-xl text-gray-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-forest-50 py-8 px-4 pb-28">

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
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Il tuo profilo da calciatore</h3>

          {/* Ruoli */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dove giochi? <span className="text-gray-400 font-normal">(anche più di uno)</span>
            </label>
            <ChipGroup options={PLAYER_ROLES} selected={selectedRoles} onToggle={toggleRole} />
          </div>

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
            <ChipGroup options={PLAYER_FEARS} selected={selectedFears} onToggle={toggleFear} />
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dove vuoi arrivare col calcio?</label>
            <input type="text" value={dream} onChange={(e) => setDream(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm"
              placeholder="Es. Giocare in prima squadra, fare il salto di categoria…" maxLength={300} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Come stai vivendo questo periodo nel calcio?
            </label>
            <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm resize-none"
              placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…" maxLength={500} />
          </div>
        </div>

        {/* ── Telegram ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">🤖 Collega Telegram</h3>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">Come trovare il tuo ID Telegram:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
              <li>Apri Telegram e cerca <strong>@getidsbot</strong></li>
              <li>Scrivili qualsiasi messaggio</li>
              <li>Copia il numero che ti risponde e incollalo qui sotto</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Il tuo ID Telegram</label>
            <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} autoComplete="off"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm"
              placeholder="Es. 766672351" />
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
