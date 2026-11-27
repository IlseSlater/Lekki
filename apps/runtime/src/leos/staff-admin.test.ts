import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MANAGE_PERMISSION,
  canManage,
  normalisePermissions,
  wouldLeaveNoManager,
} from './staff-admin';

const admin = (id: string) => ({ id, permissions: [MANAGE_PERMISSION, 'bill.key'] });
const waiter = (id: string) => ({ id, permissions: ['bill.key'] });

test('canManage reads the one permission', () => {
  assert.equal(canManage([MANAGE_PERMISSION]), true);
  assert.equal(canManage(['bill.key']), false);
  assert.equal(canManage(undefined), false);
});

test('the only manager cannot lose the switch', () => {
  const members = [admin('a'), waiter('b')];
  assert.equal(wouldLeaveNoManager(members, { staffId: 'a', nextPermissions: ['bill.key'] }), true);
});

test('with a second manager the first can step down', () => {
  const members = [admin('a'), admin('b')];
  assert.equal(wouldLeaveNoManager(members, { staffId: 'a', nextPermissions: [] }), false);
});

test('keeping the switch on is always fine', () => {
  const members = [admin('a')];
  assert.equal(
    wouldLeaveNoManager(members, { staffId: 'a', nextPermissions: [MANAGE_PERMISSION] }),
    false,
  );
});

test('switching it on for someone else is fine', () => {
  const members = [admin('a'), waiter('b')];
  assert.equal(
    wouldLeaveNoManager(members, { staffId: 'b', nextPermissions: [MANAGE_PERMISSION] }),
    false,
  );
});

test('changing a non-manager never trips the guard', () => {
  const members = [admin('a'), waiter('b')];
  assert.equal(wouldLeaveNoManager(members, { staffId: 'b', nextPermissions: [] }), false);
});

test('normalisePermissions trims, dedupes, and drops non-text', () => {
  assert.deepEqual(normalisePermissions([' a ', 'a', 3, '', 'b']), ['a', 'b']);
  assert.deepEqual(normalisePermissions('x'), []);
});
