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
| **Serie** | ultimo completato | 3-4 serie × 60-70 % del max, min 5 reps, recupero 90" | volume e qualità |
| **AMRAP** | uno sotto | 12-15', 40 % del max per giro (stessa regola della stazione AMRAP del test) | più volume possibile, vale da mini-test: si contano i giri |
| **EMOM** | uno sopra (skill) + esplosività | 2 reps (3 sui gradini bassi), sprint sempre 1 | intensità massima, zero fatica |
| **Tabata** | ultimo / uno sotto | 8 round 30-30 sull'ultimo gradino, 40-20 su quello sotto, 2-3 giri, 1-2' tra i giri | volume in circuito completo |

"Gradino completato" = gradino con risultato ≥ soglia nella scala (`ladderForArea`, oggi `amrap`).

### Serie
- Spinta: 2 esercizi (gradino + una variante: diamond, larga, inclinata) + 1 spinta verticale + core.
- Tirata: 2 esercizi (gradino + un rematore orizzontale: australiana, manubrio/kettlebell a un braccio) + dorsali (catena lombari).
- Con 3 sedute di parte alta: una **focus push** (3-4 spinta, 1 tirata) e una **focus pull** (3-4 tirata, 1 spinta).
  Se `trainingSquilibri` segnala push vs pull, la seduta focus va sul lato debole.

### AMRAP
- Giro: spinta (gradino sotto, 40 % del max) + tirata (gradino sotto) + core (tenuta 70 % del max, cap 30").
- 12-15' (non 20' come il test). In settimana 3 del ciclo fa da mini-test prima del ritest.

### EMOM — "skill più esplosività"
Una stazione al minuto, 2 giri = 10-12'. Mai 4 reps nel generatore (il 4 resta solo il tetto del validatore, `emomRepsMax`).

| Stazione | Reps | Quando |
|---|---|---|
| Spinta, gradino sopra | 2 (3 fino all'arciere) | sempre |
| Tirata, gradino sopra | 2 (3 sui gradini bassi) | con sbarra |
| Core **a reps** (hollow rocks, dragon flag negativa, arch rocks) | 2-3 | solo se il gradino dell'atleta è già a reps; le tenute NON entrano nell'EMOM, vanno nel contorno |
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

- 2-3 sedute di parte alta a settimana: **sempre 1 EMOM** + le altre a rotazione.
- 3 sedute: EMOM + focus push + focus pull.
- Obiettivi: parte alta tra i primi → 2-3 sedute; assente → il formato entra al massimo una volta.

## Contorno (a tempo)
- 45': solo core.
- 60': + fascia e lombari.
- 75-90': + una variante in più (seconda spinta verticale o secondo rematore) o prevenzione.

## Soglie a scalare (DA CONFERMARE con Ste)
Oggi un gradino conta se supera 20 push / 10 pull / 60" tenute (`LADDER_SOGLIE`). Sui gradini alti è troppo.
Proposta: spinta 20 fino all'arciere (push-1..4), 10 dal one-arm negativo (push-5..6), 5 dal one-arm (push-7..8);
tirata 10 fino alla presa larga (pull-1..6), 5 dall'archer (pull-7..10). Cambia anche "Al tuo gradino"
(`alGradino` in `lib/trainingProgressione.ts`), che usa la stessa soglia.

## Catalogo: cosa manca
- **Spinta verticale a corpo libero**: scala pike push-up → pike con piedi rialzati → handstand push-up eccentrico
  (oggi c'è solo overhead press con manubri/bilanciere e l'handstand eccentrico a PRO).
- **Tirate orizzontali senza sbarra**: rematore a un braccio con manubrio/kettlebell, rematore sotto al tavolo (lista di Ste).
- **Esplosività** (AGGIUNTI 22/9): `fesp-salto-in-lungo-da-fermo`, `fesp-salto-in-alto-da-fermo`, `vel-sprint-10-m` (senza video) e le
  5 variazioni sprint con video del canale, tag `variante-sprint`: `vel-giro-180-piegamento-e-sprint`, `vel-burpee-e-sprint`,
  `vel-piegamento-a-terra-e-sprint`, `vel-sprint-con-partenza-in-ginocchio-laterale` (per lato), `vel-sprint-con-partenza-in-ginocchio`.
- "Dorsali" = catena lombari (superman, arch hold, arch rocks).

## Motore: cosa cambia
1. `lib/trainingParteAlta.ts` (nuovo): blocchi virtuali `pa-serie`, `pa-serie-push`, `pa-serie-pull`, `pa-amrap`, `pa-tabata`,
   `pa-emom` costruiti a ogni piano da `results` + attrezzatura + obiettivi, come `costruisciEmomSkill`. Sostituisce
   `emom-skill` (che diventa `pa-emom`).
2. `loadContextV2` li aggiunge a `ctx.blocchi`; `bloccoDi` li risolve; prompt: regola nuova al posto della 23
   (formato per settimana del ciclo, 1 EMOM sempre, focus push/pull con 3 sedute). Bump `PLANNER_V2_PROMPT_VERSION`.
3. Validatore: gli item nati da questi blocchi sono fidati; eccezione finestra partita per salti/sprint a −2 dentro `pa-emom`.
4. **Player**: oggi gestisce solo `fisso` ed `emom`. Servono `tabata` (timer lavoro/riposo a stazioni, giri, vibrazione al cambio)
   e `amrap` (countdown + contatore giri, un log per esercizio con i giri fatti), sul modello di `TrainingEmomPlayer.tsx`.
5. Log per serie: invariati (esercizio, serie, reps/secondi, RPE); per tabata e AMRAP un log per esercizio con i giri.

Ordine di lavoro: catalogo (liste di Ste) → soglie → generatore → player tabata/AMRAP → prompt. Parte bassa e tecnica dopo,
sulla stessa impalcatura.
