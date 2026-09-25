import assert from 'node:assert/strict';
import test from 'node:test';
import { matchTwColour, twHex } from './tailwind-palette';
import { parseVenueArrival, withArrival } from './venue-arrival';

test('matchTwColour finds indigo 500', () => {
  const hit = matchTwColour('#6366f1');
  assert.equal(hit.family, 'indigo');
  assert.equal(hit.shade, 500);
  assert.equal(twHex('indigo', 500), '#6366f1');
});

test('parseVenueArrival never names Lekki', () => {
  const look = parseVenueArrival({
    venueName: 'Blue Door',
    brandColour: '#0ea5e9',
  });
  assert.equal(look.headline, 'Blue Door');
  assert.doesNotMatch(look.headline, /lekki/i);
  assert.doesNotMatch(look.cta, /lekki/i);
});

test('parseVenueArrival uses venue name and brand wash', () => {
  const look = parseVenueArrival({
    venueName: 'Blue Door',
    location: 'Waterfront',
    brandColour: '#0ea5e9',
    logoUrl: '/assets/mark.png',
  });
  assert.equal(look.headline, 'Blue Door');
  assert.equal(look.line, 'Waterfront');
  assert.equal(look.cta, 'Get started');
  assert.equal(look.background, '#0ea5e9');
  assert.ok(look.logos[0]?.includes('/assets/mark.png'));
});

test('parseVenueArrival speaks the place without repeating it as the line', () => {
  const look = parseVenueArrival({
    venueName: 'Blue Door',
    location: 'Table 12',
    placeSpoken: 'Table 12',
    brandColour: '#0ea5e9',
  });
  assert.equal(look.place, 'Table 12');
  assert.equal(look.line, '');
});

test('parseVenueArrival blends two colours and extra marks', () => {
  const look = parseVenueArrival({
    venueName: 'Blue Door',
    brandColour: '#0ea5e9',
    logoUrl: '/assets/a.png',
    guestDesign: withArrival(
      { browseMenu: true },
      {
        headline: 'Tonight at the door',
        blend: true,
        colourTo: '#312e81',
        marks: ['/assets/b.png'],
        cta: 'See the menu',
      },
    ),
  });
  assert.equal(look.headline, 'Tonight at the door');
  assert.equal(look.cta, 'See the menu');
  assert.match(look.background, /linear-gradient/);
  assert.equal(look.logos.length, 2);
});
