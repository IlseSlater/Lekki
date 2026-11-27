import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ClaimLockedError,
  ShareNotAllowedError,
  anyLineAttributed,
  assertLinesNotLocked,
  guestsPaying,
  mineOrderedMinor,
  nextShare,
  shareOfLineMinor,
} from './line-shares';

const bottle = (sharedWith: string[]) => ({
  id: 'l1',
  participantId: null,
  sharedWith,
  totalMinor: 10000,
});

test('one bottle, three ways: the shares add up to the line', () => {
  const line = bottle(['c', 'a', 'b']);
  const shares = ['a', 'b', 'c'].map((id) => shareOfLineMinor(line, id));
  assert.equal(shares.reduce((n, s) => n + s, 0), 10000);
  assert.deepEqual(shares, [3334, 3333, 3333]);
});

test('a guest outside the share owes nothing on it', () => {
  assert.equal(shareOfLineMinor(bottle(['a', 'b']), 'z'), 0);
});

test('an unshared line belongs to its owner in full', () => {
  const line = { id: 'l', participantId: 'a', sharedWith: [], totalMinor: 4500 };
  assert.equal(shareOfLineMinor(line, 'a'), 4500);
  assert.equal(shareOfLineMinor(line, 'b'), 0);
});

test('mine adds whole lines and shares together', () => {
  const lines = [
    { id: '1', participantId: 'a', sharedWith: [], totalMinor: 4500 },
    bottle(['a', 'b']),
    { id: '3', participantId: 'b', sharedWith: [], totalMinor: 2000 },
  ];
  assert.equal(mineOrderedMinor(lines, 'a'), 4500 + 5000);
  assert.equal(mineOrderedMinor(lines, 'b'), 5000 + 2000);
});

test('joining an unowned line makes a share of one, then others join', () => {
  const first = nextShare({ participantId: null, sharedWith: [] }, 'a', 'join');
  assert.deepEqual(first, { participantId: null, sharedWith: ['a'] });
  const second = nextShare(first, 'b', 'join');
  assert.deepEqual(second.sharedWith, ['a', 'b']);
});

test('joining a line someone else owns whole is refused', () => {
  assert.throws(
    () => nextShare({ participantId: 'a', sharedWith: [] }, 'b', 'join'),
    ShareNotAllowedError,
  );
});

test('leaving a share removes only that guest; the last one out frees the line', () => {
  const left = nextShare(bottle(['a', 'b']), 'a', 'leave');
  assert.deepEqual(left.sharedWith, ['b']);
  const empty = nextShare(bottle(['b']), 'b', 'leave');
  assert.deepEqual(empty, { participantId: null, sharedWith: [] });
});

test('leaving a share you are not in is refused', () => {
  assert.throws(() => nextShare(bottle(['a']), 'z', 'leave'), ShareNotAllowedError);
});

test('a line locks while one of its owners is paying', () => {
  const paying = guestsPaying([{ status: 'pending', participantId: 'a', expiresAt: null }]);
  assert.throws(() => assertLinesNotLocked([bottle(['a', 'b'])], paying), ClaimLockedError);
  assert.doesNotThrow(() =>
    assertLinesNotLocked([{ participantId: 'c', sharedWith: [] }], paying),
  );
});

test('an expired or settled payment holds no lock', () => {
  const now = new Date('2026-01-01T12:00:00Z');
  const paying = guestsPaying(
    [
      { status: 'pending', participantId: 'a', expiresAt: new Date('2026-01-01T11:00:00Z') },
      { status: 'completed', participantId: 'b', expiresAt: null },
    ],
    now,
  );
  assert.equal(paying.size, 0);
});

test('anyLineAttributed sees shares as well as owners', () => {
  assert.equal(anyLineAttributed([{ id: '1', participantId: null, sharedWith: [], totalMinor: 1 }]), false);
  assert.equal(anyLineAttributed([bottle(['a'])]), true);
});
