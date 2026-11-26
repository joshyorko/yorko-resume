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
from pdfminer.layout import LAParams
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
review = json.loads(Path(__file__).with_name("review-content.json").read_text())
header = [content["name"], content["title"], content["contactText"],
          *(label for label, _ in content["contactLinks"]), content["summary"]]
projects = []
links = list(content["contactLinks"])
for project in content["projects"]:
    projects.append([project["name"], project["description"],
                     *(label for label, _ in project["links"])])
    links.extend(project["links"])
skills = ["TECHNICAL SKILLS", *(group for line in content["skills"] for group in line.split(" · "))]
assert len(links) == len({url for _, url in links}) == 24


def experience(design):
    result = ["EXPERIENCE"]
    for index, job in enumerate(content["jobs"]):
        if index == 0:
            result.append(job["heading"])
            result.extend([job["dates"], job["role"]] if design == "B" else [job["role"], job["dates"]])
        else:
            result.extend([*job["heading"].split(" | "), job["dates"]])
        bullets = job["bullets"]
        if index == 0 and design in ("A", "H", "R"):
            bullets = [bullets[i] for i in (4, 1, 5, 6, 0, 2, 3)]
        if index == 0 and design == "C":
            bullets = [bullets[4], *bullets[:4], *bullets[5:]]
        result.extend(bullets)
    return result


for name in ("A", "B", "C", "H", "R"):
    work = experience(name)
    featured = ["OPEN-SOURCE ENGINEERING", *sum(projects[:2], [])]
    more = sum(projects[2:], [])
    expected_links = links
    if name == "R":
        originals = [value for project in review["originalProjects"] for value in (project["name"], project["description"])]
        expected_links = links + [(project["name"], project["url"]) for project in review["originalProjects"]]
        assert len({url for _, url in expected_links}) == len(expected_links) == 26
        expected = header[:-1] + [review["summary"], featured[0], *originals, *projects[2],
                                  *featured[1:], *sum(projects[3:], [])] + work + skills
    elif name == "C":
        expected = header + featured + work + ["MORE OPEN-SOURCE ENGINEERING"] + more + skills
    elif name == "H":
        expected = header + featured + more + work + skills
    else:
        expected = header + work + featured + more + skills
    pdf = Path(sys.argv[1]) / f"{name}.pdf"
    reader = PdfReader(pdf)
    assert len(reader.pages) == 1, f"{name}: expected one page"
    page = reader.pages[0]
    assert (float(page.mediabox.width), float(page.mediabox.height)) == (612, 792)
    assert reader.metadata.author == content["name"]
    assert reader.metadata.title == f"{content['name']} — Résumé"

    poppler = ("-raw",) if name in ("H", "R") else ()
    require_ordered(run("pdftotext", *poppler, str(pdf), "-"), expected, f"{name}/Poppler")
    if name in ("H", "R"):
        require_ordered(page.extract_text(extraction_mode="layout"), expected, f"{name}/pypdf")
    layout = LAParams(boxes_flow=None, char_margin=55) if name in ("H", "R") else None
    require_ordered(extract_text(pdf, laparams=layout), expected, f"{name}/pdfminer")

    annotations = [ref.get_object() for ref in page["/Annots"]]
    assert all(a["/Subtype"] == "/Link" and a["/A"]["/S"] == "/URI" for a in annotations)
    assert sorted(a["/A"]["/URI"] for a in annotations) == sorted(url for _, url in expected_links), name
    for annotation in annotations:
        x1, y1, x2, y2 = annotation["/Rect"]
        assert 0 < x1 < x2 < 612 and 0 < y1 < y2 < 792

    fonts = run("pdffonts", str(pdf)).splitlines()[2:]
    assert fonts and all(re.search(r" yes\s+yes\s+yes\s+\d+\s+\d+\s*$", line) for line in fonts)
    boxes = ET.fromstring(run("pdftotext", "-bbox", str(pdf), "-"))
    words = boxes.findall(".//{*}word")
    assert words
    bottom = max(float(word.attrib["yMax"]) for word in words)
    for word in words:
        x1, y1, x2, y2 = (float(word.attrib[k]) for k in ("xMin", "yMin", "xMax", "yMax"))
        assert 20 < x1 < x2 < 592 and 20 < y1 < y2 < 772
    if name in ("H", "R"):
        # Each date is on its own employer row, aligned to the same right edge.
        date_edges = []
        for job in content["jobs"]:
            parts = job["dates"].split()
            for index in range(len(words) - len(parts) + 1):
                span = words[index:index + len(parts)]
                if [word.text for word in span] == parts:
                    date_edges.append(float(span[-1].attrib["xMax"]))
                    break
        assert len(date_edges) == 4 and max(date_edges) - min(date_edges) < 1, name
    tagged = bool(reader.trailer["/Root"].get("/StructTreeRoot"))
    checksum = hashlib.sha256(pdf.read_bytes()).hexdigest()
    print(f"{name}: Letter, one page; {len(expected_links)} exact URI annotations; both text parsers passed; "
          f"embedded Unicode fonts; bottom text margin {(792-bottom)/72:.2f} in; "
          f"no text or link bounds violations; tagged={tagged}; SHA-256 {checksum}")
