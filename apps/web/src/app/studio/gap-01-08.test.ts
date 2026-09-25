import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

/**
 * GAP-01…GAP-08 board — software + story proof that each gap is closed or Hold-locked.
 */
const ROOT = process.cwd();
const MAP = join(ROOT, 'docs/ux/lifecycle-and-screen-map.md');
const ROUTES = join(ROOT, 'apps/web/src/app/app.routes.ts');
const PAGES = join(ROOT, 'apps/web/src/app/pages');
const STORIES = join(ROOT, 'docs/ux/stories');
const EVIDENCE = join(ROOT, 'docs/ux/evidence');

test('GAP-01: dead Studio pages stay deleted', () => {
  for (const file of [
    'studio-live.page.ts',
    'setup-golive.page.ts',
    'setup-hub.page.ts',
    'studio-configure.page.ts',
    'studio-choose.page.ts',
    'setup-organisation.page.ts',
    'setup-integrations.page.ts',
  ]) {
    assert.equal(existsSync(join(PAGES, file)), false, file);
  }
});

test('GAP-02: Neo dock exists on disk but is never imported', () => {
  assert.equal(existsSync(join(ROOT, 'apps/web/src/app/leos/neo-dock.component.ts')), true);
  const routes = readFileSync(ROUTES, 'utf8');
  assert.doesNotMatch(routes, /neo-dock|NeoDock/);
  const home = readFileSync(join(PAGES, 'studio-home.page.ts'), 'utf8');
  assert.doesNotMatch(home, /neo-dock|NeoDock/);
});

test('GAP-03: Staff shift story S-11 owns Team', () => {
  assert.equal(existsSync(join(STORIES, 'S-11-team.md')), true);
  assert.equal(existsSync(join(EVIDENCE, 'staff-shift.md')), true);
  const map = readFileSync(MAP, 'utf8');
  assert.match(map, /SCR-ST-TEAM.*S-11/);
});

test('GAP-04: Guest first impression story G-01 owns splash + arrival', () => {
  assert.equal(existsSync(join(STORIES, 'G-01-entry.md')), true);
  assert.equal(existsSync(join(EVIDENCE, 'guest-first-impression.md')), true);
  const map = readFileSync(MAP, 'utf8');
  assert.match(map, /SCR-GX-SPLASH.*G-01/);
  assert.match(map, /SCR-GX-ARRIVE.*G-01/);
});

test('GAP-05: Catalogue story S-12 owns /studio/menu', () => {
  assert.equal(existsSync(join(STORIES, 'S-12-catalogue.md')), true);
  assert.equal(existsSync(join(EVIDENCE, 'catalogue-menu.md')), true);
  const map = readFileSync(MAP, 'utf8');
  assert.match(map, /SCR-ST-MENU.*S-12/);
  const routes = readFileSync(ROUTES, 'utf8');
  assert.match(routes, /path: 'menu'/);
});

test('GAP-06: one payments door — hub redirects; Pilot under How they pay', () => {
  const routes = readFileSync(ROUTES, 'utf8');
  assert.match(routes, /path: 'integrations',\s*redirectTo: 'setup\/payments'/);
  assert.match(routes, /path: 'integrations\/payfast',\s*redirectTo: 'setup\/payments\/connect'/);
  assert.match(routes, /path: 'integrations\/pilot'/);
  assert.equal(existsSync(join(PAGES, 'setup-integrations.page.ts')), false);
  const home = readFileSync(join(PAGES, 'studio-home.page.ts'), 'utf8');
  assert.doesNotMatch(home, /routerLink="\/studio\/integrations"/);
  assert.match(home, /routerLink="\/studio\/setup\/payments"/);
  const pay = readFileSync(join(PAGES, 'setup-payments.page.ts'), 'utf8');
  assert.match(pay, /integrations\/pilot/);
});

test('GAP-07: no venue-paused product state in routes or pages', () => {
  const routes = readFileSync(ROUTES, 'utf8');
  assert.doesNotMatch(routes, /venuePaused|VENUE-PAUSED|closeTonight/);
  const home = readFileSync(join(PAGES, 'studio-home.page.ts'), 'utf8');
  assert.doesNotMatch(home, /venuePaused|closeTonight/);
});

test('GAP-08: coverage script and evidence exist', () => {
  assert.equal(existsSync(join(ROOT, 'scripts/check-screen-coverage.mjs')), true);
  assert.equal(existsSync(join(EVIDENCE, 'screen-coverage.md')), true);
});
