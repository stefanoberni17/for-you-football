import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { MIN_AGE, PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';

// Admin client — per upsert profilo (bypassa RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// Client standard — per signUp (invia email di conferma automaticamente)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * Verifica un codice invito beta contro la env var BETA_INVITE_CODES.
 * - CSV: più codici separati da virgola
 * - Case-insensitive
 * - Whitespace trimmato
 *
 * Esempio env: BETA_INVITE_CODES=BETA2_2026,PARTNER_FYF
 * Esempi validi: "BETA2_2026", "beta2_2026", "  Beta2_2026  " → tutti true
 */
function isValidBetaCode(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') return false;
  const allowed = (process.env.BETA_INVITE_CODES || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(input.trim().toUpperCase());
}

/**
 * Età compiuta oggi a partire da una data di nascita 'YYYY-MM-DD'.
 * Ritorna null se la stringa è malformata o non è una data reale.
 */
function ageFromBirthDate(birthDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rifiuta date "normalizzate" da JS (es. 2010-02-31 → 3 marzo)
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  const now = new Date();
  let age = now.getUTCFullYear() - y;
  const birthdayPassed =
    now.getUTCMonth() > m - 1 ||
    (now.getUTCMonth() === m - 1 && now.getUTCDate() >= d);
  if (!birthdayPassed) age -= 1;
  return age;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, birth_date, sport, role, level, biggest_fear, goals, dream, current_situation, beta_code, privacy_accepted, terms_accepted } = body;

    // Valida codice invito beta (se presente)
    const isBeta = isValidBetaCode(beta_code);

    // Log richiesta (senza password, senza data di nascita) per debug
    console.log('📥 /api/register ricevuto:', {
      email,
      passwordLength: password?.length,
      name,
      role,
      betaCodeProvided: Boolean(beta_code),
      betaAccepted: isBeta,
    });

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono obbligatori' }, { status: 400 });
    }

    // ── AGE GATE — la validazione che conta è QUESTA (il client è solo UX) ──
    if (!birth_date || typeof birth_date !== 'string') {
      return NextResponse.json({ error: 'La data di nascita è obbligatoria' }, { status: 400 });
    }
    const computedAge = ageFromBirthDate(birth_date);
    if (computedAge === null || computedAge < 0 || computedAge > 100) {
      // Malformata, data futura o implausibile (>100 anni)
      return NextResponse.json({ error: 'Data di nascita non valida' }, { status: 400 });
    }
    if (computedAge < MIN_AGE) {
      // Misura i respinti: evento senza dati personali (user_id NULL, solo età)
      supabaseAdmin
        .from('onboarding_events')
        .insert({ user_id: null, event: 'age_gate_blocked', meta: { age: computedAge } })
        .then(() => {}, (err) => console.error('age_gate_blocked event error:', err));
      // ⚠️ TESTO DA RIVEDERE INSIEME PRIMA DEL DEPLOY (spec intervento 1.4)
      return NextResponse.json(
        { error: `Per usare For You Football devi avere almeno ${MIN_AGE} anni. Ti aspettiamo!`, age_gate: true },
        { status: 403 }
      );
    }

    // ── CONSENSO — entrambe le accettazioni obbligatorie (prova in DB dopo il signUp) ──
    if (privacy_accepted !== true || terms_accepted !== true) {
      return NextResponse.json(
        { error: 'Per registrarti devi accettare la Privacy Policy e i Termini di servizio' },
        { status: 400 }
      );
    }

    // 1. Crea utente con signUp — Supabase invia email di conferma automaticamente
    const { data: userData, error: authError } = await supabaseAuth.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // Log completo per debug
      console.error('❌ authError completo:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        cause: (authError as any).cause,
        code: (authError as any).code,
        full: JSON.stringify(authError),
      });

      const msg = authError.message.toLowerCase();
      const httpStatus = authError.status;

      // Email già registrata
      if (
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('already exists') ||
        msg.includes('email_exists') ||
        msg.includes('user already') ||
        msg.includes('duplicate')
      ) {
        return NextResponse.json(
          { error: 'Email già registrata. Prova ad accedere.' },
          { status: 400 }
        );
      }

      // Password non rispetta la policy Supabase
      if (
        msg.includes('pattern') ||
        msg.includes('password') ||
        msg.includes('weak') ||
        msg.includes('leaked') ||
        msg.includes('validation') ||
        msg.includes('characters')
      ) {
        return NextResponse.json(
          { error: 'Password non valida. Usa almeno 8 caratteri, includi lettere e numeri.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // signUp può restituire un utente esistente non confermato senza errore
    if (!userData.user) {
      return NextResponse.json({ error: 'Errore nella creazione dell\'account. Riprova.' }, { status: 400 });
    }

    const userId = userData.user.id;

    // 2. Upsert profilo — isolato in try-catch separato
    //    Anche se fallisce (tabella mancante, colonne errate, ecc.)
    //    NON deve bloccare la registrazione — l'utente è già creato
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userId,
          name: name || null,
          birth_date,
          age: computedAge, // derivata da birth_date — mantenuta per compatibilità (Coach, snapshot)
          sport: sport || 'calcio',
          role: role || null,
          level: level || null,
          biggest_fear: biggest_fear || null,
          goals: goals || null,
          dream: dream || null,
          current_situation: current_situation || null,
          onboarding_completed: false,
          is_beta_free: isBeta,
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('❌ Errore salvataggio profilo (non bloccante):', profileError);
      } else {
        console.log('✅ Profilo salvato per userId:', userId);
      }
    } catch (profileErr: any) {
      // Eccezione dal client Supabase (es. tabella non esistente, rete) — ignoriamo
      console.error('❌ Eccezione salvataggio profilo (non bloccante):', profileErr?.message);
    }

    // 3. Snapshot baseline T0 — immutabile, per il confronto W12.
    //    Fire-and-forget, non blocca la registrazione. ON CONFLICT DO NOTHING
    //    garantisce che un re-tentativo non sovrascriva i valori originali.
    try {
      const { error: snapshotError } = await supabaseAdmin
        .from('profile_snapshots')
        .insert({
          user_id: userId,
          name: name || null,
          age: computedAge,
          sport: sport || 'calcio',
          role: role || null,
          level: level || null,
          biggest_fear: biggest_fear || null,
          goals: goals || null,
          dream: dream || null,
          current_situation: current_situation || null,
        });
      if (snapshotError && snapshotError.code !== '23505') {
        // 23505 = unique violation (snapshot già esistente per questo user_id) — atteso, no log
        console.error('❌ Errore snapshot baseline (non bloccante):', snapshotError);
      }
    } catch (snapshotErr: any) {
      console.error('❌ Eccezione snapshot baseline (non bloccante):', snapshotErr?.message);
    }

    // 4. Prova del consenso — una riga per documento (channel: registration).
    //    Se l'insert fallisce NON blocchiamo (l'utente auth esiste già), ma il
    //    log è volutamente rumoroso: senza queste righe non c'è prova in DB.
    try {
      const { error: consentError } = await supabaseAdmin.from('consent_events').insert([
        { user_id: userId, document_type: 'privacy', document_version: PRIVACY_VERSION, channel: 'registration' },
        { user_id: userId, document_type: 'terms', document_version: TERMS_VERSION, channel: 'registration' },
      ]);
      if (consentError) {
        console.error('🚨 CONSENT NON REGISTRATO per userId', userId, ':', consentError);
      }
    } catch (consentErr) {
      console.error('🚨 CONSENT NON REGISTRATO (eccezione) per userId', userId, ':', (consentErr as Error)?.message);
    }

    return NextResponse.json({ success: true, beta_accepted: isBeta });

  } catch (err: any) {
    console.error('❌ Errore /api/register:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
