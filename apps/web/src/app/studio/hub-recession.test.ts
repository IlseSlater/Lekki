import assert from 'node:assert/strict';
import test from 'node:test';
import { recessedGateLine } from './hub-recession';

test('live gate recedes to Open · area · count · station', () => {
  assert.equal(
    recessedGateLine({ area: 'Main', placeCount: 12, placeNoun: 'Table', station: 'Kitchen' }),
    'Open · Main · 12 tables · Kitchen',
  );
});

test('one place keeps the singular noun', () => {
  assert.equal(
    recessedGateLine({ area: 'Patio', placeCount: 1, placeNoun: 'Table', station: 'Bar' }),
    'Open · Patio · 1 table · Bar',
  );
});

test('missing area, station, or places refuses the line', () => {
  assert.equal(
    recessedGateLine({ area: '', placeCount: 12, placeNoun: 'Table', station: 'Kitchen' }),
    null,
  );
  assert.equal(
    recessedGateLine({ area: 'Main', placeCount: 0, placeNoun: 'Table', station: 'Kitchen' }),
    null,
  );
});
