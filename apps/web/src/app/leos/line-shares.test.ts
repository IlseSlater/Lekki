import assert from 'node:assert/strict';
import test from 'node:test';
import { shareCaption, shareOfLineMinor } from './line-shares';

test('web shares match the runtime: one bottle, three ways', () => {
  const line = { participantId: null, sharedWith: ['c', 'a', 'b'], totalMinor: 10000 };
  assert.deepEqual(
    ['a', 'b', 'c'].map((id) => shareOfLineMinor(line, id)),
    [3334, 3333, 3333],
  );
});

test('a whole line belongs to its owner', () => {
  const line = { participantId: 'a', sharedWith: [], totalMinor: 900 };
  assert.equal(shareOfLineMinor(line, 'a'), 900);
  assert.equal(shareOfLineMinor(line, 'b'), 0);
});

test('captions say how many ways and what is yours', () => {
  assert.equal(shareCaption(3, true), 'Shared 3 ways · your third');
  assert.equal(shareCaption(2, true), 'Shared 2 ways · your half');
  assert.equal(shareCaption(3, false), 'Shared 3 ways');
  assert.equal(shareCaption(0, true), '');
});
