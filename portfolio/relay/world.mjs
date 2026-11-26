export const tools = Object.freeze({
  dedupe: Object.freeze({ name: 'Enable delivery receipts', before: false, after: true }),
  retry: Object.freeze({ name: 'Set a three-attempt budget', before: 1, after: 3 }),
  lease: Object.freeze({ name: 'Release expired claims', before: false, after: true }),
});

const healthy = { dedupe: true, retry: 2, lease: true };
export const incidents = Object.freeze([
  { id: 'duplicate', label: 'Two parcels arrive', parcel: 'RX-104', destination: 'East depot',
    fault: 'dedupe', disruption: 'ack', clue: 'The first delivery went through. Its acknowledgement went missing.' },
  { id: 'outage', label: 'A parcel goes missing', parcel: 'RX-208', destination: 'North depot',
    fault: 'retry', disruption: 'outage', clue: 'The courier reported a temporary outage and came back online.' },
  { id: 'abandoned', label: 'A parcel stays claimed', parcel: 'RX-312', destination: 'West depot',
    fault: 'lease', disruption: 'worker', clue: 'The worker stopped responding while it held the dispatch claim.' },
  { id: 'address', label: 'A label has no address', parcel: 'RX-416', destination: '',
    fault: null, disruption: 'address', clue: 'The parcel reached dispatch with an incomplete label.' },
]);

function replay(config, { parcel, destination, disruption }) {
  const events = [];
  const deliveries = [];
  const log = (station, text) => events.push({ station, text });
  log('Intake', `${parcel} queued`);
  if (!destination) {
    log('Dispatch', 'Address missing. Parcel held for a label correction.');
    return { events, deliveries };
  }
  log('Dispatch', 'Worker accepted the claim');
  if (disruption === 'worker') {
    log('Dispatch', 'Worker vanished. Claim expired.');
    if (!config.lease) {
      log('Dispatch', 'Standby blocked by expired ownership');
      return { events, deliveries };
    }
    log('Dispatch', 'Standby took over the expired lease');
  }

  for (let attempt = 1; attempt <= config.retry; attempt++) {
    if (disruption === 'outage' && attempt === 1) {
      log('Courier', 'Temporary outage. Delivery attempt failed.');
      if (attempt === config.retry) log('Dispatch', 'Retry budget exhausted after one attempt');
      continue;
    }
    if (config.dedupe && deliveries.length) {
      log('Courier', 'Existing delivery receipt suppressed the resend');
      break;
    }
    deliveries.push({ parcel, destination });
    log('Courier', `Parcel delivered to ${destination}`);
    if (disruption !== 'ack' || attempt > 1) break;
    log('Dispatch', 'Lost acknowledgement caused a resend');
  }
  if (deliveries.length > 1) log('Courier', 'Duplicate delivery: courier accepted twice');
  return { events, deliveries };
}

function check(config, fixture) {
  const { deliveries } = replay(config, fixture);
  return deliveries.length === 1 &&
    deliveries[0].parcel === fixture.parcel && deliveries[0].destination === fixture.destination;
}

function audit(config, incident) {
  const fixtures = [
    ['Original incident', incident],
    ['Regular delivery', { parcel: 'QA-001', destination: 'South depot', disruption: 'none' }],
    ['Lost acknowledgement', { parcel: 'QA-002', destination: 'Hill depot', disruption: 'ack' }],
    ['Temporary courier failure', { parcel: 'QA-003', destination: 'River depot', disruption: 'outage' }],
    ['Expired worker lease', { parcel: 'QA-004', destination: 'Park depot', disruption: 'worker' }],
  ];
  return fixtures.map(([label, fixture]) => ({ label, pass: check(config, fixture) }));
}

export function createSession(incident, model) {
  let config = { ...healthy };
  if (incident.fault) config[incident.fault] = tools[incident.fault].before;
  const history = [];
  let phase = 'replay';
  let outcome = null;

  return {
    history,
    get phase() { return phase; },
    get outcome() { return outcome; },
    step() {
      if (outcome) return;
      const start = performance.now();
      if (phase === 'replay') {
        history.push({ phase, ...replay(config, incident), ms: performance.now() - start });
        phase = 'repair';
        return;
      }

      if (phase === 'repair') {
        const primary = history[0];
        const trace = primary.events.map(event => event.text).join(' ');
        const decision = model.rank(trace);
        const key = decision.choice;
        const tool = key && Object.hasOwn(tools, key) ? tools[key] : null;
        // Address is an invariant of the dispatch contract. Only a field with
        // an applicable transition can change. Scores cannot override either.
        const patch = incident.destination && primary.deliveries.length !== 1 &&
          tool && config[key] !== tool.after ? key : null;
        let reason;
      if (!incident.destination) reason = 'A human needs to correct the missing address.';
      else if (!key) reason = 'The model did not find a clear repair.';
      else if (!patch) reason = 'The proposed change does not apply to this dispatch configuration.';
      history.push({ phase, decision, patch, reason, ms: performance.now() - start });
        phase = 'audit';
        if (!patch) outcome = 'handoff';
        return;
      }

      const patch = history[1].patch;
      const candidate = { ...config, [patch]: tools[patch].after };
      const checks = audit(candidate, incident);
      const approved = checks.every(result => result.pass);
      if (approved) config = candidate;
      history.push({ phase, checks, ...replay(config, incident), ms: performance.now() - start });
      outcome = approved ? 'verified' : 'rejected';
    },
  };
}
