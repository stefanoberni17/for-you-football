/**
 * La settimana con la squadra dal database (10/11). Tabella `user_calendario_settimane` (migration 040), una riga per
 * utente e lunedì. Finché la migration non c'è, e per la settimana in cui si passa da un calendario all'altro, si legge
 * il calendario di prima (`user_weekly_calendar`) se è stato salvato in questa settimana. Si scrive in tutti e due:
 * così il codice di produzione di prima, che legge il vecchio, resta allineato finché non arriva il nuovo.
 */

import { createClient } from '@supabase/supabase-js';
import { lunediDi, lunediPrima, pulisciGiorni, type RispostaSettimana } from '@/lib/settimanaCalendario';
import { parsePartitaAbituale, parseSquadra } from '@/lib/trainingSquadra';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

export const TABELLA_SETTIMANE = 'user_calendario_settimane';

/** Oggi (AAAA-MM-GG) in fuso italiano. */
export function oggiRoma(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

export type SettimanaCaricata = {
  lunedi: string;
  risposta: RispostaSettimana | null;   // la risposta del ragazzo per questa settimana (null = non ancora)
  scorsa: RispostaSettimana | null;     // quella della settimana prima, per «Come la scorsa»
  tabella: boolean;                     // la migration 040 c'è
};

const risp = (r: { training_days?: unknown; match_days?: unknown }): RispostaSettimana => ({ trainingDays: pulisciGiorni(r.training_days), matchDays: pulisciGiorni(r.match_days) });

export async function loadSettimana(userId: string, lunedi = lunediDi(oggiRoma())): Promise<SettimanaCaricata> {
  let risposta: RispostaSettimana | null = null, scorsa: RispostaSettimana | null = null, tabella = true;
  const prima = lunediPrima(lunedi);
  const { data, error } = await supabaseAdmin.from(TABELLA_SETTIMANE).select('lunedi, training_days, match_days')
    .eq('user_id', userId).in('lunedi', [lunedi, prima]);
  if (error) tabella = false;
  for (const r of data || []) {
    const l = String((r as { lunedi: string }).lunedi).slice(0, 10);
    if (l === lunedi) risposta = risp(r);
    else if (l === prima) scorsa = risp(r);
  }
  if (!risposta) {
    // Il calendario di prima: vale solo se salvato in questa settimana (il cron del lunedì lo svuotava)
    const { data: vecchio } = await supabaseAdmin.from('user_weekly_calendar').select('training_days, match_days, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const creato = vecchio?.created_at ? String(vecchio.created_at).slice(0, 10) : null;
    if (vecchio && creato && creato >= lunedi) risposta = risp(vecchio);
  }
  return { lunedi, risposta, scorsa, tabella };
}

/** I giorni abituali del setup del Corpo (giorni squadra e partita abituale), o null. */
export async function loadAbitudine(userId: string): Promise<RispostaSettimana | null> {
  try {
    const { data } = await supabaseAdmin.from('profiles').select('training_squadra').eq('user_id', userId).maybeSingle();
    const raw = (data as { training_squadra?: unknown } | null)?.training_squadra;
    const giorni = Object.keys(parseSquadra(raw)).map(Number).filter((g) => g >= 1 && g <= 7).sort((a, b) => a - b);
    const partita = parsePartitaAbituale(raw);
    return giorni.length || partita ? { trainingDays: giorni, matchDays: partita ? [partita] : [] } : null;
  } catch { return null; }
}

/**
 * La riga di calendario come la leggevano i moduli del Corpo e del Coach (`training_days`, `match_days`), più
 * `confermata`: con la risposta del ragazzo i giorni valgono così come sono (anche vuoti), senza si usa l'abitudine.
 */
export async function calendarioDellaSettimana(userId: string): Promise<{ training_days: number[]; match_days: number[]; confermata: boolean }> {
  const s = await loadSettimana(userId);
  return s.risposta
    ? { training_days: s.risposta.trainingDays, match_days: s.risposta.matchDays, confermata: true }
    : { training_days: [], match_days: [], confermata: false };
}

/** Salva la risposta della settimana (nuova tabella + calendario di prima con il numero della settimana del percorso). */
export async function salvaSettimana(userId: string, giorni: RispostaSettimana, weekNumber?: number): Promise<{ ok: boolean; tabella: boolean }> {
  const lunedi = lunediDi(oggiRoma());
  const adesso = new Date().toISOString();
  const nuova = await supabaseAdmin.from(TABELLA_SETTIMANE).upsert(
    { user_id: userId, lunedi, training_days: giorni.trainingDays, match_days: giorni.matchDays, updated_at: adesso },
    { onConflict: 'user_id,lunedi' },
  );
  let settimana = weekNumber;
  if (!settimana) {
    const { data: p } = await supabaseAdmin.from('profiles').select('current_week').eq('user_id', userId).maybeSingle();
    settimana = (p as { current_week?: number } | null)?.current_week || 1;
  }
  const vecchia = await supabaseAdmin.from('user_weekly_calendar').upsert(
    { user_id: userId, week_number: settimana, training_days: giorni.trainingDays, match_days: giorni.matchDays, created_at: adesso },
    { onConflict: 'user_id,week_number' },
  );
  if (nuova.error && vecchia.error) throw vecchia.error;
  return { ok: true, tabella: !nuova.error };
}
