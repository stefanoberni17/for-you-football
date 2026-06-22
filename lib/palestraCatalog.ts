/**
 * Palestra — esercizi base per CAPACITÀ (principio), non per strumento.
 *
 * Modello: la Palestra è il livello "allenamento". Ogni capacità (Presenza,
 * Osservazione, Ascolto, Pressione, Accettazione, Perdono, Lasciare Andare) ha
 * un menu di esercizi base, concreti e rifacibili OGNI giorno. Il primo
 * esercizio di ogni capacità è lo strumento-àncora del percorso (preso da
 * toolsCatalog → single source of truth); seguono i drill base.
 *
 * Fonti: esercizi adattati al registro campo da "Percorso Crescita FORYOU"
 * (Notion) + evidenza (sigh fisiologico Stanford/Huberman, ATT/noting MBSR,
 * ACT defusione/espansione/urge surfing/drop-anchor, PMR sport psych). NIENTE
 * introspezione pesante (lettere, "vero Sé"): quella resta al percorso/Coach.
 *
 * Sblocco: una capacità è visibile al RAGGIUNGIMENTO della sua settimana
 * (current_week >= week). I singoli esercizi possono avere un `week` proprio
 * (es. Fatto vs Storia, W6, dentro Accettazione che apre a W5) per rispettare
 * la REGOLA ANTICIPAZIONI. Binario indipendente: non tocca percorso/streak.
 */

import { TOOLS } from './toolsCatalog';

export type TipoPratica = 'respirazione' | 'visualizzazione' | 'riflessione';

export interface PalestraExercise {
  id: string;
  nome: string;
  cosaAllena: string; // spiegazione: cosa alleni e perché (mostrato nel dettaglio)
  pratica: string; // step numerati per PracticePopup
  durataMinuti: number;
  tipoPratica?: TipoPratica;
  week?: number; // override sblocco del singolo esercizio (default = week della capacità)
  ancora?: boolean; // true = è lo strumento-àncora del percorso
}

export interface Capacita {
  id: string;
  principio: string; // "Presenza", "Osservazione", …
  week: number; // settimana di sblocco (al raggiungimento)
  emoji: string;
  sottotitolo: string; // una riga: cos'è questa capacità
  esercizi: PalestraExercise[];
}

/** Costruisce l'esercizio-àncora da uno strumento (single source: toolsCatalog). */
function anchor(toolId: string, cosaAllena: string, tipoPratica: TipoPratica, week?: number): PalestraExercise {
  const t = TOOLS.find(x => x.id === toolId);
  if (!t) throw new Error(`Tool non trovato: ${toolId}`);
  return {
    id: t.id,
    nome: t.nome,
    cosaAllena,
    pratica: t.pratica,
    durataMinuti: t.durataMinuti,
    tipoPratica,
    week,
    ancora: true,
  };
}

export const CAPACITA: Capacita[] = [
  {
    id: 'presenza',
    principio: 'Presenza',
    week: 1,
    emoji: '🌬️',
    sottotitolo: 'Tornare al presente, a comando.',
    esercizi: [
      anchor(
        'reset',
        'Lo strumento base della presenza: tre secondi per tornare qui — respiro, gesto, mantra. È il gesto che richiami in campo quando la testa è andata altrove.',
        'respirazione'
      ),
      {
        id: 'respiro-sigh',
        nome: 'Il respiro che spegne',
        cosaAllena:
          'Tornare calmo in fretta, col meccanismo più rapido del corpo. Due inspiri brevi riaprono i polmoni, un’espirazione lunga accende il freno del sistema nervoso (il nervo vago) e rallenta il cuore. Stanford l’ha visto battere la meditazione su umore e stress, con effetto che cresce coi giorni. Usalo tra un’azione e l’altra, o prima di un momento che pesa.',
        durataMinuti: 3,
        tipoPratica: 'respirazione',
        pratica: `Seduto o in piedi, spalle morbide.

1. Inspira dal naso.
2. Senza espirare, fai un secondo piccolo inspiro dal naso per riempire del tutto i polmoni.
3. Espira lentamente e a lungo dalla bocca — più lungo che puoi.
4. Ripeti il ciclo. Bastano 3 respiri per calmarti adesso; continua per la durata se vuoi la dose piena.`,
      },
      {
        id: 'conteggio',
        nome: 'Il conteggio',
        cosaAllena:
          'Tenere l’attenzione su un punto e tornarci quando scappa: è la concentrazione, il muscolo della presenza. Il numero è l’àncora, il pensiero è il disturbo, ogni ritorno è una ripetizione vera. La distrazione non è l’errore: accorgersene e tornare È l’esercizio.',
        durataMinuti: 3,
        tipoPratica: 'riflessione',
        pratica: `Seduto, occhi chiusi, un respiro per arrivare qui.

1. Porta l'attenzione sul numero 0. Tienilo lì, fermo, come un punto.
2. Appena ti accorgi che è arrivato un pensiero, non seguirlo e non scacciarlo: lascialo andare e passa a 1.
3. Tieni 1. Al pensiero dopo, lascialo e passa a 2. Poi 3, 4, e così via.
4. Non contano i numeri alti. Conta accorgerti: ogni volta che noti e passi al numero dopo, hai allenato la cosa giusta.`,
      },
      {
        id: 'cinque-sensi',
        nome: '5-4-3-2-1',
        cosaAllena:
          'Radicarti coi sensi quando la testa corre — utile prima del fischio o dopo un errore. Spostare l’attenzione su cosa c’è davvero intorno a te spegne la rimuginazione e ti riporta nel presente in un minuto.',
        durataMinuti: 1,
        tipoPratica: 'riflessione',
        pratica: `Fermati dove sei. Senza muoverti, porta l'attenzione fuori, una cosa alla volta:

1. Cinque cose che VEDI.
2. Quattro suoni che SENTI.
3. Tre cose che potresti TOCCARE.
4. Due odori.
5. Una cosa che senti in bocca.

Sei tornato qui.`,
      },
    ],
  },
  {
    id: 'osservazione',
    principio: 'Osservazione',
    week: 2,
    emoji: '👀',
    sottotitolo: 'Guardare i pensieri passare, senza salirci sopra.',
    esercizi: [
      anchor(
        'observer',
        'Lo strumento base dell’osservazione: nomini il pensiero invece di seguirlo — Passato, Futuro o Giudizio. Dargli un’etichetta ne abbassa la presa.',
        'visualizzazione'
      ),
      {
        id: 'foglie-ruscello',
        nome: 'Le foglie sul ruscello',
        cosaAllena:
          'Guardare i pensieri passare senza salirci sopra. Qui non cerchi di restare concentrato (quella è la Presenza): lasci che la mente produca e ti alleni a vederla da fuori. La psicologia dell’accettazione (ACT) lo chiama defusione: quando vedi un pensiero come un pensiero, e non come la realtà, perde la presa.',
        durataMinuti: 4,
        tipoPratica: 'visualizzazione',
        pratica: `Seduto, occhi chiusi, un respiro.

1. Immagina un ruscello che scorre, e foglie che galleggiano sull'acqua.
2. Ogni pensiero che arriva, posalo su una foglia — un'immagine, una parola, una preoccupazione — e lascia che scorra via.
3. Non spingere il ruscello e non fermarlo. Se un pensiero torna, rimettilo su una foglia.
4. Se ti accorgi di essere dentro un pensiero invece che a guardarlo, è normale: notalo e torna al ruscello. Quel ritorno è l'esercizio.`,
      },
      {
        id: 'sto-avendo-il-pensiero',
        nome: '«Sto avendo il pensiero che…»',
        cosaAllena:
          'La defusione in dieci secondi. Invece di «sono scarso», dici dentro «sto avendo il pensiero che sono scarso». La frase stessa ti sposta da dentro il pensiero a fuori, a guardarlo — e così perde autorità. Da usare anche in campo.',
        durataMinuti: 1,
        tipoPratica: 'riflessione',
        pratica: `Seduto, un respiro.

1. Prendi il pensiero che brucia, così com'è: «non ci riesco».
2. Rimettilo davanti con la formula: «Mi sto accorgendo di avere il pensiero che non ci riesco».
3. Nota la differenza: il pensiero è lo stesso, ma adesso lo guardi — non ci sei dentro.
4. Ripeti con un altro pensiero, se ne arriva uno.`,
      },
    ],
  },
  {
    id: 'ascolto',
    principio: 'Ascolto',
    week: 3,
    emoji: '🦵',
    sottotitolo: 'Sentire il corpo prima che parli la mente.',
    esercizi: [
      anchor(
        'body-check',
        'Lo strumento base dell’ascolto: quattro punti in 15 secondi (piedi, stomaco, petto, spalle). Il corpo segnala la tensione prima che tu la pensi.',
        'riflessione'
      ),
      {
        id: 'attenzione-divisa',
        nome: 'Attenzione divisa',
        cosaAllena:
          'Restare presente al corpo mentre ti muovi — presenza in azione, non da fermo. È il muscolo che in campo ti fa sentire te stesso e leggere il gioco nello stesso momento.',
        durataMinuti: 3,
        tipoPratica: 'riflessione',
        pratica: `In piedi, occhi aperti.

1. Una mano sul punto sotto lo sterno: senti il respiro che entra ed esce.
2. Senza perdere il corpo, apri lo sguardo a ciò che hai intorno — oggetti, suoni, spazio.
3. Tieni le due cose insieme: te dentro + il mondo fuori.
4. Cammina piano facendo lo stesso.
5. Se ti perdi in una delle due, torna prima al corpo, poi riapri fuori.`,
      },
      {
        id: 'scansione-corpo',
        nome: 'Scansione del corpo',
        cosaAllena:
          'Ascoltare il corpo zona per zona, più lento e completo del Body Check. Scorri l’attenzione e noti cosa c’è — caldo, freddo, peso, tensione — senza cambiare niente. La ricerca (MBSR) mostra che allena la capacità di sentire i segnali del corpo.',
        durataMinuti: 5,
        tipoPratica: 'riflessione',
        pratica: `Seduto o sdraiato, occhi chiusi, un respiro.

1. Parti dai piedi: cosa senti? Caldo, freddo, pesante, leggero? Solo notare.
2. Sali piano: gambe, bacino, pancia, petto, spalle, braccia, collo, viso.
3. Se ti distrai, torna con gentilezza dov'eri.
4. Niente da aggiustare: stai allenando l'occhio interno, non il rilassamento.`,
      },
      {
        id: 'dove-senti-il-respiro',
        nome: 'Dove senti il respiro',
        cosaAllena:
          'Un ingresso gentile all’ascolto del corpo: trova il punto dove senti il respiro più vivo e resta lì. Più facile di una scansione intera quando sei agitato.',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `Occhi chiusi, non cambiare il respiro.

1. Cerca dove lo senti di più: le narici? il petto? la pancia?
2. Posa l'attenzione lì e restaci.
3. Quando scappa, riportala a quel punto. Solo quello, per tutto il tempo.`,
      },
    ],
  },
  {
    id: 'pressione',
    principio: 'Sotto pressione',
    week: 4,
    emoji: '🛡️',
    sottotitolo: 'Restare lucido quando il momento pesa.',
    esercizi: [
      anchor(
        'protocollo',
        'Lo strumento base della pressione: SENTI → NOMINA → TORNA, i tre attrezzi in sequenza in 15-20 secondi. Quando la pressione sale, parte da solo.',
        'riflessione'
      ),
      {
        id: 'ancora',
        nome: "L'Ancora",
        cosaAllena:
          'Ritrovare terra quando un’emozione forte ti travolge — dopo un errore, prima di un momento grosso. Non spegne l’emozione: ti tiene stabile mentre passa. Tre tempi, dalla terapia dell’accettazione (ACT).',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `In piedi o seduto, occhi aperti.

1. RICONOSCI: nomina cosa c'è — «c'è rabbia», «c'è paura». Senza combatterlo.
2. TORNA NEL CORPO: premi i piedi a terra, raddrizza la schiena, un respiro lungo.
3. RIAGGANCIA: alza lo sguardo, nota tre cose intorno a te, e torna a quello che stai facendo.

La tempesta resta, ma l'ancora tiene: la barca non va alla deriva.`,
      },
    ],
  },
  {
    id: 'accettazione',
    principio: 'Accettazione',
    week: 5,
    emoji: '⚡',
    sottotitolo: 'Smettere di lottare con quello che è già successo.',
    esercizi: [
      anchor(
        'stacco',
        'Lo strumento base dell’accettazione: stacchi dall’errore appena fatto, prima che ne arrivi un secondo.',
        'visualizzazione'
      ),
      anchor(
        'fatto-vs-storia',
        'Separi quello che è successo davvero dal veleno che ci aggiungi. Tieni il fatto.',
        'riflessione',
        6
      ),
      {
        id: 'fare-spazio',
        nome: 'Fare spazio',
        cosaAllena:
          'Accettare non è arrendersi: è smettere di combattere una sensazione, così smette di crescere. Dalla terapia dell’accettazione (ACT): fai posto a quello che senti invece di spingerlo via.',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `Seduto, un respiro.

1. Nota la sensazione che non vuoi — tensione, nervoso, peso. Dove sta nel corpo?
2. Invece di spingerla via, respira dentro di lei: l'aria che arriva fin lì.
3. Falle spazio intorno: «non mi deve piacere, ma può stare qui».
4. Lasciala stare mentre continui. Non combatti più — e senza la lotta, pesa meno.`,
      },
    ],
  },
  {
    id: 'perdono',
    principio: 'Perdono',
    week: 7,
    emoji: '🔥',
    sottotitolo: 'Guidare il fuoco invece di subirlo.',
    esercizi: [
      anchor(
        'anticipo',
        'Lo strumento base: senti la rabbia salire un secondo prima, e scegli invece di subirla.',
        'visualizzazione'
      ),
      {
        id: 'cavalca-impulso',
        nome: "Cavalca l'impulso",
        cosaAllena:
          'L’impulso di reagire — al fallo non dato, alla provocazione — è un’onda: sale, arriva in cima, scende. Se non lo agisci, passa da solo. Ti alleni a cavalcarlo invece di esserne buttato giù.',
        durataMinuti: 2,
        tipoPratica: 'riflessione',
        pratica: `Quando senti l'impulso a reagire, fermati un secondo. Non agire ancora.

1. Senti l'onda nel corpo: dove sale, quanto è forte (da 1 a 10)?
2. Respira e restaci sopra, come un surfista: l'onda sale… arriva in cima…
3. Guardala scendere. Non l'hai agita, e sei ancora in piedi.
4. Adesso scegli tu la prossima azione, lucido.`,
      },
    ],
  },
  {
    id: 'lasciare-andare',
    principio: 'Lasciare Andare',
    week: 8,
    emoji: '🎒',
    sottotitolo: 'Posare il peso ed entrare puliti.',
    esercizi: [
      anchor(
        'rilascio',
        'Lo strumento base: lasci il peso della partita di ieri sul campo, ed entri pulito.',
        'visualizzazione'
      ),
      {
        id: 'tensione-rilascio',
        nome: 'Tensione-rilascio',
        cosaAllena:
          'Il modo più fisico di lasciar andare: stringi un muscolo, poi mollalo di colpo e senti la differenza. Il corpo impara cosa vuol dire «lasciare», e la ricerca sugli atleti mostra che abbassa l’ansia da gara e la tensione muscolare.',
        durataMinuti: 4,
        tipoPratica: 'riflessione',
        pratica: `Seduto, occhi chiusi.

1. Stringi i pugni e le braccia, forte, 5 secondi… poi molla di colpo. Senti la differenza.
2. Spalle su verso le orecchie, 5 secondi… molla.
3. Stringi viso e mascella, 5 secondi… molla.
4. Gambe e piedi, 5 secondi… molla.
5. Resta un attimo a sentire il corpo più morbido. Quello è lasciare andare, nel corpo.`,
      },
      {
        id: 'zaino',
        nome: 'La visualizzazione dello zaino',
        cosaAllena:
          'La versione lunga del Rilascio: svuoti lo zaino dei pesi che ti porti dietro, uno alla volta. Dare un nome a ciò che molli lo rende reale.',
        durataMinuti: 5,
        tipoPratica: 'visualizzazione',
        pratica: `Occhi chiusi, qualche respiro.

1. Immagina di camminare con uno zaino pesante sulle spalle.
2. Aprilo. Cosa c'è dentro? Una paura, il giudizio di qualcuno, un errore, un dovere che non è tuo.
3. Tira fuori un peso alla volta. Dagli un nome: «questa è la paura di sbagliare».
4. Posalo a terra e guardalo restare indietro mentre vai avanti.
5. Continua finché lo zaino è leggero. Poi senti com'è camminare così.`,
      },
    ],
  },
];

/** Capacità sbloccate per la settimana corrente (al raggiungimento). */
export function unlockedCapacita(currentWeek: number): Capacita[] {
  return CAPACITA.filter(c => currentWeek >= c.week);
}

/** Esercizi visibili dentro una capacità (rispetta l'eventuale week del singolo esercizio). */
export function visibleEsercizi(c: Capacita, currentWeek: number): PalestraExercise[] {
  return c.esercizi.filter(e => currentWeek >= (e.week ?? c.week));
}
