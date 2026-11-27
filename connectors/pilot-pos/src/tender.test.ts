import assert from 'node:assert/strict';
import test from 'node:test';
import { PilotTenderUnavailableError, pilotTenderReadiness, postPilotTender } from './tender';

test('tender write-back stays closed until Pilot documents it', () => {
  const r = pilotTenderReadiness();
  assert.equal(r.ready, false);
  assert.match(r.ready ? '' : r.reason, /Pilot has not shared/);
});

test('posting a tender refuses without touching the network', async () => {
  const realFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (() => {
    called = true;
    throw new Error('network');
  }) as typeof fetch;
  try {
    await assert.rejects(
      postPilotTender({ checkRef: 'c1', paidMinor: 1000, tipMinor: 100, currency: 'ZAR' }),
      PilotTenderUnavailableError,
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});
