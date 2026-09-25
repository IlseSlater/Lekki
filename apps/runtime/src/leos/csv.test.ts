import assert from 'node:assert/strict';
import test from 'node:test';
import { toCsv } from './csv';

test('plain rows join with CRLF, no quoting needed', () => {
  const csv = toCsv(
    [{ date: '2026-09-01', item: 'Burger', qty: 2 }],
    [
      { key: 'date', header: 'Date' },
      { key: 'item', header: 'Item' },
      { key: 'qty', header: 'Qty' },
    ],
  );
  assert.equal(csv, 'Date,Item,Qty\r\n2026-09-01,Burger,2');
});

test('a value containing a comma gets quoted', () => {
  const csv = toCsv(
    [{ item: 'Burger, extra cheese' }],
    [{ key: 'item', header: 'Item' }],
  );
  assert.equal(csv, 'Item\r\n"Burger, extra cheese"');
});

test('an embedded quote is doubled', () => {
  const csv = toCsv([{ item: 'The "Deluxe" Burger' }], [{ key: 'item', header: 'Item' }]);
  assert.equal(csv, 'Item\r\n"The ""Deluxe"" Burger"');
});

test('a newline in a value gets quoted', () => {
  const csv = toCsv([{ note: 'line one\nline two' }], [{ key: 'note', header: 'Note' }]);
  assert.equal(csv, 'Note\r\n"line one\nline two"');
});

test('empty row set still emits the header', () => {
  const csv = toCsv([], [{ key: 'item', header: 'Item' }]);
  assert.equal(csv, 'Item');
});
