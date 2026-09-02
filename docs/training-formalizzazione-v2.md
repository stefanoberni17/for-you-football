# FYF Training — Formalizzazione v2: qualità fisiche complete

> **Stato:** bozza v2.0 — 2 settembre 2026. Estende la v1 (corpo libero + tecnica + fascia,
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

Serie per esercizio **[PROPOSTA]**: forza max 3-5 · esplosiva 3-5 · base 3-4. Esercizi di forza per seduta: 3-5.

**Progressione** = carico e ripetizioni: si alza il carico quando si chiude il range alto delle reps per 2 sedute
consecutive con esecuzione pulita **[PROPOSTA]** (+2.5-5% parte alta, +5% parte bassa).

### 2.2 Esercizi base palestra **[DATI]** — i più usati nei workout/programmi di Ste

| Area | Esercizio (nome Everfit) | Uso tipico nei dati |
|---|---|---|
| Gambe — squat | Barbell Squat · FY Squat · FY Split Squat · atg split squat · Body Weight Bulgarian Split Squat | 3×3 @80 kg · 5×20 kg · 6×100 kg · 5 reps |
| Gambe — cerniera | Barbell Deadlift · Barbell Stiff Leg RDL · single leg rdl · nordic hamstring | 5×100 kg · 7×30 kg · 6×20 kg · 2×3 rec 150" |
| Gambe — accessori | Calf raises · Tibialis raises · sissy squat · Glute bridge ad una gamba · Leg Press | 3×25 · 2×20 · 3×8 |
| Spinta | Barbell Bench Press · Weighted Dips · Piegamenti Hindu · One Arm Push Up Incline | 5×20 kg · 8×40 kg |
| Tirata | Pull-Up · Pull Up Around The World · Band Assisted Pull Up · Inverted Row | 5 · 3 rec 120" |
| Esplosivi con carico | Kettlebell swing · Jump Squat · Medicine Ball Lateral Throw · KB clean/snatch | 3×15 @20 kg · 3×12 · 8×5 kg |

**[PROPOSTA] Lista base v2** (5 pattern, 1-2 esercizi ciascuno): squat (bilanciere / goblet / split squat) ·
cerniera (stacco / RDL / nordic) · spinta (panca / dips zavorrati) · tirata (trazioni zavorrate / rematore) ·
esplosivo (KB swing / jump squat / lanci). Corpo libero v1 resta la regressione quando non c'è la palestra.

### 2.3 Carico di riferimento e gating **[STE: stima ok, ma meglio una sessione di test]**

- Il **massimale è stimato**, mai testato direttamente: serie sub-massimale a cedimento tecnico (5-8 reps)
  → 1RM stimato con Epley (`1RM = peso × (1 + reps/30)`) → le % del §2.1 si calcolano da lì.
- **Sessione di test forza** (batteria "palestra", una volta per ciclo): 1 esercizio per pattern (squat, stacco/RDL,
  panca, trazioni) a 5-8 reps; + campo: broad jump (Test Salto in lungo), T sprint / sprint 10-30 m,
  navetta 10 m × 30", test resistenza 1 km / 3 km, Rapidità Ankle Stiffness — tutti già presenti nei workout **[DATI]**.
- **Gating [PROPOSTA — da confermare]**: forza massima (80-90%) solo con **≥16 anni** e livello **A/PRO** e
  batteria palestra fatta; sotto: forza di base ed esplosiva a carichi ≤70%. Le regole safety v1 restano
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
| **Estensiva** | pogo jumps, saltelli, toe bounces, A-skip, skater | **60-100 contatti** (B) · 80-120 (A/PRO) | tutti | Pogo Jumps 2×120"/60" o 4×60"/60" · Toe Bounces SL 2×30"/30" · A-Skip 3-6×10"/20" |
| **Intensiva** | drop jumps, depth jumps, salti in lungo/triplo, single leg drop | **30-60 contatti** | **solo A/PRO** | Drop Jump 3×2-3 rec 60" · Broad jump 3-4×2 rec 60" · Single leg lateral drop jump 2×10 rec 60" · Salto triplo + sprint 4-6 rec 30-60" · Reverse drop jumps 3×12 → 5×20 rec 120" |

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

Metodo **session-RPE** (Foster): `carico seduta = durata (min) × RPE (1-10)`, in unità arbitrarie (AU).
- **Sedute FYF**: durata reale dal player; RPE dal feedback 3-tap (facile=3 · ok=5 · duro=8) o slider 1-10 opzionale.
- **Sedute squadra**: dal calendario settimanale (giorni allenamento/partita) + durata tipica dichiarata (es. 90')
  + RPE serale chiesto dall'app (1 tap, come il check-in). Partita = 90' × RPE 8-9 di default.
- **Settimana**: somma AU · **monotonia** = media/deviazione standard giornaliera (>2 = settimana troppo piatta/pesante)
  · **ACWR** = carico ultimi 7 gg / media ultime 4 settimane (zona 0.8-1.3; >1.5 = rischio) **[PROPOSTA]**.
- **Integrazione con i check-in già live**: fatica alta oggi → scarico seduta (già fatto); ACWR alto o monotonia >2
  per 2 settimane → il planner riduce il volume fisico e lo dice nel messaggio; periodo di scarso recupero (media 7 gg) → già fatto.
- Il planner riceve: AU settimana corrente vs target di fase (§6), AU squadra vs AU FYF, ACWR.

## 8. Cosa serve ancora (domande aperte)

1. **Gating età/livello per forza massima** (§2.3): confermi ≥16 anni + A/PRO + batteria palestra fatta?
2. **Sessione di test forza**: ok la batteria proposta (4 esercizi a 5-8 reps + broad jump, sprint, navetta, 1 km/3 km, ankle stiffness)? Quali soglie B/A/PRO per i test da campo?
3. **Serie per esercizio di forza** e regola di progressione del carico (§2.1): ok i default?
4. **Pliometria**: ok 60-100 / 30-60 contatti e intensiva solo A/PRO con estensiva consolidata?
5. **Carico totale**: ok session-RPE con RPE serale della squadra (1 tap in più al giorno)? Durata tipica allenamento squadra da chiedere nel profilo?
6. **Esercizi base**: la lista §2.2 va bene o togli/aggiungi qualcosa (hip thrust non compare nei tuoi workout)?

## 9. Piano di implementazione (dopo le risposte)

1. Catalogo v2: nuove `Area`/`qualita`, campi `attrezzatura`, `difficolta`, `livelloMinimo`, `carico`; import degli esercizi Everfit con video (lista candidati da rivedere).
2. Bounds per qualità nel validatore (§2) + finestre partita per qualità (§3) + regole di convivenza (§4).
3. Template seduta (§5) come struttura guida nel prompt del planner + esempi few-shot dai workout Everfit.
4. Batteria "palestra" + campo (§2.3): test, 1RM stimato, soglie.
5. Fase stagione nel profilo training + carico totale (§7): RPE serale, calendario squadra con durate, ACWR nel contesto planner.
6. Onboarding attrezzatura (palestra? coni? salite? sbarra?) per filtrare il catalogo.
