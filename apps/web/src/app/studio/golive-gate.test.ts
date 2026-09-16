import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canGoLive,
  staffHasStation,
  type GateCondition,
  type GateExtra,
} from './golive-gate';

const venue: GateCondition = {
  id: 'venue',
  label: 'Your venue',
  value: 'Rusty Oak',
  ok: true,
  required: true,
};
const places: GateCondition = {
  id: 'places',
  label: 'Where guests join',
  value: '1 ready',
  ok: true,
  required: true,
};
const menu: GateCondition = {
  id: 'menu',
  label: 'Your menu',
  value: '12 items',
  ok: true,
  required: true,
};
const orders: GateCondition = {
  id: 'orders',
  label: 'Who takes orders',
  value: 'Kitchen ready',
  ok: true,
  required: true,
};
const pay: GateExtra = {
  id: 'pay',
  label: 'How guests pay',
  value: 'Not connected',
  ok: false,
  required: false,
};

test('all required ok, extras not ok → go live', () => {
  const gate = canGoLive([venue, places, menu, orders, pay]);
  assert.equal(gate.ok, true);
  assert.deepEqual(gate.blocking, []);
});

test('places not ok blocks', () => {
  const gate = canGoLive([venue, { ...places, ok: false }, menu, orders, pay]);
  assert.equal(gate.ok, false);
  assert.ok(gate.blocking.includes('places'));
});

test('menu not ok blocks', () => {
  const gate = canGoLive([venue, places, { ...menu, ok: false }, orders, pay]);
  assert.equal(gate.ok, false);
  assert.ok(gate.blocking.includes('menu'));
});

test('orders not ok blocks', () => {
  const gate = canGoLive([venue, places, menu, { ...orders, ok: false }, pay]);
  assert.equal(gate.ok, false);
  assert.ok(gate.blocking.includes('orders'));
});

test('unrecognised required row that is not ok fails closed', () => {
  const rogue = {
    id: 'legacy-identity',
    label: 'Who you are',
    value: '',
    ok: false,
    required: true as const,
  };
  const gate = canGoLive([venue, places, menu, orders, rogue]);
  assert.equal(gate.ok, false);
});

test('empty rows array does not pass', () => {
  const gate = canGoLive([]);
  assert.equal(gate.ok, false);
});

test('staffHasStation is true only for a station home', () => {
  assert.equal(staffHasStation({ role: 'kitchen', homePath: '/staff/station/kitchen' }), true);
  assert.equal(staffHasStation({ role: 'waiter', homePath: '/staff/service' }), false);
  assert.equal(staffHasStation({ role: 'staff', homePath: '/staff/service' }), false);
});
