import json, subprocess, os, sys
names=sys.argv[1:]
plan=json.load(open('plan3.json'))
OUT='raw3'; WAV='wav3'; os.makedirs(OUT,exist_ok=True); os.makedirs(WAV,exist_ok=True)
TRIM='silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse'
def run(c): subprocess.run(c,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def wav_of(uid):
    w=f'{WAV}/{uid}.wav'
    if not os.path.exists(w): run(['ffmpeg','-y','-i',f'cache/{uid}.mp3','-af',TRIM,'-ar','44100','-ac','1',w])
    return w
def sil_of(sec):
    w=f'{WAV}/sil_{sec}.wav'
    if not os.path.exists(w): run(['ffmpeg','-y','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-t',str(sec),w])
    return w
for name in names:
    parts=[]
    for it in plan[name]:
        parts.append(wav_of(it['id']) if it['type']=='text' else sil_of(it['sec']))
    lst=f'{WAV}/{name}.txt'
    open(lst,'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in parts))
    out=f'{OUT}/{name}.mp3'
    run(['ffmpeg','-y','-f','concat','-safe','0','-i',lst,'-ar','44100','-ac','1','-b:a','128k',out])
    d=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out],capture_output=True,text=True).stdout.strip()
    print(name, f"{int(float(d))//60}:{int(float(d))%60:02d}", os.path.getsize(out)//1024,'KB')
