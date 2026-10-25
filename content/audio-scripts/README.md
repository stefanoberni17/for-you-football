# Copioni audio delle pratiche

Un file per giorno (`W<w>-G<g>.txt`), scritto dal campo **Pratica** del DB Giorni su Notion (più l'Apertura, letta in voce). Formato:

- `[sincere]`, `[relaxed]`, `[meditative]` su una riga da sola: registro della voce da lì in poi (apertura e riflessione · racconto e chiusura · parte guidata)
- `[SILENZIO N]`: silenzio esatto di N secondi, inserito in montaggio
- ogni altra riga è letta dalla voce; righe consecutive senza silenzio in mezzo sono un unico segmento

Voce ElevenLabs "Stef" (`5BFc1AtZZpddsxaGhkfC`), modello `eleven_v4`, un segmento per generazione con il registro come tag iniziale; montaggio con ffmpeg (trim dei silenzi di testa e coda, silenzi da `anullsrc`, 44,1 kHz mono, 128 kbit/s, loudnorm a -16 LUFS in due passate). Revisione e piano audio: `docs/audio/revisione-pratiche-audio.md`.
