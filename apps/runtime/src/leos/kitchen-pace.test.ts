import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PACE,
  OrderRefusedError,
  busyNotes,
  categoryOpen,
  guestPaceView,
  hiddenCategories,
  initialFulfilmentStatus,
  minutesOnVenueClock,
  normalisePace,
  orderRefusal,
  orderRefusalMessage,
} from './kitchen-pace';

const lunch = normalisePace({
  categoryHours: { Breakfast: { from: '06:00', to: '11:00' }, Late: { from: '22:00', to: '02:00' } },
  busyMinutes: { Mains: 25, Starters: 10 },
});
const at = (h: number, m = 0) => h * 60 + m;

test('settings keep only clean values', () => {
  const p = normalisePace({
    paused: 'yes',
    holdRounds: true,
    categoryHours: { Bad: { from: '25:00', to: '10:00' }, Ok: { from: '08:00', to: '10:30' }, '': { from: '08:00', to: '09:00' } },
    busyMinutes: { Mains: 999, Zero: 0, Neg: -4, Text: 'x' },
  });
  assert.equal(p.paused, false);
  assert.equal(p.holdRounds, true);
  assert.deepEqual(Object.keys(p.categoryHours), ['Ok']);
  assert.deepEqual(p.busyMinutes, { Mains: 180 });
  assert.deepEqual(normalisePace(null), DEFAULT_PACE);
});

test('a category outside its window is hidden', () => {
  assert.equal(categoryOpen(lunch, 'Breakfast', at(9)), true);
  assert.equal(categoryOpen(lunch, 'Breakfast', at(11)), false);
  assert.equal(categoryOpen(lunch, 'Mains', at(3)), true);
  assert.deepEqual(hiddenCategories(lunch, ['Breakfast', 'Mains', 'Breakfast'], at(14)), ['Breakfast']);
});

test('a window that crosses midnight works', () => {
  assert.equal(categoryOpen(lunch, 'Late', at(23)), true);
  assert.equal(categoryOpen(lunch, 'Late', at(1)), true);
  assert.equal(categoryOpen(lunch, 'Late', at(12)), false);
});

test('the venue clock decides, not the server clock', () => {
  const utcNoon = new Date('2026-11-26T12:00:00Z');
  assert.equal(minutesOnVenueClock(utcNoon, 'Africa/Johannesburg'), at(14));
  assert.equal(minutesOnVenueClock(utcNoon, 'UTC'), at(12));
});

test('busy minutes read as a short phrase for what is being made', () => {
  assert.deepEqual(busyNotes(lunch, ['Mains', 'Starters', 'Mains', 'Drinks']), [
    'Mains about 25 min',
    'Starters about 10 min',
  ]);
  assert.deepEqual(busyNotes(lunch, ['Drinks']), []);
});

test('paused refuses everything, closed hours refuse that category', () => {
  assert.deepEqual(orderRefusal({ ...lunch, paused: true }, ['Mains'], at(12)), { reason: 'paused' });
  assert.deepEqual(orderRefusal(lunch, ['Mains', 'Breakfast'], at(14)), {
    reason: 'out_of_hours',
    category: 'Breakfast',
  });
  assert.equal(orderRefusal(lunch, ['Mains'], at(14)), null);
  assert.match(orderRefusalMessage({ reason: 'out_of_hours', category: 'Breakfast' }), /Breakfast is not being served/);
  assert.match(new OrderRefusedError({ reason: 'paused' }).message, /catching up/);
});

test('held rounds wait for the waiter', () => {
  assert.equal(initialFulfilmentStatus({ ...DEFAULT_PACE, holdRounds: true }, 'pending'), 'held');
  assert.equal(initialFulfilmentStatus(DEFAULT_PACE, 'pending'), 'pending');
});

test('the guest sees only what changes their menu and their wait', () => {
  const view = guestPaceView(
    { ...lunch, paused: true, holdRounds: true },
    { allCategories: ['Breakfast', 'Mains'], openCategories: ['Mains'], minutes: at(14) },
  );
  assert.deepEqual(view, {
    paused: true,
    holdRounds: true,
    hiddenCategories: ['Breakfast'],
    busyNotes: ['Mains about 25 min'],
  });
});
