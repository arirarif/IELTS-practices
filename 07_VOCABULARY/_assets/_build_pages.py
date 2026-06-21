# -*- coding: utf-8 -*-
"""Regenerate Cam-NN-Vocabulary.html for all books from the MD source of truth.
One unified rich template -> consistent, offline, searchable study pages."""
import os, re, json, glob

BASE = os.path.dirname(os.path.abspath(__file__))

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def parse_words(md):
    tag = ""
    out = []
    cur = None
    def flush():
        if cur and cur.get("w"):
            out.append([cur.get("w",""),cur.get("ipa",""),cur.get("bn",""),cur.get("pr",""),tag,
                        cur.get("en",""),cur.get("syn",""),cur.get("ant",""),cur.get("exen",""),
                        cur.get("exbn",""),cur.get("note","")])
    for line in md.splitlines():
        m = re.match(r'^##\s+Test\s+(\d+)\s*[·.]?\s*Passage\s+(\d+)', line)
        if m:
            tag = "T%s·P%s" % (m.group(1), m.group(2)); continue
        m = re.match(r'^###\s+(.+?)\s+·\s+(.+?)\s*$', line)
        if m:
            flush(); cur = {"w": m.group(1).strip(), "ipa": m.group(2).strip()}; continue
        if cur is None: continue
        m = re.match(r'^\*\*বাংলা অর্থ.*?:\*\*\s*(.+)', line)
        if m:
            rest = m.group(1)
            parts = re.split(r'\s*·\s*\*\*বাংলা.*?উচ্চারণ:\*\*\s*', rest)
            cur["bn"] = parts[0].strip()
            if len(parts) > 1: cur["pr"] = parts[1].strip()
            continue
        m = re.match(r'^-\s+\*\*Meaning \(EN\):\*\*\s*(.+)', line)
        if m: cur["en"] = m.group(1).strip(); continue
        m = re.match(r'^-\s+\*\*Synonyms:\*\*\s*(.+)', line)
        if m: cur["syn"] = m.group(1).strip(); continue
        m = re.match(r'^-\s+\*\*Antonyms:\*\*\s*(.+)', line)
        if m: cur["ant"] = m.group(1).strip(); continue
        m = re.match(r'^-\s+\*\*Example.*?:\*\*\s*(.+)', line)
        if m:
            ex = m.group(1).strip()
            mm = re.match(r'\*(.+?)\*\s*[—\-]+\s*(.+)', ex)
            if mm: cur["exen"] = mm.group(1).strip(); cur["exbn"] = mm.group(2).strip()
            else: cur["exen"] = ex.strip('*').strip()
            continue
        m = re.match(r'^-\s+\*\*\U0001f9e0\s*Note.*?:\*\*\s*(.+)', line)
        if m: cur["note"] = m.group(1).strip(); continue
    flush()
    return out

def parse_phrase(md):
    out = []; cur = None
    def flush():
        if cur and cur.get("w"):
            out.append([cur.get("w",""),cur.get("bn",""),cur.get("en",""),cur.get("exen",""),cur.get("exbn",""),cur.get("note","")])
    for line in md.splitlines():
        m = re.match(r'^###\s+(.+?)\s*$', line)
        if m:
            flush(); cur = {"w": m.group(1).strip()}; continue
        if cur is None: continue
        m = re.match(r'^\*\*অর্থ.*?:\*\*\s*(.+)', line)
        if m:
            rest = m.group(1)
            parts = re.split(r'\s*·\s*\*\*EN:\*\*\s*', rest)
            cur["bn"] = parts[0].strip()
            if len(parts) > 1: cur["en"] = parts[1].strip()
            continue
        m = re.match(r'^-\s+\*\*Example.*?:\*\*\s*(.+)', line)
        if m:
            ex = m.group(1).strip()
            mm = re.match(r'\*(.+?)\*\s*[—\-]+\s*(.+)', ex)
            if mm: cur["exen"] = mm.group(1).strip(); cur["exbn"] = mm.group(2).strip()
            else: cur["exen"] = ex.strip('*').strip()
            continue
        m = re.match(r'^-\s+\*\*\U0001f9e0\s*Note.*?:\*\*\s*(.+)', line)
        if m: cur["note"] = m.group(1).strip(); continue
    flush()
    return out

def parse_colloc(md):
    out = []; theme = None; items = []
    for line in md.splitlines():
        m = re.match(r'^##+\s+(.+?)\s*$', line)
        if m and not line.startswith('# '):
            if theme and items: out.append([theme, items])
            theme = m.group(1).strip(); items = []; continue
        m = re.match(r'^-\s+\*\*(.+?)\*\*\s*[—\-]+\s*(.+)', line)
        if m and theme:
            rest = m.group(2)
            parts = re.split(r'\s*·\s*', rest, 1)
            bn = parts[0].strip()
            eg = ""
            if len(parts) > 1:
                eg = re.sub(r'^\*?e\.g\.?\s*', '', parts[1].strip().strip('*')).strip().strip('*')
            items.append([m.group(1).strip(), bn, eg])
    if theme and items: out.append([theme, items])
    return out

def parse_sent(md):
    out = []; cur = None
    def flush():
        if cur and cur.get("en"): out.append([cur.get("en",""),cur.get("bn",""),cur.get("note","")])
    for line in md.splitlines():
        m = re.match(r'^-\s+\*\*EN:\*\*\s*\*?(.+?)\*?\s*$', line)
        if m:
            flush(); cur = {"en": m.group(1).strip().strip('*')}; continue
        if cur is None: continue
        m = re.match(r'^\s*\*\*BN:\*\*\s*(.+)', line)
        if m: cur["bn"] = m.group(1).strip(); continue
        m = re.match(r'^\s*\*\*\U0001f9e0:?\*\*\s*(.+)', line) or re.match(r'^\s*\*\*\U0001f9e0\s*:\*\*\s*(.+)', line)
        if m: cur["note"] = m.group(1).strip(); continue
    flush()
    return out

TEMPLATE = read(os.path.join(BASE, "_template.html"))

books = sorted(int(re.search(r'Cam-(\d+)', d).group(1))
               for d in glob.glob(os.path.join(BASE, "Cam-*")) if os.path.isdir(d))
summary = []
for n in books:
    d = os.path.join(BASE, "Cam-%d" % n)
    W  = parse_words(read(os.path.join(d, "01_WORDS.md")))
    ID = parse_phrase(read(os.path.join(d, "02_IDIOMS-PHRASES.md")))
    PH = parse_phrase(read(os.path.join(d, "03_PHRASAL-VERBS.md")))
    CO = parse_colloc(read(os.path.join(d, "04_COLLOCATIONS-GROUP-WORDS.md")))
    SE = parse_sent(read(os.path.join(d, "05_HIGH-FREQUENCY-SENTENCES.md")))
    js = ("const W=%s;\nconst IDIOMS=%s;\nconst PHRASAL=%s;\nconst COLLOC=%s;\nconst SENT=%s;\n" % (
        json.dumps(W, ensure_ascii=False), json.dumps(ID, ensure_ascii=False),
        json.dumps(PH, ensure_ascii=False), json.dumps(CO, ensure_ascii=False),
        json.dumps(SE, ensure_ascii=False)))
    html = TEMPLATE.replace("__NN__", str(n)).replace("/*__DATA__*/", js)
    with open(os.path.join(d, "Cam-%d-Vocabulary.html" % n), "w", encoding="utf-8") as f:
        f.write(html)
    summary.append("Cam-%-2d  words=%-3d idioms=%-2d phrasal=%-2d colloc_groups=%-2d sentences=%-2d" % (
        n, len(W), len(ID), len(PH), len(CO), len(SE)))

print("\n".join(summary))
