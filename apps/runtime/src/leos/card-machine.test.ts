import assert from 'node:assert/strict';
import test from 'node:test';
import { cardMachinePlan } from './card-machine';

test('card machine: empty amount takes everything that is left', () => {
  assert.deepEqual(cardMachinePlan({ billMinor: 93600, paidMinor: 30000 }), {
    baseMinor: 63600,
    tipMinor: 0,
  });
});

test('card machine: an amount and a tip taken on the machine', () => {
  assert.deepEqual(cardMachinePlan({ billMinor: 93600, paidMinor: 0, amount: 300, tipAmount: 30 }), {
    baseMinor: 30000,
    tipMinor: 3000,
  });
});

test('card machine: never more than is left, never on a settled table', () => {
  assert.deepEqual(cardMachinePlan({ billMinor: 50000, paidMinor: 40000, amount: 200 }), {
    refusal: 'Only R 100.00 is left on this table.',
  });
  assert.deepEqual(cardMachinePlan({ billMinor: 50000, paidMinor: 50000 }), {
    refusal: 'This table has nothing left to pay.',
  });
  assert.ok('refusal' in cardMachinePlan({ billMinor: 50000, paidMinor: 0, amount: -5 }));
  assert.ok('refusal' in cardMachinePlan({ billMinor: 50000, paidMinor: 0, amount: 10, tipAmount: -1 }));
});
