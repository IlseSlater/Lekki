import assert from 'node:assert/strict';
import test from 'node:test';
import { ProfileEngine, InMemoryProfileStore } from './index';
import type { ExperienceProfileDefinition } from '@lekki/contracts';

const sampleProfile: ExperienceProfileDefinition = {
  id: 'profile-demo',
  version: '1.0.0',
  packId: 'pack-demo',
  label: 'Demo',
  enabledCapabilities: ['commerce.transaction', 'fulfilment.route', 'payment.settle'],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan' }],
  stations: [{ id: 'station-a', label: 'Station A', routingTags: ['food'] }],
  terminology: { session: 'Visit' },
  workflows: [{ id: 'wf-1', label: 'Start', order: 1 }],
  fulfilmentRouting: [{ matchTags: ['food'], stationId: 'station-a' }],
  surfaces: ['guest'],
  permissions: { staff: ['session.read'] },
};

test('ProfileEngine resolves capabilities and terminology', async () => {
  const store = new InMemoryProfileStore();
  store.register(sampleProfile);
  const engine = new ProfileEngine(store);

  const capability = await engine.resolveCapability(
    { profileId: 'profile-demo', version: '1.0.0' },
    'payment.settle',
  );
  assert.equal(capability.ok, true);
  if (capability.ok) {
    assert.equal(capability.value, true);
  }

  const term = await engine.resolveTerminology(
    { profileId: 'profile-demo', version: '1.0.0' },
    'session',
  );
  assert.equal(term.ok, true);
  if (term.ok) {
    assert.equal(term.value, 'Visit');
  }
});
