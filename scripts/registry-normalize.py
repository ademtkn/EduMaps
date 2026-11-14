"""Convert the owner's institution spreadsheet into a reviewed import manifest.

Usage: python registry-normalize.py data/registry/2026-11-sheet
Needs openpyxl. Reads source.xlsx and existing-before.json from that folder, writes manifest.json.
Nothing here touches the database.
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import openpyxl

folder = Path(sys.argv[1])
wb = openpyxl.load_workbook(folder / "source.xlsx", read_only=True, data_only=True)


def sheet_rows(name):
    rows = [r for r in wb[name].iter_rows(values_only=True) if any(c not in (None, "") for c in r)]
    header = rows[0]
    return [dict(zip(header, r)) for r in rows[1:]]


def clean(v):
    if v is None:
        return None
    v = str(v).strip()
    return None if v in ("", "Bilinmiyor", "-", "—") else v


def norm(s):
    s = unicodedata.normalize("NFKC", (s or "").lower()).replace("ё", "е")
    s = re.sub(r"\(.*?\)", " ", s)
    return re.sub(r"[^0-9a-zа-яөүң]+", " ", s).strip()


def gis_id(url):
    m = re.search(r"/firm/(\d+)", url or "")
    return m.group(1) if m else None


TRANSLIT = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюяөүң",
                    ["a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "kh", "ts", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya", "o", "u", "ng"]))


def slugify(s):
    s = "".join(TRANSLIT.get(ch, ch) for ch in (s or "").lower())
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


CITY = {
    "Bishkek": "bishkek", "Osh": "osh", "Jalal-Abad": "jalal-abad", "Tokmok": "tokmok", "Karakol": "karakol",
    "Kant": "kant", "Talas": "talas", "Balykchy": "balykchy", "Cholpon-Ata": "cholpon-ata", "Kara-Suu": "kara-suu",
    "Uzgen": "uzgen", "Amanbaevo": "amanbaevo", "Chok-Tal": "chok-tal", "Chui (village)": "chui",
    "Ivanovka": "ivanovka", "Kerben": "kerben", "Kyzyl-Suu": "kyzyl-suu", "Kyzyl-Zhyldyz": "kyzyl-zhyldyz",
    "Shabdan (Kemin district)": "shabdan", "Aravan": "aravan", "Kochkor-Ata": "kochkor-ata", "Mailuu-Suu": "mailuu-suu",
    "Tash-Kumyr": "tash-kumyr", "Bakai-Ata": "bakai-ata", "Bazar-Korgon": "bazar-korgon", "Jaylygan": "jaylygan",
    "Kara-Kul": "kara-kul",
}
LANG = {"ru": "ru", "en": "en", "ky": "kg", "tr": "tr", "de": "de", "zh": "zh", "fr": "fr", "ar": "ar"}
SYSTEMS = [("ib", r"\bIB\b|baccalaureate"), ("cambridge", r"cambridge|igcse"), ("american", r"american|\bAP\b|\bSAT\b|middle states"),
           ("montessori", r"montessori"), ("waldorf", r"waldorf"), ("stem", r"\bSTEA?M\b"), ("turkish", r"turkish"),
           ("national", r"national (curriculum|programme|program|standard)|state (curriculum|programme|standard)")]
FACILITIES = [("library", r"librar"), ("science_lab", r"science lab|laborator"), ("computer_lab", r"computer (lab|class)"),
              ("robotics_lab", r"robotics (lab|room)"), ("gym", r"sports hall|\bgym\b"), ("swimming_pool", r"swimming pool|\bpool\b"),
              ("stadium", r"stadium|football pitch|sports ground"), ("canteen", r"canteen|cafeteria|dining"),
              ("medical_room", r"medical (room|office)|nurse"), ("playground", r"playground"), ("art_studio", r"art (studio|room)"),
              ("music_room", r"music room"), ("psychologist", r"psycholog"), ("speech_therapist", r"speech therap"),
              ("dormitory", r"dormitor"), ("security", r"guard|security"), ("cctv", r"cctv|video surveillance")]


def grades(kind, text):
    if kind == "Anaokulu":
        return 0, 0
    if kind != "Özel okul" or not text:
        return None, None
    t = text.lower().replace("preschool group", "0").replace("—", "–").replace("-", "–")
    m = re.match(r"\s*(\d{1,2})\s*–\s*(\d{1,2})\s*grade", t)
    if not m:
        return None, None
    a, b = int(m.group(1)), int(m.group(2))
    return (a, b) if 0 <= a <= 11 and 1 <= b <= 12 and a <= b else (None, None)


def coords(notes):
    # Only coordinates read from the 2GIS card itself; "geocode ~" side-of-town estimates are ignored.
    found = re.findall(r"2GIS (?:card )?coordinates?\s*(\d{2}\.\d{3,})\s*E,\s*(\d{2}\.\d{3,})\s*N", notes or "")
    if not found:
        return None, None
    lng, lat = map(float, found[-1])
    return (lat, lng) if 39 <= lat <= 44 and 69 <= lng <= 81 else (None, None)


def phone(text):
    if not text:
        return None
    parts = [p.strip() for p in re.split(r"\s*/\s*|;|,", text) if p.strip()]
    out = ""
    for p in parts:
        nxt = f"{out} / {p}" if out else p
        if len(nxt) > 40:
            break
        out = nxt
    return out or None


def url(v):
    v = clean(v)
    if not v:
        return None
    v = v.split()[0]
    if not v.startswith("http"):
        v = "https://" + v
    return v if re.match(r"^https?://[^\s/]+\.[^\s]+", v) else None


to_check = {(r["Adı (RU)"], r["Şehir"], r["Adres"]) for r in sheet_rows("Kontrol edilecekler")}
all_rows = sheet_rows("Tüm kurumlar")

records, by_gis = [], {}
for r in all_rows:
    kind = r["Tür"]
    notes = clean(r["Notlar"]) or ""
    lat, lng = coords(notes)
    gf, gt = grades(kind, clean(r["Sınıf / yaş"]))
    langs = []
    for code in (clean(r["Eğitim dili"]) or "").split(";"):
        if LANG.get(code.strip()) and LANG[code.strip()] not in langs:
            langs.append(LANG[code.strip()])
    systems_text = " ".join(filter(None, [clean(r["Sistem / müfredat"]), clean(r["Lisans / akreditasyon"])]))
    extra_text = " ".join(filter(None, [clean(r["Olanaklar / kulüpler"]), clean(r["Farklılıkları"])]))
    level = clean(r["Okul seviyesi"])
    founded = re.search(r"\b(18|19|20)\d{2}\b", clean(r["Kuruluş yılı"]) or "")
    email = clean(r["E-posta"])
    rec = {
        "key": None,
        "toCheck": (r["Adı (RU)"], r["Şehir"], r["Adres"]) in to_check,
        "confidence": r["Güven"], "completeness": r["Doluluk"], "kind": kind, "level": level,
        "name": {"kg": clean(r["Adı (KG)"]), "ru": clean(r["Adı (RU)"]), "en": clean(r["Adı (EN)"])},
        "about": {k: clean(r[f"Hakkında ({k.upper() if k != 'kg' else 'KG'})"]) for k in ("kg", "ru", "en")},
        "citySheet": r["Şehir"], "city": CITY[r["Şehir"]], "area": r["Araştırma alanı"],
        "district": clean(r["Semt / bölge"]), "address": clean(r["Adres"]),
        "twoGisUrl": url(r["2GIS"]) if gis_id(r["2GIS"]) or "2gis" in (r["2GIS"] or "") else None,
        "lat": lat, "lng": lng,
        "phone": phone(clean(r["Telefon"])), "phoneFull": clean(r["Telefon"]),
        "email": email if email and re.match(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", email, re.I) else None,
        "website": url(r["Web sitesi"]), "instagram": url(r["Instagram"]), "facebook": url(r["Facebook"]),
        "schoolType": "international" if kind == "Özel okul" and level == "Uluslararası" else "private",
        "institutionKind": {"Özel okul": "school", "Anaokulu": "kindergarten", "Kolej": "college", "Medrese": "madrasa"}[kind],
        "gradeFrom": gf, "gradeTo": gt, "gradesText": clean(r["Sınıf / yaş"]),
        "languages": langs,
        "educationSystems": [k for k, p in SYSTEMS if re.search(p, systems_text, re.I)],
        "facilities": [k for k, p in FACILITIES if re.search(p, extra_text, re.I)],
        "boarding": clean(r["Yatılı"]) == "Var",
        "foundedYear": int(founded.group(0)) if founded else None,
        "gender": {"Kız": "girls", "Erkek": "boys", "Karma": "mixed"}.get(clean(r["Cinsiyet"])),
        "foreignTeachers": clean(r["Yabancı öğretmen"]) == "Var",
        "curriculum": clean(r["Sistem / müfredat"]), "highlights": clean(r["Farklılıkları"]),
        "achievements": clean(r["Başarılar"]), "licence": clean(r["Lisans / akreditasyon"]),
        "clubs": clean(r["Olanaklar / kulüpler"]), "fees": clean(r["Ücret bilgisi"]),
        "notes": notes or None, "sources": [s.strip() for s in (clean(r["Kaynaklar"]) or "").split(" | ") if s.strip()],
        "nameNote": clean(r["İsim notu"]), "checkedAt": str(r["Kontrol tarihi"])[:10],
    }
    if not rec["name"]["en"]:
        rec["name"]["en"] = rec["name"]["ru"] or rec["name"]["kg"]
    g = gis_id(r["2GIS"])
    rec["key"] = f"2gis:{g}" if g else "row:" + "|".join([rec["city"], norm(rec["name"]["ru"]), norm(rec["address"])])
    if rec["key"] in by_gis:
        # Same 2GIS card listed twice in the sheet: keep the fuller row, remember the other as a duplicate.
        prev = by_gis[rec["key"]]
        score = lambda x: sum(1 for v in x.values() if v not in (None, "", [], False))
        if score(rec) > score(prev):
            rec["duplicates"] = prev.get("duplicates", []) + [prev["name"]["ru"]]
            records[records.index(prev)] = rec
            by_gis[rec["key"]] = rec
        else:
            prev.setdefault("duplicates", []).append(rec["name"]["ru"])
        continue
    by_gis[rec["key"]] = rec
    records.append(rec)

# Match to schools already on the site (2GIS card first, then name within the same city).
existing = json.loads((folder / "existing-before.json").read_text())
manual = json.loads((folder / "matches.json").read_text()) if (folder / "matches.json").exists() else {}
for rec in records:
    rec["existingSlug"] = None
for e in existing:
    if e["data_status"] == "demo":
        continue
    hit = manual.get(e["slug"])
    cands = []
    if hit is None:
        eg = gis_id(e.get("twogis"))
        names = {norm(v) for v in (e["name"] or {}).values() if v}
        for rec in records:
            if eg and rec["key"] == f"2gis:{eg}":
                cands = [rec]
                break
            if rec["city"] == e["city"] and ({norm(v) for v in rec["name"].values() if v} & names):
                cands.append(rec)
    else:
        cands = [rec for rec in records if rec["key"] == hit] if hit else []
    if len(cands) == 1:
        cands[0]["existingSlug"] = e["slug"]
    e["_candidates"] = [c["key"] for c in cands]

used = {e["slug"] for e in existing}
for rec in sorted(records, key=lambda x: (x["city"], x["key"])):
    if rec["existingSlug"]:
        rec["slug"] = rec["existingSlug"]
        continue
    base = slugify(re.sub(r"\(.*?\)", "", rec["name"]["en"])) or slugify(rec["name"]["ru"]) or "institution"
    base = base[:60].strip("-")
    if rec["city"] not in base:
        base = f"{base}-{rec['city']}"
    slug, n = base, 2
    while slug in used:
        slug, n = f"{base}-{n}", n + 1
    used.add(slug)
    rec["slug"] = slug

(folder / "manifest.json").write_text(json.dumps(records, ensure_ascii=False, indent=1) + "\n")
report = {
    "sheetRows": len(all_rows), "records": len(records), "sheetDuplicatesMerged": len(all_rows) - len(records),
    "toCheckDraft": sum(r["toCheck"] for r in records), "withCoords": sum(r["lat"] is not None for r in records),
    "matchedExisting": sorted((r["existingSlug"], r["key"]) for r in records if r["existingSlug"]),
    "unmatchedExisting": [(e["slug"], e["_candidates"]) for e in existing if e["data_status"] != "demo" and len(e["_candidates"]) != 1],
}
print(json.dumps(report, ensure_ascii=False, indent=1))
