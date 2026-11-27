import assert from 'node:assert/strict';
import test from 'node:test';
import { moveRefusalMessage, planTableMove } from './table-move';

const base = {
  isManager: true,
  sessionStatus: 'active',
  fromCode: '4',
  sessionId: 's1',
  target: { code: '9', activeSessionId: null as string | null },
};

test('a manager moves an open bill to a free table', () => {
  assert.deepEqual(planTableMove(base), { ok: true });
});

test('only a manager moves a bill', () => {
  assert.deepEqual(planTableMove({ ...base, isManager: false }), { ok: false, reason: 'not_manager' });
});

test('a closed bill stays where it is', () => {
  assert.deepEqual(planTableMove({ ...base, sessionStatus: 'completed' }), {
    ok: false,
    reason: 'session_closed',
  });
});

test('the target must exist, differ, and be free', () => {
  assert.deepEqual(planTableMove({ ...base, target: null }), { ok: false, reason: 'target_missing' });
  assert.deepEqual(planTableMove({ ...base, target: { code: '4', activeSessionId: null } }), {
    ok: false,
    reason: 'same_place',
  });
  assert.deepEqual(planTableMove({ ...base, target: { code: '9', activeSessionId: 's2' } }), {
    ok: false,
    reason: 'target_busy',
  });
});

test('refusals read in plain words', () => {
  assert.equal(moveRefusalMessage('target_busy', '9'), 'Table 9 already has guests.');
  assert.equal(moveRefusalMessage('not_manager'), 'Only a manager can move a bill.');
});
