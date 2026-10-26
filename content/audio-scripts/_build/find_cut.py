"""Dove finisce l'apertura in ogni copione (26/10): confronta le righe lette con il campo Apertura di Notion."""
import json, re, sys
sys.path.insert(0, '.')
from check_notion import norm, frasi, migliore, OUT
snap = json.load(open('notion_snapshot.json', encoding='utf-8'))
nomi = sorted([k for k, v in snap.items() if v.get('Audio Pratica')], key=lambda k: (int(k[1:k.index('-')]), int(k.split('G')[1])))
for n in nomi:
    ap = frasi(snap[n].get('Apertura') or '')
    import os
    fs = [f'{OUT}/{n}.txt'] if os.path.exists(f'{OUT}/{n}.txt') else [f'{OUT}/{n}-apertura.txt', f'{OUT}/{n}-pratica.txt']
    righe = [l for f in fs for l in open(f, encoding='utf-8').read().split('\n') if l]
    testo = [(i, l) for i, l in enumerate(righe) if not l.startswith('[')]
    primo_med = next((i for i, l in enumerate(righe) if l in ('[meditative]', '[TAGLIO]')), len(righe))
    ultimo_ap = -1
    for i, l in testo:
        fr = frasi(l) or [(l, norm(l))]
        score = sum(migliore(x, ap)[0] for _, x in fr) / len(fr)
        if score >= 0.8: ultimo_ap = i
        elif i > ultimo_ap + 6: break
    # prima riga di testo dopo l'ultima riga di apertura
    dopo = next((l for i, l in testo if i > ultimo_ap), '')
    regola = 'ok' if all(i < primo_med for i, _ in testo if i <= ultimo_ap) and not any(ultimo_ap < i < primo_med for i, _ in testo) else 'DIVERSO'
    print(f'{n}\t{regola}\tultima apertura: …{righe[ultimo_ap][-50:]!r}\n\t\tpoi: {dopo[:70]!r}')
