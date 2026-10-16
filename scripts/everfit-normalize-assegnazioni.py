#!/usr/bin/env python3
"""
Normalizza i workout che esistono SOLO sui calendari dei ragazzi (assegnazioni modificate o create sul
calendario, mai salvate in libreria) nello stesso formato di docs/everfit-workouts.json, così
scripts/build-blocks.py li trasforma in blocchi.

Input (gitignored): docs/everfit-export/assegnazioni/<slug>.json = {"titolo", "assignment_id", "giorno",
  "data": risposta di /api/workout/v2/assignment/detail/<id>} — una assegnazione per titolo.
Anonimizzazione: docs/everfit-export/anon.json {"clienti": ["Nome Cognome", …]} — i nomi vengono tolti dai titoli.
Output (committati, senza dati dei clienti): docs/everfit-workouts-assegnati.{json,md}.

Uso: python3 scripts/everfit-normalize-assegnazioni.py
"""
import glob, json, os, re

D = "docs/everfit-export"
anon = json.load(open(os.path.join(D, "anon.json"), encoding="utf-8")) if os.path.exists(os.path.join(D, "anon.json")) else {}
CLIENTI = anon.get("clienti", [])

def pulisci_titolo(t):
    for c in CLIENTI:
        t = re.sub(r"\s*-\s*" + re.escape(c) + r"(?=\s*-|\s*$|\s+in season)", "", t, flags=re.I)
    return re.sub(r"\s{2,}", " ", t).strip()

def v(x):
    return x.get("value") if isinstance(x, dict) else x

def serie_da(sets):
    out = []
    for s in sets or []:
        d = {}
        for k in ("rest", "duration", "reps", "distance_short", "distance", "weight", "round"):
            val = v(s.get(k))
            if val not in (None, "", 0, "0") or (k in ("rest",) and val in ("0",)):
                d[k] = str(val)
        out.append(d)
    return out

rows = []
for f in sorted(glob.glob(os.path.join(D, "assegnazioni", "*.json"))):
    j = json.load(open(f, encoding="utf-8"))
    data = j.get("data") or {}
    data = data.get("data", data)
    titolo = pulisci_titolo(j.get("titolo") or data.get("title") or "")
    if not titolo or re.search(r"demo|squat, press", titolo, re.I):
        continue
    sezioni = []
    for s in data.get("sections_target") or []:
        sez = {"formato": s.get("format") or "regular", "tipo": s.get("type") or "workout"}
        if s.get("title"): sez["title"] = s["title"]
        if s.get("time"): sez["time"] = s["time"]
        if s.get("round"): sez["round"] = s["round"]
        esercizi = []
        for e in s.get("exercises") or []:
            for ss in e.get("supersets") or []:
                ex = ss.get("exercise") or {}
                nome = ex.get("title") or (ss.get("exercise_instance") or {}).get("title") or "?"
                item = {"esercizio": nome, "serie": serie_da(ss.get("training_sets"))}
                if ss.get("each_side"): item["per_lato"] = True
                if ss.get("note"): item["nota"] = ss["note"]
                if ex.get("videoLink"): item["video"] = ex["videoLink"]
                esercizi.append(item)
        sez["esercizi"] = esercizi
        sezioni.append(sez)
    rows.append({"everfit_id": data.get("workout_library_template") or data.get("_id"), "titolo": titolo,
                 "descrizione": data.get("description") or None, "tags": [], "sezioni": sezioni})

rows.sort(key=lambda w: w["titolo"].lower())
json.dump(rows, open("docs/everfit-workouts-assegnati.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
lines = ["# Workout assegnati ai ragazzi ma non in libreria — export 16 ott 2026", "",
         f"{len(rows)} workout che Ste ha creato o modificato direttamente sui calendari dei clienti (API interna "
         "`assignment/detail`), una copia per titolo, nomi dei clienti tolti. Stesso formato di `everfit-workouts.md`.", ""]
for w in rows:
    lines += [f"## {w['titolo']}", ""]
    if w["descrizione"]: lines += ["_" + w["descrizione"].replace("\n", " ") + "_", ""]
    for s in w["sezioni"]:
        lines.append(f"- **{s['formato']}**" + (f" — {s['title']}" if s.get("title") else ""))
        for e in s["esercizi"]:
            lines.append(f"  - {e['esercizio']}: " + " · ".join(" ".join(f"{k} {v}" for k, v in st.items()) for st in e["serie"]) + (" (per lato)" if e.get("per_lato") else ""))
    lines.append("")
open("docs/everfit-workouts-assegnati.md", "w", encoding="utf-8").write("\n".join(lines))
print(f"{len(rows)} workout → docs/everfit-workouts-assegnati.{{json,md}}")
for w in rows: print("  ", w["titolo"], "·", len(w["sezioni"]), "sezioni")
