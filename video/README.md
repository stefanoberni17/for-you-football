# Reel For You Football (Remotion)

Montaggio dei video in cui parla Ste (Reel Instagram, lancio dell'app). Progetto separato dall'app: ha il suo `package.json`, il suo `tsconfig` e il suo lint; l'app lo esclude da typecheck e lint. I video di tecnica (esercizi) NON passano da qui: lì bastano voce e sottotitoli semplici con ffmpeg.

Remotion è gratuito per persone singole e aziende fino a 3 dipendenti (licenza nel pacchetto `remotion`).

## Lo stile (approvato da Ste il 22/11/2026)

- **Formato:** verticale 1080×1920, 30 fps.
- **Volto nella parte medio-alta:** il centro del volto a un terzo dello schermo (`VOLTO_TARGET_Y = 0.36` in `src/reel/montaggio.ts`). `inquadratura()` sposta e zooma attorno al volto senza mai scoprire i bordi.
- **Zoom alternato a ogni taglio:** largo 1.24, stretto 1.40, più un lento avvicinamento dentro ogni pezzo (+3 %). Un pezzo può forzare `stretto: true/false`.
- **Tagli:** si tengono solo i pezzi parlati; via pause, intercalari ("eh"), inizio e fine fuori campo, frasi lasciate a metà.
- **Sottotitoli** (`src/reel/Sottotitoli.tsx`): poco sotto la metà dello schermo (`SOTTOTITOLI_TOP_Y = 0.6`), **sempre sotto il mento, mai sopra il volto**; poche parole per volta (pagine da 900 ms); **Outfit 700, bianco con contorno nero pieno**, niente fondo grigio; la parola che sta dicendo in una **pillola verde** `#2dd17a` con testo scuro; le **parole chiave in Crimson Pro corsivo** verde chiaro `#8fe0b3` (diventano verdi quando le dice).
- **Gancio** (facoltativo): frase nei primi 2,5" in una pillola verde in alto.
- **Inserti grafici** (`src/reel/Inserti.tsx`, approvati da Ste il 23/11/2026): solo quando aggiungono qualcosa a quello che si dice, mai forzati; agganciati ai tempi delle parole nel girato (`frameNelReel`); nella fascia sotto i sottotitoli (`INSERTI_TOP_Y = 0.705`), mai sul volto; riquadro verde foresta scuro, titoli Outfit, sottotitoli Crimson Pro corsivo. Tipi: `scheda` (nome e ruolo o un concetto chiave, entra da sinistra) e `percorso` (linea del tempo che si accende tappa per tappa mentre le nomina). Prima di montare si propongono a Ste insieme al testo.
- Colori e font in `src/reel/stile.ts`, presi da `app/globals.css` dell'app.

## Come si monta un video

1. Ste carica il girato nella cartella Drive dei video; l'originale finisce poi in `processato/`.
2. Base di lavoro: `scripts/prepara.sh GIRATO.MOV public/media/<nome>.mp4` (approvato da Ste il 23/11/2026): 1440×2560 a 30 fps (più grande del video finale, così lo zoom resta nitido), **colore leggero** (contrasto +5 %, saturazione +4 %, un filo più caldo, vignettatura leggera), **nitidezza leggera**, **sfondo sfocato** dietro la persona (`scripts/sfondo.py`, segmentazione MediaPipe), **voce pulita** (bassi, rumore, compressione, −14 LUFS). Serve Python con `scripts/requirements.txt` e il modello `selfie_multiclass_256x256.tflite` (da `storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/`, in `modelli/`, fuori da Git) o in `MODELLO`; su Linux anche `libegl1` e `libgles2`. Circa 10 minuti per 45" di girato. Limite noto: le mani che si muovono veloci in basso a volte si sfocano. `public/media/` è fuori da Git.
3. Trascrizione con i tempi parola per parola: audio estratto → ElevenLabs Scribe (circa 6 crediti al secondo).
4. Si misura `voltoY` (altezza del centro del volto nel girato, 0-1) su un fotogramma con una griglia.
5. Si scrive `src/progetti/<nome>.ts` (girato, `voltoY`, pezzi, parole, parole chiave, gancio) e lo si aggiunge a `progetti` in `src/Root.tsx`.
6. Prima di montare: Ste conferma testo, gancio e parole chiave.
7. Controllo su alcuni fotogrammi: `npx remotion still <nome> out.png --frame=N --browser-executable=/opt/pw-browsers/chromium`.
8. Render: `npx remotion render <nome> out.mp4 --browser-executable=/opt/pw-browsers/chromium --crf=18`.

## Video di esercizi per YouTube e l'app

Decisioni di Ste del 23/11/2026, valgono per tutti i prossimi:
- **Flusso:** riconoscere l'esercizio dai fotogrammi → proporre il testo della voce → ok di Ste → montaggio (voce "Stef" su Eleven v4, sottotitoli, sottofondo all'8 %) → descrizione YouTube. Un video alla volta.
- **Preparazione:** `SENZA_SFONDO=1 scripts/prepara.sh` (solo colore e voce: lo sfondo sfocato sfoca anche l'attrezzo a terra).
- **Montaggio:** `python3 scripts/monta.py video.mp4 voce.mp3 1.0 righe.json "out/NN - nome"`: sottotitoli bruciati (bianco con contorno nero, in basso) da `righe.json` (`[[inizio, fine, "testo"], ...]` in secondi della voce, dalla trascrizione Scribe), voce che parte dopo l'offset (1.0"), audio del girato all'8 %; scrive anche `.srt` per YouTube. Se la voce è più lunga delle ripetizioni: voce un po' più veloce (`atempo` 1.05-1.15, tempi delle righe divisi per lo stesso fattore) e girato rallentato (`setpts=PTS/0.8,minterpolate=fps=30:mi_mode=blend`).
- **Durata:** corti, circa 20-25", solo le ripetizioni buone (via inizio, cambi di posizione, fine).
- **Titoli normali**, descrittivi, senza frasi a effetto ("il trucco", "quasi nessuno lo fa"): esercizio + per chi + serie con numero, es. "Kettlebell swing per calciatori | Forza da calciatore #1". Serie: "Forza da calciatore" (kettlebell e forza), "Tecnica con la pallina" (palleggi e passaggi con la pallina da tennis).
- **Descrizione:** cosa allena, come si fa, errori da evitare, poi la riga "Ogni settimana un esercizio nuovo per giocare meglio: iscriviti per non perderli.", poi "For You Football: il mental training per calciatori.", hashtag e tag. Mai "iscriviti" nel titolo.
- **Commento da fissare:** una domanda semplice sull'esercizio, per far partire i commenti.
- **Playlist:** una per serie.

## Comandi

```bash
npm i
npm run dev        # Remotion Studio
npm run lint       # eslint + tsc
```

## Ancora da decidere

Parole chiave (le sceglie Claude o Ste), testo del gancio, musica sotto la voce, chiusura con logo e invito all'app. Altri inserti possibili: numero che conta, prima e dopo, elenco a punti, screenshot dell'app in un telefono.
