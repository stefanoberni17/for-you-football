#!/usr/bin/env python3
"""
Normalizza l'export grezzo Everfit (docs/everfit-export/, gitignored) nei file
committati docs/everfit-workouts.{json,md} e docs/everfit-programs.{json,md}.

Input atteso (prodotto dagli script di export / sessione Claude):
  <EXPORT_DIR>/workouts/<id>.json   — /api/workout/v2/detail/<id>  (campo data)
  <EXPORT_DIR>/programs/<id>.json   — {"program": {...}, "calendar": get-calendar-by-week}

Uso:  python3 scripts/everfit-normalize.py [EXPORT_DIR]   (default docs/everfit-export)

Regole: demo Everfit escluse; programmi intitolati a clienti anonimizzati
(ANON); nessun dato cliente nei file di output.
"""
import glob
import json
import os
import sys

D = sys.argv[1] if len(sys.argv) > 1 else "docs/everfit-export"

ANON = {
    "GIUSEPPE PARADISO FORZA": "Programma personale — cliente A (4 sett. forza)",
    "Nani Sergi Marzo 2024": "Programma personale — cliente B (4 sett.)",
}


def v(x):
    return x.get("value") if isinstance(x, dict) else x


def norm_set(s):
    out = {}
    for k, val in s.items():
        if k in ("_id", "is_completed", "__v"):
            continue
        val = v(val)
        if val not in (None, "", [], {}):
            out[k] = val
    return out


def norm_superset(ss):
    ei = ss.get("exercise_instance") or {}
    if not isinstance(ei, dict):
        ei = {}
    ex = ss.get("exercise") if isinstance(ss.get("exercise"), dict) else {}
    d = {"esercizio": ei.get("title") or ex.get("title") or "?",
         "serie": [norm_set(s) for s in ss.get("training_sets", [])]}
    if ss.get("each_side"):
        d["per_lato"] = True
    if ss.get("tempo") not in (None, 0, "0", ""):
        d["tempo"] = ss.get("tempo")
    if ei.get("note") or ss.get("note"):
        d["nota"] = ei.get("note") or ss.get("note")
    if ei.get("videoLink") or ei.get("video"):
        d["video"] = ei.get("videoLink") or ei.get("video")
    return d


def norm_section(sec):
    d = {"formato": sec.get("format"), "tipo": sec.get("type")}
    for k in ("title", "note", "round", "time", "attachments"):
        val = sec.get(k)
        if val not in (None, "", [], {}, 0):
            d[k] = val
    d["esercizi"] = [norm_superset(ss) for e in sec.get("exercises", []) for ss in e.get("supersets", [])]
    return d


def norm_workout(w):
    return {
        "everfit_id": w.get("_id"),
        "titolo": w.get("title"),
        "descrizione": w.get("description") or None,
        "tags": sorted(t.get("name") for t in w.get("tags", []) if isinstance(t, dict) and t.get("name")),
        "sezioni": [norm_section(s) for s in w.get("sections", [])],
    }


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ── Workout library ──────────────────────────────────────────────────────────
lib = []
for f in glob.glob(f"{D}/workouts/*.json"):
    raw = load(f)
    lib.append(norm_workout(raw.get("data", raw)))
lib.sort(key=lambda w: (w["titolo"] or "").lower())

# ── Programmi ────────────────────────────────────────────────────────────────
progs = []
for f in glob.glob(f"{D}/programs/*.json"):
    p = load(f)
    meta = p["program"]
    if meta.get("is_demo") or "Demo" in (meta.get("title") or ""):
        continue
    cal = p["calendar"]
    sets = cal["workout_sets"] if isinstance(cal, dict) else cal
    weeks = []
    for wi, s in enumerate(sets or []):
        days = []
        for d in sorted(s.get("days_workout", []), key=lambda x: x.get("day_index", 0)):
            dw = d.get("day_workout") or {}
            days.append({"giorno": d.get("day_index", 0) + 1,
                         "workouts": [norm_workout(w) for w in dw.get("workouts", [])]})
        weeks.append({"settimana": wi + 1, "giorni": days})
    progs.append({
        "everfit_id": meta["_id"],
        "titolo": ANON.get(meta.get("title"), meta.get("title")),
        "descrizione": meta.get("description") or None,
        "livello": meta.get("level"),
        "modalita": meta.get("modality"),
        "settimane": len(weeks),
        "tags": sorted(t.get("name") for t in meta.get("tags", []) if isinstance(t, dict) and t.get("name")),
        "calendario": weeks,
    })
progs.sort(key=lambda p: -p["settimane"])


# ── Markdown ─────────────────────────────────────────────────────────────────
def fmt_set(s):
    parts = []
    if "reps" in s:
        parts.append(f"{s['reps']} reps")
    if "duration" in s:
        try:
            sec = int(float(s["duration"]))
            parts.append(f"{sec // 60}'{sec % 60:02d}\"" if sec >= 60 else f"{sec}\"")
        except (TypeError, ValueError):
            parts.append(f"{s['duration']}s")
    if "distance" in s:
        parts.append(f"{s['distance']} m")
    if "weight" in s:
        parts.append(f"{s['weight']} kg")
    if "rest" in s:
        parts.append(f"rec {s['rest']}\"")
    parts += [f"{k} {val}" for k, val in s.items() if k not in ("reps", "duration", "distance", "weight", "rest")]
    return " · ".join(parts) or "—"


def fmt_ex(e):
    strs = [fmt_set(s) for s in e["serie"]]
    body = f"{len(strs)}× {strs[0]}" if strs and all(x == strs[0] for x in strs) else " / ".join(strs)
    extra = []
    if e.get("per_lato"):
        extra.append("per lato")
    if e.get("tempo"):
        extra.append(f"tempo {e['tempo']}")
    if e.get("nota"):
        extra.append(f"nota: {e['nota']}")
    return f"{e['esercizio']} — {body}" + (f" ({'; '.join(extra)})" if extra else "")


def fmt_workout(w, indent):
    L = []
    for s in w["sezioni"]:
        head = f"{indent}- **{s.get('title') or s.get('formato') or 'sezione'}**"
        meta = [x for x in [s.get("formato") if s.get("title") else None,
                            f"round {s['round']}" if s.get("round") else None,
                            str(s["time"]) if s.get("time") else None,
                            s.get("note")] if x]
        if meta:
            head += f" _({' · '.join(meta)})_"
        L.append(head)
        for e in s["esercizi"]:
            L.append(f"{indent}  - {fmt_ex(e)}")
    return L


L = ["# Workout Library Everfit — export 1 set 2026", "",
     f"{len(lib)} workout creati da Ste (API interna `/api/workout/v2/detail`). "
     "Struttura: sezioni → esercizi → serie (reps · durata · recupero). Nessun dato cliente.", ""]
for w in lib:
    L.append(f"## {w['titolo']}" + (f"  `{' · '.join(w['tags'])}`" if w["tags"] else ""))
    if w["descrizione"]:
        L.append(f"_{w['descrizione'][:300]}_")
    L += fmt_workout(w, "")
    L.append("")

P = ["# Programmi Everfit — export 1 set 2026", "",
     f"{len(progs)} programmi di Ste (API interna `get-calendar-by-week`), demo Everfit escluse, "
     "programmi personali di clienti anonimizzati. Ogni giorno riporta i workout completi.", "",
     "| Programma | Settimane | Livello | Tag |", "|---|---|---|---|"]
for p in progs:
    P.append(f"| {p['titolo']} | {p['settimane']} | {p.get('livello') or '—'} | {', '.join(p['tags']) or '—'} |")
P.append("")
for p in progs:
    P.append(f"## {p['titolo']} ({p['settimane']} sett.)")
    if p["descrizione"]:
        P.append(f"_{p['descrizione'][:400]}_")
    for wk in p["calendario"]:
        P.append(f"### Settimana {wk['settimana']}")
        for d in wk["giorni"]:
            for w in d["workouts"]:
                P.append(f"- **Giorno {d['giorno']} — {w['titolo']}**")
                P += fmt_workout(w, "  ")
    P.append("")

os.makedirs("docs", exist_ok=True)
with open("docs/everfit-workouts.json", "w", encoding="utf-8") as f:
    json.dump(lib, f, ensure_ascii=False, indent=1)
with open("docs/everfit-programs.json", "w", encoding="utf-8") as f:
    json.dump(progs, f, ensure_ascii=False, indent=1)
with open("docs/everfit-workouts.md", "w", encoding="utf-8") as f:
    f.write("\n".join(L))
with open("docs/everfit-programs.md", "w", encoding="utf-8") as f:
    f.write("\n".join(P))
print(f"workouts: {len(lib)} | programmi: {len(progs)}")
for path in ("docs/everfit-workouts.md", "docs/everfit-programs.md", "docs/everfit-workouts.json", "docs/everfit-programs.json"):
    print(f"  {path}: {os.path.getsize(path) // 1024} KB")
