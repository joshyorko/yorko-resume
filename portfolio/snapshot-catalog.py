"""Extract reviewed public metadata from a local checkout of joshyorko/plugins."""
import json
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
revision = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
catalog = json.loads((root / "marketplaces/catalog.json").read_text())
plugins = []
for entry in catalog["plugins"]:
    name = entry["name"]
    path = root / "plugins" / name
    manifest = json.loads((path / "plugin.json").read_text())
    assert manifest["name"] == name and manifest["$schema"].endswith("/1.0.0/plugin.schema.json")
    active = json.loads((path / "skills.active.yml").read_text())["skills"] if name == "37signals" else None
    skills = []
    for skill in sorted((path / "skills").glob("*/SKILL.md")):
        frontmatter = skill.read_text().split("---", 2)[1]
        fields = dict(line.split(": ", 1) for line in frontmatter.splitlines() if ": " in line)
        if active is not None and fields["name"] not in active:
            continue
        skills.append({
            "name": fields["name"],
            "description": fields["description"].strip('"'),
            "source": skill.relative_to(root).as_posix(),
        })
    if active is not None:
        assert {skill["name"] for skill in skills} == set(active)
    plugins.append({"name": name, "version": manifest["version"], "skills": skills})
print(json.dumps({"revision": revision, "plugins": plugins}, indent=2))
