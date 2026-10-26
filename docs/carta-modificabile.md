# Carta del Giocatore modificabile (spec 26/10/2026, nel codice la sera stessa)

Richiesta di Ste. **Stato: fatto il 26/10 sera**, non con una tabella nuova ma sopra il sistema delle risposte chiave del 24/10
(`user_answer_versions`, migration 033; `ModificaRispostaSheet`; `POST /api/risposte`), che faceva già versioni e modifica: la
spec qui sotto è quella originale, la sezione "Com'è stato fatto" in fondo dice le differenze.

## Com'è stato fatto (26/10 sera)

- **Un solo sistema.** I riquadri della Carta sono risposte chiave (`RISPOSTE_CHIAVE` in `lib/risposteChiave.ts`, campo `carta`): mantra W1-G3,
  firma W3-G3, mappa = prima risposta del Gate 3 (`gateQ: 'q1'`), Protocollo W4-G6, le cose che sei anche senza il pallone W8-G6,
  Protocollo For You W11-G4 (sesto riquadro: sì). Niente `carta_versions`: le versioni stanno in `user_answer_versions`
  (la risposta del giorno è la versione zero, nessun backfill: la prima modifica mette in storico il testo vecchio).
- **Modifica dalla Carta** (`app/carta/page.tsx`): ogni riquadro ha "Modifica" (o "Scrivi" se vuoto: sì) → `ModificaRispostaSheet` →
  `POST /api/risposte`; sotto, "Aggiornata il … · N versioni". La Carta legge `/api/risposte?chiavi=1` e `campiCarta(rows)`.
  Per la mappa `salvaRisposta` aggiorna `gate_answers.q1` (il Gate 3 va passato prima: 409); per un riquadro di un giorno mai
  aperto crea la riga di `user_day_progress` senza completarla.
- **Richiamo nei giorni**: property multi-select **"Mostra Carta"** sul DB Giorni (creata dal connettore il 26/10: Mantra, Mappa,
  Firma, Protocollo, Cose, Protocollo For You) → `mapGiorno.mostraCarta` → `RisposteChiaveBox` nel giorno con il titolo
  "Questo è quello che avevi scritto", testo attuale e Modifica. I giorni li sceglie Ste. Vuoto = niente.
- **Coach**: il blocco "Le sue risposte chiave" ha anche i riquadri della Carta (con "nella sua Carta") e, sotto ognuno, fino a
  2 versioni precedenti con la data (`loadVersioniPrecedenti`).
- **Rinomina**: "Le cose che sono anche senza il pallone" nella Carta e nelle etichette.
- **/risposte**: la mappa si modifica dalla card del Gate 3 ("Modifica: la tua mappa"); gli altri riquadri come le altre chiave.

Decisioni prese da me sulle tre domande (da confermare): 1) sì, sesto riquadro "Il mio Protocollo For You"; 2) sì, "Scrivi" sui
riquadri vuoti; 3) routine (W9) e condizioni (W10) restano fuori dalla Carta (sono già in "Le tue risposte" e nel box di W11-G4):
se Ste le vuole nella Carta basta aggiungere `carta` alla loro voce in `RISPOSTE_CHIAVE` e un riquadro.
Da Ste: il testo di W8-G6 su Notion ("apri la tua Carta e mettici dentro quello che hai scritto" → "lo ritrovi nella tua Carta");
i giorni con "Mostra Carta".

---

## La spec com'era

## Cosa vuole

1. **Modifica dalla Carta.** Ogni riquadro (mantra, mappa, firma, Protocollo, le cose che sono anche senza il pallone) ha un pulsante «Modifica». Il ragazzo cambia il testo e salva.
2. **Versioni.** La risposta originale del giorno non si cancella: la nuova versione si salva con la data. La Carta mostra sempre l'ultima. Il Coach vede anche le precedenti. Stessa logica chiesta per il Protocollo in W11-G6/G7: un solo sistema per tutto.
3. **Richiamo nei giorni successivi.** Campo «Mostra Carta» sul DB Giorni di Notion (scelta multipla: Mantra, Mappa, Firma, Protocollo, Cose). Se compilato, nella pagina del giorno compare «Questo è quello che avevi scritto» con il testo attuale e «Modifica». Vuoto: niente. I giorni li sceglie Ste nei testi.
4. **Rinomina** «Le cinque cose che sono anche senza il pallone» → «Le cose che sono anche senza il pallone».

## Com'è oggi

`app/carta/page.tsx` legge `user_day_progress` e mappa: mantra = risposta W1-G3, mappa = gate W3 (`gate_answers.q1`), firma = risposta W3-G3, Protocollo = risposta W4-G6, cose = risposta W8-G6. Sola lettura, nessun campo modificabile. Il testo di W8-G6 su Notion dice «apri la tua Carta e mettici dentro quello che hai scritto»: sbagliato, finisce da sola (da correggere: «lo ritrovi nella tua Carta»).

## Proposta

- **Migration 031** `carta_versions`: `id`, `user_id`, `campo` (`mantra|mappa|firma|protocollo|cose`, più eventuali nuovi), `testo` (≤ 1500), `created_at`. RLS owner-read, scrittura solo service role (regola dal 25/9: il client non scrive). La risposta del giorno resta in `user_day_progress` ed è la versione zero: niente copie, niente backfill.
- **Risoluzione** (modulo puro in `lib/cartaCampi.ts`, con test): ultima versione per campo se esiste, altrimenti la risposta del giorno. Usata da `/api/carta`, dalla pagina Carta, dalla pagina giorno e dal Coach.
- **API** `POST /api/carta/campo { campo, testo }` (auth, validazione, insert) e `GET /api/carta/campi` (valori attuali + versioni precedenti per campo).
- **UI**: `components/CartaCampoEditor.tsx` (Sheet con Textarea e Salva), usato dal riquadro della Carta («Modifica», o «Scrivi» se vuoto: da confermare) e dal riquadro «Questo è quello che avevi scritto» nella pagina giorno.
- **Notion**: proprietà multi-select `Mostra Carta` sul DB Giorni → `mapGiorno.mostraCarta: string[]` in `lib/notion.ts` → `/api/giorno` → pagina giorno.
- **Coach**: in `buildUserContext` un blocco «Carta del Giocatore» con il valore attuale di ogni campo e le ultime due versioni precedenti con la data.
- **Rinomina** del riquadro nella stessa PR.

Stima: una PR, 6-7 ore. Da Ste: migration su Supabase, campo Notion (o lo crea Claude dal connettore), i giorni con «Mostra Carta».

## Da decidere con Ste

1. Il «Protocollo» della Carta è il Protocollo Pressione (W4-G6). Il Protocollo For You (W11-G4) è un'altra cosa: serve un sesto riquadro? (proposta: sì)
2. Riquadro vuoto: pulsante «Scrivi» per compilare a posteriori? (proposta: sì)
3. W11-G2/G3/G4 citano «le tue risposte qui sotto» e «dal Profilo in Le tue risposte»: con «Mostra Carta» il rimando torna vero per Protocollo e, se c'è, Protocollo For You. Routine (W9) e condizioni (W10) restano fuori: riquadri in più o testi da adattare.
