#!/usr/bin/env python3
"""
Genera docs/schede/<gruppo>-correzioni.md: il file che Ste MODIFICA (10/10/2026, "dammi un file che posso
modificare"). Un blocco numerato per esercizio con nome, video, la mia esecuzione in breve e una riga
"Correzione:" vuota dove Ste scrive cos'è davvero l'esercizio e come si fa. Io poi riporto nel JSON.
Il file di lettura completo resta docs/schede/<gruppo>.md (build-schede-md.py).

Uso: python3 scripts/build-schede-correzioni.py [gruppo]   (default: fascia-riscaldamento)
"""
import json
import sys


GRUPPI = {
    "fascia-riscaldamento": ["fascia-prevenzione", "riscaldamento", "mobilita-recupero"],
    "parte-bassa-core": ["forza-parte-bassa", "core"],
    "parte-alta": ["forza-parte-alta"],
    "esplosiva-pliometria": ["forza-esplosiva", "pliometria-estensiva", "pliometria-intensiva"],
    "velocita-resistenza-test": ["velocita", "resistenza-aerobica", "resistenza-metabolico", "resistenza-rsa", "test"],
    "tecnica": ["tecnica-palleggi", "tecnica-passaggi", "tecnica-conduzione", "tecnica-tiro", "tecnica-visione"],
}
slug = sys.argv[1] if len(sys.argv) > 1 else "fascia-riscaldamento"
qualita = GRUPPI[slug]
rows = json.load(open("docs/training-catalogo-v2.json", encoding="utf-8"))
con = [r for r in rows if r["qualita"] in qualita and r["attivo"] and r.get("scheda")]

out = [f"# Correzioni schede: {slug} ({len(con)} esercizi)", "",
       "Come si usa: sotto ogni esercizio c'è la riga `Correzione:`. Scrivi lì, in libertà, cos'è davvero l'esercizio",
       "e come si fa (anche due righe). Se la scheda è giusta lascia `Correzione: ok`. Se non la vuoi guardare ora, lascia vuoto.",
       "Puoi farne anche solo una parte: io riporto nel JSON quello che trovo scritto.", ""]
for i, r in enumerate(con, 1):
    sc = r["scheda"]
    out.append(f"## {i}. {r['nome']}")
    meta = []
    if r.get("nome_en"):
        meta.append(f"inglese: {r['nome_en']}")
    meta.append("per lato" if r.get("per_lato") else "bilaterale")
    meta.append(r["unita"])
    meta.append(f"video: {r['video']}" if r.get("video") else "senza video")
    out.append(" · ".join(meta))
    out.append("")
    out.append("Come l'ho scritto io: " + " ".join(sc.get("esecuzione", [])))
    if sc.get("da_confermare"):
        out.append("Il mio dubbio: " + sc["da_confermare"])
    out.append("")
    out.append("Correzione: ")
    out.append("")
open(f"docs/schede/{slug}-correzioni.md", "w", encoding="utf-8").write("\n".join(out))
print(f"docs/schede/{slug}-correzioni.md: {len(con)} esercizi")
