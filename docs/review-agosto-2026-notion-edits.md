# ✏️ Modifiche Notion pronte da applicare — Revisione agosto 2026

> Il connettore Notion di questa sessione è in sola lettura, quindi queste modifiche vanno
> applicate a mano (2 minuti l'una) — oppure riaffidate a Claude in una sessione con permesso
> di scrittura. Ogni voce indica: pagina, property, e il testo esatto.
> Le modifiche al codice (Coach, Palestra, style guide, CLAUDE.md) sono GIÀ fatte e pushate.

---

## DB Giorni — 📆 Season 1

### 1. W5-G4 «Errore → Reset → prossima azione» — battezzare Lo Stacco
**Property `Pratica`** — inserire questo paragrafo DOPO «…Quello è il lavoro che gira.» e PRIMA della valvola finale («Se durante l'esercizio…»):

> E questa sequenza ha un nome: Lo Stacco. Stacchi dall'errore prima che te ne costi un secondo. Da oggi è tuo, nella tua cassetta.

### 2. W7-G4 «Prima dell'esplosione» — battezzare L'Anticipo
**Property `Pratica`** — inserire questo paragrafo DOPO «…E più becchi il gradino 1, meno volte finirai in cima.» e PRIMA dell'àncora («Àncora della settimana…»):

> E questa mossa ha un nome: L'Anticipo. Senti la rabbia salire un secondo prima, e scegli invece di subirla. Da oggi è tua, nella tua cassetta.

**Property `Perché Funziona`** — sostituire:
- ❌ «La psicologia chiama implementation intentions le formule «quando-allora»: deciso in anticipo…»
- ✅ «La psicologia ha studiato a fondo le formule «quando-allora»: deciso in anticipo…»

### 3. W8-G4 «Lascia e gioca» — il peso, non la lezione
**Property `Pratica`** — al punto 4, dopo «…Il risultato di ieri resta lì. Tu entri senza.» aggiungere:

> Quello che quella partita ti ha insegnato, invece, lo tieni — è tuo. Posi il peso, non la lezione.

*(La card della Palestra in `lib/toolsCatalog.ts` è già stata aggiornata con la stessa riga.)*

### 4. W8-G7 «Chiusura del Blocco 2» — terza domanda del gate
**Property `Domande Gate`** — sostituire SOLO il punto 3 (i punti 1 e 2 restano identici) con:

> 3. Lungo queste settimane forse hai iniziato a vedere due cose, magari senza dirtelo: che campo e vita non sono due mondi separati, si parlano di continuo. E che quello che vali non si decide nei novanta minuti — il risultato può colorarti una giornata, ma non dice chi sei.
> Prima di chiudere, rileggi la tua Carta: quelle cinque cose c'erano già — adesso le hai viste. Quale tieni più stretta quando le cose vanno male? (Scrivila qui.)

*(Motivo: il testo attuale dice «se ti va, scrivi…» ma l'app richiede tutti e 3 i campi compilati.)*

### 5. W8-G2 «Non sei la tua ultima partita» — valvola di sicurezza
**Property `Pratica`** — aggiungere in fondo, dopo la riga dell'àncora («Ricorda l'àncora: ogni volta che parli di te…»):

> Se guardare cosa ti raccontavi su quanto vali ti smuove più del previsto, va bene. Fermati, fai un Reset, e se ti va parlane con il Coach.

### 6. W5-G1 «Cosa succede quando sbagli» — minuto di presenza pura
**Property `Pratica`** — inserire DOPO la prima riga («Siediti. Occhi aperti… naso, pancia, bocca.») e PRIMA di «Ora torna con la mente…»:

> Poi un minuto solo presente: i piedi che appoggiano, i suoni intorno, il punto sotto lo sterno che si gonfia e si sgonfia. Non devi fare niente: sei qui, ed è già abbastanza.

*(Allinea W5-G1 ai G1 di W6/W7/W8 e alla «Pratica — Adesso» del Piccolo Libro, priorità Alta.)*

### 7. W6-G3 «Fatto o storia» — check della Nota Campo di W6-G2
- **Property `Ha Check Precedente`**: ✅ spuntare
- **Property `Testo Check`**:

> Al primo allenamento dopo il G2, quando hai sentito uno sguardo addosso: hai fatto il Body Check di 10 secondi? Anche una volta sola.

### 8. Perché Funziona — bonifica termini inglesi (Regola 2)
- **W5-G3, property `Perché Funziona`** — sostituire:
  - ❌ «…sfrutta un meccanismo preciso — il self-distancing: guardare la situazione come la guarderesti per un altro riduce la reattività emotiva…»
  - ✅ «…sfrutta un meccanismo preciso: guardare la situazione da fuori, come la guarderesti per un compagno, riduce la reattività emotiva…»
- **W6-G2, property `Perché Funziona`** — sostituire:
  - ❌ «La ricerca sul cognitive reappraisal mostra che la stessa attivazione fisiologica…»
  - ✅ «La ricerca mostra che la stessa attivazione fisiologica…»
- **W6-G3, property `Perché Funziona`** — sostituire:
  - ❌ «La ricerca sull'ACT chiama defusione la capacità di vedere un pensiero come pensiero e non come realtà: non riduce il fatto, riduce la presa emotiva dell'interpretazione.»
  - ✅ «La ricerca mostra che vedere un pensiero come pensiero — e non come realtà — non riduce il fatto: riduce la presa emotiva dell'interpretazione.»
- *(W7-G4 già coperto al punto 2.)*

### 9. Durate — uniformare
- **W5-G7** e **W6-G7** (gate): `Durata Minuti` = **5** (come W7-G7 e W8-G7)
- **W8-G5** (giornata): `Durata Minuti` = **2** (come W5/W6/W7-G5)

---

## DB Fondamenta della Crescita

### 10. Ordine dei principi 2 e 3 (allineare al Documento Fondante)
- Riga **Osservazione**: `Ordine` da 3 → **2**
- Riga **Ascolto** (versione feb 2026): `Ordine` da 2 → **3**

### 11. Pulizia righe
Da **eliminare** (cestino):
- Le 4 righe duplicate create il 1° marzo 2026 (secondo esemplare di: Ascolto, Perdono, Lasciare Andare, Ritornare al Centro) — tenere il set completo di febbraio
- La riga **«⚠️ DA ELIMINARE - Direzione»** (contenuto già confluito nel pilastro 8 «Direzione Creativa» del Documento Fondante)

> Nota: se preferisci le essenze della versione di marzo (sono leggermente più ricche), copia prima il testo nelle righe di febbraio e poi elimina quelle di marzo — l'importante è restare con UN solo set di 7.

---

## Riferimenti rapidi (link pagine)
- W5-G1 https://app.notion.com/37b655f726c78159a8a8e7c9ab3cb71c · W5-G3 https://app.notion.com/380655f726c781b6ab7ac3bc33b4f856 · W5-G4 https://app.notion.com/380655f726c78164843be312ce4dffdf · W5-G7 https://app.notion.com/380655f726c781b28316f13e1c868af6
- W6-G2 https://app.notion.com/380655f726c7811eb422f53b1beb25cd · W6-G3 https://app.notion.com/380655f726c781ac9e40f7d3c4dbdb4f · W6-G7 https://app.notion.com/380655f726c7812a836ed9fd8951f24c
- W7-G4 https://app.notion.com/380655f726c78146b21be78da3885343
- W8-G2 https://app.notion.com/380655f726c78129bdb1fac20dae4619 · W8-G4 https://app.notion.com/380655f726c7811a89d6c30b5b975dba · W8-G5 https://app.notion.com/380655f726c78118b65efe56d2cf0a2a · W8-G7 https://app.notion.com/380655f726c7814fbe08d11b31bec045
