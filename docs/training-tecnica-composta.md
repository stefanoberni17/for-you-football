# Tecnica composta dal catalogo — BOZZA da correggere (26 ottobre 2026)

Ste, 26/10: "Tecnica dobbiamo fare in modo di costruirla senza prendere i workout già pronti". È il punto 21 di
`docs/campo-da-fare.md`. Stesso impianto della parte alta (`docs/training-parte-alta.md`) e della parte bassa
(`docs/training-parte-bassa.md`): il server compone le sedute di tecnica dagli **esercizi** del catalogo
(55 schede riviste da Ste il 15/10), non dai 14 workout Everfit; il validatore le tratta come fidate; Claude sceglie
solo in quale giorno metterle. I workout Everfit di tecnica restano in libreria come alternativa (e come fonte di
questa proposta: le dosi qui sotto sono le SUE, lette dai blocchi).

Le righe marcate **[proposta]** sono mie. Ste corregge la tabella (anche a pezzi, in chat o su GitHub), poi si scrive
il codice (`lib/trainingTecnicaComposta.ts`, puro, con i test). Niente parte finché la tabella non è sua.

## Cosa non cambia

- La tecnica resta una **giornata leggera** (tipo `tecnica`): non conta nel tetto fisico, va nelle giornate oltre le
  fisiche, mai il giorno prima della partita (lì resta solo il blocco pre partita).
- Le due **scale** restano (`lib/trainingTecnica.ts`): palleggi B1 → B2 → B3 → A1 → A2 → A3 → A4 e muro base → A1
  → A2 → A3 due tocchi, con il codice deciso dal giudizio di fine seduta (facile/giusto → avanti, duro → fermo) e il
  ritorno al primo codice dopo 8 settimane. Cambia COSA c'è dentro ogni codice: non più il workout intero, ma la
  composizione qui sotto, con la stessa scala.
- Il **mazzo** del quinto giorno (tiro, dribbling, visione, freestyle) resta a rotazione, mai lo stesso tema due
  settimane di fila; `prioritaTecnica` (la parte più debole ai test: palleggi / passaggi e muro / tiro) decide quale
  scala va per prima e dove pesca il mazzo.
- Il **ripasso** degli esercizi difficili (voto ≥ 7 o meno del 90 % delle ripetizioni) entra in coda come oggi, fino
  a 2 per seduta.

## I formati [proposta]

| Formato | Quando | Cosa c'è dentro | Durata |
|---|---|---|---|
| **`te-base`** | la prima giornata di tecnica della settimana; ogni 4 settimane anche per chi è avanti (richiamo) | palleggi al gradino della scala + passaggi al muro al gradino + un esercizio di conduzione, **3 serie** | ~30-40' (la breve ~25') |
| **`te-palleggi`** | quando la scala che va per prima è quella dei palleggi (priorità dai test) | la seduta del codice della scala palleggi, composta dalla tabella 1 | 40-60' secondo il tempo del setup |
| **`te-muro`** | quando la scala che va per prima è quella del muro | la seduta del codice della scala muro, composta dalla tabella 2 | 40-60' |
| **`te-tiro`** / **`te-dribbling`** / **`te-visione`** / **`te-freestyle`** | il quinto giorno: il mazzo, a rotazione, prima il tema della parte debole | tabelle 3-6, per livello e attrezzatura | 20-45' |

Regola della dose, uguale per tutti: con un tempo per seduta sotto i 45' si tiene la versione breve (metà delle
serie o metà dei minuti, mai sotto 2' per esercizio); l'ordine dentro la seduta è fisso: prima il lavoro "pulito" (un
tocco, superfici singole), poi il combinato (due tocchi, controllo orientato), poi il libero (freestyle, in
difficoltà), per ultimo la conduzione o il tiro. Il recupero è 60" tra gli esercizi, 120" prima dell'ultimo blocco
(come nei workout di Ste).

## Tabella 1 — Palleggi per gradino della scala [proposta, dosi lette dai workout B1-B3 e A1-A4]

Il livello dell'atleta nei palleggi viene dai test (`test-pall-forte`, `test-pall-debole`, `test-pall-testa`,
`test-piramide`). "Base" sono gli esercizi che ci sono in TUTTE le sedute di quel livello; "a rotazione" quelli che
cambiano di codice in codice (il server ne prende 2 per seduta, seguendo l'ordine della scala).

### Livello B (codici B1 → B2 → B3)

| Ruolo | Esercizio | Id | Dose |
|---|---|---|---|
| base | Laces-Only Juggling | `tpal-palleggi-solo-collo` | 1 × 4' (B3: 2') |
| base | Below-the-Knee Juggling | `tpal-palleggi-sotto-al-ginocchio-tecnica` | 2 × 2' |
| base | Palleggi altezza testa | `test2-palleggi-altezza-testa-tecnica` | 1-2 × 2' |
| base | Laces-Only Juggling: 3 Touches Each Foot | `tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica` | 1 × 5' |
| base | One-Foot Juggling | `tpal-palleggi-solo-un-piede-tecnica` | 2-3 × 2' per piede |
| base | One-Foot Juggling: Inside, Laces, Outside | `tpal-palleggi-1-piede-interno-collo-esterno-tecnica` | 1-2 × 2-3' |
| base | Palleggi solo testa | `pall-7` | 1-2 × 2-3' |
| base | Palleggi freestyle (fascia e tecnica) | `fasc-palleggi-freestyle-tecnica` | 1 × 6' (B3: 7') |
| chiusura | Wall Volleys: Freestyle | `tpal-palleggi-al-muro-liberi-freestyle` | 1 × 6' |
| a rotazione (B2, B3) | Free Juggling with High Kick | `tpal-palleggi-liberi-calcio-alto-tecnica` | 1 × 5' |
| a rotazione (B3) | Inside-Only Juggling | `tpal-palleggi-solo-interno-tecnica` | 1 × 3' |
| **[da decidere]** | Inside-Only Juggling: 3 Touches Each Foot | `tpal-palleggi-solo-interno-3-tocchi-alternati-tecnica` | non è in nessun workout: lo metto in B2? |
| **[da decidere]** | Thigh and Laces Juggling | `tpal-palleggi-coscia-e-collo` | oggi solo nel muro A1: lo metto in B1 come primo esercizio? |

### Livello A (codici A1 → A2 → A3 → A4)

| Ruolo | Esercizio | Id | Dose |
|---|---|---|---|
| base | Wall Volleys: Two Touches | `tpal-palleggi-al-muro-2-tocchi` | 1 × 4' |
| base | Wall Volleys: Inside Control, Laces Pass | `tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass` | 1 × 3-5' |
| base | Wall Volleys: Outside Control, Laces Pass | `tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass` | 1 × 5' |
| base | Laces-Only Juggling: 3 Touches Each Foot | `tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica` | 1 × 4-5' |
| base | One-Foot Juggling: Inside, Laces, Outside | `tpal-palleggi-1-piede-interno-collo-esterno-tecnica` | 1 × 3-5' |
| base | Wall Volleys: Freestyle | `tpal-palleggi-al-muro-liberi-freestyle` | 1 × 6' |
| base | Palleggi freestyle (fascia e tecnica) | `fasc-palleggi-freestyle-tecnica` | 1 × 6' |
| a rotazione (A1) | Laces-Only Juggling | `tpal-palleggi-solo-collo` | 2 × 4' |
| a rotazione (A2) | Wall Volleys: One Touch, Inside Only | `tpal-palleggi-al-muro-1-tocco-solo-interno` | 1-2 × 3' |
| a rotazione (A2) | Wall Volleys: One Touch, Any Surface | `tpal-palleggi-al-muro-1-tocco-libero` | 1-2 × 3' |
| a rotazione (A3, A4) | Freestyle Juggling Between Three Cones | `tpal-palleggi-freestyle-3-conetti` | 1 × 5' |
| a rotazione (A4) | Palleggi piedi, coscia, testa | `test2-palleggi-piedi-coscia-testa` | 1 × 5' |
| a rotazione (A4) | Free Juggling with High Kick | `tpal-palleggi-liberi-calcio-alto-tecnica` | 2 × 5' |
| **[da decidere]** | One-Foot Juggling: Inside/Outside Alternating | `tpal-palleggi-1-piede-alternati-interno-esterno-tecni` | livello A nel catalogo ma in nessun workout: A3? |

### Livello PRO [proposta: non c'è un workout PRO di palleggi]

Come A4 con una serie in più sugli esercizi a un piede e al muro a un tocco, più il freestyle tra i tre coni a 2 × 5'.
**[da decidere]**: Ste, serve una scala PRO sui palleggi, o un PRO ai test fa A4 e il mazzo?

## Tabella 2 — Passaggi al muro per gradino della scala [proposta, dosi lette dai workout base, A1, A2, A3]

Il livello nei passaggi viene da `test-muro` e dai passaggi al palo (`t2-passaggi-palo-forte/debole`). La scala
resta quella di oggi: base → "passaggi e controllo A1" → A1 muro → A2 muro → A3 due tocchi.

### Codice base (tutti i livelli: è il primo gradino)

| Esercizio | Id | Dose |
|---|---|---|
| Wall Passes: Outside Control, Inside Pass | `tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass` | 1 × 3' |
| Free Wall Passes | `tpas-passaggi-liberi-al-muro-tecnica` | 1 × 5' |
| Wall Passes: One Touch, Inside | `tpas-passaggi-al-muro-1-tocco-interno-tecnica` | 1 × 3' |
| Wall Passes: One Touch, Laces | `tpas-passaggi-al-muro-1-tocco-collo-tecnica` | 1 × 4' |
| 10 m Passes with Sole First Touch | `tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn` | 1 × 5' |

### Codice "passaggi e controllo A1"

| Esercizio | Id | Dose |
|---|---|---|
| Thigh and Laces Juggling | `tpal-palleggi-coscia-e-collo` | 1 × 5' |
| Palleggi piedi, coscia, testa | `test2-palleggi-piedi-coscia-testa` | 1 × 5' |
| Wall Passes: 180° Control | `tpas-passaggi-al-muro-controllo-180gradi-tecnica` | 2 × 3' |
| Wall Passes 5-10 m: High and Low | `tpas-passaggi-al-muro-5-10mt-alto-basso` | 2 × 4' |
| Wall Passes: Outside Stop, Laces Pass | `tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag` | 2 × 2' + 3 × 3' |
| Wall Passes: Inside Control and 180° Turn | `tpas-passaggi-al-muro-controllo-interno-turn-180-tecn` | 3 × 2' |

### Codici A1 muro → A2 muro

| Ruolo | Esercizio | Id | Dose |
|---|---|---|---|
| base | Wall Passes: One Touch, Inside | `tpas-passaggi-al-muro-1-tocco-interno-tecnica` | 1 × 5' |
| base | Wall Passes: One Touch, Laces | `tpas-passaggi-al-muro-1-tocco-collo-tecnica` | 1 × 4' |
| base | Wall Passes: Sole Control and Shift | `tpas-passaggi-al-muro-controllo-suola-sposto-palla` | 1 × 3' |
| base | Free Wall Passes | `tpas-passaggi-liberi-al-muro-tecnica` | 1 × 6' |
| chiusura | Box Dribbling and Pass | `tpas-box-dribbling-passaggio` | 2' + 2'30" + 3' |
| A1 | Wall Passes: Outside Control, Inside Pass | `tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass` | 1 × 3' |
| A1 | Wall Passes: Outside Stop, Laces Pass | `tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag` | 1 × 3' |
| A2 | Wall Passes: Inside Control and 180° Turn | `tpas-passaggi-al-muro-controllo-interno-turn-180-tecn` | 1 × 3' |
| A2 | Wall Passes Under Pressure | `tpas-passaggi-al-muro-in-difficolta` | 1 × 4' |
| A2 | Wall Passes 5-10 m: High and Low | `tpas-passaggi-al-muro-5-10mt-alto-basso` | 1 × 5' |

### Codice A3 due tocchi

| Esercizio | Id | Dose |
|---|---|---|
| Wall Volleys: Two Touches | `tpal-palleggi-al-muro-2-tocchi` | 1 × 2' |
| Wall Volleys: Inside Control, Laces Pass | `tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass` | 1 × 4' |
| Wall Volleys: Outside Control, Laces Pass | `tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass` | 1 × 3' |
| Wall Passes: Outside Stop, Laces Pass | `tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag` | 1 × 3' |
| Wall Passes: Two Touches, Inside Control Opening | `tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a-2` | 1 × 4' |
| Wall Passes: Two Touches, Inside Control Closing | `tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a` | 1 × 4' |
| Wall Passes 5-10 m: High and Low | `tpas-passaggi-al-muro-5-10mt-alto-basso` | 1 × 4' |
| Wall Passes Under Pressure | `tpas-passaggi-al-muro-in-difficolta` | 1 × 4' |
| Box Dribbling and Pass | `tpas-box-dribbling-passaggio` | 2' + 2'30" |
| Dribbling with Vision and Reaction: Basic (solo con il video dei segnali) | `tvis-dribbling-visione-e-reattivita-base` | 3 × 4 |

**Non in nessuna scala oggi, [da decidere] dove metterli:** i passaggi ravvicinati interno/esterno e solo collo
(`tpas-passaggi-al-muro-ravvicinati-*`, oggi solo in "passaggi e palleggi A1"), i controlli orientati interno /
esterno / con finta / alzando palla / sombrero (`tpas-passaggi-al-muro-controllo-orientato-*`, `-alzando-palla`,
`-sombrero`, stesso workout). Proposta: diventano il codice **"orientato A1"** tra "passaggi e controllo A1" e "A1
muro", così la scala muro ha sei gradini e i controlli orientati non restano fuori.

## Tabella 3 — `te-base` per livello [proposta]

Tre serie, ~35'. È la seduta di default quando c'è una sola giornata di tecnica e il richiamo ogni 4 settimane.

| Livello | Palleggi (scala) | Passaggi (scala) | Conduzione | Serie |
|---|---|---|---|---|
| B | il primo esercizio "base" del codice corrente (B1: `tpal-palleggi-solo-collo`) | `tpas-passaggi-liberi-al-muro-tecnica` + `tpas-passaggi-al-muro-1-tocco-interno-tecnica` | `cond-6` Box dribbling bassa intensità, 2' | 3 × (3' + 3' + 2' + 2') |
| A | `tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica` + `tpal-palleggi-al-muro-2-tocchi` | `tpas-passaggi-al-muro-1-tocco-collo-tecnica` + `tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag` | `tpas-box-dribbling-passaggio`, 2' | 3 × (3' + 3' + 3' + 3' + 2') |
| PRO | come A, con `tpal-palleggi-1-piede-interno-collo-esterno-tecnica` al posto del muro due tocchi | `tpas-passaggi-al-muro-in-difficolta` al posto dello stop di esterno | `cond-7` Box dribbling intensità alternata, 2' | 3 × |

Con il campo ma senza muro (**[da decidere]**: oggi il catalogo non distingue "muro" da "campo"; serve l'attrezzo
`muro` nel setup?) i passaggi al muro diventano passaggi in coppia (`tpas-tecnica-a-2-*`) se c'è il compagno,
altrimenti `tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn` contro un cinesino.

## Tabella 4 — `te-tiro` [proposta, dai workout "Tiri e Visione" e dalle schede del 15/10]

Il livello nel tiro viene da `t2-tiri-traversa-forte/debole`.

| Livello | Esercizi | Dose |
|---|---|---|
| B | Shooting Technique `ttir-tiri-tecnica-di-tiro` → High Kick and Shot `ttir-calcio-in-alto-e-tiro-in-porta` → Penalty at the Post `ttir-tiri-rigore-al-palo` | 3 × 8 · 2 × 10 · 2 × 10, recupero 60-120" |
| A | Shooting Technique → Shots from the Corner: Cross `ttir-tiri-in-porta-dall-angolo-cross` → Penalty at the Crossbar `ttir-tiri-rigore-alla-traversa` → Shots on Goal with Vision `ttir-tiri-in-porta-e-visione` (solo con il video dei segnali) | 3 × 8 · 2 × 10 · 2 × 10 · 2 × 2' |
| PRO | Shooting Progression `ttir-progressione-tiri-in-porta-tecnica-di-tiro` (la seduta dedicata in 4 esercizi) + Shots on Goal with Vision | 1 × 3 giri · 4 × 2' |

Il piede debole (dai test, `prioritaTecnica` e gli squilibri) raddoppia le ripetizioni col debole sui rigori al palo
e alla traversa.

## Tabella 5 — `te-dribbling` [proposta, dai workout Dribbling A1 e Freestyle dribbling]

| Livello | Esercizi | Dose |
|---|---|---|
| B | Slalom solo interno `cond-1` → Slalom solo esterno `cond-2` → Box dribbling bassa intensità `cond-6` → Box Dribbling and Pass `tpas-box-dribbling-passaggio` | 3 × 6 · 3 × 6 · 2 × 2' · 2 × 1' |
| A | Slalom solo dx / sx `cond-3` → Conduzione 10 m + cambio direzione `cond-5` → Box dribbling intensità alternata `cond-7` → Box Dribbling and Pass | 3 × 6 per lato · 3 × 6 per lato · 3 × 2' · 3 × 1' |
| PRO | come A + Dribbling with Vision and Reaction: Advanced `tvis-dribbling-visione-e-reattivita-avanzato` (solo con il video dei segnali) | + 4 × 8 |

## Tabella 6 — `te-visione` e `te-freestyle` [proposta]

**Visione**: tutti gli esercizi con il video dei segnali (`videoSchermoUrl`: dribbling base e avanzato, passaggi al
muro con visione, tiri con visione, Defender Stance) servono il telefono davanti ai cinesini. Il videocorso base e
intermedio (`tvis-videocorso-visione-esercizi-*`) è a corpo libero e va bene ovunque.

| Livello | Esercizi | Dose |
|---|---|---|
| B | Vision Course: Basic Drills `tvis-videocorso-visione-esercizi-base` → Wall Passes with Vision `tvis-passaggi-al-muro-visione` → Dribbling with Vision: Basic `tvis-dribbling-visione-e-reattivita-base` | 1 × 10' · 3 × 2' · 4 × 6 |
| A / PRO | Vision Course: Intermediate Drills → Wall Passes with Vision → Dribbling with Vision: Advanced → Shots on Goal with Vision | 1 × 10' · 5 × 2' · 4 × 8 · 2 × 2' |

**[da decidere]**: la visione si compone adesso o quando ci saranno tutti i video dei segnali? Oggi i link ci sono
per dribbling base e avanzato, passaggi al muro con visione, tiri con visione e Defender Stance (dal 15/10). Se
basta così, si compone adesso.

**Freestyle** (tutti i livelli, dal workout Tecnica Freestyle): Wall Volleys: Freestyle
`tpal-palleggi-al-muro-liberi-freestyle` 2 × 6' → Freestyle Juggling Between Three Cones
`tpal-palleggi-freestyle-3-conetti` 2 × 3' → Palleggi freestyle `fasc-palleggi-freestyle-tecnica` 2 × 8'; in A e
PRO i minuti al muro salgono a 10 (A1/A2/PRO1 di Ste) e il PRO chiude con `cond-6` 4 × 1' e Box Dribbling and
Pass 2 × 1'.

## Regole che vanno nel codice [proposta]

1. **Composizione**: `costruisciTecnica(ctx)` → blocchi virtuali `te-*` in `ctx.blocchi` accanto ai workout Everfit,
   come `aggiornaParteAlta` / `aggiornaParteBassa`; livello per qualità da `livelloPerQualita('tecnica-*')`, scala
   dalla memoria tecnica (`calcolaMemoriaTecnica`), attrezzatura dal setup (campo; compagno per le varianti a 2;
   `muro` se Ste vuole l'attrezzo nuovo), video dei segnali solo per gli esercizi che ce l'hanno.
2. **Sostituzione**: `sostituzioniFormati` rimpiazza un workout Everfit di tecnica scelto da Claude con il `te-*`
   dello stesso tipo (palleggi → `te-palleggi`, muro → `te-muro`, tiro → `te-tiro`, …), con la nota "sui tuoi
   gradini, al posto di …" nell'hub, come per la parte alta. I codici della scala restano quelli della memoria.
3. **Richiamo**: ogni 4 settimane (la settimana di scarico, `isDeload`) la giornata di tecnica è `te-base`, anche per
   chi è in A3/A4 ("i base tornano": sì, come richiamo).
4. **Priorità dai test**: `prioritaTecnica` decide la scala che va per prima (già così) E dentro `te-base` raddoppia
   le serie della parte debole (palleggi 4 serie e passaggi 2, o il contrario).
5. **Ripasso**: come oggi, in coda, fino a 2 esercizi, dentro il tempo massimo.
6. **Durata**: dentro il tempo per seduta del setup, con la versione breve sotto i 45'.
7. **Piano base e prompt**: il piano base mette i `te-*` prima dei workout Everfit per l'obiettivo tecnica; la
   libreria nel prompt li elenca con i loro esercizi e la regola 28 dice a Claude di preferirli.

## Domande per Ste (si parte dopo)

1. Le tabelle 1 e 2: dosi e ordine vanno bene? Dove mettere i sei esercizi che oggi non sono in nessuna scala
   (palleggi interno 3 tocchi, palleggi coscia e collo, un piede alternati interno/esterno, i ravvicinati, i
   controlli orientati, il sombrero)?
2. Serve un livello PRO sui palleggi o il PRO fa A4 e il mazzo?
3. `te-base` (tabella 3): va bene "palleggi + passaggi + conduzione in 3 serie", e gli esercizi proposti per livello?
4. Serve l'attrezzo "muro" nel setup, o diamo per scontato che chi ha il campo ha un muro?
5. La visione si compone adesso con i video che ci sono, o si aspetta?
6. Il richiamo `te-base` ogni 4 settimane va nella settimana di scarico o in quella dopo?
