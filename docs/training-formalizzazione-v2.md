# FYF Training — Formalizzazione v2: qualità fisiche complete

> **Stato:** v2.2 — 2 settembre 2026. Tutte le domande chiuse (File_DB ricevuto: soglie complete, Brzycki, lista base; gating carico da Ste). Pronto per l'implementazione (§9). Estende la v1 (corpo libero + tecnica + fascia,
> `docs/training-recap-progressioni.md`) alle qualità fisiche complete: forza in palestra,
> forza esplosiva/pliometria, velocità, resistenza (aerobica, metabolico, RSA).
> Fonte: risposte di Ste in chat (2 set 2026) + analisi dei suoi 203 workout e 18 programmi
> Everfit (`docs/everfit-workouts.md`, `docs/everfit-programs.md`, `scripts/everfit-analyze.py`).
> Le righe marcate **[DATI]** vengono dai workout reali di Ste; **[STE]** dalle sue risposte;
> **[PROPOSTA]** sono default miei da confermare.

## 0. Cosa cambia rispetto alla v1

| | v1 (live) | v2 (questo documento) |
|---|---|---|
| Aree fisiche | push · pull · core · lombari · laterali · fascia | + forza palestra (gambe comprese) · forza esplosiva/pliometria · velocità · resistenza aerobica · metabolico · RSA |
| Attrezzatura | corpo libero + sbarra | + palestra (bilanciere, kettlebell, zavorre) + campo (coni, salite, palla) |
| Progressione forza | gradini corpo libero (test → scala skill) | + carico e ripetizioni (% del massimale stimato) |
| Parte bassa | esclusa (solo prevenzione fascia) | **riaperta** tramite le qualità fisiche, con gating per età/livello (§2.3) |
| Programma | settimana + ciclo 4 sett. | + fase della stagione (§6) + carico totale nostro+squadra (§7) |

L'architettura non cambia: **l'LLM propone, i dati dispongono**. Ogni regola qui sotto diventa
un bound del validatore; ciò che è fuori viene rifiutato prima del salvataggio.

## 1. Modello a tre livelli

1. **Esercizio** — metadati di catalogo: `qualita` (§2), `attrezzatura` (corpo libero / palestra / campo),
   `difficolta` 1-5, `livelloMinimo` (B/A/PRO), `perLato`, unità (reps / secondi / metri), parametri ammessi
   (range reps, % carico, tempo lavoro/recupero), video.
2. **Workout** — template per tipo di seduta (§5): apertura fascia, blocchi nell'ordine giusto
   (neuromuscolare prima del metabolico), durata, cosa non convive nella stessa seduta.
3. **Programma** — periodizzazione (§6): fase della stagione, ciclo 3+1, distanza dalla partita per qualità,
   sedute/settimana, carico totale (§7).

## 2. Qualità e regole per esercizio

### 2.1 Forza (palestra) **[STE]**

| Qualità | Reps | Carico | Recupero | Esecuzione |
|---|---|---|---|---|
| Forza massima | 2-4 | 80-90% | 2' tra gli esercizi | controllata |
| Forza esplosiva | 4-6 | 60-70% | 1'30-2' | **esplosiva** |
| Forza di base | 6-12 | — (carico che chiude la serie con 1-2 reps di margine) | 1'30 | controllata |

Serie per esercizio **[STE ✅]**: forza max 3-5 · esplosiva 3-5 · base 3-4. Esercizi di forza per seduta: 3-5.

**Progressione** = carico e ripetizioni: si alza il carico quando si chiude il range alto delle reps per 2 sedute
consecutive con esecuzione pulita **[STE ✅]** (+2.5-5% parte alta, +5% parte bassa).

### 2.2 Esercizi base palestra **[DATI]** — i più usati nei workout/programmi di Ste

| Area | Esercizio (nome Everfit) | Uso tipico nei dati |
|---|---|---|
| Gambe — squat | Barbell Squat · FY Squat · FY Split Squat · atg split squat · Body Weight Bulgarian Split Squat | 3×3 @80 kg · 5×20 kg · 6×100 kg · 5 reps |
| Gambe — cerniera | Barbell Deadlift · Barbell Stiff Leg RDL · single leg rdl · nordic hamstring | 5×100 kg · 7×30 kg · 6×20 kg · 2×3 rec 150" |
| Gambe — accessori | Calf raises · Tibialis raises · sissy squat · Glute bridge ad una gamba · Leg Press | 3×25 · 2×20 · 3×8 |
| Spinta | Barbell Bench Press · Weighted Dips · Piegamenti Hindu · One Arm Push Up Incline | 5×20 kg · 8×40 kg |
| Tirata | Pull-Up · Pull Up Around The World · Band Assisted Pull Up · Inverted Row | 5 · 3 rec 120" |
| Esplosivi con carico | Kettlebell swing · Jump Squat · Medicine Ball Lateral Throw · KB clean/snatch | 3×15 @20 kg · 3×12 · 8×5 kg |

**Lista base v2 [STE ✅ — foglio CALCOLO MASSIMALI]**: **squat · deadlift · hip thrust (spinta sugli avampiedi, non sul tallone) · bulgarian squat · panca piana · shoulder press · pull ups**. Accessori dai dati: nordic, RDL/single leg RDL, calf/tibialis raises, dips zavorrati; esplosivi: KB swing, jump squat, lanci. Il foglio DB ESERCIZI (82 voci: fascia con difficoltà 1-3, forza parte bassa/core, parte alta, core avanzato) è la seconda sorgente per il catalogo v2 insieme all'export Everfit. Corpo libero v1 resta la regressione senza palestra.

### 2.3 Carico di riferimento e gating **[STE: stima ok, ma meglio una sessione di test]**

- Il **massimale è stimato**, mai testato direttamente: serie sub-massimale a cedimento tecnico (5-8 reps)
  → 1RM stimato con **Brzycki** — la formula del foglio CALCOLO MASSIMALI del File_DB **[DATI ✅]**:
  `1RM = peso / (1.0278 − 0.0278 × reps)` → le % del §2.1 si calcolano da lì.
- **Sessione di test** = la batteria che Ste usa già su Everfit **[DATI — 4 workout "TEST"]**, più la stima 1RM:

  | Test Everfit | Protocollo (dai workout) | Qualità | Soglie B/A/PRO |
  |---|---|---|---|
  | TEST FORZA PARTE BASSA | Broad jump 4×1 rec 3' · Rapidità Ankle Stiffness 2×20" rec 2' · Nordic hamstring 2×4 rec 3' · Iso lunge runner 4' · Equilibrio 1 gamba 2' | forza esplosiva / stiffness / catena posteriore | ⚠️ da File_DB |
  | TEST PARTE ALTA | Max push-up · Max pull-up (+ riscaldamento 10 push / 5 pull / 40 crunch) | v1 (già live) | ✅ v1 |
  | TEST RESISTENZA | 3 km · 1 km (rec 4') | aerobica | ⚠️ da File_DB (tempi) |
  | TEST VELOCITÀ | 100 m ×3 rec 3' · 50 m ×3 rec 2' · T sprint ×3 rec 90" | velocità / rapidità | ⚠️ da File_DB (tempi) |
  | **Palestra** | i 7 esercizi del foglio CALCOLO MASSIMALI **[DATI ✅]**: squat, deadlift, hip thrust, bulgarian squat, panca piana, shoulder press, pull ups — serie sub-massimale (5-10 reps) → 1RM Brzycki | forza | livello dal rapporto 1RM/peso corporeo **[PROPOSTA]** |

  **Soglie complete dal File_DB (foglio TEST) [DATI ✅]** — file versionato in `docs/training-seed/File_DB_Allenamenti.xlsx`:

  | Categoria | Test | PRO | Avanzato | Intermedio | Base | Protocollo |
  |---|---|---|---|---|---|---|
  | Resistenza | 1 km | < 3'30" | < 3'50" | < 4'10" | > 4' | |
  | Resistenza | 3 km | < 11'45" | < 12'30" | < 13'45" | > 13'45" | |
  | Capacità anaerobica | Navetta 10 m × 30" | > 12 | > 10 | > 7 | < 6 | timer 30", più navette possibili |
  | Capacità anaerobica | 20" Ankle Jump Test | > 10 | 9 | > 7 | < 6 | |
  | Capacità anaerobica | 20" SL Ankle Jump (dx / sx) | > 9 | 8 | > 6 | < 5 | per lato |
  | Forza parte bassa | Wall sit iso | > 180" | > 120" | > 90" | < 80" | |
  | Forza parte bassa | SL Wall sit iso (dx / sx) | > 90" | > 60" | > 40" | < 40" | per lato |
  | Forza parte bassa | Affondo iso (dx / sx) | > 180" | > 120" | > 90" | < 80" | piede posteriore ad altezza petto/spalle, gamba dietro tesa |
  | Forza parte alta | Push-up | > 40 | > 30 | > 20 | < 15 | ✅ già live v1 |
  | Forza parte alta | Pull-up | > 12 | > 8 | > 4 | < 2 | ✅ già live v1 |
  | Forza parte alta | Plank frontale | > 120" | > 60" | > 40" | < 30" | ✅ già live v1 |
  | Velocità | 50 m | < 7" | < 8" | < 9" | > 10" | |
  | Velocità | T sprint (10 m) | < 10" | < 12" | < 14" | > 14" | |
  | Forza esplosiva | Broad jump | > 250 cm | > 200 cm | > 170 cm | < 160 cm | |
  | Forza esplosiva | SL Broad jump (dx / sx) | > 240 cm | > 190 cm | > 150 cm | < 140 cm | per lato |
  | Fascia | 120" Pogo jumps — dove senti la fatica | glutei/addome | flessori/coscia | quadricipiti/polpacci | caviglia/piede | 2 saltelli/sec sull'avampiede ✅ live v1 (scala 1-4) |
  | Fascia | 180" Toe curls (dx / sx) — dove senti la fatica | glutei/addome | flessori/coscia | quadricipiti/polpacci | caviglia/piede | 3' per piede, 70-80% del peso sulla gamba avanti — ⚠️ v1 live usa 1' |
  | Tecnica | Palleggi piede forte / debole / testa / piramide | > 150 / > 120 / > 100 / > 10 | > 100 / > 80 / > 50 / > 5 | > 50 / > 30 / > 25 / > 3 | < 50 / < 30 / < 25 / < 2 | ✅ già live v1 |
  | Tecnica | 10 tiri traversa da fuori area (forte / debole) | > 4 | 3 | 2 | 1-0 | max 3 tentativi |
  | Tecnica | 10 passaggi al palo da fuori area (forte / debole) | > 4 | 3 | 2 | 1-0 | max 3 tentativi |

  Nota: nel File_DB la colonna LIVELLO (punteggio 0-100) è **inserita a mano**, non calcolata; il FOGLIO RECAP fa la
  media per categoria (dettaglio: capac. anaerobica, resistenza, forza PB, forza PA, velocità, forza esplosiva, fascia,
  tecnica) e poi "generale" (resistenza, forza, velocità, tecnica, prevenzione) — ma le formule "generale" del foglio
  puntano a intervalli sbagliati (es. VELOCITÀ generale = media della forza PB). **[PROPOSTA]** mapping corretto:
  Resistenza = 1/3 km + anaerobica · Forza = PB + PA + esplosiva · Velocità = 50 m + T sprint + ankle jump ·
  Tecnica = tecnica · Prevenzione = fascia + wall sit/affondo iso. Punteggio per test: formula v0 dell'app (80 punti alla
  soglia PRO, lineare, cap 110) finché Ste non dà riferimenti diversi.
- **Gating carico [STE ✅]**:
  | Profilo | Carico massimo |
  |---|---|
  | Esperienza in palestra **e** > 18 anni **e** livello A/PRO | **80-90%** (forza massima ammessa) |
  | Zero esperienza in palestra **oppure** < 18 anni | **max 60%** |
  | Tutti gli altri | **max 70%** |

  "Esperienza in palestra" = dichiarata nell'onboarding attrezzatura (sì/no + da quanto). Le regole safety v1 restano
  (pain-hold, dolore ≥4/10, fatica alta → scarico).

### 2.4 Resistenza **[STE + DATI]**

| Tipo | Lavoro | Struttura | Recupero | Esempi reali **[DATI]** |
|---|---|---|---|---|
| **Aerobica** | blocchi ~4' (fartlek, circuito con palla, corsa continua) | lavoro effettivo **12-16' base**, **16-20' avanzato/PRO** | **3' tra le serie** | «Ripetute A1»: 4 × (3 × 4'/3') · «Esercizio resistenza e tecnica funzionale»: 4 × 4'/3' (A), 4 × 3'/3' (B) |
| **Metabolico** | intermittenti 50-100 m, navette, salite | **[DATI]** 4-9 serie da 15-20" · blocchi | 20-50" (rapporto 1:1 → 1:3) | «Metabolico A1»: Allungo 4×20"/40" + 9×20"/20" · «Fartlek A1»: 4×60"/60" + 4×40"/40" · «Salite Metabolico A1»: Salite Sprint 14-19×15"/50" + Salite allungo 5×200 m (70") rec 90" |
| **Resistenza alla velocità (RSA)** | 20-30" massimali | **base 6-8 serie · intermedio 8-10 · avanzato 10-12**, in **blocchi da 4** | **40-60" tra le ripetizioni, 2-3' tra i blocchi** | «Resistenza alla Velocità A1»: navetta 10 m 30" × 4 rec 60" · T sprint 4×2 rec 60" · 6×40"/80" |

### 2.5 Pliometria / forza esplosiva **[STE: sì ai contatti, ma cambia la tipologia]**

| Tipo | Esercizi | Volume per seduta **[PROPOSTA]** | Livello | Esempi reali **[DATI]** |
|---|---|---|---|---|
| **Estensiva** | pogo jumps, saltelli, toe bounces, A-skip, skater | **a tempo** (es. 2-4 × 60-120") — può superare i 100 contatti **[STE ✅]** | tutti | Pogo Jumps 2×120"/60" o 4×60"/60" · Toe Bounces SL 2×30"/30" · A-Skip 3-6×10"/20" |
| **Intensiva** | drop jumps, depth jumps, salti in lungo/triplo, single leg drop | **30-60 contatti** **[STE ✅]** | **solo A/PRO** | Drop Jump 3×2-3 rec 60" · Broad jump 3-4×2 rec 60" · Single leg lateral drop jump 2×10 rec 60" · Salto triplo + sprint 4-6 rec 30-60" · Reverse drop jumps 3×12 → 5×20 rec 120" |

Regola: si passa all'intensiva solo con l'estensiva consolidata e l'ankle stiffness test fatto **[PROPOSTA]**.

### 2.6 Velocità **[DATI]**

- **Sprint puri**: 9-11 × 3" (≈ 20 m) rec 50" · Sprint con palla da fermo 4-6 rec 40" · T sprint 4×2 rec 60"
- **Rapidità**: navette laterali 3×10"/20" · saltelli in mezzo affondo switch 3×10"/20" · BOX rapidità e tiro 3-4×2-4 rec 60-120"
- **Riscaldamento dedicato** («Riscaldamento Sprint Velocità»): A-skip, saltelli, navette laterali, 6-8' prima degli sprint
- Rapporto lavoro:recupero ≥ 1:10 per la velocità pura **[PROPOSTA]**; mai velocità a fatica (dopo resistenza/forza).

## 3. Distanza dalla partita **[STE]**

| Qualità | Ultimo giorno utile prima della partita |
|---|---|
| Forza massima | **−3 giorni** |
| Forza esplosiva · velocità | **−2 giorni** |
| Resistenza (aerobica, metabolico, RSA) | **−4 giorni** |
| Pliometria intensiva | **mai a −1**; se proprio a −1: reps ridotte al minimo (es. 2×2) |
| Tecnica · fascia · mobilità | sempre (v1) |
| Giorno dopo la partita | mobilità + tecnica leggera + fascia (v1) |

Il validatore v1 (giorno partita e −1 vietati alla fisica) si estende con una **finestra per qualità**.

## 4. Ordine dentro la seduta **[PROPOSTA — dai pattern dei workout di Ste]**

1. Apertura **fascia** 10-15' (towel curls 2×3', toes up/down 2×2', tennis ball 4', foam roll) — sempre (v1)
2. Riscaldamento specifico (sprint/pliometria: A-skip, saltelli, navette 6-8')
3. **Neuromuscolare**: velocità → pliometria → forza esplosiva → forza max
4. **Forza di base / corpo libero** (gradini v1)
5. **Metabolico / resistenza** in coda (mai prima della velocità)
6. Core / laterali (1-2 esercizi, v1) · tecnica prima o dopo la fisica alternando (v1)
7. Defaticamento / mobilità

Non convivono nella stessa seduta **[PROPOSTA]**: forza max + resistenza aerobica; RSA + pliometria intensiva;
due qualità "massimali" (fmax + sprint) oltre il livello A.

## 5. Template di seduta **[DATI — i workout ricorrenti di Ste]**

| Template | Struttura tipica | Durata | Esempi Everfit |
|---|---|---|---|
| Fascia (apertura/standalone) | rolling + adhesion + towel/toes + RDL fascia + iso runner | 20-30' | «Fascia Training - Rolling and fascia adhesion», «Fascia Foundations 1/2/A3» |
| Tecnica | fascia breve → palleggi/muro/box dribbling → tiri/visione | 30-45' | «Passaggi al Muro - Tecnica di base», «Tecnica Visione A1», «Dribbling A1» |
| Forza corpo libero | fascia → push/pull/core a gradini (EMOM o HIIT 40"/20") | 30-45' | «Forza full body HIIT corpo libero B1-B3», «Forza Parte Alta EMOM B2-B4» |
| Forza palestra | fascia → 3-5 esercizi base (§2.1) → core → nordic/calf | 45-60' | «Forza Parte Bassa B1», «TEST FORZA PARTE BASSA» |
| Esplosiva / pliometria | fascia → riscaldamento sprint → pogo/drop/broad → salto+sprint | 40-50' | «Forza Esplosiva A1», «Pliometria Rapidità Velocità A1/A2/B1», «Forza Funzionale e Pliometria PRO1» |
| Velocità | riscaldamento sprint → sprint 9-11×3" → sprint con palla → rapidità | 35-45' | «Velocità A1», «Velocità B1 - short», «rapidità e Tiro» |
| Metabolico | fascia → intermittenti 15-20"/20-50" a blocchi → salite | 35-45' | «Metabolico A1», «Salite Metabolico A1», «Fartlek A1/A2» |
| Aerobica | blocchi 4' con palla o corsa, rec 3', 12-20' effettivi | 35-45' | «Ripetute A1», «Resistenza e Tecnica funzionale A1/B1» |
| RSA | riscaldamento → 6-12 × 20-30" a blocchi da 4 | 30-40' | «Resistenza alla Velocità A1» |
| Recupero | yoga/mobilità guidata | 20-30' | «Yoga Recupero» |

## 6. Fasi della stagione **[STE]**

| Fase | Sedute fisiche/sett | Qualità dominanti | Note |
|---|---|---|---|
| **Off season** (senza squadra) | **5-6** | forza (palestra o corpo libero) · pliometria estensiva→intensiva · aerobica → metabolico · tecnica ogni giorno · fascia sempre | i programmi «Off-Season PRO S1» / «Off Season TOP S1» (6/sett) sono il riferimento |
| **Preparazione con squadra** | **solo tecnica + fascia + 1 forza se richiesta** | la squadra fa il carico fisico | «Preparazione Estiva Completa» vale solo per chi si prepara da solo |
| **In season** | **regole v1**: max 3 oltre la squadra, giorni partita/−1 vietati, finestre §3 | mantenimento forza (1×), esplosiva/velocità (1×), tecnica, fascia | dipende da livello e allenamenti squadra → §7 |

Ciclo 3+1 (deload alla 4ª, ri-test dalla 5ª) resta valido in tutte le fasi (già live).

## 7. Carico totale (nostro + squadra) **[STE: "dovremmo fare un metodo di calcolo"] — [PROPOSTA]**

Metodo **session-RPE** (Foster) **[STE ✅]**: `carico seduta = durata (min) × RPE (1-10)`, in unità arbitrarie (AU).
- **Sedute FYF**: durata reale dal player; RPE dal feedback 3-tap (facile=3 · ok=5 · duro=8) o slider 1-10 opzionale.
- **Sedute squadra**: dal calendario settimanale (giorni allenamento/partita) + durata tipica dichiarata (es. 90')
  + RPE serale chiesto dall'app (1 tap, come il check-in). Partita = 90' × RPE 8-9 di default.
- **Settimana**: somma AU · **monotonia** = media/deviazione standard giornaliera (>2 = settimana troppo piatta/pesante)
  · **ACWR** = carico ultimi 7 gg / media ultime 4 settimane (zona 0.8-1.3; >1.5 = rischio) **[PROPOSTA]**.
- **Integrazione con i check-in già live**: fatica alta oggi → scarico seduta (già fatto); ACWR alto o monotonia >2
  per 2 settimane → il planner riduce il volume fisico e lo dice nel messaggio; periodo di scarso recupero (media 7 gg) → già fatto.
- Il planner riceve: AU settimana corrente vs target di fase (§6), AU squadra vs AU FYF, ACWR.

## 8. Stato domande

Tutte le domande della v2.0 sono chiuse (gating carico, soglie test, serie/progressione, pliometria, carico totale, esercizi base).
Restano solo **conferme** con default già applicati:
1. Lista base palestra = i 7 del foglio massimali (+ accessori dai dati) — default: sì.
2. Punteggio per test = formula v0 (80 alla soglia PRO, cap 110) al posto dei LIVELLO manuali del File_DB — default: sì.
3. Mapping "generale" del rombo corretto come proposto sopra (le formule del foglio puntano a intervalli sbagliati) — default: sì.
4. Toe curls test: nel File_DB è 3' per piede, nell'app v1 era 1' — **deciso da Ste: 120"** (set 2026).

## 9. Piano di implementazione — stato

| # | Passo | Stato |
|---|---|---|
| 1 | Catalogo v2 (qualità, attrezzatura, difficoltà, livello minimo) + import Everfit/File_DB con review di Ste | ✅ `lib/trainingCatalogV2.ts` + generato (260 esercizi, 224 attivi) |
| 2 | Bounds per qualità, finestre partita, gating carico, convivenze, ordine in seduta nel validatore | ✅ `lib/trainingRulesV2.ts` + `validatePlan` (contesto `v2`) |
| 3 | Template seduta (§5) nel prompt del planner + esempi dai workout Everfit | ⏳ |
| 4 | Batteria palestra + campo (§2.3): test, 1RM Brzycki, soglie File_DB | ⏳ |
| 5 | Fase stagione + carico totale (§7): RPE serale, calendario squadra, ACWR | ⏳ |
| 6 | Onboarding "Il tuo setup": attrezzatura, esperienza palestra, compagno, fase | ⏳ (migration 017) |

Note di implementazione del punto 2: gli esercizi v2 sono accettati dal validatore solo se il contesto `v2`
(livello, attrezzatura, compagno, età, esperienza palestra, massimali) è presente — il planner v1 live non cambia.
Pliometria intensiva a −1: ammessa solo 2×2 dentro una seduta tecnica/fascia (le sedute fisiche a −1 restano vietate dalla regola v1).
Forza max/esplosiva: richiedono il massimale stimato dell'esercizio (batteria palestra); senza → solo regime base.

### Piano originale

1. Catalogo v2: nuove `Area`/`qualita`, campi `attrezzatura`, `difficolta`, `livelloMinimo`, `carico`; import degli esercizi Everfit con video (lista candidati da rivedere).
2. Bounds per qualità nel validatore (§2) + finestre partita per qualità (§3) + regole di convivenza (§4).
3. Template seduta (§5) come struttura guida nel prompt del planner + esempi few-shot dai workout Everfit.
4. Batteria "palestra" + campo (§2.3): test, 1RM stimato, soglie.
5. Fase stagione nel profilo training + carico totale (§7): RPE serale, calendario squadra con durate, ACWR nel contesto planner.
6. Onboarding attrezzatura (palestra? coni? salite? sbarra?) per filtrare il catalogo.
