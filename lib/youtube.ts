/**
 * Video di YouTube senza cookie finché il ragazzo non lo chiede (5/11, controllo privacy).
 * - L'embed passa da youtube-nocookie.com (YouTube non salva cookie finché il video non parte).
 * - Il riquadro si carica solo dopo il primo "Apri il video": prima nessuna richiesta parte verso Google.
 *   La scelta resta sul dispositivo (`localStorage['video.youtube.ok']`): dopo, i video si aprono come prima.
 */

const CHIAVE = 'video.youtube.ok';

/** Id del video da un URL YouTube (watch, shorts, youtu.be, embed). */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/** L'indirizzo dell'embed senza cookie, o null se l'URL non è di YouTube. */
export function youtubeEmbedUrl(url?: string | null): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** Il ragazzo ha già detto di sì ai video di YouTube su questo dispositivo? */
export function youtubeConsentito(): boolean {
  try { return localStorage.getItem(CHIAVE) === '1'; } catch { return false; }
}

export function consentiYoutube(): void {
  try { localStorage.setItem(CHIAVE, '1'); } catch { /* senza memoria vale per questa volta */ }
}
