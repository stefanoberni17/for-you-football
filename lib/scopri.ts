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
 * `dettaglio` = il «dentro» di QUEL momento, che si apre; `inCampo` = la riga evidenziata in fondo, sempre in vista
 * (testi v2 di Ste, 7/11). Solo cose che l'app fa davvero.
 */
export interface MomentoApp {
  id: string;
  parte: 'Testa' | 'Fisico';
  titolo: string;
  testo: string;
  alt: string;
  dettaglio: string[];
  inCampo?: string;
}

// ─── Testi della pagina (v2 di Ste, 7/11). Regole: niente trattini lunghi, niente promesse di esito ───

export const APERTURA = {
  etichetta: 'Mental training per calciatori',
  titolo: 'Allena la testa come alleni le gambe.',
  sotto: 'Pochi minuti al giorno per imparare a tornare in partita quando la testa se ne va. Dopo un errore, in panchina, la sera prima della partita.',
};

/** «Lo conosci questo momento?» */
export const MOMENTI_CONOSCI: string[] = [
  'Sbagli un passaggio facile al decimo minuto... e te lo porti fino al novantesimo.',
  'Vedi il mister che si alza dalla panchina, e le gambe diventano di legno.',
  'La sera prima della partita giri nel letto e la giochi dieci volte in testa.',
  'Ti tolgono al sessantesimo, e passi la settimana a chiederti cosa pensa di te.',
];
export const CONOSCI_CHIUSURA = 'Il talento non c\'entra. In allenamento quelle giocate le fai. Quello che manca è il modo di riportare la testa in campo... e si allena, come il piede debole.';

export const STORIA = {
  citazione: '«Sono passato da vomitare prima delle partite, terrorizzato e bloccato dalla paura, a giocare davanti a diecimila persone.»',
  paragrafi: [
    'Sono Stefano, Ste. Ho esordito in Serie C con la Reggiana, e il primo pallone me l\'hanno rubato su un appoggio che avevo fatto mille volte. In Serie D ho perso una finale di Coppa Italia anche perché un passaggio sbagliato nel primo tempo me lo sono portato dietro per tutta la partita.',
    'Per anni ho provato di tutto: un mental coach, uno psicologo, lo yoga, libri, corsi. Cose preziose... ma ognuno mi dava qualcosa in più da fare. Il passo vero è stato l\'opposto: togliere invece di aggiungere. Imparare ad accorgermi di quando la testa partiva, e tornare.',
    'Non è stato veloce, e non è finito nemmeno oggi.',
    'For You Football è quello che avrei voluto avere io: le cose che mi sono servite, messe in fila, un giorno alla volta.',
  ],
};

export const NON_POSITIVO = {
  titolo: 'Non è pensiero positivo',
  paragrafi: [
    'Qui non ti chiediamo di essere sempre carico, sicuro, positivo. Quella è una recita, e prima o poi crolla.',
    'Ti alleni a una cosa sola: accorgerti di quando la testa se ne va, e tornare in partita nel minor tempo possibile. Con la frustrazione, con la paura, con tutto quello che senti... ma di nuovo sulla palla dopo.',
    'E non è una formula magica. Come per il fisico, serve farlo con costanza.',
  ],
};

/** Come funziona: le quattro schede della Testa (pacchetto Mente, o Completo). */
export const MOMENTI_TESTA: MomentoApp[] = [
  {
    id: 'giorno',
    parte: 'Testa',
    titolo: 'Ogni giorno, pochi minuti',
    testo: 'Apri l\'app e trovi la giornata: un\'apertura da leggere, una pratica guidata con l\'audio, una domanda. Non devi decidere niente.',
    alt: 'La pagina di un giorno del percorso: settimana 1, giorno 1, l\'apertura scritta da Ste.',
    dettaglio: [
      '12 settimane in tre blocchi. Costruire lo strumento: presenza, pensieri, corpo, pressione. Giocare nelle difficoltà: l\'errore, la panchina, il giudizio, quello che ti porti a casa dopo la partita. Giocare libero: la tua routine, le tue risposte pronte, il tuo protocollo.',
      'Una pratica dura da 3 a 15 minuti, quasi sempre meno di dieci.',
      'A fine settimana tre o quattro domande, e da lì si apre la successiva.',
      'La sera prima della partita c\'è una pratica apposta.',
    ],
    inCampo: 'Entri sapendo cosa fare, invece di sperare che sia una giornata buona.',
  },
  {
    id: 'reset',
    parte: 'Testa',
    titolo: 'Il Reset: il primo strumento',
    testo: 'Un respiro comodo, un gesto delle mani che non vede nessuno, una parola tua. A casa dura qualche minuto. In campo tre secondi, alla prima pausa.',
    alt: 'Il Reset in corso: il cerchio del respiro, il mantra e il tempo che manca.',
    dettaglio: [
      'Sopra il Reset costruisci gli altri strumenti: guardare i pensieri, ascoltare il corpo, il Protocollo Pressione per i momenti che contano, lo Stacco dopo l\'errore, il Rilascio per lasciare fuori quello che ti porti dietro.',
      'Ogni strumento ha la versione lunga da fare a casa e quella corta da usare in campo.',
      'Le schede per i momenti difficili (ansia prima della partita, l\'errore, la panchina, il mister) ti dicono cosa fare adesso.',
    ],
    inCampo: 'Dopo l\'errore sei già sulla palla dopo.',
  },
  {
    id: 'coach',
    parte: 'Testa',
    titolo: 'Un Coach che ti risponde',
    testo: 'Scrivigli dopo una partita storta o la sera prima. Sa a che punto sei del percorso e cosa hai scritto, e prima di consigliarti ti fa una domanda. È un\'intelligenza artificiale, e te lo dice.',
    alt: 'La chat con il Coach: un giocatore racconta un rigore sbagliato, il Coach gli chiede quando torna la paura.',
    dettaglio: [
      'In app e su Telegram, quando ti serve.',
      'Si ricorda di cosa avete parlato.',
      'Domande dirette, niente frasi fatte.',
      'Se scrivi qualcosa che fa pensare che stai male davvero, ti indica persone reali a cui rivolgerti.',
    ],
    inCampo: 'Non ti tieni la partita storta dentro fino alla prossima.',
  },
  {
    id: 'carta',
    parte: 'Testa',
    titolo: 'Le tue parole, in un posto solo',
    testo: 'La tua parola per il Reset, la tua firma di quando giochi bene, il tuo Protocollo Pressione: le scrivi tu durante il percorso, e le ritrovi nella tua Carta del Giocatore.',
    alt: 'La Carta del Giocatore: il rombo a sette punte con la partenza in grigio.',
    dettaglio: [
      'Da rileggere prima di entrare in campo, anche stampata.',
      'Le riscrivi quando cambiano: ogni versione resta, con la data.',
      'Un check-in di venti secondi al mattino (sonno, corpo, testa) e cinque piccole azioni per la giornata, scelte da te.',
    ],
    inCampo: 'Prima del fischio d\'inizio sai già chi vuoi essere in quei novanta minuti.',
  },
];

/**
 * Racconti dei primi iscritti (sezione «Cosa dicono i primi»): SOLO con il consenso scritto, frasi vere non
 * modificate nel senso, nome o iniziale, ruolo, categoria. Vuoto = la sezione non compare.
 */
export interface Racconto { testo: string; chi: string; ruolo: string; categoria: string }
export const RACCONTI: Racconto[] = [];

/** Il Fisico in breve, finché il Campo non è aperto a tutti. */
export const FISICO_TEASER = {
  titolo: 'La preparazione costruita sulla tua settimana di partite.',
  testo: 'Un piano ogni settimana sui tuoi obiettivi, i tuoi attrezzi, gli allenamenti con la squadra e la partita. Più di 300 esercizi, ognuno con la sua scheda, e i video. Se un giorno sei molto stanco o senti un fastidio, la seduta si alleggerisce.',
  quando: 'Da dicembre',
};

/** Cosa c'è nel Mente (scheda principale dei prezzi). */
export const MENTE_INCLUDE: string[] = [
  'Il percorso di 12 settimane, una giornata al giorno, con l\'audio',
  'Il Coach in app e su Telegram, sette giorni su sette',
  'Gli strumenti, le schede per i momenti difficili, la tua Carta',
  'Check-in e statistiche',
];
export const NOTA_VALORE = 'Una seduta da un mental coach costa spesso più di cento euro. Qui hai un percorso intero, ogni giorno, per tutto il mese.';
export const NOTA_CODICE = 'Hai un codice da un amico? Lo inserisci nella pagina dei prezzi, prima del pagamento.';

export const CHIUSURA = [
  'Lo so, detta così sembra la cosa più inutile del mondo: respiri da quando sei nato, e finora non ti ha mai fatto segnare un gol.',
  'Dammi tre minuti lo stesso. Il Giorno 1 dura così.',
];

export const AVVISO_FISICO = 'mailto:info@foryoufootball.it?subject=' + encodeURIComponent('Avvisami quando apre il Fisico');

/** Il Fisico, momento per momento: non è nella pagina finché il Campo non apre (dicembre); testi e schermate restano pronti. */
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

/** Il telefono dell'apertura (al posto del video finché non c'è): le schermate della Testa. */
export const MOMENTI_APP: MomentoApp[] = MOMENTI_TESTA;

export interface PassoIngresso {
  titolo: string;
  testo: string;
}

export function passiIngresso(provaGiorni: number): PassoIngresso[] {
  const prova = provaGiorni > 0;
  return [
    { titolo: 'Ti registri', testo: 'Due minuti: chi sei, in che ruolo giochi, cosa ti pesa in campo. Il Coach parte da lì.' },
    prova
      ? { titolo: `${provaGiorni} giorni gratis`, testo: 'Inserisci la carta e inizi dal Giorno 1. Tre giorni prima della fine della prova ti avvisiamo per email.' }
      : { titolo: 'La prima settimana', testo: 'Inizi dal Giorno 1 e fai la prima settimana intera prima di decidere.' },
    { titolo: 'Decidi tu', testo: prova ? 'Continui, oppure disdici dal profilo con un tocco. Se disdici durante la prova non paghi niente.' : 'Continui con un abbonamento mensile, o ti fermi lì.' },
  ];
}

export interface DomandaFrequente {
  domanda: string;
  risposta: string;
}

export function domandeFrequenti(minAge: number): DomandaFrequente[] {
  return [
    { domanda: 'Non ho tempo.', risposta: 'Una giornata dura da 3 a 15 minuti, quasi sempre meno di dieci. Il Reset in campo dura tre secondi.' },
    { domanda: 'È meditazione?', risposta: 'Non come te la immagini. Non devi metterti a terra a gambe incrociate come il Buddha: sono esercizi di attenzione pensati per il campo, li fai seduto sul letto o in piedi nello spogliatoio.' },
    { domanda: 'Funziona se gioco tra i dilettanti?', risposta: 'È pensato per chi gioca, a qualsiasi livello. L\'errore, la panchina, il mister, la pressione prima della partita ci sono in ogni campo.' },
    { domanda: 'E se non fa per me?', risposta: 'Per questo la prima settimana è gratis. Se non ti serve, disdici dal profilo con un tocco prima della fine della prova e non paghi niente.' },
    { domanda: 'Perché pagare, se su YouTube ci sono video gratis?', risposta: 'I video spiegano. Qui si fa: un passo al giorno, nell\'ordine giusto, con un Coach che sa a che punto sei.' },
    { domanda: 'Il Coach è una persona?', risposta: 'No, è un\'intelligenza artificiale istruita sul metodo del percorso. Se scrivi qualcosa che fa pensare che stai male davvero, ti indica persone reali a cui rivolgerti.' },
    { domanda: 'È una terapia?', risposta: 'No. For You Football è allenamento mentale per lo sport: non è un servizio sanitario né psicologico.' },
    { domanda: 'Come disdico?', risposta: 'Dal profilo, con un tocco. Se disdici durante la prova non paghi niente; dopo, resti dentro fino alla fine del mese già pagato.' },
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
