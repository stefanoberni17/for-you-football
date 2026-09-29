# Parte bassa dalle scale a corpo libero — BOZZA da correggere (29 settembre 2026)

Ste, 29/9: "proviamo a costruire la scala corpo libero, partirei come esercizi di base da: squat,
affondi, rdl, bridge e farei tutte le progressioni". Stesso impianto della parte alta
(`docs/training-parte-alta.md`): quattro catene a gradini, un test base per catena, poi la scala si
misura gradino per gradino, e le sedute vengono composte dal server sui gradini dell'atleta.

Tutto quello che segue è una PROPOSTA: le righe marcate **[proposta]** sono mie, da confermare o
correggere riga per riga. Gli esercizi con l'id sono già nel catalogo v2 (`lib/trainingCatalogV2`);
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

### 3. RDL (catena posteriore, anca: hinge → ischiocrurali)

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | RDL a due gambe a corpo libero (hinge con le mani lungo le cosce, schiena neutra) | **NUOVO** | reps | 20 | B |
| 2 | RDL con appoggio (kickstand: punta del piede dietro appoggiata) | **NUOVO** | reps/lato | 12 | B |
| 3 | Single leg RDL | `fpb-single-leg-rdl` | reps/lato | 10 | B |
| 4 | Single leg RDL con asciugamano (FY Towel SLRDL) | `fasc-fy-towe-slrdl` (o `fascia-towel-slrdl` v1) | reps/lato | 10 | A |
| 5 | Single leg RDL ginocchio piegato | `fesp-single-leg-rdl-sing-leg-rdl-ginocchio-piegato-2` | reps/lato | 8 | A |
| 6 | Nordic (eccentrico controllato) | `fpb-nordic` | reps | 6 | A |
| 7 | Nordic hamstring completo (sale da solo) | `fpb-nordic-hamstring` | reps | 5 | PRO |

[proposta] I gradini 6-7 sono flessione del ginocchio, non hinge: li ho messi in coda alla catena
posteriore perché sono il passo dopo per gli ischiocrurali. Se preferisci una scala "hinge pura" e il
Nordic a parte (come prevenzione), lo spacchiamo. Il Nordic mai a −2 dalla partita (DOMS).

### 4. Bridge (glutei e ischiocrurali dal ponte)

| Gradino | Esercizio | Id catalogo | Unità | Soglia [proposta] | Livello |
|---|---|---|---|---|---|
| 1 | Glute bridge a due gambe | **NUOVO** | reps | 25 | B |
| 2 | Glute bridge a due gambe con pausa 3" in alto | **NUOVO** | reps | 15 | B |
| 3 | Ponte glutei a una gamba | `lomb-6` (v1) / `fpb-glute-bridge-ad-una-gamba` (a tempo) | reps/lato | 12 | B |
| 4 | Hip thrust a una gamba con le spalle sul rialzo | **NUOVO** | reps/lato | 10 | A |
| 5 | Elevated hamstring bridge single leg (tallone sul rialzo) | `fpb-elevated-hamstring-bridge-single-leg` | reps/lato | 10 | A |
| 6 | Eccentric elevated hamstring single leg | `fpb-eccentric-elevated-hamstring-single-leg` | reps/lato | 6 | PRO |

`lomb-6` oggi è il gradino 6 della catena "lombari" della parte alta: va spostato qui (o duplicato con
un id nuovo) così le due scale non si pestano.

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

## Formati delle sedute (composte dal server, come `pa-*`)

| Formato | Gradino | Dose [proposta] | A cosa serve |
|---|---|---|---|
| **Serie** `pb-serie` | ultimo completato di ogni catena | 4 catene × 3-4 serie × 60-70 % del max, recupero 90"; per lato | volume e qualità |
| **Serie, versione breve** `pb-serie-short` | ultimo completato | squat + RDL (o affondi + bridge, a rotazione), 3 serie | i giorni corti / in season |
| **EMOM** `pb-emom` | gradino SOPRA l'ultimo completato | 1 esercizio al minuto, 3 reps (2 sui gradini alti), ~20'; con i salti (lungo e alto da fermo) se la pliometria è tra gli obiettivi | skill: si impara il gradino dopo |
| **Isometrie / Fascia Forza** | blocchi di Ste `Fascia Foundation Forza` (B3/A3) | come oggi | forza vera "sul posto", una settimana sì e una no al posto dell'esplosiva |

Rotazione sul ciclo [proposta]: settimane 1-3 serie (piene o brevi) + EMOM se ci sono due giornate di
gambe; settimana 4 (scarico) solo EMOM e isometrie; con la palestra la seduta a serie usa i massimali
(squat, FY squat, bulgaro, RDL, hip thrust, affondi: gli esercizi già concordati) al posto dei gradini.

## Progressione

- **Dose** sull'esercizio: come oggi, SALI/SCENDI dai log (+1-2 reps fino a +30 %, "8 previste, 10 fatte"), poi
  il gradino dopo con dose ×0.7 (`gradinoSuccessivo`, già scritto per le catene v1: basta registrare le
  quattro catene nuove come aree del catalogo v1 o dare loro la stessa struttura).
- **Gradino**: si sale solo con il test della scala (come la spinta). L'EMOM lavora il gradino sopra e
  prepara il test; dopo due EMOM "facili" sullo stesso gradino l'app propone il test del gradino
  (la proposta automatica rimandata dalla review del 28/9 avrebbe qui il suo posto).
- **Per lato**: si lavora sempre entrambi; una serie in più sul lato debole (`lato_extra`, già nel codice)
  quando i test per lato dicono che c'è più del 10 % di differenza.
- **Ritorno**: dopo 8 settimane sulla scala si torna al gradino sotto con una serie in più per due
  settimane, poi si riprende (stessa regola di tecnica e fascia) — [proposta].

## Con pliometria e velocità nella stessa settimana [proposta]

- Gambe a serie e pliometria intensiva mai lo stesso giorno; gambe a serie il giorno dopo la
  pliometria solo in versione breve.
- Con velocità E gambe tra gli obiettivi: la giornata di velocità conta come metà giornata di gambe
  (gli sprint sono forza); le serie di gambe vanno nell'altra giornata fisica.
- L'EMOM di gambe può contenere i salti al posto dell'EMOM della parte alta (mai in entrambi nella stessa
  settimana: i contatti di salto si contano una volta).

## Finestre partita [proposta]

- Giorno prima: niente gambe a serie né EMOM (come oggi, `forza-parte-bassa` = 1). Isometrie brevi sì.
- Giorno dopo: niente gambe a serie; bridge e RDL a corpo libero in versione breve vanno bene come
  richiamo leggero (sono i muscoli che hanno giocato: attivazione, non carico); Nordic mai.
- Nordic e eccentrici (gradini 6-7 di RDL e bridge): almeno 3 giorni dalla partita.

## Cosa manca nel catalogo (da aggiungere quando la scala è confermata)

Squat con pausa 3", box pistol, pistol assistito, pistol su rialzo/zavorra, affondo inverso controllato,
shrimp squat, RDL a due gambe a corpo libero, RDL kickstand, glute bridge a due gambe, glute bridge con
pausa, hip thrust a una gamba spalle sul rialzo: 11 esercizi, tutti senza video (da registrare) —
`docs/training-video-da-registrare.md`.

## Nel codice (dopo la conferma)

1. Catene nel catalogo v1 (`lib/trainingCatalog.ts`): aree `squat`, `affondi`, `rdl`, `bridge` con gradini e
   soglie (`sogliaGradino`), quattro test base, `LADDER_AREE` estesa; `lomb-6` spostata.
2. `lib/trainingParteBassa.ts` sul modello di `trainingParteAlta.ts`: `pb-serie`, `pb-serie-short`, `pb-emom`
   composti dai gradini, fidati dal validatore, sostituzione dei blocchi Everfit "Forza Parte Bassa B1/B2"
   quando le scale sono testate (come `sostituzioniParteAlta`).
3. Livello `forza-parte-bassa` dalle scale in `lib/trainingLivelli.ts`; pagina test con i quattro blocchi nuovi.
