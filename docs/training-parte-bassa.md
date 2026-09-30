# Parte bassa dalle scale a corpo libero — BOZZA da correggere (29 settembre 2026)

Ste, 29/9: "proviamo a costruire la scala corpo libero, partirei come esercizi di base da: squat,
affondi, rdl, bridge e farei tutte le progressioni". Stesso impianto della parte alta
(`docs/training-parte-alta.md`): quattro catene a gradini, un test base per catena, poi la scala si
misura gradino per gradino, e le sedute vengono composte dal server sui gradini dell'atleta.

Le righe marcate **[proposta]** sono mie. Ste, 29/9: catene, soglie per gradino, test base come massimo di
ripetizioni sul gradino 1, formati, rotazione, progressione, gestione con pliometria e velocità, finestre e
skip di chiusura: "ok come proposto" (le soglie restano da tarare sui primi test). Gli esercizi con l'id sono già nel catalogo v2 (`lib/trainingCatalogV2`);
quelli marcati **NUOVO** vanno aggiunti (nome, descrizione, video da registrare).

## Le quattro catene

Ogni catena va dal bipodalico al monopodalico e dal facile al difficile. Un gradino è "completato"
quando l'atleta supera la sua soglia nel test della scala (come per la spinta: soglie a scalare,
alte sui gradini bassi, basse in cima). Le quantità sono PER LATO dove l'esercizio è per lato.

### 1. Squat (ginocchio, bipodalico → pistol)

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | Squat a corpo libero, sotto il parallelo | `fpb-bodyweight-squat` | reps | 25 | B |
| 2 | Squat con pausa 3" in basso | **NUOVO** | reps | 15 | B |
| 3 | Squat su una gamba alla panca (box pistol, l'altra gamba avanti, seduta e riparte) | **NUOVO** | reps/lato | 10 | B |
| 4 | Pistol assistito (presa a un palo o alla porta, solo per l'equilibrio) | **NUOVO** | reps/lato | 8 | A |
| 5 | Pistol | `fpb-body-weight-pistol-squat` | reps/lato | 5 | A |
| 6 | Pistol su rialzo (tallone su un gradino, gamba libera più bassa) o con zavorra 8-12 kg | **NUOVO** | reps/lato | 5 | PRO |

Accessori al gradino (non nella scala, il server li sceglie come seconda variante): sissy squat slide
(`fpb-sissy-squat-slide`, A), ATG split squat (`fpb-atg-split-squat`), Patrick e Poliquin step up.

### 2. Affondi (split stance, anca e ginocchio)

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | Affondi sul posto | `fpb-affondi-sul-posto` | reps/lato | 15 | B |
| 2 | Affondi in camminata | `fpb-affondi-in-camminata` | reps/lato | 15 | B |
| 3 | Affondo inverso con ginocchio che sfiora terra, 2" di controllo | **NUOVO** | reps/lato | 12 | B |
| 4 | Bulgaro a corpo libero (piede dietro sul rialzo) | `fpb-body-weight-bulgarian-split-squat` | reps/lato | 12 | B |
| 5 | ATG split squat | `fpb-atg-split-squat` | reps/lato | 10 | A |
| 6 | ATG lunge | `fpb-atg-lunge` | reps/lato | 8 | A |
| 7 | Shrimp squat (gamba dietro tenuta con la mano) | **NUOVO** | reps/lato | 5 | PRO |

Test isometrico già in batteria: affondo isometrico dx/sx (`t2-affondo-iso-*`), resta per gli squilibri.

### 3. RDL (catena posteriore ALTA: anca, glutei e ischiocrurali vicino al gluteo)

Ste, 29/9: "nordic non è proprio con rdl perché lavora soprattutto la parte flessore vicino al ginocchio,
mentre rdl la parte più vicina al gluteo". Qui solo hinge.

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | RDL a due gambe a corpo libero (hinge con le mani lungo le cosce, schiena neutra) | **NUOVO** | reps | 20 | B |
| 2 | RDL con appoggio (kickstand: punta del piede dietro appoggiata) | **NUOVO** | reps/lato | 12 | B |
| 3 | Single leg RDL | `fpb-single-leg-rdl` | reps/lato | 10 | B |
| 4 | Single leg RDL con asciugamano (FY Towel SLRDL) | `fasc-fy-towe-slrdl` (o `fascia-towel-slrdl` v1) | reps/lato | 10 | A |
| 5 | Single leg RDL ginocchio piegato | `fesp-single-leg-rdl-sing-leg-rdl-ginocchio-piegato-2` | reps/lato | 8 | A |
| 6 | Single leg RDL in deficit (piede d'appoggio su un rialzo, la mano scende sotto il piede) | **NUOVO** | reps/lato | 8 | PRO |

### 4. Bridge (catena posteriore BASSA: glutei e ischiocrurali vicino al ginocchio, fino al Nordic)

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | Glute bridge a due gambe | **NUOVO** | reps | 25 | B |
| 2 | Glute bridge a due gambe con pausa 3" in alto | **NUOVO** | reps | 15 | B |
| 3 | Ponte glutei a una gamba | `lomb-6` (v1) / `fpb-glute-bridge-ad-una-gamba` (a tempo) | reps/lato | 12 | B |
| 4 | Hip thrust a una gamba con le spalle sul rialzo | **NUOVO** | reps/lato | 10 | A |
| 5 | Elevated hamstring bridge single leg (tallone sul rialzo: il ginocchio lavora) | `fpb-elevated-hamstring-bridge-single-leg` | reps/lato | 10 | A |
| 6 | Eccentric elevated hamstring single leg | `fpb-eccentric-elevated-hamstring-single-leg` | reps/lato | 6 | A |
| 7 | Nordic (eccentrico controllato) | `fpb-nordic` | reps | 6 | A |
| 8 | Nordic hamstring completo (sale da solo) | `fpb-nordic-hamstring` | reps | 5 | PRO |

`lomb-6` oggi è il gradino 6 della catena "lombari" della parte alta: va spostato qui (o duplicato con
un id nuovo) così le due scale non si pestano. Nordic ed eccentrici (gradini 6-8) mai a meno di 3 giorni
dalla partita.

### Le due catene posteriori sono INTRECCIATE (Ste: "le vedo intrecciate") [proposta]

Stessi muscoli presi dai due capi: non si fanno tutte e due a pieno nella stessa seduta.
- In `pb-serie` il posto della catena posteriore è UNO e alterna: settimana A → RDL, settimana B → bridge
  (con squat e affondi sempre). Così la seduta è di tre catene, non quattro, e sta nei 45-50'.
- Nell'EMOM della stessa settimana entra l'ALTRA catena posteriore al gradino sopra: chi fa RDL a serie fa
  bridge nell'EMOM, e viceversa. In una settimana si toccano entrambe, una a volume e una a skill.
- Nella versione breve la catena posteriore è quella della settimana (RDL o bridge), con squat.
- I gradini alti del bridge (6-8, eccentrici e Nordic) hanno un tetto a parte: al massimo una volta a
  settimana, mai a ridosso della partita, mai nella settimana di scarico.

### Chiusura: gli skip (Ste, 29/9: "aggiungiamo anche i B skip come esercizi finali a completamento")

Ogni seduta di gambe a corpo libero (serie, serie brevi, EMOM, isometrie) si chiude con gli skip: il
trasferimento dalla forza alla corsa, a bassa intensità, 5-6 minuti.

| Ordine | Esercizio | Id catalogo | Dose [proposta] | Quando |
|---|---|---|---|---|
| 1 | A-skip | `plioe-fascia-a-skip` (oggi "Fascia A-Skip", a tempo) | 2 × 20" o 2 × 20 m, recupero 45" | sempre |
| 2 | B-skip | **NUOVO** (`fpb-b-skip`) | 2-3 × 20" o 20 m, recupero 45" | sempre; dal gradino 3 delle posteriori in poi anche 3 serie |
| 3 | B-skip in avanzamento / con corsa finale 20 m | **NUOVO** | 2 × 20 m | solo dai gradini alti (RDL ≥ 4 o bridge ≥ 5), mai il giorno dopo la partita |

Regole: gli skip non contano come pliometria né come sprint (ritmo controllato, contatti leggeri); nel
giorno dopo la partita restano solo A-skip e B-skip sul posto; nella settimana di scarico restano (sono
tecnica di corsa, non carico); nel player chiudono la seduta senza voto per serie, come la fascia.

## Test

- **Test base per catena** (come `test-push` per la spinta): massimo di ripetizioni pulite sul gradino 1,
  senza tempo limite, con un ritmo fisso (2" giù, 1" su) — [proposta]. Quattro test: `test-squat`,
  `test-affondi`, `test-rdl`, `test-bridge`. Non tutti nello stesso giorno: la batteria è incrementale.
- **Scala**: dal test base si sale un gradino alla volta finché si supera la soglia (`ladderForArea`,
  stessa logica della spinta: `skill:<id>`), per lato dove serve (il valore della scala è il lato peggiore
  — [proposta], così gli squilibri restano visibili nei test per lato che già esistono).
- **Livello per qualità** (`forza-parte-bassa`): oggi da massimali + tenute + salti. Aggiungerei le
  scale: gradino ≥ 4 su almeno due catene = A, gradino 6-7 = PRO — [proposta].
- I test di palestra (massimali) restano per chi ha i pesi: la scala vale per tutti, i massimali si aggiungono.

## Formati delle sedute (composte dal server, come `pa-*`) — Ste, 29/9: "costruiamo anche questo, dobbiamo alternarle un po' tutte nelle settimane"

| Formato | Chi lo ha | Gradino / carico | Dose [proposta] | A cosa serve |
|---|---|---|---|---|
| **Serie** `pb-serie` | tutti | ultimo gradino completato di ogni catena | squat + affondi + UNA posteriore (RDL o bridge, alternate a settimane) × 3-4 serie × 60-70 % del max, recupero 90", per lato | volume e qualità sui gradini |
| **Serie brevi** `pb-serie-short` | tutti | ultimo completato | squat + la posteriore della settimana (RDL o bridge), 3 serie, ~30' | giornate corte, in season |
| **Forza massima** `pb-fmax` | palestra | massimale stimato | UN esercizio base a rotazione (squat, FY squat, RDL, hip thrust, bulgaro, affondi) 4-5 × 3-5 reps all'80-90 % del 1RM, recupero 2-3'; poi 2 catene dai gradini come accessori (2 × 8-10) | costruire la forza sui base, aumentando il peso (Ste: "solo per questo") |
| **Isometrie** `Fascia Foundation Forza` B3/A3 | tutti | blocchi di Ste | come oggi (overcoming al muro, bridge bounces, iso lunge runner, skip) | forza "sul posto", la settimana alternata alle serie |
| **EMOM** `pb-emom` | tutti | gradino SOPRA l'ultimo completato | 1 esercizio al minuto, 3 reps (2 sui gradini alti), ~20': squat, affondi e la posteriore NON fatta a serie quella settimana; salto in lungo e in alto da fermo se la pliometria è tra gli obiettivi | skill: si impara il gradino dopo, prepara il test |
| **Circuito** (tabata / AMRAP sui gradini) | tutti | ultimo completato / uno sotto | 30-30 su 4 catene, 2-3 giri | arriva col player a round, come per la parte alta |
| **Kettlebell** `kb-*` | kettlebell + obiettivo | fasce base/intermedio/avanzato | come oggi (`lib/trainingKettlebell.ts`) | sezione A PARTE (Ste): non entra nella rotazione delle gambe |

Il gating del carico resta quello di oggi: sotto i 18 anni o senza esperienza in palestra il massimo è il
60 % del massimale (`caricoMaxPct`), quindi `pb-fmax` esiste solo per chi può stare all'80 %+; per gli altri
la seduta in palestra è a serie sui base in regime "base" (3-4 × 6-12 al 60-70 %). Senza massimale stimato
niente kg oltre i 20 (già nel codice).

### Rotazione tra le settimane [proposta]

Nei programmi di Ste il giorno 2 alterna `Forza Esplosiva A1` e `Fascia Foundation A3 Forza` a settimane
alterne. Stessa idea sul ciclo di 4 settimane, per la giornata principale di gambe:

| Settimana del ciclo | Giornata principale | Seconda giornata (se c'è) |
|---|---|---|
| 1 | Serie (`pb-serie`; con la palestra: `pb-fmax`) | EMOM |
| 2 | Isometrie (Fascia Forza) | Serie brevi |
| 3 | Serie (o Fmax) | EMOM |
| 4 (scarico) | EMOM | Isometrie brevi |

Con la sola giornata di gambe a settimana (in season con la squadra 3+ volte) si fa la prima colonna.
Il kettlebell, quando è tra gli obiettivi, prende una giornata sua e la parte bassa con pesi va più leggera
(regola già nel codice). **Chi ha sia palestra che kettlebell: da decidere (Ste, 29/9: "poi vediamo")** —
intanto vale: Fmax nella settimana 1 e 3, kettlebell nella 2 e 4, mai le due nella stessa settimana.

## Progressione — Ste, 29/9: "vediamolo nel dettaglio" [proposta da correggere]

Tre binari, uno per attrezzatura; la scala a corpo libero è la spina dorsale per tutti, gli altri si aggiungono.

**A. Corpo libero (tutti).** Due livelli: la dose dentro il gradino e il gradino.
1. Dose: parte al 60-70 % del massimo del test. Dai log SALI = +1-2 reps per serie (già nel codice, tetto
   +30 % sul programma, "8 previste, 10 fatte → si riparte da 10"); SCENDI = un passo indietro. Sui gradini
   bassi (soglia 20-25) le reps possono salire fino a 25-30, sui gradini alti (soglia 5-8) al massimo +2.
2. Gradino: NON sale dai log. Sale solo col test della scala. L'EMOM lavora il gradino sopra a 2-3 reps;
   dopo **due EMOM "facili"** sullo stesso gradino l'app propone il test di quel gradino (in Campo → Test,
   "prova il gradino 4 di squat"); superata la soglia, il gradino diventa il nuovo gradino di lavoro con dose
   ×0.7 (`GRADINO_SCALA`), e la scala prosegue.
3. Fermo: se la dose è al tetto (+30 %) e i log dicono ancora SALI, ma il test del gradino sopra non è
   passato, si aggiunge una serie (max 5) invece di reps: prima si "riempie" il gradino.
4. Ritorno: ogni 8 settimane sulla scala, due settimane al gradino sotto con una serie in più (come tecnica
   e fascia), poi si riprende.

**B. Palestra (Fmax sui base).** Il gradino qui è il peso.
1. Il massimale stimato (Brzycki dalla batteria palestra) fissa il carico: 80-85 % nelle settimane 1-3 del
   primo ciclo, 85-90 % dal secondo ciclo se tutte le serie sono complete.
2. Passo: +2.5 kg (bilanciere) o +2.5 % quando tutte le serie sono complete con voto ≤ 8 per due sedute
   (`adattaDose` sui kg, già nel codice: +2.5 % min 1 kg); una serie incompleta o voto 9-10 → stesso peso;
   due sedute incomplete → −5 %.
3. Rotazione dell'esercizio base: squat → RDL → hip thrust → bulgaro/affondi, una per settimana Fmax, così
   ogni base torna ogni 4 settimane Fmax e il ri-test del massimale (ogni ciclo) misura il progresso.
4. Il resto della seduta (2 catene dai gradini) segue il binario A.

**C. Kettlebell.** Come oggi: fascia (base → intermedio → avanzato) dalle settimane facili, peso a passi di
4 kg dai log. Resta un obiettivo a sé.

**Livello `forza-parte-bassa`** (per i blocchi di Ste e le dosi): dalle scale (gradino ≥ 4 su due catene = A,
6-7 = PRO), dai massimali quando ci sono (soglie già in `trainingTestsV2`: squat 1.0/1.3/1.6 del peso
corporeo…), mediana bassa come oggi.

## Con pliometria e velocità nella stessa settimana — Ste, 29/9: "vanno gestiti insieme, vediamo come" [proposta]

Le tre qualità usano le stesse gambe: si contano insieme.

1. **Budget di giornate "gambe intensive"** a settimana = 2 in season, 3 in off season, 1 in preparazione
   con la squadra. Contano: gambe a serie o Fmax (1), pliometria intensiva (1), velocità (1), isometrie
   (0.5), EMOM gambe con i salti (0.5), serie brevi (0.5). Gli obiettivi in ordine decidono chi entra:
   con gambe + velocità in season → Fmax/serie + velocità, la pliometria entra solo dentro l'EMOM (salti).
2. **Ordine nella settimana**: velocità e pliometria PRIMA delle gambe pesanti (sistema nervoso fresco), con
   almeno 48 ore tra pliometria intensiva e Fmax; mai serie/Fmax e pliometria intensiva nello stesso giorno
   (già vietato per la resistenza, si aggiunge questa coppia in `CONVIVENZE_VIETATE`). Esempio in season con
   partita la domenica: martedì velocità, giovedì gambe a serie o Fmax, sabato niente.
3. **Salti una volta sola**: i salti da fermo stanno nell'EMOM di gambe O in quello di parte alta, mai in
   entrambi nella stessa settimana; i contatti si sommano al tetto di pliometria del livello (B 100).
4. **Sprint**: la giornata di velocità conta come mezza giornata di gambe per il carico ma NON sostituisce
   le serie: chi ha "gambe" come primo obiettivo ha sempre almeno una seduta a serie/Fmax/isometrie.
5. **Scarico**: gambe in EMOM (senza salti) + isometrie brevi, pliometria B short, velocità 6 sprint.

## Finestre partita — Ste, 29/9

- **Giorno prima**: come oggi, niente gambe (né serie, né Fmax, né EMOM, né pliometria, né sprint).
- **Giorno dopo** (Ste): **isometrie sì**; **palestra sì ma con poco volume e al massimo al 70-80 %** (regime
  base 2-3 × 6-8, mai Fmax); **corpo libero sì, con poche reps e bassa intensità** (gradini a metà dose,
  serie ×0.6: variante `pb-richiamo`); **niente salti, pliometria massimale, sprint**. Il server compone
  `pb-richiamo` da solo quando la giornata è a +1 dalla partita.
- Nordic ed eccentrici (gradini 6-7 di RDL e bridge): almeno 3 giorni dalla partita [proposta].
- Fmax: almeno 3 giorni dalla partita (`FINESTRA_FORZA_MAX`, già nel codice).

## Cosa manca nel catalogo (da aggiungere quando la scala è confermata)

Squat con pausa 3", box pistol, pistol assistito, pistol su rialzo/zavorra, affondo inverso controllato,
shrimp squat, RDL a due gambe a corpo libero, RDL kickstand, single leg RDL in deficit, glute bridge a due
gambe, glute bridge con pausa, hip thrust a una gamba spalle sul rialzo, B-skip, B-skip in avanzamento con corsa
finale: 14 esercizi, tutti senza video (da registrare) —
`docs/training-video-da-registrare.md`.

## Nel codice (dopo la conferma) — stato al 30/9: passo 1 fatto, 2 e 3 da fare

Passo 1 (30/9): aree `squat` / `affondi` / `rdl` / `bridge` (`AreaGambe`, `AREE_GAMBE`) con 27 esercizi v1
(`squat-1..6`, `aff-1..7`, `rdl-1..6`, `bridge-1..8`; `lomb-6` è diventato `bridge` gradino 3), test base
`test-squat` / `test-affondi` / `test-rdl` / `test-bridge` (soglie intermedio = soglia del gradino 1),
`SOGLIE_GAMBE` per gradino in `sogliaGradino`, `LADDER_AREE` a otto aree (stessa scala skill `skill:<id>`),
bounds per il validatore, i quattro test nella punta Gambe del rombo e nel blocco 1 della pagina test. Il
valore del test sugli esercizi per lato è il lato peggiore (lo dice l'istruzione del test). Test in
`tests/scalaGambe.test.ts`.

1. Catene nel catalogo v1 (`lib/trainingCatalog.ts`): aree `squat`, `affondi`, `rdl`, `bridge` con gradini e
   soglie (`sogliaGradino`), quattro test base, `LADDER_AREE` estesa; `lomb-6` spostata.
2. `lib/trainingParteBassa.ts` sul modello di `trainingParteAlta.ts`: `pb-serie`, `pb-serie-short`, `pb-emom`
   composti dai gradini, fidati dal validatore, sostituzione dei blocchi Everfit "Forza Parte Bassa B1/B2"
   quando le scale sono testate (come `sostituzioniParteAlta`).
3. Livello `forza-parte-bassa` dalle scale in `lib/trainingLivelli.ts`; pagina test con i quattro blocchi nuovi.
