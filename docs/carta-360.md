# La Carta del Giocatore a 360° — specifica (29 settembre 2026, con Ste)

Ste, 29/9: "vorrei capire se tutti i dati che raccogliamo nell'app vengono sfruttati bene… nella scheda del
giocatore aggiungiamo anche la parte mentale nel rombo… alla fine deve diventare una cosa a 360 gradi".

## Perché

L'audit del 29/9 ha trovato due buchi: il **check del giorno prima** (strumento usato in campo / nella
vita / non ricordo) veniva raccolto ogni giorno e non letto da nessuno; e il **Coach non sa niente del
Campo** (dolore, sedute saltate, carico) mentre il preparatore non sa niente della testa (lo stato mentale
del check-in non entra nel planner v2). La Carta è il posto dove i dati si incontrano; i collegamenti
Coach ↔ Campo la leggono.

## I tre piani

1. **Corpo**: il rombo del Campo com'è (test, livello B/A/PRO dai test). Vista a 6 o 11 punte.
2. **Recupero**: una punta a sé, la stessa in tutte le viste. Non è mente, è la base su cui poggiano
   tutte e due (Ste: "riposo e recupero non sono proprio per la parte mentale").
3. **Mente**: rombo a cinque punte, dalle abitudini e dal check-in. Livello mentale dal blocco del percorso:
   Blocco 1 (W1-4) = B "costruisce lo strumento", Blocco 2 (W5-8) = A "gioca nelle difficoltà",
   Blocco 3 (W9-12) = PRO "gioca libero".

**Etichetta obbligatoria nella pagina:** "Mente misura quanto ti alleni di testa, non quanto sei forte di
testa" (le punte del corpo vengono dai test, quelle della mente dalle abitudini: stessa scala 0-100, senso diverso).

## Rombo Mente — cinque punte

Finestre: **media 4 settimane** (il rombo) e **media ultimi 7 giorni** (tendenza accanto a ogni punta).
L'ombra grigia "partenza" = le prime 4 settimane dall'inizio del percorso, come nel rombo fisico.
Punteggio 0-100 ancorato ai livelli come nel fisico (`punteggioLivelli`: 40 alla soglia intermedio, 60 avanzato, 80 PRO).

| Punta | Cosa misura | Calcolo | Dati |
|---|---|---|---|
| **Presenza** | torna presente durante la giornata | metà: media della domanda del check-in "Quanto sei stato presente ieri durante la giornata?" (0-10). Metà: giorni con il Reset fatto sui giorni della finestra, con un bonus di continuità (giorni di fila con il Reset, come lo streak delle azioni) | `daily_checkin.presence_yesterday` (NUOVA, migration 029) + log dei Reset (NUOVO: oggi c'è solo `last_meditation_completed`, una data) |
| **Costanza** | fa le pratiche | giorni del percorso fatti sui giorni passati da quando ha iniziato, dentro la finestra | `user_day_progress.completed_at` |
| **Disciplina** | mantiene le sue 5 azioni | azioni spuntate sulle azioni segnate, nei giorni della finestra | `user_actions`, `user_action_completions` |
| **Lucidità** | com'è di testa | media dello stato mentale del check-in | `daily_checkin.mental_state` |
| **Crescita** | quanto è avanti (personale) | settimane chiuse con il Gate sulle 12, corrette col ritmo: 6 settimane in 6 vale più di 6 in 12 | `user_day_progress` (gate), `profiles.current_week`, data di inizio |

Tolto per scelta (Ste, 29/9): "quante volte entra nell'app" non è presenza, è uso: non conta da nessuna
parte. **Il check del giorno prima nella pagina giorno viene tolto del tutto**, sostituito dalla domanda
nel check-in del mattino (un tocco in più nella stessa schermata, niente slide in più nel giorno).

Soglie [proposta, da tarare sui dati]: presenza e costanza intermedio 50 %, avanzato 70 %, PRO 85 %;
disciplina 50/70/85 %; lucidità 5/6.5/8; crescita = settimane al ritmo: 3/6/10 su 12.

## Recupero — una punta

Prende: sonno (ore), stato fisico e recupero percepito dal check-in (media 4 settimane), i test della
fascia (equilibrio, dolori, fastidi dopo gli allenamenti), e per chi ha il Campo le zone con fastidio dal
rolling come penalità. Nel rombo fisico di oggi "Prevenzione" è solo la fascia: si fonde qui.

## Carta completa (chi ha sbloccato Campo e percorso)

Rombo unico a sette punte, ognuna una media di cose che già esistono:

| Punta | Da dove |
|---|---|
| Mente | media delle cinque punte del rombo Mente |
| Recupero | come sopra |
| Forza massima | massimali in palestra + gradini delle scale (spinta, tirata, e le quattro di gambe di `docs/training-parte-bassa.md`) |
| Forza esplosiva | salti, ankle stiffness, pliometria |
| Resistenza | chilometri e navetta |
| Velocità | 50 metri e T-sprint |
| Tecnica | palleggi, tiri, passaggi |

Tre viste nella Carta: **Mente** (cinque punte + Recupero), **Corpo** (il rombo del Campo com'è), **360**
(le sette). Solo percorso mentale → Mente e Recupero; solo Campo → Corpo e Recupero. Livello corpo e
livello mente affiancati in testa. Mai un punteggio unico: due livelli e i rombi.

## Gli incroci (seconda PR)

Frasi vere dai dati dello stesso ragazzo, al massimo due, solo con abbastanza dati e una differenza netta:
- sonno < 6 h contro lucidità (check-in su check-in);
- seduta dura del Campo (voto ≥ 8) contro azioni del giorno dopo;
- carico in zona alta contro pratiche saltate;
- stato mentale > 7 contro sedute fatte.
Le stesse frasi entrano nel contesto del Coach (blocco "Campo": sedute fatte/saltate, dolore in pausa, stato
del carico, zone con fastidio) e nel prompt del preparatore (stato mentale nel check-in e nel flag di fatica,
settimana del percorso nel messaggio).

## Cosa va costruito (stato al 29/9 notte: 1-4 nella PR #119, 5 nella PR successiva — tutto fatto)

1. **Tracking del Reset** (NUOVO): `POST /api/reset/complete { mode: 'rituale' | 'rapido', durataSec }` scrive
   una riga in `onboarding_events` (`reset_completed`, server-side, niente migration) e aggiorna
   `last_meditation_completed`; `MeditationPopup` la chiama al completamento (oggi aggiorna il profilo dal client).
2. **Migration 029**: `daily_checkin.presence_yesterday SMALLINT CHECK 0-10`; quinto slider nel
   `DailyCheckinModal` ("Quanto sei stato presente ieri durante la giornata?", 0 = mai tornato presente,
   10 = presente quasi sempre); `/api/checkin` la salva; `GET /api/checkin/history` la ritorna.
3. **Via il check del giorno prima**: slide nella pagina giorno, `PATCH /api/giorno`, `previousDayCheck`
   nella risposta di `GET /api/giorno`; la colonna `user_day_progress.previous_day_check` resta (storico), i
   campi Notion `Ha Check Precedente` / `Testo Check` non vengono più letti.
4. **`lib/carta.ts`** (pura, testabile): `romboMente(input)`, `puntaRecupero(input)`, `rombo360(...)`, con le
   finestre 4 settimane / 7 giorni e la partenza; `GET /api/carta` che carica e calcola; pagina `/carta`
   con le tre viste, i livelli in testa, l'etichetta, e sotto la parte che c'è già (mantra, mappa, firma, Protocollo).
5. Seconda PR: `lib/incroci.ts` (puro) + `lib/cartaServer.ts` (`loadIncroci`, `loadCampoPerCoach`) nel contesto del Coach,
   `isTestaAltrove` + `percorsoMentaleTesto` nei prompt del planner v1/v2 e della chat del preparatore.

## Gli incroci — come sono calcolati (29/9)

Finestra 8 settimane. Ogni incrocio esce solo con abbastanza dati (≥ 5 giorni per lato; ≥ 3 sedute dure; ≥ 2 settimane
per lato) e solo nel verso che serve al ragazzo: il verso opposto sarebbe rumore. Soglie da tarare sui dati.

| Incrocio | Confronto | Esce se |
|---|---|---|
| sonno vs lucidità | mattine con < 6 h contro ≥ 7 h: media dello stato mentale | ≥ 1.5 punti più basso con poco sonno |
| seduta dura vs azioni | giorno dopo una seduta con voto ≥ 8 contro gli altri giorni: azioni spuntate / segnate | ≥ 20 punti in meno |
| carico vs pratiche | settimane con carico ≥ 1.15 × mediana contro le altre: pratiche fatte / giorni | ≥ 20 punti in meno |
| testa vs sedute | giorni con mentale ≥ 7 contro ≤ 5: giorni con una seduta fatta | ≥ 25 punti in più da lucido |
