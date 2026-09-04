/**
 * claim-lines participant auth — blocks cross-guest line reassignment.
 * Run: node --import tsx src/leos/claim-lines.self-check.ts
 */
import assert from 'node:assert/strict';
import {
  assertClaimLinesAllowed,
  resolveParticipantBySecret,
  type ClaimParticipant,
} from './participant-auth';

const thabo: ClaimParticipant = {
  id: 'part_a',
  participantSecret: 'sec_a',
  departedAt: null,
  role: 'guest',
};

const sam: ClaimParticipant = {
  id: 'part_b',
  participantSecret: 'sec_b',
  departedAt: null,
  role: 'guest',
};

const participants = [thabo, sam];

function checkResolve() {
  assert.equal(resolveParticipantBySecret(participants, 'sec_a')?.id, 'part_a');
  assert.equal(resolveParticipantBySecret(participants, 'sec_b')?.id, 'part_b');
  assert.equal(resolveParticipantBySecret(participants, 'wrong'), null);
  assert.equal(resolveParticipantBySecret(participants, ''), null);
}

function checkClaimToSelf() {
  assert.doesNotThrow(() =>
    assertClaimLinesAllowed(thabo, 'part_a', [{ id: 'line_1', participantId: null }]),
  );
  assert.throws(
    () =>
      assertClaimLinesAllowed(thabo, 'part_a', [{ id: 'line_1', participantId: 'part_b' }]),
    /belongs to someone else/,
  );
}

function checkPushOntoOtherGuest() {
  assert.throws(
    () => assertClaimLinesAllowed(thabo, 'part_b', [{ id: 'line_1', participantId: 'part_a' }]),
    /your own share/,
  );
}

function checkUnassignUndo() {
  assert.doesNotThrow(() =>
    assertClaimLinesAllowed(thabo, null, [{ id: 'line_1', participantId: 'part_a' }]),
  );
  assert.throws(
    () => assertClaimLinesAllowed(thabo, null, [{ id: 'line_1', participantId: 'part_b' }]),
    /your share/,
  );
}

function run() {
  checkResolve();
  checkClaimToSelf();
  checkPushOntoOtherGuest();
  checkUnassignUndo();
  console.log('claim-lines.self-check: ok');
}

run();
