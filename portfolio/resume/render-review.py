"""Rasterize the candidate PDFs and compare A, C and the hybrid for visual review."""
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

directory = Path(sys.argv[1])
for label in "ABCHRST":
    source = directory / f"{label}.pdf"
    for suffix, options in (("", []), ("-gray", ["-gray"])):
        if label in ("S", "T"):
            subprocess.run(
                ["pdftoppm", "-r", "150", "-png", *options,
                 str(source), str(directory / (label + suffix))],
                check=True,
            )
            continue
        subprocess.run(
            ["pdftoppm", "-singlefile", "-r", "150", "-png", *options,
             str(source), str(directory / (label + suffix))],
            check=True,
        )

width, height, gutter = 510, 660, 16
sheet = Image.new("RGB", (3 * width + 4 * gutter, 2 * (height + 40) + gutter), "#e7e7e7")
draw = ImageDraw.Draw(sheet)
for index, label in enumerate(("S-1", "T-1", "T-2")):
    x = gutter + index * (width + gutter)
    for row, suffix in enumerate(("", "-gray")):
        y = gutter + row * (height + 40)
        heading = {"S-1": "Previous experience", "T-1": "Platform résumé", "T-2": "Open-source engineering"}[label]
        draw.text((x, y), f"{heading}  {'Color' if row == 0 else 'Grayscale'}", fill="#202020", font_size=18)
        filename = label[0] + suffix + label[1:]
        with Image.open(directory / (filename + ".png")) as page:
            sheet.paste(page.resize((width, height), Image.Resampling.LANCZOS).convert("RGB"), (x, y + 26))
sheet.save(directory / "contact-sheet.png")
