import assert from 'node:assert/strict';
import test from 'node:test';
import { equalShares, noteWithStars, tipChipLabel, tipPercentsFrom } from './pay-choices';
import { CANCEL_REASONS, DELAY_CHOICES, cancelReady, pausedLine, soldOutLabel } from '../studio/order-actions';
import {
  CANCEL_REASONS as SERVER_CANCEL_REASONS,
  DELAY_CHOICES as SERVER_DELAY_CHOICES,
} from '../../../../runtime/src/leos/order-log';

test('A3: equal shares — people at the table and shares I cover', () => {
  // R 936 bill, 3 people, I cover 1 share.
  assert.deepEqual(equalShares({ billTotal: 936, remaining: 936, people: 3, shares: 1 }), {
    people: 3,
    shares: 1,
    perShare: 312,
    amount: 312,
    capped: false,
  });
  // I cover my partner too.
  assert.equal(equalShares({ billTotal: 936, remaining: 936, people: 3, shares: 2 }).amount, 624);
  // Odd cents: three shares of R 100 add up to R 100, not R 99.99.
  const parts = [1, 1, 1].map(() => equalShares({ billTotal: 100, remaining: 100, people: 3, shares: 1 }).amount);
  assert.equal(parts[0], 33.33);
  assert.equal(equalShares({ billTotal: 100, remaining: 100, people: 3, shares: 3 }).amount, 100);
  // Never more than is left.
  const capped = equalShares({ billTotal: 936, remaining: 200, people: 3, shares: 1 });
  assert.equal(capped.amount, 200);
  assert.equal(capped.capped, true);
  // Shares can't exceed people; people at least 1.
  assert.equal(equalShares({ billTotal: 90, remaining: 90, people: 0, shares: 5 }).shares, 1);
});

test('A4: the venue picks the tip percents; each chip shows its value', () => {
  assert.deepEqual(tipPercentsFrom(null), [10, 12.5, 15]);
  assert.deepEqual(tipPercentsFrom({ tipPercents: [15, 10, 10, 'x', 0, 99] }), [10, 15]);
  assert.deepEqual(tipPercentsFrom({ tipPercents: '5, 7.5 10' }), [5, 7.5, 10]);
  assert.deepEqual(tipPercentsFrom({ tipPercents: [] }), [10, 12.5, 15]);
  assert.equal(tipChipLabel(10, 328), '10% · R 32.80');
  assert.equal(tipChipLabel(12.5, 300), '12.5% · R 37.50');
  assert.equal(tipChipLabel(0, 300), 'No tip');
});

test('A6: stars ride with the private note', () => {
  assert.equal(noteWithStars(4, 5, 'Lovely'), 'Food 4/5 · Service 5/5 — Lovely');
  assert.equal(noteWithStars(0, 3, ''), 'Service 3/5');
  assert.equal(noteWithStars(9, 'x', 'Just words'), 'Just words');
});

test('A13, A15: staff choices match the server exactly', () => {
  assert.deepEqual([...DELAY_CHOICES], [...SERVER_DELAY_CHOICES]);
  assert.deepEqual([...CANCEL_REASONS], [...SERVER_CANCEL_REASONS]);
  assert.equal(cancelReady('', ''), false);
  assert.equal(cancelReady('Other', '  '), false);
  assert.equal(cancelReady('Other', 'Wrong table'), true);
  assert.equal(cancelReady('Item ran out', ''), true);
});

test('A10, A12: pause and sold-out lines', () => {
  assert.equal(pausedLine({ paused: false }), '');
  assert.equal(pausedLine({ paused: true, pausedUntil: null }), 'New orders paused until you reopen');
  assert.equal(
    pausedLine({ paused: true, pausedUntil: '2026-11-27T17:40:00Z' }, 'Africa/Johannesburg'),
    'New orders paused until 19:40',
  );
  assert.equal(soldOutLabel({ available: false, soldOutUntil: 'tomorrow' }), 'Off today · back tomorrow');
  assert.equal(soldOutLabel({ available: false, soldOutUntil: 'changed' }), 'Off until you turn it back on');
  assert.equal(soldOutLabel({ available: true }), '');
});
