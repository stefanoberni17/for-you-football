/**
 * Eventi prodotto (sere 6-7, review 13/9) — tabella `onboarding_events` (migration 008),
 * riusata per tutto il funnel: signup → G1 → primo Reset → primo messaggio al Coach → G7,
 * più vendita (pricing/checkout/pagamento) e attività giornaliera (app_open, per D7/D28).
 *
 * Server-only (service role). Fire-and-forget: NON lancia mai, non blocca mai la
 * risposta all'utente. Le viste SQL in docs/migrations/022_events_views.sql leggono da qui.
 */
import { createClient } from '@supabase/supabase-js';

export const SERVER_EVENTS = [
  'signup_completed',
  'checkin_saved',
  'day_completed',
  'gate_completed',
  'coach_message_sent',
  'checkout_started',
  'payment_completed',
  'trial_started',            // Mentale (1/11): prova di 7 giorni iniziata con la carta (meta.prezzo)
  'trial_canceled',           // disdetta durante la prova
  'subscription_canceled',    // abbonamento chiuso dopo la prova (disdetta o pagamenti falliti)
  'trial_reminder_sent',      // email e push prima della fine della prova (meta.email, meta.push)
  'lista_attesa',             // iscrizioni chiuse o tetto pieno: "Avvisami quando riapre" (meta.motivo)
  'codice_accettato',         // prezzi (3/11): «Hai un codice da un amico?» con un codice buono (meta.codice)
  'codice_rifiutato',         // codice non valido, scaduto, senza data di fine o esaurito (meta.motivo)
  'piano_cambiato',           // pacchetti (3/11): cambio di pacchetto con conguaglio (meta.da, meta.a, meta.tipo)
  'pausa_iniziata',           // pausa dell'abbonamento (meta.tipo standard | infortunio, meta.fino)
  'pausa_finita',             // ripresa (meta.anticipata)
  'pausa_richiesta',          // pausa per infortunio chiesta (Ste la approva su Telegram)
  'invito_premiato',          // 10 € di credito a chi invita (meta.invito)
  'riprogrammazione',         // il Campo (3/11): una riprogrammazione chiesta dall'atleta, contata per livello
  'preparatore_messaggio',    // il Campo (3/11): un messaggio al preparatore, contato per livello (Medio 10 al mese)
  'push_enabled',
  'training_aspetto_tenuto', // strato mese (7/10): "sì, tienilo" a un aspetto sempre saltato (meta.focus)
  'training_aspetto_tolto',  // "no, toglilo": l'obiettivo esce dal setup (meta.focus)
  'training_resoconto_salvato', // resoconto dopo squadra/partita (19/10): meta.tipo, meta.livello
  'esercizio_fatto',          // l'esercizio della settimana (31/10): "Fatto oggi" (meta.week, meta.giorni)
  'esercizio_notifiche_on',   // notifiche dell'esercizio riaccese
  'esercizio_notifiche_off',  // notifiche dell'esercizio spente
  'esercizio_notifica',       // una notifica dell'esercizio mandata dal cron del mattino o della sera (meta.tipo, meta.canale)
] as const;

/** Eventi che il client può loggare via POST /api/onboarding/event (whitelist). */
export const CLIENT_EVENTS = [
  'slide_view',
  'telegram_collega_click',
  'onboarding_started_percorso',
  'ritual_completed',
  'reset_completed',
  'pricing_view',
  'app_open',
  'campo_interesse', // "Mi interessa" sulla pagina del Fisico bloccato (20/10): chi vuole il Campo prima che sia in vendita
] as const;

export type ServerEvent = (typeof SERVER_EVENTS)[number];

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export function logEvent(userId: string, event: ServerEvent, meta?: Record<string, unknown>): void {
  try {
    supabaseAdmin
      .from('onboarding_events')
      .insert({ user_id: userId, event, meta: meta ?? null })
      .then(({ error }) => { if (error) console.error(`[events] ${event}:`, error.message); }, () => {});
  } catch { /* mai bloccante */ }
}
