import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextOwnerHint,
  operateHandoffLine,
  placeGlanceLine,
  pressureSentence,
  rankEscalations,
  stationGlanceLine,
  isPrimaryNeedsYouAction,
  paymentOpenTableLabel,
} from './operate-glance';

test('escalations: open and oldest first', () => {
  const ranked = rankEscalations([
    { status: 'acknowledged', createdAt: '2026-08-19T10:00:00.000Z' },
    { status: 'open', createdAt: '2026-08-19T10:05:00.000Z' },
    { status: 'open', createdAt: '2026-08-19T09:00:00.000Z' },
  ]);
  assert.equal(ranked[0].createdAt, '2026-08-19T09:00:00.000Z');
  assert.equal(ranked[1].createdAt, '2026-08-19T10:05:00.000Z');
  assert.equal(ranked[2].status, 'acknowledged');
});

test('Needs you gold: payment row can be primary Open table', () => {
  const rows = [
    { id: 'pay1', kind: 'payment', status: 'failed' },
    { id: 'mgr1', kind: 'manager', status: 'open' },
  ];
  assert.equal(isPrimaryNeedsYouAction(rows, rows[0]), true);
  assert.equal(isPrimaryNeedsYouAction(rows, rows[1]), false);
});

test('Needs you gold: open manager Claim beats later payment', () => {
  const rows = [
    { id: 'mgr1', kind: 'manager', status: 'open' },
    { id: 'pay1', kind: 'payment', status: 'failed' },
  ];
  assert.equal(isPrimaryNeedsYouAction(rows, rows[0]), true);
  assert.equal(isPrimaryNeedsYouAction(rows, rows[1]), false);
});

test('Open table label uses place noun calmly', () => {
  assert.equal(paymentOpenTableLabel('Table'), 'Open table');
  assert.equal(paymentOpenTableLabel('Room'), 'Open room');
});

test('place lines match craft anatomy', () => {
  assert.equal(placeGlanceLine('attention'), 'Needs you');
  assert.equal(placeGlanceLine('ready'), 'Ready');
  assert.equal(placeGlanceLine('prep', 'Making'), 'Making');
  assert.equal(placeGlanceLine('calm'), 'Calm');
});

test('station lines are plain language', () => {
  assert.equal(
    stationGlanceLine('Kitchen', { waiting: 2, preparing: 0, ready: 0 }).line,
    'Kitchen has 2 tickets waiting',
  );
  assert.equal(
    stationGlanceLine('Bar', { waiting: 0, preparing: 1, ready: 0 }).line,
    'Bar is preparing now',
  );
  assert.equal(
    stationGlanceLine('Counter', { waiting: 0, preparing: 0, ready: 3 }).line,
    'Counter has 3 ready for the floor',
  );
});

test('pressure names places without analytics', () => {
  const line = pressureSentence(
    [
      { placeCode: '4', tone: 'attention' },
      { placeCode: '8', tone: 'prep' },
    ],
    'Table',
  );
  assert.equal(line, 'Pressure rising at Table 4 and Table 8.');
  assert.equal(pressureSentence([{ placeCode: '1', tone: 'attention' }], 'Table'), null);
});

test('handoff and next hint stay overview-only', () => {
  assert.match(operateHandoffLine(), /Staff Experience/);
  assert.equal(nextOwnerHint('Table 12', 'Kitchen', null), 'Claim Table 12 first.');
  assert.equal(nextOwnerHint(null, 'Kitchen', 'Table 4'), 'Continue in Staff · Kitchen.');
});
