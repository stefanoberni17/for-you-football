import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, age, role, level, biggest_fear, goals, dream, current_situation } = body;

    // Log richiesta (senza password) per debug
    console.log('📥 /api/register ricevuto:', {
      email,
      passwordLength: password?.length,
      name,
      age,
      role,
    });

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono obbligatori' }, { status: 400 });
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
          age: age ? parseInt(age) : null,
          role: role || null,
          level: level || null,
          biggest_fear: biggest_fear || null,
          goals: goals || null,
          dream: dream || null,
          current_situation: current_situation || null,
          onboarding_completed: false,
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

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('❌ Errore /api/register:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
