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
