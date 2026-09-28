# Parte alta dalle scale skill — specifica (22 settembre 2026)

Decisa con Ste in chat il 22/9. Sostituisce la scelta tra i 17 blocchi Everfit di forza parte alta
con sedute **composte dal server sui gradini dell'atleta**, come già fa l'EMOM Skill
(`lib/trainingEmomSkill.ts`). I blocchi Everfit di parte alta restano per chi non ha ancora i test
delle scale e come contorno (panca, dips zavorrati, lavoro in palestra).

Principio invariato: il server compone, il validatore tratta il blocco come fidato (`trustBlocks`),
Claude sceglie solo **quale formato in quale giorno**.

## I 4 formati

| Formato | Gradino | Dose | A cosa serve |
|---|---|---|---|
| **Serie** | ultimo completato | 3-4 serie × 60-70 % del max, min 5 reps, recupero 90"; **spinta e tirata pari** (28/9): gradino + verticale contro gradino + rematore, poi core e dorsali | volume e qualità |
| **Serie, versione breve** (28/9) | ultimo completato | 3 serie: gradino di spinta + verticale, gradino di tirata + rematore, core; recupero pieno solo sui gradini, 60" sugli accessori (~37') | le serie per chi ha 60': con l'apertura ci sta |
| **AMRAP** | uno sotto | 12-15', 40 % del max per giro (stessa regola della stazione AMRAP del test) | più volume possibile, vale da mini-test: si contano i giri |
| **EMOM** | uno sopra (skill) + esplosività | 2 reps (3 sui gradini bassi), sprint sempre 1; **~20 minuti** (28/9, Ste: "almeno 20": giri = 20 / stazioni, min 3) | intensità massima, zero fatica |
| **Tabata** | ultimo / uno sotto | 8 round 30-30 sull'ultimo gradino, 40-20 su quello sotto, 2-3 giri, 1-2' tra i giri | volume in circuito completo |

"Gradino completato" = gradino con risultato ≥ soglia nella scala (`ladderForArea`, oggi `amrap`).

### Serie
- Spinta: 2 esercizi, gradino + spinta verticale (28/9: la variante diamond/inclinata resta solo nel focus spinta) + core.
- Tirata: 2 esercizi (gradino + un rematore orizzontale: australiana, manubrio/kettlebell a un braccio) + dorsali (catena lombari). Spinta e tirata PARI (Ste, 28/9).
- Con 3 sedute di parte alta: una **focus push** (3-4 spinta, 1 tirata) e una **focus pull** (3-4 tirata, 1 spinta).
  Se `trainingSquilibri` segnala push vs pull, la seduta focus va sul lato debole.

### AMRAP
- Giro: spinta (gradino sotto, 40 % del max) + tirata (gradino sotto) + core (tenuta 70 % del max, cap 30").
- 12-15' (non 20' come il test). In settimana 3 del ciclo fa da mini-test prima del ritest.

### EMOM — "skill più esplosività"
Una stazione al minuto, ~20' (28/9: prima 2 giri = 10-12', troppo poca pratica; ora giri = 20 / stazioni, minimo 3, massimo 10). Mai 4 reps nel generatore (il 4 resta solo il tetto del validatore, `emomRepsMax`).

| Stazione | Reps | Quando |
|---|---|---|
| Spinta, gradino sopra | 2 (3 fino all'arciere) | sempre |
| Tirata, gradino sopra | 2 (3 sui gradini bassi) | con sbarra |
| ~~Core a reps~~ | — | **tolto il 28/9** (Ste: "gli esercizi dell'addome non si incastrano bene"): core e dorsali restano nelle sedute a serie |
| Salto in lungo da fermo | 2 | solo se la parte bassa è tra gli obiettivi |
| Salto in alto da fermo | 2 | idem |
| Sprint 10 m, o una variante | **1, sempre** | idem; la variante ruota ogni settimana |

- Reps 2 per la famiglia "quasi massimale" (one-arm negativo in su, archer pull-up in su, muscle-up), 3 sui gradini bassi.
- **Finestra partita (Ste, 22/9): salti e sprint ammessi a −2**, vietati a −1 e il giorno stesso (eccezione alle finestre
  di `forza-esplosiva`/`velocita` = 2 giorni). Spinta e tirata come oggi (−1).
- I 10 metri per lo sprint li hanno tutti: nessun controllo sull'attrezzatura.
- Carico: 8 contatti di salto per seduta (tetto B = 100): l'EMOM sta in qualsiasi settimana, scarico compreso.
- Variazioni sprint (lista di Ste in arrivo): salto in alto + sprint, partenza da sdraiato + sprint, giro su se stesso + sprint,
  partenza in ginocchio + sprint, burpee + sprint. Entrano nel catalogo come esercizi separati con tag `variante-sprint`.

### Tabata — circuito completo
5-6 stazioni, max 2 spinta e 1-2 tirata. 30-30 × 6 stazioni = giro da 6'; 2-3 giri con 1-2' tra i giri = 15-20'.
Il 40-20 solo sulle stazioni "gradino sotto", non su tutto il giro.

| Stazione | Gradino |
|---|---|
| Spinta 1 | ultimo completato |
| Spinta 2 (variante) | uno sotto |
| Tirata 1 | uno sotto |
| Tirata 2 (australiana o rematore) | facile |
| Core | gradino dell'atleta |
| Lombari o gambe leggere | gradino dell'atleta (con 5 stazioni salta questa) |

## Rotazione

Agganciata al ciclo di 4 settimane (`cicloInfo`):

| Settimana del ciclo | Formato della seduta "a rotazione" |
|---|---|
| 1 | Serie |
| 2 | Tabata |
| 3 | AMRAP (mini-test prima del ritest) |
| 4 (scarico) | solo EMOM, o serie leggera |

- 2-3 sedute di parte alta a settimana: **sempre 1 EMOM** + le altre a rotazione. **Ogni formato UNA volta a settimana** (28/9, Ste: "mi ha messo EMOM 2 volte"): il validatore rifiuta il doppione e indica i formati liberi; serie piene e brevi contano come lo stesso formato nella sostituzione.
- 3 sedute: EMOM + focus push + focus pull.
- Obiettivi: parte alta tra i primi → 2-3 sedute; assente → il formato entra al massimo una volta.

## Contorno (a tempo)
- 45': solo core.
- 60': + fascia e lombari.
- 75-90': + una variante in più (seconda spinta verticale o secondo rematore) o prevenzione.

## Soglie a scalare (confermate da Ste il 22/9, FATTO)
`sogliaGradino(area, gradino)` in `lib/trainingEngine.ts`: spinta 20 fino all'arciere (push-1..4), 10 dal one-arm negativo
(push-5..6), 5 dal one-arm (push-7..8); tirata 10 fino alla presa larga (pull-1..6), 5 dall'archer (pull-7..10); core e lombari 60".
`LadderPoint.soglia` e `next.soglia` portano la soglia del gradino; "Al tuo gradino" (`alGradino`) e la pagina test le usano.

## Catalogo: cosa manca
- **Spinta verticale a corpo libero** (AGGIUNTI 22/9, sottogruppo "spinta verticale"): `fpa-pike-push-up` (B) → `fpa-pike-push-up-piedi-rialzati` (A)
  → `fpa-eccentric-handstand-push-up` (PRO, c'era) → `fpa-handstand-push-up` (PRO, completo, Ste). In palestra restano overhead press manubri/bilanciere.
- **Tirate orizzontali senza sbarra** (AGGIUNTI 22/9, sottogruppo "tirata orizzontale"): `fpa-gorilla-row` (kettlebell, per lato — Ste lo preferisce al
  rematore a un braccio) e `fpa-rematore-sotto-al-tavolo` (corpo libero); con sbarra bassa `fpa-trazioni-australiane`, in palestra `fpa-rematore-con-bilanciere`.
- **Esplosività** (AGGIUNTI 22/9): `fesp-salto-in-lungo-da-fermo`, `fesp-salto-in-alto-da-fermo`, `vel-sprint-10-m` (senza video) e le
  5 variazioni sprint con video del canale, tag `variante-sprint`: `vel-giro-180-piegamento-e-sprint`, `vel-burpee-e-sprint`,
  `vel-piegamento-a-terra-e-sprint`, `vel-sprint-con-partenza-in-ginocchio-laterale` (per lato), `vel-sprint-con-partenza-in-ginocchio`.
- "Dorsali" = catena lombari (superman, arch hold, arch rocks).

## Motore: cosa cambia
1. **FATTO (22/9)** `lib/trainingParteAlta.ts`: blocchi virtuali `pa-serie`, `pa-serie-push`, `pa-serie-pull` (focus solo con la scala di
   tirata testata e la sbarra) e `pa-emom`, costruiti da `costruisciParteAlta(results, { livello, attrezzatura, hasSbarra, parteBassa, settimana })`
   a ogni piano (`aggiornaParteAlta(ctx)` in `loadContextV2` e di nuovo se la maschera cambia gli obiettivi). Sostituisce `emom-skill`
   (`lib/trainingEmomSkill.ts` eliminato). Serie: gradino = `l.amrap ?? l.points[0]` (sotto soglia: 60 % del max senza minimo), 4 serie A/PRO
   e 3 B sul gradino, 3 sugli accessori; variante = gradino sotto (da quello a terra) o diamond; spinta verticale per livello (palestra →
   overhead press); rematori per attrezzatura (gorilla row → australiane → bilanciere → sotto al tavolo); core e dorsali 3 × 70 % del max.
   EMOM: giri = clamp(10 / stazioni, 2, 5); sprint a rotazione sulla settimana; `Blocco.senzaScarico` → `expandBlocco` non riduce le serie nel deload.
   **28/9**: niente core né dorsali nell'EMOM; `sostituzioniParteAlta` in `trainingPlannerV2.ts` sostituisce ogni blocco Everfit della famiglia
   "Forza Parte Alta…" scelto da Claude con il `pa-*` del formato giusto (serie → EMOM → focus spinta → focus tirata; scarico: prima l'EMOM;
   formati già usati nella settimana saltati, preferito quello che sta nel tempo massimo; nella stessa giornata di un `pa-*` il blocco Everfit
   viene tolto), nota "sui tuoi gradini, al posto di …" nell'hub; Forza Mix e Full Body restano a Claude. `PLANNER_V2_PROMPT_VERSION = 'v2.19-parte-alta-server'`.
   **28/9, sera**: `pa-serie-short` (le serie piene durano 53-57' e con l'apertura non stanno in 60': Claude ripiegava su due EMOM); ogni `pa-*` una volta a settimana
   (errore in `expandPiano` con i formati liberi nel messaggio); nell'ordine di sostituzione serie e serie brevi sono un solo formato. `PLANNER_V2_PROMPT_VERSION = 'v2.20-parte-alta-una-volta'`.
   **28/9, Ste**: spinta e tirata pari in `pa-serie` (gradino + verticale / gradino + rematore: 46-51'), EMOM a ~20' (`EMOM_MINUTI_TARGET = 20`, giri 3-10), **giornata dedicata**: nella
   sostituzione il tempo si misura con la sola apertura, si prende il formato più pieno che ci sta e i blocchi facoltativi della giornata (fascia, tecnica, kettlebell) saltano se
   non c'è posto (regola 23: "meglio una seduta di parte alta intera che due EMOM"). `PLANNER_V2_PROMPT_VERSION = 'v2.21-parte-alta-giornata-dedicata'`.
2. **FATTO** prompt: regola 23 riscritta (`parteAltaRegola`), `PLANNER_V2_PROMPT_VERSION = 'v2.12-parte-alta'`; fallback: i `pa-*` prima
   dei blocchi Everfit per l'obiettivo parte alta; `expandPiano` marca gli item a serie dei `pa-*` con `adattamento: 'gradino'` (badge
   "Il tuo gradino", `alGradino` non li tocca, i log SALI/SCENDI sì).
3. **FATTO** validatore: item v2 di un blocco `pa-*` fidati come i blocchi di Ste (`fidato` in `validatePlan`); salti da fermo, sprint 10 m e
   variazioni sprint hanno `finestra_partita: 1` nel catalogo (ammessi a −2, vietati a −1).
4. **DA FARE — Player**: oggi gestisce solo `fisso` ed `emom`. Servono `tabata` (timer lavoro/riposo a stazioni, giri, vibrazione al cambio)
   e `amrap` (countdown + contatore giri, un log per esercizio con i giri fatti), sul modello di `TrainingEmomPlayer.tsx`; poi `pa-tabata`
   e `pa-amrap` nel generatore e la rotazione completa (settimana 2 tabata, 3 AMRAP) nella regola 23.
5. Log per serie: invariati (esercizio, serie, reps/secondi, RPE); per tabata e AMRAP un log per esercizio con i giri.

Parte bassa e tecnica dopo, sulla stessa impalcatura.
