'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { MIN_AGE, PLAYER_LEVELS, SPORTS, SPORT_ROLES } from '@/lib/constants';
import { BETA_CODE_KEY } from '@/components/GoogleButton';
import { Ticket } from 'lucide-react';
import { AppLoader, Button, Card, Chip, Field, Input, Select, Textarea } from '@/components/ui';

const SITUAZIONI = [
  { value: 'errore', label: 'Dopo un errore' },
  { value: 'panchina', label: 'Quando finisco in panchina' },
  { value: 'giudizio', label: 'Sotto il giudizio del mister o dei compagni' },
  { value: 'pressione_partita', label: 'Nei momenti decisivi della partita' },
];

/**
 * "Completa il profilo" (20/10): per chi è entrato con Google. L'account esiste (email verificata da Google), ma
 * mancano data di nascita (age gate), profilo calciatore, i tre consensi e il codice beta. Un solo schermo,
 * stesso contenuto dei due passi della registrazione; POST /api/register/complete, poi l'onboarding.
 * Finché il profilo non c'è, PaywallGuard riporta qui da ogni pagina.
 */
export default function CompletaProfiloPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [nome, setNome] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [healthAccepted, setHealthAccepted] = useState(false);
  const [sport, setSport] = useState('calcio');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [level, setLevel] = useState('');
  const [situazione, setSituazione] = useState('');
  const [goals, setGoals] = useState('');
  const [dream, setDream] = useState('');
  const [currentSituation, setCurrentSituation] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('birth_date').eq('user_id', session.user.id).maybeSingle();
      if (!vivo) return;
      if (prof?.birth_date) { router.replace('/'); return; } // già completo
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      const nomeGoogle = typeof meta.given_name === 'string' ? meta.given_name : typeof meta.full_name === 'string' ? meta.full_name.split(' ')[0] : typeof meta.name === 'string' ? meta.name.split(' ')[0] : '';
      setNome(nomeGoogle);
      try { setBetaCode(sessionStorage.getItem(BETA_CODE_KEY) ?? ''); } catch { /* no-op */ }
      setReady(true);
    })();
    return () => { vivo = false; };
  }, [router]);

  const clientAge = (bd: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bd)) return null;
    const [y, m, d] = bd.split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
    return age;
  };

  const invia = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return; }
    const age = clientAge(birthDate);
    if (!birthDate || age === null || age < 0 || age > 100) { setError('Data di nascita non valida'); return; }
    if (age < MIN_AGE) { setError(`Per ora For You Football è per chi ha almeno ${MIN_AGE} anni. Stiamo lavorando per aprire anche ai più giovani: ti aspettiamo.`); return; }
    if (!privacyAccepted || !termsAccepted || !healthAccepted) { setError('Per continuare accetta la Privacy Policy, i Termini di servizio e il trattamento dei dati sulla salute'); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/register/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome.trim(), birth_date: birthDate, privacy_accepted: privacyAccepted, terms_accepted: termsAccepted, health_accepted: healthAccepted,
          sport, role: selectedRoles.length ? selectedRoles.join(',') : null, level: level || null, biggest_fear: situazione || null,
          goals: goals.trim() || null, dream: dream.trim() || null, current_situation: currentSituation.trim() || null,
          referral_source: referralSource.trim() || null, beta_code: betaCode || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Qualcosa non ha funzionato. Riprova.');
      try { sessionStorage.removeItem(BETA_CODE_KEY); } catch { /* no-op */ }
      router.replace('/onboarding');
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!ready) return <AppLoader />;
  const toggleRole = (v: string) => setSelectedRoles((prev) => prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]);

  return (
    <main className="min-h-screen bg-app pt-safe pb-10 px-5">
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-title-1 font-bold text-app mt-4 mb-1">Completa il profilo</h1>
        <p className="text-body text-muted mb-4">Sei dentro con Google. Due cose prima di iniziare: chi sei e cosa accetti.</p>
        {betaCode && (
          <p className="inline-flex items-center gap-1.5 text-body-sm text-forest-300 mb-3"><Ticket size={16} aria-hidden /> Accesso beta attivo</p>
        )}
        <Card>
          <form onSubmit={invia} className="space-y-5">
            <Field label="Come ti chiami? *" htmlFor="cp-nome" helper="Il Coach ti chiamerà per nome.">
              <Input id="cp-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Il tuo nome" autoComplete="given-name" required />
            </Field>
            <Field label="Data di nascita *" htmlFor="cp-birth" helper={`Obbligatoria: serve per adattare il percorso alla tua età e per requisiti di legge (per ora l'app è per chi ha almeno ${MIN_AGE} anni).`}>
              <Input id="cp-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} required />
            </Field>

            <div className="space-y-1">
              <label htmlFor="cp-privacy" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                <input type="checkbox" id="cp-privacy" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                <span>Ho letto e accetto la <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-400 underline">Privacy Policy</a>. Il salvataggio dei dati è necessario per consentire la personalizzazione del percorso. *</span>
              </label>
              <label htmlFor="cp-terms" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                <input type="checkbox" id="cp-terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                <span>Ho letto e accetto i <a href="/termini" target="_blank" rel="noopener noreferrer" className="text-forest-400 underline">Termini di servizio</a>. *</span>
              </label>
              <label htmlFor="cp-health" className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
                <input type="checkbox" id="cp-health" checked={healthAccepted} onChange={(e) => setHealthAccepted(e.target.checked)} className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0 cursor-pointer" />
                <span>Acconsento a salvare i dati sulla salute che inserisco io (come sto, sonno, dolori, sensazioni negli esercizi). Servono solo a regolare il percorso e l&apos;allenamento. *</span>
              </label>
            </div>

            <div className="border-t border-divider pt-4">
              <h2 className="font-display text-title-3 font-bold text-app">Raccontaci di te</h2>
              <p className="text-body-sm text-muted mt-0.5 mb-3">Queste info rendono il percorso più tuo. Puoi completarle anche dopo dal profilo.</p>
              <p className="text-label font-semibold text-app mb-2">Che sport pratichi?</p>
              <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Sport">
                {SPORTS.map((s) => <Chip key={s.value} selected={sport === s.value} onClick={() => { setSport(s.value); setSelectedRoles([]); }} icon={<span aria-hidden>{s.icon}</span>}>{s.label}</Chip>)}
              </div>
              {(SPORT_ROLES[sport]?.length ?? 0) > 0 && (
                <>
                  <p className="text-label font-semibold text-app mb-2">Che ruolo hai? <span className="text-muted font-normal">(anche più di uno)</span></p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(SPORT_ROLES[sport] || []).map((r) => <Chip key={r.value} selected={selectedRoles.includes(r.value)} onClick={() => toggleRole(r.value)}>{r.label}</Chip>)}
                  </div>
                </>
              )}
              <Field label="A che livello giochi?" htmlFor="cp-level">
                <Select id="cp-level" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Seleziona…</option>
                  {PLAYER_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </Select>
              </Field>
              <p className="text-label font-semibold text-app mt-4 mb-2">Qual è la situazione mentale più difficile per te in campo?</p>
              <div className="space-y-2 mb-4" role="group" aria-label="Situazione più difficile">
                {SITUAZIONI.map((s) => <Chip key={s.value} selected={situazione === s.value} onClick={() => setSituazione(s.value)} className="w-full justify-start text-left whitespace-normal h-auto! min-h-[44px] py-2">{s.label}</Chip>)}
              </div>
              <Field label="Cosa vuoi migliorare con questo percorso?" htmlFor="cp-goals" optional counter={{ value: goals.length, max: 500 }}>
                <Textarea id="cp-goals" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Es. Gestire meglio la pressione, smettere di pensare agli errori durante la partita…" rows={3} maxLength={500} />
              </Field>
              <Field label="Dove vuoi arrivare nel tuo sport?" htmlFor="cp-dream" optional>
                <Input id="cp-dream" type="text" value={dream} onChange={(e) => setDream(e.target.value)} placeholder="Es. Giocare in prima squadra, fare il salto di categoria…" maxLength={300} />
              </Field>
              <Field label="Come stai vivendo questo periodo in campo?" htmlFor="cp-situation" optional counter={{ value: currentSituation.length, max: 500 }}>
                <Textarea id="cp-situation" value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} placeholder="Es. Ho perso il posto da titolare e faccio fatica a ritrovare fiducia…" rows={2} maxLength={500} />
              </Field>
              <Field label="Chi ti ha consigliato For You Football?" htmlFor="cp-referral" optional helper="Un amico, il mister, un post: così sappiamo chi ringraziare.">
                <Input id="cp-referral" value={referralSource} onChange={(e) => setReferralSource(e.target.value)} placeholder="Es. Marco della squadra" maxLength={120} />
              </Field>
            </div>

            {error && <p className="text-body-sm text-danger" role="alert">{error}</p>}
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>{loading ? 'Un attimo…' : 'Inizia'}</Button>
            <Button type="button" variant="ghost" fullWidth onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }} disabled={loading}>Esci</Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
