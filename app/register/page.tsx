'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MIN_AGE, PLAYER_LEVELS, SPORTS, SPORT_ROLES, SPORT_FEARS } from '@/lib/constants';
import { Check, ChevronLeft, ChevronRight, Mail, Ticket } from 'lucide-react';
import { AppLoader, Button, Card, Chip, Field, Input, Select, Textarea } from '@/components/ui';

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
      {options.map((opt) => (
        <Chip key={opt.value} selected={selected.includes(opt.value)} onClick={() => onToggle(opt.value)}>
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const betaCode = (searchParams.get('beta') || '').trim();
  const hasBetaCode = betaCode.length > 0;
  const [step, setStep] = useState(1);

  // Step 1 — account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthAccepted, setHealthAccepted] = useState(false);

  // Step 2 — profilo atleta
  const [sport, setSport] = useState('calcio');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [selectedSituazione, setSelectedSituazione] = useState('');
  const [showSituazioneRisposta, setShowSituazioneRisposta] = useState(false);
  const [goals, setGoals] = useState('');
  const [dream, setDream] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');

  const SITUAZIONE_RISPOSTE: Record<string, string> = {
    errore:            "Perfetto. Inizieremo proprio da lì — da quel momento dopo l'errore.",
    panchina:          'Capito. Quella sensazione ha un nome. E uno strumento.',
    giudizio:          'Lo conosco bene. Sarà il filo conduttore di tutto il percorso.',
    pressione_partita: 'Esatto. La settimana 1 è costruita attorno a quello.',
  };
  const SITUAZIONI = [
    { value: 'errore',            label: 'Dopo un errore' },
    { value: 'panchina',          label: 'Quando finisco in panchina' },
    { value: 'giudizio',          label: 'Sotto il giudizio del mister o dei compagni' },
    { value: 'pressione_partita', label: 'Nei momenti decisivi della partita' },
  ];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const toggleRole = (v: string) =>
    setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  // Età compiuta da 'YYYY-MM-DD' — solo UX: la validazione che conta è server-side
  const clientAge = (bd: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) return null;
    const [y, m, d] = bd.split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
    return age;
  };

  // ── Step 1 validation ─────────────────────────────────────────────────────
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Le password non coincidono'); return; }
    if (password.length < 8) { setError('La password deve essere di almeno 8 caratteri'); return; }
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return; }
    if (!birthDate) { setError('La data di nascita è obbligatoria'); return; }
    const age = clientAge(birthDate);
    if (age === null || age < 0 || age > 100) { setError('Data di nascita non valida'); return; }
    if (age < MIN_AGE) {
      // ⚠️ TESTO DA RIVEDERE INSIEME PRIMA DEL DEPLOY — stesso messaggio del server
      setError(`Per usare For You Football devi avere almeno ${MIN_AGE} anni. Ti aspettiamo!`);
      return;
    }
    if (!privacyAccepted || !termsAccepted || !healthAccepted) {
      setError('Per continuare accetta la Privacy Policy, i Termini di servizio e il trattamento dei dati sulla salute');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit finale ─────────────────────────────────────────────────────────
  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
          birth_date: birthDate,
          privacy_accepted: privacyAccepted,
          terms_accepted: termsAccepted,
          health_accepted: healthAccepted,
          sport: sport || 'calcio',
          role: selectedRoles.length ? selectedRoles.join(',') : null,
          level: level || null,
          biggest_fear: selectedSituazione || null,
          goals: goals.trim() || null,
          dream: dream.trim() || null,
          current_situation: currentSituation.trim() || null,
          beta_code: betaCode || null,
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
    const handleResend = async () => {
      if (resendCooldown > 0 || resending) return;
      setResending(true);
      try {
        await supabase.auth.resend({ type: 'signup', email: email.trim() });
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch { /* non bloccante */ }
      setResending(false);
    };

    return (
      <main className="min-h-screen bg-app flex flex-col items-center justify-center p-5">
        <Card className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4 text-forest-400" aria-hidden><Mail size={44} /></div>
          <h2 className="font-display text-title-1 font-bold text-app mb-2">Controlla la tua email!</h2>
          <p className="text-muted text-body leading-relaxed mb-5">
            Abbiamo inviato un link di conferma a{' '}
            <strong className="text-app">{email}</strong>.
            <br />
            Clicca il link per attivare il tuo account, poi torna qui ad accedere.
          </p>
          <Card variant="accent" padding="sm" className="mb-4 text-left">
            <p className="text-forest-300 text-body-sm font-semibold mb-0.5">Non trovi l&apos;email?</p>
            <p className="text-forest-200 text-body-sm leading-relaxed">
              Controlla <strong>Spam</strong> o <strong>Posta indesiderata</strong>.
            </p>
          </Card>
          <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/login')} className="mb-3">
            Vai al login
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleResend}
            disabled={resendCooldown > 0}
            loading={resending}
          >
            {resending
              ? 'Invio…'
              : resendCooldown > 0
              ? `Email inviata — riprova tra ${resendCooldown}s`
              : 'Reinvia email di conferma'}
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-sm mx-auto">

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2" aria-hidden>⚽</div>
          <h1 className="font-display text-title-1 font-bold text-app">For You Football</h1>
          <p className="text-forest-400 font-semibold text-overline mt-0.5 uppercase tracking-wider">
            Allenamento mentale per calciatori
          </p>
          {hasBetaCode && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-forest-500/15 border border-forest-500/30 text-forest-300 text-body-sm font-semibold px-3 py-1.5 rounded-full">
              <Ticket size={16} aria-hidden />
              <span>Accesso beta attivo</span>
            </div>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold shrink-0 transition-all ${step >= 1 ? 'bg-forest-500 text-white' : 'bg-surface-2 text-faint'}`}>
              {step > 1 ? <Check size={16} strokeWidth={3} aria-label="Fatto" /> : '1'}
            </div>
            <span className={`text-caption font-medium truncate ${step === 1 ? 'text-app' : 'text-faint'}`}>Il tuo account</span>
          </div>
          <div className={`h-0.5 w-8 shrink-0 rounded-full transition-all ${step > 1 ? 'bg-forest-400' : 'bg-surface-2'}`} />
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold shrink-0 transition-all ${step >= 2 ? 'bg-forest-500 text-white' : 'bg-surface-2 text-faint'}`}>
              2
            </div>
            <span className={`text-caption font-medium truncate ${step === 2 ? 'text-app' : 'text-faint'}`}>Il tuo profilo</span>
          </div>
        </div>

        {/* Card */}
        <Card>
          {error && (
            <div className="bg-danger/15 border border-danger/30 text-danger px-4 py-3 rounded-btn text-body-sm mb-5" role="alert">{error}</div>
          )}

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-5">
              <div>
                <h2 className="font-display text-title-2 font-bold text-app">Crea il tuo account</h2>
                <p className="text-muted text-body-sm mt-0.5">Meno di un minuto.</p>
              </div>

              <Field label="Email *" htmlFor="reg-email">
                <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tua@email.com" autoComplete="email" inputMode="email" required />
              </Field>

              <Field label="Password *" htmlFor="reg-password">
                <Input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caratteri" autoComplete="new-password" required />
              </Field>

              <Field label="Conferma password *" htmlFor="reg-confirm">
                <Input id="reg-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password" autoComplete="new-password" required />
              </Field>

              <div className="border-t border-divider pt-4">
                <Field label="Come ti chiami? *" htmlFor="reg-nome" helper="Il Coach ti chiamerà per nome.">
                  <Input id="reg-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                    placeholder="Il tuo nome" autoComplete="given-name" required />
                </Field>
              </div>

              <Field
                label="Data di nascita *"
                htmlFor="reg-birth"
                helper={`Obbligatoria: serve per adattare il percorso alla tua età e per requisiti di legge (età minima ${MIN_AGE} anni).`}
              >
                <Input id="reg-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  required />
              </Field>

              {/* Consensi: checkbox separate, MAI pre-selezionate */}
              <div className="space-y-1 pt-1">
                <label htmlFor="privacy-consent" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                  <input type="checkbox" id="privacy-consent" checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                  <span>
                    Ho letto e accetto la{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-400 hover:text-forest-300 underline">
                      Privacy Policy
                    </a>
                    . Il salvataggio dei dati è necessario per consentire la personalizzazione del percorso. *
                  </span>
                </label>
                <label htmlFor="terms-consent" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                  <input type="checkbox" id="terms-consent" checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                  <span>
                    Ho letto e accetto i{' '}
                    <a href="/termini" target="_blank" rel="noopener noreferrer" className="text-forest-400 hover:text-forest-300 underline">
                      Termini di servizio
                    </a>
                    . *
                  </span>
                </label>
                <label htmlFor="health-consent" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                  <input type="checkbox" id="health-consent" checked={healthAccepted}
                    onChange={(e) => setHealthAccepted(e.target.checked)}
                    className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                  <span>
                    Acconsento a salvare i dati sulla salute che inserisco io (come sto, sonno, dolori, sensazioni negli esercizi). Servono solo a regolare il percorso e l&apos;allenamento. *
                  </span>
                </label>
                <p className="text-body-sm text-muted leading-relaxed pt-1">
                  Hai meno di 18 anni? Fai leggere{' '}
                  <a href="/genitori" target="_blank" rel="noopener noreferrer" className="text-forest-400 underline">questa pagina</a>
                  {' '}a un genitore: spiega in due minuti cos&apos;è l&apos;app e cosa fa l&apos;AI.
                </p>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth iconRight={<ChevronRight size={20} aria-hidden />}>
                Continua
              </Button>
            </form>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <h2 className="font-display text-title-2 font-bold text-app">Raccontaci di te</h2>
                <p className="text-muted text-body-sm mt-0.5 leading-relaxed">
                  Queste info rendono il percorso più tuo. Puoi saltare e completare dal profilo.
                </p>
              </div>

              {/* Sport — single select chips */}
              <div>
                <p className="text-label font-semibold text-app mb-1">
                  Che sport pratichi?
                </p>
                <p className="text-caption text-muted mb-2">Il Coach adatta il linguaggio al tuo sport.</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Sport">
                  {SPORTS.map((s) => (
                    <Chip
                      key={s.value}
                      selected={sport === s.value}
                      onClick={() => { setSport(s.value); setSelectedRoles([]); }}
                      icon={<span aria-hidden>{s.icon}</span>}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Ruoli — multi-select (dinamici per sport) */}
              {(SPORT_ROLES[sport]?.length ?? 0) > 0 && (
              <div>
                <p className="text-label font-semibold text-app mb-1">
                  Che ruolo hai?{' '}
                  <span className="text-muted font-normal">(anche più di uno)</span>
                </p>
                <p className="text-caption text-muted mb-2">Il Coach userà esempi dal tuo ruolo.</p>
                <ChipGroup options={SPORT_ROLES[sport] || []} selected={selectedRoles} onToggle={toggleRole} />
              </div>
              )}

              {/* Livello — single select */}
              <Field label="A che livello giochi?" htmlFor="reg-level" helper="Calibra il contesto delle pratiche.">
                <Select id="reg-level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Seleziona…</option>
                  {PLAYER_LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </Select>
              </Field>

              {/* Situazione — single select con risposta inline */}
              <div>
                <p className="text-label font-semibold text-app mb-1">
                  Qual è la situazione mentale più difficile per te in campo?
                </p>
                <p className="text-caption text-muted mb-2">Inizieremo proprio da lì.</p>
                <div className="space-y-2" role="group" aria-label="Situazione più difficile">
                  {SITUAZIONI.map((s) => (
                    <Chip
                      key={s.value}
                      selected={selectedSituazione === s.value}
                      onClick={() => {
                        setSelectedSituazione(s.value);
                        setShowSituazioneRisposta(false);
                        setTimeout(() => setShowSituazioneRisposta(true), 300);
                      }}
                      className="w-full justify-start text-left whitespace-normal h-auto! min-h-[44px] py-2"
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
                {selectedSituazione && showSituazioneRisposta && (
                  <p className="text-body-sm text-forest-300 mt-3">
                    {SITUAZIONE_RISPOSTE[selectedSituazione]}
                  </p>
                )}
              </div>

              {/* Obiettivi */}
              <Field label="Cosa vuoi migliorare con questo percorso?" htmlFor="reg-goals" counter={{ value: goals.length, max: 500 }}>
                <Textarea id="reg-goals" value={goals} onChange={(e) => setGoals(e.target.value)}
                  placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori durante la partita…"
                  rows={3} maxLength={500} />
              </Field>

              {/* Sogno */}
              <Field label="Dove vuoi arrivare nel tuo sport?" htmlFor="reg-dream">
                <Input id="reg-dream" type="text" value={dream} onChange={(e) => setDream(e.target.value)}
                  placeholder="Es. Giocare in prima squadra, fare il salto di categoria…"
                  maxLength={300} />
              </Field>

              {/* Situazione attuale */}
              <Field label="Come stai vivendo questo periodo in campo e nel tuo sport?" htmlFor="reg-situation" optional counter={{ value: currentSituation.length, max: 500 }}>
                <Textarea id="reg-situation" value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)}
                  placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…"
                  rows={2} maxLength={500} />
              </Field>

              <div className="space-y-3 pt-1">
                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                  {loading ? 'Creazione…' : 'Inizia'}
                </Button>
                <Button type="button" variant="secondary" fullWidth onClick={() => handleRegister()} disabled={loading}>
                  Salta per ora (lo completi dal profilo)
                </Button>
                <Button type="button" variant="ghost" fullWidth icon={<ChevronLeft size={18} aria-hidden />}
                  onClick={() => { setStep(1); setError(''); }} disabled={loading}>
                  Indietro
                </Button>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-4 text-center text-body-sm text-muted flex items-center justify-center gap-1 flex-wrap">
          <span>Hai già un account?</span>
          <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>
            Accedi
          </Button>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<AppLoader />}
    >
      <RegisterContent />
    </Suspense>
  );
}
