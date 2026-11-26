"""Verify review PDFs against the canonical résumé without printing its contents."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
import xml.etree.ElementTree as ET

from pdfminer.high_level import extract_text
from pypdf import PdfReader


def normalize(text):
    text = " ".join(unicodedata.normalize("NFKC", text).split())
    return re.sub(r" +([,.;:])", r"\1", text)


def run(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.DEVNULL)


def require_ordered(text, expected, parser):
    remaining = normalize(text)
    for index, item in enumerate(expected, start=1):
        _, found, remaining = remaining.partition(normalize(item))
        assert found, f"{parser}: missing or reordered text block {index}"


content = json.loads(Path(__file__).with_name("content.json").read_text())
expected = [content["name"], content["title"], content["contactText"],
            *(label for label, _ in content["contactLinks"]), content["summary"],
            "EXPERIENCE"]
for job in content["jobs"]:
    expected.extend([job["heading"], job["dates"]])
    if job["role"]:
        expected.append(job["role"])
    expected.extend(job["bullets"])
expected.append("OPEN-SOURCE ENGINEERING")
links = list(content["contactLinks"])
for project in content["projects"]:
    expected.extend([project["name"], project["description"]])
    expected.extend(label for label, _ in project["links"])
    links.extend(project["links"])
expected.extend(["TECHNICAL SKILLS", *content["skills"]])
assert len(links) == len({url for _, url in links}) == 24

for name in ("editorial", "modern", "classic"):
    pdf = Path(sys.argv[1]) / f"{name}.pdf"
    reader = PdfReader(pdf)
    assert len(reader.pages) == 1, f"{name}: expected one page"
    page = reader.pages[0]
    assert (float(page.mediabox.width), float(page.mediabox.height)) == (612, 792)
    assert reader.metadata.author == content["name"]
    assert reader.metadata.title == f"{content['name']} — Résumé"

    require_ordered(run("pdftotext", str(pdf), "-"), expected, f"{name}/Poppler")
    require_ordered(extract_text(pdf), expected, f"{name}/pdfminer")

    annotations = [ref.get_object() for ref in page["/Annots"]]
    assert all(a["/Subtype"] == "/Link" and a["/A"]["/S"] == "/URI" for a in annotations)
    assert sorted(a["/A"]["/URI"] for a in annotations) == sorted(url for _, url in links), name
    for annotation in annotations:
        x1, y1, x2, y2 = annotation["/Rect"]
        assert 0 < x1 < x2 < 612 and 0 < y1 < y2 < 792

    fonts = run("pdffonts", str(pdf)).splitlines()[2:]
    assert fonts and all(re.search(r" yes\s+yes\s+yes\s+\d+\s+\d+\s*$", line) for line in fonts)
    boxes = ET.fromstring(run("pdftotext", "-bbox", str(pdf), "-"))
    words = boxes.findall(".//{*}word")
    assert words
    for word in words:
        x1, y1, x2, y2 = (float(word.attrib[k]) for k in ("xMin", "yMin", "xMax", "yMax"))
        assert 20 < x1 < x2 < 592 and 20 < y1 < y2 < 772
    tagged = bool(reader.trailer["/Root"].get("/StructTreeRoot"))
    checksum = hashlib.sha256(pdf.read_bytes()).hexdigest()
    print(f"{name}: Letter, one page; 24 exact URI annotations; both text parsers passed; "
          f"embedded Unicode fonts; no text or link bounds violations; tagged={tagged}; SHA-256 {checksum}")
