import assert from 'node:assert/strict';
import test from 'node:test';
import { shiftStart, tipsByWaiter, type TipPayment } from './tip-shift';

const at = (iso: string) => new Date(iso);
const pay = (over: Partial<TipPayment>): TipPayment => ({
  status: 'completed',
  tipAmount: 10,
  tipWaiterId: 'w1',
  tipWaiterName: 'Thandi',
  createdAt: at('2026-11-26T18:00:00'),
  ...over,
});

test('tips add up per waiter in minor units, biggest first', () => {
  const rows = tipsByWaiter(
    [
      pay({ tipAmount: 10.1 }),
      pay({ tipAmount: 20.2 }),
      pay({ tipWaiterId: 'w2', tipWaiterName: 'Sipho', tipAmount: 50 }),
    ],
    at('2026-11-26T04:00:00'),
  );
  assert.deepEqual(
    rows.map((r) => [r.name, r.tipMinor, r.count]),
    [
      ['Sipho', 5000, 1],
      ['Thandi', 3030, 2],
    ],
  );
});

test('only paid tips from this shift with a waiter count', () => {
  const rows = tipsByWaiter(
    [
      pay({ status: 'pending' }),
      pay({ status: 'failed' }),
      pay({ tipWaiterId: null }),
      pay({ tipAmount: 0 }),
      pay({ createdAt: at('2026-11-25T20:00:00') }),
      pay({ tipAmount: 5 }),
    ],
    at('2026-11-26T04:00:00'),
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.tipMinor, 500);
});

test('a late night stays one shift', () => {
  assert.equal(shiftStart(at('2026-11-27T01:30:00')).getDate(), 26);
  assert.equal(shiftStart(at('2026-11-27T01:30:00')).getHours(), 4);
  assert.equal(shiftStart(at('2026-11-26T12:00:00')).getDate(), 26);
});
