#!/usr/bin/env python3
"""
Scansiona il canale YouTube di Ste (video pubblici + playlist) e scrive
docs/youtube-channel.json. Usa le pagine HTML del canale (ytInitialData) e
l'endpoint youtubei/browse per le pagine successive. Serve la rete aperta.

Uso: python3 scripts/youtube-channel-scan.py
"""
import json, re, sys, urllib.request

CHANNEL_ID = "UCrpiFJOHWyzO7qanluppQeQ"
HDRS = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept-Language": "it-IT,it;q=0.9", "Cookie": "CONSENT=YES+1; SOCS=CAI"}


def get(url, data=None, extra=None):
    h = dict(HDRS); h.update(extra or {})
    req = urllib.request.Request(url, data=data, headers=h)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")


def yt_data(html):
    return json.loads(re.search(r"var ytInitialData = (\{.*?\});</script>", html, re.S).group(1))


def walk(o, key, out):
    if isinstance(o, dict):
        if key in o: out.append(o[key])
        for v in o.values(): walk(v, key, out)
    elif isinstance(o, list):
        for v in o: walk(v, key, out)


def txt(o):
    if not o: return ""
    if isinstance(o, str): return o
    if "simpleText" in o: return o["simpleText"]
    if isinstance(o.get("content"), str): return o["content"]
    return "".join(r.get("text", "") for r in o.get("runs", []))


def extract(d):
    out = {}
    L = []; walk(d, "lockupViewModel", L)
    for p in L:
        cid = p.get("contentId")
        if not cid or len(cid) != 11: continue
        meta = p.get("metadata", {}).get("lockupMetadataViewModel", {})
        badges = []; walk(p, "thumbnailBadgeViewModel", badges)
        dur = next((b.get("text") for b in badges if re.match(r"^\d+:\d\d", str(b.get("text", "")))), "")
        out[cid] = {"id": cid, "titolo": txt(meta.get("title")), "durata": dur}
    G = []
    def g(o):
        if isinstance(o, dict):
            if isinstance(o.get("videoId"), str) and len(o["videoId"]) == 11 and ("title" in o or "headline" in o): G.append(o)
            for v in o.values(): g(v)
        elif isinstance(o, list):
            for v in o: g(v)
    g(d)
    for o in G:
        vid = o["videoId"]
        if vid not in out or not out[vid]["titolo"]:
            out[vid] = {"id": vid, "titolo": txt(o.get("title") or o.get("headline")), "durata": txt(o.get("lengthText")) or out.get(vid, {}).get("durata", "")}
    return out


def main():
    html = get(f"https://www.youtube.com/channel/{CHANNEL_ID}/videos")
    d = yt_data(html); videos = extract(d)
    key = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html).group(1)
    ver = re.search(r'"INNERTUBE_CLIENT_VERSION":"([^"]+)"', html).group(1)
    conts = []; walk(d, "continuationCommand", conts); tok = conts[0]["token"] if conts else None
    n = 0
    while tok and n < 30:
        body = json.dumps({"context": {"client": {"clientName": "WEB", "clientVersion": ver, "hl": "it", "gl": "IT"}}, "continuation": tok}).encode()
        r = json.loads(get("https://www.youtube.com/youtubei/v1/browse?key=" + key, data=body, extra={"Content-Type": "application/json"}))
        got = extract(r); before = len(videos)
        for k, v in got.items(): videos.setdefault(k, v)
        conts = []; walk(r, "continuationCommand", conts); tok = conts[0]["token"] if conts else None; n += 1
        if len(videos) == before: break
    ph = get(f"https://www.youtube.com/channel/{CHANNEL_ID}/playlists"); pd = yt_data(ph)
    pls = {}
    L = []; walk(pd, "lockupViewModel", L)
    for p in L:
        pid = p.get("contentId", "")
        if not pid.startswith("PL"): continue
        name = txt(p.get("metadata", {}).get("lockupMetadataViewModel", {}).get("title"))
        pd2 = yt_data(get(f"https://www.youtube.com/playlist?list={pid}"))
        got = extract(pd2)
        for k, v in got.items():
            videos.setdefault(k, v)
            if not videos[k]["durata"]: videos[k]["durata"] = v["durata"]
        pls[pid] = {"nome": name, "ids": list(got.keys())}
    for vid, v in videos.items():
        v["playlist"] = [p["nome"] for p in pls.values() if vid in p["ids"]]
    json.dump({"channel_id": CHANNEL_ID, "videos": list(videos.values()), "playlists": pls},
              open("docs/youtube-channel.json", "w"), ensure_ascii=False, indent=1)
    print(f"{len(videos)} video, {len(pls)} playlist → docs/youtube-channel.json")


if __name__ == "__main__":
    main()
