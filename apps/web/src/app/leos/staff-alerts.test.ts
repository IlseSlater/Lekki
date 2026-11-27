import assert from 'node:assert/strict';
import test from 'node:test';
import { alertsAdvice, helpVisibleTo, isIosUserAgent } from './staff-alerts';

const phone = { ios: false, standalone: false };

test('off on a capable phone offers the one button', () => {
  const a = alertsAdvice('off', phone);
  assert.equal(a.canEnable, true);
  assert.match(a.line, /food is ready/);
});

test('iPhone in Safari asks for the Home Screen first', () => {
  const a = alertsAdvice('off', { ios: true, standalone: false });
  assert.equal(a.canEnable, false);
  assert.match(a.line, /Home Screen/);
  assert.equal(alertsAdvice('off', { ios: true, standalone: true }).canEnable, true);
});

test('on, blocked, and unconfigured speak plainly or stay quiet', () => {
  assert.equal(alertsAdvice('on', phone).canEnable, false);
  assert.match(alertsAdvice('on', phone).line, /hear/);
  assert.match(alertsAdvice('blocked', phone).line, /settings/);
  assert.equal(alertsAdvice('unconfigured', phone).line, '');
  assert.equal(alertsAdvice('unsupported', phone).line, '');
});

test('detects iOS user agents', () => {
  assert.equal(isIosUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
  assert.equal(isIosUserAgent('Mozilla/5.0 (Linux; Android 14)'), false);
});

test('help follows the waiter of the table', () => {
  assert.equal(helpVisibleTo(null, 'a', false), true);
  assert.equal(helpVisibleTo('a', 'a', false), true);
  assert.equal(helpVisibleTo('b', 'a', false), false);
  assert.equal(helpVisibleTo('b', 'a', true), true);
});
