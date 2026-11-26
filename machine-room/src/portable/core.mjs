const LEAF_SHA = "sha256:7db4047fe674a494e03472efd9febcec1612f337dd222a29ba2f457e635b8a03";
const CORPUS_SHA = "sha256:6b783d2009fc25374796bf3bf2f25763b76a8ffdce52ff6bd9186cde7b6952be";
const ACTION = "inspect_manifest";
const PARAMETERS = ["format_version", "descriptor_count", "root_memories", "dependency_objects"];
const KINDS = ["subject", "episode", "source", "evidence", "memory"];
const PATHS = ["manifest.json", ...KINDS.map((kind) =>
  `objects/${kind === "evidence" ? kind : kind === "memory" ? "memories" : kind + "s"}.jsonl`)];
const MAX_ARCHIVE = 16 * 1024;
const utf8 = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

function check(condition, code) {
  if (!condition) throw new Error(code);
}

async function sha(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return "sha256:" + Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function ownsShape(value, keys) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function u32(value) {
  return Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readStoredZip(bytes) {
  check(bytes.length >= 22 && bytes.length <= MAX_ARCHIVE, "archive_size");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const n16 = (p) => view.getUint16(p, true);
  const n32 = (p) => view.getUint32(p, true);
  const end = bytes.length - 22;
  check(n32(end) === 0x06054b50 && n32(end + 4) === 0 &&
    n16(end + 8) === PATHS.length && n16(end + 10) === PATHS.length &&
    n16(end + 20) === 0, "zip_end");
  const central = n32(end + 16);
  check(central + n32(end + 12) === end, "zip_directory");

  let cursor = central;
  let local = 0;
  const members = new Map();
  for (const path of PATHS) {
    const nameLength = path.length;
    check(cursor + 46 + nameLength <= end && n32(cursor) === 0x02014b50, "zip_entry");
    const crc = n32(cursor + 16);
    const size = n32(cursor + 24);
    check(n32(cursor + 8) === 0 && n32(cursor + 20) === size &&
      n16(cursor + 28) === nameLength && n32(cursor + 30) === 0 &&
      n16(cursor + 34) === 0 && n32(cursor + 42) === local &&
      ((n32(cursor + 38) >>> 16) & 0xf000) === 0x8000, "zip_entry");
    check(utf8.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength)) === path,
      "zip_path");
    const body = local + 30 + nameLength;
    check(body + size <= central && n32(local) === 0x04034b50 &&
      n32(local + 6) === 0 && n32(local + 14) === crc &&
      n32(local + 18) === size && n32(local + 22) === size &&
      n16(local + 26) === nameLength && n16(local + 28) === 0 &&
      utf8.decode(bytes.subarray(local + 30, body)) === path, "zip_local");
    const payload = bytes.subarray(body, body + size);
    check(crc32(payload) === crc, "zip_crc");
    members.set(path, payload);
    local = body + size;
    cursor += 46 + nameLength;
  }
  check(local === central && cursor === end, "zip_trailing_data");
  return members;
}

function canonical(value, depth = 0) {
  check(depth <= 16, "json_depth");
  if (Array.isArray(value)) return "[" + value.map((v) => canonical(v, depth + 1)).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ":" + canonical(value[key], depth + 1)).join(",") + "}";
  }
  if (typeof value === "number") check(Number.isFinite(value), "json_number");
  return JSON.stringify(value);
}

function readCanonical(text) {
  const value = JSON.parse(text);
  // Exact canonical comparison also rejects duplicate keys, whitespace and BOMs.
  check(canonical(value) === text, "noncanonical_json");
  return value;
}

async function inspectBundle(bytes, inspectManifest) {
  check(bytes instanceof Uint8Array && bytes.length <= MAX_ARCHIVE, "archive_size");
  // Copy before async digest checks so the caller cannot change bytes in flight.
  const snapshot = Uint8Array.from(bytes);
  const members = readStoredZip(snapshot);
  const manifestBytes = members.get("manifest.json");
  const manifest = readCanonical(utf8.decode(manifestBytes));
  check(ownsShape(manifest, ["media_type", "format_version", "bundle_id", "created_at",
    "producer", "intent", "selection", "policy", "descriptors", "counts",
    "required_features", "extensions"]) &&
    manifest.media_type === "application/vnd.codex-memoryd.bundle.v1+json" &&
    Array.isArray(manifest.descriptors) && Array.isArray(manifest.required_features) &&
    manifest.required_features.length === 0 && ownsShape(manifest.extensions, []) &&
    ownsShape(manifest.producer, ["instance_id", "tool_version", "storage_schema_version"]) &&
    ownsShape(manifest.counts, ["root_memories", "dependency_objects", "omitted_secret",
      "omitted_quarantined", "omitted_portability", "omitted_boundary",
      "omitted_unsafe_path", "external_references"]), "manifest_schema");
  const { root_memories, dependency_objects, ...otherCounts } = manifest.counts;
  check(inspectManifest({ format_version: manifest.format_version,
    descriptor_count: manifest.descriptors.length, root_memories, dependency_objects }),
    "manifest_bounds");
  check(root_memories === 1 && dependency_objects === 0 &&
    Object.values(otherCounts).every((n) => n === 0), "unsupported_graph");

  const { bundle_id, ...unsigned } = manifest;
  check(bundle_id === await sha(encoder.encode(canonical(unsigned))), "bundle_id");
  for (const [index, path] of PATHS.slice(1).entries()) {
    const descriptor = manifest.descriptors[index];
    const payload = members.get(path);
    check(ownsShape(descriptor, ["path", "media_type", "digest", "size_bytes",
      "object_count", "required"]) && descriptor.path === path && descriptor.required === true &&
      descriptor.media_type === `application/vnd.codex-memoryd.${KINDS[index]}.v1+jsonl` &&
      descriptor.size_bytes === payload.length, "descriptor_schema");
    check(descriptor.digest === await sha(payload), "member_digest");
    check(index === 4 ? descriptor.object_count === 1 :
      descriptor.object_count === 0 && payload.length === 0, "unsupported_graph");
  }
  const line = utf8.decode(members.get(PATHS[5]));
  check(line.endsWith("\n") && !line.slice(0, -1).includes("\n"), "memory_jsonl");
  const envelope = readCanonical(line.slice(0, -1));
  check(ownsShape(envelope, ["aliases", "body", "digest", "portable_ref", "schema"]) &&
    envelope.schema === "codex-memoryd.memory.v1" &&
    Array.isArray(envelope.aliases) && envelope.aliases.length === 0 &&
    ownsShape(envelope.portable_ref, ["origin_instance_id", "kind", "id"]) &&
    envelope.portable_ref.kind === "memory" &&
    envelope.portable_ref.origin_instance_id === manifest.producer.instance_id &&
    typeof envelope.portable_ref.id === "string" &&
    /^mr_[0-9a-f]{32}$/.test(envelope.portable_ref.id) &&
    typeof envelope.body?.content === "string", "memory_schema");
  check(envelope.digest === await sha(encoder.encode(canonical(envelope.body))), "body_digest");

  // The allowlist binds the complete archive that native MemoryD screened.
  // Partial browser validation never grants authority to unreviewed payloads.
  const archiveDigest = await sha(snapshot);
  check(archiveDigest === CORPUS_SHA, "corpus_not_allowed");
  return {
    content: envelope.body.content,
    provenance: {
      bundle_id,
      manifest_digest: await sha(manifestBytes),
      archive_digest: archiveDigest,
      body_digest: envelope.digest,
      portable_ref: envelope.portable_ref,
      integrity_status: "verified",
      authenticity: "unverified",
      origin: "native-verified-synthetic-fixture",
    },
  };
}

export async function createSession(wasmBytes, contract) {
  check(wasmBytes instanceof Uint8Array && wasmBytes.length === 96, "untrusted_wasm");
  const binary = Uint8Array.from(wasmBytes);
  check(await sha(binary) === LEAF_SHA, "untrusted_wasm");
  const { instance, module } = await WebAssembly.instantiate(binary);
  check(WebAssembly.Module.imports(module).length === 0 &&
    WebAssembly.Module.exports(module).length === 1, "wasm_capability");
  check(contract.name === ACTION && contract.options?.kind === "tool" &&
    contract.options.read_only_hint === true && contract.options.destructive_hint === false &&
    contract.options.idempotent_hint === true && contract.options.open_world_hint === false &&
    ownsShape(contract.managed_params_schema, []) &&
    contract.output_schema?.type === "boolean" && contract.input_schema?.type === "object" &&
    ownsShape(contract.input_schema.properties, PARAMETERS) &&
    PARAMETERS.every((key, index) => contract.input_schema.required?.[index] === key &&
      contract.input_schema.properties[key].type === "integer") &&
    contract.input_schema.required.length === PARAMETERS.length, "contract_schema");

  let revision = 0;
  let imported = null;
  const run = (name, input) => {
    check(name === ACTION, "unknown_action");
    check(ownsShape(input, PARAMETERS), "invalid_input");
    const args = PARAMETERS.map((key) => input[key]);
    check(args.every(u32), "invalid_input");
    const result = instance.exports.inspect_manifest(...args);
    check(result === 0 || result === 1, "invalid_output");
    return { output: result === 1,
      receipt: { kind: "browser-action-receipt.v1", action: ACTION, executor: "wasm",
        wasm_digest: LEAF_SHA, output: result === 1 } };
  };

  return Object.freeze({
    run,
    async inspect(bytes) {
      return inspectBundle(bytes, (input) => run(ACTION, input).output);
    },
    async importBundle(bytes) {
      const started = ++revision;
      const result = await inspectBundle(bytes, (input) => run(ACTION, input).output);
      check(started === revision, "import_superseded");
      imported = result;
      return structuredClone(result);
    },
    read() {
      return structuredClone(imported);
    },
    reset() {
      revision += 1;
      imported = null;
    },
    exportReceipt() {
      check(imported !== null, "no_import");
      return new Blob([JSON.stringify({ kind: "browser-session-receipt.v1",
        imported: imported.provenance }, null, 2) + "\n"], { type: "application/json" });
    },
  });
}
