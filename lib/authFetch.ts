'use client';

import { supabase } from '@/lib/supabase';

/**
 * fetch con Authorization: Bearer <token> della sessione Supabase corrente.
 * Da usare per tutte le chiamate alle API interne autenticate: il server
 * identifica l'utente SOLO dal token (nessun userId dal client).
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
