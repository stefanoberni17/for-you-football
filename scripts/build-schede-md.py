#!/usr/bin/env python3
"""
Genera docs/schede/<gruppo>.md dalle schede in docs/training-catalogo-v2.json, per la revisione di Ste
su GitHub (9/10/2026, docs/campo-audit-2026-10-09.md §B). Un file per gruppo di qualità; dentro, una
sezione per esercizio con nome, nome inglese, id, lato, video, esecuzione, errori, più facile/difficile,
sicurezza e la riga "DA CONFERMARE" quando ho un dubbio. Si rilancia dopo ogni batch.

Uso: python3 scripts/build-schede-md.py
"""
import json
import os

GRUPPI = [
    ("fascia-riscaldamento", "Fascia e prevenzione, riscaldamento, mobilità e recupero", ["fascia-prevenzione", "riscaldamento", "mobilita-recupero"]),
    ("parte-bassa-core", "Forza parte bassa e core", ["forza-parte-bassa", "core"]),
    ("parte-alta", "Forza parte alta", ["forza-parte-alta"]),
    ("esplosiva-pliometria", "Forza esplosiva e pliometria", ["forza-esplosiva", "pliometria-estensiva", "pliometria-intensiva"]),
    ("velocita-resistenza-test", "Velocità, resistenza e test", ["velocita", "resistenza-aerobica", "resistenza-metabolico", "resistenza-rsa", "test"]),
    ("tecnica", "Tecnica", ["tecnica-palleggi", "tecnica-passaggi", "tecnica-conduzione", "tecnica-tiro", "tecnica-visione"]),
]

rows = json.load(open("docs/training-catalogo-v2.json", encoding="utf-8"))
os.makedirs("docs/schede", exist_ok=True)
tot = 0
for slug, titolo, qualita in GRUPPI:
    attivi = [r for r in rows if r["qualita"] in qualita and r["attivo"]]
    con = [r for r in attivi if r.get("scheda")]
    senza = [r for r in attivi if not r.get("scheda")]
    if not con:
        continue
    out = [f"# Schede esercizi: {titolo}", "",
           f"Generato da `scripts/build-schede-md.py` da `docs/training-catalogo-v2.json`. {len(con)} schede su {len(attivi)} esercizi attivi del gruppo.",
           "Per correggere: scrivi qui sotto nella PR o in chat il nome dell'esercizio e la riga da cambiare; il JSON lo aggiorno io.", ""]
    dubbi = [r for r in con if r["scheda"].get("da_confermare")]
    if dubbi:
        out += ["## Da confermare (" + str(len(dubbi)) + ")", ""]
        out += [f"- **{r['nome']}**: {r['scheda']['da_confermare']}" for r in dubbi] + [""]
    for q in qualita:
        gr = [r for r in con if r["qualita"] == q]
        if not gr:
            continue
        out += [f"## {q} ({len(gr)})", ""]
        for r in gr:
            sc = r["scheda"]
            out.append(f"### {r['nome']}")
            meta = [f"`{r.get('id') or '-'}`", "per lato" if r.get("per_lato") else "bilaterale", r["unita"], r["attrezzatura"]]
            if r.get("nome_en"):
                meta.insert(1, f"inglese: {r['nome_en']}")
            if r.get("video"):
                meta.append(f"[video]({r['video']})")
            else:
                meta.append("senza video")
            out.append(" · ".join(meta))
            out.append("")
            out.append("**Esecuzione**")
            out += [f"{i + 1}. {p}" for i, p in enumerate(sc.get("esecuzione", []))]
            out.append("")
            out.append("**Errori comuni:** " + " ".join(sc.get("errori", [])))
            if sc.get("piu_facile"):
                out.append(f"**Più facile:** {sc['piu_facile']}")
            if sc.get("piu_difficile"):
                out.append(f"**Più difficile:** {sc['piu_difficile']}")
            if sc.get("sicurezza"):
                out.append(f"**Sicurezza:** {sc['sicurezza']}")
            if sc.get("da_confermare"):
                out.append(f"**DA CONFERMARE:** {sc['da_confermare']}")
            out.append("")
    if senza:
        out += ["## Senza scheda in questo gruppo (" + str(len(senza)) + ")", ""]
        out += [f"- {r['nome']} (`{r.get('id') or '-'}`)" for r in senza] + [""]
    open(f"docs/schede/{slug}.md", "w", encoding="utf-8").write("\n".join(out))
    tot += len(con)
    print(f"docs/schede/{slug}.md: {len(con)} schede, {len(senza)} senza")
print(f"totale schede: {tot} su {sum(1 for r in rows if r['attivo'])} attivi")
