import json, glob, os, subprocess, hashlib, re, sys
import glob as _g
D=sorted(_g.glob('/root/.claude/projects/-home-user-for-you-football/*/tool-results/'))[-1] if not os.environ.get('TOOL_RESULTS_DIR') else os.environ['TOOL_RESULTS_DIR']
files=sorted(glob.glob(D+'mcp-Eleven_labs_completo-creative_get_flow_run_status-*.txt'))
todo=json.load(open('todo.json'))
bykey={v:k for k,v in todo.items()}
seen={}; incomplete=0; failed=[]
for f in files:
    try: d=json.load(open(f))
    except Exception as e: print('skip',f,e); continue
    for g in d.get('generations',[]):
        p=g.get('prompt'); st=g.get('status')
        if st!='completed':
            incomplete+=1
            if st=='failed': failed.append(p[:60])
            continue
        uid=bykey.get(p)
        if not uid:
            # prefix match (prompt may be truncated)
            uid=next((k for key,k in bykey.items() if key.startswith(p[:150])),None)
        if uid and g.get('content_url'): seen[uid]=(g['content_url'],g.get('duration_secs'))
n=0; dur={}
for uid,(u,dsec) in seen.items():
    out=f'cache/{uid}.mp3'
    if os.path.exists(out) and os.path.getsize(out)>1000: continue
    if subprocess.run(['curl','-sS','-f','-o',out,u]).returncode==0: n+=1
    else: print('FAIL',uid)
print('file stato:',len(files),'| completati trovati:',len(seen),'| non completati:',incomplete,'| falliti:',failed)
print('scaricati ora:',n,'| in cache:',len([x for x in os.listdir('cache') if x.endswith('.mp3')]))
missing=[k for k in todo if not os.path.exists(f'cache/{k}.mp3')]
print('mancanti su todo:',len(missing)); print(missing[:200])
