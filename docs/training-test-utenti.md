# FYF Training — test di programmazione su utenti reali

Confronto tra ciò che l'app programmerebbe e il programma fatto a mano da Ste su Everfit
per lo stesso atleta. Scopo: capire cosa manca al planner v2 (punto 3) per riprodurre
la metodologia. I dati del cliente (programma completo, risultati) restano fuori dal repo:
qui c'è solo la struttura, anonimizzata. Simulazione: `scripts/`-free, fatta con
`npx tsx` sul motore (`lib/trainingEngine.ts`, `lib/trainingRulesV2.ts`) il 4 set 2026.

---

## Utente E. (settembre 2026)

**Profilo.** 26 anni, ha giocato fino ai 20, oggi solo tornei amatoriali di calcetto. Nessun
infortunio importante. Palestra da circa un anno a fasi alterne (push/pull/full), gambe solo
ai macchinari, **zero esperienza con squat, stacco, clean**. Nessuna squadra (off season
permanente, nessuna partita in calendario). Obiettivi: tornare in condizione, resistenza e
forza "in linea col calcio", forza, esplosività, velocità, coordinazione, prevenzione.
**Niente tecnica** (non ha un campo), ma può correre fuori. 3 sedute a settimana + una
facoltativa.

**Test tracciati su Everfit (19/08):** max piegamenti 21, max trazioni 8. Gli altri test
(velocità 50/100 m, T sprint, broad jump, ankle stiffness, nordic, iso lunge, equilibrio,
1 km, 3 km) risultano fatti ma il valore non è nel tracking Everfit — la batteria
strutturata dell'app qui è un vantaggio.

### Cosa fa l'app oggi (planner v1)

| | |
|---|---|
| Fascia | B (da push 21 = intermedio, pull 8 = avanzato) |
| Gradini | spinta 2 (Piegamenti), tirata 5 (Pull-up) |
| Scala skill | prossimo: Piegamenti arciere · Pull-up assistito |
| AMRAP | 8 piegamenti · 3 pull-up (+ core/lombari quando testati) |
| Piano fallback | G1 mix 40' (fascia + push + core + lombari + palleggi) · G2 tecnica 30' |

Il planner LLM v1 darebbe al massimo 3 sedute fisiche (push/pull/core/lombari a corpo
libero + fascia + tecnica), **niente gambe, niente pliometria, niente sprint, niente corsa,
niente palestra**. Copre circa un quarto del programma di Ste (la fascia e la spinta a
corpo libero). Non è un bug: il v1 è pensato per il pubblico del percorso mentale (ragazzi
in stagione con la squadra); Utente E. è il caso d'uso del v2.

### Il programma reale di Ste (settimane dal 17/08)

Tre giorni (lun/mer/ven). **Ogni giorno è una pila di 3-5 workout con nome e codice di
progressione** (B1, B2, B3, A1, P1, "short"), non una lista di esercizi:

| Giorno | Blocchi impilati | Durata stimata |
|---|---|---|
| Lunedì | Fascia Foundations 1 · Pliometria B1 short · Forza Parte Bassa B2→B3 · Riscaldamento Sprint Velocità · Velocità B1 short | 90-100' |
| Mercoledì | Forza Parte alta Push P1 (corpo libero) · Pliometria B1 · Rapidità Velocità B1 short · (Tecnica palleggi B2, facoltativa) | 75-90' |
| Venerdì | Fascia Foundations 1 · Pliometria B1 short · Fartlek A1 (o Velocità B1 + Passaggi al muro) | 60' |

Il primo giorno è la batteria di test (velocità, parte alta con AMRAP, forza parte bassa,
resistenza), spalmata su lun/mer/ven della prima settimana.

**Cose notevoli.**
- Nonostante la palestra, **zero bilanciere**: corpo libero, isometrie, fascia, pliometria,
  sprint, fartlek. Unico carico: cuban press 4 kg. Coerente con "zero esperienza squat/stacco".
- Forza parte bassa = wall sit, iso lunge runner, tibialis, calf raises, copenhagen,
  glute bridge 1 gamba; alla B3 entra l'ATG split squat a corpo libero.
- Pliometria intensiva (drop jump, reverse drop, single-leg drop) già dalla prima settimana,
  a dosi minime (2×2, 2×10), con "short" e "full" come leva di volume.
- Velocità: riscaldamento dedicato (A-skip 6×10", saltelli, navette, allunghi) e poi sprint
  10/20/30 m, salto triplo + sprint, T sprint.
- Resistenza: un Fartlek a blocchi (4' 1/1 · 6' 40/40 · 5' 30/30 · 4' 15/15 · 4'), ~23'.
- Progressione settimanale: B2→B3 (un esercizio in più), Plio short→full (serie e reps in più).
- La tecnica c'è comunque (palleggi, passaggi al muro) come facoltativa: evidentemente ha
  trovato un muro.

### Il validatore v2 sul programma di Ste

Ho tradotto le 3 giornate in items v2 (livello B, attrezzatura palestra+campo+piccoli
attrezzi, esperienza sì, 26 anni, nessun massimale): **56 violazioni** (prima delle correzioni
del 4/9; dopo: **14**, tutte "dose ridotta" — vedi in fondo). Raggruppate:

1. **`livelloMin` A su esercizi che Ste dà a un B a dose ridotta** (10 esercizi): drop jump,
   reverse drop, single-leg drop e spinta, single-leg lateral drop, copenhagen plank,
   glute bridge 1 gamba, ATG split squat, single-leg RDL (fascia), salto triplo + sprint,
   cuban press, spinta frontale skip. È il gap più grosso: la regola "difficoltà 4 → livello A"
   della review blocca l'accesso, mentre Ste modula il **volume**, non l'accesso.
   → Proposta: `livelloMin` decide i bounds (dose B ridotta), non l'esclusione, salvo
   esercizi marcati esplicitamente "solo A/PRO".
2. **Bounds troppo stretti per i formati di attivazione**: A-skip 6×10" rec 20", saltelli
   3×10", navette 3×10", allunghi 4×10" (bounds: 2-4 serie, ≥20", rec ≥30"). Serve un formato
   "riscaldamento/attivazione" (3-8 serie, 5-20", rec 15-30"). Idem: tibialis/calf raises
   20-25 reps (bounds forza parte bassa 5-15 → per gli accessori a corpo libero fino a 30);
   pogo 1×60" (serieMin 2); T sprint 2 serie (serieMin 3); Fartlek 5 blocchi fino a 6'
   (aerobica 3-5 × 3-5').
3. **Esercizi esclusi in review ma usati da Ste**: Towel Curls e Toe Bounces SL (duplicati v1,
   in v2 off), Fascia adhesion tennis ball ("non allenante", ma è il suo riscaldamento di 4'),
   Piegamenti Hindu, piegamenti plyo. → riattivare i due piegamenti; per i duplicati il piano
   può usare gli id v1 (il validatore accetta piani misti).
4. **Mancano dal catalogo**: Bear Crawl (linear, lateral, isometric), Hip External Rotation Skip.
5. **Bug del validatore**: la mobilità in apertura (pallina da tennis) conta come "blocco
   metabolico" e fa scattare 18 volte "neuromuscolare dopo metabolico". `mobilita-recupero`
   va esclusa dal controllo d'ordine.

Cose che invece passano: 3 sedute fisiche (tetto 3), durate ≤ 90', nessuna finestra partita
(off season), gating carico (70% per esperienza sì + B + >18: mai usato, tutto a corpo libero).

### Dopo le correzioni del 4 set 2026

Livello come dose (non esclusione, salvo `soloLivello`), formato "attivazione" (3-8 × 5-20",
rec 15-30"), accessori corpo libero fino a 30 reps, pogo 1×60", T sprint 2 serie, Fartlek fino a
6 blocchi da 6', riattivati Hindu/plyo push-up/towel curls/toe bounces SL/pallina, aggiunti Bear
Crawl ×3 e Hip External Rotation Skip, mobilità fuori dal controllo d'ordine. Il programma di Ste
passa da 56 a **14 violazioni**, tutte del tipo "dose ridotta per un B": la mia euristica (serie
al minimo, quantità a metà range) è più prudente di Ste (reverse drop 2×10 vs max 7 reps, glute
bridge 3×30" vs 2 serie, cuban press 3×10 vs 2×9). La lista dei 68 esercizi A/PRO da rivedere è in
`docs/training-seed/livello-review-2026-09-04.xlsx`: per ognuno "solo questo livello" sì/no e
la dose ridotta che vuole lui.

### Cosa deve fare il planner v2 (punto 3) per riprodurlo

**Programmare a blocchi, come fa Ste.** Il modello attuale (LLM che sceglie esercizio per
esercizio da 226 voci + validatore per item) è il modo sbagliato di imitare un preparatore
che impila workout con nome e livello. Proposta:

1. **Libreria di blocchi** = i 203 workout Everfit già esportati, con tag: qualità
   (fascia, plio, forza bassa/alta, velocità, resistenza, tecnica), livello (B/A/PRO),
   progressione (1/2/3), variante (short/full), durata. I nomi già lo dicono ("Pliometria
   B1 - short", "Forza Parte Bassa B2", "Fartlek A1").
2. **Il planner compone giornate impilando blocchi** secondo obiettivo, giorni disponibili,
   fase, partite e budget di tempo; la settimana successiva sale di progressione (B1→B2) o
   di variante (short→full) in base ai feedback e ai log per serie.
3. **Il validatore lavora a livello di blocco** (finestre partita, convivenze, ordine, tetto
   sedute, durata) e a livello di item solo dentro i blocchi personalizzati.
4. **Few-shot reali**: le settimane dei clienti Everfit (con consenso) come esempi di
   composizione, non solo i workout singoli.

Con questo, per Utente E. il planner avrebbe prodotto quasi esattamente la settimana di Ste
(stessi blocchi, stesse pile); le differenze sarebbero solo nel messaggio e nella scelta
della facoltativa.

### Non verificato qui

Il planner LLM non è eseguibile in questo ambiente (nessuna chiave API): la parte "cosa
scriverebbe Claude" resta da provare in produzione con un utente di prova con
`training_access`, dopo il punto 3.
