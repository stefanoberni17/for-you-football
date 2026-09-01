/**
 * FYF Training — catalogo v0 (catene, test, soglie, bounds, AMRAP).
 *
 * Fonte: docs/training-recap-progressioni.md (metodologia formalizzata con Ste,
 * 26-27 ago 2026). Il catalogo vive in TS per la v0 (come actionsCatalog /
 * palestraCatalog); migra a tabelle Supabase quando il modulo apre agli utenti.
 *
 * GUARDRAIL: il planner LLM può usare SOLO esercizi di questo catalogo, dentro
 * i BOUNDS qui definiti. Il validatore (trainingEngine.validatePlan) applica
 * entrambi — qualunque cosa dica il prompt o chieda l'utente.
 */

export type FasciaLivello = 'B' | 'A' | 'PRO';
export type TestLivello = 'base' | 'intermedio' | 'avanzato' | 'pro';
export type AreaForza = 'spinta' | 'tirata' | 'core' | 'lombari';
export type AreaTecnica = 'palleggi' | 'muro' | 'conduzione';
export type Area = AreaForza | AreaTecnica | 'laterale' | 'fascia' | 'mobilita';

export interface TrainingExercise {
  id: string;
  nome: string;
  area: Area;
  gradino: number; // posizione nella catena (1 = più facile); per fascia = difficoltà 1-3
  unita: 'reps' | 'secondi' | 'minuti';
  videoUrl?: string;
  note?: string;
  descrizione?: string; // come si esegue: posizione, movimento, errori comuni
}

// ─── Catene FISICA ───────────────────────────────────────────────────────────

export const ESERCIZI: TrainingExercise[] = [
  // Spinta (push)
  { id: 'push-1', nome: 'Piegamenti sulle ginocchia', area: 'spinta', gradino: 1, unita: 'reps' , descrizione: "In quadrupedia con le ginocchia a terra e mani poco più larghe delle spalle. Scendi col petto verso il pavimento tenendo il corpo in linea dalla testa alle ginocchia, poi spingi. Errore comune: sedere indietro — il bacino resta in linea." },
  { id: 'push-2', nome: 'Piegamenti', area: 'spinta', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/0SlsazXrDyI' , descrizione: "Mani poco più larghe delle spalle, corpo in linea dai talloni alla testa, addome attivo. Petto a terra e braccia distese in cima, gomiti a ~45° dal busto. Errore comune: bacino che cade o si alza." },
  { id: 'push-3', nome: 'Piegamenti arciere', area: 'spinta', gradino: 3, unita: 'reps' , descrizione: "Mani molto larghe: scendi spostando il peso su un braccio mentre l'altro si distende di lato. Alterna i lati. Il braccio di lavoro fa quasi tutto, l'altro guida." },
  { id: 'push-4', nome: 'Piegamenti arciere inclinati', area: 'spinta', gradino: 4, unita: 'reps' , descrizione: "Come l'arciere ma con le mani su un rialzo (panca/gradino): l'inclinazione riduce il carico e prepara il lavoro a un braccio con range completo." },
  { id: 'push-5', nome: 'Piegamenti 1 braccio — negative', area: 'spinta', gradino: 5, unita: 'reps' , descrizione: "Un braccio dietro la schiena, piedi larghi: SOLO la discesa, lenta (4-5 secondi), poi rimettiti in posizione con due braccia. Costruisce la forza eccentrica per il piegamento a un braccio." },
  { id: 'push-6', nome: 'Piegamenti 1 braccio inclinati', area: 'spinta', gradino: 6, unita: 'reps' , descrizione: "Piegamento a un braccio con le mani su un rialzo. Piedi molto larghi, corpo rigido, spalla lontana dall'orecchio. Scendi controllato, spingi senza ruotare il busto." },
  { id: 'push-7', nome: 'Piegamenti 1 braccio orizzontali', area: 'spinta', gradino: 7, unita: 'reps' , descrizione: "Il piegamento a un braccio completo a terra. Piedi larghi, core durissimo, il busto resta parallelo al pavimento: se ruoti vistosamente, torna al gradino prima." },
  { id: 'push-8', nome: 'Piegamenti 1 braccio declinati', area: 'spinta', gradino: 8, unita: 'reps', videoUrl: 'https://youtube.com/shorts/Lbw-eJf6Jn4' , descrizione: "Piegamento a un braccio con i piedi su un rialzo: più carico sulla spalla. Solo con il gradino precedente pulito." },
  // Tirata (pull) — richiede sbarra
  { id: 'pull-1', nome: 'Australian pull-up ginocchia piegate', area: 'tirata', gradino: 1, unita: 'reps' , descrizione: "Sotto una sbarra bassa (o un tavolo robusto), ginocchia piegate e piedi a terra: tira il petto alla sbarra tenendo il corpo in linea, scendi controllato." },
  { id: 'pull-2', nome: 'Australian pull-up gambe tese', area: 'tirata', gradino: 2, unita: 'reps' , descrizione: "Come sopra ma con le gambe tese e i talloni a terra: più corpo da tirare. Scapole attive, bacino in linea." },
  { id: 'pull-3', nome: 'Negativa lenta alla sbarra (5")', area: 'tirata', gradino: 3, unita: 'reps' , descrizione: "Salta o aiutati per portare il mento sopra la sbarra, poi SOLO la discesa: 5 secondi controllati fino a braccia distese. È l'esercizio che costruisce il primo pull-up." },
  { id: 'pull-4', nome: 'Pull-up assistito (elastico/appoggio)', area: 'tirata', gradino: 4, unita: 'reps' , descrizione: "Pull-up con un elastico sotto i piedi/ginocchia o un piede su un appoggio. L'aiuto va scelto per riuscire a fare le reps con forma pulita, non facile." },
  { id: 'pull-5', nome: 'Pull-up', area: 'tirata', gradino: 5, unita: 'reps', videoUrl: 'https://youtube.com/shorts/SupJzuKhp54' , descrizione: "Dalla sospensione completa, tira finché il mento supera la sbarra e scendi fino a braccia distese. Niente slancio (kipping): sale il petto, non le ginocchia." },
  { id: 'pull-6', nome: 'Pull-up presa larga', area: 'tirata', gradino: 6, unita: 'reps' , descrizione: "Presa ben oltre le spalle: più lavoro di dorsali, meno di braccia. Range completo, discesa controllata." },
  { id: 'pull-7', nome: 'Archer pull-up', area: 'tirata', gradino: 7, unita: 'reps' , descrizione: "Un braccio tira, l'altro resta teso di lato sulla sbarra a guidare. Sali verso il braccio di lavoro. Alterna i lati." },
  { id: 'pull-8', nome: 'Typewriter / full moon', area: 'tirata', gradino: 8, unita: 'reps' , descrizione: "Sali da un lato (archer), trasla il mento lungo la sbarra fino all'altro braccio e scendi da lì. Fluido, senza cadere nel mezzo." },
  { id: 'pull-9', nome: 'One-arm pull-up assistito', area: 'tirata', gradino: 9, unita: 'reps' , descrizione: "Un braccio sulla sbarra, l'altro afferra il polso o un asciugamano appeso: riduce gradualmente l'aiuto verso il one-arm." },
  { id: 'pull-10', nome: 'One-arm pull-up', area: 'tirata', gradino: 10, unita: 'reps' , descrizione: "La trazione a un braccio completa. Solo con i gradini precedenti consolidati: spalla attiva, niente strattoni." },
  // Core
  { id: 'core-1', nome: 'Plank sulle ginocchia', area: 'core', gradino: 1, unita: 'secondi' , descrizione: "Gomiti sotto le spalle, ginocchia a terra, corpo in linea dalle ginocchia alla testa. Addome e glutei attivi, niente affossamento lombare." },
  { id: 'core-2', nome: 'Plank', area: 'core', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/MdrinUXALJQ' , descrizione: "Gomiti sotto le spalle, piedi a terra, corpo in linea dai talloni alla testa. Spingi i gomiti nel pavimento, addome duro. Se il bacino cade, la serie è finita." },
  { id: 'core-3', nome: 'Plank a braccia tese, mani avanti (leva lunga)', area: 'core', gradino: 3, unita: 'secondi' , descrizione: "Plank a braccia tese, poi cammina con le mani sempre più avanti rispetto alle spalle: più la leva si allunga, più il core lavora. Fermati dove tieni la forma." },
  { id: 'core-4', nome: 'Plank con braccio e gamba opposti sollevati', area: 'core', gradino: 4, unita: 'secondi' , descrizione: "Dal plank, solleva un braccio e la gamba opposta e TIENI la posizione senza ruotare il bacino. Metà tenuta per lato." },
  { id: 'core-5', nome: 'Hollow hold ginocchia piegate', area: 'core', gradino: 5, unita: 'secondi' , descrizione: "Sdraiato a pancia in su: lombari INCOLLATE a terra, spalle e gambe sollevate, ginocchia piegate. Se le lombari si staccano, piega di più le ginocchia." },
  { id: 'core-6', nome: 'Hollow hold', area: 'core', gradino: 6, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/zTiwvx20mYc' , descrizione: "Come sopra ma con gambe tese e braccia dietro la testa: corpo a banana, lombari sempre a terra. La posizione chiave della ginnastica." },
  { id: 'core-7', nome: 'Hollow rocks', area: 'core', gradino: 7, unita: 'reps' , descrizione: "Dalla hollow, dondola avanti e indietro TENENDO la forma rigida: il movimento nasce dal dondolio, non da spinte. 1 dondolio = 1 rep." },
  { id: 'core-8', nome: 'Dragon flag — negativa', area: 'core', gradino: 8, unita: 'reps' , descrizione: "Sdraiato, mani aggrappate dietro la testa: gambe e bacino sollevati in verticale, poi SOLO la discesa lenta del corpo teso. Avanzato: serve la hollow consolidata." },
  // Lombari / catena posteriore
  { id: 'lomb-1', nome: 'Superman hold', area: 'lombari', gradino: 1, unita: 'secondi' , descrizione: "A pancia in giù, braccia avanti: solleva insieme braccia, petto e gambe e TIENI. Guarda il pavimento (collo neutro), non strafare con l'altezza." },
  { id: 'lomb-2', nome: 'Superman alternato', area: 'lombari', gradino: 2, unita: 'reps' , descrizione: "Come il superman ma alternando: braccio destro + gamba sinistra su, poi cambio. Movimento controllato, senza rimbalzare. 1 cambio = 1 rep." },
  { id: 'lomb-3', nome: 'Swimmer', area: 'lombari', gradino: 3, unita: 'secondi' , descrizione: "Dal superman, piccoli battiti alternati di braccia e gambe come nuotando. Il busto resta sollevato per tutta la durata." },
  { id: 'lomb-4', nome: 'Arch hold', area: 'lombari', gradino: 4, unita: 'secondi' , descrizione: "A pancia in giù, braccia lungo i fianchi o avanti: massima estensione tenuta, corpo ad arco. Più intensa del superman." },
  { id: 'lomb-5', nome: 'Arch rocks', area: 'lombari', gradino: 5, unita: 'reps' , descrizione: "Dall'arch hold, dondola avanti e indietro tenendo il corpo rigido in estensione. 1 dondolio = 1 rep." },
  { id: 'lomb-6', nome: 'Ponte glutei a una gamba', area: 'lombari', gradino: 6, unita: 'reps', videoUrl: 'https://youtube.com/shorts/FQPEqDy8IBI' , descrizione: "A pancia in su, un piede a terra e l'altra gamba tesa: spingi il bacino in alto col tallone, stringi il gluteo in cima, scendi controllato. Metà reps per gamba." },
  // Laterale / obliqui — nei circuiti, 1-2 per volta, non in tutte le sedute
  { id: 'lat-1', nome: 'Plank laterale sulle ginocchia', area: 'laterale', gradino: 1, unita: 'secondi' , descrizione: "Su un gomito e le ginocchia, corpo in linea: solleva il bacino e tieni. Il fianco lavora. Metà tenuta per lato." },
  { id: 'lat-2', nome: 'Plank laterale', area: 'laterale', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/MdrinUXALJQ' , descrizione: "Su un gomito e il bordo esterno del piede, corpo in linea dalla testa ai piedi: bacino alto, spalla lontana dall'orecchio. Metà tenuta per lato." },
  { id: 'lat-3', nome: 'Plank laterale con abduzione gamba', area: 'laterale', gradino: 3, unita: 'secondi' , descrizione: "Dal plank laterale, solleva anche la gamba libera verso l'alto e tieni: fianco e anca lavorano insieme." },
  { id: 'lat-4', nome: 'Copenhagen plank ginocchio piegato', area: 'laterale', gradino: 4, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/9pLQwT8RuUc', note: 'Impegnativo sugli adduttori: mai il giorno prima della partita.' , descrizione: "Fianco a una panca/sedia: il GINOCCHIO della gamba sopra appoggia sul rialzo, corpo in linea sospeso. Adduttori sotto carico: entra graduale, mai a freddo." },
  { id: 'lat-5', nome: 'Copenhagen plank gamba tesa', area: 'laterale', gradino: 5, unita: 'secondi', note: 'Mai il giorno prima della partita.' , descrizione: "Come sopra ma con il PIEDE (gamba tesa) sul rialzo: molto più carico sugli adduttori. Solo con il gradino precedente pulito." },
  { id: 'lat-6', nome: 'Russian twist / rotazioni controllate', area: 'laterale', gradino: 6, unita: 'reps' , descrizione: "Seduto, busto inclinato indietro, piedi a terra (o sollevati per aumentare): ruota il busto controllando il movimento da un lato all'altro. 1 rotazione completa = 1 rep. Niente strappi." },
  // Fascia — piede/caviglia (binario parallelo, prevenzione)
  { id: 'fascia-towel-curls', nome: 'Towel curls', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/qW8YXLmdke0' , descrizione: "In piedi, avampiede su un asciugamano: 'arriccia' le dita come per accorciare la pianta del piede, trascinando l'asciugamano. Lento e completo." },
  { id: 'fascia-toes-updown', nome: 'Toes up/down', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/1_TtKlvDeqk' , descrizione: "In piedi: solleva solo le dita tenendo l'avampiede a terra, poi solo l'avampiede tenendo le dita. Controllo, non velocità." },
  { id: 'fascia-toes-updown-2', nome: 'Toes up/down 2', area: 'fascia', gradino: 1, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/JctaRd1xxng' },
  { id: 'fascia-toe-bounces', nome: 'Toe bounces', area: 'fascia', gradino: 2, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/rleHrcL6teA' , descrizione: "Saltelli piccoli e rapidi sull'avampiede, tallone che NON tocca terra, caviglia rigida come una molla. Rimbalzo, non salto." },
  { id: 'fascia-towel-slrdl', nome: 'FY Towel SLRDL', area: 'fascia', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/_0TsEKkUqGw' , descrizione: "In equilibrio su una gamba con l'avampiede che tiene un asciugamano: inclinati avanti col busto (schiena dritta) e torna su. Il piede lavora per stabilizzare." },
  { id: 'fascia-towel-8', nome: 'FY Towel 8', area: 'fascia', gradino: 2, unita: 'reps', videoUrl: 'https://youtube.com/shorts/V805vZi3rLs' , descrizione: "Sul posto, su una gamba: disegna un 8 col piede libero mentre il piede a terra (su asciugamano) stabilizza." },
  { id: 'fascia-sl-toe-bounces', nome: 'SL toe bounces', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/V5SVWUH1_50' , descrizione: "Toe bounces su una gamba sola: stessa molla, doppio lavoro di caviglia e piede. Metà durata per lato." },
  { id: 'fascia-iso-runner', nome: 'Iso runner', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/nvENLHoWSR4' , descrizione: "Posizione di affondo/corsa tenuta isometrica: piede avanti carico, caviglia e piede stabilizzano. Metà tenuta per lato." },
  { id: 'fascia-sl-runner', nome: 'SL runner (towel)', area: 'fascia', gradino: 3, unita: 'secondi', videoUrl: 'https://youtube.com/shorts/_0TsEKkUqGw' , descrizione: "Su una gamba (avampiede su asciugamano), l'altra si muove avanti-dietro come nella corsa: il piede a terra lavora per non perdere l'equilibrio." },
  // Tecnica — Palleggi
  { id: 'pall-1', nome: 'Palleggi collo alternato', area: 'palleggi', gradino: 1, unita: 'minuti' , descrizione: "Palleggia alternando i due collo-piede. Caviglia bloccata, punta leggermente verso l'alto, palla sotto l'altezza del petto. Se cade, riparti e continua il conteggio cumulativo." },
  { id: 'pall-2', nome: 'Palleggi collo solo sx / solo dx', area: 'palleggi', gradino: 2, unita: 'minuti' , descrizione: "Solo un piede per volta: prima tutte le reps col sinistro, poi col destro. Il piede debole avrà bisogno di più pazienza — è il punto." },
  { id: 'pall-3', nome: 'Palleggi interno (+ solo sx/dx)', area: 'palleggi', gradino: 3, unita: 'minuti' , descrizione: "Palleggi con l'interno del piede: tocchi corti e palla bassa. Alterna e poi isola sx/dx." },
  { id: 'pall-4', nome: 'Palleggi piramide / combo', area: 'palleggi', gradino: 4, unita: 'minuti', note: 'Collo sx, coscia sx, testa, coscia dx, collo dx = 1 ripetizione.' , descrizione: "La sequenza: collo sx → coscia sx → testa → coscia dx → collo dx = 1 ripetizione. Fluida, senza fretta tra i tocchi." },
  { id: 'pall-5', nome: 'Palleggi sotto il ginocchio / sopra il bacino', area: 'palleggi', gradino: 5, unita: 'minuti' , descrizione: "Controllo dell'altezza: una serie con OGNI tocco sotto il ginocchio (tocchi rapidi), una con ogni tocco sopra il bacino (tocchi dosati)." },
  { id: 'pall-6', nome: 'Palleggi solo un piede / gamba sospesa', area: 'palleggi', gradino: 6, unita: 'minuti' , descrizione: "Palleggia con un solo piede senza mai appoggiare a terra la gamba che palleggia (gamba sospesa). Equilibrio e dosaggio." },
  { id: 'pall-7', nome: 'Palleggi solo testa', area: 'palleggi', gradino: 7, unita: 'minuti' , descrizione: "Solo di testa: fronte, ginocchia morbide, occhi sulla palla. Piccoli aggiustamenti coi passi." },
  { id: 'pall-8', nome: 'Palleggi con occhio chiuso (sx/dx)', area: 'palleggi', gradino: 8, unita: 'minuti' , descrizione: "Palleggia con un occhio chiuso (poi cambia): la percezione di profondità cambia, i tocchi devono adattarsi. 1 minuto per occhio." },
  { id: 'pall-9', nome: 'Palleggi palla + pallina da tennis', area: 'palleggi', gradino: 9, unita: 'minuti' , descrizione: "Alterna palla normale e pallina da tennis: la pallina non perdona tocchi sporchi. Torna alla palla e sembrerà enorme." },
  { id: 'pall-10', nome: 'Palleggi avanzati (cinesino) / freestyle 3 conetti', area: 'palleggi', gradino: 10, unita: 'minuti' , descrizione: "Palleggi avanzati: lancia la palla in alto, raccogli/riposiziona un cinesino e riprendi il palleggio (1 rep). Oppure freestyle attorno a 3 conetti senza far cadere la palla." },
  // Tecnica — Muro
  { id: 'muro-1', nome: 'Palleggi al muro due tocchi (sx/dx/liberi)', area: 'muro', gradino: 1, unita: 'minuti' , descrizione: "Fronte al muro a 2-3 metri: passaggio, controllo (1 tocco), passaggio. Alterna i piedi e i tipi di controllo. Tocco pulito prima della velocità." },
  { id: 'muro-2', nome: 'Palleggi al muro un tocco (interno, libero)', area: 'muro', gradino: 2, unita: 'minuti' , descrizione: "Di prima, un tocco solo: la palla torna al muro senza controllo. Interno piede, corpo dietro la palla." },
  { id: 'muro-3', nome: 'Due tocchi, primo tocco di collo', area: 'muro', gradino: 3, unita: 'minuti' , descrizione: "Due tocchi dove il PRIMO è di collo (stop al volo o damped), il secondo è il passaggio. Ammorbidisci il primo tocco." },
  { id: 'muro-4', nome: 'Stop (ad aprire / di suola) + passaggio', area: 'muro', gradino: 4, unita: 'minuti' , descrizione: "Stop orientato: controlla ad aprire (interno, corpo che si gira) o di suola, poi passa. Il primo tocco ti deve già mettere in posizione per il secondo." },
  { id: 'muro-5', nome: 'Passaggi di prima (conteggio in 2 minuti)', area: 'muro', gradino: 5, unita: 'minuti', note: 'A ~5 metri dal muro, conta i passaggi.' , descrizione: "A 5 metri, passaggi di prima alternando i piedi: conta quanti in 2 minuti. È anche il tuo test — stessa distanza ogni volta." },
  { id: 'muro-6', nome: 'Al volo (due tocchi / un tocco)', area: 'muro', gradino: 6, unita: 'minuti' , descrizione: "Tutto al volo: la palla non tocca mai terra. Due tocchi (controllo al volo + passaggio) o un tocco secco." },
  { id: 'muro-7', nome: 'Passaggi alti/bassi, distanze 5-10 mt', area: 'muro', gradino: 7, unita: 'minuti' , descrizione: "Varia la distanza dal muro (5-10 mt) e l'altezza dei passaggi (rasoterra e alti): dosaggio della forza e primo controllo su traiettorie diverse." },
  { id: 'muro-8', nome: 'Occhio chiuso · visione di gioco', area: 'muro', gradino: 8, unita: 'minuti' , descrizione: "Passaggi con un occhio chiuso, o con l'esercizio dei colori (telefono che mostra un colore → risposta di gioco): il controllo diventa automatico mentre la testa guarda altrove." },
  { id: 'muro-9', nome: 'Passaggi in difficoltà', area: 'muro', gradino: 9, unita: 'minuti' , descrizione: "Tira la palla forte o su superfici irregolari: controlli 'sporchi' da domare. Il gioco vero è così." },
  // Tecnica — Conduzione / Ball mastery (servono cinesini)
  { id: 'cond-1', nome: 'Slalom solo interno', area: 'conduzione', gradino: 1, unita: 'reps' , descrizione: "7-8 cinesini vicini (due piedi tra ognuno): slalom solo con l'interno dei piedi. Tocco pulito, testa che si alza man mano. 1 andata+ritorno + allungo di 10m = 1 rep." },
  { id: 'cond-2', nome: 'Slalom solo esterno', area: 'conduzione', gradino: 2, unita: 'reps' , descrizione: "Stesso slalom ma solo con l'esterno: più velocità del gesto, palla vicina." },
  { id: 'cond-3', nome: 'Slalom solo dx / solo sx', area: 'conduzione', gradino: 3, unita: 'reps' , descrizione: "Slalom con un piede solo (tutto dx, poi tutto sx): visione periferica, sguardo 2-3 metri avanti, non sulla palla." },
  { id: 'cond-4', nome: 'Slalom interno + suola', area: 'conduzione', gradino: 4, unita: 'reps' , descrizione: "Slalom alternando interno e suola: la suola frena e cambia linea, l'interno spinge." },
  { id: 'cond-5', nome: 'Conduzione 10m + cambio direzione (suola/esterno/Cruyff)', area: 'conduzione', gradino: 5, unita: 'reps' , descrizione: "Conduci palla 10 metri al 60-80% e cambia direzione a 180°: prima con la suola, poi con l'esterno, poi col Cruyff turn. 5 reps per piede e per tipo di cambio." },
  { id: 'cond-6', nome: 'Box dribbling bassa intensità', area: 'conduzione', gradino: 6, unita: 'minuti' , descrizione: "In un quadrato di 4 cinesini (2-3 metri di lato): conduci, girati, dribbla a bassa intensità, prova finte di corpo. La palla non esce mai dal box." },
  { id: 'cond-7', nome: 'Box dribbling intensità alternata', area: 'conduzione', gradino: 7, unita: 'minuti' , descrizione: "Stesso box ma alternando: 2 minuti a bassa intensità, 1 a media/alta. Il ritmo cambia, il controllo resta." },
  { id: 'cond-8', nome: 'Box dribbling + visione (colori)', area: 'conduzione', gradino: 8, unita: 'minuti' , descrizione: "Box dribbling con l'esercizio dei colori (telefono su un supporto): guardi lo schermo, la palla resta incollata al piede. Conduzione a testa alta." },
  // Mobilità post-partita (video guidato di Ste — URL da inserire)
  { id: 'mobilita-yoga', nome: 'Sessione mobilità/yoga guidata (video)', area: 'mobilita', gradino: 1, unita: 'minuti', note: 'Video completo guidato — full body. Da fare il giorno dopo la partita, almeno 20 minuti.' , descrizione: "Segui il video guidato dall'inizio alla fine: respira, non forzare le posizioni, l'obiettivo è sciogliere ciò che la partita ha irrigidito." },
];

export const esercizioById = (id: string) => ESERCIZI.find((e) => e.id === id);
export const catenaByArea = (area: Area) =>
  ESERCIZI.filter((e) => e.area === area).sort((a, b) => a.gradino - b.gradino);

// ─── Test e soglie (dal File_DB di Ste) ──────────────────────────────────────

export interface TrainingTest {
  id: string;
  nome: string;
  area?: Area; // catena a cui il test dà il placement
  unita: string;
  protocollo: string;
  // soglie: valore MINIMO per raggiungere il livello (higher is better)
  soglie: { intermedio: number; avanzato: number; pro: number };
  // gradino d'ingresso in catena per livello del test
  entryMap?: Record<TestLivello, number>;
}

export const TESTS: TrainingTest[] = [
  { id: 'test-push', nome: 'Max piegamenti', area: 'spinta', unita: 'reps',
    protocollo: 'Piegamenti completi: petto a terra, braccia distese. Una serie a cedimento, forma pulita.',
    soglie: { intermedio: 15, avanzato: 30, pro: 40 },
    entryMap: { base: 1, intermedio: 2, avanzato: 3, pro: 4 } }, // entry conservativa v0.2
  { id: 'test-pull', nome: 'Max pull-up', area: 'tirata', unita: 'reps',
    protocollo: 'Pull-up completi dalla sospensione, mento sopra la sbarra. Se 0: segna 0 (partirai dalle australian).',
    soglie: { intermedio: 2, avanzato: 8, pro: 12 },
    entryMap: { base: 1, intermedio: 4, avanzato: 5, pro: 6 } }, // entry conservativa v0.2
  { id: 'test-core', nome: 'Plank frontale max', area: 'core', unita: 'secondi',
    protocollo: 'Plank sui gomiti, corpo in linea. Tieni finché la forma resta pulita.',
    soglie: { intermedio: 30, avanzato: 60, pro: 120 },
    entryMap: { base: 1, intermedio: 2, avanzato: 4, pro: 6 } }, // entry conservativa v0.2
  { id: 'test-lombari', nome: 'Superman hold max', area: 'lombari', unita: 'secondi',
    protocollo: 'A pancia in giù, braccia e gambe sollevate. Tieni finché la forma resta pulita.',
    // ⚠️ soglie provvisorie (uniche non ancora date da Ste — da tarare)
    soglie: { intermedio: 30, avanzato: 60, pro: 90 },
    entryMap: { base: 1, intermedio: 2, avanzato: 3, pro: 4 } }, // entry conservativa v0.2
  { id: 'test-pall-forte', nome: 'Palleggi piede forte', area: 'palleggi', unita: 'reps',
    protocollo: 'Palleggi consecutivi senza far cadere la palla. Max 3 tentativi.',
    soglie: { intermedio: 50, avanzato: 100, pro: 150 },
    entryMap: { base: 1, intermedio: 3, avanzato: 5, pro: 8 } },
  { id: 'test-pall-debole', nome: 'Palleggi piede debole', unita: 'reps',
    protocollo: 'Palleggi consecutivi col piede debole. Max 3 tentativi.',
    soglie: { intermedio: 30, avanzato: 80, pro: 120 } },
  { id: 'test-pall-testa', nome: 'Palleggi di testa', unita: 'reps',
    protocollo: 'Palleggi di testa consecutivi. Max 3 tentativi.',
    soglie: { intermedio: 25, avanzato: 50, pro: 100 } },
  { id: 'test-piramide', nome: 'Piramide palleggi', unita: 'reps',
    protocollo: 'Collo sx → coscia sx → testa → coscia dx → collo dx = 1 ripetizione. Consecutivi, max 3 tentativi.',
    soglie: { intermedio: 3, avanzato: 5, pro: 10 } },
  { id: 'test-muro', nome: 'Passaggi di prima in 2 minuti', area: 'muro', unita: 'reps',
    protocollo: 'A 5 metri dal muro, passaggi di prima alternando i piedi: conta quanti in 2 minuti.',
    // ⚠️ soglie provvisorie — da dare da Ste
    soglie: { intermedio: 60, avanzato: 90, pro: 120 },
    entryMap: { base: 1, intermedio: 3, avanzato: 5, pro: 7 } },
  { id: 'test-amrap', nome: 'AMRAP 20 minuti', unita: 'giri',
    protocollo: 'Circuito: push + core + pull + lombari con l\'esercizio del tuo gradino e le ripetizioni calcolate. Conta i giri completi in 20 minuti. Richiede la sbarra.',
    // soglie = giri: base ≤6, intermedio ≤8, avanzato ≤10, pro >10
    soglie: { intermedio: 7, avanzato: 9, pro: 11 } },
];

export const testById = (id: string) => TESTS.find((t) => t.id === id);

// ─── Bounds del validatore (per area × fascia) ──────────────────────────────

export interface Bounds {
  serieMin: number; serieMax: number;
  repsMin: number; repsMax: number; // per unità 'secondi' = secondi di tenuta
  recuperoMinSec: number;
}

export const BOUNDS: Record<AreaForza | 'laterale', Record<FasciaLivello, Bounds>> = {
  spinta: {
    B: { serieMin: 2, serieMax: 4, repsMin: 5, repsMax: 20, recuperoMinSec: 60 },
    A: { serieMin: 3, serieMax: 5, repsMin: 3, repsMax: 15, recuperoMinSec: 90 },
    PRO: { serieMin: 3, serieMax: 6, repsMin: 1, repsMax: 10, recuperoMinSec: 120 },
  },
  tirata: {
    B: { serieMin: 2, serieMax: 4, repsMin: 3, repsMax: 12, recuperoMinSec: 90 },
    A: { serieMin: 3, serieMax: 5, repsMin: 2, repsMax: 8, recuperoMinSec: 120 },
    PRO: { serieMin: 3, serieMax: 6, repsMin: 1, repsMax: 5, recuperoMinSec: 150 },
  },
  core: {
    B: { serieMin: 2, serieMax: 4, repsMin: 15, repsMax: 60, recuperoMinSec: 45 },
    A: { serieMin: 3, serieMax: 4, repsMin: 30, repsMax: 90, recuperoMinSec: 60 },
    PRO: { serieMin: 3, serieMax: 5, repsMin: 45, repsMax: 120, recuperoMinSec: 60 },
  },
  lombari: {
    B: { serieMin: 2, serieMax: 3, repsMin: 15, repsMax: 45, recuperoMinSec: 45 },
    A: { serieMin: 2, serieMax: 4, repsMin: 30, repsMax: 60, recuperoMinSec: 45 },
    PRO: { serieMin: 3, serieMax: 4, repsMin: 45, repsMax: 90, recuperoMinSec: 60 },
  },
  laterale: {
    B: { serieMin: 1, serieMax: 3, repsMin: 10, repsMax: 45, recuperoMinSec: 45 },
    A: { serieMin: 1, serieMax: 3, repsMin: 15, repsMax: 60, recuperoMinSec: 45 },
    PRO: { serieMin: 1, serieMax: 4, repsMin: 20, repsMax: 90, recuperoMinSec: 45 },
  },
};

// Tecnica/fascia/mobilità: bounds semplici sulle durate (minuti per item)
export const TECNICA_ITEM_MIN = 2;
export const TECNICA_ITEM_MAX = 10;
export const TECNICA_RECUPERO_MIN_SEC = 30;

// ─── Regole globali (numeri del recap §5) ───────────────────────────────────

export const REGOLE = {
  maxSeduteFisicheSettimana: 3,
  maxDurataSedutaMin: 90,        // solo su richiesta esplicita; standard 40-60
  durataMixB: 40,
  durataMixAMax: 60,
  fasciaAperturaMin: 10,         // 10-15' di fascia in apertura
  emomMinuti: { min: 6, max: 25 },
  deloadVolumePct: 0.55,         // 50-60%
  feedbackDuroConsecutivi: 3,
  feedbackDuroRiduzione: 0.10,
  rientroRitestSettimane: 3,
  // AMRAP — percentuali sul max del test
  amrapPushPct: 0.5,  amrapPushMin: 3,  amrapPushMax: 15,
  amrapPullPct: 0.4,  amrapPullMin: 1,  amrapPullMax: 5,
  amrapHoldPct: 0.7,  amrapHoldMinSec: 15, amrapHoldCapSec: 30,
  amrapDurataMin: 20,
} as const;

// ─── Rombo card — 7 punte ───────────────────────────────────────────────────

export const ROMBO_PUNTE: { key: string; label: string; testIds: string[] }[] = [
  { key: 'tec_palleggi', label: 'Tecnica Palleggi', testIds: ['test-pall-forte', 'test-pall-debole', 'test-pall-testa', 'test-piramide'] },
  { key: 'tec_passaggi', label: 'Tecnica Passaggi', testIds: ['test-muro'] },
  { key: 'tec_controllo', label: 'Tecnica Controllo', testIds: ['test-muro'] }, // v0: proxy dal test muro (3g-i aperta)
  { key: 'forza_push', label: 'Forza Push', testIds: ['test-push'] },
  { key: 'forza_pull', label: 'Forza Pull', testIds: ['test-pull'] },
  { key: 'forza_core', label: 'Forza Core', testIds: ['test-core', 'test-lombari'] },
  { key: 'prev_fascia', label: 'Prevenzione Fascia', testIds: [] }, // v0: test a sensazione non ancora in batteria → punta neutra 50
];
