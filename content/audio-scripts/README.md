# Audio delle pratiche: copioni, pipeline, stato

Documento di passaggio: una sessione nuova deve poter ripartire da qui senza altro contesto. Aggiornato il 25/10/2026.

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

## Stato al 25/10

| Settimana | Copioni | Audio |
|---|---|---|
| W1 | G1 G2 G3 G4 G6 pronti e letti da Ste | **generati e montati**: `_out/W1-G1-v2.mp3` 3:24 · `W1-G2-v2` 3:35 · `W1-G3-v2` 4:28 · `W1-G4-v2` 7:08 · `W1-G6-v2` 2:35, normalizzati a -16 LUFS. **Da caricare su Supabase e collegare su Notion** (vedi sotto). Ste li ha ascoltati come anteprima e ha detto di andare avanti |
| W2 | G1 G2 G3 G4 G6 scritti sui testi del 23/10 | nessun file montato. In cache 47 dei 111 segmenti (il Reset a tre respiri, l'arrivo e 16 pezzi di G1): mancano 58 segmenti, ~9.000 caratteri. Prima di generare: rileggere i testi su Notion (Ste sta rivedendo) e mandare la tabella dry-run |
| W3-W12 | da scrivere | niente |

Crediti spesi finora: circa 9.000 (W1 e il pilota W2-G1), 2 dollari. Stima per tutto: ~72.000 crediti, ~16 dollari (2,2 centesimi ogni 100 crediti).

## Come si lavora

### 1. Copioni (`W<w>-G<g>.txt`)

Formato: `[sincere]` / `[relaxed]` / `[meditative]` su una riga da sola = registro da lì in poi; `[SILENZIO N]` = silenzio di N secondi; ogni altra riga è letta; righe consecutive senza silenzio in mezzo = un solo segmento. Niente trattini lunghi, niente puntini, niente markdown, niente righe vuote. Si generano da `_build/b1.py` (W1-W2; per le settimane dopo copiarne la struttura) e si controllano con `_build/check3.py '{"W2-G1":5,...}'` (minuti dichiarati), che scrive anche il manifest.

### 2. Piano dei segmenti e cache

`python3 _build/chunks3.py W2-G1 W2-G2 …` (eseguito dentro `_build/`, dove stanno `plan3.json`, `cache/`, `todo.json`): spezza i copioni in segmenti, assegna a ognuno un id (sha1 di `[registro] testo`, 12 caratteri), e scrive in `todo.json` i segmenti NON ancora in `cache/`. I segmenti uguali (Reset, richiami, chiusure) si generano una volta sola.

### 3. Generazione (connettore ElevenLabs, nessuna chiave in questo ambiente)

Per ogni voce di `todo.json`: tool `mcp__Eleven_labs_completo__creative_generate_speech` con `prompt` = la chiave intera (tag compreso), `model_id: eleven_v4`, `voice_id: 5BFc1AtZZpddsxaGhkfC`, `flow_id: kDVIlgbEd8KndSoKXh4P`, `generations_count: 1`. Annotare `id<TAB>session_id` in `_build/sessions3.tsv`. A blocchi di ~20, **fermandosi se Ste dice di aspettare**. Mai ripetere una generazione per "riprovare".

Poi `mcp__Eleven_labs_completo__creative_get_flow_run_status` con `flow_id` e fino a 20 `session_ids`: il risultato (grande) viene salvato dal sistema in `~/.claude/projects/.../tool-results/mcp-Eleven_labs_completo-creative_get_flow_run_status-*.txt`; `python3 _build/fetch3.py` legge quei file, abbina ogni generazione al suo id (dal prompt) e scarica in `cache/`. Gli URL firmati scadono dopo 2 ore: se un file manca, rifare la chiamata di stato per quei session id (un risultato sotto il limite di dimensione non viene salvato su file: in quel caso chiedere lo stato insieme ad altri session id così supera il limite).

### 4. Montaggio

`python3 _build/assemble3.py W2-G1 …` (in `_build/`): trim dei silenzi di testa e coda di ogni segmento (`silenceremove` a -45 dB), 44,1 kHz mono, silenzi da `anullsrc`, concat, MP3 128 kbit/s in `/mnt/user-data/outputs/audio/mp3/` (o altra cartella: cambiare `OUT`). Poi normalizzazione in due passate:

```
ffmpeg -i IN.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null -   # misura
ffmpeg -i IN.mp3 -af "loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…:offset=…:linear=true" -ar 44100 -ac 1 -b:a 128k OUT.mp3
```

(i grezzi escono a -28 LUFS; dopo la normalizzazione -17, la differenza da -16 la fanno i silenzi lunghi). I definitivi vanno in `_out/` finché non sono caricati.

### 5. Caricamento su Supabase

Bucket pubblico `practice-audio`, progetto `njmgkatdpberwhltgbmd`. Script: `python3 _build/upload_supabase.py _out/W1-G1-v2.mp3 …`. Legge le credenziali dall'ambiente: `SUPABASE_S3_ACCESS_KEY_ID` + `SUPABASE_S3_SECRET_ACCESS_KEY` (chiave S3 "claude-audio", solo Storage, da revocare a fine lavoro; endpoint `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/s3`, regione `eu-central-1`) oppure, in alternativa, `SUPABASE_SERVICE_ROLE_KEY` (API REST). Non sovrascrive senza `--force` (solo con l'ok di Ste), non cancella mai. Se nell'ambiente non c'è nessuna chiave: dirlo a Ste (le mette nelle impostazioni dell'ambiente cloud di Claude Code e apre una sessione nuova) oppure, come ripiego, Ste carica i file dal Dashboard (Storage → practice-audio → Upload) e noi scriviamo gli URL. Limite 50 MB per file: i nostri stanno tra 2 e 13 MB.

URL pubblico: `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/object/public/practice-audio/<nome>.mp3` (verificare con una HEAD che risponda 200).

### 6. Collegamento nell'app (Notion)

L'app legge `Audio Pratica` (campo URL) dal DB Giorni: `lib/notion.ts` → `mapGiorno.audioUrl` → `app/giorno/[week]/[day]/page.tsx` → `components/PracticePopup.tsx` (bottone "Ascolta la versione audio", facoltativo; il giorno si completa anche senza; il popup aspetta la fine dell'audio se è più lungo del timer). Scrittura: tool `mcp__Notion__notion-update-page`, `command: update_properties`, `properties: {"Audio Pratica": "<url>"}` sulla pagina del giorno (trovarla con `mcp__Notion__notion-query-data-sources` in SQL: `SELECT url, "Numero Settimana", "Numero Giorno" FROM "collection://03a29261-ad11-4758-a657-c34b4aab56f2" WHERE …`). Cache Notion lato server: l'app lo mostra entro un'ora. Per W1 scrivere gli URL `-v2` solo dopo l'ok definitivo di Ste.

Per la Palestra (dopo il percorso) serve un campo `audioUrl` in `lib/toolsCatalog.ts` e `lib/palestraCatalog.ts` e il passaggio in `app/strumenti/page.tsx` (due punti), più il `tipoPratica` dell'àncora nel dettaglio strumento: oggi non passa niente.

## Cose aperte segnalate a Ste

- W11-G2/G3/G4 citano «le tue risposte qui sotto» e «dal Profilo in Le tue risposte»: funzioni che nell'app non esistono. O si costruiscono (pagina nel Profilo + box sotto le pratiche di W11) o si cambiano i testi. W11 non ha audio, quindi non blocca.
- W10-G2/G3/G4 hanno `Tipo Pratica` = respirazione ma sono esercizi con la palla: il popup mostra il cerchio del respiro in conflitto con l'audio. Da portare a `riflessione` su Notion quando si arriva alla 10 (con l'ok di Ste).
- Le 11 correzioni della Palestra e dei layer SOS in `docs/audio/revisione-pratiche-audio.md` aspettano le sue risposte.

## Cartelle

- `W<w>-G<g>.txt`: i copioni. `manifest_*.tsv`: durate stimate.
- `_out/`: MP3 definitivi in attesa di upload (si tolgono dal repo dopo).
- `_build/`: `cache/` (segmenti di voce), `plan3.json`, `todo.json`, `sessions3.tsv`, gli script `b1.py` `check3.py` `chunks3.py` `fetch3.py` `assemble3.py` `upload_supabase.py`. Temporanea: quando tutto è online si sposta fuori dal repo.
