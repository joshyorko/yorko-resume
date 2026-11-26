"""Rasterize the candidate PDFs and compare A, C and the hybrid for visual review."""
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw

directory = Path(sys.argv[1])
for label in "ABCHRS":
    source = directory / f"{label}.pdf"
    for suffix, options in (("", []), ("-gray", ["-gray"])):
        if label == "S":
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
for index, label in enumerate(("R", "S-1", "S-2")):
    x = gutter + index * (width + gutter)
    for row, suffix in enumerate(("", "-gray")):
        y = gutter + row * (height + 40)
        heading = {"R": "Previous R", "S-1": "Experience", "S-2": "Open-source engineering"}[label]
        draw.text((x, y), f"{heading}  {'Color' if row == 0 else 'Grayscale'}", fill="#202020", font_size=18)
        filename = label + suffix if label == "R" else "S" + suffix + label[1:]
        with Image.open(directory / (filename + ".png")) as page:
            sheet.paste(page.resize((width, height), Image.Resampling.LANCZOS).convert("RGB"), (x, y + 26))
sheet.save(directory / "contact-sheet.png")
