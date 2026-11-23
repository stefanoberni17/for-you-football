# Carico e tetto: come si calcolano oggi, cosa non va, proposta

23/11/2026. Ste: «dobbiamo capire bene come calcolare il carico e il tetto massimo, perché deve esserci possibilità di
progressione». Nasce dalla settimana del 23/11 con una seduta sola. Le decisioni di Ste e cosa è entrato nel codice
sono in fondo (§6).

## 1. Come funziona oggi (`lib/trainingLoad.ts`)

- **Carico di una seduta** = minuti × fatica (1-10). Minuti: quelli veri del player se tra 10' e 4 ore, altrimenti
  quelli del piano. Fatica: il voto di fine seduta, poi la media delle serie, poi il giudizio, poi 6.
- **Settimana dell'app** = somma delle sedute fatte da lunedì a domenica.
- **Cronico** = media delle ultime 3 settimane complete dell'app (una settimana senza sedute conta 0). Serve uno storico
  di almeno 14 giorni, altrimenti niente cronico.
- **Squadra (S)** = una stima della squadra di **questa** settimana (giorni × durata × sforzo, partita 90' × 9; 0 in
  off season e 0 se il ragazzo ha confermato «niente squadra»). Si somma sia a questa settimana sia, come «base
  costante», a tutte le settimane passate.
- **Tetto duro** (il validatore rifiuta oltre) = 1,5 × (cronico + S) − S, mai sotto 300. Stanco: ×0,9.
- **Guida** per Claude: 90-110 % del totale, fino a +15 %.
- **Carico previsto** della settimana nuova = minuti del piano × fatica attesa per qualità (forza 7, fascia 4…) ×
  la calibrazione dell'atleta (fatica vera / attesa, 0,4-1,3).

## 2. Cosa non va (con i numeri di Ste)

**A. La squadra delle settimane passate è quella di questa settimana.** È il difetto più grosso. Ste fino al 14/11 si
allenava con la squadra e giocava (resoconti veri):

| Settimana | App | Squadra (resoconti) | Totale |
|---|---|---|---|
| 2/11 | 84 (una seduta, 14') | 450 + 180 + partita 720 | ~1430 |
| 9/11 | 198 (una seduta, 33') | 300 + 180 + partita 525 | ~1200 |
| 16/11 | ~190 (infortunio, niente squadra) | 0 | ~190 |

Questa settimana ha confermato «niente squadra», quindi S = 0, e il calcolo usa S = 0 anche per il 2/11 e il 9/11:
il cronico diventa 158 invece di ~940. Il tetto scende a 300 (il minimo) invece di ~1400, e passa una seduta sola
(una seduta di parte alta vale ~230). Succede a chiunque cambi squadra da una settimana all'altra: infortunio, vacanza,
passaggio in off season (dove S vale sempre 0).

**B. La trappola: con poche sedute non si sale mai.** Chi fa una seduta a settimana (~230) ha cronico ~230, tetto
max(1,5 × 230; 300) = 345, e due sedute valgono ~460. Resta a una seduta per sempre, anche facendole tutte. Il
rapporto in percentuale non funziona con numeri piccoli: da 1 a 2 sedute è +100 %.

**C. Dopo uno stop non c'è nessun tetto.** Senza sedute nelle ultime 4 settimane (o con meno di 14 giorni di storico)
il cronico è 0 e il tetto non esiste: dopo un mese fermo il validatore lascia passare qualsiasi settimana. Proprio il
momento in cui serve più prudenza.

**D. Due metri diversi.** Il passato si misura con i minuti veri (Ste: 14' e 33'), la settimana nuova con i minuti del
piano (32-48' più l'apertura). Chi chiude prima o salta l'apertura ha un passato «leggero» e un futuro «pesante»:
il tetto morde prima del dovuto. La calibrazione corregge solo la fatica, non i minuti.

**E. L'ACWR come muro.** Dalla ricerca del 20/10 (`docs/ricerca-metodo-2026-10.md` §4): il rapporto acuto/cronico
non predice gli infortuni meglio del caso (Impellizzeri 2020-2021; meta-analisi 2026 g 0,35); il segnale che i dati
sostengono è l'aumento assoluto rispetto all'abitudine (oltre +30 % sulla media di 4 settimane, Fredette 2022) e il
carico settimanale alto; chi ha più capacità regge gli aumenti (Malone 2017). Il tetto a 1,5 è una scelta di buon senso,
non una misura del rischio.

## 3. Proposta

1. **Il totale vero di ogni settimana.** Per ogni settimana passata: app + la sua squadra (resoconti quando ci sono,
   altrimenti il calendario di quella settimana, altrimenti l'abitudine del setup; settimana confermata vuota = 0).
   Questa settimana: il piano nuovo + la sua squadra. Non più una S uguale per tutte.
2. **Il tetto dall'abitudine e da quello che hai già retto.** Tetto totale = il più alto tra +30 % sulla media delle
   ultime 4 settimane (il dato della ricerca, al posto di 1,5 × 3 settimane) e la settimana più carica delle ultime 4
   («l'hai già fatta»). Tetto dell'app = tetto totale − squadra di questa settimana.
3. **Si sale di una seduta a settimana (pavimento di progressione).** Il tetto dell'app non scende mai sotto le sedute
   fisiche della settimana più piena delle ultime 3, più una (minimo 2), al carico medio di una sua seduta. Il +1 vale
   solo se la settimana scorsa le sedute sono state fatte, non erano dure (voto medio sotto 8) e non è stanco; se no,
   le sedute di prima. Il setup resta il massimo (3 giornate chieste = mai più di 3).
4. **Dopo uno stop si riparte da 2 sedute**, non da «nessun tetto»: il pavimento vale anche con lo storico vuoto.
5. **Stesso metro.** Calibrare anche i minuti: rapporto minuti veri / minuti del piano dell'atleta (0,5-1,2) nel
   carico previsto, come si fa già per la fatica.
6. **Restano come sono:** scarico (75 % del tetto, serie ×0,6), stanco/fresco, guida ±10 % per Claude, dolore, finestre
   partita, tetti per qualità. Nell'hub il rapporto resta come descrizione («stai facendo più del solito»), non come
   «rischio».

## 4. Cosa cambierebbe (numeri arrotondati)

| Caso | Oggi | Con la proposta |
|---|---|---|
| **Ste, 23/11**: infortunio, niente squadra, prima squadra + partita | tetto app 300 → **1 seduta** | media ~940, settimana più carica ~1430 → tetto ~1430; le 3 sedute del setup (~700) entrano |
| **Una seduta a settimana, senza squadra** (~230) | tetto ~345 → **1 seduta per sempre** | pavimento 2 sedute (~460); fatte bene → la settimana dopo 3; poi il setup |
| **Rientro dopo un mese fermo** | cronico 0 → **nessun tetto** | 2 sedute, poi +1 a settimana |
| **In season regolare** (app 2 sedute ~700, squadra 2 × 90' + partita ~1980) | tetto app ~2040 | tetto totale ~3480 → app ~1500: le 3 sedute (~1050) entrano, come oggi |
| **Da in season a off season** (prima ~2680 a settimana, ora senza squadra) | squadra a 0 anche nel passato → tetto app ~1050 | tetto ~3480 tutto all'app: il limite vero diventano setup, tempo e tetti per qualità |

L'ultima riga è la più larga: in off season l'app prende il posto della squadra. Se Ste la vuole più stretta, un
tetto in più per l'app da sola (per esempio +1 seduta a settimana anche lì) la tiene.

## 5. Decisioni per Ste

1. Il totale vero per settimana (punto 1): sì / no.
2. Tetto = +30 % sulla media di 4 settimane o la settimana più carica (punto 2), al posto di 1,5 × 3 settimane.
3. Pavimento «+1 seduta a settimana» con le condizioni (fatte, non dure, non stanco) (punto 3).
4. Dopo uno stop si riparte da 2 sedute (punto 4).
5. Minuti calibrati (punto 5).
6. Off season: tetto libero dentro il setup o +1 seduta a settimana anche lì.

Lavoro stimato: mezza giornata (calcolo, test sui cinque casi sopra, simulazione della stagione rifatta), tutto in
`lib/trainingLoad.ts` e nei due loader (`lib/trainingPlanner.ts`, `app/api/training/state/route.ts`).

## 6. Decisioni di Ste (23/11) e cosa è nel codice

Ste: «ok contare con squadra compresa ma vanno suddivisi i carichi secondo me: palestra, tecnica, squadra (che comprende
resistenza, sprint, parte bassa ecc. ma non parte alta). Ok salire ma dipende da quanti allenamenti vuole fare il ragazzo
a settimana. Dopo stop facciamo con facoltativa eventualmente.»

- **Tre parti** (`lib/trainingLoad.ts`, `parteDiQualita`, `quotePerParte`, `calcolaParti`): **parte alta** (forza parte
  alta e core, solo l'app), **gambe e corsa** (parte bassa, esplosiva, pliometria, velocità, resistenza, fascia: l'app più
  la squadra), **tecnica** (solo l'app). Una seduta si divide tra le parti con minuti × fatica attesa dei suoi blocchi;
  apertura, riscaldamento e mobilità vanno con la parte principale. `CaricoInfo.parti`.
- **La squadra di ogni settimana** (`squadraPerSettimana` in `lib/trainingResoconto.ts`, loader
  `loadSquadraPerSettimana` in `lib/trainingResocontoServer.ts`, usato da planner e state): risposta della settimana con i
  resoconti al posto della stima; senza risposta ma con i resoconti, solo i resoconti; senza niente l'abitudine (0 in
  off season). Questa settimana: la stima di prima.
- **Tetto per parte** = il più alto tra +30 % sulla media delle 4 settimane e la settimana più carica, × 0,75 nello
  scarico, × 0,9 da stanco, meno la squadra di questa settimana (solo gambe e corsa).
- **Si sale di una seduta a settimana fino a quelle che il ragazzo vuole fare** (pavimento in sedute): per ogni parte
  passano comunque tante sedute quante la settimana più piena delle ultime 3, più una, mai oltre le giornate del setup
  (o della maschera). Il +1 non c'è se la settimana scorsa il voto medio era 8 o più, se è stanco o nello scarico.
  Oltre il pavimento decide il tetto. Il validatore (`expandPiano`) lo controlla parte per parte; il piano base toglie
  l'ultima seduta di quella parte e lo dice (`giornataTolta`, `giorniSenzaSedutaPerCarico`).
- **Dopo uno stop** (nessuna seduta dell'app nelle 2 settimane complete prima, anche chi comincia): nessun taglio per il
  carico, le sedute oltre la seconda sono **facoltative** (`PlanSession.facoltativa`, `conFacoltativeDopoStop`, riga
  `NOTA_DOPO_STOP`), con il segno «Facoltativa» nell'hub e nella pagina della seduta; una facoltativa saltata non si
  recupera la settimana dopo.
- Nel prompt del planner e della chat la sezione «TETTO PER PARTE» (`partiTesto`); nella card Carico dell'hub le tre righe
  (`partiRighe`). `PLANNER_V2_PROMPT_VERSION = 'v2.54-carico-per-parte'`. Il vecchio tetto unico resta solo per i
  contesti senza parti.
- **Non fatto (non deciso):** minuti calibrati (punto 5), un limite in più per l'off season (punto 6).

Il caso di Ste con il codice nuovo: parte alta una seduta a settimana nelle ultime tre → questa settimana due sedute di
parte alta (gambe ferme per il dolore), con la riga «per parte alta si sale di una seduta a settimana… la prossima una
in più se le fai». Test: `tests/caricoParti.test.ts` e `tests/trainingRinunce.test.ts`.
