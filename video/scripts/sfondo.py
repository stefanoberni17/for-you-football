# Sfoca lo sfondo dietro la persona (effetto ritratto).
# uso: sfondo.py modello.tflite ingresso uscita [--frame]   (immagine o video)
import sys
import cv2
import numpy as np
import mediapipe as mp

modello, ingresso, uscita = sys.argv[1], sys.argv[2], sys.argv[3]
SFOCATURA = 41  # raggio del blur dello sfondo (dispari)
PIUMA = 21      # bordo morbido della maschera

opts = mp.tasks.vision.ImageSegmenterOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path=modello),
    running_mode=mp.tasks.vision.RunningMode.VIDEO,
    output_confidence_masks=True,
)
seg = mp.tasks.vision.ImageSegmenter.create_from_options(opts)
prev = None


def elabora(bgr, ts_ms):
    global prev
    h, w = bgr.shape[:2]
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    res = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), ts_ms)
    # classe 0 = sfondo: la persona è 1 - sfondo
    fondo = res.confidence_masks[0].numpy_view()
    m = 1.0 - cv2.resize(fondo, (w, h), interpolation=cv2.INTER_LINEAR)
    # stabile nel tempo: niente bordi che tremolano
    if prev is not None:
        m = 0.6 * m + 0.4 * prev
    prev = m
    m = cv2.GaussianBlur(np.clip(m, 0, 1), (PIUMA, PIUMA), 0)[..., None]
    piccolo = cv2.resize(bgr, (w // 4, h // 4))
    blur = cv2.resize(cv2.GaussianBlur(piccolo, (SFOCATURA // 4 * 2 + 1,) * 2, 0), (w, h))
    return (bgr * m + blur * (1 - m)).astype(np.uint8)


if ingresso.endswith(".png") or ingresso.endswith(".jpg"):
    cv2.imwrite(uscita, elabora(cv2.imread(ingresso), 0))
else:
    cap = cv2.VideoCapture(ingresso)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(3)), int(cap.get(4))
    out = cv2.VideoWriter(uscita, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    i = 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        out.write(elabora(f, int(i * 1000 / fps)))
        i += 1
    out.release()
    print("frame", i)
