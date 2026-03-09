'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [eta, setEta] = useState('');

  // Step 2 — profilo calciatore
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [selectedFears, setSelectedFears] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [dream, setDream] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleRole = (v: string) =>
    setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  const toggleFear = (v: string) =>
    setSelectedFears((prev) => prev.includes(v) ? prev.filter((f) => f !== v) : [...prev, v]);

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Le password non coincidono'); return; }
    if (password.length < 8) { setError('La password deve essere di almeno 8 caratteri'); return; }
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit finale ─────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tutto server-side: signUp + profilo in un'unica chiamata admin
      // Evita problemi di RLS (no sessione) e FK timing (utente non ancora visibile)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: nome.trim(),
          age: eta || null,
          role: selectedRoles.length ? selectedRoles.join(',') : null,
          level: level || null,
          biggest_fear: selectedFears.length ? selectedFears.join(',') : null,
          goals: goals.trim() || null,
          dream: dream.trim() || null,
          current_situation: currentSituation.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Errore nella registrazione');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Schermata successo ────────────────────────────────────────────────────
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Controlla la tua email!</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            Abbiamo inviato un link di conferma a{' '}
            <strong className="text-gray-800">{email}</strong>.
            <br />
            Clicca il link per attivare il tuo account, poi torna qui ad accedere.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-amber-800 text-xs font-semibold mb-0.5">📁 Non trovi l&apos;email?</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Controlla <strong>Spam</strong> o <strong>Posta indesiderata</strong>.
              Se non arriva, riprova con un&apos;altra email.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
          >
            Vai al Login ⚽
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 py-10 px-5">
      <div className="w-full max-w-sm mx-auto">

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-xl font-bold text-gray-800">For You Football</h1>
          <p className="text-emerald-600 font-semibold text-xs mt-0.5 uppercase tracking-widest">
            Allenamento mentale per calciatori
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${step >= 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs font-medium truncate ${step === 1 ? 'text-gray-800' : 'text-gray-400'}`}>Il tuo account</span>
          </div>
          <div className={`h-0.5 w-8 shrink-0 rounded-full transition-all ${step > 1 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${step >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
              2
            </div>
            <span className={`text-xs font-medium truncate ${step === 2 ? 'text-gray-800' : 'text-gray-400'}`}>Il tuo profilo</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-7">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">{error}</div>
          )}

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Crea il tuo account</h2>
                <p className="text-gray-500 text-sm mt-0.5">Meno di un minuto.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="tua@email.com" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Minimo 8 caratteri" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Conferma password *</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Ripeti la password" required />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Come ti chiami? *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Il tuo nome" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Età <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <input type="number" value={eta} onChange={(e) => setEta(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Es. 18" min="10" max="60" />
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input type="checkbox" id="privacy-consent" required
                  className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0 cursor-pointer" />
                <label htmlFor="privacy-consent" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  Ho letto e accetto la{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline">
                    Privacy Policy
                  </a>
                  . Acconsento al salvataggio dei miei dati per personalizzare il percorso.
                </label>
              </div>

              <button type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm">
                Continua →
              </button>
            </form>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Raccontaci di te</h2>
                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                  Queste info rendono il percorso più tuo. Puoi saltare e completare dal profilo.
                </p>
              </div>

              {/* Ruoli — multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dove giochi?{' '}
                  <span className="text-gray-400 font-normal">(anche più di uno)</span>
                </label>
                <ChipGroup options={PLAYER_ROLES} selected={selectedRoles} onToggle={toggleRole} />
              </div>

              {/* Livello — single select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  A che livello giochi?
                </label>
                <select value={level} onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm bg-white">
                  <option value="">Seleziona…</option>
                  {PLAYER_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Paure — multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cosa ti blocca mentalmente in campo?{' '}
                  <span className="text-gray-400 font-normal">(scegli le tue)</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Puoi selezionarne più di una</p>
                <ChipGroup options={PLAYER_FEARS} selected={selectedFears} onToggle={toggleFear} />
              </div>

              {/* Obiettivi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cosa vuoi migliorare con questo percorso?
                </label>
                <textarea value={goals} onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori durante la partita…"
                  rows={3} maxLength={500} />
              </div>

              {/* Sogno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dove vuoi arrivare col calcio?
                </label>
                <input type="text" value={dream} onChange={(e) => setDream(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Es. Giocare in prima squadra, fare il salto di categoria…"
                  maxLength={300} />
              </div>

              {/* Situazione attuale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Come stai vivendo questo periodo nel calcio?{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <textarea value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…"
                  rows={2} maxLength={500} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                  ← Indietro
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {loading ? 'Creazione…' : 'Inizia ⚽'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Hai già un account?{' '}
          <button onClick={() => router.push('/login')} className="text-emerald-600 hover:text-emerald-700 font-semibold">
            Accedi
          </button>
        </p>
      </div>
    </main>
  );
}
