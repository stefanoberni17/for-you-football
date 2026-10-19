# Confronto catalogo ↔ Everfit (15/10/2026)

Ste, 15/10: "voglio che riguardi bene tutti esercizi, video e descrizioni dentro a Everfit". Questo è il confronto fatto sull'**export del 20/9** (`docs/everfit-custom-exercises.json`, 209 esercizi personalizzati; `docs/everfit-workouts.json`, 203 workout). L'export NON ha le descrizioni per esercizio di Everfit (solo titolo, categoria, tag, video, miniatura): per leggerle serve una lettura viva con il token (`node scripts/everfit-assign.mjs libdetail`, comando già esistente), da fare quando Ste lo incolla in chat. Nessuna scrittura su Everfit.

## Esercizi: 209 su 209 abbinati per nome
Tutti i 209 esercizi personalizzati di Everfit hanno una riga nel catalogo (`nome_everfit`). Nessun esercizio Everfit manca.

## Video: 1 differenza
| Everfit | Catalogo | Nota |
|---|---|---|
| "Toes up down" → `1_TtKlvDeqk` | `fasc-toes-up-down` "Big Toe and Toes Alternating" → `JctaRd1xxng` | Il 10/10 Ste ha scambiato i due video nel catalogo (Big Toe ↔ Toes Up and Down). Su Everfit lo scambio non c'è: "Toes up down" ha ancora il video dell'alternato e "Toes Up Down 2" quello del su-giù. **Da sistemare su Everfit** (solo su richiesta di Ste), oppure da richiamare quando il token c'è. |

Tutti gli altri 208 video coincidono (stesso id YouTube). Nessun esercizio ha il video su Everfit e non nel catalogo.

## Esercizi Everfit disattivati nel catalogo: 23
- 12 "visione headball" (solo con la headball, esclusi finché Ste non decide) + "1vs1 - difesa da fermo" (solo in coppia) + "Passaggi in equilibrio su 1 piede" (headball).
- 5 doppioni tolti da Ste nelle correzioni delle schede, con alias in `build-blocks.py`: Pogo Jumps progression 2 (14/10), "Allenamento rapidità, tecnica, tiro in porta e velocità di pensiero", "Esercizi Resistenza alla Velocità", "Esercizio Tecnica + Resistenza Funzionale Calcio" (15/10), più i due "Fascia Single leg RDL/runner" uniti in `fasc-fy-towe-slrdl` (10/10).
- 4 senza nota: "Box Dribbling", "Palleggi solo testa - Tecnica", "piegamenti con battito", "Towel Curls - Tallone sollevato", "Yoga prevenzione e forza adduttori" (alias a `fasc-sequenza-yoga-prevenzione-pubalgia-e-rinforzo`). **Da chiedere a Ste**: restano fuori o li riattivo con la scheda?

## Catalogo "fonte Everfit" senza riga nell'export: 4
`core2-bear-crawl-linear`, `core2-bear-crawl-lateral`, `core2-isometric-bear-crawl`, `risc-hip-external-rotation-skip`: vengono dalla libreria standard Everfit (video S3 privato tolto il 7/9), attivi, senza video, con la scheda. Da registrare (`docs/training-video-da-registrare.md`).

## Descrizioni dei workout (44 su 203)
Solo i Fartlek (A1-A4) hanno una descrizione con la struttura ("4' 1/1 · 6' 40/40 · 5' 30/30 · 4' 15/15 · 4' ×2"; A3-A4 "piramide 60/30 · 40/20 · 30/60 · 20/40"): utile per il punto 19 di `docs/campo-da-fare.md` (la seduta di resistenza a serie). Le altre sono righe generiche (fascia, forza PRO, visione, riscaldamento sprint).

## Da fare con il token (lettura, niente scritture)
1. `libdetail` su tutti i 209 esercizi: descrizioni/istruzioni di Everfit contro le schede del catalogo, e video cambiati dopo il 20/9.
2. Rilettura dei 203 workout: esercizi aggiunti o tolti dopo il 20/9 (i blocchi dell'app vengono da quell'export).
3. Report in questo file, poi le correzioni nel JSON come per i batch.

## Lettura viva del 15/10 (token di Ste, solo letture)
`/api/exercise/search` (3728 esercizi, 210 personalizzati di Ste), salvata in `docs/everfit-export/` (gitignored).
- **Nuovi dal 20/9: 1**, "One Arm Push Up Decline" (mani sul rialzo, il passo prima del piegamento a un braccio a terra; aggiunto a Everfit il 15/9). Aggiunto al catalogo come `fpa-one-arm-push-up-decline` (livello A, con scheda). Nessun esercizio sparito.
- **Video**: tutti uguali tranne "Toes up down" (vedi sopra).
- **Istruzioni su Everfit: 119 esercizi su 210.** Confrontate una per una con le schede; le schede sono quasi sempre più complete, ma 30 istruzioni avevano dettagli di Ste che mancavano e sono stati integrati: i **link dei video dei segnali** (colori `LqRXesBqaZc` per Wall Passes with Vision e Shots on Goal with Vision; `c42oiIHdrwc` per Defender Stance), il triangolo di cinesini a 5 m con il telefono sul vertice e le regole freccia/stop del dribbling con visione, la cadenza dei Toe Bounces (2 al secondo, appoggio alla base di alluce e indice), il gluteo come segno nel runner's lunge, il gradino 20-30 cm e "come scendere le scale" per Patrick e Poliquin, le tre versioni dei Pogo Jumps, il protocollo di respirazione della Fascia Standing Meditation (riscritta: prima era una meditazione generica), l'avversario in pressione nel controllo di suola, l'avanti-indietro nei passaggi 5-10 m, le distanze 5-8-11-15 m nella tecnica di tiro, i tipi di controllo a 180°, lo scan prima del turn 180, i blocchi da 10 nei palleggi coscia e collo e nel test piedi-coscia-testa (un giro = 10+10+10), orario/antiorario per serie nell'around the world, la regola sul ritmo delle ripetute, la sequenza del circuito esterni, la versione test dello squat a 90° (3RM a passi di 10 kg), scalzo e occhi chiusi nel test di equilibrio, la spinta sugli avampiedi nello swing high pull, l'ultimo allungo di riscaldamento quasi al massimo, i talloni nel drop jump, i ~10 palleggi prima del calcio alto, la pallina ripresa al volo nelle navette, la pianta del piede contratta nella figura 8, e **One-Arm Incline = PIEDI sul rialzo** (la scheda diceva la mano: corretta).
- **Da chiedere a Ste**: "Tiri in porta dall'angolo": su Everfit sono tiri a giro direttamente in porta dal corner e dagli angoli dell'area, la correzione del 15/10 dice cross in corsa: quale vale, o sono due esercizi? (`da_confermare` nella scheda.)
- **Non integrato, solo da sapere**: il "Max Squat 90°" su Everfit è un test di 3RM; "Palleggi solo un piede" dice "solo destro"; le istruzioni dei doppioni disattivati coincidono con l'originale tenuto.
- **Ancora da leggere con il token**: i 203 workout (`/api/workout/v2/detail/<id>`) per vedere se Ste ha cambiato serie, esercizi o codici dopo il 20/9: i blocchi dell'app vengono da quell'export.
