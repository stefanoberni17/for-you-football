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

// ─── Testi della pagina (v3 di Ste, 7/11). Regole: niente trattini lunghi, niente promesse di esito.
// Ordine: mi riconosco → Ste mi capisce → ha costruito qualcosa di concreto → può servire a me → posso provarlo ───

export const APERTURA = {
  etichetta: 'Mental training per calciatori',
  titolo: 'In allenamento giochi come sai. In partita, a volte, non ti riconosci.',
  sotto: 'Allena la testa come alleni le gambe: pochi minuti al giorno per portare in partita il giocatore che sei in allenamento.',
};

/** Le scene. */
export const MOMENTI_CONOSCI: string[] = [
  'Ti arriva un pallone semplice, e pensi già a non sbagliarlo.',
  'Dopo un errore, invece di chiedere ancora palla, cominci a nasconderti.',
  'La sera prima della partita la giochi dieci volte in testa.',
  'Poi esci dal campo pensando: «Potevo fare molto di più».',
];
export const CONOSCI_CHIUSURA = 'Il talento non c\'entra. Quello che manca è il modo di riportare la testa in campo... e si allena, come il piede debole.';

export const STORIA = {
  citazione: '«Sono passato da vomitare prima delle partite, terrorizzato e bloccato dalla paura, a giocare davanti a diecimila persone.»',
  paragrafi: [
    'Ci sono passato anch\'io. Ho esordito in Serie C con la Reggiana, e il primo pallone me l\'hanno rubato su un appoggio che avevo fatto mille volte.',
    'Per anni, se sbagliavo a inizio partita, arrivava la paura... e mi nascondevo. Se la palla non mi arriva, non posso sbagliare. Era automatico, non me ne rendevo nemmeno conto.',
    'Me ne sono accorto anni dopo, quando ho iniziato a lavorare sulla testa. Un giorno l\'ho proprio visto mentre succedeva... e vedendolo, finalmente, ho potuto scegliere.',
    'Ho provato di tutto: un mental coach, uno psicologo, lo yoga, libri, corsi. Cose preziose... ma ognuno mi dava qualcosa in più da fare. Il passo vero è stato l\'opposto: togliere invece di aggiungere.',
    'Dal Covid lavoro con altri calciatori: più di cento, di ogni età, professionisti e dilettanti.',
    'Non è stato veloce, e non è finito nemmeno oggi. For You Football è quello che avrei voluto avere io: le cose che mi sono servite, messe in fila, un giorno alla volta.',
  ],
};

/**
 * Le foto di Ste nella storia (7/11, mandate da Ste in chat: «più umano», «modificale un po'»). File in public/scopri/storia/,
 * stesso trattamento per tutte (colori un po' più caldi e meno saturi, contrasto, vignetta morbida; scripts/scopri-foto.mjs).
 * `prima` = l'indice del paragrafo di STORIA davanti a cui va la foto (0 = in apertura). `quando` e `didascalia` li scrive Ste
 * (mai inventati): senza, la foto non ha scritta sotto. Lista vuota = la storia resta solo testo, con il cerchio «SB».
 */
export type FotoStoria = { src: string; alt: string; prima: number; quando?: string; didascalia?: string };
export const STORIA_FOTO: FotoStoria[] = [
  { src: '/scopri/storia/reggiana.webp', alt: 'Ste da ragazzo, con la maglia della Reggiana', prima: 0 },
  { src: '/scopri/storia/sguardo.webp', alt: 'Ste in campo, serio, con le braccia aperte', prima: 1 },
  { src: '/scopri/storia/esultanza.webp', alt: 'Ste che esulta dopo un gol, con la maglia rossa', prima: 2 },
  { src: '/scopri/storia/tiro.webp', alt: 'Ste che calcia, con la maglia gialla e i pantaloncini blu', prima: 5 },
];

/** Le altre foto di Ste, in fila sotto la storia. */
export const ALBUM_FOTO: FotoStoria[] = [
  { src: '/scopri/storia/nazionale.webp', alt: 'Ste da ragazzo, con la tuta della Nazionale', prima: 0 },
  { src: '/scopri/storia/conduzione.webp', alt: 'Ste con la palla al piede, con la maglia gialla', prima: 0 },
  { src: '/scopri/storia/colpo-di-testa.webp', alt: 'Ste che salta per un colpo di testa', prima: 0 },
];

/** Dove ti porta il lavoro. */
export const DOVE_PORTA = {
  titolo: 'Dove ti porta il lavoro',
  intro: 'Il lavoro va in una direzione precisa:',
  punti: [
    'chiedere ancora palla dopo aver sbagliato;',
    'entrare dalla panchina senza dover dimostrare tutto al primo minuto;',
    'arrivare alla partita importante senza averla già giocata dieci volte nel letto;',
    'tornare a casa dopo una partita storta, senza che si prenda tutta la serata.',
  ],
  chiusura: 'Non te lo prometto in dodici settimane. Ti do gli strumenti, e un giorno alla volta per allenarli.',
};

export const NON_POSITIVO = {
  titolo: 'Non è pensiero positivo',
  paragrafi: [
    'Qui non ti chiediamo di essere sempre carico, sicuro, positivo. Quella è una recita, e prima o poi crolla.',
    'Ti alleni a una cosa sola: accorgerti di quando la testa se ne va, e tornare in partita nel minor tempo possibile. Con la frustrazione, con la paura, con tutto quello che senti... ma di nuovo sulla palla dopo.',
    'E non è una formula magica. Come per il fisico, serve farlo con costanza.',
  ],
};

/** Come funziona: le quattro schede della Testa (pacchetto Mente, o Completo). Ste, 7/11: strumenti, difficoltà, Coach, Carta. */
export const MOMENTI_TESTA: MomentoApp[] = [
  {
    id: 'percorso',
    parte: 'Testa',
    titolo: '12 strumenti da usare in campo',
    testo: 'Un percorso di 12 settimane, un giorno alla volta: ogni settimana uno strumento nuovo, con la pratica guidata e l\'audio. Prima lo impari a casa, poi lo porti in campo.',
    alt: 'Il tuo percorso: la settimana 1, Il Reset, in corso, e sotto le settimane che si aprono una dopo l\'altra.',
    dettaglio: [
      'Il primo è il Reset: un respiro comodo, un gesto delle mani che non vede nessuno, una parola tua. A casa dura qualche minuto. In campo tre secondi, alla prima pausa.',
      'Sopra il Reset costruisci gli altri: guardare i pensieri, ascoltare il corpo, il Protocollo Pressione per i momenti che contano, lo Stacco dopo l\'errore, il Rilascio per lasciare fuori quello che ti porti dietro, fino al tuo protocollo.',
      '12 settimane in tre blocchi. Costruire lo strumento: presenza, pensieri, corpo, pressione. Giocare nelle difficoltà: l\'errore, la panchina, il giudizio, quello che ti porti a casa dopo la partita. Giocare libero: la tua routine, le tue risposte pronte, il tuo protocollo.',
      'Ogni giornata: un\'apertura da leggere, una pratica guidata con l\'audio, una domanda. Da 3 a 15 minuti, quasi sempre meno di dieci. Non devi decidere niente.',
      'Ogni strumento ha la versione lunga da fare a casa e quella corta da usare in campo.',
      'A fine settimana tre o quattro domande, e da lì si apre la successiva. La sera prima della partita c\'è una pratica apposta.',
    ],
    inCampo: 'entri sapendo cosa fare, invece di sperare che sia una giornata buona.',
  },
  {
    id: 'difficolta',
    parte: 'Testa',
    titolo: 'Un aiuto per ogni difficoltà',
    testo: 'L\'ansia prima della partita, l\'errore grave, la panchina, il mister. Non ti diamo la soluzione: quella la trovi tu, e solo tu puoi sapere cosa è giusto per te. Ti diamo strumenti pratici per trovare la tua.',
    alt: 'Cosa ti succede? Le situazioni difficili: ansia da prestazione, la panchina, l\'errore grave, il mister.',
    dettaglio: [
      'Scegli la situazione e trovi cosa fare adesso, in pochi passi.',
      'Ogni scheda cresce con il percorso: ogni strumento nuovo aggiunge un modo per affrontarla.',
      'Nessuna reazione pretesa: puoi restare deluso o arrabbiato, lo strumento ti serve a tornare in partita lo stesso.',
      'Non c\'è la tua? La scrivi al Coach.',
      'In fondo, sempre, i numeri a cui rivolgersi se un momento è davvero difficile.',
    ],
    inCampo: 'dopo l\'errore sei già sulla palla dopo.',
  },
  {
    id: 'coach',
    parte: 'Testa',
    titolo: 'Un Coach sempre a disposizione',
    testo: 'Nei momenti difficili, per spiegarti meglio una pratica, per un consiglio sul campo fatto su di te. Sa a che punto sei del percorso e cosa hai scritto, e prima di consigliarti ti fa una domanda. È un\'intelligenza artificiale, e te lo dice.',
    alt: 'La chat con il Coach: un giocatore racconta un rigore sbagliato, il Coach gli chiede quando torna la paura.',
    dettaglio: [
      'In app e su Telegram, quando ti serve.',
      'Ti rispiega una pratica se non ti è chiara, con le parole del percorso.',
      'Si ricorda di cosa avete parlato.',
      'Domande dirette, niente frasi fatte.',
      'Se scrivi qualcosa che fa pensare che stai male davvero, ti indica persone reali a cui rivolgerti.',
    ],
    inCampo: 'non ti tieni la partita storta dentro fino alla prossima.',
  },
  {
    id: 'parole',
    parte: 'Testa',
    titolo: 'La tua Carta del Giocatore',
    testo: 'Il tuo gioco mentale, scritto da te: la parola del tuo Reset, dove il tuo corpo porta la tensione, come ti senti quando giochi libero, il tuo Protocollo Pressione. Le scrivi durante il percorso e le ritrovi tutte qui.',
    alt: 'La Carta del Giocatore: il mio mantra, la mia mappa, la mia firma del gioco libero, il mio protocollo, scritti dal giocatore.',
    dettaglio: [
      'Da rileggere prima di entrare in campo, anche stampata.',
      'Le riscrivi quando cambiano: ogni versione resta, con la data.',
      'Un check-in di venti secondi al mattino (sonno, corpo, testa) e cinque piccole azioni per la giornata, scelte da te.',
    ],
    inCampo: 'prima del fischio d\'inizio sai già chi vuoi essere in quei novanta minuti.',
  },
];

/**
 * Racconti dei primi iscritti (sezione «Cosa dicono i primi»): SOLO con il consenso scritto, frasi vere non
 * modificate nel senso, nome o iniziale, ruolo, categoria. Vuoto = la sezione non compare.
 */
export interface Racconto { testo: string; chi: string; ruolo: string; categoria: string }
export const RACCONTI: Racconto[] = [];

/** Il Fisico in breve, dentro la sezione dei prezzi finché il Campo non è aperto a tutti (v3). */
export const FISICO_TEASER = {
  titolo: 'Il Fisico',
  testo: 'La preparazione costruita sulla tua settimana di partite: un piano ogni settimana sui tuoi obiettivi, i tuoi attrezzi, gli allenamenti con la squadra e la partita. Più di 300 esercizi, ognuno con la sua scheda, e i video.',
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

/**
 * Perché la Testa è fatta così (7/11, testo di Ste, ritoccato poco): tante strade provate e studiate, ognuna con qualcosa di
 * buono; una domanda; un percorso su pilastri e principi con le tecniche viste funzionare in campo.
 */
export const PERCHE_TESTA = {
  etichetta: 'Perché questo percorso',
  titolo: 'Migliorare come persona, e come giocatore',
  paragrafi: [
    'Psicologo, mental coach, yoga, filosofie orientali. Ognuna di queste strade aveva qualcosa di buono, ma a ognuna mancava sempre un pezzo.',
    'Allora ho cominciato a studiare: psicologia, il corso da mental coach, le discipline e le filosofie orientali. Volevo mettere insieme più cose possibili, senza chiudermi a niente.',
  ],
  studi: ['Psicologia', 'Mental coaching', 'Discipline orientali', 'Yoga'],
  domanda: 'A un certo punto mi sono fermato con una domanda. Tutte queste cose ti danno strumenti diversi, ma spesso ti promettono una soluzione per un obiettivo preciso. Io cercavo qualcosa di più ampio.',
  chiusura: [
    'Così ho costruito un percorso su alcuni pilastri e principi, e dentro ho tenuto le tecniche che ho visto funzionare in campo, nella pratica.',
    'Da qui è nato For You Football. E continua a cambiare, perché c\'è sempre qualcosa di nuovo da scoprire.',
  ],
};

/**
 * Perché il Fisico è fatto così (7/11, testo di Ste, ritoccato poco): tanti professionisti bravi ma scollegati, l'altalena
 * forza/fluidità, la scelta di studiare e di costruire un metodo a 360 gradi, le variabili, l'AI dentro le regole.
 */
export const PERCHE_FISICO = {
  etichetta: 'Perché il Fisico',
  titolo: 'Tutto collegato',
  intro: 'Quando giocavo cercavo qualcuno che mi seguisse a 360 gradi. Trovavo persone brave, ma ognuna nel suo pezzo.',
  figure: [
    { chi: 'Il preparatore atletico', limite: 'Bravissimo, ma non conosceva la tecnica e la forza.' },
    { chi: 'Il personal trainer', limite: 'Perfetto per la forza, ma niente coordinazione e fluidità in campo.' },
    { chi: 'Il preparatore tecnico', limite: 'Conosceva la palla, ma non bene la parte fisica.' },
  ],
  altalena: [
    'Con un preparatore specializzato nella forza sono diventato più forte, ma ho perso fluidità e coordinazione.',
    'Con lo yoga le ho ritrovate, ma ho perso massa muscolare.',
  ],
  scelta: 'Erano tutti scollegati, e il calcio ha davvero tantissimi aspetti da tenere insieme. Così ho studiato da personal trainer e ho costruito un modo di allenarsi che li copre in profondità, uno per uno, senza perdere di vista tutto il resto.',
  problema: 'Il principio c\'era, le regole anche. La difficoltà era applicarle a ogni ragazzo, con tutto quello che cambia da un giorno all\'altro:',
  variabili: [
    'gli allenamenti con la squadra', 'il riposo', 'lo stress', 'la testa', 'il recupero', 'la prevenzione',
    'la prestazione', 'la fatica in campo', 'gli allenamenti che cambiano', 'i fastidi', 'gli squilibri',
  ],
  domanda: 'Come fa una persona da sola a tenere insieme tutto questo, e a cambiare il programma da un giorno all\'altro?',
  ai: [
    'Qui è arrivata l\'intelligenza artificiale, che negli ultimi tempi è migliorata moltissimo e tiene insieme tantissime variabili in pochi secondi.',
    'Prima, con l\'aiuto di preparatori e professionisti, ho scritto nel dettaglio le basi di ogni aspetto: gli esercizi, i carichi della settimana e del mese, le progressioni, come comportarsi nei casi particolari. L\'AI lavora dentro queste regole. Da qui è nato il Fisico.',
  ],
};

/** La sezione del Fisico (rimessa il 7/11, Ste: «lo metterei il fisico»): apre a dicembre, intanto si vede com'è. */
export const FISICO_SEZIONE = {
  titolo: 'Il metodo di un preparatore, adattato a te',
  intro: 'La preparazione costruita sulla tua settimana: i tuoi obiettivi, i tuoi attrezzi, la squadra e la partita, e come vanno le tue sedute.',
  origine: [
    'Esercizi, progressioni, regole e limiti usati per anni con più di 100 calciatori.',
    'L\'AI li adatta a te: obiettivi, impegni, attrezzi, e come vanno le tue sedute.',
    'Prima che tu la veda, ogni settimana passa da un controllo automatico delle regole.',
  ],
};

/** Il Fisico, momento per momento: la sezione «Il Fisico» della pagina, sotto la Testa. */
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
