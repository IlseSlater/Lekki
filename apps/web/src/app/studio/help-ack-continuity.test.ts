import assert from 'node:assert/strict';
import test from 'node:test';
import {
  guestManagerAssistCopy,
  guestServiceAssistCopy,
} from './operate-status';

const packs = ['restaurant', 'cafe', 'hotel', 'healthcare', 'festival', 'airport'] as const;

test('service notified: no hang tight · calm We’ve told…', () => {
  for (const pack of packs) {
    const copy = guestServiceAssistCopy(pack);
    assert.doesNotMatch(copy.notified, /hang tight/i);
    assert.match(copy.notified, /^We’ve told /);
    assert.match(copy.onWay, /on the way/i);
  }
});

test('manager notified: no hang tight · calm We’ve told…', () => {
  for (const pack of packs) {
    const copy = guestManagerAssistCopy(pack);
    assert.doesNotMatch(copy.notified, /hang tight/i);
    assert.match(copy.notified, /^We’ve told /);
    assert.match(copy.onWay, /on the way/i);
  }
});

test('restaurant service: waiter nouns', () => {
  const s = guestServiceAssistCopy('restaurant');
  assert.equal(s.notified, 'We’ve told your waiter');
  assert.equal(s.onWay, 'Your waiter is on the way');
});

test('café service: counter nouns', () => {
  const s = guestServiceAssistCopy('cafe');
  assert.equal(s.notified, 'We’ve told the counter');
  assert.equal(s.onWay, 'Someone from the counter is on the way');
});

test('festival manager: lead nouns', () => {
  const m = guestManagerAssistCopy('festival');
  assert.equal(m.notified, 'We’ve told the lead');
  assert.equal(m.onWay, 'The lead is on the way');
});
