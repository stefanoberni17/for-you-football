# Una stagione simulata: 12 settimane per sei atleti (27/10/2026)

Ste: "proverei tipo 12 settimane almeno anche per vedere ritest, progressioni ecc. su diversi atleti".

## Come funziona

`scripts/simulazione-stagione.mts` mette un orologio finto (tutte le funzioni del server leggono la data simulata) e per ogni atleta tiene un "database" in memoria. Settimana per settimana, dal 2 novembre:

- **Lunedì mattina**: check-in, eventi (un dolore che arriva, la pausa, il rientro), poi il piano della settimana con lo stesso contesto di `loadContextV2` (risultati dei test, sedute fatte con voto e giudizio per blocco, log per serie degli ultimi 28 giorni, carico, condizione, ciclo dai dati, sedute da recuperare, strato mese) e `generaPianoV2`, con Claude (`--live`) o con il piano base.
- **Ogni giorno**: il piano come lo vede il ragazzo (`pianoPerLettura`, come `/api/training/state`, con le serie test nelle settimane di ri-test), poi la seduta di oggi "fatta" secondo il carattere dell'atleta: log per serie, "Com'è venuto?", voto della seduta, giudizio per blocco, il risultato delle serie test, e `risultatiDallaSeduta` come `/api/training/complete`. La sera il resoconto dopo la squadra o la partita.

Comandi: `npx tsx scripts/simulazione-stagione.mts` (piano base, gratis, un secondo per atleta), `--live` con la chiave (circa 0,35 $ a piano), `--solo marco,luca`, `--settimane 12`, `--out`, `--json`.

## Gli atleti

| Atleta | Carattere | Cosa doveva mostrare |
|---|---|---|
| Marco | B, in season, trova tutto facile: serie a 3-4, fa sempre 2 ripetizioni in più sulla forza, voti 5 | dose che sale, gradini nuovi, ri-test, condizione "fresco" |
| Riccardo | stanco per sei settimane (voti 8-9, check-in 4, gambe dure), poi si riprende | condizione "stanco", scarico dai dati, SCENDI, ritorno |
| Nicola | partite intere e dure, salta il venerdì in W3-W4, ginocchio: leggero W5, pausa W6, rientro W7, passato W9 | dolore per zona, pausa, rientro, recuperi |
| Luca | A, off season, kettlebell + velocità + resistenza, salta la velocità in W2-W5 | fasce del kettlebell, resistenza a serie, strato mese |
| Samuele | B, "non riesco" sui piegamenti W1-W2, "faccio fatica" W3, poi ok | passo "meno", seduta dedicata nell'EMOM, rientro |
| Edoardo | tecnica per prima, campo e muro, i palleggi gli vengono male | quote dei temi, tetto dei tiri, scale |

## Cosa ha funzionato come doveva

- **Scarico e ri-test dai dati.** Riccardo scarica alla terza settimana per i voti (media 8,5) e per le gambe "dure" due volte, di nuovo alla sesta, mai a meno di tre settimane; quando si riprende torna lo scarico del calendario. Marco, sempre fresco, salta lo scarico ogni quarta settimana. Le settimane di ri-test arrivano dopo lo scarico (o dopo la quarta del ciclo) e mettono una serie test di forza per seduta, sul gradino da sbloccare; in season mai test di tecnica, resistenza o velocità.
- **Gradini.** Marco passa dai piegamenti sulle ginocchia ai piegamenti arciere e dallo squat a corpo libero al pistol su rialzo in 12 settimane (troppo veloce, ma è lui che fa sempre di più); la soglia raggiunta in seduta diventa un risultato vero.
- **Esecuzione.** Samuele: "non riesco" → piegamenti con meno ripetizioni e SALI bloccato; ancora difficile → la seduta dedicata nell'EMOM per tre settimane; due "ok" → rientra nelle serie.
- **Dolore.** Nicola: zona ginocchio ridotta il giorno dopo la segnalazione, pausa senza sedute fisiche, rientro con le gambe ridotte fino a 14 giorni, poi piene. Il giorno dopo la partita a fatica 10 il resoconto alleggerisce e il dolore toglie solo i kg (niente doppia riduzione).
- **Kettlebell e resistenza.** Luca: kettlebell base → intermedio dopo quattro settimane facili; resistenza a serie: un "facile" → "spingi di più", due → una serie in più, fino al tetto di 5 per un A.
- **Strato mese.** Luca salta la velocità per tre settimane: alla sesta arriva la domanda "vuoi davvero allenarla?" e la velocità va in coda.

## I bug trovati e corretti

1. **Pausa per dolore con scatti e salti.** In pausa (dolore 6/10 al ginocchio) il venerdì restava il blocco pre partita, che ha il salto triplo su una gamba e gli scatti: il server lo considera una giornata leggera. Ora in pausa non è in libreria e il validatore lo rifiuta.
2. **Scarico per i palleggi.** Il giudizio sulla tecnica dice "quanto ti è riuscito", ma "palleggi duri due volte di fila" faceva scattare lo scarico di tutta la settimana: Edoardo ne ha fatti tre in otto settimane. Ora la tecnica non conta per lo scarico.
3. **TIENI tornava al programma.** Dopo tre settimane di SCENDI (squat 20 → 14) una seduta "giusta" rimetteva 20 (+43 %) e la settimana dopo di nuovo 14; chi era salito oltre il programma tornava giù alla prima seduta giusta; e intanto l'hint del player e il prompt dicevano "14". Ora TIENI tiene l'ultima dose: sopra il programma si resta, sotto si risale un passo alla volta (14 → 16 → 18 → 20).
4. **Il gradino nuovo non contava.** Passato dai log al gradino dopo (piegamenti), il server ripartiva sempre dal gradino dei test e leggeva i log del gradino vecchio: sul nuovo la dose restava 3×8 per tre settimane anche facendone 10, e dopo quattro settimane, scaduti quei log, si tornava ai piegamenti sulle ginocchia. Ora si riparte dal gradino più alto su cui ci si allena a serie, con la sua dose; l'EMOM, che lavora apposta sul gradino sopra con 3 ripetizioni, non conta.
5. **Dose sul pre partita, sul rolling e sugli sprint.** Con qualche ripetizione in più nei log il blocco pre partita passava da 2 a 4 ripetizioni (Ste: "distanze brevi e poche reps"), il rolling da 60" a 90", e gli sprint potevano crescere oltre i tetti della settimana. Lì ora resta il programma.
6. **Dose con programmi piccoli.** Con 2 ripetizioni il controllo "è cambiato il programma" scartava i log e la dose scendeva (4 → 3) con la freccia in su e la nota "ne hai fatte 6 su 4". Ora la nota cita solo i numeri usati e con SALI la dose non scende sotto l'ultima fatta.
7. **Tiri e dribbling mai.** Con una seduta di tecnica a settimana la rotazione era palleggi → passaggi → freestyle → visione per 12 settimane: in 4 settimane i temi al 10 % non arrivano mai a una seduta intera. Ora con meno di 8 sedute in 4 settimane la scelta del tema guarda 8 settimane: Edoardo fa dribbling alla quinta, tiri alla sesta, la combinata alla settima. La card "La tecnica del mese" resta sulle 4.
8. **Due giornate di kettlebell.** Con la sezione kettlebell attiva il piano metteva il `kb-*` e un workout kettlebell di Ste (Dynamic Power, Movimento Fluido) nella stessa settimana. Ora contano tutti e due nell'uno a settimana.
9. **Piano base al limite del carico.** Quando nessun blocco stava sotto il tetto di carico, il piano base prendeva il primo candidato (la pliometria, il giorno dopo un'altra pliometria) e usciva con due violazioni. Ora prova la mobilità e il recupero, poi il candidato con meno violazioni.
10. **Testo del ri-test.** Senza uno scarico salvato (saltato perché fresco) diceva "dopo lo scarico si rifanno i test": ora "finite le quattro settimane del ciclo si rifanno i test".

Ogni correzione ha un test in `tests/trainingStagione.test.ts`.

## Domande per Ste

1. **Marco non scarica mai.** Sempre fresco, salta lo scarico ogni quarta settimana: 12 settimane senza. È giusto, o uno scarico ogni 8 settimane va fatto comunque? **Ste, 27/10: ci sta, se è sempre fresco non scarica.**
2. **Lombari con il ginocchio.** Con il ginocchio dolorante il server riduce anche i lombari (superman), perché nella mappa dei distretti stanno con le gambe. Più prudente del necessario: li sposto nella parte alta? **Ste, 27/10: lasciali così.**
3. **Recupero di un aspetto in domanda.** Luca salta la velocità per tre settimane: arriva la domanda "vuoi davvero allenarla?", ma la seduta saltata viene riproposta come recupero il lunedì. Si lascia?
4. **Il ritmo dei gradini.** Un atleta che fa sempre due ripetizioni in più sale di cinque gradini in 12 settimane. Con dati veri sarà più lento, ma il passo lo decidono le soglie: va bene così?

## Con Claude

Riccardo, Nicola e Luca per 12 settimane con `--live`: **36 piani di Claude su 36 passati dal validatore al primo tentativo**, nessun piano base, nessun ibrido. Circa 6 $ (dalla console di Ste; 12 $ dall'inizio delle prove con la chiave; token dal log: 146 mila in ingresso, 823 mila scritti in cache, 51 mila in uscita), 3-4 minuti per atleta.

Cosa ha scelto:
- **Riccardo stanco**: per cinque settimane al lunedì lo yoga di recupero al posto della prima seduta di forza, la Fascia Forza in versione breve dopo il "duro", serie brevi ed EMOM; dalla settimana 7, ripreso, torna a gambe a serie, EMOM e parte alta.
- **Nicola**: con il ginocchio in pausa yoga di recupero, palleggi e fascia tecnica, niente di fisico; al rientro EMOM e Fascia Forza breve con il ginocchio ridotto dal server.
- **Luca**: kettlebell ogni lunedì (base, poi intermedio dalla quinta), velocità il martedì, forza esplosiva il mercoledì, resistenza a serie il venerdì messa in fondo alla seduta dal server.

**Un bug in più, trovato solo con la stagione lunga e corretto:** Riccardo, ripreso (voti 6), scaricava alla 9ª e alla 12ª settimana per "EMOM gambe: duro due volte di fila". Quei due "duro" erano della 3ª e della 6ª settimana, nel periodo stanco: l'EMOM delle gambe si fa solo nelle settimane di scarico, e il controllo guardava tutte le sedute salvate. Ora guarda solo le ultime 4 settimane (`SCARICO_DURO_FINESTRA_GIORNI`); rifatta la stagione, Riccardo scarica alla 3ª e alla 6ª per i voti, poi alla 11ª come da calendario.

**Il caching del prompt del planner.** Ogni piano scrive in cache circa 22 mila token di prompt di sistema e quasi mai li rilegge: dentro ci sono i dati dell'atleta, quindi cambia per ogni ragazzo e ogni settimana, e la cache serve solo quando Claude riprova (qui mai). Scrivere in cache costa il 25 % in più del prezzo normale: su questa prova poco meno di 1 $ su 6. Per guadagnarci bisognerebbe mettere in cache solo le regole uguali per tutti e mandare i dati dell'atleta a parte, e servirebbe solo con più piani a pochi minuti di distanza.

Domande in più per Ste:
5. **Velocità C1 a un A.** Luca (A) fa ogni settimana `velocita-c1-short` (C = PRO), ammesso perché la famiglia non ha il codice al suo livello. Va bene? **Ste, 27/10: ok.**
6. **Fascia tecnica per un B.** La famiglia Fascia Foundation Tecnica ha solo codici A: per Nicola (B) l'A1 entra come "prova del livello sopra" (serie ×0,7) e dopo due settimane "dose piena". Con la fascia avevi detto niente assaggio del livello sopra: qui però non c'è un codice B da cui partire.
