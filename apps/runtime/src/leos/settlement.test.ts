import assert from 'node:assert/strict';
import test from 'node:test';
import { equalShareState } from '@lekki/domain';
import { addMinor, fromMinor, isFullyPaid, toMinor } from './money';

test('equal share: five duplicate names collapse to one guest', () => {
  const guests = [1, 2, 3, 4, 5].map((n) => ({
    id: `part_${n}`,
    displayName: 'Ilse',
    role: 'guest' as const,
  }));
  const solo = equalShareState(guests, new Set(), 'part_5');
  assert.equal(solo.distinct, 1);
});

test('equal share: two distinct guests split R125', () => {
  const guests = [
    { id: 'part_1', displayName: 'Ilse', role: 'guest' as const },
    { id: 'part_2', displayName: 'Sam', role: 'guest' as const },
  ];
  const split = equalShareState(guests, new Set(), 'part_1');
  assert.equal(split.distinct, 2);
  assert.equal(split.unpaid, 2);
  const shareMinor = Math.round(toMinor(125) / split.unpaid);
  assert.equal(fromMinor(shareMinor), 62.5);
});

test('settlement across multiple payments sums to total', () => {
  const totalMinor = toMinor(350);
  const p1 = toMinor(150);
  const p2 = toMinor(200);
  assert.equal(isFullyPaid(totalMinor, addMinor(p1, p2)), true);
});

test('visit payment amount stays in major units across two transactions', () => {
  const txTotals = [45, 35];
  const sessionTotalMinor = addMinor(...txTotals);
  const amount = fromMinor(sessionTotalMinor);
  assert.equal(amount, 80);
  assert.notEqual(amount, sessionTotalMinor);
});
