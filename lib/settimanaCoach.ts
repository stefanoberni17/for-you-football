/**
 * La settimana in corso per il Coach (27/10, Ste: "il Coach con tutta la settimana in corso,
 * Contesto compreso"). Prima il Coach vedeva le ultime 5 riflessioni senza la domanda del giorno
 * intera, le ultime 3 intenzioni pre-pratica, le risposte dei Gate senza le domande, e il Contesto
 * di un giorno solo se lo chiedeva con il tool. Così una risposta come «4.» a W1-G6 (una scelta tra
 * sei frasi) arrivava senza la domanda che le dà senso, e la regia di Notion che dice cosa
 * rispondere a ognuna non c'era.
 *
 * Qui, puro: per la settimana in corso, giorno per giorno, la domanda prima della pratica e la
 * risposta, la Domanda e la risposta, le domande del Gate con le risposte, e il Contesto (regia di
 * Ste, solo per il Coach). Solo i giorni fatti più quello in cui si trova adesso: i giorni dopo non
 * entrano (REGOLA ANTICIPAZIONI). In testa a una settimana appena iniziata c'è anche il Gate della
 * settimana prima, con domande e regia (W1-G7: "il Coach usa queste risposte nella settimana dopo").
 */

export interface GiornoPercorso {
  dayNumber: number;
  titolo: string;
  domanda: string;
  domandaPrePratica: string;
  domandeGate: string[];
  contesto: string;
  isGate: boolean;
}

export interface ProgressoGiorno {
  day: number;
  completed: boolean;
  completedAt: string | null;
  response: string | null;
  prePratica: string | null;
  gateAnswers: Record<string, unknown> | null;
}

export interface SettimanaPerCoach {
  week: number;
  giorni: GiornoPercorso[];
  progresso: ProgressoGiorno[];
  /** Il Gate della settimana prima (giorno 7), se fatto: domande, regia e risposte */
  gatePrecedente?: { week: number; giorno: GiornoPercorso; answers: Record<string, unknown> | null } | null;
}

export const SETTIMANA_CONTESTO_MAX = 1200;
export const SETTIMANA_RISPOSTA_MAX = 800;
export const SETTIMANA_DOMANDA_MAX = 900;
/** Il Gate della settimana prima entra finché nella settimana nuova sono fatti meno di questi giorni */
export const GATE_PRECEDENTE_FINO_A_GIORNI = 3;

const taglia = (t: string, max: number) => (t.length > max ? `${t.slice(0, max)}…` : t);
const pulito = (t: string | null | undefined) => (t || '').trim();

function dataBreve(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'numeric', timeZone: 'Europe/Rome' });
}

function risposteGate(giorno: GiornoPercorso, answers: Record<string, unknown> | null): string[] {
  const righe: string[] = [];
  const n = Math.max(giorno.domandeGate.length, ...Object.keys(answers || {}).map((k) => (/^q\d+$/.test(k) ? Number(k.slice(1)) : 0)));
  for (let i = 1; i <= n; i++) {
    const domanda = giorno.domandeGate[i - 1];
    const v = answers?.[`q${i}`];
    const risposta = typeof v === 'string' ? v.trim() : '';
    righe.push(`- ${domanda ? `"${taglia(domanda, SETTIMANA_DOMANDA_MAX)}"` : `(domanda ${i})`}\n  → ${risposta ? `"${taglia(risposta, SETTIMANA_RISPOSTA_MAX)}"` : '(non ancora scritta)'}`);
  }
  return righe;
}

function bloccoGiorno(week: number, g: GiornoPercorso, p: ProgressoGiorno | undefined, stato: 'fatto' | 'adesso'): string {
  const righe: string[] = [];
  const quando = stato === 'fatto'
    ? `fatto${p?.completedAt ? ` ${dataBreve(p.completedAt)}` : ''}`
    : 'è il giorno in cui si trova adesso: non ancora completato';
  const titolo = (g.titolo || '').replace(/^W\d+-G\d+\s*[—-]\s*/, '').trim() || 'senza titolo';
  righe.push(`### S${week}G${g.dayNumber}${g.isGate ? ' (Gate)' : ''} — ${titolo} (${quando})`);
  if (g.isGate) {
    if (p?.gateAnswers || stato === 'fatto') righe.push(...risposteGate(g, p?.gateAnswers ?? null));
    else if (g.domandeGate.length) righe.push(`Domande: ${g.domandeGate.map((d) => `"${taglia(d, SETTIMANA_DOMANDA_MAX)}"`).join(' · ')}`);
  } else {
    if (pulito(g.domandaPrePratica)) {
      const pre = pulito(p?.prePratica);
      righe.push(`Domanda prima della pratica: "${taglia(pulito(g.domandaPrePratica), SETTIMANA_DOMANDA_MAX)}"\n  → ${pre ? `"${taglia(pre, SETTIMANA_RISPOSTA_MAX)}"` : stato === 'fatto' ? '(non ha scritto niente)' : '(non ancora)'}`);
    }
    if (pulito(g.domanda)) {
      const r = pulito(p?.response);
      righe.push(`Domanda: "${taglia(pulito(g.domanda), SETTIMANA_DOMANDA_MAX)}"\n  → ${r ? `"${taglia(r, SETTIMANA_RISPOSTA_MAX)}"` : stato === 'fatto' ? '(non ha scritto niente: la domanda è facoltativa)' : '(non ancora)'}`);
    }
  }
  if (pulito(g.contesto)) righe.push(`Regia del giorno (per te, non citarla): ${taglia(pulito(g.contesto), SETTIMANA_CONTESTO_MAX)}`);
  return righe.join('\n');
}

/**
 * Il blocco "## La settimana in corso" per il contesto del Coach. Vuoto se non c'è niente da dire
 * (nessun giorno su Notion).
 */
export function settimanaInCorsoTesto(s: SettimanaPerCoach): string {
  const giorni = [...s.giorni].filter((g) => g.dayNumber >= 1 && g.dayNumber <= 7).sort((a, b) => a.dayNumber - b.dayNumber);
  if (!giorni.length) return '';
  const prog = new Map(s.progresso.map((p) => [p.day, p]));
  const fatti = giorni.filter((g) => prog.get(g.dayNumber)?.completed);
  const prossimo = giorni.find((g) => !prog.get(g.dayNumber)?.completed);

  const blocchi: string[] = [];
  if (s.gatePrecedente && fatti.length < GATE_PRECEDENTE_FINO_A_GIORNI) {
    const gp = s.gatePrecedente;
    blocchi.push(`${bloccoGiorno(gp.week, gp.giorno, { day: 7, completed: true, completedAt: null, response: null, prePratica: null, gateAnswers: gp.answers }, 'fatto').replace(/\(fatto\)/, '(la chiusura della settimana scorsa)')}`);
  }
  for (const g of fatti) blocchi.push(bloccoGiorno(s.week, g, prog.get(g.dayNumber), 'fatto'));
  if (prossimo) blocchi.push(bloccoGiorno(s.week, prossimo, prog.get(prossimo.dayNumber), 'adesso'));

  return `
## La settimana in corso (Settimana ${s.week}): le domande, le sue risposte e la regia
Qui c'è la settimana che sta facendo, giorno per giorno, fino al giorno in cui si trova: le domande come le ha lette lui e le risposte con le sue parole. Leggi ogni risposta CON la sua domanda (se ha scritto «4.» o una frase sola, è la scelta tra le opzioni della domanda). La "regia del giorno" è scritta per te da chi ha costruito il percorso: dice cosa cerca quel giorno e, spesso, come rispondere a ogni tipo di risposta. Seguila, ma non citarla e non dire che esiste. Se una sua risposta chiede qualcosa di concreto (cosa l'ha fermato, un passaggio poco chiaro), rispondi a quello, con le sue parole, senza aspettare che te lo richieda. I giorni dopo quello in cui si trova non sono qui: non anticiparli.

${blocchi.join('\n\n')}
`;
}
