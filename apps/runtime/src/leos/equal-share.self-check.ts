import assert from 'node:assert/strict';
import { equalShareState } from '@lekki/domain';
import { ExperienceRuntime, type SessionRecord } from '@lekki/runtime-experience';
import type { ResolvedContext } from '@lekki/contracts';
import { ok } from '@lekki/shared';

function guest(id: string, displayName: string, identityId?: string | null) {
  return { id, displayName, identityId: identityId ?? null, role: 'guest' };
}

function sessionRecord(participants: SessionRecord['participants']): SessionRecord {
  return {
    id: 'sess_1',
    organisationId: 'org_1',
    venueId: 'ven_1',
    physicalContextId: 'ctx_1',
    profileId: 'prof_1',
    profileVersion: '1',
    status: 'active',
    correlationId: 'corr_1',
    startedAt: new Date(),
    participants,
  };
}

const context = {
  organisationId: 'org_1',
  venueId: 'ven_1',
  physicalContextId: 'ctx_1',
  physicalContextCode: 'T1',
  profile: { id: 'prof_1', version: '1', surfaces: ['guest'], label: 'Restaurant', terminology: {} },
} as unknown as ResolvedContext;

async function checkEqualShare() {
  const fiveGhosts = [1, 2, 3, 4, 5].map((n) => guest(`part_${n}`, 'Ilse'));
  const solo = equalShareState(fiveGhosts, new Set(), 'part_5');
  assert.equal(solo.distinct, 1, 'five Ilse re-joins are one guest');
  assert.equal(solo.unpaid, 1);

  const twoPeople = [...fiveGhosts, guest('part_sam', 'Sam')];
  const split = equalShareState(twoPeople, new Set(), 'part_5');
  assert.equal(split.distinct, 2);
  assert.equal(split.unpaid, 2);
  const amount = Math.round((125 / Math.max(1, split.unpaid)) * 100) / 100;
  assert.equal(amount, 62.5);

  const paid = equalShareState(twoPeople, new Set(['part_1']), 'part_5');
  assert.equal(paid.minePaid, true, 'equal pay on any of Ilse’s rows covers Ilse');
  assert.equal(paid.unpaid, 1);
}

async function checkResume() {
  const existing = sessionRecord([
    {
      id: 'part_ilse',
      identityId: null,
      displayName: 'Ilse',
      role: 'guest',
      joinedAt: new Date(),
    },
  ]);
  let saved = 0;
  const runtime = new ExperienceRuntime(
    {
      findActiveByPhysicalContext: async () => existing,
      save: async () => {
        saved += 1;
      },
      findById: async () => existing,
    },
    {
      bindSession: async () => undefined,
      clearSession: async () => undefined,
    },
    { load: async () => ok({} as never) } as never,
  );

  const resumed = await runtime.startOrResume(context, {
    displayName: 'Ilse',
    resumeParticipantId: 'part_ilse',
  });
  assert.equal(resumed.ok, true);
  if (!resumed.ok) return;
  assert.equal(resumed.value.joined, false);
  assert.equal(resumed.value.participantId, 'part_ilse');
  assert.equal(resumed.value.session.participants.length, 1);
  assert.equal(saved, 0, 'resume must not write another participant');

  const byName = await runtime.startOrResume(context, { displayName: 'Ilse' });
  assert.equal(byName.ok, true);
  if (!byName.ok) return;
  assert.equal(byName.value.joined, false);
  assert.equal(byName.value.participantId, 'part_ilse');
  assert.equal(existing.participants.length, 1);
}

async function run() {
  await checkEqualShare();
  await checkResume();
  console.log('equal-share.self-check: ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
