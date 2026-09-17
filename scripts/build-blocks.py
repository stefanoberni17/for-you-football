#!/usr/bin/env python3
"""
Genera lib/trainingBlocks.generated.ts (+ docs/training-blocchi.md) dai workout
Everfit esportati (docs/everfit-workouts.json). NON toccare a mano il file
generato: cambia questo script (alias, euristiche) o il catalogo e rilancia.

Uso: python3 scripts/build-blocks.py
"""
import json
import re
import unicodedata
from collections import Counter

WORKOUTS = json.load(open("docs/everfit-workouts.json", encoding="utf-8"))
if isinstance(WORKOUTS, dict):
    WORKOUTS = WORKOUTS.get("workouts", [])
GEN = open("lib/trainingCatalogV2.generated.ts", encoding="utf-8").read()
V1 = open("lib/trainingCatalog.ts", encoding="utf-8").read()

# ── Catalogo: nome → (id, qualità, unità, attrezzatura, attivo, inCoppia) ─────
CAT = {}
for m in re.finditer(r'\{ id: "([^"]+)", nome: "([^"]+)", qualita: "([^"]+)", attrezzatura: "([^"]+)", difficolta: \d, livelloMin: "[^"]+", unita: "([^"]+)", attivo: (true|false)(.*?)\},\n', GEN):
    i, nome, q, attr, unita, attivo, rest = m.groups()
    ne = re.search(r'nomeEverfit: "([^"]+)"', rest)
    info = (i, q, unita, attr, attivo == "true", "inCoppia: true" in rest)
    CAT.setdefault(nome.lower().strip(), info)
    if ne:
        CAT.setdefault(ne.group(1).lower().strip(), info)
V1CAT = {}
for m in re.finditer(r"\{ id: '([^']+)', nome: '([^']+)', area: '([^']+)', gradino: \d+, unita: '([^']+)'", V1):
    i, nome, area, unita = m.groups()
    V1CAT[nome.lower().strip()] = (i, area, unita)
V1_QUALITA = {  # area v1 → qualità v2 equivalente (per il peso delle qualità nel blocco)
    "spinta": "forza-parte-alta", "tirata": "forza-parte-alta", "core": "core", "lombari": "core", "laterale": "core",
    "fascia": "fascia-prevenzione", "palleggi": "tecnica-palleggi", "muro": "tecnica-passaggi", "conduzione": "tecnica-conduzione",
    "mobilita": "mobilita-recupero",
}

# ── Alias: nome Everfit (libreria standard) → id catalogo ─────────────────────
ALIAS = {
    "push-up": "push-2", "modified push up": "push-1", "archer push up": "fpa-archer-pushup",
    "band assisted pull up": "pull-4", "inverted row": "pull-2", "chin-up": "fpa-chin-up",
    "dips - chest version": "fpa-dips", "barbell bench press": "fpa-panca-piana-con-bilanciere",
    "barbell squat": "fpb-squat", "barbell stiff leg romanian deadlift": "fpb-stacco-rumeno",
    "calves raises": "fpb-calf-raises", "single leg fascia rdl": "fasc-fascia-single-leg-rdl",
    "hollow hold": "core-6", "plank": "core-2", "alternating 2 point plank": "core-4",
    "hanging knee raise": "core2-hanging-knee-raises", "jump squat": "plioi-squat-jump",
    "box dribbling": "cond-6", "palleggi solo testa - tecnica": "pall-7", "allungo": "risc-allungo-riscaldamento",
    # Nomi Everfit rinominati nel tempo → stesso esercizio in catalogo (chiusura blocchi incompleti, 7 set 2026)
    "passaggi al muro 1 tocco interno 1 piede - tecnica": "tpas-passaggi-al-muro-1-tocco-interno-tecnica",
    "passaggi al muro 2 tocchi, stop di esterno, passaggio interno - tecnica": "tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass",
    "passaggi al muro solo collo di prima - tecnica": "tpas-passaggi-al-muro-1-tocco-collo-tecnica",
    "yoga prevenzione e forza adduttori": "fasc-sequenza-yoga-prevenzione-pubalgia-e-rinforzo",
}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:56].rstrip("-")


def num(x):
    try:
        return float(str(x).replace(",", "."))
    except (TypeError, ValueError):
        return None


def lookup(name):
    k = name.lower().strip()
    if k in ALIAS:
        a = ALIAS[k]
        for info in CAT.values():
            if info[0] == a:
                return a, info[1], info[2], info[3], info[4], info[5]
        for i, area, unita in V1CAT.values():
            if i == a:
                return i, V1_QUALITA.get(area, "da-classificare"), unita, "corpo libero", True, False
        # Alias che punta a un id sparito dal catalogo: NON inventare, il blocco resta incompleto
        print(f"⚠️  ALIAS '{k}' → '{a}' non esiste nel catalogo")
        return None
    if k in CAT:
        return CAT[k]
    if k in V1CAT:
        i, area, unita = V1CAT[k]
        return i, V1_QUALITA.get(area, "da-classificare"), unita, "corpo libero", True, False
    return None


# ── Sets → items (raggruppa serie consecutive uguali) ─────────────────────────
def set_key(s):
    return (num(s.get("reps")), num(s.get("duration")), num(s.get("distance_short")) or num(s.get("distance")),
            num(s.get("weight")), num(s.get("rest")) or 0)


def items_from_exercise(ex, sezione, formato):
    name = ex.get("esercizio", "?")
    info = lookup(name)
    groups = []
    for s in ex.get("serie", []):
        k = set_key(s)
        if groups and groups[-1][0] == k:
            groups[-1][1] += 1
        else:
            groups.append([k, 1])
    out = []
    for (reps, dur, dist, weight, rest), n in groups:
        cat_unita = info[2] if info else None
        if dist:
            unita, q = "metri", dist
        elif dur:
            unita, q = "secondi", dur
            if cat_unita == "minuti" and dur >= 60 and dur % 60 == 0:
                unita, q = "minuti", dur / 60
        elif reps:
            unita, q = "reps", reps
        else:
            unita, q = (cat_unita or "reps"), 1
        it = {"esercizio_id": info[0] if info and info[4] else None, "nomeEverfit": name,
              "serie": n, "quantita": q, "unita": unita, "recupero_sec": int(rest)}
        if weight:
            it["carico_kg"] = weight
        if ex.get("per_lato"):
            it["perLato"] = True
        if formato in ("interval", "amrap"):
            it["schema"] = formato
        elif dur and dur <= 20 and n >= 3 and rest <= 30:
            it["schema"] = "attivazione"
        if sezione:
            it["sezione"] = sezione
        if ex.get("nota"):
            it["nota"] = str(ex["nota"])[:160]
        out.append(it)
    return out, info


# ── Meta dal titolo ──────────────────────────────────────────────────────────
KEYWORDS = [
    ("test", "test"), ("yoga", "mobilita-recupero"), ("riscaldamento", "riscaldamento"),
    ("circuito addominali", "core"), ("fascia", "fascia-prevenzione"), ("visione", "tecnica-visione"),
    ("palleggi", "tecnica-palleggi"), ("muro", "tecnica-passaggi"), ("passaggi", "tecnica-passaggi"),
    ("dribbling", "tecnica-conduzione"), ("freestyle", "tecnica-palleggi"), ("tiri", "tecnica-tiro"),
    ("tecnica", "tecnica-palleggi"), ("pliometria", "pliometria-intensiva"),
    ("resistenza alla velocità", "resistenza-rsa"), ("rapidità", "velocita"), ("velocità", "velocita"),
    ("fartlek", "resistenza-aerobica"), ("ripetute", "resistenza-aerobica"), ("resistenza", "resistenza-aerobica"),
    ("metabolico", "resistenza-metabolico"), ("salite", "resistenza-metabolico"),
    ("forza parte alta", "forza-parte-alta"), ("forza parte bassa", "forza-parte-bassa"),
    ("forza max", "forza-parte-bassa"), ("forza esplosiva", "forza-esplosiva"), ("kettlebell", "forza-esplosiva"),
]


def meta_from_title(t):
    tl = t.lower()
    m = re.search(r"\b(pro|b|a|p)\s?(\d)\b", tl)
    livello = None
    prog = None
    ruolo = None
    if m:
        code = m.group(1)
        livello = {"b": "B", "a": "A", "pro": "PRO", "p": None}[code]
        prog = int(m.group(2))
        if code == "p":
            ruolo = "portiere"  # "P1" = blocco nato per il portiere [STE] — riusato anche per gli altri, quindi non escluso
    if re.search(r"(push|pull)\s?p\d\b", tl):
        ruolo = "portiere"
    else:
        m2 = re.search(r"\b(\d)[a-d]?\b", tl)
        if m2 and "fascia" in tl:
            prog = int(m2.group(1))
    variante = "short" if "short" in tl or "soft" in tl else "full"
    qual = None
    for kw, q in KEYWORDS:
        if kw in tl:
            qual = q
            break
    sotto = None
    ms = re.search(r"\b\d([A-D])\b|\s-([A-D])\b", t)
    if ms:
        sotto = (ms.group(1) or ms.group(2))
    fam = re.sub(r"\s*-\s*(short|soft)( \d)?", "", t, flags=re.I)
    fam = re.sub(r"\b(PRO|B|A|P)\s?\d[A-D]?\b", "", fam, flags=re.I)
    fam = re.sub(r"\b\d[A-D]?\b", "", fam)
    fam = re.sub(r"\s-[A-D]\b", "", fam)
    fam = re.sub(r"\s*-\s*$", "", fam)
    fam = re.sub(r"\s{2,}", " ", fam).strip(" -")
    fam = re.sub(r"foundations?", "Foundation", fam, flags=re.I)
    fam = " ".join(w.capitalize() if w.islower() or w.isupper() and len(w) > 3 else w for w in fam.split())
    return livello, prog, variante, qual, fam, sotto, ruolo


# ── EMOM a rotazione (Ste, 17/9/2026) ────────────────────────────────────────
# Un EMOM serve a migliorare le skill con POCHE ripetizioni di qualità e il resto del minuto di
# recupero: max 3-4 reps, 1-2 quasi massimali se è forza esplosiva (broad jump, salto in alto).
# In Everfit un EMOM è una sezione `interval` per giro (stesso titolo, una sotto l'altra): qui
# diventa UN item per esercizio con serie = giri, quantità = reps al minuto (o secondi di lavoro
# per le tenute), recupero 0 (il resto del minuto). Il player lo fa girare un minuto per esercizio.
EMOM_REPS = 3             # skill e forza: poche reps di qualità (max 3-4)
EMOM_REPS_ESPLOSIVO = 2   # esplosivi: 1-2 reps quasi massimali
QUALITA_ESPLOSIVE = {"forza-esplosiva", "pliometria-intensiva", "pliometria-estensiva", "velocita"}
RE_ESPLOSIVO = re.compile(r"jump|salto|balz|broad|hop\b|bound|box |lancio|throw|sprint", re.I)


def is_emom(sec, titolo):
    return "emom" in ((sec.get("title") or "") + " " + titolo).lower()


def emom_items(sections, titolo):
    """Sezioni EMOM consecutive con lo stesso titolo = giri di un circuito a minuti."""
    gruppo = slug(sections[0].get("title") or titolo) or "emom"
    ordine, per_ex = [], {}
    for s in sections:
        for ex in s.get("esercizi", []):
            name = ex.get("esercizio", "?")
            if name not in per_ex:
                ordine.append(name)
                per_ex[name] = {"ex": ex, "giri": 0}
            per_ex[name]["giri"] += 1
    out = []
    for name in ordine:
        ex = per_ex[name]["ex"]
        info = lookup(name)
        s0 = (ex.get("serie") or [{}])[0]
        reps, dur = num(s0.get("reps")), num(s0.get("duration"))
        cat_unita = info[2] if info else "reps"
        if reps:
            unita, q = "reps", reps                      # EMOM misto: reps scritte in Everfit (duration 60 + reps + rest 0)
        elif cat_unita in ("secondi", "minuti") and dur and dur < 60:
            unita, q = "secondi", dur                    # tenuta: i secondi di lavoro dentro il minuto
        else:
            esplosivo = bool(info and (info[1] in QUALITA_ESPLOSIVE or RE_ESPLOSIVO.search(name)))
            unita, q = "reps", (EMOM_REPS_ESPLOSIVO if esplosivo else EMOM_REPS)
        it = {"esercizio_id": info[0] if info and info[4] else None, "nomeEverfit": name,
              "serie": per_ex[name]["giri"], "quantita": q, "unita": unita, "recupero_sec": 0,
              "schema": "emom", "emomGruppo": gruppo, "sezione": sections[0].get("title") or None}
        if ex.get("nota"):
            it["nota"] = str(ex["nota"])[:160]
        out.append((it, info))
    return out


def durata_min(items, amrap_sec):
    if amrap_sec:
        return round(amrap_sec / 60) + 3
    sec = 0
    for it in items:
        q = it["quantita"]
        if it.get("schema") == "emom":
            sec += it["serie"] * 60                      # un minuto per giro, recupero compreso
            continue
        lav = q if it["unita"] == "secondi" else q * 60 if it["unita"] == "minuti" else q / 5 if it["unita"] == "metri" else q * 3
        # per lato: Everfit elenca già i due lati come serie separate → niente raddoppio
        sec += it["serie"] * (lav + it["recupero_sec"])
    return max(5, round(sec / 60) + 3)


# ── Build ────────────────────────────────────────────────────────────────────
by_title = {}
for w in WORKOUTS:
    t = (w.get("titolo") or "").strip()
    t = re.sub(r"\s*-\s*Sergi Marzo$", "", t)  # nessun nome cliente nella libreria
    if not t:
        continue
    n_items = sum(len(s.get("esercizi", [])) for s in w.get("sezioni", []))
    if t not in by_title or n_items > by_title[t][0]:
        by_title[t] = (n_items, w)

blocchi = []
seen = set()
for t, (_, w) in sorted(by_title.items(), key=lambda x: x[0].lower()):
    items, mancanti, quali, attrezz, coppia = [], [], Counter(), set(), False
    amrap_sec = None

    def registra(its, info, nome):
        items.extend(its)
        if not info or not info[4]:
            mancanti.append(nome)
        else:
            quali[info[1]] += sum(i["serie"] for i in its) or 1
            if info[3] and info[3] != "corpo libero":
                attrezz.add(info[3])
            if info[5]:
                coppia = True

    sezioni = w.get("sezioni", [])
    i = 0
    while i < len(sezioni):
        s = sezioni[i]
        if is_emom(s, t):
            # giri = sezioni EMOM consecutive con lo stesso titolo
            j = i
            while j < len(sezioni) and is_emom(sezioni[j], t) and (sezioni[j].get("title") or "") == (s.get("title") or ""):
                j += 1
            for it, info in emom_items(sezioni[i:j], t):
                registra([it], info, it["nomeEverfit"])
            i = j
            continue
        formato = s.get("formato") or "regular"
        if formato == "amrap" and s.get("time"):
            amrap_sec = int(s["time"])
        sez = (s.get("title") or "").strip() or None
        for ex in s.get("esercizi", []):
            its, info = items_from_exercise(ex, sez, formato)
            registra(its, info, ex.get("esercizio", "?"))
        i += 1
    livello, prog, variante, qual_kw, fam, sotto, ruolo = meta_from_title(t)
    qual = qual_kw or (quali.most_common(1)[0][0] if quali else "da-classificare")
    base = slug(t)
    sid, k = base, 2
    while sid in seen:
        sid = f"{base}-{k}"
        k += 1
    seen.add(sid)
    blocchi.append({
        "id": sid, "nome": t, "nomeEverfit": t, "famiglia": fam, "qualita": qual, "qualitaSet": dict(quali),
        "livello": livello, "progressione": prog, "variante": variante, **({"sottovariante": sotto} if sotto else {}), **({"ruolo": ruolo} if ruolo else {}),
        "durataMin": durata_min(items, amrap_sec), "attrezzatura": sorted(attrezz), "inCoppia": coppia,
        "items": items, "completo": not mancanti, "mancanti": sorted(set(mancanti)),
        **({"amrapSec": amrap_sec} if amrap_sec else {}),
        **({"descrizione": w["descrizione"][:300]} if w.get("descrizione") else {}),
        "tags": w.get("tags", []),
    })

header = f"""/**
 * FYF Training — libreria BLOCCHI GENERATA (non modificare a mano).
 *
 * Sorgente: docs/everfit-workouts.json ({len(WORKOUTS)} workout Everfit, {len(blocchi)} titoli
 * distinti) → scripts/build-blocks.py. Alias ed euristiche nello script.
 * Blocchi completi: {sum(1 for b in blocchi if b['completo'])} · incompleti (esercizi non mappati): {sum(1 for b in blocchi if not b['completo'])}.
 */
import type {{ Blocco }} from './trainingBlocks';

export const BLOCCHI: Blocco[] = """
# ── Integrità: ogni esercizio_id nei blocchi deve esistere nel catalogo ──────
_ids = {info[0] for info in CAT.values()} | {v[0] for v in V1CAT.values()}
_orfani = sorted({it["esercizio_id"] for b in blocchi for it in b["items"] if it.get("esercizio_id") and it["esercizio_id"] not in _ids})
if _orfani:
    raise SystemExit(f"❌ esercizio_id non presenti nel catalogo: {', '.join(_orfani)} — correggi ALIAS o il JSON prima di rigenerare")

open("lib/trainingBlocks.generated.ts", "w", encoding="utf-8").write(
    header + json.dumps(blocchi, ensure_ascii=False, indent=1) + ";\n")

# ── Report ───────────────────────────────────────────────────────────────────
miss = Counter()
for b in blocchi:
    for m in b["mancanti"]:
        miss[m] += 1
lines = ["# Libreria blocchi — report generazione", "",
         f"{len(WORKOUTS)} workout Everfit → {len(blocchi)} blocchi (titoli distinti). "
         f"Completi: {sum(1 for b in blocchi if b['completo'])} · incompleti: {sum(1 for b in blocchi if not b['completo'])}.",
         "", "Rigenerare: `python3 scripts/build-catalog-v2.py && python3 scripts/build-blocks.py`.", "",
         "## Esercizi non mappati (occorrenze in blocchi)", "",
         " · ".join(f"{n} ({c})" for n, c in miss.most_common()) or "nessuno", "",
         "## Blocchi", "", "| id | nome | qualità | livello | prog | variante | ~min | attrezzatura | completo | mancanti |",
         "|---|---|---|---|---|---|---|---|---|---|"]
for b in blocchi:
    lines.append(f"| `{b['id']}` | {b['nome']} | {b['qualita']} | {b['livello'] or '—'} | {b['progressione'] or '—'} | {b['variante']} | {b['durataMin']} | {', '.join(b['attrezzatura']) or '—'} | {'✓' if b['completo'] else '✗'} | {', '.join(b['mancanti'])} |")
open("docs/training-blocchi.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(f"lib/trainingBlocks.generated.ts: {len(blocchi)} blocchi ({sum(1 for b in blocchi if b['completo'])} completi)")
