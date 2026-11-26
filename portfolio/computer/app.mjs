// Computer: a portable workspace in a browser tab.
// Reads local files, digests them, loads CSV/JSON into SQLite (sql.js WebAssembly), reads SQLite files,
// runs SQL, and saves the whole session as one .sqlite file that restores here later. Nothing is uploaded.
import sample from './sample.mjs';

{
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const state = { SQL: null, db: null, files: [], selected: null, history: [], snaps: [], sample: false };
  const MAX_BYTES = 100 * 1024 * 1024;
  const FORMAT = "josh-computer-workspace/0";

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtBytes = (n) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`;
  const qi = (n) => `"${String(n).replace(/"/g, '""')}"`;
  const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
  async function sha256(bytes) {
    const h = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 3200);
  }
  function tableName(fileName) {
    let n = fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "data";
    if (/^\d/.test(n)) n = "t_" + n;
    const taken = new Set(listTables());
    let out = n, i = 2;
    while (taken.has(out)) out = `${n}_${i++}`;
    return out;
  }
  function listTables() {
    if (!state.db) return [];
    const r = state.db.exec("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_workspace%' ESCAPE '\\' ORDER BY name");
    return r.length ? r[0].values.map((v) => v[0]) : [];
  }
  function countRows(t) { return state.db.exec(`SELECT COUNT(*) FROM ${qi(t)}`)[0].values[0][0]; }
  function columns(t) { return state.db.exec(`PRAGMA table_info(${qi(t)})`)[0]?.values.map((v) => ({ name: v[1], type: v[2] || "ANY" })) || []; }

  // ---------- CSV ----------
  function parseCSV(text, delim) {
    const rows = []; let row = [], f = "", q = false, i = 0;
    if (text.charCodeAt(0) === 0xfeff) i = 1;
    for (; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = [];
      } else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function inferType(vals) {
    let int = true, real = true, any = false;
    for (const v of vals) {
      if (v === "" || v == null) continue; any = true;
      if (!/^-?\d+$/.test(v)) int = false;
      if (!/^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(v)) real = false;
      if (!int && !real) break;
    }
    return !any ? "TEXT" : int ? "INTEGER" : real ? "REAL" : "TEXT";
  }
  function loadRows(name, header, rows) {
    const used = new Set();
    const cols = header.map((h, i) => {
      let c = String(h ?? "").trim() || `col${i + 1}`, b = c, k = 2;
      while (used.has(c.toLowerCase())) c = `${b}_${k++}`;
      used.add(c.toLowerCase()); return c;
    });
    const types = cols.map((_, i) => inferType(rows.map((r) => r[i])));
    const db = state.db;
    db.run(`CREATE TABLE ${qi(name)} (${cols.map((c, i) => `${qi(c)} ${types[i]}`).join(", ")})`);
    const st = db.prepare(`INSERT INTO ${qi(name)} VALUES (${cols.map(() => "?").join(",")})`);
    db.run("BEGIN");
    for (const r of rows) {
      st.run(cols.map((_, i) => {
        const v = r[i]; if (v === undefined || v === "") return null;
        if (typeof v !== "string") return typeof v === "object" ? JSON.stringify(v) : v;
        return types[i] === "INTEGER" ? parseInt(v, 10) : types[i] === "REAL" ? parseFloat(v) : v;
      }));
    }
    db.run("COMMIT"); st.free();
    return { table: name, rows: rows.length, cols: cols.length };
  }

  // ---------- import ----------
  const isSQLite = (b) => b.length >= 16 && new TextDecoder().decode(b.subarray(0, 15)) === "SQLite format 3";

  async function addFile(name, bytes, opts = {}) {
    if (bytes.length > MAX_BYTES) throw new Error(`${fmtBytes(bytes.length)} is more than this tab will load (100 MB).`);
    const digest = await sha256(bytes);
    const ext = (name.match(/\.([^.]+)$/) || [, ""])[1].toLowerCase();
    const rec = { name, bytes: bytes.length, sha256: digest, added_at: now(), kind: "text", tables: [], content: bytes, sample: !!opts.sample, note: "" };

    if (isSQLite(bytes)) {
      if (await maybeRestore(name, bytes, digest)) return;
      rec.kind = "sqlite";
      const alias = "src_" + Math.random().toString(36).slice(2, 8);
      const path = `/${alias}.db`;
      state.SQL.FS.writeFile(path, bytes);
      try {
        state.db.run(`ATTACH DATABASE '${path}' AS ${alias}`);
        const src = state.db.exec(`SELECT name FROM ${alias}.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
        for (const [t] of src[0]?.values || []) {
          const dest = tableName(t);
          state.db.run(`CREATE TABLE ${qi(dest)} AS SELECT * FROM ${alias}.${qi(t)}`);
          rec.tables.push(dest);
        }
        rec.note = `${rec.tables.length} table${rec.tables.length === 1 ? "" : "s"} copied in`;
      } finally {
        try { state.db.run(`DETACH DATABASE ${alias}`); } catch {}
        try { state.SQL.FS.unlink(path); } catch {}
      }
    } else if (ext === "csv" || ext === "tsv") {
      rec.kind = ext;
      const text = new TextDecoder().decode(bytes);
      const rows = parseCSV(text, ext === "tsv" ? "\t" : (text.split("\n")[0].split(";").length > text.split("\n")[0].split(",").length ? ";" : ","));
      if (rows.length) {
        const r = loadRows(tableName(name), rows[0], rows.slice(1));
        rec.tables.push(r.table); rec.note = `${r.rows} rows × ${r.cols} columns`;
      }
    } else if (ext === "json") {
      rec.kind = "json";
      try {
        const data = JSON.parse(new TextDecoder().decode(bytes));
        const arr = Array.isArray(data) ? data : null;
        if (arr && arr.length && arr.every((o) => o && typeof o === "object" && !Array.isArray(o))) {
          const keys = [...new Set(arr.flatMap((o) => Object.keys(o)))];
          const r = loadRows(tableName(name), keys, arr.map((o) => keys.map((k) => o[k] == null ? "" : typeof o[k] === "object" ? JSON.stringify(o[k]) : String(o[k]))));
          rec.tables.push(r.table); rec.note = `${r.rows} objects → table`;
        } else rec.note = "JSON, not an array of objects — kept as a file";
      } catch (e) { rec.note = "Not valid JSON — kept as a file"; }
    } else {
      rec.note = "Kept as a file. Inspect only.";
    }
    state.files.push(rec);
    state.selected = rec;
  }

  function parseTables(value) {
    try { const list = JSON.parse(value || "[]"); return Array.isArray(list) ? list.map(String) : []; } catch { return []; }
  }
  async function maybeRestore(name, bytes, digest) {
    const probe = new state.SQL.Database(bytes);
    let meta = null;
    try {
      const m = probe.exec("SELECT key, value FROM _workspace_meta");
      if (m.length) meta = Object.fromEntries(m[0].values);
    } catch {}
    if (!meta || meta.format !== FORMAT) { probe.close(); return false; }
    state.db && state.db.close();
    state.db = probe;
    state.files = (probe.exec("SELECT name, kind, bytes, sha256, added_at, tables, note, sample, content FROM _workspace_files ORDER BY rowid")[0]?.values || [])
      .map(([n, kind, b, sha, at, tables, note, isSample, content]) => ({
        name: String(n), kind: String(kind), bytes: Number(b) || 0, sha256: String(sha), added_at: String(at),
        tables: parseTables(tables), note: String(note ?? ""), sample: !!isSample,
        content: content instanceof Uint8Array ? content : new Uint8Array(),
      }));
    state.history = (probe.exec("SELECT ran_at, sql, rows, ms FROM _workspace_queries ORDER BY rowid")[0]?.values || [])
      .map(([at, sql, rows, ms]) => ({ at, sql, rows, ms }));
    state.sample = meta.sample === "1";
    for (const t of ["_workspace_meta", "_workspace_files", "_workspace_queries"]) probe.run(`DROP TABLE IF EXISTS ${t}`);
    state.selected = state.files[0] || null;
    if (state.history.length) $("#sql").value = state.history[state.history.length - 1].sql;
    $("#result").innerHTML = `<p class="meta">Workspace restored. The editor holds the last query from that session; Run to see its result again.</p>`;
    toast(`Restored the workspace saved ${String(meta.saved_at).replace("T", " ").slice(0, 16)} UTC · ${state.files.length} files, ${state.history.length} queries`);
    state.restoredFrom = { name, digest, saved_at: meta.saved_at };
    return true;
  }

  async function importFiles(fileList) {
    if (!fileList.length) return;
    await ready;
    for (const f of fileList) {
      try { await addFile(f.name, new Uint8Array(await f.arrayBuffer())); }
      catch (e) { toast(`${f.name}: ${plain(e.message)}`); }
    }
    afterChange();
    const t = state.selected?.tables?.[0];
    if (t && !$("#sql").value.trim()) $("#sql").value = `SELECT * FROM ${qi(t)} LIMIT 100;`;
  }

  // ---------- sample (built from the same public facts as the site) ----------
  async function loadSample() {
    await ready;
    const enc = new TextEncoder();
    for (const [n, text] of Object.entries(sample)) await addFile(n, enc.encode(text), { sample: true });
    state.sample = true;
    state.selected = state.files.find((f) => f.name === "notes.csv");
    $("#sql").value = EX_SAMPLE[0].sql;
    afterChange();
  }
  const EX_SAMPLE = [
    { label: "What changed in November?", sql: "SELECT date, kind, title, ref\nFROM notes\nWHERE date >= '2026-11-01'\nORDER BY date DESC;" },
    { label: "Projects by relation", sql: "SELECT relation, COUNT(*) AS projects,\n       group_concat(name, ', ') AS names\nFROM projects\nGROUP BY relation\nORDER BY projects DESC;" },
    { label: "Skills per plugin", sql: "SELECT plugin, version, COUNT(*) AS skills\nFROM skills\nGROUP BY plugin\nORDER BY skills DESC;" },
    { label: "Activity by month", sql: "SELECT substr(date, 1, 7) AS month,\n       COUNT(*) AS entries,\n       SUM(kind = 'upstream') AS upstream\nFROM notes\nGROUP BY month\nORDER BY month DESC;" },
  ];

  // ---------- query ----------
  function plain(msg) {
    let m;
    if ((m = msg.match(/no such table: (\S+)/))) return `There's no table called ${m[1]}. Tables here: ${listTables().join(", ") || "none yet"}.`;
    if ((m = msg.match(/no such column: (\S+)/))) return `There's no column called ${m[1]} in the tables this query reads.`;
    if ((m = msg.match(/near "([^"]*)": syntax error/))) return `SQLite couldn't read the query near “${m[1]}”. Look for a missing comma, quote or keyword just before it.`;
    if (/incomplete input/.test(msg)) return "The query ends early — an unclosed bracket or quote, maybe.";
    if (/already exists/.test(msg)) return msg.replace(/^table /, "A table named ") + ".";
    return msg;
  }
  function run() {
    const sql = $("#sql").value.trim(); if (!sql || !state.db) return;
    const out = $("#result");
    const t0 = performance.now();
    try {
      const res = state.db.exec(sql);
      const ms = performance.now() - t0;
      const last = res[res.length - 1];
      const rows = last ? last.values.length : 0;
      state.history.push({ at: now(), sql, rows, ms: Math.round(ms * 10) / 10 });
      if (!last) {
        out.innerHTML = `<p class="ok">Done. ${state.db.getRowsModified()} row(s) changed · ${ms.toFixed(1)} ms</p>`;
      } else {
        const cap = 500;
        out.innerHTML = `<p class="meta"><strong>${rows} row${rows === 1 ? "" : "s"}</strong> · ${last.columns.length} column${last.columns.length === 1 ? "" : "s"} · ${ms.toFixed(1)} ms${rows > cap ? ` · showing first ${cap}` : ""}</p>
          <div class="tablewrap" tabindex="0" role="region" aria-label="Result table"><table><thead><tr>${last.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${
            last.values.slice(0, cap).map((r) => `<tr>${r.map((v) => v === null ? `<td class="null">null</td>` : typeof v === "number" ? `<td class="num">${v}</td>` : v instanceof Uint8Array ? `<td class="null">blob ${v.length} B</td>` : `<td${String(v).length <= 12 ? ' class="nw"' : ""}>${linkify(esc(v))}</td>`).join("")}</tr>`).join("")
          }</tbody></table></div>`;
      }
      afterChange(false);
    } catch (e) {
      out.innerHTML = `<div class="err"><p>${esc(plain(e.message))}</p><p class="raw">SQLite said: ${esc(e.message)}</p></div>`;
    }
  }
  const linkify = (s) => s.replace(/^(https:\/\/github\.com\/[^\s<]+)$/, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  // ---------- snapshots ----------
  async function save(opts = {}) {
    if (!state.db) return;
    const db = state.db, saved_at = now();
    db.exec("DROP TABLE IF EXISTS _workspace_meta; DROP TABLE IF EXISTS _workspace_files; DROP TABLE IF EXISTS _workspace_queries;");
    db.run("CREATE TABLE _workspace_meta (key TEXT PRIMARY KEY, value TEXT)");
    db.run("CREATE TABLE _workspace_files (name TEXT, kind TEXT, bytes INTEGER, sha256 TEXT, added_at TEXT, tables TEXT, note TEXT, sample INTEGER, content BLOB)");
    db.run("CREATE TABLE _workspace_queries (ran_at TEXT, sql TEXT, rows INTEGER, ms REAL)");
    const ver = db.exec("SELECT sqlite_version()")[0].values[0][0];
    for (const [k, v] of [["format", FORMAT], ["saved_at", saved_at], ["sqlite_version", ver], ["engine", "sql.js 1.12.0"], ["sample", state.sample ? "1" : "0"]])
      db.run("INSERT INTO _workspace_meta VALUES (?, ?)", [k, v]);
    for (const f of state.files) db.run("INSERT INTO _workspace_files VALUES (?,?,?,?,?,?,?,?,?)", [f.name, f.kind, f.bytes, f.sha256, f.added_at, JSON.stringify(f.tables), f.note, f.sample ? 1 : 0, f.content]);
    for (const q of state.history) db.run("INSERT INTO _workspace_queries VALUES (?,?,?,?)", [q.at, q.sql, q.rows, q.ms]);
    const bytes = db.export();
    // export() can reset connection state in sql.js; re-open from the bytes to keep working on an identical copy.
    state.db = new state.SQL.Database(bytes);
    db.close();
    for (const t of ["_workspace_meta", "_workspace_files", "_workspace_queries"]) state.db.run(`DROP TABLE IF EXISTS ${t}`);
    const digest = await sha256(bytes);
    const name = `workspace-${saved_at.replace(/[-:]/g, "").replace("T", "-").slice(0, 15)}.sqlite`;
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.sqlite3" }));
    const snap = { name, bytes, size: bytes.length, sha256: digest, saved_at, files: state.files.length, tables: listTables().length, queries: state.history.length, url };
    state.snaps.unshift(snap);
    if (!opts.quiet) {
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    }
    afterChange(false);
    toast(`Saved ${name} · ${fmtBytes(bytes.length)}`);
    return snap;
  }
  async function restoreSnap(i) {
    const s = state.snaps[i]; if (!s) return;
    await maybeRestore(s.name, s.bytes, s.sha256);
    afterChange();
  }

  // ---------- render ----------
  function afterChange(resetResult = true) {
    const has = !!state.files.length;
    $("#empty").hidden = has; $("#workbench").hidden = !has;
    $("#save").disabled = !has;
    const tables = listTables();
    const total = state.files.reduce((a, f) => a + f.bytes, 0);
    $("#wsline").textContent = has
      ? `${state.files.every((f) => f.sample) ? "sample workspace" : "your workspace"} · ${state.files.length} file${state.files.length === 1 ? "" : "s"} · ${tables.length} table${tables.length === 1 ? "" : "s"} · ${fmtBytes(total)}`
      : "empty workspace";

    $("#filelist").innerHTML = state.files.map((f, i) => `
      <li><button type="button" class="file${f === state.selected ? " sel" : ""}" data-file="${i}" aria-current="${f === state.selected}">
        <span class="fname">${esc(f.name)}</span>
        <span class="fmeta">${esc(f.kind)} · ${fmtBytes(f.bytes)} · <code>${esc(f.sha256.slice(0, 10))}</code></span>
        ${f.sample ? `<span class="badge">sample</span>` : ""}
      </button></li>`).join("");

    $("#tablelist").innerHTML = tables.length ? tables.map((t) => `<li><button type="button" data-table="${esc(t)}" aria-label="Query ${esc(t)}, ${countRows(t)} rows"><span>${esc(t)}</span><span class="n">${countRows(t)} rows</span></button></li>`).join("") : `<li class="none">No tables yet.</li>`;

    const ex = state.sample ? EX_SAMPLE : tables.slice(0, 3).flatMap((t) => [{ label: `First rows of ${t}`, sql: `SELECT * FROM ${qi(t)} LIMIT 100;` }]).concat(tables.length ? [{ label: "Row counts", sql: tables.map((t) => `SELECT '${t.replace(/'/g, "''")}' AS "table", COUNT(*) AS rows FROM ${qi(t)}`).join("\nUNION ALL\n") + ";" }] : []);
    $("#examples").innerHTML = ex.map((e, i) => `<button type="button" class="chip" data-ex="${i}">${esc(e.label)}</button>`).join("");
    $("#examples").ex = ex;

    renderInspect();
    renderSnaps();
    if (resetResult && has && !$("#result").innerHTML) $("#result").innerHTML = `<p class="meta">Pick an example or write a query, then Run.</p>`;
  }
  function renderInspect() {
    const f = state.selected, box = $("#inspect");
    if (!f) { box.innerHTML = `<p class="none">Select a file to see its digest, tables and first lines.</p>`; return; }
    let preview = "";
    if (f.kind !== "sqlite" && f.content.length) {
      const text = new TextDecoder().decode(f.content.subarray(0, 1400));
      preview = `<pre class="preview" tabindex="0" aria-label="First lines of ${esc(f.name)}">${esc(text.split("\n").slice(0, 8).join("\n"))}${f.bytes > 1400 || text.split("\n").length > 8 ? "\n…" : ""}</pre>`;
    }
    const tb = f.tables.filter((t) => listTables().includes(t)).map((t) => `<li><strong>${esc(t)}</strong> <span class="n">${countRows(t)} rows</span><br><span class="cols">${columns(t).map((c) => `${esc(c.name)} <i>${esc(c.type.toLowerCase())}</i>`).join(", ")}</span></li>`).join("");
    box.innerHTML = `
      <p class="iname">${esc(f.name)}${f.sample ? ` <span class="badge">sample</span>` : ""}</p>
      <dl>
        <dt>Kind</dt><dd>${esc(f.kind)}</dd>
        <dt>Size</dt><dd>${fmtBytes(f.bytes)} <span class="n">(${f.bytes.toLocaleString()} bytes)</span></dd>
        <dt>SHA-256</dt><dd><code class="digest">${esc(f.sha256)}</code></dd>
        <dt>Result</dt><dd>${esc(f.note)}</dd>
      </dl>
      ${tb ? `<ul class="itables">${tb}</ul>` : ""}
      ${preview}`;
  }
  function renderSnaps() {
    const r = state.restoredFrom;
    $("#snaplist").innerHTML = (r ? `<li class="restored">Restored from <strong>${esc(r.name)}</strong>, saved ${esc(r.saved_at)}<br><code>${esc(r.digest.slice(0, 16))}…</code></li>` : "") +
      state.snaps.map((s, i) => `
      <li>
        <p class="sname">${esc(s.name)}</p>
        <p class="smeta">${fmtBytes(s.size)} · ${s.files} files · ${s.tables} tables · ${s.queries} quer${s.queries === 1 ? "y" : "ies"}</p>
        <p class="smeta">SHA-256 <code>${s.sha256.slice(0, 16)}…</code></p>
        <p class="sact"><a class="btn small" href="${s.url}" download="${esc(s.name)}">Download</a> <button class="btn small ghost" type="button" data-restore="${i}">Restore this</button></p>
      </li>`).join("");
  }

  // ---------- wiring ----------
  $("#filein").addEventListener("change", (e) => { importFiles([...e.target.files]); e.target.value = ""; });
  const drop = $("#drop"), app = $("#app");
  ["dragenter", "dragover"].forEach((ev) => app.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => app.addEventListener(ev, (e) => { e.preventDefault(); if (ev === "drop" || e.target === app) drop.classList.remove("over"); }));
  app.addEventListener("drop", (e) => importFiles([...(e.dataTransfer?.files || [])]));
  $("#sample").addEventListener("click", loadSample);
  $("#run").addEventListener("click", run);
  $("#save").addEventListener("click", () => save());
  $("#sql").addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); } });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-file],[data-table],[data-ex],[data-restore],[data-tab]"); if (!b) return;
    if (b.dataset.file) { state.selected = state.files[+b.dataset.file]; afterChange(false); setTab("inspect", true); }
    else if (b.dataset.table) { $("#sql").value = `SELECT * FROM ${qi(b.dataset.table)} LIMIT 100;`; setTab("query", true); run(); }
    else if (b.dataset.ex) { $("#sql").value = $("#examples").ex[+b.dataset.ex].sql; run(); }
    else if (b.dataset.restore) restoreSnap(+b.dataset.restore);
    else if (b.dataset.tab) setTab(b.dataset.tab);
  });
  function setTab(t, onlyMobile) {
    if (onlyMobile && matchMedia("(min-width: 900px)").matches) return;
    document.body.dataset.tab = t;
    document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === t)));
  }
  setTab(params.get("tab") || "query");

  const ready = initSqlJs({ locateFile: (file) => `/vendor/sql.js/${file}` })
    .then((SQL) => { state.SQL = SQL; state.db = new SQL.Database(); });
  ready.then(async () => {
    $("#sample").disabled = false;
    afterChange();
    if (params.get("sample") === "1") { await loadSample(); setTab("query"); run(); }
    document.documentElement.dataset.ready = "true";
  }).catch((e) => {
    $("#empty").innerHTML = `<h2 class="hero">SQLite didn't start.</h2><p>${esc(e.message)}</p><p>Everything else on this site works without it.</p>`;
  });
}
