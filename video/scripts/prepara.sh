#!/usr/bin/env bash
# Prepara il girato prima del montaggio: base 1440x2560, colore leggero,
# nitidezza leggera, sfondo sfocato, audio pulito. Stile approvato da Ste il 23/11/2026.
# uso: scripts/prepara.sh GIRATO.MOV public/media/<nome>.mp4
# SENZA_SFONDO=1: niente sfondo sfocato (video di esercizi: l'attrezzo a terra verrebbe sfocato).
# serve: ffmpeg, python con mediapipe e opencv-python-headless (scripts/requirements.txt),
#        il modello selfie_multiclass_256x256.tflite in MODELLO (vedi README).
set -euo pipefail
IN="$1"; OUT="$2"
MODELLO="${MODELLO:-modelli/selfie_multiclass_256x256.tflite}"
PY="${PY:-python3}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Colore e nitidezza: correzioni leggere, la pelle resta naturale.
LOOK="scale=1440:2560,eq=contrast=1.05:saturation=1.04:gamma=0.99,colortemperature=temperature=5600:mix=0.15,curves=master='0/0.01 0.25/0.235 0.75/0.765 1/0.99',vignette=angle=PI/7:mode=forward,unsharp=5:5:0.3:5:5:0.0"
ffmpeg -v error -y -i "$IN" -vf "$LOOK" -r 30 -an -c:v libx264 -preset fast -crf 16 "$TMP/look.mp4"

# Sfondo sfocato dietro la persona (non negli esercizi: l'attrezzo verrebbe sfocato).
if [ "${SENZA_SFONDO:-0}" = "1" ]; then
  mv "$TMP/look.mp4" "$TMP/sfondo.mp4"
else
  "$PY" "$(dirname "$0")/sfondo.py" "$MODELLO" "$TMP/look.mp4" "$TMP/sfondo.mp4"
fi

# Voce: via i bassi e il rumore, compressione leggera, volume da Instagram (-14 LUFS).
ffmpeg -v error -y -i "$IN" -vn -af "highpass=f=80,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k "$TMP/audio.m4a"

ffmpeg -v error -y -i "$TMP/sfondo.mp4" -i "$TMP/audio.m4a" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p -c:a copy -shortest "$OUT"
echo "pronto: $OUT"
