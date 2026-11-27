import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyPlaceCount,
  countNumberedPlaces,
  defaultPlaceSections,
  enabledPlaces,
  placeCodesFromSections,
} from './place-sections';

test('one number makes numbered tables 1…N', () => {
  const sections = applyPlaceCount(defaultPlaceSections('restaurant'), 'Table', 12);
  assert.equal(countNumberedPlaces(sections, 'Table'), 12);
  const codes = placeCodesFromSections(sections);
  assert.ok(codes.includes('Table 1'));
  assert.ok(codes.includes('Table 12'));
  assert.ok(!codes.includes('Table 13'));
  assert.ok(!codes.includes('Table 20'), 'old numbered tables are replaced, not kept beside the new ones');
});

test('named places stay when the count changes', () => {
  const sections = applyPlaceCount(defaultPlaceSections('restaurant'), 'Table', 3);
  const codes = placeCodesFromSections(sections);
  assert.ok(codes.includes('Bar Seat 1'));
  assert.ok(codes.includes('Bar Seat 2'));
  assert.equal(countNumberedPlaces(sections, 'Table'), 3);
});

test('the count is clamped to a sensible range', () => {
  assert.equal(countNumberedPlaces(applyPlaceCount([], 'Table', 0), 'Table'), 1);
  assert.equal(countNumberedPlaces(applyPlaceCount([], 'Table', 500), 'Table'), 60);
  assert.equal(countNumberedPlaces(applyPlaceCount([], 'Table', Number.NaN), 'Table'), 1);
});

test('no sections yet: one section holds the tables', () => {
  const sections = applyPlaceCount([], 'Table', 4);
  assert.equal(sections.length, 1);
  assert.equal(enabledPlaces(sections).length, 4);
});

test('changing the count twice gives the same codes as asking once', () => {
  const once = placeCodesFromSections(applyPlaceCount(defaultPlaceSections('restaurant'), 'Table', 6));
  const twice = placeCodesFromSections(
    applyPlaceCount(applyPlaceCount(defaultPlaceSections('restaurant'), 'Table', 20), 'Table', 6),
  );
  assert.deepEqual(twice, once);
});

test('sections left empty are dropped', () => {
  const sections = applyPlaceCount(
    [
      { id: 'a', name: 'Patio', places: [{ id: '1', label: 'Table 9', enabled: true }] },
      { id: 'b', name: 'Bar', places: [{ id: '2', label: 'Bar Seat 1', enabled: true }] },
    ],
    'Table',
    2,
  );
  assert.equal(sections.length, 2);
  assert.deepEqual(sections[0].places.map((p) => p.label), ['Table 1', 'Table 2']);
});
