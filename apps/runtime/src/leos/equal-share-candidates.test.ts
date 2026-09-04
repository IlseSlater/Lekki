import assert from 'node:assert/strict';
import test from 'node:test';
import { equalShareForParticipant, participantsForEqualShare } from './equal-share-candidates';
import { remainingVisitMinor } from './payment-invariants';
import { fromMinor, toMinor } from './money';

function guest(
  id: string,
  name: string,
  extra?: { equalSplitOptIn?: boolean; departedAt?: Date | null },
) {
  return {
    id,
    displayName: name,
    identityId: null,
    role: 'guest',
    equalSplitOptIn: extra?.equalSplitOptIn ?? false,
    departedAt: extra?.departedAt ?? null,
  };
}

test('row 6: scanner who did not order is not in the equal-share divisor', () => {
  const ordered = [guest('a', 'Ann'), guest('b', 'Ben'), guest('c', 'Cam')];
  const scanner = guest('d', 'Dee');
  const committed = [
    {
      lines: [
        { participantId: 'a' },
        { participantId: 'b' },
        { participantId: 'c' },
      ],
    },
  ];
  const candidates = participantsForEqualShare([...ordered, scanner], committed);
  assert.deepEqual(
    candidates.map((p) => p.id),
    ['a', 'b', 'c'],
  );
  const share = equalShareForParticipant(
    [...ordered, scanner],
    committed,
    new Set(),
    'a',
  );
  assert.equal(share.distinct, 3);
  assert.equal(share.unpaid, 3);
  const remaining = remainingVisitMinor(toMinor(90), 0);
  const each = Math.round(remaining / share.unpaid);
  assert.equal(fromMinor(each), 30);
});

test('row 6: equalSplitOptIn still counts a guest who has not ordered', () => {
  const ordered = [guest('a', 'Ann'), guest('b', 'Ben')];
  const opted = guest('d', 'Dee', { equalSplitOptIn: true });
  const committed = [{ lines: [{ participantId: 'a' }, { participantId: 'b' }] }];
  const share = equalShareForParticipant(
    [...ordered, opted],
    committed,
    new Set(),
    'a',
  );
  assert.equal(share.distinct, 3);
});
