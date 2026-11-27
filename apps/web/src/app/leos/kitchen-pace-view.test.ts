import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NO_PACE,
  applyMenuHours,
  canOrderNow,
  heldLabel,
  pausedLine,
  readGuestPace,
  waitLine,
  withBusy,
  withHours,
} from './kitchen-pace-view';

const items = [
  { id: '1', category: 'Breakfast' },
  { id: '2', category: 'Mains' },
];

test('a category outside its hours leaves the menu', () => {
  const pace = { ...NO_PACE, hiddenCategories: ['Breakfast'] };
  assert.deepEqual(applyMenuHours(items, pace).map((i) => i.id), ['2']);
  assert.equal(applyMenuHours(items, NO_PACE).length, 2);
});

test('ordering stops when paused or when the category is closed', () => {
  assert.equal(canOrderNow(NO_PACE, 'Mains'), true);
  assert.equal(canOrderNow({ ...NO_PACE, paused: true }, 'Mains'), false);
  assert.equal(canOrderNow({ ...NO_PACE, hiddenCategories: ['Mains'] }, 'Mains'), false);
});

test('pause tells the guest they can still pay', () => {
  assert.match(pausedLine({ ...NO_PACE, paused: true }), /still see and pay/);
  assert.equal(pausedLine(NO_PACE), '');
});

test('the wait reads as a short line', () => {
  assert.equal(waitLine({ ...NO_PACE, busyNotes: ['Mains about 25 min'] }), 'Mains about 25 min');
  assert.equal(
    waitLine({ ...NO_PACE, busyNotes: ['Mains about 25 min', 'Starters about 10 min'] }),
    'Mains about 25 min · Starters about 10 min',
  );
  assert.equal(waitLine(NO_PACE), '');
});

test('a held round says so', () => {
  assert.equal(heldLabel('held', true), 'Held — sent together');
  assert.equal(heldLabel('pending', true), null);
});

test('the server answer is read defensively', () => {
  assert.deepEqual(readGuestPace(null), NO_PACE);
  assert.deepEqual(readGuestPace({ paused: true, hiddenCategories: ['A', 3], busyNotes: 'x' }), {
    paused: true,
    holdRounds: false,
    hiddenCategories: ['A'],
    busyNotes: [],
  });
});

const base = { paused: false, holdRounds: false, categoryHours: {}, busyMinutes: {} };

test('hours need both times', () => {
  const on = withHours(base, 'Breakfast', '06:00', '11:00');
  assert.deepEqual(on.categoryHours, { Breakfast: { from: '06:00', to: '11:00' } });
  assert.deepEqual(withHours(on, 'Breakfast', '06:00', '').categoryHours, {});
  assert.deepEqual(withHours(base, 'X', '6am', '11:00').categoryHours, {});
});

test('busy minutes clear when empty', () => {
  const on = withBusy(base, 'Mains', 25);
  assert.deepEqual(on.busyMinutes, { Mains: 25 });
  assert.deepEqual(withBusy(on, 'Mains', null).busyMinutes, {});
  assert.deepEqual(withBusy(base, 'Mains', 999).busyMinutes, {});
});
