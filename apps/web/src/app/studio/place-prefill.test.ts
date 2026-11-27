import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_BRAND_COLOUR, DEFAULT_LOCATION, isPlaceholderName, prefillPlace } from './place-prefill';

test('a true name is never replaced', () => {
  const r = prefillPlace({ activeName: 'Rusty Oak', serverName: 'Other' });
  assert.equal(r.venueName, 'Rusty Oak');
  assert.ok(!r.filled.includes('venueName'));
});

test('the registry placeholder is unknown, so the server name fills in', () => {
  const r = prefillPlace({ activeName: 'Your place', serverName: 'Blue Door' });
  assert.equal(r.venueName, 'Blue Door');
  assert.ok(r.filled.includes('venueName'));
});

test('placeholder on both sides stays empty so the owner types once', () => {
  const r = prefillPlace({ activeName: 'Your place', serverName: 'Your place' });
  assert.equal(r.venueName, '');
});

test('location falls back to server, then Johannesburg', () => {
  assert.equal(prefillPlace({ serverLocation: 'Melville' }).location, 'Melville');
  assert.equal(prefillPlace({}).location, DEFAULT_LOCATION);
  assert.equal(prefillPlace({ activeLocation: 'Parktown' }).location, 'Parktown');
});

test('colour keeps a valid hex and defaults to gold otherwise', () => {
  assert.equal(prefillPlace({ activeColour: '#112233' }).brandColour, '#112233');
  assert.equal(prefillPlace({ activeColour: 'blue' }).brandColour, DEFAULT_BRAND_COLOUR);
  assert.equal(prefillPlace({ serverColour: '#aabbcc' }).brandColour, '#aabbcc');
});

test('placeholder detection ignores case and spacing', () => {
  assert.equal(isPlaceholderName('  YOUR PLACE '), true);
  assert.equal(isPlaceholderName('Rusty Oak'), false);
});
