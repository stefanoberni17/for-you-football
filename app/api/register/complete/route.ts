import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { campiDalBody, controllaEta, salvaProfiloRegistrazione } from '@/lib/registrazione';
import { isValidBetaCode } from '@/lib/betaCode';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/**
 * POST → "Completa il profilo" per chi è entrato con Google (20/10): l'utente auth esiste già (email verificata da
 * Google), mancano data di nascita, profilo calciatore, i tre consensi e il codice beta. Stesse regole di
 * /api/register (age gate server-side, consensi obbligatori), stessa scrittura (`salvaProfiloRegistrazione`).
 * Se il profilo esiste già con la data di nascita, risponde `already: true` senza riscrivere.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const { data: esistente } = await supabaseAdmin.from('profiles').select('birth_date').eq('user_id', userId).maybeSingle();
    if (esistente?.birth_date) return NextResponse.json({ success: true, already: true });

    const eta = controllaEta(body.birth_date);
    if (!eta.ok) return NextResponse.json({ error: eta.error, ...(eta.age_gate ? { age_gate: true } : {}) }, { status: eta.status });
    if (body.privacy_accepted !== true || body.terms_accepted !== true) {
      return NextResponse.json({ error: 'Per continuare devi accettare la Privacy Policy e i Termini di servizio' }, { status: 400 });
    }
    if (body.health_accepted !== true) {
      return NextResponse.json({ error: 'Per continuare serve il consenso al trattamento dei dati sulla salute' }, { status: 400 });
    }
    const isBeta = isValidBetaCode(body.beta_code);
    await salvaProfiloRegistrazione(userId, { ...campiDalBody(body), birth_date: String(body.birth_date) }, eta.age, { isBeta, via: 'google' });
    return NextResponse.json({ success: true, beta_accepted: isBeta });
  } catch (err) {
    console.error('❌ Errore /api/register/complete:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
