# Copioni audio delle pratiche

Un file per giorno (`W<w>-G<g>.txt`), scritto dal campo **Pratica** del DB Giorni su Notion (più l'Apertura, letta in voce). Formato:

- `[sincere]`, `[relaxed]`, `[meditative]` su una riga da sola: registro della voce da lì in poi (apertura e riflessione · racconto e chiusura · parte guidata)
- `[SILENZIO N]`: silenzio esatto di N secondi, inserito in montaggio
- ogni altra riga è letta dalla voce; righe consecutive senza silenzio in mezzo sono un unico segmento

Voce ElevenLabs "Stef" (`5BFc1AtZZpddsxaGhkfC`), modello `eleven_v4`, un segmento per generazione con il registro come tag iniziale; montaggio con ffmpeg (trim dei silenzi di testa e coda, silenzi da `anullsrc`, 44,1 kHz mono, 128 kbit/s, loudnorm a -16 LUFS in due passate). Revisione e piano audio: `docs/audio/revisione-pratiche-audio.md`.

## Caricamento su Supabase (bucket `practice-audio`)

I file definitivi (normalizzati, nome `W<w>-G<g>-v2.mp3` per W1, `W<w>-G<g>.mp3` dalle settimane successive) si caricano nel bucket pubblico `practice-audio` del progetto `njmgkatdpberwhltgbmd` con il protocollo S3 di Supabase Storage:

- endpoint `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/s3`, regione `eu-central-1`, path style
- credenziali nelle variabili d'ambiente `SUPABASE_S3_ACCESS_KEY_ID` e `SUPABASE_S3_SECRET_ACCESS_KEY` (chiave S3 "claude-audio", solo Storage; da revocare a fine lavoro)
- mai sovrascrivere un file esistente senza l'ok di Ste; mai cancellare
- URL pubblico risultante: `https://njmgkatdpberwhltgbmd.supabase.co/storage/v1/object/public/practice-audio/<nome>.mp3`, da scrivere nel campo **Audio Pratica** della pagina del giorno sul DB Giorni di Notion (`collection://03a29261-ad11-4758-a657-c34b4aab56f2`); l'app lo mostra entro un'ora (cache Notion lato server)

Gli MP3 non stanno nel repo: vivono nello Storage. I copioni sì.

## Cartelle di lavoro (temporanee, dal 25/10)

- `_out/`: gli MP3 definitivi in attesa di caricamento (W1-G1..G6-v2). Si tolgono dal repo dopo l'upload.
- `_build/`: la cache dei segmenti di voce già generati (`cache/<id>.mp3`, id = sha1 di `[registro] testo`, primi 12 caratteri), il piano dei segmenti (`plan3.json`), i session id ElevenLabs (`sessions3.tsv`, flow `kDVIlgbEd8KndSoKXh4P`) e gli script Python del montaggio (`b1.py` copioni → `chunks3.py` piano e cache → generazione via connettore → `fetch3.py` download → `assemble3.py` montaggio). Servono a non rigenerare i pezzi comuni (Reset, richiami) nelle settimane successive.
