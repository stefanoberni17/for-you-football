/**
 * La pagina di vendita pubblica (/scopri, 6/11): i testi e i prezzi per chi non è ancora entrato.
 * Modulo puro, client-safe. I testi dei pacchetti sono quelli della pagina prezzi (lib/pacchettiTesti.ts) e gli
 * importi vengono da Stripe (lib/prezziServer.ts) con le stesse regole del checkout (`prezzoPerUtente`,
 * `esitoCheckout` con un visitatore senza profilo): la pagina di vendita e la pagina prezzi non possono dire due
 * cifre diverse.
 *
 * Regole del COMMERCIALE (Notion): nessuna promessa di esito, nessun numero che non sia vero, nessuna urgenza finta,
 * nessuna testimonianza che non esiste. Si descrive il lavoro.
 */
import { esitoCheckout, prezzoPerUtente, type Impostazioni, type Prezzi, type TipoPrezzo } from './abbonamento';
import { INFO_PACCHETTI, PACCHETTI, type Pacchetto } from './listino';

/** Un momento dell'app mostrato nel telefono: l'immagine sta in public/scopri/<id>.webp (600 × 1298). */
export interface MomentoApp {
  id: string;
  parte: 'Testa' | 'Fisico';
  titolo: string;
  testo: string;
  alt: string;
}

export const MOMENTI_APP: MomentoApp[] = [
  {
    id: 'giorno',
    parte: 'Testa',
    titolo: 'Ogni giorno, pochi minuti',
    testo: "Apri il giorno: un'apertura da leggere o ascoltare, una pratica guidata con l'audio, una domanda. Un giorno alla volta: il prossimo si apre domani.",
    alt: "La pagina di un giorno del percorso: settimana 1, giorno 1, l'apertura scritta da Ste.",
  },
  {
    id: 'reset',
    parte: 'Testa',
    titolo: 'Il Reset: respiro, gesto, parola',
    testo: 'Il primo strumento del percorso. Da uno a cinque minuti la mattina, tre secondi in campo quando la testa va altrove.',
    alt: 'Il Reset in corso: il cerchio del respiro, il mantra e il tempo che manca.',
  },
  {
    id: 'coach',
    parte: 'Testa',
    titolo: 'Un Coach che ti risponde',
    testo: "Scrivigli dopo una partita storta o la sera prima. Sa a che punto sei del percorso e cosa hai scritto, e prima di consigliarti ti fa una domanda. È un'intelligenza artificiale, e te lo dice.",
    alt: 'La chat con il Coach: un giocatore racconta un rigore sbagliato, il Coach gli chiede quando torna la paura.',
  },
  {
    id: 'carta',
    parte: 'Testa',
    titolo: 'La tua Carta del Giocatore',
    testo: 'Il tuo mantra, la tua firma, il tuo Protocollo Pressione: le tue parole, scritte da te nel percorso. E il rombo a 360°: testa, recupero e corpo dagli stessi dati.',
    alt: 'La Carta del Giocatore: il rombo a sette punte con la partenza in grigio.',
  },
  {
    id: 'fisico',
    parte: 'Fisico',
    titolo: 'La settimana costruita intorno alle partite',
    testo: 'Dici quando giochi, quando ti alleni con la squadra, che attrezzi hai e su cosa vuoi lavorare. La settimana si prepara intorno alla partita, sui tuoi test.',
    alt: 'La settimana del Fisico: due sedute, gambe il venerdì e rapidità pre partita il sabato, con la partita la domenica.',
  },
  {
    id: 'seduta',
    parte: 'Fisico',
    titolo: 'La seduta, esercizio per esercizio',
    testo: 'Serie, ripetizioni, recupero, come si esegue e il video. Prima di iniziare, un minuto di Reset se ti serve.',
    alt: 'La pagina di una seduta: rapidità, tiro e tocchi di palla pre partita, con gli esercizi in ordine.',
  },
  {
    id: 'recupero',
    parte: 'Fisico',
    titolo: "Dici com'è andata, la prossima si regola",
    testo: 'Nel recupero dici quante ne hai fatte e quanto è stata dura. Facile due volte di fila: la volta dopo si sale. Fa male qualcosa: si alleggerisce.',
    alt: 'Il recupero tra due serie: il tempo che scorre, quante ripetizioni hai fatto, quale lato è stato più duro.',
  },
];

export interface PassoIngresso {
  titolo: string;
  testo: string;
}

export function passiIngresso(provaGiorni: number): PassoIngresso[] {
  const prova = provaGiorni > 0;
  return [
    { titolo: 'Ti registri', testo: "Due minuti: chi sei, in che ruolo giochi, cosa ti pesa in campo. Il Coach parte da lì." },
    prova
      ? { titolo: `${provaGiorni} giorni gratis`, testo: 'Inserisci la carta e inizi dal Giorno 1. Tre giorni prima della fine della prova ti avvisiamo per email.' }
      : { titolo: 'La prima settimana', testo: 'Inizi dal Giorno 1 e fai la prima settimana intera prima di decidere.' },
    { titolo: 'Decidi tu', testo: prova ? 'Continui, oppure disdici dal profilo in un tap: se disdici durante la prova non paghi niente.' : 'Continui con un abbonamento mensile, o ti fermi lì.' },
  ];
}

export interface DomandaFrequente {
  domanda: string;
  risposta: string;
}

export function domandeFrequenti(minAge: number): DomandaFrequente[] {
  return [
    { domanda: 'Non ho tempo.', risposta: 'Un giorno del percorso dura da 3 a 15 minuti, quasi sempre meno di dieci. Il Reset in campo dura tre secondi.' },
    { domanda: 'È meditazione?', risposta: 'No. Sono esercizi di attenzione pensati per il campo: il respiro, un gesto, una parola, notare il corpo e i pensieri. Li fai seduto sul letto o in piedi nello spogliatoio.' },
    { domanda: 'Va bene anche se gioco tra i dilettanti?', risposta: "È pensato per chi gioca, a qualsiasi livello. Le situazioni sono quelle di ogni campo: l'errore, la panchina, il mister, la pressione prima della partita." },
    { domanda: 'Perché pagare, se su YouTube ci sono video gratis?', risposta: 'I video spiegano. Qui si fa: un passo al giorno, nell\'ordine giusto, con un Coach che sa a che punto sei e un piano fisico che si regola su come vanno le tue sedute.' },
    { domanda: 'Il Coach è una persona?', risposta: "No, è un'intelligenza artificiale istruita sul metodo del percorso. Se scrivi qualcosa che fa pensare che stai male davvero, ti indica persone reali a cui rivolgerti." },
    { domanda: 'Come disdico?', risposta: 'Dal profilo, in un tap. Se disdici durante la prova non paghi niente; dopo, resti dentro fino alla fine del mese già pagato.' },
    { domanda: 'Che età serve?', risposta: `Per ora ci si iscrive dai ${minAge} anni.` },
  ];
}

/** Il prezzo che vede un visitatore: lancio se è aperto, altrimenti il listino (il codice si scrive nella pagina prezzi). */
export interface PrezzoPubblico {
  id: Pacchetto;
  nome: string;
  euro: number | null;
  tipo: TipoPrezzo;
  /** Si può iniziare adesso (prezzo su Stripe, iscrizioni aperte, posti). */
  aperto: boolean;
}

export function prezziPubblici(i: {
  listino: Record<Pacchetto, Prezzi & { priceLancio: string | null; priceListino: string | null }>;
  imp: Impostazioni;
  iscrittiMente: number;
  iscrittiCampo: number;
}): Record<Pacchetto, PrezzoPubblico> {
  const out = {} as Record<Pacchetto, PrezzoPubblico>;
  for (const id of PACCHETTI) {
    const pp = i.listino[id];
    const p = prezzoPerUtente(pp, { lancio: i.imp.lancioAperto && pp.lancio != null, codice: false });
    const priceId = p.tipo === 'lancio' ? pp.priceLancio : pp.priceListino;
    const esito = esitoCheckout({ profilo: null, pacchetto: id, imp: i.imp, iscrittiMente: i.iscrittiMente, iscrittiCampo: i.iscrittiCampo, priceId });
    out[id] = { id, nome: INFO_PACCHETTI[id].nome, euro: p.euro, tipo: p.tipo, aperto: esito.ok && p.euro != null };
  }
  return out;
}
