import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isValidBetaCode } from '@/lib/betaCode';
import { campiDalBody, controllaEta, salvaProfiloRegistrazione } from '@/lib/registrazione';

// Client standard — per signUp (invia email di conferma automaticamente)
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

/**
 * Registrazione con email e password: age gate e consensi (la validazione che conta è QUESTA, il client è solo UX),
 * signUp Supabase, poi profilo + referral + snapshot T0 + prova del consenso in `salvaProfiloRegistrazione`
 * (lib/registrazione.ts, condivisa dal 20/10 con /api/register/complete per chi entra con Google).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, birth_date, sport, role, level, biggest_fear, goals, dream, current_situation, beta_code, privacy_accepted, terms_accepted, health_accepted, referral_source } = body;

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
    const eta = controllaEta(birth_date);
    if (!eta.ok) return NextResponse.json({ error: eta.error, ...(eta.age_gate ? { age_gate: true } : {}) }, { status: eta.status });
    const computedAge = eta.age;

    // ── CONSENSO — entrambe le accettazioni obbligatorie (prova in DB dopo il signUp) ──
    if (privacy_accepted !== true || terms_accepted !== true) {
      return NextResponse.json(
        { error: 'Per registrarti devi accettare la Privacy Policy e i Termini di servizio' },
        { status: 400 }
      );
    }
    // Dati sulla salute (check-in fisico, dolori, sensazioni): consenso esplicito separato (GDPR art. 9)
    if (health_accepted !== true) {
      return NextResponse.json({ error: 'Per continuare serve il consenso al trattamento dei dati sulla salute' }, { status: 400 });
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

    // 2-4. Profilo, referral, snapshot T0, consensi (lib/registrazione.ts): niente blocca, l'utente auth esiste già
    await salvaProfiloRegistrazione(userId, { ...campiDalBody({ name, sport, role, level, biggest_fear, goals, dream, current_situation, referral_source }), birth_date }, computedAge, { isBeta, via: 'password' });

    return NextResponse.json({ success: true, beta_accepted: isBeta });

  } catch (err: any) {
    console.error('❌ Errore /api/register:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
