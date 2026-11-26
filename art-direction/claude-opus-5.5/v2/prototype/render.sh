#!/usr/bin/env bash
# Revision 2: builds skills.html from the pinned catalog and renders review captures into ../screens.
# Round-1 prototype and captures in ../../prototype and ../../screens are left untouched.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
python3 - "$here" "${CATALOG_JSON:-$here/catalog.json}" <<'PY'
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
  local prof; prof="$(mktemp -d)"
  timeout 60 google-chrome --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$prof" --window-size="$3,$4" --virtual-time-budget=3000 \
    --screenshot="$out/$1.png" "file://$here/$2" >/dev/null 2>&1 || true
  rm -rf "$prof"; echo "$out/$1.png"
}
shot home-390 index.html 390 844
shot home-360 index.html 360 800
shot home-1440 index.html 1440 900
shot notes-390 notes.html 390 844
shot notes-1440 notes.html 1440 900
shot notes-390-upstream "notes.html?k=upstream" 390 844
shot influences-390 influences.html 390 844
shot skills-390 skills.html 390 844
shot home-390-full index.html 390 3400
shot notes-390-full notes.html 390 3600
shot influences-390-full influences.html 390 2600
