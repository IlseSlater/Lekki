import assert from 'node:assert/strict';
import test from 'node:test';
import { guestPlaceSpoken, staffPlaceLabel } from './place-continuity';

test('kitchen label matches guest place code', () => {
  assert.equal(staffPlaceLabel('Table', '1'), 'Table 1');
  assert.equal(staffPlaceLabel('Table', 'T1'), 'Table T1');
});

test('does not double the place noun', () => {
  assert.equal(staffPlaceLabel('Table', 'Table 12'), 'Table 12');
});

test('missing code stays calm place noun only', () => {
  assert.equal(staffPlaceLabel('Table', null), 'Table');
  assert.equal(staffPlaceLabel('Table', ''), 'Table');
});

test('guest place hero is quiet without a code', () => {
  assert.equal(guestPlaceSpoken('Table', null), '');
  assert.equal(guestPlaceSpoken('Table', '  '), '');
  assert.equal(guestPlaceSpoken('Table', '1'), 'Table 1');
});
