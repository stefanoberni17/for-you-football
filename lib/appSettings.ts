/**
 * Le impostazioni che Ste cambia da Supabase senza deploy (tabella app_settings, migration 038): prezzo del Mentale
 * per chi entra adesso, iscrizioni aperte, tetto, giorni di prova. Server-only (service role). Fail-soft: senza la
 * tabella valgono i default di lib/abbonamento.ts. Cache 60" per lambda.
 */
import { createClient } from '@supabase/supabase-js';
import { IMPOSTAZIONI_DEFAULT, impostazioniDa, PIANO_MENTALE, STATI_VIVI, type Impostazioni } from './abbonamento';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

let cache: { at: number; imp: Impostazioni } | null = null;
const TTL_MS = 60_000;

export async function loadImpostazioni(): Promise<Impostazioni> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.imp;
  try {
    const { data, error } = await supabaseAdmin.from('app_settings').select('chiave, valore');
    if (error) return IMPOSTAZIONI_DEFAULT;
    const imp = impostazioniDa(data as { chiave: string; valore: unknown }[]);
    cache = { at: Date.now(), imp };
    return imp;
  } catch {
    return IMPOSTAZIONI_DEFAULT;
  }
}

/** Abbonamenti vivi al Mentale (in prova, attivi, in tolleranza): il numero che si confronta con il tetto. */
export async function contaIscrittiVivi(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('piano', PIANO_MENTALE)
    .in('subscription_status', [...STATI_VIVI]);
  return error ? 0 : count ?? 0;
}
