# uso: monta.py video voce offset righe.json out_base
import sys, json, subprocess
video, voce, off, righe_f, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
righe = json.load(open(righe_f))
def t(s, sep):
    s += off; h=int(s//3600); m=int(s%3600//60); sec=s%60
    return f"{h}:{m:02d}:{sec:05.2f}" if sep=='.' else f"{h:02d}:{m:02d}:{int(sec):02d},{int(round((sec%1)*1000)):03d}"
ass=["[Script Info]","ScriptType: v4.00+","PlayResX: 1080","PlayResY: 1920","WrapStyle: 0","",
"[V4+ Styles]","Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
"Style: Sub,DejaVu Sans,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,5,2,2,90,90,330,1","",
"[Events]","Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
srt=[]
for i,(a,b,x) in enumerate(righe,1):
    ass.append(f"Dialogue: 0,{t(a,'.')},{t(b,'.')},Sub,,0,0,0,,{x}")
    srt += [str(i), f"{t(a,',')} --> {t(b,',')}", x, ""]
open(out+".ass","w").write("\n".join(ass)+"\n")
open(out+".srt","w").write("\n".join(srt))
ms=int(off*1000)
subprocess.run(["ffmpeg","-v","error","-y","-i",video,"-i",voce,"-filter_complex",
 f"[0:v]ass={out}.ass[v];[0:a]volume=0.08[a0];[1:a]adelay={ms}|{ms}[a1];[a0][a1]amix=inputs=2:duration=first:normalize=0[a]",
 "-map","[v]","-map","[a]","-c:v","libx264","-preset","medium","-crf","20","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-movflags","+faststart",out+".mp4"],check=True)
