import assert from 'node:assert/strict';
import test from 'node:test';
import {
  guestPlaceSpoken,
  openTabIdentity,
  openTabPlaceParity,
  staffPlaceLabel,
} from './place-continuity';

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

test('open-tab identity speaks venue + place for shell band', () => {
  const id = openTabIdentity({
    venueName: 'Blue Door',
    placeNoun: 'Table',
    placeCode: '12',
  });
  assert.equal(id.venueName, 'Blue Door');
  assert.equal(id.placeSpoken, 'Table 12');
});

test('open-tab identity stays quiet when place code missing', () => {
  const id = openTabIdentity({
    venueName: 'Blue Door',
    placeNoun: 'Table',
    placeCode: '',
  });
  assert.equal(id.placeSpoken, '');
});

test('Live and Guest place lines match (parity)', () => {
  const guest = guestPlaceSpoken('Table', '12');
  const live = guestPlaceSpoken('Table', '12');
  assert.equal(openTabPlaceParity(guest, live), true);
  assert.equal(openTabPlaceParity(guest, '12'), false);
  assert.equal(openTabPlaceParity(guest, 'Blue Door · 12'), false);
});
