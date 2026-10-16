# I programmi di Ste su Everfit, riletti uno per uno (16/10/2026)

Ste: "fai un giro completo anche su tutti gli allenamenti fatti con i ragazzi per vedere quello che avevo fatto.
riguarda i workout e i programmi. ricontrolla bene tutto".

Due metà. La prima: i **18 programmi** esportati il 1/9 (`docs/everfit-programs.json`, 2 personali di clienti
anonimizzati, demo escluse), giornata per giornata, confrontati con la libreria dei blocchi e con le regole del planner
(§1-4). La seconda (§5): i **calendari dei 26 ragazzi** (3109 assegnazioni dal febbraio 2024 al novembre 2026, lette il
16/10 con il token nuovo di Ste: `/api/client-management/client-list` + `/api/workout/v2/assignments/history` a finestre
di sei mesi; i file stanno in `docs/everfit-export/clienti/`, gitignored; qui solo iniziali e numeri).

## 1. Venti workout stavano solo dentro i programmi: ora sono blocchi

La libreria dei blocchi veniva dai 203 workout della libreria Everfit. Nei programmi Ste usa anche workout che nella
libreria non ci sono (modificati o creati dentro il programma). Dal 16/10 `scripts/build-blocks.py` legge anche i
workout dentro `docs/everfit-programs.json`: **162 blocchi (150 completi)**, prima 144 (135). I nuovi:

| Blocco | Famiglia | Livello | Note |
|---|---|---|---|
| `fascia-foundations-1c`, `-1e`, `-2b` | Fascia Foundation | — | la scala base era 1 → 1B → 1D → 2A → 2C con i buchi: ora 1 → 1B → 1C → 1D → 1E → 2A → 2B → 2C come nei programmi "Fascia Foundation Base/Intermedio" |
| `fascia-foundation-b3-forza-short` | Fascia Foundation Forza | B | la versione breve che Ste assegna al cliente A |
| `forza-prevenzione-b1` | Forza Prevenzione | B | prima la famiglia aveva solo A1 e A2: un B non la vedeva mai |
| `salite-resistenza-b1` | Salite Resistenza | B | idem, solo A1 |
| `forza-parte-alta-emom-b3` | Forza Parte Alta EMOM | B | il buco tra B2 e B4; **incompleto**: manca "Decline Push Up" nel catalogo |
| `forza-full-body-hiit-corpo-libero-b2` | Forza Full Body HIIT | B | il buco tra B1 e B3; **incompleto**: manca "Burpee" |
| `forza-parte-alta-push-corpo-libero` (= B1), `-b2` | Forza Parte Alta Push Corpo Libero | B | prima solo B3; il titolo senza codice è la settimana 1 del programma "forza corpo libero avanzato", forzato a B1 |
| `pliometria-rapidita-velocita-a2-short` | Pliometria Rapidità Velocità | A | |
| `tecnica-palleggi-a1-tecnica-di-base`, `-a4-` | Tecnica Palleggi - Tecnica di base | A | la scala era B1 B2 B3 A2 A3: ora anche A1 e A4 |
| `tecnica-freestyle`, `tecnica-freestyle-short` | Tecnica Freestyle | — | il "quinto giorno" del programma tecnica |
| `riscaldamento-sprint-velocita-2b` | Riscaldamento Sprint Velocità | — | |
| `test-velocita-2` ("TEST VELOCITA'") | test | — | 100 m, 50 m, T-sprint: non entra nei piani (batteria) |
| `1vs1-difesa-attacco` | — | — | **incompleto**: "1vs1 - difesa da fermo" non è nel catalogo (esercizio in coppia) |

Lasciato fuori apposta: **"Pliometria Rapidità Velocità C1 - short"** (cliente A, settimane 2-3): il codice "C" non è
B/A/PRO. Dentro: tecnica di salto a 1 e 2 piedi, broad jump ×2, single leg lateral drop jump, ankle stiffness, 5 sprint
da 10 m. Ste: cos'è "C"? Un livello sopra PRO, una terza variante, o un refuso per "A"?

Due esercizi da aggiungere al catalogo per completare i blocchi: **Decline Push-Up** (a due braccia, mani sul rialzo:
abbiamo solo il One-Arm) e **Burpee** (abbiamo Reverse Burpee e Burpee to Sprint).

**Privacy.** Il nome di un cliente stava nei titoli di tre workout dentro `docs/everfit-workouts.{json,md}` e
`docs/everfit-programs.{json,md}` (copia personale di "Forza Parte Bassa Completa - Palestra") e in chiaro nella mappa
di anonimizzazione di `scripts/everfit-normalize.py` e in `scripts/build-blocks.py`. Tolto da tutti e quattro i file
e dai due script: la mappa titoli → etichetta anonima sta ora in `docs/everfit-export/anon.json` (cartella gitignored),
formato `{"programmi": {"<titolo Everfit>": "Programma personale — cliente A"}, "clienti": ["<Nome Cognome>"]}`. Nella
storia git i nomi restano (repo privato): se Ste vuole, si riscrive la storia, ma va deciso insieme.

## 2. Come programma Ste, programma per programma

Legenda: G = giorno della settimana nel programma, i blocchi sono gli id della libreria.

**Programma Tecnica Base 12 settimane** (beginner, 3 giornate: G1 muro/passaggi, G3 palleggi, G5 "mazzo": tiri,
visione, freestyle, dribbling). Scale: palleggi B1 → B2 → B3 → A1 → A2 → A3 → (A1 di nuovo) → A4; muro: tecnica di
base → passaggi e controllo A1 → A1 → A2 → A3 due tocchi, poi si torna indietro (S9 passaggi e controllo A1, S10 base).
Dalla settimana 8 entra "Fascia e tecnica funzionale A2" nel giorno del muro. È esattamente la **regola 28** (scala muro,
scala palleggi, mazzo del quinto giorno, ritorno a fine scala) e conferma `SCALA_PALLEGGI` e `SCALA_MURO`; ora che A1 e
A4 dei palleggi "Tecnica di base" sono blocchi, la scala in `lib/trainingTecnica.ts` va allungata (vedi §4).

**Forza e Velocità 12 settimane** (all_level, 2 giornate: G2 e G4). G2 alterna Forza Esplosiva A1 e Fascia Forza A3 +
Pliometria RV A1; G4 alterna velocità (B1 → A1 → B2 → B2 → A1 → B1 short) e pliometria (RV A1/B2/A2). Rolling in testa
a OGNI giornata (anche con il riscaldamento velocità davanti: "rolling + riscaldamento + velocità"). Test in S1, S5 e
S12 (test velocità nel G4). **Niente settimana di scarico**: S4 e S8 sono uguali alle altre. Pliometria RV **A1 dalla
settimana 2** in un programma "all_level".

**Fascia Foundation Base / Intermedio** (8 settimane, 3-4 giornate: G1 e G3 lo stesso codice, G5 la versione tecnica).
Base: 1 → 1B → 1C → 1D → 2A → 2B → 2B → 2C, cioè **un codice a settimana** (2B due settimane). Intermedio: 1D/A3 →
1E/A3 → A3 forza/A4 → 1D 1D → 2A 2A → 2B 2B → 2B 2B → 2C 2C, con il rolling in testa nelle prime 3 settimane. La tecnica
fascia: A1 → A1-B → A1-B → A1-C → A2 → A2 → A2-B → A2-B.

**Preparazione Estiva Completa Base** (8 settimane, 4 giornate: G1, G3, G5, G6). Ogni giornata è una PILA di 3-5
workout: fascia (Foundations 1 o rolling + Foundation 2) + un blocco di resistenza (fartlek A1 → A2 → A3 → A4, ripetute,
salite, metabolico) + tecnica (1-2 workout) + forza parte alta B1 o fascia forza B3; G6 = yoga recupero + fascia
tecnica. Resistenza 2 volte a settimana nelle prime 4 settimane, poi dalla 5ª velocità, resistenza alla velocità,
pliometria B2/B1, rapidità e tiro: **prima la base aerobica, poi la velocità**. Test in S1 (resistenza, forza parte
bassa) e S8 (velocità, resistenza). Le giornate sommano 110-160 minuti.

**Preparazione Estiva Completa PRO con palestra / Off-Season PRO S1 / Off Season TOP S1** (5, 2, 1 settimane, 6
giornate: G1-G5 + G6 yoga). Stessa logica con "Forza Parte Bassa Completa - Palestra" il G1/G2, Forza Prevenzione A1 il
G4 con Forza Parte Alta PRO1, fartlek A1 → A4 nelle prime 3 settimane poi salite/metabolico e pliometria RV A1 → A2,
tecnica tutti i giorni, 1vs1 dalla 4ª settimana. 4-5 giornate fisiche a settimana, 130-170 minuti al giorno.

**Programma personale, cliente A (4 settimane di forza)**: S1 test (parte alta, velocità) + plio RV short; S2-S4 lo
STESSO schema: G1 parte alta B2 + plio B1 short (S4 con salite sprint davanti), G2 parte bassa B1 + rapidità B1 short
o addominali, G4 fascia forza B3 short + plio RV C1 short. **Gli stessi codici per tutte le 3 settimane** del blocco,
niente progressione settimanale. (Cliente B: programma vuoto nell'export.)

**In Season** (template da 1 settimana, 4 giornate G1 G3 G5 G7): G1 plio RV A2 + rolling + fascia tecnica A1 +
dribbling; G3 Foundation 2 + palleggi A1 + fascia tecnica + tiri e visione; G5 rolling + visione A1 + fascia forza A3 +
freestyle short; G7 fascia A3 + palleggi A2 + dribbling + plio RV A2 + freestyle. **Pliometria RV A2 due volte** nella
stessa settimana (G1 e G7), zero velocità e zero resistenza in season, fascia in 4 giornate su 4.

**forza corpo libero avanzato w1 / w2 / w3** (5 giornate): lun-mer-ven Full body HIIT B1 (poi B2, poi B3), mar EMOM B2
(B3, B4), gio Push corpo libero B1 (B2, B3). **Tutte le famiglie salgono di un codice ogni settimana**, in blocco, con 3
sedute uguali a settimana. "Settimana 1 programma corpo libero" è la stessa w1 su 4 giorni.

## 3. Cosa ne esce per il planner

1. **Progressione per settimana o per blocco di 4?** Nei programmi di libreria Ste sale di un codice OGNI settimana
   (fascia base, corpo libero w1-w3, fartlek A1 → A4, palleggi B1 → B2 → B3); nel programma personale del cliente A tiene
   gli stessi codici per le 3 settimane del blocco. La memoria dei blocchi oggi sale solo su "facile" e la fascia dopo 2
   settimane sullo stesso codice. Domanda a Ste: la regola dell'app è giusta (sale se è stato facile) o i programmi dicono
   che di norma si sale ogni settimana e si resta solo se è stato duro?
2. **Scarico.** Nessun programma ha una settimana di scarico: la quarta settimana è come le altre e i test cadono alla
   5ª/8ª/12ª. L'app impone lo scarico ogni quarta settimana (serie ×0.6) e il ri-test la settimana dopo. Ste lo vuole
   davvero, o lo scarico nasce dal carico misurato (ACWR) e non dal calendario?
3. **Pliometria A nelle prime settimane.** "Forza e Velocità" (all_level) mette Pliometria RV A1 dalla 2ª settimana;
   l'app tiene la pliometria in B per 4 settimane a chiunque. Vale per tutti o solo per chi parte da zero?
4. **Pliometria due volte a settimana.** In season Ste mette RV A2 il G1 e il G7; l'app oggi non vieta due blocchi di
   pliometria ma la memoria e l'onda B/A ragionano su una seduta. Confermato che due vanno bene?
5. **Pile lunghe.** Le giornate dei programmi estivi sono 3-5 workout e 110-170 minuti: l'app ha il tetto a 120' in off
   season e Claude ragiona "apertura + UN principale". Per chi è in vacanza e si allena solo con l'app, va alzato o la
   pila va spezzata su due momenti della giornata?
6. **Mesociclo.** Nelle preparazioni la resistenza viene prima (4 settimane) e la velocità dopo: l'app non ha questa
   sequenza (lo strato mese conta solo le coperture). Da mettere nelle regole del "Resistenza" (punto 19 di
   `docs/campo-da-fare.md`), quando si farà.
7. **Yoga recupero il G6** in tutte le preparazioni: l'app lo ha come blocco `mobilita-recupero` ma il base non lo
   sceglie mai (le giornate leggere preferiscono la tecnica). Si potrebbe preferirlo nel giorno dopo la partita.
8. **Conferme.** Rolling in testa a ogni giornata ✓ (apertura); velocità una volta a settimana ✓; regola 28 della
   tecnica ✓ (con le scale da allungare); fascia tecnica il quinto giorno ✓; test ogni 4 settimane ✓ (ma senza scarico).

## 4. Da fare nel codice (piccolo, dopo le risposte)

- `lib/trainingTecnica.ts`: `SCALA_PALLEGGI` con `tecnica-palleggi-a1-tecnica-di-base` e `-a4-`; `MAZZO` con
  `tecnica-freestyle` / `-short` (oggi usa `tecnica-freestyle-a1`).
- `lib/trainingMemoriaBlocchi.ts`: la scala Fascia Foundation ha ora 1C, 1E e 2B: controllare `scalaFamiglia` e il
  "ritorno" (2A per la base).
- Catalogo: Decline Push-Up e Burpee (due schede).
- Decidere "C1".

## 5. I calendari dei ragazzi (seconda metà, 16/10 sera)

### Chi si è allenato davvero

| Atleta | Periodo | Settimane | Giornate/sett. | Assegnate | Fatte |
|---|---|---|---|---|---|
| S.N. (PRO, palestra) | mag 2024 → lug 2026 | 62 | 4,2 | 963 | 793 (82 %) |
| R.C. (attivo) | feb 2026 → nov 2026 | 40 | 5,0 | 199 | 177 (89 %) |
| G.P. (in stagione) | ott 2024 → nov 2025 | 40 | 2,2 | 219 | 159 (73 %) |
| J.G. | lug 2024 → mar 2025 | 18 | 1,9 | 110 | 86 (78 %) |
| G.T. (estate 2024) | giu → lug 2024 | 6 | 4,3 | 86 | 76 (88 %) |
| A.D. (portiere) | ott 2025 → ago 2026 | 37 | 4,8 | 328 | 101 (31 %) |
| D.M., E.C. (agosto 2026) | ago → set 2026 | 3-4 | 3-5 | 44-55 | 56-68 % |
| 8 ragazzi dell'estate 2025 e 2026 | giu → ago | 8 | 4,0 | 121 ciascuno | 0-17 % |
| altri 8 (2024, prove brevi) | | 1-8 | 1-3 | 2-42 | 0-50 % |

Il programma estivo assegnato in blocco a otto ragazzi (121 assegnazioni in 8 settimane, 4 giornate da 3-5 workout)
non l'ha fatto quasi nessuno: 0 % in sei casi, 9 % e 17 % negli altri due. Chi aveva un piano su misura ha fatto il
73-89 %. È il dato più forte di tutto il giro: la settimana "piena" da programma non regge, quella costruita sul ragazzo
sì. L'app fa esattamente la seconda.

### Come programma Ste in stagione (i tre atleti veri)

**S.N., in stagione 2024-25 e 2025-26, 29 settimane uguali** (è lui "Forza Parte Bassa Completa - Palestra in
season"): lunedì Forza Prevenzione A1 *in season* (+ a volte la parte alta), martedì Forza parte alta PRO A3 *in
season*, mercoledì o giovedì Forza Parte Bassa Completa Palestra *in season*, venerdì o sabato **"rapidità, velocità e
Tiro - pre partita"** (20 minuti, il giorno prima della partita). Quattro giornate, la stessa settimana per sette mesi,
con le versioni "in season" dei blocchi: più corte dell'originale. In estate la preparazione completa (fartlek A1 → A4
lunedì/mercoledì, salite, metabolico, pliometria RV A1 → A2, tecnica tutti i giorni, 1vs1, yoga la domenica).

**G.P., in stagione 2024-25, due giornate (lunedì e giovedì) per 40 settimane**: lunedì fascia + Forza parte alta B1 +
Forza Prevenzione A1/A2 + tecnica; giovedì resistenza (fartlek A1/A2, metabolico A1/A2, resistenza alla velocità) o
pliometria RV, con fascia forza. Forza parte alta **B1 per 16 settimane** (ottobre → febbraio), poi B1 short, B2
(marzo → maggio), B3 (giugno); prevenzione A1 → A2 → **B1** (giù, a marzo); pliometria RV A1/A2 in autunno, poi B1/B2
da gennaio (giù); velocità da febbraio (B1 short, C1 short, A1, B1 short 2); test velocità e parte alta a marzo e
aprile; una settimana di solo yoga + rolling a fine gennaio (l'unico "scarico" visto nei calendari). Da maggio tre
giornate: parte alta B2/B3, parte bassa B1/B2, addominali, salite, rapidità.

**R.C., attivo, 5 giornate ogni settimana da febbraio**: il programma "forza corpo libero avanzato" (lun-mer-ven Full
body HIIT, mar EMOM, gio Push corpo libero) con i codici che salgono a blocchi: **B1 per 4 settimane, B2 per 7, B3
per 20**, poi da settembre le versioni "B3 +" e EMOM B5. Fatto il 89 %: il ragazzo che segue tutto.

**A.D., portiere**: lo stesso template di 5 giornate (Forza Parte Bassa P1 + plio B1 short + Riscaldamento Pliometria
P1, Push P1, addominali + plio, Pull P1, Mix P1) per sei mesi senza cambiare un codice, fatto a tratti (31 %); a maggio
passato al corpo libero B1, a giugno B3.

### Quattro cose nuove per la libreria (già dentro)

`scripts/everfit-normalize-assegnazioni.py` tira fuori dai calendari i workout che non stanno né in libreria né nei
programmi (una assegnazione per titolo, 34 workout, nomi dei clienti tolti) in `docs/everfit-workouts-assegnati.json`;
`build-blocks.py` li legge come terza sorgente: **193 blocchi (180 completi)**. Tra questi: le versioni **"in
season"** di Forza Prevenzione A1, Forza parte alta PRO A3 e Forza Parte Bassa Completa Palestra; il blocco **pre
partita** (`rapidita-velocita-e-tiro-pre-partita`, 20'); Forza Parte Bassa B3/B4 e P1, Forza parte alta B4 e Push B1,
EMOM B5, Fartlek B1 e A1b, Salite Sprint B1, Riscaldamento Pliometria P1, Pliometria Velocità A1 PRO, Velocità e forza
esplosiva A1 PRO, VELOCITA' B1 (con i test da 50 e 100 m usati come sprint: alias), le versioni **"+"** (B3 +, Pliometria
B1 +, Velocità B1 short +: stesso codice, più dure, id con `-plus`, sottovariante "+"), Tecnica A3 muro short e con
dribbling, Tecnica Palleggi A3 short, Tecnica Freestyle A1 short, Tiri e Visione, Forza max parte bassa PRO1B. Fuori:
"Velocità C1 - short" (stesso "C" da chiarire), le demo di Everfit, "Squat, Press, …" (template di Everfit).
Incompleto: Forza Parte alta B4 ("Plank Climb" non in catalogo).

### Cosa dicono i calendari al planner (si aggiunge al §3)

9. **La progressione va a blocchi di settimane, non a settimana.** R.C.: B1 ×4, B2 ×7, B3 ×20. G.P.: parte alta B1
   ×16. A.D.: niente per 6 mesi. Nei programmi di libreria Ste sale ogni settimana, sui ragazzi veri ogni mese o più.
   La memoria dei blocchi (sale solo su "facile") è più vicina ai calendari che ai programmi.
10. **Il giorno prima della partita c'è un blocco apposta**: "rapidità, velocità e Tiro - pre partita", 20', per 29
    settimane. Oggi il validatore vieta la velocità a 2 giorni dalla partita: il blocco pre partita va ammesso il
    giorno prima (finestra 0 per quel blocco) e proposto come giornata leggera del −1.
11. **"In season" = versione corta dello stesso blocco**, non un blocco diverso: Prevenzione A1, PRO A3, Parte Bassa
    Palestra. Come lo short: da trattare come variante nella memoria (stesso codice).
12. **Resistenza anche a 2-3 giorni dalla partita**, in stagione: G.P. faceva fartlek/metabolico il giovedì (partita
    la domenica: 3 giorni; se il sabato: 2). Con la finestra a 3 il giovedì resta vietato. Ste: in stagione la
    resistenza il giovedì va bene?
13. **Scarico**: una sola settimana di solo yoga + rolling in 40 settimane di G.P., nessuna negli altri. Conferma la
    domanda 2.
14. **Il portiere** ha i suoi blocchi P1 per tutto (parte bassa, push, pull, mix, riscaldamento pliometria): l'app li
    ha come "preferiti per il portiere"; A.D. non ha mai avuto altro. Va bene così o anche al portiere si cambia?

