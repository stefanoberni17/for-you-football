import { createClient } from '@supabase/supabase-js';
import { fisicoInProva, inPausa, livelloFisico } from './checkAccess';
import { REGOLE_LIVELLO, inizioFinestra, messaggiPreparatoreRimasti, riprogrammazioniRimaste, RIPROGRAMMAZIONI_IN_PROVA, type LivelloFisico, type RegoleLivello } from './listino';

/**
 * Chi entra nel Campo e a che livello (3/11): il Fisico del pacchetto (Base, Medio, Pro; il Completo è Pro) con un
 * abbonamento vivo, oppure il flag `profiles.training_access` acceso a mano (beta, migration 015), che vale Pro.
 * In pausa il Campo si guarda (storico, Carta) ma non si scrive: niente piani nuovi, sedute, test, chat.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export interface AccessoCampo {
  livello: LivelloFisico;
  regole: RegoleLivello;
  /** In prova (7 giorni con la carta): al massimo una riprogrammazione. */
  inProva: boolean;
  /** Fine della prova (per contare le riprogrammazioni della prova). */
  provaFino: string | null;
  /** In pausa: sola lettura. */
  inPausa: boolean;
  pausaFino: string | null;
  /** Acceso a mano (beta): nessun tetto da pacchetto. */
  manuale: boolean;
}

/** L'accesso al Campo di un utente, o null se non ce l'ha. Senza le colonne della 038/039 vale il solo flag. */
export async function accessoCampo(userId: string): Promise<AccessoCampo | null> {
  let { data, error } = await supabaseAdmin
    .from('profiles')
    .select('training_access, subscription_status, piano, pausa_fino, trial_ends_at, deleted_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    ({ data, error } = await supabaseAdmin
      .from('profiles')
      .select('training_access, subscription_status, piano, trial_ends_at, deleted_at')
      .eq('user_id', userId)
      .maybeSingle() as never);
  }
  if (error) {
    ({ data, error } = await supabaseAdmin.from('profiles').select('training_access').eq('user_id', userId).maybeSingle() as never);
  }
  if (error || !data) return null;
  const p = data as {
    training_access?: boolean | null; subscription_status?: string | null; piano?: string | null;
    pausa_fino?: string | null; trial_ends_at?: string | null; deleted_at?: string | null;
  };
  const livello = livelloFisico(p);
  if (!livello) return null;
  const pausa = inPausa(p);
  return {
    livello,
    regole: REGOLE_LIVELLO[livello],
    inProva: fisicoInProva(p),
    provaFino: fisicoInProva(p) ? p.trial_ends_at ?? null : null,
    inPausa: pausa,
    pausaFino: pausa ? p.pausa_fino ?? null : null,
    manuale: !!p.training_access,
  };
}

/** Può leggere il Campo (anche in pausa). */
export async function hasTrainingAccess(userId: string): Promise<boolean> {
  return (await accessoCampo(userId)) != null;
}

/** Può scrivere nel Campo: accesso e non in pausa. */
export async function puoScrivereCampo(userId: string): Promise<{ ok: true; accesso: AccessoCampo } | { ok: false; motivo: 'no_access' | 'in_pausa' }> {
  const a = await accessoCampo(userId);
  if (!a) return { ok: false, motivo: 'no_access' };
  if (a.inPausa) return { ok: false, motivo: 'in_pausa' };
  return { ok: true, accesso: a };
}

/** Quante volte un evento è stato registrato da `dal` (ISO): riprogrammazioni e messaggi al preparatore. */
export async function contaEventi(userId: string, evento: string, dal: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('onboarding_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event', evento)
    .gte('created_at', dal);
  return error ? 0 : count ?? 0;
}

/** Oggi a Roma, AAAA-MM-GG. */
function oggiRoma(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

/**
 * Le riprogrammazioni rimaste per il livello (Ste, 3/11): Base 1 al mese, Medio 2 al mese, Pro 2 a settimana (tetto
 * tecnico); in prova 1. Contano solo i piani chiesti dall'atleta e riusciti (evento `riprogrammazione`): il piano
 * automatico del lunedì, i riallineamenti al calendario e i piani di sicurezza no. Null = nessun tetto da pacchetto
 * (accesso a mano: vale il tetto tecnico settimanale di prima).
 */
export async function riprogrammazioni(userId: string, a: AccessoCampo): Promise<{ rimaste: number; max: number; per: 'mese' | 'settimana' | 'prova' } | null> {
  if (a.manuale) return null;
  if (a.inProva) {
    const inizio = a.provaFino ? new Date(new Date(a.provaFino).getTime() - 8 * 86_400_000).toISOString() : new Date(Date.now() - 8 * 86_400_000).toISOString();
    const usate = await contaEventi(userId, 'riprogrammazione', inizio);
    return { rimaste: riprogrammazioniRimaste(a.livello, { usate: 0, inProva: true, usateInProva: usate }), max: RIPROGRAMMAZIONI_IN_PROVA, per: 'prova' };
  }
  const { quante, per } = a.regole.riprogrammazioni;
  const dal = `${inizioFinestra(oggiRoma(), per)}T00:00:00+01:00`;
  const usate = await contaEventi(userId, 'riprogrammazione', new Date(dal).toISOString());
  return { rimaste: riprogrammazioniRimaste(a.livello, { usate, inProva: false, usateInProva: 0 }), max: quante, per };
}

/** I messaggi al preparatore rimasti nel mese (null = liberi; 0 al Base: la chat non c'è). */
export async function messaggiPreparatore(userId: string, a: AccessoCampo): Promise<{ rimasti: number | null; max: number | null }> {
  if (a.manuale) return { rimasti: null, max: null };
  const max = a.regole.preparatoreMese;
  if (max == null) return { rimasti: null, max: null };
  if (max === 0) return { rimasti: 0, max: 0 };
  const dal = new Date(`${inizioFinestra(oggiRoma(), 'mese')}T00:00:00+01:00`).toISOString();
  return { rimasti: messaggiPreparatoreRimasti(a.livello, await contaEventi(userId, 'preparatore_messaggio', dal)), max };
}
