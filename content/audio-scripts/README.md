# Audio delle pratiche: copioni, pipeline, stato

Documento di passaggio: una sessione nuova deve poter ripartire da qui senza altro contesto. Aggiornato il 26/10/2026.

## Decisioni prese con Ste (non rimetterle in discussione)

- **Voce** ElevenLabs **"Stef"** (`5BFc1AtZZpddsxaGhkfC`, PVC registrata il 22/10), modello **`eleven_v4`**. Non "Stefano 2", non v3.
- **Tre registri**, uno per segmento, come tag iniziale del prompt: `[sincere]` apertura e riflessioni, `[relaxed]` racconto in prima persona, battute e la chiusura "metti in pausa e scrivi nell'app", `[meditative]` tutta la parte guidata (Siediti, respiri, richiami, "Bene. Torna qui."). Niente altri tag.
- **Apertura dentro l'audio**: la storia di Ste si legge in voce, poi la pratica. Le parti in cui il ragazzo scrive nell'app restano fuori ("metti in pausa e scrivi nell'app").
- **Testi**: il copione dice ESATTAMENTE la pratica del campo `Pratica` di Notion di OGGI (stessi passi, numeri, minuti), più l'`Apertura`. Prima di ogni settimana si rileggono i testi dal DB Giorni (`collection://03a29261-ad11-4758-a657-c34b4aab56f2`): Ste li sta ancora rivedendo. Se nel testo c'è qualcosa che in audio non si può dire, non si cambia: si segnala a Ste.
- **Silenzi** (esatti, inseriti in montaggio): dopo "Inspira…" 4 s, dopo "Espira…" 6 s, dopo "Rilascia." 2 s; tra due istruzioni 2-3 s; dopo una domanda di osservazione 8-12 s; scene e silenzi dichiarati = la durata dichiarata, spezzata da un richiamo breve ogni 30-45 s con il totale uguale; W10 con la palla: solo il ritmo (via, stop, pause).
- **Canone del Reset**: gesto pollice-indice unito sull'inspirazione e tenuto per tutto il respiro, mantra sull'espirazione, rilascio a fine espirazione; occhi aperti su un punto fisso. Protocollo breve: "senti il tuo segnale nel corpo, dai un nome al pensiero, un respiro con gesto e mantra".
- **Ordine**: una settimana alla volta. Per ogni settimana: copioni + tabella dry-run (giorno, segmenti, caratteri, durata stimata vs `Durata Minuti`) → ok di Ste → generazione → montaggio → upload → link su Notion → Ste ascolta. Poi la successiva. Dopo la generazione si allinea `Durata Minuti` su Notion alla durata dell'audio arrotondata per eccesso (è il timer del popup).
- **W1**: gli MP3 vecchi (`W1-G1.mp3`…`W1-G6.mp3`, voce vecchia, testi superati) restano nello storage finché Ste non approva; i nuovi si chiamano `W1-G<n>-v2.mp3`. W1-G5 resta senza audio.
- **Giorni con audio (46)**: W1 G1 G2 G3 G4 G6(breve) · W2 G1 G2 G3 G4 G6 · W3 G1 G2 G3 G4 G6(breve) · W4 G1 G2 G3 G4 G5 · W5 G1 G2 G3 G4 G6 · W6 G1 G2 G3 G4 · W7 G3 G4 G6(breve) · W8 G1 G2(breve) G3 G4 · W9 G1 G2 · W10 G1 G2 G3 G4 · W11 nessuno · W12 G1 G2 G3 G4. Nessun altro. "Breve" = 1-2 minuti, solo il cuore della pratica. Poi, a parte, 16 audio della Palestra (vedi `docs/audio/revisione-pratiche-audio.md`, che ha anche il perché di ogni sì/no).
- **Chiavi**: solo variabili d'ambiente, mai in chat, repo o log.

## Stato al 26/10

| Settimana | Copioni | Audio |
|---|---|---|
| W1 | G1 G2 G3 G4 G6 letti da Ste | **online e collegati** (26/10): `W1-G1-v2.mp3` 3:25 · `W1-G2-v2` 3:36 · `W1-G3-v2` 4:29 · `W1-G4-v2` 7:08 · `W1-G6-v2` 2:36 nel bucket `practice-audio`, URL nel campo `Audio Pratica` dei cinque giorni, `Durata Minuti` di W1-G1 portata da 3 a 4 (gli altri già allineati). I vecchi `W1-G1.mp3`…`W1-G6.mp3` restano nello storage ma nessuna pagina li usa più: si possono cancellare dal Dashboard quando Ste vuole |
| W2 | G1 G2 G3 G4 G6 **riscritti il 26/10 sui testi Notion del 25/10** (W2-G1 "così capisci di cosa parliamo", "Non è un quiz"; W2-G2 le tre domande una alla volta e "sei rimasto attaccato a un pensiero"; W2-G3 "se prima della pratica hai scritto una frase… lavori su quella", trenta secondi senza discuterlo; W2-G4 via il ciclo inspira-nomina-espira, "il respiro va per conto suo", la nuvola facoltativa; W2-G6 "non devi decidere se hai pensato bene o male"). Il Reset resta a tre respiri come nel pilota ascoltato da Ste; "Non doveva sparire niente. Dovevi solo vederlo." (G1) è l'unica riga non presa dal testo, era nel pilota | **online e collegati** (26/10): `W2-G1.mp3` 5:33 · `W2-G2` 5:47 · `W2-G3` 5:07 · `W2-G4` 8:11 · `W2-G6` 4:29, -17 LUFS; `Durata Minuti` allineata all'audio: G1 5→6, G2 5→6, G3 7→6, G4 10→9, G6 4→5. 62 segmenti generati (circa 7.700 crediti, 1,70 dollari), 14 presi dalla cache. **Ste non li ha ancora ascoltati**: se una frase non gli suona, si cambia il copione in `_build/b1.py`, si rigenera solo quel segmento e si rimonta |
| W3 | G1 G2 G3 G4 G6(breve) **scritti il 26/10** sui testi Notion (Body Check zona per zona con 8-10" di silenzio su ognuna, canone piedi → stomaco → petto → spalle; W3-G2 scena 30" + Body Check + Reset + Body Check; W3-G3 la firma del gioco libero con le tre domande della scena e i cinque posti del corpo a 10"; W3-G4 le tre fasi dette a voce "Fase uno: come stai adesso. Due minuti." e la sequenza ripetuta tre volte con `giro_g4()`, l'avviso "se qualcosa pesa più del previsto, fermati" spostato PRIMA della fase due; W3-G6 solo apertura + tre Reset + un Body Check). Nessuna riga inventata: solo i testi di Notion riletti per la voce ("..." → punti, "4 a 1" → "quattro a uno", "30 secondi" → "trenta secondi") | **online e collegati** (26/10): `W3-G1.mp3` 4:37 · `W3-G2` 6:37 · `W3-G3` 7:21 · `W3-G4` 15:43 · `W3-G6` 3:54, -17 LUFS; `Durata Minuti` allineata all'audio: G1 5, G2 6→7, G3 6→8, G4 14→16, G6 4. 89 segmenti generati (circa 10.500 crediti, 2,30 dollari), 10 presi dalla cache (RESET3, "Siediti…"). **Ste non li ha ancora ascoltati.** Da sapere: W3-G4 dura 15:43 contro i 14 dichiarati perché le tre fasi (2+4+6) sono rispettate e l'apertura, i passaggi e la chiusura fanno il resto; se vuole 14 minuti netti si accorciano i silenzi dei tre giri in `giro_g4()` e si rimonta senza spendere crediti (i segmenti sono in cache) |
| W4 | G1 G2 G3 G4 G5 **scritti il 26/10** sui testi Notion (G6 e G7 senza audio, come da revisione). W4-G1 scena 30" + le due domande fuori/dentro con 10" l'una + l'esempio + Body Check + Observer + Reset; W4-G2 la ricerca del segnale con le tre domande a 12"; W4-G3 apertura lunga (la Reggiana ripresa da W3-G2, il parco con gli amici) + scena 30" + Senti / Nota / Torna; W4-G4 i cinque passi detti a voce ("Uno. La scena.", "Due. Senti." …), l'avviso "se qualcosa pesa più del previsto, fermati" una volta sola PRIMA di iniziare (su Notion è due volte), le parti facoltative ("Se vuoi andare oltre") NON in audio ma richiamate con una riga ("i passi sono scritti qui sotto nell'app", l'unica riga non di Notion); W4-G5 le due righe d'ingresso della Pratica lette in [relaxed] prima dell'arrivo, le due domande a 12", esempio, Body Check, Reset | **online e collegati** (26/10): `W4-G1.mp3` 7:00 · `W4-G2` 4:27 · `W4-G3` 7:13 · `W4-G4` 8:03 · `W4-G5` 6:21, -17 LUFS; `Durata Minuti` allineata all'audio: G1 7, G2 6→5, G3 6→8, G4 10→9, G5 7. 81 segmenti generati (circa 11.000 crediti, 2,40 dollari), 10 dalla cache. **Ste non li ha ancora ascoltati** |
| W5 | G1 G2 G3 G4 G6 **scritti il 26/10** sui testi Notion (G5 giornata e G7 senza audio). W5-G1 la catena pensiero → corpo → impulso con le tre domande a 10-12" (i puntini di Notion diventano frasi intere, "4 a 1" detto a parole); W5-G2 l'istante tra impulso e azione, con il Reset dentro la scena (un respiro guidato, `RESET1`); W5-G3 la voce dopo l'errore e il test del compagno, con la storia delle punizioni al campetto in [relaxed] (le parole pesanti restano com'erano su Notion); W5-G4 lo Stacco sui tre errori: il primo guidato passo per passo (L'errore / È successo / Il Reset / La prossima azione), il secondo e il terzo con i soli richiami e i silenzi (12/6/14/12"), prima la storia del terzino e della punizione al novantesimo; W5-G6 il bilancio della settimana con le tre domande a voce. L'avviso "se ti smuove più del previsto, fermati, fai un Reset" resta in ogni giorno | **online e collegati** (26/10): `W5-G1.mp3` 6:54 · `W5-G2` 5:21 · `W5-G3` 5:01 · `W5-G4` 8:43 · `W5-G6` 4:07, -17 LUFS; `Durata Minuti` allineata all'audio: G1 5→7, G2 5→6, G3 5→6, G4 12→9, G6 4→5. 94 segmenti generati (circa 13.300 crediti, 2,90 dollari), 11 dalla cache. **Ste non li ha ancora ascoltati** |
| W6-W12 | da scrivere | niente |

Crediti spesi finora: circa 51.500 (W1, pilota W2-G1, W2, W3, W4, W5), 11,30 dollari. Stima per il resto (W6-W12, 21 giorni): ~28.000 crediti, ~6 dollari.

Il tempo di una settimana, misurato su W2: copioni e dry-run 20 minuti, generazione dei segmenti 5 minuti (tre blocchi di ~20 chiamate), montaggio e normalizzazione 4 minuti, upload e Notion 2 minuti.

## Come si lavora

### 1. Copioni (`W<w>-G<g>.txt`)

Formato: `[sincere]` / `[relaxed]` / `[meditative]` su una riga da sola = registro da lì in poi; `[SILENZIO N]` = silenzio di N secondi; ogni altra riga è letta; righe consecutive senza silenzio in mezzo = un solo segmento. Niente trattini lunghi, niente puntini, niente markdown, niente righe vuote. Si generano da `_build/b1.py` (W1-W2; per le settimane dopo copiarne la struttura; dal 26/10 scrive in `content/audio-scripts/`, non più in `/mnt/user-data`) e si controllano con `_build/check3.py '{"W1-G1":4,…,"W2-G6":5}'` (minuti dichiarati, TUTTI i giorni con audio: il manifest viene riscritto da zero a ogni corsa).

### 2. Piano dei segmenti e cache

`python3 _build/chunks3.py W2-G1 W2-G2 …` (eseguito dentro `_build/`, dove stanno `plan3.json`, `cache/`, `todo.json`): spezza i copioni in segmenti, assegna a ognuno un id (sha1 di `[registro] testo`, 12 caratteri), e scrive in `todo.json` i segmenti NON ancora in `cache/`. I segmenti uguali (Reset, richiami, chiusure) si generano una volta sola.

### 3. Generazione (connettore ElevenLabs, nessuna chiave in questo ambiente)

Per ogni voce di `todo.json`: tool `mcp__Eleven_labs_completo__creative_generate_speech` con `prompt` = la chiave intera (tag compreso), `model_id: eleven_v4`, `voice_id: 5BFc1AtZZpddsxaGhkfC`, `flow_id: kDVIlgbEd8KndSoKXh4P`, `generations_count: 1`. Annotare `id<TAB>session_id` in `_build/sessions3.tsv`. A blocchi di ~20, **fermandosi se Ste dice di aspettare**. Mai ripetere una generazione per "riprovare".

Poi `mcp__Eleven_labs_completo__creative_get_flow_run_status` con `flow_id` e fino a 20 `session_ids`: il risultato (grande) viene salvato dal sistema in `~/.claude/projects/.../tool-results/mcp-Eleven_labs_completo-creative_get_flow_run_status-*.txt`; `python3 _build/fetch3.py` legge quei file (dal 26/10 cerca da solo la cartella `tool-results` più recente, oppure `TOOL_RESULTS_DIR=…`), abbina ogni generazione al suo id (dal prompt) e scarica in `cache/`. Gli URL firmati scadono dopo 2 ore: se un file manca, rifare la chiamata di stato per quei session id (un risultato sotto il limite di dimensione non viene salvato su file: in quel caso chiedere lo stato insieme ad altri session id così supera il limite, oppure scaricare a mano con `curl` l'URL `content_url` che il risultato mostra in chat, come fatto il 26/10 per gli ultimi due segmenti di W2).

### 4. Montaggio

`python3 _build/assemble3.py W2-G1 …` (in `_build/`): trim dei silenzi di testa e coda di ogni segmento (`silenceremove` a -45 dB), 44,1 kHz mono, silenzi da `anullsrc`, concat, MP3 128 kbit/s in `_build/raw3/` (grezzi, fuori dal repo). Poi normalizzazione in due passate:

```
ffmpeg -i IN.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -   # misura
ffmpeg -i IN.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…:offset=…:linear=true" -ar 44100 -ac 1 -b:a 128k OUT.mp3
```

(i grezzi escono a -28 LUFS; dopo la normalizzazione -17, la differenza da -16 la fanno i silenzi lunghi). I definitivi vanno in `_out/` finché non sono caricati; `_out/` e `raw3/` sono fuori da git dal 26/10 (i cinque di W1 erano stati messi nel branch solo per passarli alla sessione con le chiavi).

### 5. Caricamento su Supabase

Bucket pubblico `practice-audio`, progetto `njmgkatdpberwhltgbmd`. Script: `python3 _build/upload_supabase.py _out/W1-G1-v2.mp3 …`. Legge le credenziali dall'ambiente: `SUPABASE_S3_ACCESS_KEY_ID` + `SUPABASE_S3_SECRET_ACCESS_KEY` (chiave S3 "claude-audio", solo Storage, da revocare a fine lavoro; endpoint `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/s3`, regione **`us-east-1`**: con `eu-central-1` la firma viene rifiutata, verificato il 26/10) oppure, in alternativa, `SUPABASE_SERVICE_ROLE_KEY` (API REST). Non sovrascrive senza `--force` (solo con l'ok di Ste), non cancella mai. Se nell'ambiente non c'è nessuna chiave: dirlo a Ste (le mette nelle impostazioni dell'ambiente cloud di Claude Code e apre una sessione nuova) oppure, come ripiego, Ste carica i file dal Dashboard (Storage → practice-audio → Upload) e noi scriviamo gli URL. Limite 50 MB per file: i nostri stanno tra 2 e 13 MB.

URL pubblico: `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/object/public/practice-audio/<nome>.mp3` (verificare con una HEAD che risponda 200).

### 6. Collegamento nell'app (Notion)

L'app legge `Audio Pratica` (campo URL) dal DB Giorni: `lib/notion.ts` → `mapGiorno.audioUrl` → `app/giorno/[week]/[day]/page.tsx` → `components/PracticePopup.tsx` (bottone "Ascolta la versione audio", facoltativo; il giorno si completa anche senza; il popup aspetta la fine dell'audio se è più lungo del timer). Scrittura: tool `mcp__Notion__notion-update-page`, `command: update_properties`, `properties: {"Audio Pratica": "<url>"}` sulla pagina del giorno (trovarla con `mcp__Notion__notion-query-data-sources` in SQL: `SELECT url, "Numero Settimana", "Numero Giorno" FROM "collection://03a29261-ad11-4758-a657-c34b4aab56f2" WHERE …`). Cache Notion lato server: l'app lo mostra entro un'ora. W1-W5 sono collegati dal 26/10 (Ste: "carica W1 su Supabase, poi settimana 2", poi "vai con w3", "vai con w4", "vai w5"). Dove stanno le cose, per non confondersi: gli MP3 sono su Supabase Storage (bucket `practice-audio`), Notion ha SOLO il link nel campo `Audio Pratica`; l'app legge il link da Notion e il ragazzo scarica il file da Supabase.

Per la Palestra (dopo il percorso) serve un campo `audioUrl` in `lib/toolsCatalog.ts` e `lib/palestraCatalog.ts` e il passaggio in `app/strumenti/page.tsx` (due punti), più il `tipoPratica` dell'àncora nel dettaglio strumento: oggi non passa niente.

## Cose aperte segnalate a Ste

- W11-G2/G3/G4 citano «le tue risposte qui sotto» e «dal Profilo in Le tue risposte»: funzioni che nell'app non esistono. O si costruiscono (pagina nel Profilo + box sotto le pratiche di W11) o si cambiano i testi. W11 non ha audio, quindi non blocca.
- W10-G2/G3/G4 hanno `Tipo Pratica` = respirazione ma sono esercizi con la palla: il popup mostra il cerchio del respiro in conflitto con l'audio. Da portare a `riflessione` su Notion quando si arriva alla 10 (con l'ok di Ste).
- Le 11 correzioni della Palestra e dei layer SOS in `docs/audio/revisione-pratiche-audio.md` aspettano le sue risposte.

## Cartelle

- `W<w>-G<g>.txt`: i copioni. `manifest_*.tsv`: durate stimate.
- `_out/`: MP3 definitivi in attesa di upload (fuori da git dal 26/10: restano solo nella sessione che li ha montati; quello che conta è online e in `cache/`).
- `_build/`: `cache/` (segmenti di voce), `plan3.json`, `todo.json`, `sessions3.tsv`, gli script `b1.py` `check3.py` `chunks3.py` `fetch3.py` `assemble3.py` `upload_supabase.py`. Temporanea: quando tutto è online si sposta fuori dal repo.
