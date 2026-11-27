"""Restore word spacing in the confirmed red review PDF without moving its glyphs."""
import argparse
from hashlib import sha256
from pathlib import Path
import subprocess
import unicodedata
import xml.etree.ElementTree as ET

from pypdf import PdfReader, PdfWriter
from pypdf.generic import ContentStream, DictionaryObject, NameObject, TextStringObject


CONFIRMED_SHA256 = "1ce2d3cf16cb2e5e53268a91c6660b9ebadcf7fb0c4a6e335cdef492c4513735"


def poppler(path, mode):
    return subprocess.check_output(["pdftotext", mode, path, "-"], encoding="utf-8")


def page_words(text):
    return [page.split() for page in text.rstrip("\f").split("\f")]


def typography(word):
    return unicodedata.normalize("NFKC", word).replace("‐", "-")


def text_rows(page, operations):
    rows = []
    for index, (args, operator) in enumerate(operations):
        # This pinned XeTeX PDF translates each page once and uses Td/TJ for its text.
        if operator == b"cm":
            x_offset, y_offset = map(float, args[4:])
        elif operator == b"BT":
            x = y = 0
        elif operator == b"Td":
            x += float(args[0])
            y += float(args[1])
        elif operator == b"TJ":
            baseline = float(page.mediabox.height) - y - y_offset
            # The raised bullet shares the row with its following text.
            if not rows or abs(rows[-1][0] - baseline) > 2:
                rows.append([baseline, x + x_offset, index, index])
            else:
                rows[-1][3] = index
    return rows


def restore_page(pdf, page, xml, approved_words, page_number):
    stream = ContentStream(page.get_contents(), pdf)
    ops = stream.operations
    rows = text_rows(page, ops)
    # Poppler may group the final line of the centered summary after the heading.
    lines = sorted(xml.findall(".//{*}line"), key=lambda line: float(line.attrib["yMin"]))
    offset = 0
    replacements = []
    for line_number, ((baseline, x, start, end), line) in enumerate(zip(rows, lines, strict=True)):
        bounds = {key: float(line.attrib[key]) for key in ("yMin", "yMax", "xMin")}
        if not (bounds["yMin"] < baseline < bounds["yMax"] and abs(x - bounds["xMin"]) < 3):
            raise ValueError(f"Page {page_number + 1}, line {line_number + 1} has unexpected bounds")
        words = [typography(word.text) for word in line.findall("{*}word")]
        approved = approved_words[offset:offset + len(words)]
        offset += len(words)
        expected = list(map(typography, approved))
        if (page_number, line_number) == (0, 1):
            # The historical headline uses small caps. Keep approved case in the text layer.
            words = [word.casefold() for word in words]
            expected = [word.casefold() for word in expected]
        if words != expected:
            raise ValueError(f"Page {page_number + 1}, line {line_number + 1} differs from the approved copy")
        replacements.append((start, end, " ".join(approved)))
    if offset != len(approved_words):
        raise ValueError(f"Page {page_number + 1} is missing approved text")

    for start, end, text in reversed(replacements):
        actual = DictionaryObject({NameObject("/ActualText"): TextStringObject(text)})
        ops.insert(end + 1, ([], b"EMC"))
        ops.insert(start, ([NameObject("/Span"), actual], b"BDC"))
    stream.operations = ops
    page.replace_contents(stream)


def uris(pdf):
    return [[annotation.get_object()["/A"]["/URI"] for annotation in page["/Annots"]]
            for page in pdf.pages]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("confirmed", type=Path, help="Owner-confirmed red-review.pdf from the design review")
    parser.add_argument("output", type=Path, help="Path for the repaired PDF")
    parser.add_argument("--approved", required=True, type=Path, help="Approved T PDF to check the wording and links")
    args = parser.parse_args()
    if sha256(args.confirmed.read_bytes()).hexdigest() != CONFIRMED_SHA256:
        raise ValueError("Expected the owner-confirmed red review PDF")

    approved = PdfReader(args.approved)
    pdf = PdfWriter(clone_from=args.confirmed)
    if uris(pdf) != uris(approved):
        raise ValueError("Red and approved PDFs have different link destinations")
    if (pdf.metadata.title, pdf.metadata.author) != (approved.metadata.title, approved.metadata.author):
        raise ValueError("Red and approved PDFs have different title or author metadata")

    approved_pages = page_words(poppler(args.approved, "-raw"))
    xml = ET.fromstring(poppler(args.confirmed, "-bbox-layout"))
    for number, (page, bounds, words) in enumerate(zip(pdf.pages, xml.findall(".//{*}page"), approved_pages, strict=True)):
        restore_page(pdf, page, bounds, words, number)
    pdf.write(args.output)
    for mode in ("-raw", "-layout"):
        if page_words(poppler(args.output, mode)) != approved_pages:
            raise ValueError(f"{mode} extraction of repaired PDF differs from the approved copy")


if __name__ == "__main__":
    main()
