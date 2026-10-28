# Simulazione del planner v2 — 2026-10-28 (con Claude)

Prompt v2.49-sprint-per-distanza, 9 scenari. Lo script: `scripts/planner-sim.mts`. Atleti e richieste sono inventati; i blocchi, le regole e il validatore sono quelli veri.

## marco — Piano automatico del lunedì con il setup compilato

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.5k caratteri (~12400 token), user 2.4k caratteri (~700 token)
**Piano:** Claude in 14106 ms
- **Lunedì** · Gambe forti e parte alta esplosiva · fisica · 56' (+9' apertura) — 13 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Mercoledì** · Parte alta a serie e gambe tecniche · fisica · 59' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
  - Gambe: EMOM skill (forza-parte-bassa, 27')
- **Venerdì** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana pulita: lunedì e mercoledì lavoriamo su gambe e parte alta, i tuoi due obiettivi, per essere più forte nei duelli e negli stacchi di testa. Venerdì solo un'attivazione corta, così sabato arrivi carico. La corsa la fai già con la squadra martedì, quindi qui non la aggiungiamo: testa sulla forza!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 56', 59', 20' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** 3 giornate su lun/mer/ven, al massimo 3 fisiche, ognuna entro 60' (apertura esclusa); gambe e parte alta coperte (pb-* e pa-* dalle scale); niente fisica venerdì (il giorno prima della partita del sabato).

## luca — "Rifai da capo": 5 giornate da 75' in off season, velocità + salti + gambe

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 5 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 75 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Velocità, 2. Esplosività / salti, 3. Forza gambe (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 163 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.6k caratteri (~14100 token), user 2.8k caratteri (~800 token)
**Piano:** Claude in 23209 ms
- **Lunedì** · Sprint e salti · fisica · 74' — 16 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - VELOCITA' B1 (velocita, 35') · _4 sprint in meno: troppi sprint lunghi per una seduta_
  - Pliometria B1 (pliometria-intensiva, 24')
- **Martedì** · Gambe forti e addome · fisica · 65' (+19' apertura) — 15 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 46')
  - Circuito addominali B1 (core, 19')
- **Mercoledì** · Velocità esplosiva · fisica · 57' — 15 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - velocità e forza esplosiva B1 (velocita, 42')
- **Giovedì** · Salti, scatti corti e gambe tecniche · fisica · 72' (+19' apertura) — 24 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
  - Pliometria Rapidità Velocità B1 (pliometria-intensiva, 31') · _giornata di rapidità: via gli sprint oltre 30 m (1) · 3 sprint in meno: tetto di 4 nella giornata di rapidità (pochi scatti, corti)_
- **Sabato** · Fiato a serie e palla · mix · 62' (+19' apertura) — 13 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
  - Resistenza: 3 serie da 6' (resistenza-aerobica, 30')
- messaggio: Settimana tutta su quello che vuoi: lunedì e mercoledì velocità vera, salti lunedì e giovedì, gambe forti martedì e giovedì. Venerdì riposi, sabato chiudi con fiato e palla. Negli scatti dai tutto ma recupera bene tra uno e l'altro: la velocità si costruisce da fresco.
- sistemato dal server: Sabato: la resistenza in fondo alla seduta, prima il resto (a gambe fresche)

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 5 (richieste 5)
- ✅ sedute fisiche: 5 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Giovedì, Sabato (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 74', 65', 57', 72', 62' (massimo 75')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** 5 giornate entro 75'; velocità fino a DUE giornate non consecutive (off season, velocità primo obiettivo: 18/10) con il riscaldamento fisso in testa, al massimo 20 sprint oltre i 15 m in settimana (off season, dal 28/10) e per seduta le fasce per distanza; pliometria in B (prime 4 settimane) anche se l'atleta è A; gambe dalle scale.

## davide — PRO in palestra: kettlebell + gambe + parte alta su mar/gio/sab, partita domenica

**Atleta:** Davide, 24 anni, centrocampista. PRO (AMRAP 11), 80 kg, palestra + kettlebell + sbarra + campo, massimali (squat 1,6×, panca 1,0×, pull up 1,5×). In season, squadra lun/mer/ven, partita domenica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì, Sabato (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 90 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza funzionale kettlebell, 2. Forza gambe, 3. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello PRO; 165 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, kb-base); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 52.7k caratteri (~14600 token), user 3.2k caratteri (~900 token)
**Piano:** Claude in 16394 ms
- **Martedì** · Kettlebell e gambe forti · fisica · 52' (+19' apertura) — 15 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Kettlebell: base (forza-esplosiva, 24')
  - Gambe: forza massima in palestra (forza-parte-bassa, 33') · più leggero · _kettlebell attivo: parte bassa più leggera_
- **Giovedì** · Parte alta e passaggi · mix · 88' (+19' apertura) — 15 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 56')
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
- **Sabato** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana costruita sui tuoi obiettivi: martedì kettlebell e gambe forti, giovedì parte alta e pallone. Sabato non posso darti una seduta pesante perché domenica giochi: solo un'attivazione corta per arrivare in campo esplosivo. La resistenza la fai già lunedì con la squadra, quindi qui ci concentriamo sulla forza. Spingi forte martedì e giovedì, sabato vai leggero!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì, Sabato (ammessi Martedì/Giovedì/Sabato)
- ✅ durata: 52', 88', 20' (massimo 90')
- ✅ obiettivi: Forza funzionale kettlebell ✓, Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il sabato (giorno prima della partita) NON può essere una seduta fisica: 2 fisiche + 1 leggera, o 3 giornate con il sabato leggero; un blocco kb-* (kettlebell base: nessun log); Fmax possibile (massimali + esperienza palestra), kg sotto il tetto; parte alta dalle scale al livello PRO.

## andrea — Preparazione con la squadra: "decidi tu" tra mar e gio, 45', resistenza + tecnica

**Atleta:** Andrea, 17 anni, centrocampista. B, preparazione con la squadra (lun-ven, sforzo 8), partita sabato. Solo campo e rullo. Vuole resistenza e tecnica.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Martedì, Giovedì (SOLO questi). Tempo massimo per seduta: 45 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Resistenza, 2. Tecnica palla (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni).
**Contesto:** livello B (resistenza-aerobica A); 119 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-emom, pb-serie, pb-emom); tetto 1 fisiche + leggere fino a 3, 75'; carico insufficiente; regole: RESISTENZA ALLA VELOCITÀ: solo in off season (Ste, 25/10: 12 ripetizioni sono già molto pesanti).
**Prompt:** system 43.6k caratteri (~12100 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 13992 ms
- **Martedì** · Fiato a intervalli + visione di gioco · mix · 38' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Tecnica: visione (tecnica-visione, 15')
  - Resistenza: 3 serie da 5' (resistenza-aerobica, 27') · più leggero
- **Giovedì** · Palleggi e tocco di palla · tecnica · 37' — 6 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 37') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Questa settimana ti alleni con me due volte, solo martedì e giovedì, perché con la squadra hai già cinque allenamenti belli tosti e sabato giochi. Martedì facciamo lavoro di fiato a intervalli: è il tuo obiettivo, anche se lunedì e giovedì la squadra lavora già sulla corsa, quindi lo teniamo un po' più leggero. Giovedì solo palleggi, così sabato arrivi fresco e con un bel tocco di palla.
- sistemato dal server: Martedì: la resistenza in fondo alla seduta, prima il resto (a gambe fresche)

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
**Contesto:** livello B; 106 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 41.2k caratteri (~11500 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 12332 ms
- **Lunedì** · Palleggi e sensibilità di piede · tecnica · 37' — 6 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 37') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Mercoledì** · Fascia e lettura del gioco · tecnica · 15' (+23' apertura) — 8 esercizi
  - Fascia Foundations 1 (fascia-prevenzione, 23') · _facoltativa, se hai tempo_
  - Tecnica: visione (tecnica-visione, 15')
- messaggio: Settimana tranquilla perché hai segnalato un dolore: niente forza né salti finché non decidi tu di ripartire. Lunedì solo palleggi, mercoledì fascia e visione, così domenica arrivi fresco tra i pali. Se il dolore è forte o dura da giorni, fatti vedere da un fisioterapista o da un medico: è la mossa più intelligente per tornare al cento per cento.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (richieste 2)
- ✅ sedute fisiche: 0 (tetto 0, pausa dolore)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì (ammessi Lunedì/Mercoledì)
- ✅ durata: 37', 15' (massimo 45')
- ✅ obiettivi: Prevenzione / fascia ✓, Tecnica palla ✓ (pretesi: 2)

**Cosa mi aspettavo:** nessuna seduta fisica/mix; 2 giornate su lun/mer entro 45'; solo fascia, mobilità o tecnica leggera.

## giulia — Portiere, "Tutto, in equilibrio", 4 giornate da 60'

**Atleta:** Giulia, 20 anni, portiere. B, in season, portiere, squadra mar/gio, partita sabato. Setup "Tutto, in equilibrio", lun/mar/gio/ven, 4 giornate da 60'. Sbarra, campo, rullo.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (forza-esplosiva A, pliometria-intensiva A, pliometria-estensiva A); 115 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 45.4k caratteri (~12600 token), user 2.2k caratteri (~600 token)
**Piano:** Claude in 21035 ms
- **Lunedì** · Gambe e salti · fisica · 52' (+9' apertura) — 14 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Martedì** · Parte alta a serie · fisica · 41' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 41')
- **Giovedì** · Parte alta esplosiva e passaggi · mix · 55' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: EMOM skill (forza-parte-alta, 23')
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
- **Venerdì** · Prevenzione e tocchi leggeri · tecnica · 19' (+23' apertura) — 10 esercizi
  - Fascia Foundations 1 (fascia-prevenzione, 23') · _facoltativa, se hai tempo_
  - Tecnica leggera (il giorno prima della partita) (tecnica-palleggi, 19') · _facoltativa: il giorno prima della partita: poca roba (max 10 tiri, un dribbling corto, palleggi e passaggi), facoltativa_
- messaggio: Settimana in equilibrio: gambe e salti lunedì, parte alta martedì e giovedì, tecnica e prevenzione a chiudere. Lo sforzo forte lo metti a inizio settimana, così sabato arrivi fresco e reattivo tra i pali. Velocità e corsa le copre già la squadra giovedì: tu pensa a fare bene ogni ripetizione.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 3 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Martedì, Giovedì, Venerdì (ammessi Lunedì/Martedì/Giovedì/Venerdì)
- ✅ durata: 52', 41', 55', 19' (massimo 60')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Esplosività / salti, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** 4 giornate su lun/mar/gio/ven, al massimo 3 fisiche; almeno 2 aspetti diversi tra parte alta, gambe, salti, velocità, resistenza, tecnica; P1 (blocchi per il portiere) preferiti dove esistono; venerdì (giorno prima della partita) leggero.

## luca-scarico — Settimana di scarico con tre settimane di storico

**Atleta:** Luca, 22 anni, attaccante. A (AMRAP 9), off season senza squadra, attaccante. Solo campo e rullo. Test di velocità e salti al livello A, parte alta A. QUARTA settimana del ciclo (scarico) con tre settimane di sedute fatte: pliometria A1 facile ×3, velocità A1 giusta, forza prevenzione A1 dura.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 165 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico ok, tetto duro 1302 AU; SCARICO; regole: SALITE: settimana di scarico, i blocchi in salita non sono disponibili (pesanti).
**Memoria dei blocchi:** Velocità → velocita-a1 (stesso); Pliometria Rapidità Velocità → pliometria-rapidita-velocita-b2 (onda-b)
**Prompt:** system 51.4k caratteri (~14300 token), user 3.8k caratteri (~1000 token)
**Piano:** Claude in 18223 ms
- **Lunedì** · Velocità: scatti puliti · fisica · 36' — 17 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità A1 (velocita, 35') · più leggero
- **Mercoledì** · Salti, rapidità e gambe · fisica · 64' (+9' apertura) — 23 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Pliometria Rapidità Velocità B2 (pliometria-intensiva, 39') · _settimana di richiamo · giornata di rapidità: via gli sprint oltre 30 m (2) · 2 sprint in meno: tetto di 4 nella giornata di rapidità (pochi scatti, corti)_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
- **Venerdì** · Gambe forti con le tenute · fisica · 14' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Fascia Foundation B3 Forza - short (forza-parte-bassa, 18')
- **Domenica** · Palleggi in libertà · tecnica · 55' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 69') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Questa è la quarta settimana del ciclo: si scarica un po' per far assorbire al corpo il lavoro delle ultime tre e ripartire più forte. Tre giornate di allenamento vero (velocità, salti, gambe) come le settimane scorse ma più corte, più una giornata col pallone facoltativa domenica. Scatti al massimo quando li fai, ma senza aggiungere niente: questa settimana vince chi recupera bene.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (decide il planner, massimo 7)
- ✅ sedute fisiche: 3 (tetto 6)
- ✅ giorni: Lunedì, Mercoledì, Venerdì, Domenica
- ✅ durata: 36', 64', 14', 55' (massimo 120')
- ✅ obiettivi: Velocità ✓, Esplosività / salti ✓, Forza gambe ✓ (pretesi: 2)

**Cosa mi aspettavo:** serie ridotte, pliometria in B short ("scarico: richiamo"); forza prevenzione A1 era dura: codice precedente o versione breve; carico stimato sotto il tetto dello scarico.

## marco-modifica — Mercoledì: "Sposta la seduta di oggi a giovedì" (giorno squadra)

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Sposta la seduta di Mercoledì a Giovedì (stessi blocchi). — oggi è Mercoledì
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.7k caratteri (~12400 token), user 3.1k caratteri (~800 token)
**Piano:** Claude in 8218 ms
- **Giovedì** · Parte alta e gambe tecniche · fisica · 59' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
  - Gambe: EMOM skill (forza-parte-bassa, 27')
- **Venerdì** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Fatto: la seduta di parte alta e gambe passa a giovedì, il resto resta uguale. Giovedì hai anche la squadra: se puoi, falla al mattino, così la sera arrivi già sciolto. Restano due giornate di forza più l'attivazione di venerdì, perché con squadra e partita sabato è il carico giusto per arrivare in campo con gambe piene.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Giovedì, Venerdì (ammessi Lunedì/Venerdì/Giovedì)
- ✅ durata: 59', 20' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** il piano di lunedì resta (seduta passata) e conta nei controlli della settimana; la seduta di mercoledì va a giovedì (giorno squadra: ammesso, in versione più corta se il carico lo chiede); niente fisica venerdì.

## marco-domenica — Domenica sera: "Rifai da capo" con lun/mer/ven già passati

**Atleta:** Marco, 19 anni, difensore. B, in season, difensore, squadra mar/gio (sforzo 7 e 6), partita sabato. Sbarra, campo, rullo. Test base fatti, nessun massimale.
**Richiesta:** NUOVA SETTIMANA (richiesta esplicita dell'atleta: gli obiettivi vengono prima dei recuperi). Giorni disponibili per allenarsi con l'app: Lunedì, Mercoledì, Venerdì (SOLO questi). Sedute fisiche richieste: ESATTAMENTE 3 a settimana (se il tetto della fase lo permette). Tempo massimo per seduta: 60 minuti. Obiettivi di questa settimana, in ordine di priorità: 1. Forza gambe, 2. Forza parte alta (i primi 2 devono avere almeno un blocco: lo controlla il validatore; gli altri dove c'è spazio, senza saltare le progressioni). — oggi è Domenica
**Contesto:** livello B; 111 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.5k caratteri (~12400 token), user 2.8k caratteri (~800 token)
**Piano:** Claude in 10056 ms
- **Domenica** · Gambe sciolte e parte alta dopo la partita · fisica · 44' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: richiamo (giorno dopo la partita) (forza-parte-bassa, 14') · più leggero
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- messaggio: Della settimana resta solo oggi, e oggi è il giorno dopo la partita. Facciamo qualcosa di intelligente: le gambe solo per sciogliersi e restare attive, senza caricarle, e una parte alta corta per spalle e schiena più forti nei contrasti da difensore. Dalla prossima settimana ripartiamo con lunedì, mercoledì e venerdì e mettiamo le gambe al centro di tutto.
- nota: Settimana già avviata (oggi è domenica): da qui a domenica 1 giornata invece di 3. Da lunedì si riparte con la settimana intera.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 1 (richieste 1)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Domenica
- ✅ durata: 44' (massimo 60')
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
