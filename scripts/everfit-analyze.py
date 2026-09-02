#!/usr/bin/env python3
"""
Analisi dell'export Everfit normalizzato (docs/everfit-workouts.json +
docs/everfit-programs.json): frequenza esercizi, pattern per qualità
(metabolico, RSA, velocità, pliometria, forza) con serie/reps/durate/recuperi.
Serve a derivare le regole del workbook v2 dai dati reali di Ste.

Uso: python3 scripts/everfit-analyze.py
"""
import json
import re
from collections import Counter, defaultdict

lib = json.load(open("docs/everfit-workouts.json", encoding="utf-8"))
progs = json.load(open("docs/everfit-programs.json", encoding="utf-8"))
custom = {e["titolo"].strip().lower(): e for e in json.load(open("docs/everfit-custom-exercises.json", encoding="utf-8"))}

# Tutti i workout: libreria + giorni dei programmi (con contesto programma)
all_w = [("lib", None, w) for w in lib]
for p in progs:
    for wk in p["calendario"]:
        for d in wk["giorni"]:
            for w in d["workouts"]:
                all_w.append(("prog", p["titolo"], w))

# ── Frequenza esercizi ──────────────────────────────────────────────────────
freq = Counter()
usage = defaultdict(list)  # esercizio → [(n_serie, set_desc, workout_title)]
for src, ptitle, w in all_w:
    for s in w["sezioni"]:
        for e in s["esercizi"]:
            name = e["esercizio"].strip()
            freq[name] += 1
            usage[name].append((len(e["serie"]), e["serie"][:1], w["titolo"], s.get("formato")))


def tags_of(name):
    c = custom.get(name.lower())
    return c["tags"] if c else []


def fmt(sets):
    if not sets:
        return "—"
    s = sets[0]
    parts = []
    for k in ("reps", "duration", "distance", "weight", "rest"):
        if k in s:
            parts.append(f"{k}={s[k]}")
    return " ".join(parts)


print("=== TOP 60 ESERCIZI PIÙ USATI (libreria + programmi) ===")
for name, n in freq.most_common(60):
    u = usage[name]
    serie = Counter(x[0] for x in u).most_common(1)[0][0]
    print(f"{n:4d}× {name}  | serie tipiche {serie} | {fmt(u[0][1])} | tag: {', '.join(tags_of(name)) or '—'}")

# ── Esercizi palestra / forza (euristica su nome + tag) ────────────────────
GYM = re.compile(r"squat|stacco|deadlift|rdl|romanian|panca|bench|press|trazion|pull.?up|lat|row|rematore|affond|lunge|hip thrust|bridge|ponte|step.?up|nordic|calf|split|goblet|kettlebell|farmer|bulgar|dip|military|overhead|push press|clean|snatch|jump squat|trap bar", re.I)
print("\n=== ESERCIZI FORZA/PALESTRA (per frequenza) ===")
for name, n in freq.most_common():
    if GYM.search(name) or any(t in ("forza", "forza parte bassa", "forza parte alta", "petto", "push") for t in tags_of(name)):
        u = usage[name]
        print(f"{n:4d}× {name} | {fmt(u[0][1])} | tag: {', '.join(tags_of(name)) or '—'}")

# ── Pattern per qualità ─────────────────────────────────────────────────────
QUAL = {
    "metabolico": ("metabolico", "resistenza", "navett", "intermitt", "fartlek", "corsa", "metabol"),
    "rsa": ("resistenza alla velocità", "rsa", "20\"", "30\""),
    "velocita": ("velocità", "sprint", "rapidit", "scatt"),
    "pliometria": ("pliometria", "esplosiv", "jump", "salt", "balz", "bound", "hop", "drop", "depth", "pogo", "skip"),
}
for q, keys in QUAL.items():
    print(f"\n=== PATTERN {q.upper()} (esercizio | serie | set | workout) ===")
    seen = 0
    for name, n in freq.most_common():
        hay = (name + " " + " ".join(tags_of(name))).lower()
        if any(k in hay for k in keys):
            for ns, sets, wt, fmtn in usage[name][:2]:
                print(f"  {name} | {ns} serie | {fmt(sets)} | {fmtn} | «{wt}»")
            seen += 1
        if seen >= 25:
            break

# ── Programmi: sedute/settimana e titoli workout per programma ──────────────
print("\n=== PROGRAMMI: struttura ===")
for p in progs:
    days = Counter()
    titles = Counter()
    for wk in p["calendario"]:
        for d in wk["giorni"]:
            if d["workouts"]:
                days[wk["settimana"]] += 1
            for w in d["workouts"]:
                titles[w["titolo"]] += 1
    per_week = sorted(days.values())
    print(f"- {p['titolo']} ({p['settimane']} sett.) — sedute/sett: {per_week[:8]} — workout ricorrenti: {[t for t, _ in titles.most_common(5)]}")
