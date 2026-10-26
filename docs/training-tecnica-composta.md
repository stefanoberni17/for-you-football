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

## Le regole di Ste (26/10 sera) — queste comandano

Ste, dopo la prima bozza: "in generale come tecnica andrebbero proposti questi esercizi in questa logica: subito dopo
partita giocata molto: palleggi, passaggi vicino, controllo. 2 giorni prima della partita anche tiro, dribbling,
freestyle. Se giorno prima partita proprio poca roba: max 10 tiri, poco dribbling e un po' palleggi e passaggi. Se dopo
partita fatica leggera allora hai tutto sbloccato. In generale si cerca di fare tiri nella fase centrale/finale della
settimana ma senza troppo volume, eventualmente se richiesto si possono creare sessioni dedicate, ma sempre almeno 2
giorni prima partita. Il resto a rotazione, cercando magari di fare sedute che danno priorità a qualche
aspetto/obiettivo. Gli esercizi possiamo farli durare qualche minuto ma adattabili in base al tempo disponibile.
Abbiamo molta libertà su questo. In generale io cerco di bilanciare così: 25 % palleggi, 25 % controllo/passaggi, 15 %
freestyle, 15 % visione, 10 % dribbling, 10 % tiri; ovviamente si possono adattare ma tiri e dribbling in parte sono
quelli un po' più faticosi fisicamente quindi non troppo alti se non espressamente richiesto e soprattutto da
monitorare fatica e allenamenti/partite."

Quindi NON sedute a formato fisso (`te-base`, `te-tiro`…) ma **una seduta di tecnica composta ogni volta da un budget
di minuti per qualità**, filtrato dall'asse partita e dalla fatica, con una priorità per settimana. Le tabelle 1-6
qui sotto restano come **serbatoio di esercizi per qualità e per livello**, non come sedute pronte.

### Il bilanciamento (sulla settimana, non per forza su ogni seduta)

| Qualità | Quota | Nel catalogo |
|---|---|---|
| Palleggi | 25 % | `tecnica-palleggi` (scala palleggi) |
| Controllo e passaggi | 25 % | `tecnica-passaggi` (scala muro) |
| Freestyle | 15 % | i tre esercizi freestyle (tabella 6) |
| Visione | 15 % | `tecnica-visione` (con o senza il video dei segnali) |
| Dribbling | 10 % | `tecnica-conduzione` + la scala conduzione v1 (`cond-*`) |
| Tiri | 10 % | `tecnica-tiro` |

(Nel messaggio c'è "115 % visione": letto come 15 %, così la somma fa 100.) **Le quote sono circa mensili** (Ste,
seconda nota: "focalizzerei la seduta su una cosa in particolare, non farei mix su tutto"): ogni seduta ha UN tema,
e il bilanciamento si fa sulle ultime 4 settimane, come lo strato mese (`lib/trainingMese.ts`): il server conta i
minuti di tecnica fatti per qualità nelle ultime 4 settimane (dai log, o dal piano per le sedute fatte senza log),
li confronta con le quote e dà alla prossima seduta il tema più indietro; tiri e dribbling non superano la loro quota
mensile se non su richiesta esplicita e scendono per primi quando la fatica (resoconto squadra/partita, check-in) o
il calendario (squadra, partita) lo dicono.

### La struttura di una seduta (Ste, seconda nota)

| Tema | Struttura | Esempio a 45' |
|---|---|---|
| **Tiri** | apertura con **passaggi** per scaldarsi → **qualche dribbling** → **tiri progressivi**: prima il riscaldamento al tiro ("10 palle di destro e 10 di sinistro dal limite dell'area cercando di colpire la traversa", lo stesso gesto del test `t2-tiri-traversa-*`, qui come esercizio), poi gli esercizi di tiro del livello | passaggi al muro 8' → box dribbling 5' → 10 + 10 alla traversa → Shooting Technique 3 × 8 → High Kick and Shot 2 × 10 |
| **Palleggi**, **passaggi/controllo**, **dribbling**, **visione** | prima gli esercizi **analitici** (superfici singole, un tocco, controlli orientati, slalom), poi in **chiusura qualcosa di freestyle** (muro libero, tre coni, palleggi freestyle) | palleggi: solo collo 4' → sotto al ginocchio 2 × 2' → un piede 2 × 2' per piede → 3 tocchi alternati 5' → chiusura freestyle al muro 6' |
| **Freestyle** | è la chiusura delle altre sedute; una seduta tutta freestyle solo quando è il tema più indietro | i tre esercizi freestyle (tabella 6) |

Il riscaldamento al tiro ("10 di destro e 10 di sinistro alla traversa dal limite") va aggiunto al catalogo come
esercizio (**NUOVO**, `ttir-riscaldamento-traversa`, 2 × 10, piede forte e debole), distinto dal test.

### L'asse partita per la tecnica [come l'ho letto, da confermare]

| Giorno | Cosa si fa | Cosa NO |
|---|---|---|
| **+1, partita giocata molto** (intera o senza resoconto, come per le gambe) | palleggi, passaggi vicini (`tpas-passaggi-al-muro-ravvicinati-*`, muro a 1-2 tocchi), controllo | tiri, dribbling, freestyle, visione con sprint |
| **+1, partita con fatica leggera** (`menoAffaticato`, `quantoGiocata` 'meno' o 'quasi non giocato' del resoconto) | tutto sbloccato, quote normali | — |
| **−1 (il giorno prima)** | "proprio poca roba": al massimo 10 tiri, poco dribbling (un esercizio corto), un po' di palleggi e passaggi, ~20-25' in tutto | volume; oggi −1 c'è solo il blocco pre partita: qui la tecnica leggera si può aggiungere o restare al blocco di Ste (**[da decidere]**) |
| **−2** | tutto, anche tiro, dribbling e freestyle | — |
| **centro e fine settimana** (da +2 a −2) | i tiri vanno qui, poco volume (la quota del 10 %); una seduta DEDICATA ai tiri solo su richiesta ("aggiungi tecnica" / chat del preparatore) e sempre ≥ 2 giorni prima della partita | tiri subito dopo la partita o il giorno prima oltre i 10 |

### Priorità e rotazione

- Il **tema** della seduta lo decide la quota mensile più indietro (sopra); a parità o con un motivo pesa la priorità:
  la parte più debole ai test (`prioritaTecnica`), i voti bassi del resoconto (tiro 4/10 → i tiri prima, entro la
  quota), un obiettivo esplicito dal setup o dalla maschera, il ripasso degli esercizi difficili. Mai lo stesso tema
  due sedute di fila se un altro è indietro.
- Gli esercizi durano "qualche minuto" (2-5') e **si adattano al tempo**: con 30' la seduta ha 5-6 esercizi da 3-4',
  con 60' 8-10 esercizi da 4-6' o due serie; la quota resta in percentuale, i minuti cambiano.
- Le **scale** restano: dentro la quota palleggi gli esercizi vengono dal codice corrente della scala palleggi
  (tabella 1), dentro la quota passaggi dal codice della scala muro (tabella 2); il giudizio di fine seduta fa avanzare
  il codice come oggi.

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

## Tabella 3 — i fondamentali per livello [proposta: era `te-base`, ora è il serbatoio per le quote palleggi + passaggi + conduzione nella settimana di scarico e nei richiami]

Con le regole di Ste non è più una seduta fissa: è l'elenco "minimo" per livello da cui il server pesca quando la seduta è corta (30') o nella settimana di scarico.

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

## Regole che vanno nel codice [proposta, riscritta sulle regole di Ste]

1. **Un tema per seduta, quote mensili**: `temaTecnica(storico4Settimane, quote, asse, priorita)` (puro) sceglie il
   tema della prossima seduta = la qualità più indietro rispetto alla sua quota sui minuti fatti nelle ultime 4
   settimane (log per serie; per le sedute senza log, il piano), escluse le qualità vietate quel giorno dall'asse
   partita e dalla fatica (resoconto: fatica alta o 2 giorni leggeri → niente tiri né dribbling); tiri e dribbling non
   superano la quota mensile se non su richiesta.
2. **Composizione**: `costruisciTecnica(ctx, { giorno, minuti, tema })` → UN blocco virtuale `te-<tema>` con la struttura
   della tabella: tiri = passaggi (riscaldamento) → un dribbling → riscaldamento alla traversa → tiri del livello;
   gli altri temi = analitici dal serbatoio per livello e dal codice della scala → chiusura freestyle. Gli esercizi
   durano 2-5' e si allungano o accorciano per far tornare i minuti della seduta. Entra in `ctx.blocchi` accanto ai
   workout Everfit, come `aggiornaParteAlta` / `aggiornaParteBassa`.
3. **Sostituzione**: `sostituzioniFormati` rimpiazza un workout Everfit di tecnica scelto da Claude con il `te-*` di
   quel giorno (nota "composta sui tuoi gradini, al posto di …"); i workout restano in libreria e nel prompt.
4. **Asse partita**: +1 dopo una partita giocata molto → solo palleggi, passaggi vicini, controllo; −1 → al massimo 10
   tiri, un esercizio di dribbling, palleggi e passaggi, ~20-25'; da −2 tutto; dopo una partita con fatica leggera
   tutto. Una seduta dedicata ai tiri solo su richiesta e mai a meno di 2 giorni dalla partita (errore di `expandPiano`).
5. **Ripasso**: come oggi, in coda, fino a 2 esercizi, dentro il tempo.
6. **Durata**: dentro il tempo per seduta del setup; la tecnica resta giornata leggera (tipo `tecnica`).
7. **Prompt e piano base**: la regola 28 dice a Claude che la tecnica è composta dal server (sceglie solo il giorno e,
   se vuole, il tema); il piano base mette i `te-*` prima dei workout Everfit per l'obiettivo tecnica.
8. **Monitoraggio**: le quote di tiri e dribbling fatte davvero (dai log) entrano nel prompt della settimana dopo, così
   "da monitorare fatica e allenamenti/partite" ha un numero.

## Le risposte di Ste (26/10 sera) e cosa c'è nel codice

1. **Asse partita**: a −1 la tecnica leggera **si aggiunge come facoltativa** al blocco pre partita se la tecnica è tra
   gli obiettivi (nel piano base: venerdì = blocco pre partita + `te-leggera`); il "dopo partita giocata molto" vale a
   +1 sempre e a +2 solo con fatica ≥ 9 o fastidio nel resoconto (la mia lettura, confermata con "ok").
2. **I sei esercizi fuori scala**: ok la proposta → la scala muro ha il codice **"orientato A1"** (il workout "passaggi e
   palleggi A1": ravvicinati, controlli orientati, alzando palla, sombrero) in terza posizione; palleggi interno 3 tocchi
   in B2, coscia e collo in B1, un piede alternato in A3.
3. **PRO sui palleggi**: non esiste una scala PRO, il PRO fa gli esercizi dell'A (magari meglio) → `te-palleggi` per un
   PRO è l'A4 con gli stessi esercizi.
4. **Attrezzo "muro"**: sì → chip "Un muro per passaggi e palleggi" nel setup (`ATTREZZATURA_OPZIONI`); chi ce l'ha lo
   spunta; senza muro i passaggi diventano in coppia (con il compagno) o a 10 m contro un cinesino, i palleggi al muro
   diventano palleggi a terra.
5. **Visione**: si compone adesso con dribbling base/avanzato e passaggi al muro con i segnali, ma **leggera**: "se
   fatti ad alta intensità sono molto pesanti, quindi va fatto leggero concentrandosi sulla tecnica, magari alternando
   cambi di ritmo a scelta propria ma senza andare mai in affanno; durata non troppo lunga (qualche minuto) e recupero
   bene" → nota `NOTA_VISIONE` sugli esercizi, serie da 2' con 90" di recupero; il tiro con visione "è abbastanza
   impegnativo" → solo dal livello A, 2 serie, recupero 2'; la Defender Stance "ha anche degli sprint" → resta nella
   velocità, fuori dalla tecnica. Sul canale YouTube non ci sono video nuovi dal 22/9 (riscansione del 26/10): i due di
   visione non ancora in catalogo sono "Video colori bianco nero" (`bCEnWPJzp_8`) e "Visione periferica e tecnica"
   (`Bj07bevdQ5A`); gli altri Ste deve ancora caricarli.

**Nel codice (26/10 sera):** `lib/trainingTecnicaComposta.ts` (puro, 15 test in `tests/trainingTecnicaComposta.test.ts`):
`costruisciTecnica` (un `te-<tema>` per tema + `te-leggera`, al livello e sul codice delle scale, con `adattaAlTempo`),
`contaTemi` / `ultimoTemaTecnica` / `temaProssimo` (quote mensili, un tema per seduta), `asseTecnica`, l'esercizio nuovo
`ttir-riscaldamento-traversa`; nel planner `aggiornaTecnica`, `asseTecnicaDi`, `tecnicaPerGiorno`, `sostituzioniTecnica`,
i controlli in `expandPiano`, il piano base e la regola 28b (`PLANNER_V2_PROMPT_VERSION = 'v2.38-tecnica-composta'`);
il validatore fida i `te-*`. I dettagli in CLAUDE.md ("Tecnica composta dal catalogo"). Non ancora: la card delle quote
nell'hub, la seduta dedicata ai tiri su richiesta dalla maschera (oggi dalla chat del preparatore o dalla nota della
richiesta), gli altri video di visione.

## Domande per Ste (risposte il 26/10 sera, vedi sopra)

1. L'asse partita come l'ho letto (tabella sopra) è giusto? In particolare: a −1 la tecnica leggera si AGGIUNGE al blocco
   pre partita o lo sostituisce? E "subito dopo partita giocata molto" vale solo a +1 o anche a +2 quando la fatica
   del resoconto è alta?
2. ~~Le quote valgono sulla settimana o su ogni seduta?~~ Risposto: circa mensili, una seduta centrata su un tema; a volte due temi si combinano (Ste, 26/10 sera: "non è obbligatorio un tema per seduta, si possono combinare anche un po' a volte"). Nel codice: `te-mix-<primo>-<secondo>` quando due temi tra palleggi, passaggi, visione e dribbling sono indietro insieme e la seduta ha almeno 40'; conta 2/3 e 1/3. La seduta di tiri è sempre combinata (Ste, 26/10 sera: "apertura passaggi e stop, dribbling e finale con tiri; una sessione dedicata solo ai tiri è lunga, i tiri sono faticosi alla lunga per i muscoli"): due esercizi di passaggi e stop, due di dribbling, il riscaldamento alla traversa, al massimo 20 tiri in fondo; conta metà tiri, un quarto passaggi, un quarto dribbling.
3. Il serbatoio di esercizi per livello (tabelle 1, 2, 4, 5, 6) va bene? Dove mettere i sei esercizi oggi fuori da ogni
   scala (interno 3 tocchi, coscia e collo, un piede alternato, i ravvicinati, i controlli orientati, il sombrero)?
4. Serve un livello PRO sui palleggi o il PRO fa A4 e il mazzo?
5. Serve l'attrezzo "muro" nel setup, o chi ha il campo ha un muro?
6. La visione si compone adesso con i video che ci sono, o si aspetta?
