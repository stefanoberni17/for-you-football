/**
 * Le impostazioni che Ste cambia da Supabase senza deploy (tabella app_settings, migration 038 e 039): lancio aperto,
 * iscrizioni e tetto del Mente, iscrizioni e tetto del Campo, giorni di prova. Server-only (service role). Fail-soft:
 * senza la tabella valgono i default di lib/abbonamento.ts. Cache 60" per lambda.
 */
import { createClient } from '@supabase/supabase-js';
import { IMPOSTAZIONI_DEFAULT, impostazioniDa, STATI_VIVI, type Impostazioni } from './abbonamento';
import { PACCHETTI, INFO_PACCHETTI } from './listino';

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

const PACCHETTI_MENTE = PACCHETTI.filter((p) => INFO_PACCHETTI[p].mente);
const PACCHETTI_CAMPO = PACCHETTI.filter((p) => INFO_PACCHETTI[p].fisico);

async function conta(piani: string[]): Promise<number> {
  // un abbonamento di prima del 3/11 ha già il piano 'mentale' (webhook della 038)
  const { count, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id', { count: 'exact', head: true })
    .in('subscription_status', [...STATI_VIVI])
    .in('piano', piani);
  return error ? 0 : count ?? 0;
}

/** Abbonamenti vivi con il Mente (Mente e Completo): il numero che si confronta con il tetto del Mente. */
export async function contaIscrittiMente(): Promise<number> {
  return conta(PACCHETTI_MENTE);
}

/** Abbonamenti vivi con il Campo (Fisico e Completo): il numero che si confronta con il tetto del Campo. */
export async function contaIscrittiCampo(): Promise<number> {
  return conta(PACCHETTI_CAMPO);
}

/** Compatibilità con la parte A. */
export const contaIscrittiVivi = contaIscrittiMente;

/** È stato invitato dalla lista d'attesa di quell'area e l'invito vale ancora (passa sopra il tetto)? */
export async function invitatoDallaLista(userId: string, area: 'mente' | 'campo'): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('lista_attesa')
    .select('invitato_fino')
    .eq('user_id', userId)
    .eq('area', area)
    .maybeSingle();
  if (error || !data?.invitato_fino) return false;
  return new Date(data.invitato_fino as string).getTime() > Date.now();
}
