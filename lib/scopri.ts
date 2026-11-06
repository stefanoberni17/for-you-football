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

/** La Testa: il percorso mentale (pacchetto Mente, o Completo). */
export const MOMENTI_TESTA: MomentoApp[] = [
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
];

/** Il Fisico: la preparazione (pacchetti Fisico, o Completo). */
export const MOMENTI_FISICO: MomentoApp[] = [
  {
    id: 'obiettivi',
    parte: 'Fisico',
    titolo: 'Scegli su cosa lavorare',
    testo: 'Forza delle gambe e della parte alta, velocità, esplosività, resistenza, tecnica con la palla, prevenzione, kettlebell, recupero. Uno, alcuni in ordine di priorità, o tutto in equilibrio.',
    alt: 'Il setup del Fisico: gli obiettivi scelti in ordine, forza gambe, tecnica palla e velocità.',
  },
  {
    id: 'setup',
    parte: 'Fisico',
    titolo: 'Con quello che hai',
    testo: 'Palestra, kettlebell, sbarra, un campo, un muro, o niente: il corpo libero c\'è sempre. Dici anche la fase della stagione, i giorni, il tempo che hai e le zone da proteggere.',
    alt: 'Il setup del Fisico: gli attrezzi a disposizione, esperienza in palestra e compagno.',
  },
  {
    id: 'fisico',
    parte: 'Fisico',
    titolo: 'La settimana intorno alla partita',
    testo: 'Dici quando giochi e quando ti alleni con la squadra: la settimana si prepara intorno a quei giorni, sui tuoi test.',
    alt: 'La settimana del Fisico: due sedute, gambe il venerdì e rapidità pre partita il sabato, con la partita la domenica.',
  },
  {
    id: 'seduta',
    parte: 'Fisico',
    titolo: 'La seduta, esercizio per esercizio',
    testo: 'Serie, ripetizioni e recupero. Per ogni esercizio come si esegue, gli errori da evitare, la versione più facile e quella più difficile, e il video.',
    alt: 'La pagina di una seduta: rapidità, tiro e tocchi di palla pre partita, con gli esercizi in ordine.',
  },
  {
    id: 'recupero',
    parte: 'Fisico',
    titolo: "Dici com'è andata, la prossima si regola",
    testo: 'Nel recupero dici quante ne hai fatte e quanto è stata dura. Facile due volte di fila: la volta dopo si sale. Fa male qualcosa: si alleggerisce.',
    alt: 'Il recupero tra due serie: il tempo che scorre, quante ripetizioni hai fatto, quale lato è stato più duro.',
  },
  {
    id: 'test',
    parte: 'Fisico',
    titolo: 'Test per sapere dove sei',
    testo: 'Forza a corpo libero, scale a gradini, tecnica con la palla, salti, velocità, resistenza. Uno alla volta, quando vuoi: da lì partono le dosi, e si rifanno dentro le sedute.',
    alt: 'La batteria di test: il prossimo test consigliato e i gruppi di test con quanti ne hai fatti.',
  },
];

/** Tutte le schermate, per il telefono dell'apertura che gira da solo. */
export const MOMENTI_APP: MomentoApp[] = [MOMENTI_TESTA[0], MOMENTI_FISICO[2], MOMENTI_TESTA[2], MOMENTI_FISICO[3], MOMENTI_TESTA[3], MOMENTI_FISICO[4], MOMENTI_TESTA[1], MOMENTI_FISICO[0], MOMENTI_FISICO[5], MOMENTI_FISICO[1]];

/** «Scopri di più»: il dettaglio di ogni parte, per gruppi. Solo cose che l'app fa davvero. */
export interface GruppoDettaglio {
  titolo: string;
  righe: string[];
}

export const DETTAGLI_TESTA: GruppoDettaglio[] = [
  {
    titolo: 'Da dove viene',
    righe: [
      'Tecniche studiate e messe alla prova da più di cinque anni, sul campo.',
      'Raccolte da professionisti e da diversi libri studiati, poi ridotte a quello che si può fare in campo.',
      'Provate prima su di me, da calciatore, poi sui ragazzi che alleno.',
    ],
  },
  {
    titolo: 'Il percorso: 12 settimane in tre blocchi',
    righe: [
      'Settimane 1-4, costruire lo strumento: il Reset, osservare i pensieri, ascoltare il corpo, il Protocollo Pressione per i momenti che contano.',
      'Settimane 5-8, giocare nelle difficoltà: l\'errore, la panchina, il giudizio, quello che ti porti dietro dopo la partita.',
      'Settimane 9-12, giocare libero: la tua routine, le tue risposte pronte, il tuo protocollo.',
      'Alla fine di ogni settimana il Gate: tre o quattro domande sulla settimana. La successiva si apre da lì.',
    ],
  },
  {
    titolo: 'Ogni giorno',
    righe: [
      'Un\'apertura, una pratica guidata con l\'audio (da 3 a 15 minuti) e una domanda.',
      'Un check-in del mattino da venti secondi: sonno, come stai, quanto eri presente ieri.',
      'Le tue 5 azioni da fare durante la giornata, e l\'esercizio della settimana fuori dal campo.',
    ],
  },
  {
    titolo: 'Quando serve',
    righe: [
      'Il Coach, in app e su Telegram: conosce il tuo percorso e le tue risposte.',
      'Le schede per i momenti difficili (ansia prima della partita, l\'errore, la panchina, il mister), che crescono con le settimane.',
      'La Carta del Giocatore con le tue parole, da rileggere prima di entrare in campo.',
    ],
  },
];

export const DETTAGLI_FISICO: GruppoDettaglio[] = [
  {
    titolo: 'Il metodo è di un preparatore, l\'AI lo adatta a te',
    righe: [
      'Esercizi, progressioni, regole e limiti vengono da anni di lavoro con più di 100 calciatori.',
      'L\'AI costruisce la tua settimana dentro quelle regole, partendo dai tuoi obiettivi, dai tuoi impegni e da come sono andate le sedute.',
      'Prima che tu la veda, un controllo automatico la verifica: carichi, distanza dalla partita, tempi di recupero. Quello che non torna viene sistemato o rifatto.',
    ],
  },
  {
    titolo: 'Cosa puoi allenare',
    righe: [
      'Forza delle gambe e della parte alta, a corpo libero su scale a gradini o in palestra.',
      'Velocità, rapidità, esplosività e salti.',
      'Resistenza, a serie come in campo, anche senza campo.',
      'Tecnica con la palla: palleggi, controllo e passaggi, freestyle, visione, dribbling, tiro.',
      'Prevenzione e fascia, kettlebell, recupero.',
    ],
  },
  {
    titolo: 'Quanto è tuo',
    righe: [
      'La fase della stagione (fuori stagione, preparazione, in stagione), i giorni, quante giornate e quanto tempo per seduta.',
      'Gli attrezzi che hai, o nessuno. Con un compagno o da solo.',
      'Gli allenamenti con la squadra e la partita: la settimana si costruisce intorno.',
      'Gli infortuni passati e le zone da proteggere: lì gli esercizi pesano meno.',
      'Quante aree insieme dipende dal livello: Base una, Medio due, Pro tutte.',
      'Il preparatore AI in chat (Medio e Pro), se vuoi cambiare qualcosa o capire il perché.',
    ],
  },
  {
    titolo: 'Cosa tiene in conto',
    righe: [
      'Il voto di ogni serie, le ripetizioni fatte davvero e com\'è venuto il gesto.',
      'Il voto della seduta e il giudizio su ogni parte: facile, giusta, dura.',
      'Com\'è andata con la squadra e in partita: fatica, minuti, fastidi.',
      'Il check-in del mattino e il carico della settimana, squadra compresa.',
      'Un dolore segnalato: da 4 su 10 le sedute si fermano e ti consigliamo di farti vedere.',
      'Le settimane di scarico quando i dati dicono che servono.',
    ],
  },
  {
    titolo: 'Per crescere e misurarti',
    righe: [
      'Test di forza, salti, velocità, resistenza e tecnica, uno alla volta: da lì partono le dosi.',
      'Le scale a gradini: quando una serie arriva alla soglia, passi al gradino dopo.',
      'Le serie di prova tornano dentro le sedute, senza giornate di soli test.',
      'La Carta mostra da dove sei partito e dove sei adesso.',
    ],
  },
  {
    titolo: 'Ogni esercizio, spiegato',
    righe: [
      'Più di 300 esercizi, ognuno con la sua scheda: come si esegue passo per passo, gli errori da evitare, la versione più facile e quella più difficile, le note di sicurezza.',
      'Video dimostrativi, e i video dei segnali da mettere sul telefono per gli esercizi di visione.',
    ],
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
