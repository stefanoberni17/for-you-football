/**
 * Il Coach gratis (9/11, Ste: «restare alla settimana 1 del percorso non deve prolungare indefinitamente la
 * gratuità. Distingui la durata dell'accesso gratuito dall'avanzamento nel percorso e mantieni il limite
 * complessivo di 20 messaggi nel periodo previsto»).
 *
 * La regola, uguale per la chat in app e per Telegram:
 *  - accesso pieno (beta, Season 1, Mente o Completo attivo o in tolleranza): Coach senza limite di messaggi;
 *  - PERIODO GRATIS, che dipende dal tempo e non dal percorso:
 *      · con la prova con la carta (chi si è registrato dalla data dell'interruttore): i giorni della prova del
 *        Mente o del Completo, fino a `trial_ends_at`;
 *      · senza prova (interruttore spento o iscritto prima): `FREE_COACH_GIORNI` giorni dalla registrazione;
 *    in quel periodo `FREE_COACH_MESSAGES` messaggi IN TUTTO, sommando app e Telegram;
 *  - finito il periodo, i messaggi rimasti non valgono più;
 *  - un pacchetto solo Corpo non comprende il Coach (c'è il preparatore);
 *  - in pausa o in cancellazione il Coach non risponde.
 *
 * Puro: il conteggio dei messaggi e il profilo arrivano dal chiamante (lib/serverAccess.ts → accessoCoachUtente).
 */

import { FREE_COACH_MESSAGES } from '@/lib/constants';
import {
  hasActiveAccess, inPausa, inProva, livelloFisico, pianoConMente, provaRichiesta, type BillingProfile,
} from '@/lib/checkAccess';

/** Giorni di Coach gratis dalla registrazione, per chi non passa dalla prova con la carta. */
export const FREE_COACH_GIORNI = 7;

export type MotivoCoachChiuso =
  | 'cancellazione'      // account in cancellazione
  | 'pausa'              // abbonamento in pausa
  | 'limite_gratis'      // periodo gratis in corso, 20 messaggi usati
  | 'gratis_finito'      // i 7 giorni dalla registrazione sono passati
  | 'prova_finita'       // la prova è finita senza un pagamento che apra il Mente
  | 'prova_da_iniziare'  // deve passare dalla prova con la carta e non l'ha ancora iniziata
  | 'non_nel_pacchetto'; // pacchetto solo Corpo

export type AccessoCoach =
  | { ok: true; illimitato: true }
  | { ok: true; illimitato: false; rimasti: number; fino: string | null; tipo: 'prova' | 'iscrizione' }
  | { ok: false; motivo: MotivoCoachChiuso; fino: string | null };

export type FinestraGratis = { tipo: 'prova' | 'iscrizione'; fino: string | null };

/** Il periodo gratis di questo profilo (anche se già finito), o null se non ne ha uno. */
export function finestraGratis(profile: BillingProfile | null | undefined): FinestraGratis | null {
  if (!profile) return null;
  if (provaRichiesta(profile)) {
    // Con la prova con la carta il periodo gratis È la prova del Mente (o del Completo): una sola per persona
    if (inProva(profile) || (profile.trial_ends_at && pianoConMente(profile))) {
      return { tipo: 'prova', fino: profile.trial_ends_at ?? null };
    }
    return null;
  }
  if (!profile.created_at) return null;
  const da = new Date(profile.created_at).getTime();
  if (!Number.isFinite(da)) return null;
  return { tipo: 'iscrizione', fino: new Date(da + FREE_COACH_GIORNI * 86_400_000).toISOString() };
}

/**
 * Può scrivere al Coach adesso? `usati` = messaggi già mandati al Coach su TUTTI i canali (eventi
 * `coach_message_sent`). Con `paywall: false` (Stripe non configurato) il Coach è aperto, come il resto.
 */
export function accessoCoach(
  profile: BillingProfile | null | undefined,
  o: { usati: number; adesso?: number; paywall?: boolean },
): AccessoCoach {
  const adesso = o.adesso ?? Date.now();
  if (o.paywall === false) return { ok: true, illimitato: true };
  if (profile?.deleted_at) return { ok: false, motivo: 'cancellazione', fino: null };
  if (inPausa(profile, adesso)) return { ok: false, motivo: 'pausa', fino: profile?.pausa_fino ?? null };
  if (hasActiveAccess(profile)) return { ok: true, illimitato: true };

  const f = finestraGratis(profile);
  const fineMs = f?.fino ? new Date(f.fino).getTime() : null;
  // Una prova senza data di fine (non dovrebbe succedere) vale finché Stripe la dice in corso
  const aperta = !!f && (fineMs === null ? f.tipo === 'prova' && inProva(profile) : adesso < fineMs);
  if (f && aperta) {
    if (o.usati >= FREE_COACH_MESSAGES) return { ok: false, motivo: 'limite_gratis', fino: f.fino };
    return { ok: true, illimitato: false, rimasti: FREE_COACH_MESSAGES - o.usati, fino: f.fino, tipo: f.tipo };
  }
  // Fuori dal periodo gratis: il motivo più utile per chi legge
  const soloCorpo = !!livelloFisico(profile) && !pianoConMente(profile);
  if (soloCorpo) return { ok: false, motivo: 'non_nel_pacchetto', fino: null };
  if (f) return { ok: false, motivo: f.tipo === 'prova' ? 'prova_finita' : 'gratis_finito', fino: f.fino };
  if (provaRichiesta(profile)) {
    return profile?.trial_ends_at
      ? { ok: false, motivo: 'prova_finita', fino: profile.trial_ends_at }
      : { ok: false, motivo: 'prova_da_iniziare', fino: null };
  }
  return { ok: false, motivo: 'gratis_finito', fino: null };
}

const dataBreve = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'Europe/Rome' }) : null;
};

/** Il testo per il ragazzo quando il Coach non risponde (chat e Telegram). */
export function testoCoachChiuso(motivo: MotivoCoachChiuso, fino: string | null): string {
  const d = dataBreve(fino);
  switch (motivo) {
    case 'cancellazione':
      return 'Il tuo account è in cancellazione. Se ci hai ripensato, riattivalo dall\'app: poi torniamo a parlare.';
    case 'pausa':
      return 'Sei in pausa: il Coach ti aspetta quando riprendi. Intanto la tua Carta e le tue risposte restano lì.';
    case 'limite_gratis':
      return `Questi erano i tuoi ${FREE_COACH_MESSAGES} messaggi gratis${d ? ` (valevano fino al ${d})` : ''}. Con il Mente o il Completo il Coach c'è sempre, qui e su Telegram.`;
    case 'gratis_finito':
      return `I messaggi gratis con il Coach valevano per i primi ${FREE_COACH_GIORNI} giorni${d ? `, fino al ${d}` : ''}. Con il Mente o il Completo il Coach c'è sempre, qui e su Telegram.`;
    case 'prova_finita':
      return `La prova è finita${d ? ` il ${d}` : ''}. Con il Mente o il Completo il Coach c'è sempre, qui e su Telegram.`;
    case 'prova_da_iniziare':
      return `Il Coach si apre con la prova di 7 giorni: dentro ci sono ${FREE_COACH_MESSAGES} messaggi gratis.`;
    case 'non_nel_pacchetto':
      return 'Il Coach della testa è nel Mente e nel Completo. Nel tuo pacchetto c\'è il preparatore del Corpo, nella Chat della parte Corpo.';
  }
}
