/**
 * checkAccess — logica pura di autorizzazione paywall (client-safe).
 *
 * Dal 1/11 il Mentale è un abbonamento mensile con 7 giorni di prova (lib/abbonamento.ts):
 *  - accesso pieno (Gate, settimane 2-12, Coach senza limite, Telegram): beta, Season 1 comprata (chi l'ha già),
 *    abbonamento attivo o in tolleranza dopo un pagamento fallito (`past_due`, Stripe ritenta per 7 giorni);
 *  - in prova (`trialing`): la settimana 1, come la settimana gratis, e i messaggi gratis del Coach in app;
 *  - con la prova con carta accesa (`NEXT_PUBLIC_PROVA_CON_CARTA`) la settimana 1 si apre solo dopo aver iniziato
 *    la prova, e solo per chi si è registrato da quel giorno in poi (Ste, 2/11): chi c'era già finisce la settimana 1
 *    gratis come prima e al Gate abbona senza prova. Spenta, la settimana 1 resta gratis per tutti i registrati.
 *
 * Il time-gate nei contenuti (lib/dayUnlockLogic.ts) forza comunque il ritmo 1 giorno/giorno.
 */

import { FREE_WEEKS } from '@/lib/constants';
import { INFO_PACCHETTI, pacchettoDi, type LivelloFisico } from '@/lib/listino';

export type BillingProfile = {
  deleted_at?: string | null;   // account in cancellazione (migration 028): chiuso finché non riattiva
  is_beta_free?: boolean | null;
  subscription_status?: string | null;
  season1_access?: boolean | null;
  trial_ends_at?: string | null; // fine della prova (migration 038)
  created_at?: string | null;    // iscrizione: la prova con carta vale per chi si registra dalla data di accensione
  piano?: string | null;         // il pacchetto (lib/listino.ts): mentale, fisico_base/medio/pro, completo
  pausa_fino?: string | null;    // abbonamento in pausa fino a (migration 039): app in sola lettura
  training_access?: boolean | null; // il Campo acceso a mano (beta, Ste): vale come Fisico Pro
};

const STATI_VIVI_ACCESSO = ['trialing', 'active', 'past_due'];

/** L'abbonamento è in pausa adesso (3/11): niente addebiti, app in sola lettura, prezzo bloccato tenuto. */
export function inPausa(profile: BillingProfile | null | undefined, adesso = Date.now()): boolean {
  if (!profile?.pausa_fino) return false;
  const t = new Date(profile.pausa_fino).getTime();
  return Number.isFinite(t) && t > adesso;
}

/** Il pacchetto dell'abbonamento comprende il Mente (Mente o Completo; un abbonamento di prima del 3/11 è Mente). */
export function pianoConMente(profile: BillingProfile | null | undefined): boolean {
  return INFO_PACCHETTI[pacchettoDi(profile?.piano)].mente;
}

/**
 * Il livello del Campo di questo profilo, o null: il flag `training_access` (acceso a mano) vale Pro; altrimenti il
 * Fisico del pacchetto con un abbonamento vivo (in prova, attivo o in tolleranza). In pausa il livello resta: è la
 * pausa a chiudere le scritture (`inPausa`).
 */
export function livelloFisico(profile: BillingProfile | null | undefined): LivelloFisico | null {
  if (!profile || profile.deleted_at) return null;
  if (profile.training_access) return 'pro';
  if (!STATI_VIVI_ACCESSO.includes(profile.subscription_status ?? '')) return null;
  return INFO_PACCHETTI[pacchettoDi(profile.piano)].fisico;
}

/** Il Campo è in prova (7 giorni con la carta, senza il flag a mano). */
export function fisicoInProva(profile: BillingProfile | null | undefined): boolean {
  return !profile?.training_access && profile?.subscription_status === 'trialing' && livelloFisico(profile) != null;
}

/**
 * Ritorna true se l'utente può accedere ai contenuti a pagamento.
 *  1. Nessun profilo → no
 *  2. is_beta_free → sì (beta tester, comp, partner)
 *  3. season1_access → sì (Season 1 comprata prima del 1/11)
 *  4. subscription_status 'active' o 'past_due' (tolleranza) → sì
 *  5. 'trialing', 'unpaid', 'canceled', 'none' → no
 */
export function hasActiveAccess(profile: BillingProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.is_beta_free) return true;
  if (profile.season1_access) return true;
  // Dal 3/11 un abbonamento può essere solo Fisico: il Mente c'è solo nel Mente e nel Completo, e non in pausa
  if (!pianoConMente(profile) || inPausa(profile)) return false;
  return profile.subscription_status === 'active' || profile.subscription_status === 'past_due';
}

/** In prova sul Mente: la settimana 1 aperta, il resto dopo il primo pagamento. */
export function inProva(profile: BillingProfile | null | undefined): boolean {
  return profile?.subscription_status === 'trialing' && pianoConMente(profile) && !inPausa(profile);
}

/** Accesso pieno oppure prova in corso (Mente o Fisico): il ritorno dal checkout è andato a buon fine. */
export function haAccessoOProva(profile: BillingProfile | null | undefined): boolean {
  return hasActiveAccess(profile) || inProva(profile) || (!!livelloFisico(profile) && !profile?.training_access);
}

/** Il giorno da cui vale la prova con carta se l'interruttore è "1" (Ste, 2/11: "solo per chi si registra da oggi"). */
export const PROVA_CON_CARTA_DAL_DEFAULT = '2026-11-02';

/**
 * La prova con carta è accesa? Da quale giorno di iscrizione? Interruttore su Vercel, letto anche dal server:
 * `NEXT_PUBLIC_PROVA_CON_CARTA=1` → da PROVA_CON_CARTA_DAL_DEFAULT; `=2026-11-10` → da quel giorno; vuoto → spenta.
 */
export function provaConCartaDal(): string | null {
  const v = (process.env.NEXT_PUBLIC_PROVA_CON_CARTA || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return v === '1' ? PROVA_CON_CARTA_DAL_DEFAULT : null;
}

export function provaConCarta(): boolean {
  return provaConCartaDal() !== null;
}

/**
 * Per questo profilo la settimana 1 chiede la prova con la carta? Solo se l'interruttore è acceso e si è registrato
 * da quel giorno (mezzanotte italiana). Senza data di iscrizione vale come chi c'era già: settimana 1 aperta.
 */
export function provaRichiesta(profile: BillingProfile | null | undefined): boolean {
  const dal = provaConCartaDal();
  if (!dal || !profile?.created_at) return false;
  const iscritto = new Date(profile.created_at).getTime();
  return Number.isFinite(iscritto) && iscritto >= new Date(`${dal}T00:00:00+01:00`).getTime();
}

/**
 * Feature flag client-side: Stripe configurato?
 * Usa `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` come proxy (gli altri env sono server-only).
 */
export function isPaywallActive(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

/** Dopo il checkout: l'utente è ancora senza niente (né accesso né prova)? */
export function shouldRedirectToPaywall(profile: BillingProfile | null | undefined): boolean {
  if (!isPaywallActive()) return false;
  return !haAccessoOProva(profile);
}

/**
 * La settimana `week` è aperta? Pagante sempre; le prime FREE_WEEKS settimane a chi è in prova, oppure a chi non
 * deve passare dalla prova (interruttore spento, o iscritto prima della data). Il gate (giorno 7) resta a pagamento: requirePaidAccess.
 */
export function canAccessWeek(profile: BillingProfile | null | undefined, week: number): boolean {
  if (!isPaywallActive()) return true;
  if (hasActiveAccess(profile)) return true;
  if (week > FREE_WEEKS) return false;
  return provaRichiesta(profile) ? inProva(profile) : true;
}

/** Rotte che restano a pagamento anche nella settimana gratis (usato dal PaywallGuard). */
export function isPaidRoute(pathname: string): boolean {
  if (pathname === '/chat' || pathname.startsWith('/week-complete/')) return true;
  const m = pathname.match(/^\/(giorno|settimana)\/(\d+)/);
  if (m) return parseInt(m[2]) > FREE_WEEKS || provaConCarta();
  return false;
}

/** Il PaywallGuard deve mandare questa pagina a /pricing? (/chat mostra il suo messaggio in pagina.) */
export function deveAndareAlPaywall(pathname: string, profile: BillingProfile | null | undefined): boolean {
  if (!isPaywallActive() || pathname === '/chat') return false;
  if (pathname.startsWith('/week-complete/')) return !hasActiveAccess(profile);
  const m = pathname.match(/^\/(giorno|settimana)\/(\d+)/);
  if (m) return !canAccessWeek(profile, parseInt(m[2]));
  return false;
}
