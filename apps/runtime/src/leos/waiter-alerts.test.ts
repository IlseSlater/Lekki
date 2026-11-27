import assert from 'node:assert/strict';
import test from 'node:test';
import { canTakeTable, isGoneStatus, readyAlertPayload, readyAudience } from './waiter-alerts';

const devices = [
  { staffMemberId: 'a', endpoint: 'e1' },
  { staffMemberId: 'b', endpoint: 'e2' },
  { staffMemberId: 'b', endpoint: 'e3' },
];

test('ready food alerts that table’s waiter', () => {
  assert.deepEqual(
    readyAudience('b', devices).map((d) => d.endpoint),
    ['e2', 'e3'],
  );
});

test('an untaken table, or a waiter without a phone, alerts every registered waiter', () => {
  assert.equal(readyAudience(null, devices).length, 3);
  assert.equal(readyAudience('zed', devices).length, 3);
  assert.equal(readyAudience('a', []).length, 0);
});

test('the alert names the table and the food and carries a notification block', () => {
  const p = readyAlertPayload({ placeLabel: 'Table 4', itemLabels: ['Burger', 'Chips'], sessionId: 's1' });
  assert.equal(p.notification.title, 'Ready for Table 4');
  assert.equal(p.notification.body, 'Burger, Chips');
  assert.equal(p.notification.tag, 'ready-s1');
});

test('long orders are summarised and missing places read naturally', () => {
  const p = readyAlertPayload({ placeLabel: null, itemLabels: ['a', 'b', 'c', 'd', 'e'], sessionId: 's' });
  assert.equal(p.notification.title, 'Ready for a table');
  assert.equal(p.notification.body, 'a, b, c and 2 more');
  assert.equal(readyAlertPayload({ placeLabel: 'T1', itemLabels: [], sessionId: 's' }).notification.body, 'Ready to collect');
});

test('a taken table stays with its waiter unless a manager moves it', () => {
  assert.equal(canTakeTable(null, 'a', false), true);
  assert.equal(canTakeTable('a', 'a', false), true);
  assert.equal(canTakeTable('a', 'b', false), false);
  assert.equal(canTakeTable('a', 'b', true), true);
});

test('gone subscriptions are recognised', () => {
  assert.equal(isGoneStatus(410), true);
  assert.equal(isGoneStatus(404), true);
  assert.equal(isGoneStatus(500), false);
});
