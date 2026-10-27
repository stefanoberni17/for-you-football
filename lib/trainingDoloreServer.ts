/**
 * Il dolore per zona letto dal profilo (M9, migration 035): `training_pain_zone`, `training_pain_since`,
 * `training_pain_until`. Senza la migration ritorna null (tutto funziona come prima: solo la pausa).
 * Dal 26/10 sera anche le limitazioni del setup (`training_limitazioni`, migration 036, `loadLimitazioni`).
 */
import { createClient } from '@supabase/supabase-js';
import { limitazioniVuote, parseLimitazioni, type Dolore, type Limitazioni } from './trainingDolore';

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

export const LIMITAZIONI_SELECT = 'training_limitazioni';

/** Le limitazioni del setup (punto 4, migration 036). Senza la migration ritorna null (niente riduzione cronica). */
export async function loadLimitazioni(userId: string): Promise<Limitazioni | null> {
  try {
    const { data, error } = await supabaseAdmin.from('profiles').select(LIMITAZIONI_SELECT).eq('user_id', userId).maybeSingle();
    if (error) return null; // migration 036 non applicata
    const l = parseLimitazioni((data as { training_limitazioni?: unknown } | null)?.training_limitazioni);
    return limitazioniVuote(l) ? null : l;
  } catch { return null; }
}
