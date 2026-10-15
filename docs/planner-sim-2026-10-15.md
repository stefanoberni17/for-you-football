# Simulazione del planner v2 — 2026-10-15 (senza Claude: piano base)

Prompt v2.30-simulazione, 9 scenari. Lo script: `scripts/planner-sim.mts`. Atleti e richieste sono inventati; i blocchi, le regole e il validatore sono quelli veri.

## marco — Piano automatico del lunedì con il setup compilato

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 95 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 0): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 32.6k caratteri (~9100 token), user 2.3k caratteri (~600 token)
**Piano:** piano base (senza Claude) in 50 ms
- **Lunedì** · Seduta base · fisica · 33' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
- **Mercoledì** · Seduta base · fisica · 39' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 39')
- **Venerdì** · Giornata leggera · tecnica · 59' (+9' apertura) — 6 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica Freestyle A1 (tecnica-palleggi, 59')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 33', 39', 59' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** 3 giornate su lun/mer/ven, al massimo 3 fisiche, ognuna entro 60' (apertura esclusa); gambe e parte alta coperte (pb-* e pa-* dalle scale); niente fisica venerdì (il giorno prima della partita del sabato).

## luca — "Rifai da capo": 5 giornate da 75' in off season, velocità + salti + gambe

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 5 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 75 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Velocità, 2. Esplosività / salti, 3. Forza gambe (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 118 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 4 in B prima dell'intensiva A): solo blocchi B. · VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 0): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 35.4k caratteri (~9800 token), user 2.8k caratteri (~800 token)
**Piano:** piano base (senza Claude) in 56 ms
- **Lunedì** · Seduta base · fisica · 43' (+19' apertura) — 15 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Drbbling A2 (velocita, 28')
- **Martedì** · Seduta base · fisica · 19' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Mercoledì** · Seduta base · fisica · 46' (+19' apertura) — 11 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 46')
- **Giovedì** · Seduta base · fisica · 26' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
- **Venerdì** · Seduta base · fisica · 19' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 5 (richieste 5)
- ✅ sedute fisiche: 5 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 43', 19', 46', 26', 19' (massimo 75')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** 5 giornate entro 75'; velocità UNA volta a settimana con il riscaldamento fisso in testa, sprint ≤ 8; pliometria in B (prime 4 settimane) anche se l'atleta è A; gambe dalle scale.

## davide — PRO in palestra: kettlebell + gambe + parte alta su mar/gio/sab, partita domenica

**Atleta:** Davide, 24 anni, centrocampista. PRO (AMRAP 11), 80 kg, palestra + kettlebell + sbarra + campo, massimali (squat 1,6×, panca 1,0×, pull up 1,5×). In season, squadra lun/mer/ven, partita domenica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 90 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza funzionale kettlebell, 2. Forza gambe, 3. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello PRO; 135 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, kb-base); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 4 in B prima dell'intensiva A): solo blocchi B. · VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 0): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 38.8k caratteri (~10800 token), user 3.1k caratteri (~900 token)
**Piano:** piano base (senza Claude) in 37 ms
- **Martedì** · Seduta base · fisica · 24' (+19' apertura) — 10 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Kettlebell: base (forza-esplosiva, 24')
- **Giovedì** · Seduta base · fisica · 51' (+19' apertura) — 11 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 51')
- **Sabato** · Giornata leggera · tecnica · 35' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica Palleggi A1 (tecnica-palleggi, 35')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì, Sabato (ammessi Martedì/Giovedì/Sabato)
- ✅ durata: 24', 51', 35' (massimo 90')
- ✅ obiettivi: Forza funzionale kettlebell ✓, Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il sabato (giorno prima della partita) NON può essere una seduta fisica: 2 fisiche + 1 leggera, o 3 giornate con il sabato leggero; un blocco kb-* (kettlebell base: nessun log); Fmax possibile (massimali + esperienza palestra), kg sotto il tetto; parte alta dalle scale al livello PRO.

## andrea — Preparazione con la squadra: "decidi tu" tra mar e gio, 45', resistenza + tecnica

**Atleta:** Andrea, 17 anni, centrocampista. B, preparazione con la squadra (lun-ven, sforzo 8), partita sabato. Solo campo e rullo. Vuole resistenza e tecnica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì (SOLO questi). Tempo massimo per seduta: 45 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Resistenza, 2. Tecnica palla (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello B (resistenza-aerobica A); 92 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-emom, pb-serie, pb-emom); tetto 1 fisiche + leggere fino a 3, 75'; carico insufficiente
**Prompt:** system 31.0k caratteri (~8600 token), user 2.7k caratteri (~700 token)
**Piano:** piano base (senza Claude) in 22 ms
- **Martedì** · Giornata leggera · tecnica · 38' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica Freestyle - dribbling passaggio - short (tecnica-passaggi, 38')
- **Giovedì** · Giornata leggera · tecnica · 38' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica Freestyle - dribbling passaggio - short (tecnica-passaggi, 38')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 3)
- ✅ sedute fisiche: 0 (tetto 1)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì (ammessi Martedì/Giovedì)
- ✅ durata: 38', 38' (massimo 45')
- ✅ obiettivi: Resistenza (fuori finestra partita), Tecnica palla ✓ (pretesi: 1)

**Cosa mi aspettavo:** al massimo 1 fisica + 2 leggere (tetto della preparazione), tutte entro 45'; la squadra fa già resistenza forte (8/10 lun e gio): il planner non la raddoppia, mette tecnica; niente blocchi A (atleta B).

## simone — Pausa per dolore: piano automatico con fascia + tecnica

**Atleta:** Simone, 18 anni, portiere. B, in season, portiere, allenamenti in PAUSA PER DOLORE (training_pain_hold). Squadra mar/gio, partita domenica. Setup: fascia e tecnica, lun/mer, 2 giornate da 45'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 90 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente
**Prompt:** system 29.4k caratteri (~8200 token), user 2.1k caratteri (~600 token)
**Piano:** piano base (senza Claude) in 18 ms
- **Lunedì** · Giornata leggera · tecnica · 27' (+9' apertura) — 4 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Resistenza e Tecnica funzionale B1 (tecnica-palleggi, 27')
- **Mercoledì** · Giornata leggera · tecnica · 38' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica Freestyle - dribbling passaggio - short (tecnica-passaggi, 38')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (richieste 2)
- ✅ sedute fisiche: 0 (tetto 0, pausa dolore)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì (ammessi Lunedì/Mercoledì)
- ✅ durata: 27', 38' (massimo 45')
- ✅ obiettivi: Prevenzione / fascia ✓, Tecnica palla ✓ (pretesi: 2)

**Cosa mi aspettavo:** nessuna seduta fisica/mix; 2 giornate su lun/mer entro 45'; solo fascia, mobilità o tecnica leggera.

## giulia — Portiere, "Tutto, in equilibrio", 4 giornate da 60'

**Atleta:** Giulia, 20 anni, portiere. B, in season, portiere, squadra mar/gio, partita sabato. Setup "Tutto, in equilibrio", lun/mar/gio/ven, 4 giornate da 60'. Sbarra, campo, rullo.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (forza-esplosiva A, pliometria-intensiva A, pliometria-estensiva A); 98 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 4 in B prima dell'intensiva A): solo blocchi B.
**Prompt:** system 33.0k caratteri (~9200 token), user 2.0k caratteri (~600 token)
**Piano:** piano base (senza Claude) in 49 ms
- **Lunedì** · Seduta base · fisica · 41' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 41')
- **Martedì** · Seduta base · fisica · 33' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
- **Giovedì** · Seduta base · fisica · 25' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Metabolico B1 (resistenza-metabolico, 25')
- **Venerdì** · Giornata leggera · tecnica · 59' (+9' apertura) — 6 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica Freestyle A1 (tecnica-palleggi, 59')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 3 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Martedì, Giovedì, Venerdì (ammessi Lunedì/Martedì/Giovedì/Venerdì)
- ✅ durata: 41', 33', 25', 59' (massimo 60')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Resistenza, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** 4 giornate su lun/mar/gio/ven, al massimo 3 fisiche; almeno 2 aspetti diversi tra parte alta, gambe, salti, velocità, resistenza, tecnica; P1 (blocchi per il portiere) preferiti dove esistono; venerdì (giorno prima della partita) leggero.

## luca-scarico — Settimana di scarico con tre settimane di storico

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A. QUARTA settimana del ciclo (scarico) con tre settimane di sedute fatte: pliometria A1 facile ×3, velocità A1 giusta, forza prevenzione A1 dura.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 115 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico ok, tetto duro 1302 AU; SCARICO; regole: SALITE: settimana di scarico, i blocchi in salita non sono disponibili (pesanti). · PLIOMETRIA: l'atleta ha 3 settimane di pliometria alle spalle (minimo 4 in B prima dell'intensiva A): solo blocchi B. · VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 3): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 35.3k caratteri (~9800 token), user 3.3k caratteri (~900 token)
**Piano:** piano base (senza Claude) in 17 ms
- **Lunedì** · Seduta base · fisica · 34' (+19' apertura) — 15 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Drbbling A2 (velocita, 28')
- **Martedì** · Seduta base · fisica · 15' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Mercoledì** · Seduta base · fisica · 37' (+19' apertura) — 11 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 46')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (decide il planner, massimo 7)
- ✅ sedute fisiche: 3 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì
- ✅ durata: 34', 15', 37' (massimo 120')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** serie ridotte, pliometria in B short ("scarico: richiamo"); forza prevenzione A1 era dura: codice precedente o versione breve; carico stimato sotto il tetto dello scarico.

## marco-modifica — Mercoledì: "Sposta la seduta di oggi a giovedì" (giorno squadra)

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Sposta la seduta di Mercoledì a Giovedì (stessi blocchi). — oggi è Mercoledì
**Contesto:** livello B; 95 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 0): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 32.9k caratteri (~9100 token), user 2.6k caratteri (~700 token)
**Piano:** piano base (senza Claude) in 19 ms
- **Giovedì** · Seduta base · fisica · 39' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 39')
- **Venerdì** · Giornata leggera · tecnica · 59' (+19' apertura) — 9 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica Freestyle A1 (tecnica-palleggi, 59')
- messaggio: Piano base della settimana (generato in modalità sicura).

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Giovedì, Venerdì (ammessi Lunedì/Venerdì/Giovedì)
- ✅ durata: 39', 59' (massimo 90')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il piano di lunedì resta (seduta passata) e conta nei controlli della settimana; la seduta di mercoledì va a giovedì (giorno squadra: ammesso, in versione più corta se il carico lo chiede); niente fisica venerdì.

## marco-domenica — Domenica sera: "Rifai da capo" con lun/mer/ven già passati

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Mercoledì, Venerdì (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 60 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza gambe, 2. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni). — oggi è Domenica
**Contesto:** livello B; 95 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: VELOCITÀ CON PALLA: senza la tecnica tra gli obiettivi arriva dalla 5ª settimana di allenamento (ora 0): i blocchi con sprint con palla non sono disponibili.
**Prompt:** system 32.7k caratteri (~9100 token), user 2.7k caratteri (~700 token)
**Piano:** piano base (senza Claude) in 14 ms
- **Domenica** · Seduta base · fisica · 14' (+9' apertura) — 6 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: richiamo (giorno dopo la partita) (forza-parte-bassa, 14')
- messaggio: Piano base della settimana (generato in modalità sicura).
- nota: Settimana già avviata (oggi è domenica): da qui a domenica 1 giornata invece di 3. Da lunedì si riparte con la settimana intera.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 1 (richieste 1)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Domenica
- ✅ durata: 14' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta – (pretesi: 1)

**Cosa mi aspettavo:** i giorni scelti sono tutti passati: si allarga a oggi (domenica, giorno dopo la partita); una sola giornata, nota "settimana avviata"; niente gambe il giorno dopo la partita: parte alta breve, fascia o tecnica.

## Riepilogo

| Scenario | Piano | Giornate | Controlli |
|---|---|---|---|
| marco | base | 3 | ✅ 7/7 |
| luca | base | 5 | ✅ 6/6 |
| davide | base | 3 | ✅ 7/7 |
| andrea | base | 2 | ✅ 7/7 |
| simone | base | 2 | ✅ 7/7 |
| giulia | base | 4 | ✅ 7/7 |
| luca-scarico | base | 3 | ✅ 6/6 |
| marco-modifica | base | 2 | ✅ 7/7 |
| marco-domenica | base | 1 | ✅ 7/7 |
