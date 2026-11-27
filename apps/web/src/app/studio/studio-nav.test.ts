import assert from 'node:assert/strict';
import test from 'node:test';
import { STUDIO_NAV_GROUPS, STUDIO_NAV_ITEMS, activeNavItem } from './studio-nav';
import { SETUP_STEPS } from './experience-registry';
import { EVERYDAY_PATH_FOR_STEP, everydayPathForSetupUrl } from './guided-setup-paths';

test('rail: Home, then what guests see, running the floor, the business', () => {
  assert.deepEqual(
    STUDIO_NAV_GROUPS.map((g) => g.label),
    [null, 'What guests see', 'Run the floor', 'The business'],
  );
  assert.deepEqual(
    STUDIO_NAV_ITEMS.map((i) => i.label),
    ['Home', 'Your place', 'Menu', 'Tables & QR', 'At the table', 'Operate', 'Team', 'Payments', 'Grow', 'Connections'],
  );
});

test('rail never uses software words', () => {
  for (const item of STUDIO_NAV_ITEMS) {
    assert.doesNotMatch(item.label, /integration|connector|pack|admin|config/i, item.label);
  }
});

test('every page lights exactly one rail item, guided steps included', () => {
  const cases: Array<[string, string]> = [
    ['/studio', 'Home'],
    ['/studio/place', 'Your place'],
    ['/studio/setup/identity', 'Your place'],
    ['/studio/menu', 'Menu'],
    ['/studio/setup/experience', 'Menu'],
    ['/studio/tables', 'Tables & QR'],
    ['/studio/setup/places', 'Tables & QR'],
    ['/studio/setup/golive', 'Tables & QR'],
    ['/studio/at-the-table', 'At the table'],
    ['/studio/payments', 'Payments'],
    ['/studio/payments/connect', 'Payments'],
    ['/studio/setup/payments/connect', 'Payments'],
    ['/studio/connections/pilot', 'Connections'],
    ['/studio/team?x=1', 'Team'],
  ];
  for (const [url, label] of cases) {
    assert.equal(activeNavItem(url)?.label, label, url);
  }
});

test('guided run walks the same pages, in order, and readiness slugs are unchanged', () => {
  assert.deepEqual(
    SETUP_STEPS.map((s) => s.slug),
    ['identity', 'experience', 'places', 'payments', 'golive'],
  );
  assert.deepEqual(
    SETUP_STEPS.map((s) => s.title),
    ['Your place', 'Menu', 'Tables & QR', 'Payments', 'Go live'],
  );
  for (const step of SETUP_STEPS) {
    const everyday = EVERYDAY_PATH_FOR_STEP[step.slug];
    if (!everyday) continue;
    assert.equal(activeNavItem(everyday)?.label, step.title, step.slug);
  }
});

test('once live, setup links open the everyday pages; Go live stays for the QR codes', () => {
  assert.equal(everydayPathForSetupUrl('/studio/setup/identity'), '/studio/place');
  assert.equal(everydayPathForSetupUrl('/studio/setup/experience?x=1'), '/studio/menu');
  assert.equal(everydayPathForSetupUrl('/studio/setup/places'), '/studio/tables');
  assert.equal(everydayPathForSetupUrl('/studio/setup/payments'), '/studio/payments');
  assert.equal(everydayPathForSetupUrl('/studio/setup/payments/connect'), '/studio/payments/connect');
  assert.equal(everydayPathForSetupUrl('/studio/setup/golive'), null);
  assert.equal(everydayPathForSetupUrl('/studio/menu'), null);
});
