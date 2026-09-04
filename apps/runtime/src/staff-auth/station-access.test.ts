import assert from 'node:assert/strict';
import test from 'node:test';
import { restaurantStationAccess } from '@lekki/pack-restaurant';
import {
  canAccessStation,
  isDeliverOnlyRole,
  operateRoleForStation,
  resolveStationKey,
  venueStationId,
} from './station-access';

const table = restaurantStationAccess;

test('Batch 4: station-cellar-bar is not writable by bar by accident', () => {
  assert.equal(
    canAccessStation({
      role: 'bar',
      stationId: 'station-cellar-bar',
      table,
    }),
    false,
  );
});

test('Batch 4: unknown station id fails closed for every non-admin role', () => {
  for (const role of ['bar', 'counter', 'kitchen', 'waiter']) {
    assert.equal(
      canAccessStation({
        role,
        stationId: 'station-totally-unknown',
        table,
      }),
      false,
      role,
    );
  }
  assert.equal(
    operateRoleForStation({
      stationId: 'station-totally-unknown',
      table,
    }),
    null,
  );
});

test('Batch 4: explicit station-bar allows bar; admin still reaches cellar-bar', () => {
  assert.equal(
    canAccessStation({ role: 'bar', stationId: 'station-bar', table }),
    true,
  );
  assert.equal(
    canAccessStation({ role: 'staff', stationId: 'station-cellar-bar', table }),
    true,
  );
});

test('Batch 4: venue-namespaced station keys resolve before bare ids', () => {
  const venueTable = {
    ...table,
    stations: {
      ...table.stations,
      [venueStationId('venue-rustyoak', 'station-bar')]: ['bar', 'staff'] as const,
    },
  };
  assert.equal(
    resolveStationKey({
      stationId: 'station-bar',
      venueId: 'venue-rustyoak',
      table: venueTable,
    }),
    venueStationId('venue-rustyoak', 'station-bar'),
  );
});

test('Batch 4: deliver-only roles come from the table, not id substrings', () => {
  assert.equal(isDeliverOnlyRole('waiter', table), true);
  assert.equal(isDeliverOnlyRole('bar', table), false);
});
