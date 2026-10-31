/**
 * L'esercizio della settimana, le letture (31/10). Le regole stanno in lib/esercizioSettimana.ts (puro).
 * Fail-soft: senza la migration 037 il banner c'è (testo da Notion, G1 dal percorso) ma senza spunte né sveglia.
 */
import { createClient } from '@supabase/supabase-js';
import { WEEK_RECORD_IDS } from './constants';
import { fetchPage, mapSettimana } from './notion';
import { dateItaly, todayItaly } from './dateItaly';
import { esercizioVisibile, fineSvegliaMin, haSveglia } from './esercizioSettimana';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export interface EsercizioStato {
  week: number;
  testo: string;
  visibile: boolean;
  g1FattoIl: string | null;
  fattoOggi: boolean;
  giorni: number;
  sveglia: { settimana: boolean; fineMin: number | null; ora: string | null };
  notifiche: boolean;
  /** false = la migration 037 non c'è: si legge ma non si salva */
  salvataggio: boolean;
}

/** Il testo dell'esercizio della settimana da Notion (in cache come il resto). '' se manca. */
export async function testoEsercizio(week: number): Promise<string> {
  const id = WEEK_RECORD_IDS[week];
  if (!id) return '';
  try {
    return (mapSettimana(await fetchPage(id)).esercizioSettimana || '').trim();
  } catch (e) {
    console.error('testoEsercizio:', (e as Error).message);
    return '';
  }
}

export async function loadEsercizio(userId: string): Promise<EsercizioStato | null> {
  const { data: profile } = await supabaseAdmin.from('profiles').select('current_week').eq('user_id', userId).maybeSingle();
  const week = Number(profile?.current_week) || 1;
  if (week < 1 || week > 12) return null;
  const oggi = todayItaly();
  const [testo, { data: g1 }, fatte, sveglia, notifiche] = await Promise.all([
    testoEsercizio(week),
    supabaseAdmin.from('user_day_progress').select('completed_at').eq('user_id', userId).eq('week_number', week).eq('day_number', 1).eq('completed', true).maybeSingle(),
    supabaseAdmin.from('user_esercizio_fatto').select('data').eq('user_id', userId).eq('week_number', week),
    supabaseAdmin.from('user_esercizio_sveglia').select('ora').eq('user_id', userId).eq('week_number', week).maybeSingle(),
    supabaseAdmin.from('profiles').select('esercizio_notifiche').eq('user_id', userId).maybeSingle(),
  ]);
  const g1FattoIl = g1?.completed_at ? dateItaly(g1.completed_at) : null;
  const date = (fatte.data || []).map((r: { data: string }) => r.data);
  return {
    week,
    testo,
    visibile: esercizioVisibile({ testo, g1Fatto: !!g1FattoIl }),
    g1FattoIl,
    fattoOggi: date.includes(oggi),
    giorni: new Set(date).size,
    sveglia: { settimana: haSveglia(week), fineMin: fineSvegliaMin(week), ora: (sveglia.data as { ora?: string } | null)?.ora ?? null },
    notifiche: notifiche.error ? true : (notifiche.data as { esercizio_notifiche?: boolean } | null)?.esercizio_notifiche !== false,
    salvataggio: !fatte.error,
  };
}
