/**
 * Ciò che la registrazione scrive DOPO che l'utente auth esiste (20/10): profilo, "chi ti ha consigliato",
 * snapshot T0, prova del consenso. Lo usano `POST /api/register` (email + password: signUp e poi questo) e
 * `POST /api/register/complete` (accesso con Google: l'utente esiste già, manca tutto il resto). Server-only.
 */
import { createClient } from '@supabase/supabase-js';
import { logEvent } from './events';
import { MIN_AGE, PRIVACY_VERSION, TERMS_VERSION } from './constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export interface CampiRegistrazione {
  name: string | null;
  birth_date: string;
  sport: string;
  role: string | null;
  level: string | null;
  biggest_fear: string | null;
  goals: string | null;
  dream: string | null;
  current_situation: string | null;
  referral_source: string;
}

/** Età compiuta da 'YYYY-MM-DD'; null se malformata. */
export function ageFromBirthDate(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const bd = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) age -= 1;
  return age;
}

/** Age gate: il messaggio di rifiuto (stesso testo client e server) o null se passa. Logga `age_gate_blocked` senza dati personali. */
export function controllaEta(birth_date: unknown): { ok: true; age: number } | { ok: false; status: 400 | 403; error: string; age_gate?: true } {
  if (!birth_date || typeof birth_date !== 'string') return { ok: false, status: 400, error: 'La data di nascita è obbligatoria' };
  const age = ageFromBirthDate(birth_date);
  if (age === null || age < 0 || age > 100) return { ok: false, status: 400, error: 'Data di nascita non valida' };
  if (age < MIN_AGE) {
    supabaseAdmin.from('onboarding_events').insert({ user_id: null, event: 'age_gate_blocked', meta: { age } })
      .then(() => {}, (err) => console.error('age_gate_blocked event error:', err));
    return { ok: false, status: 403, error: `Per ora For You Football è per chi ha almeno ${MIN_AGE} anni. Stiamo lavorando per aprire anche ai più giovani: ti aspettiamo.`, age_gate: true };
  }
  return { ok: true, age };
}

/** Normalizza i campi del profilo dal body (stringhe tagliate, vuoti → null). */
export function campiDalBody(body: Record<string, unknown>): Omit<CampiRegistrazione, 'birth_date'> {
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
  return {
    name: str(body.name, 80),
    sport: str(body.sport, 20) ?? 'calcio',
    role: str(body.role, 120),
    level: str(body.level, 40),
    biggest_fear: str(body.biggest_fear, 120),
    goals: str(body.goals, 500),
    dream: str(body.dream, 300),
    current_situation: str(body.current_situation, 500),
    referral_source: str(body.referral_source, 120) ?? '',
  };
}

/**
 * Profilo + referral + snapshot T0 + consensi. Niente blocca: l'utente auth esiste già, i log sono rumorosi.
 * In consent_events il canale resta 'registration' (il vincolo CHECK della migration 012/021 non conosce altro): `via` finisce nell'evento.
 */
export async function salvaProfiloRegistrazione(userId: string, campi: CampiRegistrazione, age: number, opt: { isBeta: boolean; via: 'password' | 'google' }): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      name: campi.name,
      birth_date: campi.birth_date,
      age, // derivata da birth_date — mantenuta per compatibilità (Coach, snapshot)
      sport: campi.sport,
      role: campi.role,
      level: campi.level,
      biggest_fear: campi.biggest_fear,
      goals: campi.goals,
      dream: campi.dream,
      current_situation: campi.current_situation,
      onboarding_completed: false,
      is_beta_free: opt.isBeta,
    }, { onConflict: 'user_id' });
    if (error) console.error('❌ Errore salvataggio profilo (non bloccante):', error);
    else console.log('✅ Profilo salvato per userId:', userId);
  } catch (err) {
    console.error('❌ Eccezione salvataggio profilo (non bloccante):', (err as Error)?.message);
  }

  logEvent(userId, 'signup_completed', { sport: campi.sport, referral: !!campi.referral_source, via: opt.via });

  // "Chi ti ha consigliato?" (8/10, migration 030): update separato e fail-soft
  if (campi.referral_source) {
    const { error } = await supabaseAdmin.from('profiles').update({ referral_source: campi.referral_source }).eq('user_id', userId);
    if (error) console.error('⚠️ referral_source non salvato (migration 030?):', error.message);
  }

  // Snapshot baseline T0 — immutabile (ON CONFLICT = già esiste: atteso)
  try {
    const { error } = await supabaseAdmin.from('profile_snapshots').insert({
      user_id: userId, name: campi.name, age, sport: campi.sport, role: campi.role, level: campi.level,
      biggest_fear: campi.biggest_fear, goals: campi.goals, dream: campi.dream, current_situation: campi.current_situation,
    });
    if (error && error.code !== '23505') console.error('❌ Errore snapshot baseline (non bloccante):', error);
  } catch (err) {
    console.error('❌ Eccezione snapshot baseline (non bloccante):', (err as Error)?.message);
  }

  // Prova del consenso — una riga per documento; il log è volutamente rumoroso
  try {
    const { error } = await supabaseAdmin.from('consent_events').insert([
      { user_id: userId, document_type: 'privacy', document_version: PRIVACY_VERSION, channel: 'registration' },
      { user_id: userId, document_type: 'terms', document_version: TERMS_VERSION, channel: 'registration' },
    ]);
    if (error) console.error('🚨 CONSENT NON REGISTRATO per userId', userId, ':', error);
    // Riga separata: se la migration 021 non è applicata fallisce solo questa, non privacy/terms
    const { error: healthErr } = await supabaseAdmin.from('consent_events').insert(
      { user_id: userId, document_type: 'health_data', document_version: PRIVACY_VERSION, channel: 'registration' });
    if (healthErr) console.error('🚨 CONSENT health_data NON REGISTRATO per userId', userId, ':', healthErr.message);
  } catch (err) {
    console.error('🚨 CONSENT NON REGISTRATO (eccezione) per userId', userId, ':', (err as Error)?.message);
  }
}
