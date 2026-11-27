import assert from 'node:assert/strict';
import test from 'node:test';
import { RECEIPT_CHAR_BUDGET, receiptText, whatsappReceiptUrl } from './receipt-text';

const when = new Date('2026-11-26T12:00:00Z');

test('the receipt lists lines and what was paid', () => {
  const t = receiptText({
    place: 'Lekki Cafe',
    lines: [{ quantity: 2, label: 'Burger', total: 240 }],
    paid: 240,
    currency: 'ZAR',
    when,
  });
  assert.match(t, /^Your receipt from Lekki Cafe/);
  assert.match(t, /2\u00d7 Burger \u2014 /);
  assert.match(t, /Paid /);
  assert.match(t, /Thank you\.$/);
});

test('nothing paid shows no paid line and no invented total', () => {
  const t = receiptText({ place: '', lines: [], paid: 0, currency: 'ZAR', when });
  assert.ok(!t.includes('Paid'));
  assert.ok(t.startsWith('Your receipt\n'));
});

test('empty lines are skipped', () => {
  const t = receiptText({
    place: 'X',
    lines: [{ quantity: 0, label: 'Ghost', total: 0 }, { quantity: 1, label: ' ', total: 5 }],
    paid: 0,
    currency: 'ZAR',
    when,
  });
  assert.ok(!t.includes('Ghost'));
});

test('the link opens WhatsApp with the text encoded', () => {
  const url = whatsappReceiptUrl('Hello there');
  assert.equal(url, 'https://wa.me/?text=Hello%20there');
});

test('a big check keeps the amount paid and says how many lines are left out', () => {
  const lines = Array.from({ length: 80 }, (_, i) => ({
    quantity: 1,
    label: `Dish number ${i + 1} with a long name that keeps going`,
    total: 10 + i,
  }));
  const t = receiptText({ place: 'Lekki Cafe', lines, paid: 5000, currency: 'ZAR', when });
  assert.ok(t.length <= RECEIPT_CHAR_BUDGET, `length ${t.length}`);
  assert.match(t, /\u2026and \d+ more/);
  assert.match(t, /Paid /);
  assert.match(t, /Thank you\.$/);
  assert.ok(t.startsWith('Your receipt from Lekki Cafe'));
});

test('a small check shows every line', () => {
  const t = receiptText({
    place: 'X',
    lines: [{ quantity: 1, label: 'A', total: 1 }, { quantity: 2, label: 'B', total: 4 }],
    paid: 5,
    currency: 'ZAR',
    when,
  });
  assert.ok(!t.includes('more'));
  assert.match(t, /1\u00d7 A/);
  assert.match(t, /2\u00d7 B/);
});
