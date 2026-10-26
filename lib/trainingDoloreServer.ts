/**
 * Il dolore per zona letto dal profilo (M9, migration 035): `training_pain_zone`, `training_pain_since`,
 * `training_pain_until`. Senza la migration ritorna null (tutto funziona come prima: solo la pausa).
 */
import { createClient } from '@supabase/supabase-js';
import type { Dolore } from './trainingDolore';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export const DOLORE_SELECT = 'training_pain_zone, training_pain_since, training_pain_until';

export function doloreDaRiga(row: { training_pain_zone?: string | null; training_pain_since?: string | null; training_pain_until?: string | null } | null | undefined): Dolore | null {
  if (!row?.training_pain_zone) return null;
  return { zona: row.training_pain_zone, da: row.training_pain_since ? String(row.training_pain_since).slice(0, 10) : null, fino: row.training_pain_until ? String(row.training_pain_until).slice(0, 10) : null };
}

export async function loadDolore(userId: string): Promise<Dolore | null> {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select(DOLORE_SELECT).eq('user_id', userId).maybeSingle();
    if (error) return null; // migration 035 non applicata
    return doloreDaRiga(data);
  } catch { return null; }
}
