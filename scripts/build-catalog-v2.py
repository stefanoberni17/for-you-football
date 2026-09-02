#!/usr/bin/env python3
"""
Genera lib/trainingCatalogV2.generated.ts da docs/training-catalogo-v2.json
(lista candidati + review di Ste). NON toccare a mano il file generato:
modifica il JSON (o la review xlsx) e rilancia.

Uso: python3 scripts/build-catalog-v2.py
"""
import json
import re
import unicodedata

rows = json.load(open("docs/training-catalogo-v2.json", encoding="utf-8"))
TS_V1 = open("lib/trainingCatalog.ts", encoding="utf-8").read()
V1 = {m.group(2).lower(): m.group(1) for m in re.finditer(r"id: '([^']+)', nome: '([^']+)'", TS_V1)}

PREFIX = {
    "forza-parte-bassa": "fpb", "forza-parte-alta": "fpa", "core": "core2", "forza-esplosiva": "fesp",
    "pliometria-estensiva": "plioe", "pliometria-intensiva": "plioi", "velocita": "vel", "resistenza-aerobica": "aer",
    "resistenza-metabolico": "met", "resistenza-rsa": "rsa", "fascia-prevenzione": "fasc", "tecnica-palleggi": "tpal",
    "tecnica-passaggi": "tpas", "tecnica-conduzione": "tcon", "tecnica-tiro": "ttir", "tecnica-visione": "tvis",
    "riscaldamento": "risc", "mobilita-recupero": "mob", "test": "test2", "da-classificare": "dacl",
}


def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s[:48].rstrip("-")


def ts_str(v):
    return json.dumps(v, ensure_ascii=False)


def v1_id(nome):
    n = nome.lower()
    if n in V1:
        return V1[n]
    for k, v in V1.items():
        if len(k) > 8 and (k in n or n in k):
            return v
    return None


seen = set()
lines = []
for r in rows:
    base = f"{PREFIX[r['qualita']]}-{slug(r['nome'])}"
    sid, k = base, 2
    while sid in seen:
        sid = f"{base}-{k}"; k += 1
    seen.add(sid)
    fields = [
        f"id: {ts_str(sid)}",
        f"nome: {ts_str(r['nome'])}",
        f"qualita: {ts_str(r['qualita'])}",
        f"attrezzatura: {ts_str(r['attrezzatura'])}",
        f"difficolta: {int(r['difficolta'])}",
        f"livelloMin: {ts_str(r['livello_min'])}",
        f"unita: {ts_str(r['unita'])}",
        f"attivo: {'true' if r['attivo'] else 'false'}",
        f"fonte: {ts_str(r['fonte'])}",
    ]
    if r.get("sottogruppo"):
        fields.append(f"sottogruppo: {ts_str(r['sottogruppo'])}")
    if r.get("qualita_secondaria"):
        fields.append(f"qualitaSecondaria: {ts_str(r['qualita_secondaria'])}")
    if r.get("per_lato"):
        fields.append("perLato: true")
    if r.get("in_coppia"):
        fields.append("inCoppia: true")
    if r.get("video"):
        fields.append(f"videoUrl: {ts_str(r['video'])}")
    if r.get("note"):
        fields.append(f"note: {ts_str(r['note'])}")
    if r.get("nome_everfit") and r["nome_everfit"] != r["nome"]:
        fields.append(f"nomeEverfit: {ts_str(r['nome_everfit'])}")
    v1 = v1_id(r["nome"]) if r["azione"] == "già in v1" else None
    if v1:
        fields.append(f"v1Id: {ts_str(v1)}")
    if r.get("tags"):
        fields.append(f"tags: {ts_str(r['tags'])}")
    lines.append("  { " + ", ".join(fields) + " },")

header = """/**
 * FYF Training — catalogo v2 GENERATO (non modificare a mano).
 *
 * Sorgente: docs/training-catalogo-v2.json = lista candidati (Everfit custom +
 * File_DB DB ESERCIZI + v1) con la review di Ste del 2 set 2026.
 * Rigenera con:  python3 scripts/build-catalog-v2.py
 *
 * Il catalogo v1 (lib/trainingCatalog.ts) resta la fonte delle catene corpo
 * libero, dei test e dei bounds live; questo file aggiunge la libreria estesa
 * per qualità (forza palestra, pliometria, velocità, resistenza, tecnica,
 * fascia, mobilità). Gli esercizi con attivo=false sono importati ma non
 * proposti dal planner (headball non disponibile, duplicati v1, esclusi).
 */
import type { ExerciseV2 } from './trainingCatalogV2';

export const ESERCIZI_V2: ExerciseV2[] = [
"""
open("lib/trainingCatalogV2.generated.ts", "w", encoding="utf-8").write(header + "\n".join(lines) + "\n];\n")
print(f"lib/trainingCatalogV2.generated.ts: {len(lines)} esercizi ({sum(1 for r in rows if r['attivo'])} attivi)")
