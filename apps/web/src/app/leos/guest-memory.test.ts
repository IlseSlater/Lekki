import assert from 'node:assert/strict';
import test from 'node:test';
import {
  NO_MEMORY,
  cleanAllergies,
  lastTimeLine,
  notesWithAllergies,
  readMemory,
  rememberedDishes,
} from './guest-memory';

test('allergies read as one tidy line', () => {
  assert.equal(cleanAllergies(' gluten;dairy ,, nuts\n'), 'gluten, dairy, nuts');
  assert.equal(cleanAllergies('<b>peanut</b>'), 'bpeanut/b');
  assert.equal(cleanAllergies(42), '');
  assert.ok(cleanAllergies('x'.repeat(200)).length <= 80);
});

test('the last order keeps the first three different dishes', () => {
  assert.deepEqual(
    rememberedDishes([{ label: 'Burger' }, { label: 'Burger' }, { label: 'Flat white' }, { label: 'Cake' }, { label: 'Tea' }]),
    ['Burger', 'Flat white', 'Cake'],
  );
});

test('last time appears only at the same place', () => {
  const m = { ...NO_MEMORY, lastVenueLabel: 'Lekki Cafe', lastOrder: ['Burger', 'Flat white'] };
  assert.equal(lastTimeLine(m, 'lekki cafe'), 'Last time: Burger, Flat white');
  assert.equal(lastTimeLine(m, 'Other Place'), '');
  assert.equal(lastTimeLine(NO_MEMORY, 'Lekki Cafe'), '');
});

test('allergies ride on every line without repeating', () => {
  assert.equal(notesWithAllergies(undefined, 'gluten'), 'Allergies: gluten');
  assert.equal(notesWithAllergies('no onion', 'gluten'), 'no onion · Allergies: gluten');
  assert.equal(notesWithAllergies('Allergies: gluten', 'gluten'), 'Allergies: gluten');
  assert.equal(notesWithAllergies('  ', ''), undefined);
  assert.equal(notesWithAllergies('no onion', ''), 'no onion');
});

test('stored memory is read defensively', () => {
  assert.deepEqual(readMemory(null), NO_MEMORY);
  assert.deepEqual(readMemory({ allergies: 'dairy', lastOrder: ['A', 3, 'B'], lastVenueLabel: ' X ' }), {
    allergies: 'dairy',
    lastVenueLabel: 'X',
    lastOrder: ['A', 'B'],
  });
});
