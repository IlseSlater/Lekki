import assert from 'node:assert/strict';
import test from 'node:test';
import { composeGrowBreath, growUsesToday } from './grow-breath';

const restaurant = {
  placePlural: 'Tables',
  station: 'Kitchen',
  participant: 'Guest',
  transaction: 'Order',
};

const cafe = {
  placePlural: 'Pickup / stands',
  station: 'Barista',
  participant: 'Guest',
  transaction: 'Order',
};

const hotel = {
  placePlural: 'Rooms',
  station: 'Housekeeping',
  participant: 'Guest',
  transaction: 'Request',
};

test('story window prefers today when guests arrived today', () => {
  assert.equal(
    growUsesToday({ guestsToday: 12, guestsYesterday: 40, takingsToday: 0 }),
    true,
  );
});

test('story window uses yesterday when today is quiet', () => {
  assert.equal(
    growUsesToday({ guestsToday: 0, guestsYesterday: 18, takingsToday: 0 }),
    false,
  );
});

test('one breath: wait matches today; healthy payments stay silent', () => {
  const breath = composeGrowBreath({
    guestsToday: 42,
    guestsYesterday: 10,
    takingsToday: 12400,
    takingsYesterday: 8000,
    currency: 'ZAR',
    popularLabel: 'Burger',
    waitToday: 6,
    waitYesterday: 14,
    paymentsStatus: 'healthy',
    hasMemory: true,
    hour: 19,
    venue: 'Blue Door',
    nouns: restaurant,
  });
  assert.equal(breath.welcomeLine, 'You welcomed 42 guests today.');
  assert.match(breath.tradingLine, /Tonight you took R.?12.?400/);
  assert.equal(breath.favouriteLine, 'Most guests ordered the Burger.');
  assert.equal(breath.waitLine, '6 minutes');
  assert.equal(breath.showWait, true);
  assert.equal(breath.healthLine, '');
  assert.equal(breath.delightLine, 'Guests were delighted.');
  assert.equal(breath.suggestion.includes('floor'), false);
});

test('café never says Tables or floor', () => {
  const breath = composeGrowBreath({
    guestsToday: 8,
    guestsYesterday: 0,
    takingsToday: 900,
    takingsYesterday: 0,
    currency: 'ZAR',
    popularLabel: 'Flat white',
    waitToday: 12,
    waitYesterday: null,
    paymentsStatus: 'healthy',
    hasMemory: true,
    hour: 10,
    venue: 'Harbor Roast',
    nouns: cafe,
  });
  const blob = `${breath.welcomeLine} ${breath.suggestion} ${breath.favouriteLine}`;
  assert.match(blob, /barista/i);
  assert.doesNotMatch(blob, /\bTables\b/);
  assert.doesNotMatch(blob, /\bfloor\b/i);
});

test('hotel slow wait suggests housekeeping, not floor', () => {
  const breath = composeGrowBreath({
    guestsToday: 6,
    guestsYesterday: 2,
    takingsToday: 0,
    takingsYesterday: 0,
    currency: 'ZAR',
    popularLabel: 'Towels',
    waitToday: 12,
    waitYesterday: 4,
    paymentsStatus: 'healthy',
    hasMemory: true,
    hour: 14,
    venue: 'Coastal Lodge',
    nouns: hotel,
  });
  assert.equal(breath.waitLine, '12 minutes');
  assert.match(breath.suggestion, /housekeeping/);
  assert.doesNotMatch(breath.suggestion, /\bfloor\b/i);
  assert.match(breath.favouriteLine, /requested/);
});

test('payments setup is the only health line', () => {
  const breath = composeGrowBreath({
    guestsToday: 3,
    guestsYesterday: 0,
    takingsToday: 0,
    takingsYesterday: 0,
    currency: 'ZAR',
    popularLabel: null,
    waitToday: null,
    waitYesterday: null,
    paymentsStatus: 'setup',
    hasMemory: true,
    hour: 11,
    venue: 'Blue Door',
    nouns: restaurant,
  });
  assert.equal(breath.showWait, false);
  assert.equal(breath.healthLine, 'Payments still to finish.');
  assert.equal(breath.suggestion, 'Finish payments when you have a quiet moment.');
});
