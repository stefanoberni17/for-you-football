#!/usr/bin/env python3
"""Carica MP3 nel bucket pubblico `practice-audio` di Supabase Storage.

Uso:  python3 upload_supabase.py <file.mp3> [<file.mp3> ...]   [--force]

Credenziali SOLO da variabili d'ambiente (mai in chat, repo o log):
  - S3 (preferita):  SUPABASE_S3_ACCESS_KEY_ID + SUPABASE_S3_SECRET_ACCESS_KEY
  - oppure REST:     SUPABASE_SERVICE_ROLE_KEY
Non sovrascrive un file già presente senza --force. Non cancella mai niente.
Stampa l'URL pubblico da scrivere nel campo "Audio Pratica" su Notion.
"""
import os, sys, hashlib, hmac, datetime, urllib.parse
import requests

PROJECT = "njmgkatdpberwhltgbmd"
BUCKET = "practice-audio"
HOST = f"{PROJECT}.supabase.co"
REGION = "us-east-1"
PUBLIC = f"https://{HOST}/storage/v1/object/public/{BUCKET}/"

def exists(name: str) -> bool:
    return requests.head(PUBLIC + name, timeout=30).status_code == 200

def put_rest(path: str, name: str, key: str) -> None:
    with open(path, "rb") as f:
        r = requests.post(
            f"https://{HOST}/storage/v1/object/{BUCKET}/{name}",
            headers={"Authorization": f"Bearer {key}", "apikey": key,
                     "Content-Type": "audio/mpeg", "x-upsert": "true", "cache-control": "max-age=3600"},
            data=f, timeout=300)
    r.raise_for_status()

def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()

def put_s3(path: str, name: str, ak: str, sk: str) -> None:
    body = open(path, "rb").read()
    now = datetime.datetime.now(datetime.timezone.utc)
    amz = now.strftime("%Y%m%dT%H%M%SZ"); day = now.strftime("%Y%m%d")
    uri = f"/storage/v1/s3/{BUCKET}/{urllib.parse.quote(name)}"
    sha = hashlib.sha256(body).hexdigest()
    headers = {"host": HOST, "x-amz-content-sha256": sha, "x-amz-date": amz, "content-type": "audio/mpeg"}
    signed = ";".join(sorted(headers))
    canonical = "\n".join(["PUT", uri, "", *(f"{k}:{headers[k]}" for k in sorted(headers)), "", signed, sha])
    scope = f"{day}/{REGION}/s3/aws4_request"
    sts = "\n".join(["AWS4-HMAC-SHA256", amz, scope, hashlib.sha256(canonical.encode()).hexdigest()])
    k = _sign(_sign(_sign(_sign(("AWS4" + sk).encode(), day), REGION), "s3"), "aws4_request")
    sig = hmac.new(k, sts.encode(), hashlib.sha256).hexdigest()
    auth = f"AWS4-HMAC-SHA256 Credential={ak}/{scope}, SignedHeaders={signed}, Signature={sig}"
    r = requests.put(f"https://{HOST}{uri}", data=body,
                     headers={**{k: v for k, v in headers.items() if k != "host"}, "Authorization": auth}, timeout=300)
    if r.status_code >= 300:
        raise SystemExit(f"S3 PUT {name}: {r.status_code} {r.text[:300]}")

def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    if not args:
        raise SystemExit(__doc__)
    ak, sk, srk = (os.environ.get("SUPABASE_S3_ACCESS_KEY_ID"), os.environ.get("SUPABASE_S3_SECRET_ACCESS_KEY"),
                   os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    if not ((ak and sk) or srk):
        raise SystemExit("Nessuna credenziale: servono SUPABASE_S3_ACCESS_KEY_ID + SUPABASE_S3_SECRET_ACCESS_KEY "
                         "oppure SUPABASE_SERVICE_ROLE_KEY nell'ambiente.")
    for path in args:
        name = os.path.basename(path)
        if exists(name) and not force:
            print(f"SALTO {name}: esiste già (usa --force solo con l'ok di Ste)"); continue
        if ak and sk: put_s3(path, name, ak, sk)
        else: put_rest(path, name, srk)
        ok = exists(name)
        print(f"{'OK   ' if ok else 'ERR  '}{name}  {os.path.getsize(path)//1024} KB  {PUBLIC}{name}")

if __name__ == "__main__":
    main()
