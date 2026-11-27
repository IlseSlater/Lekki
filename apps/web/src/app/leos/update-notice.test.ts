import assert from 'node:assert/strict';
import test from 'node:test';
import { noticeForVersionEvent } from './update-notice';

test('only a ready version asks for a refresh', () => {
  assert.equal(noticeForVersionEvent({ type: 'VERSION_READY' }), 'ready');
  assert.equal(noticeForVersionEvent({ type: 'VERSION_DETECTED' }), null);
  assert.equal(noticeForVersionEvent({ type: 'NO_NEW_VERSION_DETECTED' }), null);
  assert.equal(noticeForVersionEvent(null), null);
});
