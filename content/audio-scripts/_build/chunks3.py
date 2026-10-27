import re, json, os, hashlib, shutil, sys
OUT=os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)),".."))
SIL=re.compile(r"^\[SILENZIO (\d+(?:\.\d)?)\]$"); REG=re.compile(r"^\[(sincere|relaxed|meditative)\]$")
names=sys.argv[1:]
plan=json.load(open('plan3.json')) if os.path.exists('plan3.json') else {}
for name in names:
    lines=[l for l in open(f"{OUT}/{name}.txt",encoding="utf-8").read().split("\n") if l!=""]
    items=[]; buf=[]; tag=None
    def flush():
        if buf: items.append({"type":"text","tag":tag,"text":" ".join(buf)}); buf.clear()
    for l in lines:
        m=SIL.match(l); r=REG.match(l)
        if r: flush(); tag=r.group(1)
        elif m: flush(); items.append({"type":"sil","sec":float(m.group(1))})
        else: buf.append(l)
    flush()
    for it in items:
        if it["type"]=="text":
            it["key"]=f"[{it['tag']}] {it['text']}"; it["id"]=hashlib.sha1(it["key"].encode()).hexdigest()[:12]
    plan[name]=items
json.dump(plan,open("plan3.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
os.makedirs("cache",exist_ok=True)
# seed cache from v4b (W2-G1 final scheme)
if os.path.exists('urls_v4b.tsv') and not os.path.exists('cache/.seeded'):
    uniq=json.load(open('uniq.json')); bytext={v['text']:k for k,v in uniq.items()}
    for l in open('urls_v4b.tsv',encoding='utf-8'):
        p=l.split('\t')[0]; m=re.match(r'^\[([a-z]+)\] ',p); t=re.sub(r'^(\[[a-z ]+\] )+','',p)
        uid=bytext.get(t) or next((k for tx,k in bytext.items() if tx.startswith(t[:120])),None)
        if not uid or not m or not os.path.exists(f'v4b/{uid}.mp3'): continue
        key=f"[{m.group(1)}] {uniq[uid]['text']}"; h=hashlib.sha1(key.encode()).hexdigest()[:12]
        shutil.copy(f'v4b/{uid}.mp3',f'cache/{h}.mp3')
    open('cache/.seeded','w').write('1')
todo={}
for name in names:
    for it in plan[name]:
        if it["type"]=="text" and not os.path.exists(f"cache/{it['id']}.mp3"): todo[it["id"]]=it["key"]
json.dump(todo,open("todo.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print("file:",names); print("pezzi unici totali:",len({it['id'] for n in names for it in plan[n] if it['type']=='text'}),"da generare:",len(todo),"caratteri:",sum(len(v) for v in todo.values()))
for k,v in todo.items(): print(k, v[:90])
