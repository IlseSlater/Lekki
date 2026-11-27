import assert from 'node:assert/strict';
import test from 'node:test';
import {
  friendShareText,
  googleReviewUrlFrom,
  safeReviewUrl,
  whatsappShareUrl,
} from './review-links';

test('only secure web addresses become a review link', () => {
  assert.equal(safeReviewUrl('https://g.page/r/abc/review'), 'https://g.page/r/abc/review');
  assert.equal(safeReviewUrl('http://example.com'), '');
  assert.equal(safeReviewUrl('javascript:alert(1)'), '');
  assert.equal(safeReviewUrl('not a url'), '');
  assert.equal(safeReviewUrl(42), '');
  assert.equal(safeReviewUrl('   '), '');
});

test('the venue link is read from the guest design', () => {
  assert.equal(googleReviewUrlFrom({ googleReviewUrl: 'https://g.page/r/x' }), 'https://g.page/r/x');
  assert.equal(googleReviewUrlFrom({ payAtTable: true }), '');
  assert.equal(googleReviewUrlFrom(null), '');
});

test('WhatsApp share carries the text and the link, encoded', () => {
  const url = whatsappShareUrl(friendShareText('Rusty Oak'), 'https://lekki.example/g/abc');
  assert.ok(url.startsWith('https://wa.me/?text='));
  assert.ok(decodeURIComponent(url).includes('Have a look at Rusty Oak https://lekki.example/g/abc'));
});

test('share text works without a name', () => {
  assert.equal(friendShareText(' '), 'Have a look at this place');
});
