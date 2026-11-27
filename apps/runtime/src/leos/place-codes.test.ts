import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_PLACES_PER_VENUE,
  MAX_PLACE_CODE_LENGTH,
  missingPlaceCodes,
  normalisePlaceCodes,
} from './place-codes';

test('trims, collapses spaces, and drops empty or non-string entries', () => {
  assert.deepEqual(normalisePlaceCodes(['  Table   1 ', '', '   ', 7, null, 'Table 2']), [
    'Table 1',
    'Table 2',
  ]);
});

test('duplicates collapse regardless of case', () => {
  assert.deepEqual(normalisePlaceCodes(['Table 1', 'table 1', 'TABLE 1']), ['Table 1']);
});

test('non-arrays give nothing', () => {
  assert.deepEqual(normalisePlaceCodes('Table 1'), []);
  assert.deepEqual(normalisePlaceCodes(undefined), []);
});

test('long codes are cut and the list is capped', () => {
  const long = 'x'.repeat(200);
  assert.equal(normalisePlaceCodes([long])[0].length, MAX_PLACE_CODE_LENGTH);
  const many = Array.from({ length: MAX_PLACES_PER_VENUE + 50 }, (_, i) => `Table ${i + 1}`);
  assert.equal(normalisePlaceCodes(many).length, MAX_PLACES_PER_VENUE);
});

test('only codes the venue does not have yet are created', () => {
  assert.deepEqual(missingPlaceCodes(['Table 1', 'Table 2', 'Table 3'], ['table 1', 'Table 3']), [
    'Table 2',
  ]);
  assert.deepEqual(missingPlaceCodes([], ['Table 1']), []);
});
