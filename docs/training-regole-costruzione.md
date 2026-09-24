# Regole di costruzione dei workout — per obiettivo

Fonte: i programmi Everfit di Ste (`docs/everfit-programs.md`, export 1/9/2026) letti insieme
e le risposte di Ste del 24/9/2026. Questo documento è la specifica che il server userà per
scegliere da solo il blocco successivo di ogni famiglia ("memoria dei blocchi") e per costruire
le scale degli esercizi che oggi non ne hanno (kettlebell, corsa, palestra).

Le regole di **forza parte alta** (scale skill, 4 formati, soglie a scalare) sono in
`docs/training-parte-alta.md`. La progressione delle **dosi** sul singolo esercizio (SALI /
SCENDI dai log, gradino successivo, tetto +30 %) è in `lib/trainingProgressione.ts`.

Convenzioni: **giudizio** = facile / giusto / duro dato dall'atleta su ogni blocco a fine seduta
(`training_session_completions.feedback_blocchi`, migration 026). **Codice** = livello +
progressione del blocco (B1, B2, A1…), **short** = variante breve.

---

## 0. Regola generale del codice successivo (tutte le famiglie)

Per ogni famiglia il server guarda l'ULTIMO blocco fatto e il suo giudizio:

| Ultimo giudizio | Prossimo blocco della famiglia |
|---|---|
| facile | il codice successivo (B1 → B2, B2 → A1…); se l'ultimo era short → lo stesso in full |
| giusto | lo stesso codice |
| duro, oppure voto seduta ≥ 8, oppure dolore segnalato | lo stesso in short, o il codice precedente se era già short |
| nessun blocco fatto | il primo codice del livello dell'atleta (dal test AMRAP), in short se la seduta è la prima della fase |

Mai saltare un codice. Mai andare oltre il livello dell'atleta + 1 (regola già in `blocchiDisponibili`).
Il salto di livello (B → A) richiede il criterio della famiglia (sotto), non basta un "facile".

---

## 1. Fascia (Ste, 24/9: "giornata facoltativa; Fascia Forza è un'altra cosa")

Tre ruoli distinti, tre famiglie:

1. **Apertura** — `Fascia Training - Rolling and fascia adhesion` (~10') oppure `Fascia Foundations 1` (~15'): in testa a OGNI seduta fisica, mai come blocco principale, non conta come giornata di fascia. Nei programmi di Ste ogni giornata di "Forza e Velocità" e di "Preparazione Estiva" apre così.
2. **Percorso fascia** — famiglia `Fascia Foundation`, scala `1 → 1B → 1C → 1D → 2A → 2B → 2C` (+ `1E`, `A3`, `A4` per l'intermedio): è una **giornata leggera facoltativa** (non conta nel tetto delle sedute fisiche), 1-3 volte a settimana. Nei programmi di 8 settimane lo stesso codice si ripete per 2 settimane (2 giornate/settimana) e poi si avanza. Regola: avanza di un codice dopo **2 settimane** sullo stesso codice con giudizio facile o giusto; con "duro" resta. Finito 2C: si torna a 2A con una serie in più (consolidamento, come la tecnica). Il ramo `Fascia foundation tecnica A1 → A1-B → A1-C → A2 → A2-B` (con pallina da tennis e palleggi) è la variante del quinto giorno del programma Base.
3. **Fascia Forza** — famiglia `Fascia Foundation Forza` (`B3 Forza`, `A3 Forza`): lavoro di FORZA vera con **isometrie overcoming** (spinte isometriche al muro frontale/laterale, bridge bounces, iso lunge runner) più skip. È un blocco di forza parte bassa a tutti gli effetti: si può usare **ogni tanto** nella programmazione di chi ha la forza tra gli obiettivi, come alternativa alla forza esplosiva (in "Forza e Velocità" il giorno 2 alterna `Forza Esplosiva A1` e `Fascia Foundation A3 Forza` a settimane alterne). Conta come seduta fisica. Non va nelle giornate leggere.

Da fare nel codice: (a) distinguere le tre famiglie nel prompt e nel validatore (oggi "fascia" è una qualità sola); (b) l'apertura non deve mai essere l'unico blocco di una seduta fisica; (c) `Fascia Foundation Forza` mappata sull'obiettivo gambe/forza, non su prevenzione.

---

## 2. Pliometria (Ste, 24/9: "almeno 1 mese o 2 in B")

Dai programmi: la settimana di **test** ogni 4 settimane (1, 5, 9, 12 in "Forza e Velocità"); tra un test e l'altro il giorno velocità/plio va a onda `B → A → B → A` (B = richiamo estensivo, A = intensivo), non in salita lineare. Il giorno 2 alterna `Forza Esplosiva A1` e `Fascia Foundation A3 Forza`; dalla settimana 10 la `Pliometria Rapidità Velocità A1` prende il posto della forza esplosiva.

Regole:
- **Ingresso**: chi non ha mai fatto pliometria (nessun blocco `Pliometria*` nei log) resta su **B1 e B2 per almeno 4 settimane, meglio 8** (`PLIO_SETTIMANE_B_MIN = 4`, consigliate 8). Solo dopo, e solo con giudizio facile/giusto sugli ultimi 2 blocchi B, entra l'onda B → A.
- **Onda**: dopo l'ingresso, si alterna A e B settimana per settimana; un "duro" su un A riporta a B per 2 settimane.
- **Contatti**: sempre entro il tetto del livello (`B 100 · A 160 · PRO 200`, `lib/trainingRulesV2.ts`); i blocchi di Ste sono già dentro, lo stesso controllo vale per ogni composizione nuova.
- **Finestra partita**: intensiva ≥ 3 giorni prima della partita; estensiva (B) ammessa a −2.
- **Deload** (ogni quarta settimana): B short, mai A.

---

## 3. Velocità (Ste, 24/9: "sprint negli EMOM contano se inseriti; con obiettivo velocità una dedicata anche in season; max 6-10 sprint massimali")

Dai programmi: UNA giornata velocità a settimana, sempre aperta da `Riscaldamento Sprint Velocità` (A-skip, saltelli in affondo, navette, allunghi 4×50 m); gli sprint con palla (`Sprint con palla da fermo`, `rapidità e Tiro`, `Palleggio sprint e tiro`) compaiono nella seconda metà della preparazione e mai il giorno prima della partita.

Regole:
- **Quante**: 1 giornata velocità a settimana se "velocità" è tra gli obiettivi, anche in season (`in_season` ha 3 posti fisici: velocità ne prende 1). Off season fino a 2. Senza obiettivo velocità: nessuna dedicata, gli sprint arrivano dall'EMOM della parte alta e dai blocchi `Velocità e forza esplosiva`.
- **Sprint massimali per seduta: 6-10** (`SPRINT_MAX_SEDUTA = 10`, minimo utile 6). Si contano gli item "Sprint" e "Salite Sprint" (10/20/30/50 m); NON si contano salto+sprint, sprint con palla e T sprint (tecnica ed esplosività, con recuperi diversi). Nei blocchi di Ste: A1 9, B1 short 8, B2 12 nominali ma con 3 da 1 rep, `Pliometria RV B1` 11 (unico sopra 10: da rivedere o da lasciare come tetto "storico"). Gli sprint dell'EMOM `pa-emom` (1 per giro, 2-5 giri) si sommano al conteggio se nella stessa settimana c'è anche la giornata dedicata: il validatore controlla il totale settimanale ≤ 10 + giri EMOM… **da confermare**: tetto per seduta (10) o per settimana?
- **Apertura obbligatoria**: `Riscaldamento Sprint Velocità` (o `2`) prima di ogni blocco `Velocità*` / `Pliometria Rapidità Velocità*` / `Salite Sprint`. Come il rolling per la forza.
- **Con palla**: `Velocità A1`, `Velocità e forza esplosiva B2/A1`, `rapidità e Tiro`, `Palleggio sprint e tiro`, `Sprint e tiro` solo dalla 5ª settimana di ciclo e solo se anche la tecnica è tra gli obiettivi o l'atleta è in preparazione/in season (non in off season lontano dalle partite).
- **Finestra partita**: velocità a −2 ammessa (short), −1 no. Il giorno dopo la partita no.

---

## 4. Tecnica (Ste, 24/9: "ritorno voluto per consolidare: dopo un ciclo di 8 settimane si riportano le basi")

Dal "Programma Tecnica Base 12 settimane": giorno 1 muro, giorno 3 palleggi, giorno 5 a rotazione.

- **Scala muro**: `Passaggi al Muro - Tecnica di base` → `Tecnica al Muro, passaggi e controllo A1` → `Tecnica A1 Muro` → `Tecnica A2 Muro` → `Tecnica A3 Muro 2 tocchi` (poi ritorno).
- **Scala palleggi**: `B1 → B2 → B3 → A1 → A2 → A3` (settimane 1-6), poi `A1 → A3 → A3 → A1 → A4` e alla 12 tiri.
- **Mazzo del quinto giorno** (ruota, mai lo stesso tipo due settimane di fila): freestyle · tiri B1 · tiri e visione A1 · dribbling · dribbling passaggio · visione A1 · tiri A1. Sequenza reale: freestyle, tiri B1, tiri+visione, dribbling, tiri+visione, dribbling passaggio, visione, visione, dribbling passaggio, tiri A1, dribbling passaggio, dribbling passaggio.
- **Ritorno alla settimana 9**: voluto. Dopo **8 settimane** su una scala si torna al primo codice (settimana 9 = `Muro A1` della settimana 2, settimana 10 = `Passaggi al muro base` della settimana 1) con serie o minuti in più. Regola generale: **ogni ciclo di 8 settimane riporta le basi**, vale per tecnica e per la fascia (punto 1).
- **Il codice sale** con giudizio facile/giusto sull'ultimo blocco della scala; con "duro" resta; le giornate di tecnica sono leggere (non contano nel tetto fisico) e vanno bene anche il giorno prima della partita (a bassa intensità: "Box dribbling — bassa intensità" nei programmi).

---

## 5. Kettlebell (Ste, 24/9: "i pesi dipendono dall'esercizio; base → intermedi dopo 4 settimane fatte facilmente → avanzati dopo 4-8 settimane")

Nei programmi il kettlebell compare quasi solo come `Kettlebell swing` dentro la forza parte bassa, con tre schemi: 12/16 reps senza peso (base), piramide a salire 15@20 / 13@24 / 10@28 kg (PRO), piramide a scendere 12@24 / 16@20 / 30@16 kg. Il catalogo ha 13 esercizi kettlebell, quasi tutti mai usati nei blocchi.

Due leve di progressione, da tenere separate:
1. **Tipo di esercizio** (fascia base / intermedio / avanzato): si passa alla fascia dopo quando quella prima è stata fatta per **almeno 4 settimane con giudizio facile** (base → intermedio) e **4-8 settimane** (intermedio → avanzato). Il server lo misura dai log: settimane distinte con almeno una seduta che contiene un esercizio della fascia, RPE medio ≤ 6.
2. **Peso** dentro lo stesso esercizio: +4 kg (il passo dei kettlebell) quando l'atleta tiene le serie previste al peso di riferimento con RPE ≤ 7 per 2 sedute (usa `adattaDose` sui kg, oggi +2.5 % → per i kettlebell il passo è discreto: 8 → 12 → 16 → 20 → 24 → 28 → 32). Un avanzato può usare un peso più basso su un esercizio tecnico (rotational, snatch): il peso di riferimento è per esercizio, non per atleta.

**Bozza da correggere (Ste):** fascia, peso di partenza per un ragazzo di 14-20 anni (B), peso "obiettivo" della fascia.

| Esercizio (catalogo) | Fascia proposta | Peso di partenza | Peso obiettivo | Note |
|---|---|---|---|---|
| Kettlebell swing (2 mani) | base | 12-16 kg | 24 kg | il pilastro: entra ovunque, 3×12-16 |
| Kettlebell Figure 8 | base | 8-12 kg | 16 kg | core, tecnica di passaggio |
| Kettlebell Bent Over Row with Rotation | base | 12 kg | 16-20 kg | tirata per lato |
| Gorilla row | base | 12 kg per mano | 20 kg | tirata (parte alta dalle scale) |
| kettlebell kneeling snatch | base | 8-12 kg | 16 kg | didattica dello snatch, difficoltà 1 nel catalogo |
| Kettlebell swing a una mano | **intermedio** (da aggiungere al catalogo) | 12 kg | 20 kg | ponte tra swing e clean/snatch |
| kettlebell dead clean | intermedio | 12 kg | 20 kg | per lato |
| kettlebell swing high pull | intermedio | 12 kg | 16-20 kg | |
| Kettlebell Cross Chop | intermedio | 8-12 kg | 16 kg | rotazione |
| Kettlebell snatch | intermedio → avanzato | 12 kg | 20-24 kg | avanzato sopra i 20 kg |
| kettlebell clean to push | avanzato | 12 kg | 20 kg | "anche B ma peso basso" (nota livello) |
| kettlebell rotational swing | avanzato | 12 kg | 20 kg | alternato dx/sx, `solo_livello` A |
| kettlebell rotational clean | avanzato | 12 kg | 16-20 kg | `solo_livello` A |
| Kettlebell Advanced Windmill | avanzato | 8 kg | 16 kg | mobilità + forza sopra la testa: peso basso anche per gli avanzati |

Domande aperte a Ste: (a) aggiungere swing a una mano e goblet squat al catalogo? (b) i pesi sopra vanno bene per un 14-16enne o partiamo da 8-12 su tutto? (c) il kettlebell entra come blocco a sé ("Forza funzionale kettlebell B1/A1/PRO1") o solo come esercizio dentro la forza parte bassa, come oggi?

---

## Stato nel codice

| Regola | Dove | Stato |
|---|---|---|
| 0. codice successivo dal giudizio | regola 10 del prompt v2 (Claude decide) | fatto 24/9 · da spostare nel server (memoria dei blocchi) |
| 1. tre famiglie fascia | prompt / validatore | da fare |
| 2. plio: ingresso in B, onda B/A | server | da fare |
| 3. velocità: 6-10 sprint, apertura obbligatoria, con palla dalla 5ª settimana | validatore + prompt | da fare (conferma tetto per seduta o settimana) |
| 4. tecnica: due scale + mazzo + ritorno a 8 settimane | server | da fare |
| 5. kettlebell: fasce e pesi | catalogo (`fascia_kb`, `peso_riferimento`) + `adattaDose` a passi di 4 kg | bozza, aspetta le correzioni |
