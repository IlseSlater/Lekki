import assert from 'node:assert/strict';
import test from 'node:test';
import { canAssign, grants, studioRoleOf, withStudioRole, ROLE_PERMISSIONS } from './studio-roles';

const floor = ['session.read', 'fulfilment.read', 'staff.service'];

test('each role adds to the one below; Admin is organisation.manage', () => {
  assert.ok(ROLE_PERMISSIONS.analyst.every((p) => ROLE_PERMISSIONS.staff.includes(p)));
  assert.ok(ROLE_PERMISSIONS.staff.every((p) => ROLE_PERMISSIONS.manager.includes(p)));
  assert.deepEqual([...ROLE_PERMISSIONS.admin], ['organisation.manage']);
});

test('Admin holds every permission; others only what they were given', () => {
  assert.equal(grants(['organisation.manage'], 'menu.edit'), true);
  assert.equal(grants(ROLE_PERMISSIONS.staff, 'menu.edit'), true);
  assert.equal(grants(ROLE_PERMISSIONS.analyst, 'menu.edit'), false);
  assert.equal(grants(ROLE_PERMISSIONS.manager, 'organisation.manage'), false);
  assert.equal(grants(null, 'reports.read'), false);
});

test('the role read back from permissions; existing owners are Admin', () => {
  assert.equal(studioRoleOf(['organisation.manage', ...floor]), 'admin');
  assert.equal(studioRoleOf([...floor, ...ROLE_PERMISSIONS.manager]), 'manager');
  assert.equal(studioRoleOf([...floor, ...ROLE_PERMISSIONS.staff]), 'staff');
  assert.equal(studioRoleOf([...floor, 'reports.read']), 'none');
  assert.equal(studioRoleOf(floor), 'none');
});

test('changing role keeps floor permissions exactly', () => {
  const next = withStudioRole([...floor, 'organisation.manage'], 'analyst');
  assert.deepEqual(next, [...floor, 'reports.read', 'feedback.read']);
  assert.deepEqual(withStudioRole(next, 'none'), floor);
});

test('a Manager gives up to Manager, never touches an Admin', () => {
  const manager = [...floor, ...ROLE_PERMISSIONS.manager];
  const admin = ['organisation.manage'];
  assert.deepEqual(canAssign(manager, { before: floor, after: withStudioRole(floor, 'staff') }), { ok: true });
  assert.deepEqual(canAssign(manager, { before: floor, after: withStudioRole(floor, 'manager') }), { ok: true });
  assert.equal(canAssign(manager, { before: floor, after: withStudioRole(floor, 'admin') }).ok, false);
  assert.equal(canAssign(manager, { before: admin, after: withStudioRole(admin, 'staff') }).ok, false);
  // No back door: a loose admin-only permission tucked into a lower role.
  assert.equal(
    canAssign(manager, { before: floor, after: [...withStudioRole(floor, 'staff'), 'team.manage'] }).ok,
    false,
  );
  assert.deepEqual(canAssign(admin, { before: admin, after: withStudioRole(admin, 'staff') }), { ok: true });
  assert.equal(canAssign([...floor, ...ROLE_PERMISSIONS.staff], { before: floor, after: floor }).ok, false);
});

test('Admin never implies floor permissions', () => {
  assert.equal(grants(['organisation.manage'], 'staff.service'), false);
  assert.equal(grants(['organisation.manage'], 'payment.complete'), false);
});

test('a Manager cannot edit an Admin even without changing permissions (no PIN takeover)', () => {
  const manager = [...floor, ...ROLE_PERMISSIONS.manager];
  const admin = ['organisation.manage', ...floor];
  assert.equal(canAssign(manager, { before: admin, after: admin }).ok, false);
  // Someone with an old loose permission can still be renamed by a Manager.
  const loose = [...floor, 'reports.read'];
  assert.deepEqual(canAssign(manager, { before: loose, after: loose }), { ok: true });
});

test('the web app shows the same four roles the server enforces', async () => {
  // A path in a variable keeps the web file out of the runtime's own build; tsx still loads it.
  const webPath = '../../../web/src/app/studio/studio-roles';
  const web = (await import(webPath)) as typeof import('./studio-roles');
  assert.deepEqual(web.ROLE_PERMISSIONS, ROLE_PERMISSIONS);
  for (const perms of [[], ['organisation.manage'], [...ROLE_PERMISSIONS.manager], ['staff.service']]) {
    assert.equal(web.studioRoleOf(perms), studioRoleOf(perms));
    assert.deepEqual(web.withStudioRole(perms, 'staff'), withStudioRole(perms, 'staff'));
    for (const need of ['menu.edit', 'staff.service', 'organisation.manage', 'team.manage']) {
      assert.equal(web.grants(perms, need), grants(perms, need), `${need} for ${perms}`);
    }
  }
});
