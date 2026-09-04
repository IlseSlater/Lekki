import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCallerIsParticipant,
  resolveParticipantBySecret,
  type ClaimParticipant,
} from './participant-auth';

const current: ClaimParticipant = {
  id: 'part_today',
  participantSecret: 'sec_today',
  departedAt: null,
  role: 'guest',
};

const stale: ClaimParticipant = {
  id: 'part_yesterday',
  participantSecret: 'sec_yesterday',
  departedAt: null,
  role: 'guest',
};

const departed: ClaimParticipant = {
  id: 'part_left',
  participantSecret: 'sec_left',
  departedAt: new Date('2026-09-01T00:00:00Z'),
  role: 'guest',
};

const table = [current, stale, departed];

test('row 7: current secret resolves', () => {
  assert.equal(resolveParticipantBySecret(table, 'sec_today')?.id, 'part_today');
});

test('row 7: stale participant secret does not resolve', () => {
  assert.equal(resolveParticipantBySecret(table, 'sec_expired_yesterday'), null);
  assert.throws(
    () => assertCallerIsParticipant(table, 'part_today', 'sec_expired_yesterday'),
    /Invalid participant credentials/,
  );
});

test('row 7: secret for a departed guest does not resolve', () => {
  assert.equal(resolveParticipantBySecret(table, 'sec_left'), null);
});

test('row 7: secret must match the named participant', () => {
  assert.throws(
    () => assertCallerIsParticipant(table, 'part_today', 'sec_yesterday'),
    /Participant credentials do not match/,
  );
});
