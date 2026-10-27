"""Controllo copioni contro Notion (26/10).

Legge notion_snapshot.json (DB Giorni, salvato da una query MCP) e i copioni
../W<w>-G<g>-apertura.txt / -pratica.txt (o ../W<w>-G<g>.txt se non ancora divisi).
Per ogni giorno con audio:
  - ogni frase di Notion (Apertura, Pratica, Nota Campo, Domanda) deve trovarsi nel copione
    (confronto su testo normalizzato, fuzzy >= SOGLIA); le frasi che mancano o sono cambiate
    vengono stampate con la frase più vicina del copione;
  - stampa le righe del copione che non vengono da Notion (le aggiunte di regia: Reset,
    "Bene. Torna qui.", i "Uno. Arrivare." ...), solo con --aggiunte.
Uso: python3 check_notion.py [W8-G1 ...] [--aggiunte]
"""
import json, re, sys, os, unicodedata
from difflib import SequenceMatcher

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..'))
SOGLIA = 0.86
NOTA = False
# Frasi di Notion che nel copione sono dette in un altro modo per convenzione (la formula d'arrivo
# diventa ARRIVO / RESET3 guidati; i riepiloghi dei passi diventano "Uno. ...", "Due. ..."):
IGNORA = [r'occhi aperti.*sterno', r'^fai (tre|\d) reset per arrivare qui', r'^naso pancia bocca$',
          r'^siediti$', r'^poi la spiegazione passo per passo$', r'^piedi stomaco petto spalle$',
          r'^oggi in (circa )?\w+ minuti( cinque| quattro| tre)? passi$',
          r'^inspira con il gesto espira con (la tua parola|il mantra)']

NUM = {'1': 'uno', '2': 'due', '3': 'tre', '4': 'quattro', '5': 'cinque', '6': 'sei', '7': 'sette',
       '8': 'otto', '9': 'nove', '10': 'dieci', '12': 'dodici', '15': 'quindici', '20': 'venti',
       '30': 'trenta', '60': 'sessanta', '90': 'novanta'}


def norm(s: str) -> str:
    s = s.lower().replace('’', "'").replace('…', ' ')
    s = re.sub(r'\b(\d+)\b', lambda m: NUM.get(m.group(1), m.group(1)), s)
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def frasi(testo: str) -> list:
    if not testo:
        return []
    t = re.sub(r'\.\.\.+|…', '.', testo)
    t = re.sub(r'^\s*\d+\.\s+', '', t, flags=re.M)        # "1. Siediti" -> "Siediti"
    parti = re.split(r'(?<=[.!?:»])\s+|\n+', t)
    out = []
    for p in parti:
        n = norm(p)
        if len(n.split()) >= 3:
            out.append((p.strip(), n))
    return out


def righe_copione(nome: str) -> list:
    files = [f'{OUT}/{nome}-apertura.txt', f'{OUT}/{nome}-pratica.txt']
    if not all(os.path.exists(f) for f in files):
        files = [f'{OUT}/{nome}.txt']
    righe = []
    for f in files:
        if not os.path.exists(f):
            continue
        for l in open(f, encoding='utf-8').read().split('\n'):
            if not l or re.match(r'^\[(SILENZIO [\d.]+|sincere|relaxed|meditative)\]$', l):
                continue
            righe.append(l)
    return righe


def migliore(n: str, pezzi: list) -> tuple:
    best, chi = 0.0, ''
    for orig, pn in pezzi:
        if n in pn:
            return 1.0, orig
        r = SequenceMatcher(None, n, pn).ratio()
        if r > best:
            best, chi = r, orig
    return best, chi


def controlla(nome: str, snap: dict, aggiunte: bool) -> int:
    r = snap[nome]
    righe = righe_copione(nome)
    if not righe:
        print(f'{nome}: nessun copione')
        return 0
    # i pezzi del copione: frasi + righe intere (le frasi di Notion possono stare dentro una riga)
    pezzi = [(l, norm(l)) for l in righe] + [x for l in righe for x in frasi(l)]
    campi = [('Apertura', r.get('Apertura')), ('Pratica', r.get('Pratica')), ('Domanda', r.get('Domanda'))]
    # La nota campo resta scritta nell'app; in voce solo dove la pratica la richiama: si controlla con --nota
    if NOTA and (r.get('Ha Nota Campo') == '__YES__' or r.get('Nota Campo')):
        campi.append(('Nota Campo', r.get('Nota Campo')))
    problemi = 0
    for campo, testo in campi:
        for orig, n in frasi(testo or ''):
            if any(re.search(p, n) for p in IGNORA):
                continue
            score, chi = migliore(n, pezzi)
            if score < SOGLIA:
                problemi += 1
                print(f'  {nome} [{campo}] {score:.2f}\n     NOTION : {orig}\n     COPIONE: {chi[:200]}')
    if aggiunte:
        notion = [x for _, t in campi for x in frasi(t or '')]
        for l in righe:
            for orig, n in frasi(l):
                if migliore(n, notion)[0] < SOGLIA:
                    print(f'  {nome} + {orig}')
    print(f'{nome}: {"ok" if not problemi else str(problemi) + " frasi di Notion non trovate"}')
    return problemi


def controlla_taglio(nome: str, snap: dict) -> int:
    """Il file -apertura deve contenere solo l'Apertura di Notion, il file -pratica nessuna sua frase."""
    ap = frasi(snap[nome].get('Apertura') or '')
    tutta = norm(snap[nome].get('Apertura') or '')
    errori = 0
    for parte, deve in (('apertura', True), ('pratica', False)):
        f = f'{OUT}/{nome}-{parte}.txt'
        if not os.path.exists(f):
            return 0
        for l in open(f, encoding='utf-8').read().split('\n'):
            if not l or l.startswith('['):
                continue
            if len(norm(l).split()) < 3:
                continue
            fr = frasi(l) or [(l, norm(l))]
            score = 1.0 if norm(l) in tutta else sum(migliore(x, ap)[0] for _, x in fr) / len(fr)
            if (score >= 0.8) != deve:
                errori += 1
                print(f'  {nome} TAGLIO: nel file {parte} {"non è apertura" if deve else "sembra apertura"}: {l[:90]}')
    return errori


if __name__ == '__main__':
    snap = json.load(open(f'{HERE}/notion_snapshot.json', encoding='utf-8'))
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    aggiunte = '--aggiunte' in sys.argv
    NOTA = '--nota' in sys.argv
    nomi = args or sorted(
        [k for k, v in snap.items() if v.get('Audio Pratica')],
        key=lambda k: (int(k[1:k.index('-')]), int(k.split('G')[1])))
    tot = sum(controlla(n, snap, aggiunte) for n in nomi)
    tagli = sum(controlla_taglio(n, snap) for n in nomi)
    print(f'Righe fuori posto rispetto al taglio: {tagli}')
    print(f'\nTotale frasi di Notion non trovate nei copioni: {tot}')
