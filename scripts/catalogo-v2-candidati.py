#!/usr/bin/env python3
"""
Lista candidati per il catalogo v2 (docs/training-catalogo-v2-candidati.{md,json}).

Sorgenti: docs/everfit-custom-exercises.json (209 esercizi di Ste, con video e tag),
File_DB foglio DB ESERCIZI (82, con difficoltà fascia 1-3), lib/trainingCatalog.ts (v1 live).
Per ogni esercizio propone: qualità v2, attrezzatura, difficoltà 1-5, livello minimo,
unità, per-lato, video, fonte, azione (importa / già in v1 / escludi). Tutto è PROPOSTA
da rivedere con Ste; la classificazione è per regole su tag e nome.

Uso: python3 scripts/catalogo-v2-candidati.py
"""
import json
import re

import openpyxl

EVERFIT = json.load(open("docs/everfit-custom-exercises.json", encoding="utf-8"))
XLSX = "docs/training-seed/File_DB_Allenamenti.xlsx"
TS = open("lib/trainingCatalog.ts", encoding="utf-8").read()

# ── v1 live: nomi già a catalogo ─────────────────────────────────────────────
V1 = {m.group(1).lower() for m in re.finditer(r"nome: '([^']+)'", TS)}


def in_v1(name):
    n = name.lower()
    if n in V1:
        return True
    return any(v in n or n in v for v in V1 if len(v) > 8)


# ── File_DB: DB ESERCIZI ─────────────────────────────────────────────────────
db = {}
wb = openpyxl.load_workbook(XLSX, data_only=True)
for r in wb["DB ESERCIZI"].iter_rows(min_row=2, values_only=True):
    if r[1]:
        db[r[1].strip().lower()] = {"categoria": r[2], "obiettivo": r[3], "area": r[4], "corpo_libero": r[5],
                                    "peso": r[6], "difficolta": r[7], "link": r[10] if len(r) > 10 else None}

# ── Classificazione ──────────────────────────────────────────────────────────
def has(text, *words):
    t = text.lower()
    return any(w in t for w in words)


def qualita(name, tags):
    n = name.lower()
    tg = " ".join(tags).lower()
    if has(n, "test"):
        return "test"
    if has(n, "foam roll", "massagg", "adhesion", "meditation", "yoga", "mobilit", "stretch", "elastici prevenzione"):
        return "mobilita-recupero"
    if has(n, "riscaldamento", "warm"):
        return "riscaldamento"
    if has(tg, "fascia") or has(n, "fascia", "towel", "toes up", "toe curl", "tibialis", "equilibrio"):
        if has(n, "pogo", "bounce", "skip", "jump", "salt") and not has(n, "equilibrio"):
            return "pliometria-estensiva"
        return "fascia-prevenzione"
    if has(n, "sprint", "rapidit", "navett", "allungo", "salite", "scatt") or has(tg, "velocità", "rapidità"):
        if has(n, "allungo", "salite allungo", "metabolic") or has(tg, "metabolico"):
            return "resistenza-metabolico"
        if has(n, "resistenza alla velocità", "navetta 10", "30''") :
            return "resistenza-rsa"
        return "velocita"
    if has(tg, "resistenza", "metabolico") or has(n, "fartlek", "ripetute", "corsa", "resistenza", "circuito"):
        if has(n, "fartlek", "ripetute", "corsa", "resistenza e tecnica", "resistenza funzionale", "circuito resistenza"):
            return "resistenza-aerobica"
        return "resistenza-metabolico"
    if has(n, "drop", "depth", "broad", "salto in lungo", "triplo", "knee jump", "box jump", "jump squat", "squat jump", "reverse drop", "2 up 1 down"):
        return "pliometria-intensiva"
    if has(n, "pogo", "bounce", "skip", "saltell", "skater", "hop") or has(tg, "pliometria", "esplosività", "forza esplosiva"):
        return "pliometria-estensiva" if has(n, "pogo", "bounce", "skip", "saltell") else "forza-esplosiva"
    if has(tg, "tecnica", "palleggi", "passaggi", "controllo", "tiro", "dribbling", "visione", "headball", "attacco", "difesa", "esercizi in 2") \
            or has(n, "pallegg", "passagg", "muro", "dribbling", "tiro", "tiri", "conduzione", "slalom", "cinesin", "1vs1", "visione", "headball", "testa"):
        if has(n, "pallegg"):
            return "tecnica-palleggi"
        if has(n, "muro", "passagg"):
            return "tecnica-passaggi"
        if has(n, "tiro", "tiri", "calcio"):
            return "tecnica-tiro"
        if has(n, "visione", "colori", "headball", "testa"):
            return "tecnica-visione"
        return "tecnica-conduzione"
    if has(n, "squat", "stacco", "deadlift", "rdl", "hip thrust", "hip trust", "bulgar", "affond", "lunge", "step up", "nordic", "calf", "leg press", "sissy", "glute bridge", "ponte", "knee extension", "wall sit", "iso lounge", "iso runner", "copenhag", "pistol", "split"):
        return "forza-parte-bassa"
    if has(n, "push", "piegament", "dip", "press", "panca", "bench", "flyes", "pull", "trazion", "row", "rematore", "chin", "archer", "one arm", "muscle", "handstand", "crow", "spinta isometrica"):
        return "forza-parte-alta"
    if has(n, "plank", "hollow", "holllow", "crunch", "jackknife", "toes to bar", "knee raise", "dragon", "russian", "twist", "core", "addominal", "bear crawl", "l-sit", "superman", "arch"):
        return "core"
    if has(n, "kettlebell", "swing", "medicine", "farmer", "clean", "snatch", "windmill"):
        return "forza-esplosiva" if has(n, "swing", "snatch", "clean", "medicine") else "forza-parte-bassa"
    if has(tg, "forza", "push", "core", "petto"):
        return "forza-parte-alta"
    if has(n, "burpee", "hiit", "full body"):
        return "resistenza-metabolico"
    return "da-classificare"


def attrezzatura(name):
    n = name.lower()
    if has(n, "barbell", "bilanciere", "kettlebell", "dumbbell", "manubri", "weighted", "zavorr", "leg press", "machine", "cable", "elastic", "band", "medicine", "box jump", "farmer", "bench", "panca", "dips (from bars)", "sbarra", "pull-up", "pull up", "trazion", "toes to bar", "knee raises"):
        return "palestra" if not has(n, "trazion", "pull-up", "pull up", "toes to bar", "knee raises", "australian") else "sbarra"
    if has(n, "muro", "cinesin", "coni", "salite", "sprint", "navett", "palla", "pallegg", "passagg", "tiro", "tiri", "dribbling", "campo", "1vs1", "fartlek", "ripetute", "corsa", "allungo", "km", "porta", "headball", "circuito resistenza"):
        return "campo"
    if has(n, "towel", "asciugamano", "pallina", "tennis ball", "foam"):
        return "piccoli attrezzi"
    return "corpo libero"


def difficolta(name, q, tags, dbrow):
    n = name.lower()
    if dbrow and dbrow.get("difficolta"):
        return int(dbrow["difficolta"])
    d = 2
    if has(n, "avanzat", "advanced", "pro", "one arm", "1 braccio", "single leg", "sl ", "1 gamba", "una gamba", "pistol", "dragon", "archer", "typewriter", "muscle up", "depth", "drop jump", "triplo", "handstand", "crow", "planche", "front lever"):
        d = 4
    elif has(n, "intermedi", "a2", "a1", "b3", "c1", "declinat", "weighted", "zavorr", "barbell", "bilanciere", "nordic", "knee jump", "reverse drop", "hollow rocks"):
        d = 3
    elif has(n, "base", "b1", "ginocchia", "assist", "knee", "riscaldamento", "foam", "meditation", "camminata", "sul posto"):
        d = 1
    if q == "pliometria-intensiva":
        d = max(d, 3)
    if q in ("mobilita-recupero", "riscaldamento"):
        d = 1
    return min(5, d)


def livello_min(d, q):
    if q == "pliometria-intensiva":
        return "A"
    return "B" if d <= 2 else "A" if d == 3 else "PRO"


def unita(name, categoria, q):
    n = name.lower()
    if categoria in ("Timed", "Duration") or has(n, "hold", "iso", "plank", "wall sit", "fartlek", "ripetute", "meditation", "foam", "adhesion", "pallegg", "muro", "box dribbling", "corsa"):
        return "secondi" if q not in ("tecnica-palleggi", "tecnica-passaggi", "tecnica-conduzione", "tecnica-visione", "resistenza-aerobica", "mobilita-recupero") else "minuti"
    if categoria in ("Distance (Short)", "Distance (Long)") or has(n, "km", "sprint", "salite", "allungo", "navett", " m ", "mt"):
        return "metri" if has(n, "km", "salite allungo", "200") else "secondi" if has(n, "navett", "allungo") else "reps"
    return "reps"


def per_lato(name):
    return has(name.lower(), "single leg", "sl ", "1 gamba", "una gamba", "one arm", "1 braccio", "un piede", "solo sx", "solo dx", "dx", "sx", "per lato", "affondo", "lunge", "copenhag", "side plank", "plank laterale", "pistol", "bulgar", "split", "step up", "archer", "occhio", "1 piede")


rows = []
seen = set()
for e in EVERFIT:
    name = e["titolo"].strip()
    key = name.lower()
    if key in seen:
        continue
    seen.add(key)
    dbrow = db.get(key)
    q = qualita(name, e["tags"])
    d = difficolta(name, q, e["tags"], dbrow)
    v1 = in_v1(name)
    azione = "già in v1" if v1 else ("escludi (recupero/non allenante)" if q == "mobilita-recupero" and has(name.lower(), "foam", "massagg", "adhesion", "meditation") else "importa")
    rows.append({
        "nome": name, "qualita": q, "attrezzatura": attrezzatura(name), "difficolta": d,
        "livello_min": livello_min(d, q), "unita": unita(name, e.get("categoria"), q), "per_lato": per_lato(name),
        "video": e.get("video"), "fonte": "Everfit" + (" + File_DB" if dbrow else ""), "tags": e["tags"], "azione": azione,
    })
# File_DB-only (non presenti in Everfit)
for key, dbrow in db.items():
    if key in seen:
        continue
    seen.add(key)
    name = key.title() if key.islower() else key
    q = qualita(name, [dbrow.get("categoria") or ""])
    d = difficolta(name, q, [], dbrow)
    v1 = in_v1(name)
    rows.append({
        "nome": name.strip(), "qualita": q, "attrezzatura": attrezzatura(name), "difficolta": d,
        "livello_min": livello_min(d, q), "unita": unita(name, None, q), "per_lato": per_lato(name),
        "video": dbrow.get("link"), "fonte": "File_DB", "tags": [t for t in (dbrow.get("categoria"), dbrow.get("area"), dbrow.get("obiettivo")) if t],
        "azione": "già in v1" if v1 else "importa",
    })

ORDER = ["forza-parte-bassa", "forza-parte-alta", "core", "forza-esplosiva", "pliometria-estensiva", "pliometria-intensiva",
         "velocita", "resistenza-aerobica", "resistenza-metabolico", "resistenza-rsa", "fascia-prevenzione",
         "tecnica-palleggi", "tecnica-passaggi", "tecnica-conduzione", "tecnica-tiro", "tecnica-visione",
         "riscaldamento", "mobilita-recupero", "test", "da-classificare"]
LABEL = {
    "forza-parte-bassa": "Forza — parte bassa (palestra e corpo libero)", "forza-parte-alta": "Forza — parte alta",
    "core": "Core / lombari / laterali", "forza-esplosiva": "Forza esplosiva (con carico / lanci)",
    "pliometria-estensiva": "Pliometria estensiva (pogo, saltelli, skip)", "pliometria-intensiva": "Pliometria intensiva (drop, depth, balzi)",
    "velocita": "Velocità / rapidità", "resistenza-aerobica": "Resistenza aerobica", "resistenza-metabolico": "Metabolico (intermittenti, salite, navette)",
    "resistenza-rsa": "Resistenza alla velocità (RSA)", "fascia-prevenzione": "Fascia / prevenzione / propriocezione",
    "tecnica-palleggi": "Tecnica — palleggi", "tecnica-passaggi": "Tecnica — passaggi / muro", "tecnica-conduzione": "Tecnica — conduzione / dribbling / 1vs1",
    "tecnica-tiro": "Tecnica — tiro", "tecnica-visione": "Tecnica — visione / headball", "riscaldamento": "Riscaldamento",
    "mobilita-recupero": "Mobilità / recupero (foam roll, yoga, massaggi)", "test": "Test", "da-classificare": "⚠️ Da classificare a mano",
}
rows.sort(key=lambda r: (ORDER.index(r["qualita"]), r["difficolta"], r["nome"].lower()))
json.dump(rows, open("docs/training-catalogo-v2-candidati.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

imp = [r for r in rows if r["azione"] == "importa"]
L = ["# Catalogo v2 — lista candidati per la review", "",
     f"{len(rows)} esercizi da 3 sorgenti (Everfit custom, File_DB DB ESERCIZI, catalogo v1 live). "
     f"**{len(imp)} da importare**, {sum(1 for r in rows if r['azione']=='già in v1')} già in v1, "
     f"{sum(1 for r in rows if r['azione'].startswith('escludi'))} proposti da escludere. "
     "Classificazione automatica per tag/nome — **tutto da confermare**: correggi qualità, difficoltà (1-5), livello minimo o azione direttamente qui.",
     "", "Legenda: **D** difficoltà 1-5 · **Liv** livello minimo B/A/PRO · **L** per lato · 🎥 video presente", ""]
for q in ORDER:
    grp = [r for r in rows if r["qualita"] == q]
    if not grp:
        continue
    L.append(f"## {LABEL[q]} ({len(grp)})")
    L.append("| Esercizio | Attrezz. | D | Liv | Unità | L | 🎥 | Fonte | Azione |")
    L.append("|---|---|:-:|:-:|---|:-:|:-:|---|---|")
    for r in grp:
        L.append(f"| {r['nome']} | {r['attrezzatura']} | {r['difficolta']} | {r['livello_min']} | {r['unita']} | {'✓' if r['per_lato'] else ''} | {'🎥' if r['video'] else '—'} | {r['fonte']} | {r['azione']} |")
    L.append("")
open("docs/training-catalogo-v2-candidati.md", "w", encoding="utf-8").write("\n".join(L))
from collections import Counter
print("totale:", len(rows), "| importa:", len(imp))
for q, n in Counter(r["qualita"] for r in rows).most_common():
    print(f"  {n:3d}  {LABEL[q]}")
