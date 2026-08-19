import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextOwnerHint,
  operateHandoffLine,
  placeGlanceLine,
  pressureSentence,
  rankEscalations,
  stationGlanceLine,
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
