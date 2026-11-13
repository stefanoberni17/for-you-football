/**
 * Lettura del sesso dal profilo (13/11, migration 042). Query a parte e fail-soft: senza la colonna (migration non
 * ancora applicata) o con un errore torna null, cioè «non l'ha detto», e tutto resta come prima.
 */
import { createClient } from '@supabase/supabase-js';
import { parseSesso, type Sesso } from './sesso';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function loadSesso(userId: string): Promise<Sesso | null> {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select('sesso').eq('user_id', userId).maybeSingle();
    if (error) return null;
    return parseSesso((data as { sesso?: unknown } | null)?.sesso);
  } catch {
    return null;
  }
}
