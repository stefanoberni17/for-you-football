# Simulazione del planner v2 con atleti finti

Ste, 15/10/2026: "proviamo a simulare delle richieste di utenti per vedere se funziona bene il planner ora".

## Cos'è

Nove atleti inventati (`lib/trainingSimulazione.ts`) con test, setup, squadra, partita e una richiesta ciascuno: il piano
automatico del lunedì, "Rifai da capo" con giorni e tempo, un PRO in palestra con kettlebell e massimali, la preparazione
con la squadra, la pausa per dolore, un portiere con "Tutto, in equilibrio", una settimana di scarico con tre settimane di
storico, una modifica a metà settimana, una richiesta di domenica sera. Il contesto è costruito con la STESSA funzione
del server (`costruisciContextV2`), la richiesta con la stessa maschera (`componiRichiesta`), il piano con la stessa
catena (`generaPianoV2`: riparazione → espansione → validatore → progressioni). Solo le letture dal DB sono finte.

```
npx tsx scripts/planner-sim.mts                       # senza Claude: piano base + validatore (quello che l'atleta vede se Claude non passa)
npx tsx scripts/planner-sim.mts --live                # con Claude (ANTHROPIC_API_KEY in .env.local; ~0,30 $ a piano)
npx tsx scripts/planner-sim.mts --solo marco,luca     # alcuni scenari
npx tsx scripts/planner-sim.mts --out docs/planner-sim-2026-10-15.md
npx tsx scripts/planner-sim.mts --prompt davide       # i due prompt interi di uno scenario
npx tsx scripts/planner-sim.mts --difficili           # 9 scenari difficili + 6 modifiche a metà settimana (27/10)
```

Nelle sessioni cloud di Claude Code la chiave si chiama `FYF_ANTHROPIC_API_KEY` (le variabili `ANTHROPIC_*` non
arrivano) e c'è una `ANTHROPIC_BASE_URL` della sessione da togliere:
`env -u ANTHROPIC_BASE_URL ANTHROPIC_API_KEY="$FYF_ANTHROPIC_API_KEY" npx tsx scripts/planner-sim.mts --live`.

**Scenari difficili (27/10, `SCENARI_DIFFICILI` e `SCENARI_MODIFICHE`):** due partite in settimana con la resistenza
chiesta in season, una partita da fatica 10 il giorno prima, ginocchio dolorante con una limitazione alla caviglia,
"non riesco" sui piegamenti e "faccio fatica" sullo swing, atleta stanco (tetto personale −15 %), niente campo, sette
giornate, portiere con 30', due sedute da recuperare; e sei modifiche di mercoledì sui loro piani (più leggera, togli,
cambia obiettivo con il ginocchio, meno tempo, sposta su un giorno di squadra, più intensa). Esiti e correzioni in
`docs/planner-sim-difficili-2026-10-27.md`; i piani base sono nei test.

Per ogni scenario il rapporto dice: contesto (livello, blocchi in libreria, tetti, carico, regole applicate), dimensione
dei prompt, piano giornata per giornata, e i controlli: validatore, numero di giornate, tetto fisico, partita (niente il
giorno della partita, niente fisica il giorno prima, niente gambe il giorno dopo), giorni ammessi, durata, obiettivi
coperti. `tests/trainingSimulazione.test.ts` ripete gli stessi scenari a ogni CI: il piano base deve passare dal validatore.

## Esito del 15/10 (senza Claude)

Prima: 5 scenari su 9 avevano un piano base CON violazioni (mostrate all'atleta nel "Perché"). Dopo: 9 su 9 puliti.
Rapporto completo in `docs/planner-sim-2026-10-15.md`.

### Cosa ho trovato e sistemato

1. **Cinque blocchi di Ste non passavano mai.** "Test Salto in lungo - broad jump" è usato come ESERCIZIO in Forza
   Esplosiva A1, Pliometria Rapidità Velocità B1, B1 short e B2, Forza Mix P1 e Forza funzionale e pliometria PRO1; il
   validatore rifiuta gli esercizi di categoria test nel piano ("i test non vanno nel piano"). Ogni volta che Claude li
   sceglieva il piano veniva rifiutato e si bruciava un tentativo. Alias in `scripts/build-blocks.py`: nel piano è lo
   Standing Broad Jump (`fesp-salto-in-lungo-da-fermo`). Blocchi sempre 144/135.
2. **Il piano base non guardava le regole della settimana.** Metteva la velocità tre volte su cinque giornate (regola
   "una sola giornata di velocità"), un blocco di tecnica con dentro un esercizio aerobico il giorno prima della partita
   (vietato entro 3 giorni, allora 4), le gambe piene il giorno dopo la partita, Forza Esplosiva A1 al posto del kettlebell quando
   l'obiettivo era il kettlebell. Ora le giornate si costruiscono UNA ALLA VOLTA e ogni candidato passa dal validatore con
   la settimana fin lì: se introduce un errore si prova il candidato dopo (fino a 16 per giornata). Il giorno dopo la
   partita niente gambe/esplosività/pliometria/velocità/resistenza, il richiamo (`pb-richiamo`) va per primo; il
   kettlebell solo con i `kb-*`; prima gli obiettivi ancora scoperti (in modo "modifica" rimetteva le gambe già fatte
   lunedì invece della parte alta che mancava).
3. **I posti fisici erano contati male.** Con lun/mer/ven e la partita il sabato il validatore contava 3 posti fisici,
   ma il venerdì non può essere fisico: pretendeva "il primo obiettivo in almeno 2 giornate" quando le giornate fisiche
   erano 2 in tutto, e con gambe + parte alta in 60' non c'è spazio. `postiFisici(ctx)` conta i giorni in cui una fisica
   può stare davvero (da oggi, ammessi, non la partita né il giorno prima; in modo "modifica" le fisiche già passate).
4. **Due regole in contraddizione.** Con la velocità come primo obiettivo il validatore chiedeva "velocità in almeno 2
   giornate" e insieme "al massimo UNA giornata di velocità": nessun piano poteva passare. La regola del filo della
   settimana ora salta la velocità (come già il kettlebell).
5. **Obiettivo impossibile per la finestra partita.** Resistenza (allora vietata entro 4 giorni dalla partita) con la
   partita il sabato e solo martedì e giovedì disponibili: nessun giorno buono, eppure il validatore la pretendeva e ogni
   piano veniva rifiutato. `obiettivoFuoriFinestra` lo toglie dai pretesi e il prompt lo dice a Claude ("NON ENTRA questa
   settimana: … dillo nel messaggio").
6. **Refactor senza cambi di comportamento**, necessario per simulare: `loadContextV2` = letture DB + `costruisciContextV2`
   (puro); `generateWeekPlanV2` = `loadContextV2` + `generaPianoV2(ctx, richiesta, vincoli)`; `preparaContextV2` e
   `promptsV2` esportati. `PLANNER_V2_PROMPT_VERSION = 'v2.30-simulazione'`.

### Cosa resta da guardare (domande per Ste)

- ~~Finestra della resistenza = 4~~ **Risposto da Ste il 16/10** ("partita al sabato e martedì disponibile: al martedì si
  potrebbe resistenza, perché no?"): la finestra di resistenza aerobica, metabolico e RSA è passata a **3** (vietata a
  3, 2, 1 e 0 giorni dalla partita, ammessa da 4 in su). Con la partita il sabato: lunedì e martedì sì, da mercoledì no.
  Nello scenario Andrea la resistenza ora entra il martedì.
- **"Drbbling A2"** (titolo Everfit con il refuso) è classificato velocità ed è l'unico blocco di velocità che resta a
  un atleta A nelle prime 4 settimane: Velocità A1 e Velocità e Forza Esplosiva hanno sprint con palla, esclusi fino
  alla 5ª settimana senza la tecnica tra gli obiettivi. Il piano base di Luca fa velocità con un blocco di dribbling.
- **Il piano base è minimo per scelta** (una giornata = apertura + un blocco): Luca chiede 75' e ha giornate da 19'.
  Riempire è il lavoro di Claude; si vede solo con `--live`.
- **In modo "modifica" il piano base non si applica** (409 all'atleta): lì conta solo Claude.
- **Prompt**: 31-39k caratteri di system (~9-11k token, in cache), 2-3k di user. In linea con i log Vercel.

### Prossimo passo

`npx tsx scripts/planner-sim.mts --live --out docs/planner-sim-<data>-live.md` con `ANTHROPIC_API_KEY`: nove piani di
Claude, ~3 $, e si vede quante volte passa al primo tentativo, cosa ripara il server e dove finisce ibrido o base.

### Aggiornamento 18/10 (tetti per qualità)

Con `lib/trainingTetti.ts` il piano base di Luca (off season, velocità primo obiettivo) mette la velocità in DUE giornate
non consecutive (lunedì e venerdì), con lo stesso "Drbbling A2" (resta l'unico blocco di velocità per un A nelle prime
settimane: i blocchi già usati vanno in coda tra i candidati, non spariscono); le altre giornate fisiche sono i
complementi (pliometria in B, gambe dalle scale). Gli altri otto scenari non cambiano. I nove piani base passano ancora
dal validatore (`tests/trainingSimulazione.test.ts`).
