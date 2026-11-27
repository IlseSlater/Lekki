import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NothingLeftToPayError,
  applyTipToBase,
  assertRemainingToPay,
  remainingVisitMinor,
  tipMinorOnServerBase,
  visitFullyPaid,
} from './payment-invariants';
import { addMinor, fromMinor, toMinor } from './money';

test('row 8: settled visit has nothing left to pay', () => {
  const sessionTotal = toMinor(350);
  const paid = toMinor(350);
  assert.equal(visitFullyPaid(sessionTotal, paid), true);
  assert.equal(remainingVisitMinor(sessionTotal, paid), 0);
  assert.throws(() => assertRemainingToPay(0), NothingLeftToPayError);
});

test('row 8: second charge on a settled bill is refused', () => {
  const sessionTotal = addMinor(200, 150);
  const first = remainingVisitMinor(sessionTotal, 0);
  assert.equal(fromMinor(first), 350);
  assertRemainingToPay(first);
  const afterFirst = remainingVisitMinor(sessionTotal, first);
  assert.throws(() => assertRemainingToPay(afterFirst), /Nothing left to pay/);
});

test('row 4: 15% tip is computed on the server visit base, not a client subtotal', () => {
  const visitBase = addMinor(200, 150);
  const tipMinor = tipMinorOnServerBase(visitBase, 15);
  assert.equal(fromMinor(tipMinor), 52.5);
  const clientSubtotal = toMinor(150);
  const wrongClientTip = tipMinorOnServerBase(clientSubtotal, 15);
  assert.notEqual(wrongClientTip, tipMinor);
  const charged = applyTipToBase(visitBase, { tipPercent: 15 });
  assert.equal(fromMinor(charged.chargeMinor), 402.5);
  const ifServerTrustedClientAmount = applyTipToBase(visitBase, {
    tipAmount: fromMinor(wrongClientTip),
  });
  assert.notEqual(ifServerTrustedClientAmount.tipMinor, tipMinor);
});

test('row 4: tipPercent wins over a client tipAmount on the same request', () => {
  const visitBase = toMinor(350);
  const charged = applyTipToBase(visitBase, { tipPercent: 15, tipAmount: 22.5 });
  assert.equal(fromMinor(charged.tipMinor), 52.5);
});

test('custom amount: inside what is left, decrements it, closes only at zero', async () => {
  const { customAmountBaseMinor } = await import('./payment-invariants');
  const bill = toMinor(400);
  const first = customAmountBaseMinor(150, remainingVisitMinor(bill, 0));
  assert.equal(first, 15000);
  const left = remainingVisitMinor(bill, first);
  assert.equal(fromMinor(left), 250);
  assert.equal(visitFullyPaid(bill, first), false);
  const rest = customAmountBaseMinor(250, left);
  assert.equal(visitFullyPaid(bill, first + rest), true);
});

test('custom amount: more than what is left is refused', async () => {
  const { customAmountBaseMinor, CustomAmountError } = await import('./payment-invariants');
  assert.throws(() => customAmountBaseMinor(500.01, toMinor(500)), CustomAmountError);
});

test('custom amount: zero, negative, and non-numbers are refused', async () => {
  const { customAmountBaseMinor, CustomAmountError } = await import('./payment-invariants');
  for (const bad of [0, -5, 'abc', NaN, undefined, null]) {
    assert.throws(() => customAmountBaseMinor(bad, toMinor(100)), CustomAmountError);
  }
});

test('custom amount: below the PayFast floor is refused unless it is all that is left', async () => {
  const { customAmountBaseMinor, CustomAmountError } = await import('./payment-invariants');
  assert.throws(() => customAmountBaseMinor(2, toMinor(100)), CustomAmountError);
  assert.equal(customAmountBaseMinor(3.5, toMinor(3.5)), 350);
});

test('custom amount: cents are rounded to whole minor units', async () => {
  const { customAmountBaseMinor } = await import('./payment-invariants');
  assert.equal(customAmountBaseMinor(19.995, toMinor(100)), 2000);
});
