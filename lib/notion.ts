/**
 * Notion API helper — For You Football
 *
 * Usa fetch diretto (non SDK) per evitare problemi di compatibilità.
 * Tutte le chiamate Notion passano da qui.
 */

const NOTION_VERSION = '2022-06-28';
const NOTION_BASE = 'https://api.notion.com/v1';

function notionHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN ?? ''}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  };
}

// ─── Query database ───────────────────────────────────────────────────────────

export async function queryDatabase(
  databaseId: string,
  body: Record<string, unknown> = {}
): Promise<any[]> {
  const results: any[] = [];
  let startCursor: string | undefined;

  do {
    const payload: Record<string, unknown> = { ...body };
    if (startCursor) payload.start_cursor = startCursor;

    const res = await fetch(`${NOTION_BASE}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Notion queryDatabase error: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    results.push(...(data.results || []));
    startCursor = data.has_more ? data.next_cursor : undefined;
  } while (startCursor);

  return results;
}

// ─── Fetch singola pagina ─────────────────────────────────────────────────────

export async function fetchPage(pageId: string): Promise<any> {
  const res = await fetch(`${NOTION_BASE}/pages/${pageId}`, {
    headers: notionHeaders(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Notion fetchPage error: ${JSON.stringify(err)}`);
  }

  return res.json();
}

// ─── Helpers proprietà ───────────────────────────────────────────────────────

/** Testo da rich_text property. Sostituisce <br> con \n */
export function richText(prop: any): string {
  return (prop?.rich_text?.[0]?.plain_text || '').replace(/<br>/g, '\n');
}

/** Testo da title property */
export function titleText(prop: any): string {
  return prop?.title?.[0]?.plain_text || '';
}

/** Numero da number property */
export function num(prop: any): number {
  return prop?.number ?? 0;
}

/** Valore da select property */
export function select(prop: any): string {
  return prop?.select?.name || '';
}

/** Booleano da checkbox property */
export function checkbox(prop: any): boolean {
  return prop?.checkbox ?? false;
}

/** Array di stringhe da rich_text separato da \n */
export function richTextLines(prop: any): string[] {
  const text = richText(prop);
  return text ? text.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

// ─── Mapping strutturati ──────────────────────────────────────────────────────

/** Mappa una pagina Notion DB Settimane → oggetto Football */
export function mapSettimana(page: any) {
  const p = page.properties;
  return {
    id: page.id,
    weekNumber: num(p['Numero Settimana']),
    titolo: titleText(p['Titolo']),
    principio: select(p['Principio']),
    strumento: richText(p['Strumento']),
    blocco: select(p['Blocco']),
    descrizionIntro: richText(p['Descrizione Intro']),
    obiettivoSettimana: richText(p['Obiettivo Settimana']),
    messaggioChiusura: richText(p['Messaggio Chiusura']),
    coachContesto: richText(p['Coach Contesto']),
    stato: select(p['Stato']),
    mantraDashboard: richText(p['Mantra Dashboard']),
    praticaPrePartita: richText(p['Pratica Pre Partita']),
    fraseSettimana: richText(p['Frase Settimana']),
  };
}

/** Mappa una pagina Notion DB Giorni → oggetto Football */
export function mapGiorno(page: any) {
  const p = page.properties;
  return {
    id: page.id,
    weekNumber: num(p['Numero Settimana']),
    dayNumber: num(p['Numero Giorno']),
    titolo: titleText(p['Titolo']),
    apertura: richText(p['Apertura']),
    pratica: richText(p['Pratica']),
    durataMinuti: num(p['Durata Minuti']),
    haNotaCampo: checkbox(p['Ha Nota Campo']),
    notaCampo: richText(p['Nota Campo']),
    domanda: richText(p['Domanda']),
    isGate: checkbox(p['È Gate']),
    isEsercizioPrincipale: checkbox(p['È Esercizio Principale']),
    domandeGate: richTextLines(p['Domande Gate']), // array di 3 stringhe
    tipoGiorno: select(p['Tipo Giorno']),
    haCheckPrecedente: checkbox(p['Ha Check Precedente']),
    testoCheck: richText(p['Testo Check']),
    contesto: richText(p['Contesto']),
    domandaPrePratica: richText(p['Domanda Pre Pratica']),
  };
}
