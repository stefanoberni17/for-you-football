'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PLAYER_ROLES, PLAYER_LEVELS, DIFFICULT_SITUATIONS } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();

  // Step: 1 = account + dati base | 2 = profilo calciatore
  const [step, setStep] = useState(1);

  // Step 1 — account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [eta, setEta] = useState('');

  // Step 2 — profilo calciatore (tutti opzionali)
  const [role, setRole] = useState('');
  const [level, setLevel] = useState('');
  const [biggestFear, setBiggestFear] = useState('');
  const [difficultSituation, setDifficultSituation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Validazione step 1 e avanzamento ──
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    if (!nome.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit finale ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      console.log('✅ Utente creato:', authData);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user?.id,
          name: nome.trim(),
          age: eta ? parseInt(eta) : null,
          role: role || null,
          level: level || null,
          biggest_fear: biggestFear.trim() || null,
          difficult_situation: difficultSituation || null,
          onboarding_completed: false,
        });

      if (profileError) {
        console.error('❌ Errore profilo:', profileError);
        throw new Error(profileError.message || 'Errore nella creazione del profilo');
      }

      console.log('✅ Profilo creato!');
      setSuccess(true);

    } catch (error: any) {
      setError(error.message);
      console.error('❌ Errore registrazione:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Schermata successo ──
  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-100 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Controlla la tua email!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-5">
            Abbiamo inviato un link di conferma a{' '}
            <strong className="text-gray-800">{email}</strong>.
            <br />
            Clicca il link per attivare il tuo account, poi torna qui ad accedere.
          </p>

          {/* Avviso spam */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-amber-800 text-xs font-semibold mb-0.5">
              📁 Non trovi l&apos;email?
            </p>
            <p className="text-amber-700 text-xs leading-relaxed">
              Controlla la cartella <strong>Spam</strong> o{' '}
              <strong>Posta indesiderata</strong> — a volte ci finisce per errore.
              Se non arriva entro qualche minuto, riprova con una email diversa.
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

        {/* ── Header brand ── */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-xl font-bold text-gray-800">For You Football</h1>
          <p className="text-emerald-600 font-semibold text-xs mt-0.5 uppercase tracking-widest">
            Allenamento mentale per calciatori
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2 mb-6 px-1">
          {/* Passo 1 */}
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step >= 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </div>
            <span
              className={`text-xs font-medium truncate ${
                step === 1 ? 'text-gray-800' : 'text-gray-400'
              }`}
            >
              Il tuo account
            </span>
          </div>

          {/* Linea */}
          <div
            className={`h-0.5 w-8 shrink-0 rounded-full transition-all ${
              step > 1 ? 'bg-emerald-400' : 'bg-gray-200'
            }`}
          />

          {/* Passo 2 */}
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step >= 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              2
            </div>
            <span
              className={`text-xs font-medium truncate ${
                step === 2 ? 'text-gray-800' : 'text-gray-400'
              }`}
            >
              Il tuo profilo
            </span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-xl p-7">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          {/* ════ STEP 1 ════ */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Crea il tuo account</h2>
                <p className="text-gray-500 text-sm mt-0.5">Ti vuole meno di un minuto.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="tua@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Minimo 6 caratteri"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Conferma password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Ripeti la password"
                  required
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Come ti chiami? *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Il tuo nome"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Età{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <input
                  type="number"
                  value={eta}
                  onChange={(e) => setEta(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Es. 18"
                  min="10"
                  max="60"
                />
              </div>

              {/* Consenso privacy */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  type="checkbox"
                  id="privacy-consent"
                  required
                  className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0 cursor-pointer"
                />
                <label htmlFor="privacy-consent" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  Ho letto e accetto la{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Privacy Policy
                  </a>
                  . Acconsento al salvataggio dei miei dati per personalizzare il percorso.
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
              >
                Continua →
              </button>
            </form>
          )}

          {/* ════ STEP 2 ════ */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Il tuo profilo da calciatore</h2>
                <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">
                  Aiuta il Coach AI a personalizzare il percorso mentale.
                  Puoi saltare e completare dal profilo.
                </p>
              </div>

              {/* Ruolo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Qual è il tuo ruolo?{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="">Seleziona il ruolo…</option>
                  {PLAYER_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Livello */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  A che livello giochi?{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="">Seleziona il livello…</option>
                  {PLAYER_LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Momento difficile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  In quale momento fatichi di più?{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <select
                  value={difficultSituation}
                  onChange={(e) => setDifficultSituation(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm bg-white"
                >
                  <option value="">Seleziona la situazione…</option>
                  {DIFFICULT_SITUATIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Paura più grande */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Qual è la tua paura più grande in campo?{' '}
                  <span className="text-gray-400 font-normal">(opzionale)</span>
                </label>
                <input
                  type="text"
                  value={biggestFear}
                  onChange={(e) => setBiggestFear(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-sm"
                  placeholder="Es. Sbagliare un rigore, deludere il mister…"
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                >
                  ← Indietro
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Creazione…' : 'Inizia ⚽'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Link login */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Hai già un account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Accedi
          </button>
        </p>
      </div>
    </main>
  );
}
