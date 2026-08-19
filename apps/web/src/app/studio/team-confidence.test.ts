import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canDoSummary,
  deviceTrust,
  lastSeenPhrase,
  permissionGroupsFor,
  sessionOnDevice,
  sessionRevokeCopy,
} from './team-confidence';

test('can-do summary stays human', () => {
  assert.equal(
    canDoSummary('Waiter', ['session.read', 'fulfilment.update', 'payment.complete']),
    'Waiter · mark ready · take payment',
  );
  assert.equal(canDoSummary('Kitchen', ['fulfilment.read']), 'Kitchen · see the floor');
});

test('permission groups hide unused ids', () => {
  const groups = permissionGroupsFor([
    { id: 'fulfilment.read', label: 'View queue' },
    { id: 'fulfilment.update', label: 'Mark preparing · ready' },
  ]);
  assert.deepEqual(
    groups.map((g) => g.id),
    ['see', 'act'],
  );
  assert.equal(groups[0].items[0].label, 'View queue');
});

test('device trust: in use vs idle', () => {
  const now = Date.parse('2026-08-19T12:00:00.000Z');
  const active = new Set(['Kitchen Tablet']);
  const busy = deviceTrust(
    {
      label: 'Kitchen Tablet',
      lastStaffName: 'Sam',
      lastSeenAt: '2026-08-19T11:55:00.000Z',
    },
    active,
    now,
  );
  assert.equal(busy.state, 'In use');
  assert.equal(busy.assigned, 'Assigned here');

  const idle = deviceTrust(
    { label: 'Bar Tablet', lastStaffName: null, lastSeenAt: '2026-08-18T12:00:00.000Z' },
    new Set(),
    now,
  );
  assert.equal(idle.state, 'Idle');
  assert.match(idle.lastSeen, /Last seen/);
});

test('last seen phrases', () => {
  const now = Date.parse('2026-08-19T12:00:00.000Z');
  assert.equal(lastSeenPhrase('2026-08-19T11:59:00.000Z', now), 'Last seen just now');
  assert.equal(lastSeenPhrase('2026-08-19T11:30:00.000Z', now), 'Last seen 30 min ago');
});

test('session revoke copy names the shared device', () => {
  const copy = sessionRevokeCopy({
    active: true,
    deviceLabel: 'Kitchen Tablet',
    displayName: 'Sam',
  });
  assert.equal(copy.action, 'End now');
  assert.equal(copy.consequence, 'Ends access on Kitchen Tablet.');
  assert.equal(copy.after, 'Safe to reassign.');
});

test('person to device relationship', () => {
  assert.equal(
    sessionOnDevice('s1', [{ staffId: 's1', active: true, deviceLabel: 'Bar Tablet' }]),
    'Bar Tablet',
  );
  assert.equal(sessionOnDevice('s1', [{ staffId: 's1', active: false, deviceLabel: 'Bar Tablet' }]), null);
});
