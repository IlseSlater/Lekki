import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGoLiveConfirm,
  canOpenGoLiveConfirm,
  spokenArea,
  spokenScanRange,
} from './golive-confirm';

const ready = {
  venueName: 'Rusty Oak',
  placeCodes: ['TBL-1', 'TBL-2', 'TBL-12'],
  area: 'Main',
  station: 'Kitchen',
  paymentsActive: false,
};

test('spoken area drops a trailing dining noun', () => {
  assert.equal(spokenArea('Main Dining'), 'Main');
  assert.equal(spokenArea('Patio'), 'Patio');
});

test('spoken scan range collapses a numbered run', () => {
  assert.equal(spokenScanRange(['TBL-1', 'TBL-12', 'TBL-2']), 'TBL-1 to TBL-12');
  assert.equal(spokenScanRange(['Table 4']), 'Table 4');
  assert.equal(spokenScanRange([]), null);
});

test('four clauses: venue, scan, station, pay in person', () => {
  const copy = buildGoLiveConfirm(ready);
  assert.ok(copy);
  assert.equal(copy!.headline, 'Rusty Oak is about to open.');
  assert.equal(copy!.scan, 'Guests can scan TBL-1 to TBL-12 in Main.');
  assert.equal(copy!.orders, 'Orders arrive at Kitchen.');
  assert.equal(copy!.pay, 'Payments aren’t connected, so guests pay in person.');
  assert.equal(copy!.payConnected, false);
});

test('connected payments changes only the pay clause', () => {
  const copy = buildGoLiveConfirm({ ...ready, paymentsActive: true });
  assert.equal(copy?.pay, 'Payments are connected.');
  assert.equal(copy?.payConnected, true);
});

test('sheet does not open when a required clause cannot be filled', () => {
  assert.equal(canOpenGoLiveConfirm({ ...ready, venueName: '  ' }), false);
  assert.equal(canOpenGoLiveConfirm({ ...ready, placeCodes: [] }), false);
  assert.equal(canOpenGoLiveConfirm({ ...ready, station: '' }), false);
  assert.equal(buildGoLiveConfirm({ ...ready, venueName: '' }), null);
});

test('orders clause never includes a person name even if one is nearby', () => {
  const copy = buildGoLiveConfirm(ready);
  assert.ok(copy);
  assert.equal(copy!.orders.includes('Ilse'), false);
  assert.match(copy!.orders, /^Orders arrive at Kitchen\.$/);
});
