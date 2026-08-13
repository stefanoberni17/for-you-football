# 🔧 Fix list — Revisione percorso & W5-W8 (agosto 2026)

> Esito della revisione completa di agosto 2026: canone (Documento Fondante, DB Fondamenta,
> DB Concetti, Il Piccolo Libro), style guide W5-W8, prompt Coach, e tutti i 28 giorni live
> di W5-W8 su Notion. **Verdetto generale: W5-W8 in linea col metodo.**
> Qui sotto tutto ciò che è da mettere a posto, in ordine di priorità.
>
> **STATO (13/08/2026 — sera): TUTTO APPLICATO E VERIFICATO** ✅
> Codice: applicato su questo branch. Notion: applicato (in parte da altra chat, completato
> e verificato qui — inclusi PF di W7-G4, àncora W8 unificata su G3/G6, ordine e pulizia
> DB Fondamenta). Unica azione manuale residua: nel DB Fondamenta eliminare le 5 righe
> marcate «🗑️ ELIMINARE» (Ordine 99) — l'API non può cestinarle.
> Nota di merito: la bonifica dei Perché Funziona è andata oltre il richiesto (via anche
> «nervo vago»/«embodiment» dove suonavano tecnici) e l'àncora W8 è stata unificata sulla
> versione del G1 («ogni volta che ti torna in mente l'ultima partita»).

---

## 🔴 Priorità alta

- [x] **W5-G4 — battezzare "Lo Stacco".** ✅ FATTO su Notion (verificato). L'app (Palestra, cassetta strumenti, Coach) chiama
  lo strumento di W5 "Lo Stacco", ma i 7 giorni di W5 non usano mai quel nome. Aggiungere una
  riga nel G4, sul modello di W8-G4: «Questa sequenza ha un nome: Lo Stacco. La ritrovi nella
  tua Palestra.» *(Notion, DB Giorni)*
- [x] **W7-G4 — battezzare "L'Anticipo".** ✅ FATTO su Notion (verificato, incluso PF). Stesso problema: in W7 lo strumento si chiama solo
  "la mossa" / "il quando-allora". Una riga nel G4. *(Notion, DB Giorni)*
- [x] **Coach AI — sincronizzare il catalogo storie** (`lib/coach-ai.ts`). ✅ FATTO (ago 2026). Il prompt ha ancora
  solo i 7 nomi originali; `docs/content-w5-w8/04-storie-verificate.md` ha aggiunto:
  CR7-rigori/Euro2024, Sergio Ramos, Vardy, Baggio capitolo 2, Messi 13 anni,
  Pirlo-PlayStation, Kobe (regole: quattro air-ball, solo parafrasi). Se un ragazzo cita
  Vardy (W6-G6) al Coach, oggi il Coach non può seguirlo. *(codice)*
- [x] **Coach AI — contraddizione sul perdono di sé in W7.** ✅ FATTO: vale il Contesto (non si apre in W7; spostato a Season 2+ nel CHECK CASSETTO). Il CHECK CASSETTO nel prompt dice
  "W7 → riapri perdono di sé"; il Coach Contesto della W7 su Notion dice "NON aprire il
  perdono di sé". Decidere (consiglio: vale il Contesto — non si apre in W7) e allineare il
  prompt. *(codice)*
- [x] **W8-G4 + card Palestra — "tieni l'informazione, posa il peso".** ✅ card Palestra (`toolsCatalog.ts`) FATTA; W8-G4 su Notion FATTO (verificato). Il canone (C06
  Rilascio, passo 5: "ringrazia ciò che lasci andare: ti ha insegnato qualcosa") distingue
  lezione e peso; il Rilascio attuale posa tutto ("l'errore, il risultato, il giudizio").
  Aggiungere una riga: «Quello che la partita ti ha insegnato lo tieni — è tuo. Quello che
  posi è il peso, non l'informazione.» Anche in `lib/toolsCatalog.ts` (card Rilascio).
  *(Notion + codice)*

## 🟡 Priorità media

- [x] **W8-G7 — terza domanda gate.** ✅ FATTO su Notion: Q3 ora è una domanda vera. Il testo dice "se ti va, scrivi…" ma l'app richiede
  tutti e 3 i campi compilati per procedere (`app/gate/[week]/page.tsx`). O riformulare come
  domanda vera, o rendere quel campo opzionale. *(Notion o codice)*
- [x] **Perché Funziona — togliere i termini inglesi.** ✅ style guide aggiornata (registro dichiarato); le 4 property su Notion FATTE (verificate). Sono testi user-facing per 16-25enni:
  "cognitive reappraisal" (W6-G2 — citato testualmente come vietato nella Regola 2 della
  style guide), "ACT / defusione" (W6-G3), "implementation intentions" (W7-G4),
  "self-distancing" (W5-G3). Tenere i meccanismi, tradurre le etichette in italiano.
  E dichiarare nella style guide il registro ammesso nei Perché Funziona — oggi la Regola 2
  è ambigua su questo campo. *(Notion + docs)*
- [x] **DB Fondamenta — ordine principi 2 e 3.** ✅ FATTO: Osservazione=2, Ascolto=3. Fondamenta dice Presenza → Ascolto (2) →
  Osservazione (3); Documento Fondante e app dicono Presenza → Osservazione (2) →
  Ascolto (3). Allineare Fondamenta al Documento Fondante (fonte di verità). *(Notion)*
- [x] **DB Fondamenta — pulizia.** ✅ Le 5 righe sono marcate «🗑️ ELIMINARE» (Ordine 99): eliminarle a mano dal DB. Righe duplicate (Ascolto, Perdono, Lasciare Andare,
  Ritornare al Centro esistono in doppia copia, feb e mar 2026) + eliminare davvero la riga
  "⚠️ DA ELIMINARE - Direzione" (contenuto già confluito nel pilastro 8 "Direzione Creativa"
  del Documento Fondante). *(Notion)*
- [x] **W8-G2 — valvola di sicurezza mancante.** ✅ FATTO su Notion. È l'unico giorno "che tocca" (fatto vs
  storia su quanto vali) senza la chiusura standard «Se ti smuove più del previsto… Reset…
  parlane con il Coach». Una riga. *(Notion, DB Giorni)*

## 🟢 Priorità bassa (coerenza e igiene)

- [x] **W5-G1 — minuto di presenza pura.** ✅ FATTO su Notion. Il Piccolo Libro ("Pratica — Adesso", priorità
  Alta) prevede l'apertura di presenza in OGNI G1; W6/W7/W8-G1 ce l'hanno, W5-G1 no.
  Aggiungerla o dichiarare l'eccezione. *(Notion)*
- [x] **W6 — Nota Campo di G2 mai ripresa.** ✅ FATTO: check aggiunto a W6-G3. W5-G3, W7-G3 e W8-G3 controllano la Nota Campo
  del G2 della loro settimana; W6-G3 no. Aggiungere il Testo Check. *(Notion)*
- [x] **Durate incoerenti.** ✅ FATTO: gate W5/W6=5, W8-G5=2. G5 "giornata": W5/W6/W7 = 2 min, W8 = 5. Gate: W5/W6 senza
  Durata Minuti, W7/W8 = 5. Uniformare. *(Notion)*
- [x] **Style guide — Regola 8.** ✅ FATTO (ago 2026): rimanda a `04-storie-verificate.md`. Dice ancora "catalogo chiuso" a 7 nomi: aggiornare puntando
  a `04-storie-verificate.md`. *(docs)*
- [x] **CLAUDE.md — tabella percorso.** ✅ FATTO (ago 2026). Blocco 2 riporta "Accettazione, Lasciare Andare,
  Perdono": l'ordine reale è Accettazione (W5-6) → Perdono (W7) → Lasciare Andare (W8).
  *(docs)*

## 🌀 In mappa (design futuro, non fix)

- [ ] **W10 — attenzione in azione.** Fondere il framework "attenzione divisa / Ricordati di
  Te" (già nella Mappa strategica B3, Step 4-5) con il focus esterno alla Gallwey/Wulf (gli
  occhi sulla palla, sugli spazi — l'attenzione DURANTE il gioco). È l'unico buco vero
  rispetto ai migliori: oggi tutti gli strumenti vivono TRA le azioni.
- [ ] **W9 — leva attiva del corpo.** Il "gesto per il corpo" della strada dovrebbe agganciare
  esplicitamente la firma del gioco libero (W3-G3) e il corpo della dignità (C10 Valore):
  dalla lettura del corpo alla regia del corpo. Chiude la triade fisiologia/focus/linguaggio.
- [ ] **Season 2 — perdono in 5 passi.** Il processo completo del C05 ("Ti lascio andare, e
  mi lascio libero") non ha ancora una destinazione dichiarata (giustamente non è in W7 né
  nel Blocco 3). Posto naturale: S2, livello Relazioni (mister, compagni, padre). Fissarlo
  in mappa perché non resti orfano.
- [ ] **Season 2 (o W11) — la voce da compagno.** W5-G3 fa vedere il critico interno ("il
  test del compagno") ma il loop non si chiude mai in S1: manca il giorno che allena la voce
  sostitutiva ("cosa diresti a un compagno che ha sbagliato così — dillo a te").
- [ ] **Gratitudine — unica voce "priorità Alta" del canone senza casa nel prodotto.** La
  pratica "3 cose" (Piccolo Libro, cap. 9 — nota: "perfetta come chiusura di settimana") è
  solo nel catalogo pratiche del Coach. Posto naturale: chiusura di settimana (G6/G7) o
  variante serale del rituale.
- [ ] **Audio "Zaino dei pesi".** Lo script esiste già su Notion: candidato perfetto per il
  campo Audio Pratica di W8-G4 quando il bucket `practice-audio` sarà attivo.

---

*Fonte: revisione Claude, agosto 2026. Riferimenti: 🧠 Il Metodo For You — Documento
Fondante, DB Fondamenta della Crescita, DB Concetti, 📖 Il Piccolo Libro, 🌀 Mappa strategica
B3, style guide e blueprints in `docs/content-w5-w8/`, DB Settimane e DB Giorni live su
Notion, `lib/coach-ai.ts`.*
