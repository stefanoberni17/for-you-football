import re, os, sys, json
OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
DECL = json.loads(sys.argv[1])  # {"W1-G1":3,...}
SIL = re.compile(r"^\[SILENZIO (\d+(?:\.\d)?)\]$"); REG=re.compile(r"^\[(sincere|relaxed|meditative)\]$")
rows=[]; ok=True
for name in DECL:
    lines=open(os.path.join(OUT,name+".txt"),encoding="utf-8").read().split("\n")
    if lines[-1]=="": lines=lines[:-1]
    sil=0.0; ntext=0; chars=0; errs=[]
    if not REG.match(lines[0]): errs.append("manca registro iniziale")
    for i,l in enumerate(lines):
        if l.strip()=="": errs.append(f"riga vuota {i+1}"); continue
        if SIL.match(l): sil+=float(SIL.match(l).group(1)); continue
        if REG.match(l): continue
        if "—" in l or "–" in l: errs.append(f"trattino lungo riga {i+1}")
        if "[" in l or "]" in l: errs.append(f"tag estraneo riga {i+1}: {l[:40]}")
        if "..." in l or "…" in l: errs.append(f"puntini riga {i+1}")
        ntext+=1; chars+=len(l)
    est=sil+chars/14.0
    if errs: ok=False; print(name,"ERRORI:",errs)
    rows.append((name,round(est),DECL[name],ntext,chars))
with open(os.path.join(OUT,"manifest_B1-W1-W2.tsv"),"w",encoding="utf-8") as f:
    f.write("giorno\tdurata_stimata_secondi\tdurata_minuti_dichiarata\tnumero_righe_testo\tcaratteri_testo\n")
    for r in rows: f.write("\t".join(str(x) for x in r)+"\n")
for r in rows: print(f"{r[0]}\t{r[1]}s ({r[1]//60}:{r[1]%60:02d})\t{r[2]} min\t{r[3]} righe\t{r[4]} chars")
print("OK" if ok else "FORMATO NON VALIDO")
