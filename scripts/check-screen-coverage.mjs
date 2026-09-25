/**
 * GAP-08 — Lifecycle screen coverage.
 * Every SCR-* in docs/ux/lifecycle-and-screen-map.md must name an owner
 * (story / HCI / continuity). Bare GAP-01…GAP-08 as the sole owner fails —
 * those gaps are closed or Hold-resolved, not open screen owners.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MAP = join(ROOT, 'docs/ux/lifecycle-and-screen-map.md');
const ROUTES = join(ROOT, 'apps/web/src/app/app.routes.ts');
const STORIES = join(ROOT, 'docs/ux/stories');
const PAGES = join(ROOT, 'apps/web/src/app/pages');
const LEOS = join(ROOT, 'apps/web/src/app/leos');

/** Open product holes must not own screens. Hold notes GAP-09/10 may appear as context. */
const FORBIDDEN_SOLE_OWNERS = new Set([
  'GAP-01',
  'GAP-02',
  'GAP-03',
  'GAP-04',
  'GAP-05',
  'GAP-06',
  'GAP-07',
  'GAP-08',
]);

const REQUIRED_STORY_FILES = [
  'G-01-entry.md',
  'G-05-cart.md',
  'G-06-live-order.md',
  'S-00-welcome.md',
  'S-01-choose-experience.md',
  'S-02-identity.md',
  'S-03-experience.md',
  'S-04-places.md',
  'S-05-payments.md',
  'S-06-golive.md',
  'S-07-home.md',
  'S-08-operate.md',
  'S-09-grow.md',
  'S-10-live-experience.md',
  'S-11-team.md',
  'S-12-catalogue.md',
];

const REQUIRED_ROUTE_FRAGMENTS = [
  "path: 'splash'",
  "path: 'entry'",
  "path: 'experience'",
  "path: 'staff'",
  "path: 'menu'",
  "path: 'team'",
  "path: 'operate'",
  "path: 'grow'",
  "path: 'payments'",
  "path: 'golive'",
  "redirectTo: 'setup/payments'",
];

const DEAD_PAGES = [
  'studio-live.page.ts',
  'setup-golive.page.ts',
  'setup-hub.page.ts',
  'studio-configure.page.ts',
  'studio-choose.page.ts',
  'setup-organisation.page.ts',
  'setup-integrations.page.ts',
];

function cells(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim())
    .filter((_, i, arr) => !(i === 0 && arr[0] === ''));
}

function parseScrRows(md) {
  const rows = [];
  for (const line of md.split(/\r?\n/)) {
    if (!/^\|\s*SCR-[A-Z0-9-]+\s*\|/.test(line)) continue;
    const cols = cells(line);
    const id = cols[0];
    if (!id?.startsWith('SCR-')) continue;
    rows.push({ id, cols, line });
  }
  return rows;
}

function ownerBlob(cols) {
  // Stories / owner is never the screen name (col1) or id (col0). Prefer col 3–4.
  return cols.slice(2).join(' · ');
}

function soleForbiddenGap(blob) {
  const gaps = [...blob.matchAll(/\*\*(GAP-\d+)\*\*/g)].map((m) => m[1]);
  const storyish =
    /\bG-\d+\b|\bS-\d+\b|HCI|Continuity|Craft|Legal|Engineering|Redirect|operate-staff|Pack station|capability|S-00 adjacent/i.test(
      blob,
    );
  if (storyish) return null;
  const bad = gaps.find((g) => FORBIDDEN_SOLE_OWNERS.has(g));
  return bad || null;
}

const errors = [];

if (!existsSync(MAP)) {
  console.error('Missing lifecycle map:', MAP);
  process.exit(1);
}

const md = readFileSync(MAP, 'utf8');
const routes = existsSync(ROUTES) ? readFileSync(ROUTES, 'utf8') : '';
const rows = parseScrRows(md);

if (rows.length < 20) {
  errors.push(`Expected ≥20 SCR-* rows, found ${rows.length}`);
}

const ids = new Set();
for (const row of rows) {
  if (ids.has(row.id)) errors.push(`Duplicate SCR id: ${row.id}`);
  ids.add(row.id);
  const blob = ownerBlob(row.cols);
  const bad = soleForbiddenGap(blob);
  if (bad) {
    errors.push(`${row.id} owned only by ${bad} — close the gap or name a story`);
  }
  if (!blob.trim() || blob === '—' || blob === '-') {
    errors.push(`${row.id} has empty owner`);
  }
}

for (const file of REQUIRED_STORY_FILES) {
  if (!existsSync(join(STORIES, file))) {
    errors.push(`Missing story file: docs/ux/stories/${file}`);
  }
}

for (const frag of REQUIRED_ROUTE_FRAGMENTS) {
  if (!routes.includes(frag)) {
    errors.push(`app.routes.ts missing fragment: ${frag}`);
  }
}

for (const file of DEAD_PAGES) {
  if (existsSync(join(PAGES, file))) {
    errors.push(`Dead page restored: apps/web/src/app/pages/${file}`);
  }
}

/** GAP-02 — Neo dock must stay unimported. */
const neoImports = [];
function walkTs(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full);
    else if (entry.name.endsWith('.ts') && entry.name !== 'neo-dock.component.ts') {
      if (entry.name.endsWith('.test.ts')) continue;
      const src = readFileSync(full, 'utf8');
      if (/from ['"].*neo-dock|NeoDockComponent/.test(src)) neoImports.push(full);
    }
  }
}
walkTs(join(ROOT, 'apps/web/src/app'));
if (neoImports.length) {
  errors.push(`GAP-02: Neo dock imported in:\n  ${neoImports.join('\n  ')}`);
}

/** GAP-07 — no venue-paused product state. */
if (/\bVENUE-PAUSED\b|venuePaused|closeTonight/.test(routes + md)) {
  // map may mention GAP-07 Hold — only fail on software
}
const appSrc = readFileSync(ROUTES, 'utf8');
if (/\bvenuePaused\b|\bLS-VENUE-PAUSED\b/.test(appSrc)) {
  errors.push('GAP-07: venue pause state appeared in routes');
}

if (errors.length) {
  console.error(`Screen coverage: ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(
  `Screen coverage: ${rows.length} SCR-* owned · ${REQUIRED_STORY_FILES.length} stories · Neo unimported · dead pages absent.`,
);
