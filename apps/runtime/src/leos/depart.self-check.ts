/**
 * Participant leave — close table only when last active guest departs.
 * Run: node --import tsx src/leos/depart.self-check.ts
 */
import assert from 'node:assert/strict';
import { ExperienceRuntime } from '@lekki/runtime-experience';
import type { SessionRecord, SessionRepository, PhysicalContextSessionBinding } from '@lekki/runtime-experience';
import type { ProfileEngine } from '@lekki/profile-engine';

class MemorySessions implements SessionRepository {
  private store = new Map<string, SessionRecord>();

  async findActiveByPhysicalContext(): Promise<SessionRecord | null> {
    return null;
  }

  async save(session: SessionRecord): Promise<void> {
    this.store.set(session.id, structuredClone(session));
  }

  async findById(id: string): Promise<SessionRecord | null> {
    return this.store.get(id) ?? null;
  }

  seed(session: SessionRecord) {
    this.store.set(session.id, structuredClone(session));
  }
}

const binding: PhysicalContextSessionBinding = {
  bindSession: async () => undefined,
  clearSession: async () => undefined,
};

const profiles = {} as ProfileEngine;

const baseSession = (): SessionRecord => ({
  id: 'sess_1',
  organisationId: 'org_1',
  venueId: 'ven_1',
  physicalContextId: 'ctx_1',
  profileId: 'prof_restaurant',
  profileVersion: '1.0.0',
  status: 'active',
  correlationId: 'corr_1',
  startedAt: new Date(),
  participants: [
    {
      id: 'part_a',
      displayName: 'Thabo',
      role: 'guest',
      joinedAt: new Date(),
      participantSecret: 'sec_a',
      departedAt: null,
    },
    {
      id: 'part_b',
      displayName: 'Sam',
      role: 'guest',
      joinedAt: new Date(),
      participantSecret: 'sec_b',
      departedAt: null,
    },
  ],
});

async function main() {
  const repo = new MemorySessions();
  const runtime = new ExperienceRuntime(repo, binding, profiles);
  repo.seed(baseSession());

  const first = await runtime.departParticipant('sess_1', 'part_a');
  if (!first.ok) throw new Error(String(first.error));
  assert.equal(first.value.closed, false);

  const second = await runtime.departParticipant('sess_1', 'part_b');
  if (!second.ok) throw new Error(String(second.error));
  assert.equal(second.value.closed, true);
  assert.equal(second.value.session.status, 'completed');

  console.log('depart.self-check: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
