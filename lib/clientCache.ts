'use client';

/**
 * Cache sul dispositivo per i CONTENUTI del percorso (Notion: settimane, giorni,
 * schede SOS). Sono uguali per tutti e cambiano di rado (il server li tiene già
 * in cache 1 h), ma sono la chiamata più lenta di ogni pagina: con la cache il
 * ritorno su una pagina già vista non aspetta Notion.
 *
 * Regole:
 * - SOLO contenuto, mai stato dell'utente (giorni fatti, check-in, azioni, piani).
 * - Si salva solo una risposta 200: un 403 (settimana a pagamento) non entra mai.
 * - Scade da sola (CONTENT_TTL_MS) e si svuota al logout (clearContentCache).
 * - Fail-soft: se lo storage non c'è o è pieno, si va in rete come prima.
 */
const PREFIX = 'fyf.content.v1:';
export const CONTENT_TTL_MS = 30 * 60 * 1000;

interface Entry<T> { t: number; v: T }

export function readCache<T>(key: string, maxAgeMs: number = CONTENT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const e = JSON.parse(raw) as Entry<T>;
    if (!e || typeof e.t !== 'number' || Date.now() - e.t > maxAgeMs) return null;
    return e.v;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value } satisfies Entry<T>));
  } catch { /* storage pieno o non disponibile: si vive senza cache */ }
}

export function clearContentCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* no-op */ }
}

/**
 * Ritorna il JSON in cache se ancora fresco, altrimenti chiama `fetcher`.
 * Comportamento identico a `(await fetcher()).json()` per chi lo usa: la
 * risposta viene restituita anche se non è ok (come prima), ma si salva solo
 * se `res.ok`. Errore di rete → null.
 */
export async function cachedJson<T>(key: string, fetcher: () => Promise<Response>, maxAgeMs: number = CONTENT_TTL_MS): Promise<T | null> {
  const hit = readCache<T>(key, maxAgeMs);
  if (hit !== null) return hit;
  try {
    const res = await fetcher();
    const json = (await res.json()) as T;
    if (res.ok) writeCache(key, json);
    return json;
  } catch {
    return null;
  }
}
