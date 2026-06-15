# 06 — SPEC scrittura Notion (CONTRATTO per gli agenti)

> Regole NON negoziabili per creare le pagine settimana/giorno su Notion senza rompere la lettura dell'app. Sbagliare il formato = testo che esce tutto attaccato o property vuote.

## Tool e parent
- Tool: `notion-create-pages` (creazione), `notion-update-page` (fix), `notion-fetch` (verifica). Carica via ToolSearch query "notion".
- **DB GIORNI** → parent `{ "type": "data_source_id", "data_source_id": "03a29261-ad11-4758-a657-c34b4aab56f2" }`
- **DB SETTIMANE** → parent `{ "type": "data_source_id", "data_source_id": "941ff642-d437-4ab0-bc87-c6bbb601475b" }`
- Il `content` (body pagina) lascialo VUOTO (stringa ""). L'app legge SOLO le properties, non il body.

## ⚠️ REGOLA D'ORO — a-capo come `<br>`
L'app legge `rich_text[0].plain_text` e fa `.replace(/<br>/g,'\n')`. Quindi OGNI campo testo deve essere **UNA sola stringa**, con gli a-capo scritti come **`<br>` letterale** — MAI newline veri (`\n`). Un break di riga = `<br>`. Un break di paragrafo (riga vuota nel sorgente) = `<br><br>`.
Esempio: il sorgente
```
> Riga uno.
>
> Riga due.
```
diventa la stringa: `Riga uno.<br><br>Riga due.`

## Tipi property (modello SQLite del tool)
- Testo → stringa (con `<br>`). Campi testo GIORNI: `Apertura`, `Pratica`, `Contesto`, `Domanda`, `Nota Campo`, `Testo Check`, `Domanda Pre Pratica`, `Missione Settimana`, `Domande Gate`. Campi testo SETTIMANE: `Strumento`, `Descrizione Intro`, `Obiettivo Settimana`, `Messaggio Chiusura`, `Coach Contesto`, `Mantra Dashboard`, `Pratica Pre Partita`, `Frase Settimana`.
- Numero → numero JS (non stringa): `Numero Settimana`, `Numero Giorno`, `Durata Minuti`, `Durata Inspira`, `Durata Espira`.
- Checkbox → `"__YES__"` o `"__NO__"`: `È Gate`, `È Esercizio Principale`, `Ha Nota Campo`, `Ha Check Precedente`.
- Select (valore ESATTO):
  - GIORNI `Tipo Giorno` ∈ [`Standard`, `Esercizio Principale`, `Nota Campo`, `Gate`, `Riflessione`]
  - GIORNI `Tipo Pratica` ∈ [`respirazione`, `visualizzazione`, `riflessione`, `giornata`]
  - SETTIMANE `Blocco` = `2 — Giocare nelle difficoltà`
  - SETTIMANE `Principio` ∈ [`Presenza`, `Osservazione`, `Ascolto`, `Accettazione`, `Lasciare Andare`, `Perdono`, `Ritornare al Centro`] — NB: usa `Accettazione` anche per "Accettazione (pt.2)"; `Perdono` per W7; `Lasciare Andare` per W8.
  - SETTIMANE `Stato` = `In arrivo`
- Title → property name `Titolo` (stringa).
- `Audio Pratica` → ometti (vuoto).
- **NON impostare la property `Settimana` (relation)** — l'app lega i giorni per `Numero Settimana`. Lasciala vuota.

## Domande Gate (solo G7)
Le 3 domande in UNA stringa, separate da `<br>`, ognuna col suo numero. Es: `1. Prima domanda...<br>2. Seconda...<br>3. Terza...`. (L'app fa split su newline.)

## Tipo Giorno — mappatura
G4 → `Esercizio Principale` · G7 → `Gate` · il giorno con Nota Campo (di solito G2) → `Nota Campo` · il giorno di sola riflessione/sosta (di solito G6) → `Riflessione` · tutti gli altri → `Standard`. (Segui il campo "Tipo Giorno" indicato nel file W{n}.md.)

## Property per ogni GIORNO (ometti quelle non applicabili)
`Titolo`, `Numero Settimana`, `Numero Giorno`, `Tipo Giorno`, `Tipo Pratica`, `Durata Minuti`, `Apertura`, `Pratica`, `Domanda`, `Contesto` (sempre). + `Ha Nota Campo`=__YES__ e `Nota Campo` (se previsto). + `Ha Check Precedente`=__YES__ e `Testo Check` (se previsto). + `Domanda Pre Pratica` (se prevista). + `È Esercizio Principale`=__YES__ (solo G4). + `È Gate`=__YES__, `Domande Gate`, `Missione Settimana` (solo G7; il G7 NON ha `Apertura`/`Pratica`/`Domanda` standard — usa solo l'Apertura come testo del gate se il file la prevede: mettila in `Apertura`). I checkbox non applicabili: ometti o `__NO__`.

## Estrazione dal file W{n}.md
Ogni giorno nel file ha le property elencate come `- **Nome:**` seguite dal testo (righe con prefisso `> `). Per ogni campo: prendi il testo, togli i prefissi `> `, e converti la struttura a-capo in `<br>`/`<br>` come da REGOLA D'ORO. Copia il testo VERBATIM (è già finale e approvato). Il titolo del giorno è nell'intestazione `### W{n}-G{d} — {Titolo}` → usa esattamente quello come `Titolo`.

## VERIFICA (obbligatoria dopo la creazione)
Dopo aver creato le pagine, `notion-fetch` su 1 giorno con Apertura multi-paragrafo e sul G7, e CONTROLLA: (a) l'Apertura/Pratica contengono i `<br>` (non sono un blob senza separazioni né testo troncato al primo paragrafo); (b) i checkbox e i select hanno i valori giusti; (c) le Domande Gate contengono i `<br>` tra le 3. Se qualcosa è storto, correggi con `notion-update-page` (command update_properties).
