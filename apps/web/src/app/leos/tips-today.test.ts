import assert from 'node:assert/strict';
import test from 'node:test';
import { formatTipMinor, myTipsLine, teamTipFor } from './tips-today';

test('rand and cents read plainly', () => {
  assert.equal(formatTipMinor(5000), 'R50');
  assert.equal(formatTipMinor(1230), 'R12.30');
  assert.equal(formatTipMinor(1234500), 'R12 345');
  assert.equal(formatTipMinor(5), 'R0.05');
  assert.equal(formatTipMinor(-3), 'R0');
});

test('the waiter line is empty until there is a tip', () => {
  assert.equal(myTipsLine(0, 0), '');
  assert.equal(myTipsLine(2500, 1), 'R25 in tips this shift · 1 tip');
  assert.equal(myTipsLine(7550, 3), 'R75.50 in tips this shift · 3 tips');
});

test('Team shows each person’s tips and stays quiet for others', () => {
  const rows = [{ waiterId: 'a', name: 'Thandi', tipMinor: 4000, count: 2 }];
  assert.equal(teamTipFor(rows, 'a'), 'R40 in tips');
  assert.equal(teamTipFor(rows, 'b'), '');
});
