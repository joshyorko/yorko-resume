import { createSession } from "./core.mjs";
import { contract, wasm, fixture } from "./assets.mjs";

function bytes(encoded) {
  return Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
}

export async function createDemo() {
  const session = await createSession(bytes(wasm), contract);
  const activity = [];
  let sequence = 0;

  function record(receipt, started) {
    const entry = { sequence: ++sequence, elapsed_ms: performance.now() - started, receipt };
    activity.push(entry);
    if (activity.length > 16) activity.shift();
    return structuredClone(entry);
  }

  return {
    manifestSchema: structuredClone(contract.input_schema),
    runManifest(input) {
      const started = performance.now();
      const { output, receipt } = session.run(contract.name, input);
      return { output, activity: record(receipt, started) };
    },
    async inspectFixture() {
      const started = performance.now();
      const { content, provenance } = await session.inspect(bytes(fixture));
      return { content, activity: record({
        kind: "browser-bundle-inspection.v1", provenance,
      }, started) };
    },
    chronology() {
      return structuredClone(activity);
    },
    exportChronology() {
      if (!activity.length) throw new Error("Run an experiment before exporting.");
      return new Blob([JSON.stringify({
        kind: "machine-room-browser-session.v1", activity,
      }, null, 2) + "\n"], { type: "application/json" });
    },
  };
}

export function downloadChronology(demo) {
  const url = URL.createObjectURL(demo.exportChronology());
  const link = document.createElement("a");
  link.href = url;
  link.download = "machine-room-browser-session.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
