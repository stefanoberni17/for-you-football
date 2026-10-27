# Simulazione del planner v2 — 2026-10-27 (con Claude)

Prompt v2.45-tecnica-combinata-kettlebell-pulito, 9 scenari. Lo script: `scripts/planner-sim.mts`. Atleti e richieste sono inventati; i blocchi, le regole e il validatore sono quelli veri.

## Lettura (27/10)

**Esito:** nove scenari su nove con il piano di Claude, tutti passati dal validatore al **primo tentativo** (nove chiamate a Opus, nessun secondo tentativo, nessun piano base né ibrido). Il server non ha dovuto riparare niente: nessuna riga "Ho sistemato" negli aggiustamenti. Le sole correzioni del server sono quelle di sempre, segnate sui blocchi: apertura breve sotto i 60', due sprint in meno con due giornate di velocità (Luca), riscaldamento velocità aggiunto e scatti limati nella giornata di rapidità (Luca, scarico), parte bassa più leggera con il kettlebell (Davide), "settimana avviata" (Marco, domenica). Token: ~17.500 in ingresso, ~280.000 scritti in cache (ogni scenario ha un system prompt suo, quindi nessuna lettura dalla cache), ~16.500 in uscita, per le 9 chiamate più le 3 della verifica.

**Errori nostri, corretti in questa PR:**
1. **Riscaldamento velocità davanti al blocco pre partita** (marco, davide, marco-modifica): Claude metteva `risc-velocita` (corsetta, mobilità e sei allunghi da 50 m fino al 90 %) davanti a `rapidita-velocita-e-tiro-pre-partita` il giorno prima della partita, e il server lo lasciava: la regola dice che quella giornata non ha riscaldamento in testa, il blocco di Ste ha la sua attivazione. Ora `riparaPiano` lo toglie (riga negli aggiustamenti; `expandPiano` lo rimette solo se nella giornata c'è velocità vera) e la regola 3 del prompt lo dice.
2. **"Lunedì ormai è passato, quindi non lo vedi più nella lista"** (marco-modifica): falso, la route `/api/training/plan` rimette nel piano salvato le sedute dei giorni passati. Il prompt diceva solo "sedute SOLO nei giorni 3-7"; ora in modo "modifica" dice che le sedute passate restano come sono e che il messaggio non deve dire che spariscono.
`PLANNER_V2_PROMPT_VERSION = 'v2.46-simulazione-27-10'`. **Verifica dal vivo** (marco, davide, marco-modifica, stesso giorno): il venerdì / sabato pre partita è il solo blocco di Ste da 20' (Claude non mette più il riscaldamento, quindi la riparazione non è nemmeno scattata) e il messaggio della modifica non parla più del lunedì.

**Da decidere con Ste (non toccati):**
- **Tecnica da 74'** (luca-scarico, sabato): `te-palleggi` si allunga fino a 1,5 volte per riempire il tempo della seduta (`adattaAlTempo`), e senza un tempo nel setup il tetto è 120'. Con lo scarico diventano 59' di soli palleggi. Serve un tetto per le sedute di tecnica composta (45'? 60'?) indipendente dal tempo massimo?
- **Velocità B1 a un atleta PRO ai test di velocità** (luca): la regola 10 dice "famiglie mai fatte: parti dal codice più basso disponibile per il livello dell'atleta" e Claude legge "il più basso", cioè B1. Per la pliometria la partenza in B è voluta; per la velocità vuoi lo stesso, o un PRO ai test parte dal primo codice del suo livello?
- **Due giornate di velocità più una di rapidità nello scarico** (luca-scarico): tutte sotto i tetti e con le serie ridotte, ma sono tre giornate con scatti in una settimana di scarico.

## marco — Piano automatico del lunedì con il setup compilato

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.1k caratteri (~12200 token), user 2.4k caratteri (~700 token)
**Piano:** Claude in 16661 ms
- **Lunedì** · Gambe forti + parte alta esplosiva · fisica · 56' (+9' apertura) — 13 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Mercoledì** · Gambe di precisione + parte alta · fisica · 59' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27')
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- **Venerdì** · Attivazione pre partita · tecnica · 35' — 11 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana da difensore: lunedì e mercoledì costruiamo gambe e parte alta, così vinci più contrasti e duelli aerei. Venerdì solo un'attivazione veloce, per arrivare fresco alla partita di sabato. Martedì e giovedì ci pensa la squadra alla corsa: tu dai il massimo nelle due sedute di forza!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 56', 59', 35' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** 3 giornate su lun/mer/ven, al massimo 3 fisiche, ognuna entro 60' (apertura esclusa); gambe e parte alta coperte (pb-* e pa-* dalle scale); niente fisica venerdì (il giorno prima della partita del sabato).

## luca — "Rifai da capo": 5 giornate da 75' in off season, velocità + salti + gambe

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 5 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 75 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Velocità, 2. Esplosività / salti, 3. Forza gambe (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 163 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.2k caratteri (~13900 token), user 2.8k caratteri (~800 token)
**Piano:** Claude in 22855 ms
- **Lunedì** · Sprint e salti · fisica · 69' — 16 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - VELOCITA' B1 (velocita, 35') · _2 sprint in meno: tetto di 6 con due giornate di velocità a settimana_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Martedì** · Gambe forti e addome · fisica · 65' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 46')
  - Circuito addominali B1 (core, 19')
- **Mercoledì** · Velocità ed esplosività · fisica · 57' — 15 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - velocità e forza esplosiva B1 (velocita, 42')
- **Giovedì** · Salti e gambe tecniche · fisica · 50' (+9' apertura) — 15 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Pliometria B1 (pliometria-intensiva, 24')
  - Gambe: EMOM skill (forza-parte-bassa, 26')
- **Sabato** · Parte alta · fisica · 46' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 46')
- messaggio: Settimana costruita sulla velocità: lunedì e mercoledì scatti a gambe fresche, con i salti e la forza delle gambe attorno per spingere più forte sul terreno. Venerdì riposi, sabato chiudi con la parte alta. Su ogni scatto dai tutto e recupera bene tra uno e l'altro: conta la qualità, non la quantità.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 5 (richieste 5)
- ✅ sedute fisiche: 5 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Giovedì, Sabato (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 69', 65', 57', 50', 46' (massimo 75')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** 5 giornate entro 75'; velocità fino a DUE giornate non consecutive (off season, velocità primo obiettivo: 18/10) con il riscaldamento fisso in testa, al massimo 12 sprint in settimana; pliometria in B (prime 4 settimane) anche se l'atleta è A; gambe dalle scale.

## davide — PRO in palestra: kettlebell + gambe + parte alta su mar/gio/sab, partita domenica

**Atleta:** Davide, 24 anni, centrocampista. PRO (AMRAP 11), 80 kg, palestra + kettlebell + sbarra + campo, massimali (squat 1,6×, panca 1,0×, pull up 1,5×). In season, squadra lun/mer/ven, partita domenica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 90 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza funzionale kettlebell, 2. Forza gambe, 3. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello PRO; 165 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, kb-base); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 52.3k caratteri (~14500 token), user 3.2k caratteri (~900 token)
**Piano:** Claude in 19681 ms
- **Martedì** · Kettlebell e gambe forti · fisica · 52' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Kettlebell: base (forza-esplosiva, 24')
  - Gambe: forza massima in palestra (forza-parte-bassa, 33') · più leggero · _kettlebell attivo: parte bassa più leggera_
- **Giovedì** · Esplosività e parte alta · fisica · 83' (+9' apertura) — 26 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Forza Esplosiva A1 (forza-esplosiva, 42')
  - Parte alta: serie (versione breve) (forza-parte-alta, 41')
- **Sabato** · Attivazione pre partita · tecnica · 35' — 11 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana costruita intorno ai tuoi obiettivi: martedì kettlebell e forza delle gambe, giovedì salti esplosivi e parte alta, sabato solo un'attivazione veloce per arrivare carico alla partita. La resistenza la fai già lunedì con la squadra, quindi qui ci concentriamo sulla forza. Spingi forte martedì e giovedì, sabato vai leggero!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì, Sabato (ammessi Martedì/Giovedì/Sabato)
- ✅ durata: 52', 83', 35' (massimo 90')
- ✅ obiettivi: Forza funzionale kettlebell ✓, Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il sabato (giorno prima della partita) NON può essere una seduta fisica: 2 fisiche + 1 leggera, o 3 giornate con il sabato leggero; un blocco kb-* (kettlebell base: nessun log); Fmax possibile (massimali + esperienza palestra), kg sotto il tetto; parte alta dalle scale al livello PRO.

## andrea — Preparazione con la squadra: "decidi tu" tra mar e gio, 45', resistenza + tecnica

**Atleta:** Andrea, 17 anni, centrocampista. B, preparazione con la squadra (lun-ven, sforzo 8), partita sabato. Solo campo e rullo. Vuole resistenza e tecnica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì (SOLO questi). Tempo massimo per seduta: 45 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Resistenza, 2. Tecnica palla (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello B (resistenza-aerobica A); 119 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-emom, pb-serie, pb-emom); tetto 1 fisiche + leggere fino a 3, 75'; carico insufficiente; regole: RESISTENZA ALLA VELOCITÀ: solo in off season (Ste, 25/10: 12 ripetizioni sono già molto pesanti).
**Prompt:** system 43.2k caratteri (~12000 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 12137 ms
- **Martedì** · Corsa a intervalli e visione di gioco · mix · 38' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Resistenza: 3 serie da 5' (resistenza-aerobica, 27') · più leggero
  - Tecnica: visione (tecnica-visione, 15')
- **Giovedì** · Palleggi e sensibilità di piede · tecnica · 37' — 6 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 37') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Questa settimana la squadra ti carica già tanto: cinque allenamenti, di cui due di resistenza. Per questo da noi solo due giornate: martedì una corsa a intervalli per farti arrivare lucido fino al 90', giovedì solo palleggi. Tutto corto, entro i 45 minuti, così sabato arrivi fresco: l'apertura col rullo falla se hai tempo.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 3)
- ✅ sedute fisiche: 1 (tetto 1)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì (ammessi Martedì/Giovedì)
- ✅ durata: 38', 37' (massimo 45')
- ✅ obiettivi: Resistenza ✓, Tecnica palla ✓ (pretesi: 1)

**Cosa mi aspettavo:** al massimo 1 fisica + 2 leggere (tetto della preparazione), tutte entro 45'; la squadra fa già resistenza forte (8/10 lun e gio): il planner non la raddoppia, mette tecnica; niente blocchi A (atleta B).

## simone — Pausa per dolore: piano automatico con fascia + tecnica

**Atleta:** Simone, 18 anni, portiere. B, in season, portiere, allenamenti in PAUSA PER DOLORE (training_pain_hold). Squadra mar/gio, partita domenica. Setup: fascia e tecnica, lun/mer, 2 giornate da 45'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 107 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 41.0k caratteri (~11400 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 14139 ms
- **Lunedì** · Fascia e prevenzione · fascia · 30' — 8 esercizi
  - Fascia Foundations 1B (fascia-prevenzione, 30')
- **Mercoledì** · Tecnica: palleggi · tecnica · 37' — 6 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 37') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Questa settimana teniamo in pausa le sedute fisiche finché non segnali tu che stai bene: lunedì fascia e prevenzione, mercoledì palleggi, tutto leggero e sotto i 45 minuti. Se il dolore è forte o dura da qualche giorno, fatti vedere da un fisioterapista o da un medico prima di ripartire. Domenica in porta, concentrato e sereno!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (richieste 2)
- ✅ sedute fisiche: 0 (tetto 0, pausa dolore)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì (ammessi Lunedì/Mercoledì)
- ✅ durata: 30', 37' (massimo 45')
- ✅ obiettivi: Prevenzione / fascia ✓, Tecnica palla ✓ (pretesi: 2)

**Cosa mi aspettavo:** nessuna seduta fisica/mix; 2 giornate su lun/mer entro 45'; solo fascia, mobilità o tecnica leggera.

## giulia — Portiere, "Tutto, in equilibrio", 4 giornate da 60'

**Atleta:** Giulia, 20 anni, portiere. B, in season, portiere, squadra mar/gio, partita sabato. Setup "Tutto, in equilibrio", lun/mar/gio/ven, 4 giornate da 60'. Sbarra, campo, rullo.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (forza-esplosiva A, pliometria-intensiva A, pliometria-estensiva A); 115 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 45.0k caratteri (~12500 token), user 2.2k caratteri (~600 token)
**Piano:** Claude in 20103 ms
- **Lunedì** · Gambe forti e salti · fisica · 57' (+9' apertura) — 14 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Gambe: serie (forza-parte-bassa, 33')
  - Pliometria B1 (pliometria-intensiva, 24')
- **Martedì** · Parte alta alla sbarra · fisica · 41' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 41')
- **Giovedì** · Scatti corti e visione · mix · 48' — 15 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità B1 - short 2 (velocita, 19') · più leggero
  - Tecnica: visione (tecnica-visione, 17')
- **Venerdì** · Pre partita: palla e prevenzione · tecnica · 49' — 12 esercizi
  - Tecnica leggera (il giorno prima della partita) (tecnica-palleggi, 19') · _facoltativa: il giorno prima della partita: poca roba (max 10 tiri, un dribbling corto, palleggi e passaggi), facoltativa_
  - Fascia Foundations 1B (fascia-prevenzione, 30')
- messaggio: Settimana in equilibrio: lunedì gambe e salti, martedì parte alta, giovedì scatti corti e visione, venerdì solo palla e prevenzione per arrivare fresco a sabato. Sono tre allenamenti fisici più uno leggero, pensati per stare bene con la squadra. Curali bene, la qualità conta più della quantità: sabato fatti trovare pronto tra i pali!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 3 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Martedì, Giovedì, Venerdì (ammessi Lunedì/Martedì/Giovedì/Venerdì)
- ✅ durata: 57', 41', 48', 49' (massimo 60')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Esplosività / salti, Velocità, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** 4 giornate su lun/mar/gio/ven, al massimo 3 fisiche; almeno 2 aspetti diversi tra parte alta, gambe, salti, velocità, resistenza, tecnica; P1 (blocchi per il portiere) preferiti dove esistono; venerdì (giorno prima della partita) leggero.

## luca-scarico — Settimana di scarico con tre settimane di storico

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A. QUARTA settimana del ciclo (scarico) con tre settimane di sedute fatte: pliometria A1 facile ×3, velocità A1 giusta, forza prevenzione A1 dura.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 165 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico ok, tetto duro 1302 AU; SCARICO; regole: SALITE: settimana di scarico, i blocchi in salita non sono disponibili (pesanti).
**Memoria dei blocchi:** Velocità → velocita-a1 (stesso); Pliometria Rapidità Velocità → pliometria-rapidita-velocita-b2 (onda-b)
**Prompt:** system 50.9k caratteri (~14100 token), user 3.8k caratteri (~1000 token)
**Piano:** Claude in 21825 ms
- **Lunedì** · Velocità: scatti puliti · fisica · 36' — 17 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità A1 (velocita, 35') · più leggero
- **Mercoledì** · Salti rapidi e gambe di tecnica · fisica · 64' (+9' apertura) — 23 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Pliometria Rapidità Velocità B2 (pliometria-intensiva, 39') · _settimana di richiamo · giornata di rapidità: via gli sprint oltre 30 m (2) · 2 sprint in meno: tetto di 4 nella giornata di rapidità (pochi scatti, corti)_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
- **Venerdì** · Velocità corta e gambe forti · fisica · 54' — 26 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità A1 (velocita, 35')
  - Fascia Foundation B3 Forza - short (forza-parte-bassa, 18')
- **Sabato** · Palla e palleggi · tecnica · 59' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 74') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Questa è la settimana di scarico, la quarta del ciclo: il corpo assorbe il lavoro fatto e la prossima settimana ripartiamo più forti. Ho messo tre giornate di allenamento, più corte e con meno ripetizioni, e una con la palla facoltativa. La velocità resta al centro, con salti e gambe in versione leggera. Corri forte, ma fermati prima di sentirti stanco.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (decide il planner, massimo 7)
- ✅ sedute fisiche: 3 (tetto 6)
- ✅ giorni: Lunedì, Mercoledì, Venerdì, Sabato
- ✅ durata: 36', 64', 54', 59' (massimo 120')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** serie ridotte, pliometria in B short ("scarico: richiamo"); forza prevenzione A1 era dura: codice precedente o versione breve; carico stimato sotto il tetto dello scarico.

## marco-modifica — Mercoledì: "Sposta la seduta di oggi a giovedì" (giorno squadra)

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Sposta la seduta di Mercoledì a Giovedì (stessi blocchi). — oggi è Mercoledì
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.4k caratteri (~12300 token), user 2.8k caratteri (~800 token)
**Piano:** Claude in 10262 ms
- **Giovedì** · Gambe di precisione + parte alta · fisica · 59' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27')
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- **Venerdì** · Attivazione pre partita · tecnica · 35' — 11 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Fatto: la seduta di gambe e parte alta passa a giovedì, con gli stessi esercizi. Visto che la sera hai la squadra, fai la tua al mattino e ascolta le gambe. Venerdì resta l'attivazione corta prima della partita. Lunedì ormai è passato, quindi non lo vedi più nella lista. Due sedute fisiche corte bastano in una settimana con squadra e partita: arrivi a sabato carico ma fresco.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Giovedì, Venerdì (ammessi Lunedì/Venerdì/Giovedì)
- ✅ durata: 59', 35' (massimo 90')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il piano di lunedì resta (seduta passata) e conta nei controlli della settimana; la seduta di mercoledì va a giovedì (giorno squadra: ammesso, in versione più corta se il carico lo chiede); niente fisica venerdì.

## marco-domenica — Domenica sera: "Rifai da capo" con lun/mer/ven già passati

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Mercoledì, Venerdì (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 60 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza gambe, 2. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni). — oggi è Domenica
**Contesto:** livello B; 111 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.1k caratteri (~12300 token), user 2.8k caratteri (~800 token)
**Piano:** Claude in 8583 ms
- **Domenica** · Richiamo gambe e parte alta · fisica · 46' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: richiamo (giorno dopo la partita) (forza-parte-bassa, 14')
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- messaggio: La settimana è quasi finita, quindi oggi facciamo una sola seduta, tranquilla perché ieri hai giocato. Squat e stacchi leggeri per tenere sveglie le gambe, poi piegamenti, trazioni e plank per rinforzare la parte alta, così da difensore tieni meglio l'uomo. Da lunedì ripartiamo con la settimana completa: gambe al centro, come hai chiesto.
- nota: Settimana già avviata (oggi è domenica): da qui a domenica 1 giornata invece di 3. Da lunedì si riparte con la settimana intera.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 1 (richieste 1)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Domenica
- ✅ durata: 46' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 1)

**Cosa mi aspettavo:** i giorni scelti sono tutti passati: si allarga a oggi (domenica, giorno dopo la partita); una sola giornata, nota "settimana avviata"; niente gambe il giorno dopo la partita: parte alta breve, fascia o tecnica.

## Riepilogo

| Scenario | Piano | Giornate | Controlli |
|---|---|---|---|
| marco | Claude | 3 | ✅ 7/7 |
| luca | Claude | 5 | ✅ 6/6 |
| davide | Claude | 3 | ✅ 7/7 |
| andrea | Claude | 2 | ✅ 7/7 |
| simone | Claude | 2 | ✅ 7/7 |
| giulia | Claude | 4 | ✅ 7/7 |
| luca-scarico | Claude | 4 | ✅ 6/6 |
| marco-modifica | Claude | 2 | ✅ 7/7 |
| marco-domenica | Claude | 1 | ✅ 7/7 |
