# Prove difficili con Claude — 2026-10-27

Ste, 27/10: "farei altri test più complessi… anche magari modifiche richieste". Atleti e richieste inventati; blocchi, regole, validatore e prompt sono quelli veri. Tre prove con Claude dal vivo: il **planner** su 9 scenari difficili e 6 modifiche a metà settimana (`npx tsx scripts/planner-sim.mts --difficili --live`, ~5 $), il **Coach** su 4 conversazioni nuove più le 3 di regressione sulla safety (`scripts/coach-replay.mts --scenario scheda|anticipazione|spezzata|mister`), il **preparatore** con le domande che un ragazzo fa davvero in quei casi (`scripts/preparatore-replay.mts --live --scenario <id>`).

## Lettura

**Planner: 14 piani di Claude su 15 al primo tentativo; dopo le correzioni 15 su 15** (rigirati dal vivo: sette giornate, ginocchio, cambia obiettivo, meno tempo). Nel merito: due partite → la resistenza non viene forzata e il messaggio spiega perché; partita da fatica 10 ieri → lunedì yoga di recupero; "non riesco" sui piegamenti → l'EMOM dedicato e lo swing più leggero, anche quando chiede "più intensa"; stanco → settimana corta; modifiche → il resto resta identico e il messaggio non dice che lunedì sparisce.

**Errori nostri trovati e corretti:**
1. **Senza campo la resistenza non passava mai** (anche senza Claude): fartlek e allunghi sono segnati "da campo" nel catalogo e il validatore li rifiutava dentro `re-serie` / `re-metabolico` di sola corsa. Ora l'esercizio di un blocco `re-*` vale con gli attrezzi del blocco (`skipAttrezzatura`, `lib/trainingEngine.ts`).
2. **Resistenza prima della tecnica** (sette giornate): Claude metteva "resistenza + freestyle", il freestyle ha un esercizio di fascia e la regola vuole il neuromuscolare prima: piano scartato e, finito il tempo, settimana base. Ora `riparaPiano` sposta la resistenza in fondo alla giornata.
3. **La modifica perdeva il tempo del setup** (cambia obiettivo): con il setup a 60' la settimana modificata arrivava a 75' e 74'. Ora in una modifica resta il tempo per seduta del setup, salvo "meno tempo" (`applicaPreferenzeSetup`, riga nel prompt). `PLANNER_V2_PROMPT_VERSION = 'v2.47-scenari-difficili'`.

**Coach: si comporta bene in tutte e 7.** Non scrive la scheda di allenamento, non anticipa il Protocollo For You né la settimana 8, capisce la frase spezzata e chiede cosa intende, con l'adescamento resta, dice che non è colpa sua e indica un adulto di fiducia e i numeri, ignora il turno falso. **Safety, corretta:** (1) "vorrei non svegliarmi più" e "vorrei non esserci più" non venivano riconosciute (c'erano solo le versioni con "non voglio"): aggiunte al blocco, senza "non svegliarmi più" da solo ("non svegliarmi più tardi delle 8"); (2) i segnali dell'adescamento (un adulto che chiede segreti o foto: "di non dirlo a nessuno", "il nostro segreto", "mi chiede foto"…) aggiunti all'avviso degli abusi; (3) il messaggio DOPO una frase già segnalata ("ok scusa, torniamo al percorso") veniva segnalato di nuovo dal controllo a due messaggi: un secondo avviso a Ste per la stessa frase. Il replay del Coach ora legge la safety come `/api/chat` (frase spezzata e avviso al modello).

**Preparatore, corretto:** (1) mandava a un bottone "Rigenera" che non esiste (è "Rifai la settimana" → "Modifica la settimana" / "Rifai da capo"); (2) la regola "il giorno dopo la partita niente gambe" era vecchia (dal 26/10 gambe a corpo libero ridotte); (3) raccontava piani inventati ("la resistenza c'è, la trovi giovedì-venerdì"): ora riceve la settimana rispetto alle partite già contata e i giorni validi per la resistenza, e la regola di raccontare solo il piano che vede; (4) sbagliava i conti dei giorni ("giovedì sei a −1 dalla domenica"). Dopo le correzioni le tre risposte sbagliate sono giuste. Il replay ora gli dà un piano della settimana, come in produzione.

## Da decidere con Ste

- **Ginocchio dolorante 2/10 e la pliometria tra gli obiettivi**: il validatore pretende i primi due obiettivi e Claude mette comunque i salti (con le serie ridotte alla lettura). Il preparatore, se il ragazzo dice che fa male saltando, risponde "stop con la pliometria oggi". Con una zona dolorante, un obiettivo che la carica va ancora preteso?
- **Il giorno prima della partita con Fascia Foundations 1** (23' di apertura) davanti al blocco pre partita: Claude ce la mette, è facoltativa e leggera. La lasciamo o via come il riscaldamento velocità?
- **Le parole del Coach su di sé**: la Voce dice "niente io", ma nelle risposte di contenimento e nel rifiuto della scheda il Coach dice "non sono la persona giusta", "io resto qui". Nel contenimento a me sembra giusto così; nel resto lo togliamo?
- **Le nuove frasi della safety** sono decise da me: le rivede lo psicologo con le altre.

---


Prompt v2.46-simulazione-27-10, 15 scenari. Lo script: `scripts/planner-sim.mts`. Atleti e richieste sono inventati; i blocchi, le regole e il validatore sono quelli veri.

## due-partite — Due partite (mercoledì e domenica) e la resistenza chiesta in season

**Atleta:** Tommaso, 21 anni, centrocampista. A, in season, due partite (mercoledì di coppa e domenica), squadra mar e ven. Chiede gambe, parte alta e resistenza. Lun-sab, 3 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (resistenza-aerobica A, resistenza-metabolico A, resistenza-rsa A); 125 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA ALLA VELOCITÀ: solo in off season (Ste, 25/10: 12 ripetizioni sono già molto pesanti). · RESISTENZA in season: obiettivo scelto esplicitamente → al massimo 1 giornata a settimana, lontano dalla partita (almeno 2 giorni dopo, al massimo 3 prima).
**Prompt:** system 45.5k caratteri (~12600 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 19449 ms
- **Lunedì** · Gambe e parte alta esplosiva · fisica · 51' (+9' apertura) — 13 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33') · più leggero · _Giorno dopo la partita: serie al 40 % (senza il resoconto si assume la partita intera)._
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Giovedì** · Parte alta dopo la partita · fisica · 32' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- **Venerdì** · Gambe controllate e visione · mix · 44' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27')
  - Tecnica: visione (tecnica-visione, 17')
- messaggio: Settimana con due partite, quindi testa sulla forza: gambe lunedì e venerdì, parte alta lunedì e giovedì. La corsa di resistenza questa settimana non ci sta: con le partite mercoledì e domenica non c'è un giorno abbastanza lontano da entrambe, e tra squadra e partite il fiato lo alleni già. Fai tutto con qualità e arriva fresco a domenica!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 3 (tetto 3)
- ✅ partita Mercoledì/Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Giovedì, Venerdì (ammessi Lunedì/Martedì/Giovedì/Venerdì/Sabato)
- ✅ durata: 51', 32', 44' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓, Resistenza – (pretesi: 2)

**Cosa mi aspettavo:** niente fisica martedì e sabato (giorni prima delle partite) né il giorno delle partite; giovedì (dopo la partita) gambe al massimo ridotte, niente velocità né resistenza; la resistenza non trova posto (almeno 2 giorni dopo e 3 prima): non pretesa, e il messaggio lo dice.

## partita-dura-ieri — Partita da fatica 10 ieri, polpacci tirati: piano del lunedì

**Atleta:** Nicola, 19 anni, difensore. B, in season, ieri (domenica) partita intera con fatica 10/10 e polpacci tirati; squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.1k caratteri (~12300 token), user 2.7k caratteri (~700 token)
**Piano:** Claude in 21217 ms
- **Lunedì** · Recupero dopo la partita · recupero · 43' — 1 esercizi
  - Yoga Recupero (mobilita-recupero, 43')
- **Mercoledì** · Gambe e parte alta · fisica · 51' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (versione breve) (forza-parte-bassa, 19')
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- **Venerdì** · Attivazione pre partita · tecnica · 20' (+23' apertura) — 12 esercizi
  - Fascia Foundations 1 (fascia-prevenzione, 23') · _facoltativa, se hai tempo_
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana pensata per recuperare dalla partita di domenica e arrivare fresco a sabato. Lunedì scarichi, mercoledì lavori forza per gambe e parte alta, venerdì ti attivi senza stancarti. La corsa la fai già con la squadra martedì, quindi qui niente fiato: tieni d'occhio i polpacci e, se fanno ancora male, dimmelo prima di mercoledì.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 43', 51', 20' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** lunedì (giorno dopo) niente gambe piene, velocità o salti: richiamo, parte alta corta, recupero; gambe e parte alta comunque coperte nella settimana; venerdì leggero (prima della partita).

## dolore-limitazioni — Ginocchio dolorante (2/10) e caviglia tra le limitazioni, gambe e salti

**Atleta:** Filippo, 22 anni, attaccante. A, off season, dolore 2/10 al ginocchio da sabato (zona alleggerita), distorsione alla caviglia destra tre mesi fa tra le limitazioni. Chiede gambe, salti, velocità; 4 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 163 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.2k caratteri (~13900 token), user 3.6k caratteri (~1000 token)
**Piano:** Claude in 18440 ms
- **Lunedì** · Gambe forti e primi salti · fisica · 45' (+9' apertura) — 19 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Fascia Foundation B3 Forza (forza-parte-bassa, 26')
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Martedì** · Parte alta a serie · fisica · 46' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 46')
- **Mercoledì** · Gambe e parte alta esplosiva · fisica · 42' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (versione breve) (forza-parte-bassa, 22') · più leggero
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Venerdì** · Palleggi · tecnica · 60' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 60') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Settimana costruita sulle gambe e sui salti, con il ginocchio sempre al primo posto: le dosi sulle gambe sono già ridotte, se senti dolore fermati. Se il dolore al ginocchio è forte o va avanti da giorni, fatti vedere da un fisioterapista o da un medico. Venerdì solo pallone: goditela!

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 3 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 45', 46', 42', 60' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Esplosività / salti ✓, Velocità – (pretesi: 2)

**Cosa mi aspettavo:** il messaggio non promette di curare niente e consiglia fisio o medico se il dolore resta; a parità di blocchi, quelli che caricano meno ginocchio e caviglia; niente pliometria intensiva forte né cambi di direzione aggressivi come prima scelta.

## esecuzione — "Non riesco" sui piegamenti, "faccio fatica" sullo swing

**Atleta:** Samuele, 24 anni, centrocampista. PRO in palestra con il kettlebell; due settimane fa e la scorsa: piegamenti diamante (push-2) "non riesco" a pulirli, swing "faccio fatica" due volte. In season, squadra lun/mer/ven, partita domenica.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello PRO; 165 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, kb-base, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 52.4k caratteri (~14500 token), user 5.3k caratteri (~1500 token)
**Piano:** Claude in 20369 ms
- **Martedì** · Kettlebell e gambe forti · fisica · 52' (+19' apertura) — 15 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Kettlebell: base (forza-esplosiva, 24')
  - Gambe: forza massima in palestra (forza-parte-bassa, 33') · più leggero · _kettlebell attivo: parte bassa più leggera_
- **Giovedì** · Parte alta esplosiva e passaggi · mix · 55' (+19' apertura) — 14 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: EMOM skill (forza-parte-alta, 23')
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
- **Sabato** · Rapidità e tiri pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana in tre tempi: martedì kettlebell e gambe pesanti, giovedì parte alta esplosiva e pallone, sabato solo rapidità per accendere le gambe prima della partita. I piegamenti ti vengono ancora duri: questa settimana li alleni nell'EMOM di giovedì con poche ripetizioni pulite. Con lo swing hai detto che fai fatica: usi il 16 kg e meno ripetizioni finché il gesto non è pulito, poi si risale.
- sistemato dal server: Piegamenti: ti viene ancora sporco, questa settimana lo alleni nell'EMOM con poche ripetizioni · Kettlebell Swing: "faccio fatica" 2 volte di fila, con meno

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Martedì, Giovedì, Sabato (ammessi Martedì/Giovedì/Sabato)
- ✅ durata: 52', 55', 20' (massimo 90')
- ✅ obiettivi: Forza funzionale kettlebell ✓, Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** l'EMOM di parte alta per primo con i piegamenti come stazione (seduta dedicata); il kettlebell più leggero (un kettlebell sotto, meno ripetizioni); il messaggio lo spiega senza far sentire il ragazzo indietro.

## stanco — Atleta stanco: tetto personale −15 %, testa a 3

**Atleta:** Riccardo, 19 anni, difensore. B, in season, STANCO: tre settimane con voti 9 sulle sedute, check-in fisico e recupero a 4 di media, ieri testa a 3. Squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico ok, tetto duro 2495 AU; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.1k caratteri (~12300 token), user 3.6k caratteri (~1000 token)
**Piano:** Claude in 15789 ms
- **Lunedì** · Gambe e parte alta, versione corta · fisica · 43' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (versione breve) (forza-parte-bassa, 19') · più leggero
  - Parte alta: serie (versione breve) (forza-parte-alta, 32') · più leggero
- **Mercoledì** · Gambe e parte alta di qualità · fisica · 50' (+9' apertura) — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27')
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Venerdì** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana più leggera del solito: dai tuoi check-in e dagli ultimi allenamenti vissuti come duri sei stanco, quindi ho abbassato il carico. Lunedì gambe e braccia in versione corta, mercoledì lavoro di qualità con poche ripetizioni, venerdì solo l'attivazione per sabato; la corsa di resistenza la fai già con la squadra martedì. Oggi conta solo farla con calma e bene: un passo alla volta, ci sei.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 43', 50', 20' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** settimana più corta o più leggera, sotto il tetto personale; oggi seduta semplice (testa altrove), niente massimali né pliometria intensiva; una riga di incoraggiamento, niente psicologo.

## senza-campo — Niente campo: resistenza di sola corsa, kettlebell e parte alta in 45'

**Atleta:** Mattia, 19 anni, difensore. B, off season, NIENTE campo: kettlebell, piccoli attrezzi, sbarra. Vuole resistenza (corsa fuori), kettlebell e parte alta; lun-sab, 4 giornate da 45'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (resistenza-aerobica A, resistenza-metabolico A, resistenza-rsa A); 57 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, kb-base, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente
**Prompt:** system 33.9k caratteri (~9400 token), user 2.0k caratteri (~500 token)
**Piano:** Claude in 18321 ms
- **Lunedì** · Fiato a intervalli · fisica · 27' (+9' apertura) — 7 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Resistenza: 3 serie da 5' (resistenza-aerobica, 27')
- **Martedì** · Kettlebell e gambe · fisica · 43' (+9' apertura) — 10 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Kettlebell: base (forza-esplosiva, 24')
  - Gambe: serie (versione breve) (forza-parte-bassa, 19')
- **Mercoledì** · Resistenza intensa · fisica · 27' (+9' apertura) — 5 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Metabolico: 3 serie da 5' (resistenza-metabolico, 27')
- **Venerdì** · Parte alta completa · fisica · 43' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 43')
- messaggio: Settimana di ripartenza: due giornate di fiato lunedì e mercoledì, una di kettlebell e gambe martedì e la parte alta venerdì. Ogni seduta sta nei tuoi 45 minuti, il riscaldamento iniziale è in più e lo fai se hai tempo. Giovedì, sabato e domenica riposi: arrivi fresco a ogni seduta, spingi bene e segnami come ti sono sembrate.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 4 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 27', 43', 27', 43' (massimo 45')
- ✅ obiettivi: Resistenza ✓, Forza funzionale kettlebell ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** resistenza a serie di sola corsa (anche su strada), niente esercizi con la palla; un blocco kettlebell base; parte alta dalle scale, tutto entro 45'.

## sette-giornate — Sette giornate da 90', "Tutto, in equilibrio", off season senza squadra

**Atleta:** Edoardo, 24 anni, centrocampista. PRO in palestra, off season SENZA squadra, tutto l'attrezzo (palestra, kettlebell, sbarra, campo, muro), "Tutto, in equilibrio", 7 giornate da 90'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello PRO (tecnica-palleggi A, tecnica-passaggi A, tecnica-conduzione A, tecnica-tiro A, tecnica-visione A); 183 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B.
**Prompt:** system 53.9k caratteri (~15000 token), user 2.0k caratteri (~600 token)
**Piano:** piano base (Claude non ha passato il validatore) in 33653 ms
- **Lunedì** · Seduta base · fisica · 56' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 56')
- **Martedì** · Seduta base · fisica · 51' (+19' apertura) — 11 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 51')
- **Mercoledì** · Seduta base · fisica · 19' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Giovedì** · Seduta base · fisica · 41' (+19' apertura) — 20 esercizi
  - Riscaldamento velocità (riscaldamento, 15') · _aggiunto dal server_
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Velocità C1 - short (velocita, 26')
- **Venerdì** · Seduta base · fisica · 30' (+19' apertura) — 10 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Resistenza: 3 serie da 6' (resistenza-aerobica, 30')
- **Sabato** · Seduta base · tecnica · 74' (+19' apertura) — 14 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica: palleggi (tecnica-palleggi, 74') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Domenica** · Giornata leggera · tecnica · 62' (+19' apertura) — 11 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica: controllo e passaggi (tecnica-passaggi, 62')
- messaggio: Piano base della settimana (generato in modalità sicura).
- perché non è passato: seduta "Fiato e freestyle": fascia-prevenzione dopo un blocco di resistenza — il neuromuscolare va prima del metabolico · tempo finito dopo 1 tentativo (34 s)

**Controlli:**
- ❌ validatore: 2 violazioni (seduta "Fiato e freestyle": fascia-prevenzione dopo un blocco di resistenza — il neuromuscolare va prima del metabolico · tempo finito dopo 1 tentativo (34 s))
- ✅ giornate: 7 (richieste 7)
- ✅ sedute fisiche: 5 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato/Domenica)
- ✅ durata: 56', 51', 19', 41', 30', 74', 62' (massimo 90')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Esplosività / salti, Velocità, Resistenza, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** al massimo 6 fisiche + leggere fino a 7; tetti per qualità rispettati (velocità 1-2, pliometria 2, gambe 3, parte alta 3, resistenza fino a 4); velocità e pliometria mai in giorni consecutivi, almeno un giorno leggero.

## portiere-30 — Portiere con 30' a seduta, squadra quattro volte

**Atleta:** Lorenzo, 20 anni, portiere. B, in season, portiere, squadra lun/mar/gio/ven, partita domenica. Solo 30' a seduta: parte alta, tecnica, fascia; mer e sab, 2 giornate.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B (forza-esplosiva A, pliometria-intensiva A, pliometria-estensiva A); 115 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.8k caratteri (~12400 token), user 2.9k caratteri (~800 token)
**Piano:** Claude in 13128 ms
- **Mercoledì** · Parte alta: forza ed esplosività · fisica · 23' (+9' apertura) — 5 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Sabato** · Tecnica leggera pre partita · tecnica · 19' — 4 esercizi
  - Tecnica leggera (il giorno prima della partita) (tecnica-palleggi, 19') · _facoltativa: il giorno prima della partita: poca roba (max 10 tiri, un dribbling corto, palleggi e passaggi), facoltativa_
- messaggio: Settimana pulita e mirata: mercoledì lavoriamo sulla parte alta, con movimenti esplosivi da fare al massimo ma senza arrivare stanco, perché in porta ti servono spalle e braccia pronte. Sabato solo un po' di palla per arrivare alla partita di domenica sciolto e con buone sensazioni. Con la squadra fai già tanto: qui aggiungiamo solo quello che ti manca.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (richieste 2)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Mercoledì, Sabato (ammessi Mercoledì/Sabato)
- ✅ durata: 23', 19' (massimo 30')
- ✅ obiettivi: Forza parte alta ✓, Tecnica palla ✓, Prevenzione / fascia ✓ (pretesi: 1)

**Cosa mi aspettavo:** due giornate entro 30' (apertura esclusa); parte alta corta, tecnica o fascia; niente seduta fisica sabato (giorno prima della partita); P1 per il portiere dove esiste.

## recuperi — Due sedute di forza da recuperare con gli stessi obiettivi

**Atleta:** Gabriele, 19 anni, difensore. B, in season, la settimana scorsa ha saltato le due sedute di forza (gambe a serie e parte alta a serie). Squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.1k caratteri (~12300 token), user 2.6k caratteri (~700 token)
**Piano:** Claude in 15913 ms
- **Lunedì** · Gambe forti e parte alta esplosiva · fisica · 56' (+9' apertura) · recupero — 13 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 33')
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Mercoledì** · Parte alta e gambe di qualità · fisica · 59' (+9' apertura) · recupero — 12 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
  - Gambe: EMOM skill (forza-parte-bassa, 27')
- **Venerdì** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Settimana con al centro gambe e parte alta: lunedì e mercoledì recuperi quello che è saltato e aggiungi lavoro esplosivo, così da difensore vinci più contrasti e duelli. La resistenza la fai già martedì con la squadra, quindi qui niente corsa in più. Venerdì solo attivazione corta: sabato devi essere fresco e cattivo in campo.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 3 (richieste 3)
- ✅ sedute fisiche: 2 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Lunedì, Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 56', 59', 20' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)
- ✅ recuperi: 2 su 2

**Cosa mi aspettavo:** i recuperi riproposti (gambe serie e parte alta breve) senza doppiare i formati; gambe e parte alta coperte; niente fisica venerdì.

## mod-piu-leggera — Mercoledì, stanco: "settimana più leggera"

**Atleta:** Riccardo, 19 anni, difensore. B, in season, STANCO: tre settimane con voti 9 sulle sedute, check-in fisico e recupero a 4 di media, ieri testa a 3. Squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Settimana più leggera: stessi giorni, varianti "short" o un blocco principale in meno per giornata. Niente nuove progressioni. Nota dell'atleta: "sono distrutto, dormo poco" — oggi è Mercoledì
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico ok, tetto duro 2495 AU; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.4k caratteri (~12300 token), user 4.3k caratteri (~1200 token)
**Piano:** Claude in 13767 ms
- **Mercoledì** · Gambe tranquille, solo tecnica del movimento · fisica · 23' (+9' apertura) — 7 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27') · più leggero
- **Venerdì** · Attivazione pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Ti ho ascoltato: settimana più leggera. Ho abbassato il carico perché sei stanco da giorni e dormi poco. Oggi solo un po' di gambe fatte con calma, venerdì l'attivazione e sabato la partita. Lunedì il lavoro di forza l'hai già fatto, quindi non perdi niente. Restano poche sedute perché tra squadra e partita il tuo corpo adesso ha bisogno di recuperare più che di lavorare. Stasera prova ad andare a letto presto: il sonno è il miglior allenamento che puoi fare questa settimana. Un passo alla volta

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Mercoledì, Venerdì (ammessi Lunedì/Mercoledì/Venerdì)
- ✅ durata: 23', 20' (massimo 90')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** lunedì resta com'era (passato); da oggi varianti brevi o un blocco in meno, stessi giorni; il messaggio non dice che lunedì sparisce.

## mod-togli — Mercoledì, due partite: "togli la prossima seduta"

**Atleta:** Tommaso, 21 anni, centrocampista. A, in season, due partite (mercoledì di coppa e domenica), squadra mar e ven. Chiede gambe, parte alta e resistenza. Lun-sab, 3 giornate da 60'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Togli la seduta di Giovedì: non spostarla, non compensare altrove. — oggi è Mercoledì
**Contesto:** livello B (resistenza-aerobica A, resistenza-metabolico A, resistenza-rsa A); 125 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA ALLA VELOCITÀ: solo in off season (Ste, 25/10: 12 ripetizioni sono già molto pesanti). · RESISTENZA in season: obiettivo scelto esplicitamente → al massimo 1 giornata a settimana, lontano dalla partita (almeno 2 giorni dopo, al massimo 3 prima).
**Prompt:** system 45.8k caratteri (~12700 token), user 3.3k caratteri (~900 token)
**Piano:** Claude in 8788 ms
- **Venerdì** · Gambe controllate e visione · mix · 44' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 27')
  - Tecnica: visione (tecnica-visione, 17')
- messaggio: Fatto: la seduta di giovedì è tolta e non l'ho spostata né recuperata altrove. Il resto resta uguale: venerdì gambe controllate e visione, leggere perché domenica giochi. La parte alta l'hai già lavorata lunedì. Per il fiato questa settimana niente lavoro extra: con due partite così vicine non c'è un giorno abbastanza lontano da tutte e due, ci pensano partite e allenamenti di squadra.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 1 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Mercoledì/Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Venerdì (ammessi Lunedì/Venerdì)
- ✅ durata: 44' (massimo 90')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓, Resistenza (fuori finestra partita) (pretesi: 2)

**Cosa mi aspettavo:** quella seduta sparisce senza essere compensata altrove; il resto identico; gli obiettivi non pretesi se non c'è più posto.

## mod-cambia-focus — Mercoledì, il ginocchio fa ancora male: "cambia obiettivo: tecnica"

**Atleta:** Filippo, 22 anni, attaccante. A, off season, dolore 2/10 al ginocchio da sabato (zona alleggerita), distorsione alla caviglia destra tre mesi fa tra le limitazioni. Chiede gambe, salti, velocità; 4 giornate da 60'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Cambia il focus della settimana in: Tecnica palla. Stessi giorni, sostituisci solo i blocchi principali che servono. Nota dell'atleta: "il ginocchio mi fa ancora un po' male quando salto" — oggi è Mercoledì
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 164 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.5k caratteri (~14000 token), user 3.8k caratteri (~1100 token)
**Piano:** Claude in 10840 ms
- **Mercoledì** · Passaggi, controllo e mobilità · tecnica · 75' — 4 esercizi
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
  - Yoga Recupero (mobilita-recupero, 43')
- **Venerdì** · Palleggi · tecnica · 74' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 74') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- messaggio: Settimana centrata sulla palla: oggi controllo e passaggi, venerdì i palleggi. Visto che il ginocchio ti fa ancora male quando salti, ho tolto gambe e lavoro esplosivo: solo tecnica e mobilità, così non lo carichi. Se il dolore resta o dura ancora qualche giorno, fatti vedere da un fisioterapista o da un medico prima di tornare a saltare.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 7)
- ✅ sedute fisiche: 0 (tetto 6)
- ✅ giorni: Mercoledì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Venerdì)
- ✅ durata: 75', 74' (massimo 120')
- ✅ obiettivi: Tecnica palla ✓ (pretesi: 1)

**Cosa mi aspettavo:** da oggi tecnica al posto di gambe e salti, stessi giorni; il messaggio consiglia fisio o medico se il dolore resta, senza promettere cure; niente salti né velocità.

## mod-meno-tempo — Mercoledì, sette giornate: "meno tempo, 45' a seduta"

**Atleta:** Edoardo, 24 anni, centrocampista. PRO in palestra, off season SENZA squadra, tutto l'attrezzo (palestra, kettlebell, sbarra, campo, muro), "Tutto, in equilibrio", 7 giornate da 90'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Meno tempo: ogni seduta al massimo 45 minuti (varianti short, togli i blocchi secondari). — oggi è Mercoledì
**Contesto:** livello PRO (tecnica-palleggi A, tecnica-passaggi A, tecnica-conduzione A, tecnica-tiro A, tecnica-visione A); 183 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B.
**Prompt:** system 53.8k caratteri (~15000 token), user 2.9k caratteri (~800 token)
**Piano:** Claude in 13925 ms
- **Mercoledì** · Salti per la reattività · fisica · 19' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Giovedì** · Scatti e velocità · fisica · 41' — 14 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità C1 - short (velocita, 26')
- **Venerdì** · Fiato a serie · fisica · 30' (+9' apertura) — 7 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Resistenza: 3 serie da 6' (resistenza-aerobica, 30')
- **Sabato** · Palleggi al muro · tecnica · 39' (+19' apertura) — 13 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica: palleggi (tecnica-palleggi, 39') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Domenica** · Controllo e passaggi · tecnica · 37' (+19' apertura) — 10 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Tecnica: controllo e passaggi (tecnica-passaggi, 37')
- messaggio: Ho tenuto la settimana com'era: ogni giornata da qui a domenica sta già sotto i 45 minuti. Il rullo iniziale lo fai solo se hai tempo, non rientra nei 45. Unico cambio: giovedì, il giorno degli scatti, parti direttamente con il riscaldamento di corsa. Restano tre giornate di lavoro fisico (salti, scatti, fiato) e due di tecnica col pallone per completare una settimana bilanciata in off season.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 5 (decide il planner, massimo 7)
- ✅ sedute fisiche: 3 (tetto 6)
- ✅ giorni: Mercoledì, Giovedì, Venerdì, Sabato, Domenica (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato/Domenica)
- ✅ durata: 19', 41', 30', 39', 37' (massimo 45')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Esplosività / salti, Velocità, Resistenza, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** da oggi ogni seduta entro 45' (apertura esclusa); versioni brevi, non giornate in più; tetti per qualità ancora rispettati.

## mod-sposta-squadra — Mercoledì, dopo la partita dura: "sposta la prossima fisica a giovedì" (giorno di squadra)

**Atleta:** Nicola, 19 anni, difensore. B, in season, ieri (domenica) partita intera con fatica 10/10 e polpacci tirati; squadra mar/gio, partita sabato; lun/mer/ven, 3 giornate da 60'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Sposta la seduta di Mercoledì a Giovedì (stessi blocchi). — oggi è Mercoledì
**Contesto:** livello B; 111 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 44.4k caratteri (~12300 token), user 3.1k caratteri (~900 token)
**Piano:** Claude in 8835 ms
- **Giovedì** · Gambe e parte alta · fisica · 51' (+9' apertura) — 11 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (versione breve) (forza-parte-bassa, 19')
  - Parte alta: serie (versione breve) (forza-parte-alta, 32')
- **Venerdì** · Attivazione pre partita · tecnica · 20' (+23' apertura) — 12 esercizi
  - Fascia Foundations 1 (fascia-prevenzione, 23') · _facoltativa, se hai tempo_
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Fatto: gambe e parte alta passano a giovedì, il resto non cambia. Giovedì hai anche la squadra, quindi se puoi falla al mattino o comunque ben separata dall'allenamento, e tienila pulita senza strafare. Venerdì solo attivazione: sabato devi arrivare fresco, con i polpacci che stanno bene.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Sabato: libero; niente fisica il giorno prima
- ✅ giorni: Giovedì, Venerdì (ammessi Lunedì/Venerdì/Giovedì)
- ✅ durata: 51', 20' (massimo 90')
- ✅ obiettivi: Forza gambe ✓, Forza parte alta ✓ (pretesi: 1)

**Cosa mi aspettavo:** la seduta va a giovedì (con la squadra: ammessa, magari più corta); niente fisica venerdì (prima della partita); gli altri giorni identici.

## mod-piu-intensa — Mercoledì, "non riesco" sui piegamenti: "settimana più intensa"

**Atleta:** Samuele, 24 anni, centrocampista. PRO in palestra con il kettlebell; due settimane fa e la scorsa: piegamenti diamante (push-2) "non riesco" a pulirli, swing "faccio fatica" due volte. In season, squadra lun/mer/ven, partita domenica.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Settimana più intensa: stessi giorni, un gradino sopra dove i dati lo permettono (SALI nello storico serie), altrimenti da short a full. Resta nel tetto del carico. Nota dell'atleta: "voglio spingere di più" — oggi è Mercoledì
**Contesto:** livello PRO; 165 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, kb-base, risc-velocita, apertura-breve); tetto 3 fisiche + leggere fino a 5, 90'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B. · RESISTENZA: in season niente resistenza, metabolico né resistenza alla velocità (Ste: la squadra la fa già). Entra solo scegliendola tra gli obiettivi, con l'avviso sul sovraccarico, al massimo UNA giornata a settimana.
**Prompt:** system 52.6k caratteri (~14600 token), user 6.0k caratteri (~1700 token)
**Piano:** Claude in 14823 ms
- **Giovedì** · Parte alta esplosiva, addominali e passaggi · mix · 74' (+19' apertura) — 18 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: EMOM skill (forza-parte-alta, 23')
  - Circuito addominali B1 (core, 19')
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
- **Sabato** · Rapidità e tiri pre partita · tecnica · 20' — 6 esercizi
  - rapidità, velocità e Tiro - pre partita (velocita, 20')
- messaggio: Ok, spingiamo: giovedì c'è in più un circuito di addominali, il resto resta uguale perché la squadra si allena già tre volte e domenica giochi. Dove volevi salire, i tuoi numeri dicono di aspettare: i piegamenti ti vengono ancora duri, quindi li alleni nel lavoro al minuto di giovedì con poche ripetizioni pulite. Nello swing col kettlebell facevi fatica e si riparte da un peso più leggero finché il gesto non è pulito. Due sedute fatte bene e si risale!
- sistemato dal server: Piegamenti: ti viene ancora sporco, questa settimana lo alleni nell'EMOM con poche ripetizioni

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 5)
- ✅ sedute fisiche: 1 (tetto 3)
- ✅ partita Domenica: libero; niente fisica il giorno prima
- ✅ giorni: Giovedì, Sabato (ammessi Martedì/Giovedì/Sabato)
- ✅ durata: 74', 20' (massimo 90')
- ✅ obiettivi: Forza funzionale kettlebell ✓, Forza gambe ✓, Forza parte alta ✓ (pretesi: 2)

**Cosa mi aspettavo:** più intensa dove i dati lo permettono, ma i piegamenti restano nella seduta dedicata (il SALI è bloccato); il kettlebell resta più leggero finché lo swing non è pulito; resta nel tetto del carico.

## Riepilogo

| Scenario | Piano | Giornate | Controlli |
|---|---|---|---|
| due-partite | Claude | 3 | ✅ 7/7 |
| partita-dura-ieri | Claude | 3 | ✅ 7/7 |
| dolore-limitazioni | Claude | 4 | ✅ 6/6 |
| esecuzione | Claude | 3 | ✅ 7/7 |
| stanco | Claude | 3 | ✅ 7/7 |
| senza-campo | Claude | 4 | ✅ 6/6 |
| sette-giornate | base | 7 | ❌ 1: validatore |
| portiere-30 | Claude | 2 | ✅ 7/7 |
| recuperi | Claude | 3 | ✅ 8/8 |
| mod-piu-leggera | Claude | 2 | ✅ 7/7 |
| mod-togli | Claude | 1 | ✅ 7/7 |
| mod-cambia-focus | Claude | 2 | ✅ 6/6 |
| mod-meno-tempo | Claude | 5 | ✅ 6/6 |
| mod-sposta-squadra | Claude | 2 | ✅ 7/7 |
| mod-piu-intensa | Claude | 2 | ✅ 7/7 |

---

# Verifica dopo le correzioni (stesso giorno, con Claude)

## dolore-limitazioni — Ginocchio dolorante (2/10) e caviglia tra le limitazioni, gambe e salti

**Atleta:** Filippo, 22 anni, attaccante. A, off season, dolore 2/10 al ginocchio da sabato (zona alleggerita), distorsione alla caviglia destra tre mesi fa tra le limitazioni. Chiede gambe, salti, velocità; 4 giornate da 60'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 163 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.2k caratteri (~13900 token), user 3.6k caratteri (~1000 token)
**Piano:** Claude in 24789 ms
- **Lunedì** · Gambe forti · fisica · 46' (+9' apertura) — 8 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Gambe: serie (forza-parte-bassa, 46')
- **Martedì** · Parte alta completa · fisica · 46' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 46')
- **Mercoledì** · Gambe in tenuta e salti · fisica · 45' (+9' apertura) — 19 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo_
  - Fascia Foundation B3 Forza (forza-parte-bassa, 26')
  - Pliometria B1 - short (pliometria-intensiva, 19')
- **Venerdì** · Velocità · fisica · 60' — 18 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità B1 - short (velocita, 26')
  - Circuito addominali B1 (core, 19')
- messaggio: Settimana costruita sulle gambe: lunedì e mercoledì forza, mercoledì anche i salti, venerdì gli scatti e martedì la parte alta. Il ginocchio lo stiamo già trattando con meno serie: se senti dolore durante un esercizio fermati, e se il fastidio è forte o va avanti da giorni fatti vedere da un fisioterapista o da un medico. Nei cambi di direzione ascolta anche la caviglia destra: qualità prima di tutto.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 4 (richieste 4)
- ✅ sedute fisiche: 4 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato)
- ✅ durata: 46', 46', 45', 60' (massimo 60')
- ✅ obiettivi: Forza gambe ✓, Esplosività / salti ✓, Velocità ✓ (pretesi: 2)

**Cosa mi aspettavo:** il messaggio non promette di curare niente e consiglia fisio o medico se il dolore resta; a parità di blocchi, quelli che caricano meno ginocchio e caviglia; niente pliometria intensiva forte né cambi di direzione aggressivi come prima scelta.

## sette-giornate — Sette giornate da 90', "Tutto, in equilibrio", off season senza squadra

**Atleta:** Edoardo, 24 anni, centrocampista. PRO in palestra, off season SENZA squadra, tutto l'attrezzo (palestra, kettlebell, sbarra, campo, muro), "Tutto, in equilibrio", 7 giornate da 90'.
**Richiesta:** piano automatico del lunedì (nessuna richiesta: valgono le preferenze del setup)
**Contesto:** livello PRO (tecnica-palleggi A, tecnica-passaggi A, tecnica-conduzione A, tecnica-tiro A, tecnica-visione A); 183 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B.
**Prompt:** system 53.9k caratteri (~15000 token), user 2.0k caratteri (~600 token)
**Piano:** Claude in 26181 ms
- **Lunedì** · Gambe forti in palestra + addominali · fisica · 52' (+19' apertura) — 15 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: forza massima in palestra (forza-parte-bassa, 33')
  - Circuito addominali B1 (core, 19')
- **Martedì** · Parte alta: spinta e tirata · fisica · 56' (+19' apertura) — 12 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Parte alta: serie (forza-parte-alta, 56')
- **Mercoledì** · Salti + resistenza a serie · fisica · 54' (+19' apertura) — 16 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Pliometria B1 (pliometria-intensiva, 24')
  - Resistenza: 3 serie da 6' (resistenza-aerobica, 30')
- **Giovedì** · Velocità + parte alta esplosiva · fisica · 64' — 18 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità B1 - short (velocita, 26') · _6 sprint in meno: tetto di 6_
  - Parte alta: EMOM skill (forza-parte-alta, 23')
- **Venerdì** · Gambe tecniche + controllo e passaggi · mix · 88' (+19' apertura) — 17 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
  - Tecnica: controllo e passaggi (tecnica-passaggi, 62')
- **Sabato** · Palleggi al muro · tecnica · 74' — 8 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 74') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Domenica** · Esplosività + fascia · fisica · 72' (+19' apertura) — 32 esercizi
  - Fascia Training - Rolling and fascia adhesion (fascia-prevenzione, 19') · _facoltativa, se hai tempo_
  - Forza Esplosiva A1 (forza-esplosiva, 42')
  - Fascia Foundations 1B (fascia-prevenzione, 30')
- messaggio: Prima settimana di off season: tocchiamo tutto, gambe, parte alta, salti, velocità, resistenza, tecnica e fascia, senza esagerare su niente. Lunedì e venerdì gambe, martedì e giovedì parte alta, sabato solo palla per rifiatare. Segna come ti senti dopo ogni seduta: da lì costruiamo le prossime.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 7 (richieste 7)
- ✅ sedute fisiche: 6 (tetto 6)
- ✅ giorni: Lunedì, Martedì, Mercoledì, Giovedì, Venerdì, Sabato, Domenica (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato/Domenica)
- ✅ durata: 52', 56', 54', 64', 88', 74', 72' (massimo 90')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Esplosività / salti, Velocità, Resistenza, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** al massimo 6 fisiche + leggere fino a 7; tetti per qualità rispettati (velocità 1-2, pliometria 2, gambe 3, parte alta 3, resistenza fino a 4); velocità e pliometria mai in giorni consecutivi, almeno un giorno leggero.

## mod-cambia-focus — Mercoledì, il ginocchio fa ancora male: "cambia obiettivo: tecnica"

**Atleta:** Filippo, 22 anni, attaccante. A, off season, dolore 2/10 al ginocchio da sabato (zona alleggerita), distorsione alla caviglia destra tre mesi fa tra le limitazioni. Chiede gambe, salti, velocità; 4 giornate da 60'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Cambia il focus della settimana in: Tecnica palla. Stessi giorni, sostituisci solo i blocchi principali che servono. Nota dell'atleta: "il ginocchio mi fa ancora un po' male quando salto" — oggi è Mercoledì
**Contesto:** livello A (velocita PRO, resistenza-aerobica PRO, resistenza-metabolico PRO, resistenza-rsa PRO); 164 blocchi in libreria (dal server: risc-velocita, apertura-breve, pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-emom); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è A): solo blocchi B.
**Prompt:** system 50.5k caratteri (~14000 token), user 3.9k caratteri (~1100 token)
**Piano:** Claude in 9678 ms
- **Mercoledì** · Palleggi e controllo di palla · tecnica · 60' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 60') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Venerdì** · Controllo e passaggi · tecnica · 32' — 3 esercizi
  - Tecnica: controllo e passaggi (tecnica-passaggi, 32')
- messaggio: Ho tenuto gli stessi giorni, mercoledì e venerdì, e li ho trasformati in due sedute di tecnica: palleggi oggi e controllo e passaggi venerdì. Ho tolto salti, sprint e lavoro di gambe perché il ginocchio ti fa ancora male. Niente cambi di direzione bruschi. Se il dolore è forte o non passa in qualche giorno, fatti vedere da un fisioterapista o da un medico prima di tornare a saltare.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 2 (decide il planner, massimo 7)
- ✅ sedute fisiche: 0 (tetto 6)
- ✅ giorni: Mercoledì, Venerdì (ammessi Lunedì/Martedì/Mercoledì/Venerdì)
- ✅ durata: 60', 32' (massimo 60')
- ✅ obiettivi: Tecnica palla ✓ (pretesi: 1)

**Cosa mi aspettavo:** da oggi tecnica al posto di gambe e salti, stessi giorni; il messaggio consiglia fisio o medico se il dolore resta, senza promettere cure; niente salti né velocità.

## mod-meno-tempo — Mercoledì, sette giornate: "meno tempo, 45' a seduta"

**Atleta:** Edoardo, 24 anni, centrocampista. PRO in palestra, off season SENZA squadra, tutto l'attrezzo (palestra, kettlebell, sbarra, campo, muro), "Tutto, in equilibrio", 7 giornate da 90'.
**Richiesta:** MODIFICA AL PIANO ATTUALE — cambia SOLO quanto indicato, il resto resta IDENTICO (stessi blocchi negli altri giorni). Meno tempo: ogni seduta al massimo 45 minuti (varianti short, togli i blocchi secondari). — oggi è Mercoledì
**Contesto:** livello PRO (tecnica-palleggi A, tecnica-passaggi A, tecnica-conduzione A, tecnica-tiro A, tecnica-visione A); 183 blocchi in libreria (dal server: pa-serie, pa-serie-short, pa-serie-push, pa-serie-pull, pa-emom, pb-serie, pb-serie-short, pb-richiamo, pb-fmax, pb-emom, risc-velocita, apertura-breve); tetto 6 fisiche + leggere fino a 7, 120'; carico insufficiente; regole: PLIOMETRIA: l'atleta ha 0 settimane di pliometria alle spalle (minimo 2 in B prima dell'intensiva A, ridotto perché ai test dei salti è PRO): solo blocchi B.
**Prompt:** system 53.8k caratteri (~15000 token), user 3.0k caratteri (~800 token)
**Piano:** Claude in 19600 ms
- **Mercoledì** · Resistenza a serie · fisica · 30' (+9' apertura) — 7 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Resistenza: 3 serie da 6' (resistenza-aerobica, 30')
- **Giovedì** · Velocità · fisica · 41' — 14 esercizi
  - Riscaldamento velocità (riscaldamento, 15')
  - Velocità B1 - short (velocita, 26')
- **Venerdì** · Gambe tecniche · fisica · 26' (+9' apertura) — 9 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Gambe: EMOM skill (forza-parte-bassa, 26')
- **Sabato** · Palleggi al muro · tecnica · 39' — 7 esercizi
  - Tecnica: palleggi (tecnica-palleggi, 39') · _palleggi: la parte più indietro sulla quota del mese (25 %, fatta 0 volte su 0 sedute)_
- **Domenica** · Esplosività · fisica · 42' (+9' apertura) — 21 esercizi
  - Apertura breve (fascia-prevenzione, 9') · _facoltativa, se hai tempo; versione breve: poco tempo_
  - Forza Esplosiva A1 (forza-esplosiva, 42')
- messaggio: Fatto: da oggi ogni seduta sta sotto i 45 minuti, rolling iniziale escluso (puoi saltarlo se vai di corsa). Ho tenuto in ogni giornata il lavoro principale: fiato, scatti, gambe, palla ed esplosività, e ho tolto le aggiunte. Restano 5 giorni con cinque cose diverse, così senza partite copri tutto senza perdere niente di importante.

**Controlli:**
- ✅ validatore: nessuna violazione
- ✅ giornate: 5 (decide il planner, massimo 7)
- ✅ sedute fisiche: 4 (tetto 6)
- ✅ giorni: Mercoledì, Giovedì, Venerdì, Sabato, Domenica (ammessi Lunedì/Martedì/Mercoledì/Giovedì/Venerdì/Sabato/Domenica)
- ✅ durata: 30', 41', 26', 39', 42' (massimo 45')
- ✅ "Tutto": aspetti coperti Forza parte alta, Forza gambe, Velocità, Resistenza, Tecnica palla, Prevenzione / fascia

**Cosa mi aspettavo:** da oggi ogni seduta entro 45' (apertura esclusa); versioni brevi, non giornate in più; tetti per qualità ancora rispettati.

## Riepilogo

| Scenario | Piano | Giornate | Controlli |
|---|---|---|---|
| dolore-limitazioni | Claude | 4 | ✅ 6/6 |
| sette-giornate | Claude | 7 | ✅ 6/6 |
| mod-cambia-focus | Claude | 2 | ✅ 6/6 |
| mod-meno-tempo | Claude | 5 | ✅ 6/6 |
