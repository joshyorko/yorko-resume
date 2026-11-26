#!/usr/bin/env bash
# Builds skills.html from the pinned catalog and renders every review capture with headless Chrome.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cat_json="${CATALOG_JSON:-$here/catalog.json}"
python3 - "$here" "$cat_json" <<'PY'
import json, sys
here, src = sys.argv[1], sys.argv[2]
c = json.load(open(src))
data = [{"plugin": p["name"], "version": p["version"],
         "skills": [[s["name"], s["description"], s["source"]] for s in p["skills"]]} for p in c["plugins"]]
t = open(f"{here}/skills.tmpl.html").read()
open(f"{here}/skills.html", "w").write(t.replace("__CATALOG__", json.dumps(data, ensure_ascii=False)))
PY
out="$here/../screens"; mkdir -p "$out"
shot() { # name url width height
  timeout 60 google-chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$(mktemp -d)" --window-size="$3,$4" --virtual-time-budget=3000 \
    --screenshot="$out/$1.png" "file://$here/$2" >/dev/null 2>&1
  echo "$out/$1.png"
}
shot home-390 index.html 390 844
shot home-360 index.html 360 800
shot home-1440 index.html 1440 900
shot skills-390 skills.html 390 844
shot skills-1440 skills.html 1440 900
shot skills-390-search "skills.html?q=review" 390 844
shot variant-shelf-390 "index.html?v=shelf" 390 844
shot variant-bricolage-390 "index.html?type=bricolage" 390 844
# Full-length mobile captures for scroll review
shot home-390-full index.html 390 3900
shot skills-390-full skills.html 390 4200
