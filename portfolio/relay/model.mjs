// Train a Bernoulli Naive Bayes model on authored synthetic incident notes.
const corpus = {
  dedupe: [
    'courier accepted twice after lost acknowledgement',
    'duplicate parcels reached the same destination',
    'two deliveries for one parcel after a resend',
    'acknowledgement vanished and courier delivered twice',
    'redelivery repeated an already delivered parcel',
    'duplicate delivery after lost receipt',
  ],
  retry: [
    'temporary failure left the parcel stranded',
    'attempt budget exhausted after one transient failure',
    'courier temporarily unavailable and stops after one attempt',
    'retry budget ran out before service recovered',
    'temporary outage consumed the only attempt',
    'transient failure should retry when the courier recovers',
  ],
  lease: [
    'dead worker held an expired claim',
    'lease expired but a standby worker could not take over',
    'stalled parcel remains owned by an unavailable worker',
    'expired lease should release abandoned work to the standby',
    'worker vanished while holding the claim',
    'standby blocked by expired ownership',
  ],
};

export const minimumMargin = 0.8;
const minimumEvidence = 2;
const tokens = text => new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);

export function train() {
  const labels = Object.keys(corpus);
  const vocab = [...new Set(Object.values(corpus).flat().flatMap(row => [...tokens(row)]))].sort();
  const weights = [];
  for (const label of labels) {
    const rows = corpus[label].map(tokens);
    const probabilities = vocab.map(word => (1 + rows.filter(row => row.has(word)).length) / (rows.length + 2));
    const bias = -Math.log(labels.length) + probabilities.reduce((sum, p) => sum + Math.log1p(-p), 0);
    weights.push(bias, ...probabilities.map(p => Math.log(p / (1 - p))));
  }
  const bytes = Buffer.alloc(weights.length * 4);
  weights.forEach((weight, i) => bytes.writeFloatLE(weight, i * 4));
  return { labels, vocab, weights: bytes.toString('base64'), weightBytes: bytes.length };
}

export async function loadModel(wasm, { labels, vocab, weights }) {
  const { instance } = await WebAssembly.instantiate(wasm);
  const { memory, dot } = instance.exports;
  const width = vocab.length + 1;
  const features = new Float32Array(memory.buffer, 0, width);
  const bytes = Uint8Array.from(atob(weights), char => char.charCodeAt(0));
  new Uint8Array(memory.buffer, width * 4, bytes.length).set(bytes);
  features[0] = 1;
  const coefficients = new Float32Array(memory.buffer, width * 4, bytes.length / 4);
  const informative = vocab.filter((_, index) => {
    const values = labels.map((_, label) => coefficients[label * width + index + 1]);
    return Math.max(...values) - Math.min(...values) >= 1.3;
  });

  return {
    memoryBytes: memory.buffer.byteLength,
    rank(text) {
      const words = tokens(text);
      vocab.forEach((word, i) => { features[i + 1] = Number(words.has(word)); });
      const scores = labels.map((key, i) => ({ key, score: dot(0, (i + 1) * width * 4, width) }));
      scores.sort((a, b) => b.score - a.score);
      const margin = scores[0].score - scores[1].score;
      const evidence = informative.filter(word => words.has(word));
      const choice = evidence.length >= minimumEvidence && margin >= minimumMargin ? scores[0].key : null;
      return { scores, margin, evidence, choice };
    },
  };
}
