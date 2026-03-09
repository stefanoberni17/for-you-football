import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Admin client — bypassa RLS e gestisce auth direttamente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, age, role, level, biggest_fear, goals, dream, current_situation } = body;

    // Log richiesta (senza password) per debug
    console.log('📥 /api/register ricevuto:', {
      email,
      passwordLength: password?.length,
      passwordCharCodes: password ? Array.from(password as string).map((c: string) => c.charCodeAt(0)) : [],
      name,
      age,
      role,
    });

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password sono obbligatori' }, { status: 400 });
    }

    // 1. Crea utente con admin API — invia email di conferma automaticamente
    //    (email_confirm: false = richiede conferma, email inviata)
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
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

    const userId = userData.user.id;

    // 2. Upsert profilo — stessa connessione admin, utente già in auth.users
    //    nessun problema di FK o timing
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
      console.error('❌ Errore salvataggio profilo:', profileError);
      // L'utente è stato creato — non blocchiamo la registrazione per il profilo
      // L'utente potrà completarlo dal profilo dopo il login
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('❌ Errore /api/register:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
