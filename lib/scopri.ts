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

/**
 * Un momento dell'app mostrato nel telefono: l'immagine sta in public/scopri/<id>.webp (600 × 1298).
 * `dettaglio` = il «Scopri di più» di QUEL momento (Ste, 6/11: "l'espansione in ogni fase che spiega quella a cui
 * si riferisce"). Solo cose che l'app fa davvero.
 */
export interface MomentoApp {
  id: string;
  parte: 'Testa' | 'Fisico';
  titolo: string;
  testo: string;
  alt: string;
  dettaglio: string[];
}

/** Da dove viene il metodo, in testa a ogni sezione (parole di Ste, 6/11). */
export const ORIGINE_TESTA: string[] = [
  'Tecniche studiate e messe alla prova da più di cinque anni, sul campo.',
  'Raccolte da professionisti e da diversi libri, poi ridotte a quello che si può fare in campo.',
  'Provate prima su di me, da calciatore, poi sui ragazzi che alleno.',
];

export const ORIGINE_FISICO: string[] = [
  'Esercizi, progressioni, regole e limiti usati per anni con più di 100 calciatori.',
  'L\'AI li adatta a te: obiettivi, impegni, attrezzi, e come vanno le tue sedute.',
  'Prima che tu la veda, ogni settimana passa da un controllo automatico delle regole.',
];

/** La Testa: il percorso mentale (pacchetto Mente, o Completo). */
export const MOMENTI_TESTA: MomentoApp[] = [
  {
    id: 'giorno',
    parte: 'Testa',
    titolo: 'Ogni giorno, pochi minuti',
    testo: "Apri il giorno: un'apertura da leggere o ascoltare, una pratica guidata con l'audio, una domanda. Un giorno alla volta: il prossimo si apre domani.",
    alt: "La pagina di un giorno del percorso: settimana 1, giorno 1, l'apertura scritta da Ste.",
    dettaglio: [
      '12 settimane in tre blocchi. Settimane 1-4, costruire lo strumento: presenza, osservare i pensieri, ascoltare il corpo, la pressione.',
      'Settimane 5-8, giocare nelle difficoltà: l\'errore, la panchina, il giudizio, quello che ti porti dietro dopo la partita.',
      'Settimane 9-12, giocare libero: la tua routine, le tue risposte pronte, il tuo protocollo.',
      'Ogni pratica dura da 3 a 15 minuti, con l\'audio guidato.',
      'Alla fine della settimana il Gate: tre o quattro domande sulla settimana. La successiva si apre da lì.',
      'Il giorno prima della partita c\'è una pratica apposta, per la sera.',
    ],
  },
  {
    id: 'reset',
    parte: 'Testa',
    titolo: 'Il Reset: respiro, gesto, parola',
    testo: 'Il primo strumento del percorso. Da uno a cinque minuti la mattina, tre secondi in campo quando la testa va altrove.',
    alt: 'Il Reset in corso: il cerchio del respiro, il mantra e il tempo che manca.',
    dettaglio: [
      'Respiro contato, un gesto delle mani che non vede nessuno, una parola tua.',
      'Sopra il Reset si costruiscono gli altri strumenti: osservare i pensieri, ascoltare il corpo, il Protocollo Pressione per i momenti che contano.',
      'Ogni strumento ha la sua versione lunga, da fare a casa, e quella corta, da usare in campo.',
      'Le schede per i momenti difficili (ansia prima della partita, l\'errore, la panchina, il mister) ti dicono cosa fare adesso, e crescono con le settimane.',
    ],
  },
  {
    id: 'coach',
    parte: 'Testa',
    titolo: 'Un Coach che ti risponde',
    testo: "Scrivigli dopo una partita storta o la sera prima. Sa a che punto sei del percorso e cosa hai scritto, e prima di consigliarti ti fa una domanda. È un'intelligenza artificiale, e te lo dice.",
    alt: 'La chat con il Coach: un giocatore racconta un rigore sbagliato, il Coach gli chiede quando torna la paura.',
    dettaglio: [
      'In app e su Telegram, quando ti serve.',
      'Legge il tuo percorso: la settimana in corso, le tue risposte, i tuoi check-in, e se hai il Fisico anche le tue sedute.',
      'Si ricorda i temi di cui avete parlato.',
      'Parla come un ex calciatore su una panchina dopo l\'allenamento: domande dirette, niente frasi fatte.',
      'Se scrivi qualcosa che fa pensare che stai male davvero, ti indica persone reali a cui rivolgerti.',
    ],
  },
  {
    id: 'azioni',
    parte: 'Testa',
    titolo: 'Le tue abitudini',
    testo: 'Cinque azioni da fare durante la giornata, scelte da te: un Reset prima di entrare in campo, il telefono via a cena. Le spunti, e vedi quali tieni e quali no.',
    alt: 'Le tue 5 azioni: la striscia di giorni di fila, il calendario del mese, le più costanti e quelle su cui lavorare.',
    dettaglio: [
      'Le scegli da un elenco che cresce con le settimane del percorso, o le scrivi tu.',
      'Un giorno conta quando ne fai almeno tre: la striscia e il record lo dicono.',
      'Le più costanti e quelle su cui lavorare, sul mese.',
      'Ogni settimana anche un esercizio fuori dal campo, con i promemoria se li vuoi.',
    ],
  },
  {
    id: 'stato',
    parte: 'Testa',
    titolo: 'Come stai, giorno per giorno',
    testo: 'Un check-in del mattino da venti secondi: sonno, come stai fisicamente, recupero, testa, quanto eri presente ieri. I grafici ti fanno vedere come cambia.',
    alt: 'Come stai negli ultimi 30 giorni: medie di fisico, sonno, recupero e testa, con il grafico.',
    dettaglio: [
      'Medie e tendenze a 7, 30 e 90 giorni.',
      'Frasi vere dai tuoi dati, quando ce ne sono abbastanza: per esempio quanto cambia la tua lucidità quando dormi meno di sei ore.',
      'Con il Fisico Pro o il Completo il check-in conta anche per gli allenamenti: se sei spesso stanco il carico scende, se sei fresco sale.',
      'Il Coach li legge: se dormi poco da giorni, lo sa.',
    ],
  },
  {
    id: 'carta',
    parte: 'Testa',
    titolo: 'La tua Carta del Giocatore',
    testo: 'Il tuo mantra, la tua firma, il tuo Protocollo Pressione: le tue parole, scritte da te nel percorso. E il rombo a 360°: testa, recupero e corpo dagli stessi dati.',
    alt: 'La Carta del Giocatore: il rombo a sette punte con la partenza in grigio.',
    dettaglio: [
      'Le risposte chiave del percorso in un posto solo, da rileggere prima di entrare in campo, anche stampate.',
      'Le puoi riscrivere quando cambiano: ogni versione resta, con la data.',
      'Il rombo mette insieme presenza, costanza, disciplina e lucidità con recupero, forza, esplosività, resistenza, velocità e tecnica.',
      'In grigio da dove sei partito, in verde dove sei adesso.',
    ],
  },
];

/** Il Fisico: la preparazione (pacchetti Fisico, o Completo). */
export const MOMENTI_FISICO: MomentoApp[] = [
  {
    id: 'obiettivi',
    parte: 'Fisico',
    titolo: 'Scegli su cosa lavorare',
    testo: 'Forza delle gambe e della parte alta, velocità, esplosività, resistenza, tecnica con la palla, prevenzione, kettlebell, recupero. Uno, alcuni in ordine di priorità, o tutto in equilibrio.',
    alt: 'Il setup del Fisico: gli obiettivi scelti in ordine, forza gambe, tecnica palla e velocità.',
    dettaglio: [
      'Forza delle gambe e della parte alta: a corpo libero su scale a gradini, o in palestra con i carichi.',
      'Velocità, rapidità, esplosività e salti.',
      'Resistenza a serie, come in campo, anche senza un campo.',
      'Tecnica con la palla: palleggi, controllo e passaggi, freestyle, visione, dribbling, tiro.',
      'Prevenzione e fascia, kettlebell, recupero.',
      'L\'ordine conta: il primo obiettivo è il filo della settimana, gli altri si spalmano sul mese.',
      'Quante aree insieme dipende dal livello: Base una, Medio due, Pro tutte.',
    ],
  },
  {
    id: 'setup',
    parte: 'Fisico',
    titolo: 'Con quello che hai',
    testo: 'Palestra, kettlebell, sbarra, un campo, un muro, o niente: il corpo libero c\'è sempre. Dici anche la fase della stagione, i giorni, il tempo che hai e le zone da proteggere.',
    alt: 'Il setup del Fisico: gli attrezzi a disposizione, esperienza in palestra e compagno.',
    dettaglio: [
      'Gli esercizi sono scelti solo tra quelli che puoi fare con i tuoi attrezzi, da solo o con un compagno.',
      'La fase della stagione cambia tutto: fuori stagione, preparazione con la squadra, in stagione.',
      'Quali giorni, quante giornate e quanto tempo per seduta, da 30 a 90 minuti.',
      'Gli allenamenti con la squadra, quanto sono duri e la partita abituale.',
      'Infortuni passati e zone da proteggere: lì gli esercizi pesano meno.',
      'Senza esperienza in palestra i carichi restano al massimo al 60 % del tuo massimale.',
    ],
  },
  {
    id: 'fisico',
    parte: 'Fisico',
    titolo: 'La settimana intorno alla partita',
    testo: 'Dici quando giochi e quando ti alleni con la squadra: la settimana si prepara intorno a quei giorni, sui tuoi test.',
    alt: 'La settimana del Fisico: due sedute, gambe il venerdì e rapidità pre partita il sabato, con la partita la domenica.',
    dettaglio: [
      'L\'AI sceglie gli allenamenti dentro le regole del preparatore; un controllo automatico verifica la settimana prima che arrivi a te.',
      'Le regole intorno alla partita: il giorno prima solo rapidità e tecnica leggera, la resistenza lontana dalle partite, le gambe del giorno dopo ridotte in base a quanto hai giocato.',
      'Tetti per qualità: quante giornate di velocità, salti o forza in una settimana, quanti sprint.',
      'Ogni quattro settimane una settimana di scarico (con il Pro anche prima, se i dati lo dicono).',
      'Una seduta saltata torna la settimana dopo; se il calendario cambia, la settimana si riadatta (Medio e Pro).',
      'Se qualcosa non ti torna, chiedi al preparatore AI in chat (Medio e Pro).',
    ],
  },
  {
    id: 'seduta',
    parte: 'Fisico',
    titolo: 'La seduta, esercizio per esercizio',
    testo: 'Serie, ripetizioni e recupero. Per ogni esercizio come si esegue, gli errori da evitare, la versione più facile e quella più difficile, e il video.',
    alt: 'La pagina di una seduta: rapidità, tiro e tocchi di palla pre partita, con gli esercizi in ordine.',
    dettaglio: [
      'Più di 300 esercizi, ognuno con la sua scheda: i passi dell\'esecuzione, gli errori da evitare, più facile e più difficile, la sicurezza.',
      'Video dimostrativi, e per gli esercizi di visione i video dei segnali da mettere sul telefono.',
      'Un\'apertura facoltativa per sciogliere il corpo, che non conta nel tempo della seduta.',
      'Il timer del recupero, i lati destro e sinistro, gli EMOM a minuti.',
      'Prima di iniziare, un minuto di Reset se hai anche la Testa.',
    ],
  },
  {
    id: 'recupero',
    parte: 'Fisico',
    titolo: "Dici com'è andata, la prossima si regola",
    testo: 'Nel recupero voti la serie, dici quante ne hai fatte, quale lato è stato più duro e se il gesto era pulito. Da lì si decide la prossima volta.',
    alt: 'Il recupero tra due serie: il voto da 1 a 10, le ripetizioni fatte, il lato più duro e com\'è venuto il gesto.',
    dettaglio: [
      'Facile due volte di fila: la volta dopo si sale, di ripetizioni, di secondi o di chili.',
      'Ne hai fatte più del previsto: si riparte da lì.',
      'Il gesto non viene pulito: un passo indietro, e se non basta l\'esercizio si allena a parte con poche ripetizioni.',
      'Quando arrivi alla soglia del gradino, passi al gradino dopo senza aspettare il test.',
      'Destra e sinistra separate: un lato più debole si vede, e si lavora.',
      'A fine seduta il voto della seduta e il giudizio su ogni parte: facile, giusta, dura.',
    ],
  },
  {
    id: 'resoconto',
    parte: 'Fisico',
    titolo: 'Sa quando ti alleni con la squadra',
    testo: 'Dopo l\'allenamento con la squadra o la partita ti chiede quanta fatica hai fatto, quanto è durato, cosa avete fatto e se senti un fastidio. La settimana si adatta.',
    alt: 'Com\'è andata con la squadra: la fatica da 1 a 10, la durata, cosa avete fatto, un fastidio.',
    dettaglio: [
      'A ogni livello: fatica molto alta o un fastidio, e la seduta dopo è più leggera.',
      'Con il Fisico Pro e il Completo il resoconto rimodula la settimana: più stanco del solito, le serie dopo diventano facoltative; molto più stanco, due giorni più leggeri e lo yoga di recupero; più fresco, una serie in più se te la senti.',
      'La partita conta per quanto hai giocato: chi non è entrato non si porta dietro i limiti del dopo partita.',
      'Il carico della settimana tiene dentro anche la squadra, non solo l\'app.',
      'Con il Fisico Pro e il Completo check-in, voti delle sedute e resoconti contano insieme: se sei spesso stanco il tetto di carico scende, se sei fresco sale, e lo scarico arriva quando i dati lo dicono.',
      'Un dolore da 4 su 10 ferma le sedute e ti consigliamo di farti vedere da un fisioterapista o da un medico.',
    ],
  },
  {
    id: 'test',
    parte: 'Fisico',
    titolo: 'Test per sapere dove sei',
    testo: 'Forza a corpo libero, scale a gradini, tecnica con la palla, salti, velocità, resistenza. Uno alla volta, quando vuoi: da lì partono le dosi.',
    alt: 'La batteria di test: il prossimo test consigliato e i gruppi di test con quanti ne hai fatti.',
    dettaglio: [
      'Ogni test con le istruzioni passo per passo e il video dove serve.',
      'Il livello si calcola per qualità: puoi essere avanti nei salti e indietro nella forza.',
      'Dopo lo scarico i test tornano dentro le sedute, senza giornate di soli test.',
      'Velocità e resistenza si testano solo quando stai bene e la settimana lo permette.',
      'Lo storico tiene sedute, esercizi, test e resoconti, con i grafici; la Carta mostra da dove sei partito.',
    ],
  },
];

/** Tutte le schermate, per il telefono dell'apertura che gira da solo (Testa e Fisico alternati). */
export const MOMENTI_APP: MomentoApp[] = MOMENTI_TESTA.flatMap((m, i) => [m, MOMENTI_FISICO[i]]).concat(MOMENTI_FISICO.slice(MOMENTI_TESTA.length)).filter(Boolean);

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
