/**
 * Consenso documenti legali — helper di lettura (server-only).
 *
 * Scrittura: solo /api/register (channel 'registration') e, in futuro, il
 * flusso di ri-accettazione (channel 'reaccept'). Append-only, mai UPDATE.
 *
 * Il banner di ri-accettazione NON è ancora attivo (spec intervento 2.4):
 * qui c'è solo la funzione di lettura che lo alimenterà. Finché
 * PRIVACY_VERSION / TERMS_VERSION restano vuote, needsReacceptance ritorna
 * sempre false — il flusso si accende da solo quando le versioni verranno
 * compilate in lib/constants.ts.
 */
import { createClient } from '@supabase/supabase-js';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/constants';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export type ConsentDocument = 'privacy' | 'terms' | 'health_data' | 'training_idoneita';
export type ConsentChannel = 'registration' | 'reaccept' | 'checkin' | 'training';
export const CONSENT_DOCUMENTS: ConsentDocument[] = ['privacy', 'terms', 'health_data', 'training_idoneita'];

/** Tipi di consenso già registrati per l'utente (una riga basta: append-only, mai revocata in-app). */
export async function getConsents(userId: string): Promise<Set<ConsentDocument>> {
  const { data } = await supabaseAdmin.from('consent_events').select('document_type').eq('user_id', userId);
  return new Set(((data || []) as { document_type: ConsentDocument }[]).map((r) => r.document_type));
}

/**
 * Registra un consenso (migration 021 per health_data / training_idoneita).
 * Ritorna il messaggio d'errore o null. Versione: PRIVACY_VERSION per i dati sulla
 * salute (sono descritti nella privacy), '' per l'autodichiarazione di idoneità.
 */
export async function recordConsent(userId: string, documentType: ConsentDocument, channel: ConsentChannel): Promise<string | null> {
  const document_version = documentType === 'privacy' || documentType === 'health_data' ? PRIVACY_VERSION : documentType === 'terms' ? TERMS_VERSION : '';
  const { error } = await supabaseAdmin.from('consent_events').insert({ user_id: userId, document_type: documentType, document_version, channel });
  if (error) console.error('🚨 CONSENT NON REGISTRATO', documentType, 'per userId', userId, ':', error.message);
  return error ? error.message : null;
}

/** Ultima versione accettata dall'utente per un documento (null = mai accettato). */
export async function getLatestAcceptedVersion(
  userId: string,
  documentType: ConsentDocument
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('consent_events')
    .select('document_version')
    .eq('user_id', userId)
    .eq('document_type', documentType)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.document_version ?? null;
}

/**
 * True se l'utente deve ri-accettare almeno un documento: la versione corrente
 * (constants) è diversa dall'ultima accettata, oppure non ha mai accettato.
 * Con le versioni correnti vuote ('') il confronto è disattivato.
 */
export async function needsReacceptance(userId: string): Promise<{
  privacy: boolean;
  terms: boolean;
  any: boolean;
}> {
  const result = { privacy: false, terms: false, any: false };

  if (PRIVACY_VERSION) {
    const accepted = await getLatestAcceptedVersion(userId, 'privacy');
    result.privacy = accepted !== PRIVACY_VERSION;
  }
  if (TERMS_VERSION) {
    const accepted = await getLatestAcceptedVersion(userId, 'terms');
    result.terms = accepted !== TERMS_VERSION;
  }
  result.any = result.privacy || result.terms;
  return result;
}
