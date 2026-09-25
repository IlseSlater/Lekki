/**
 * Hex literals in page styles silently drift from --leos-* / --studio-*.
 * Scan apps/web/src/app/pages for *.page.ts style blocks only.
 * KNOWN_OPEN is today's remaining hits — novel files fail CI.
 *
 * SECOND CHECK (added for the Tailwind conversion, 16 Sep 2026):
 * moving a colour out of the styles block and into the template as a
 * Tailwind arbitrary value — class="bg-[#0f172a]" — keeps the drift and
 * hides it from the first check, which only reads `styles:`. Template
 * arbitrary colours are therefore banned outright: no KNOWN_OPEN, because
 * templates are clean today and must stay that way. Colours come from the
 * @theme aliases in apps/web/src/styles.css.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_DIR = 'apps/web/src/app/pages';

/** Seeded 14 Sep 2026. setup-golive-engine.page.ts is closed. */
const KNOWN_OPEN = new Set([
  'apps/web/src/app/pages/guest-splash.page.ts',
  'apps/web/src/app/pages/onboarding.page.ts',
  'apps/web/src/app/pages/privacy.page.ts',
  'apps/web/src/app/pages/scan-qr.page.ts',
  'apps/web/src/app/pages/service.page.ts',
  'apps/web/src/app/pages/setup-engine-host.page.ts',
  'apps/web/src/app/pages/setup-experience-step.page.ts',
  'apps/web/src/app/pages/setup-identity.page.ts',
  'apps/web/src/app/pages/setup-places.page.ts',
  'apps/web/src/app/pages/staff-entry.page.ts',
  'apps/web/src/app/pages/studio-welcome.page.ts',
  'apps/web/src/app/pages/setup-operate.page.ts',
  'apps/web/src/app/pages/setup-payfast.page.ts',
  'apps/web/src/app/pages/setup-payments.page.ts',
  'apps/web/src/app/pages/setup-pilot.page.ts',
  'apps/web/src/app/pages/station.page.ts',
  'apps/web/src/app/pages/studio-create.page.ts',
  'apps/web/src/app/pages/studio-menu.page.ts',
  'apps/web/src/app/pages/studio-signin.page.ts',
  'apps/web/src/app/pages/studio-team.page.ts',
  'apps/web/src/app/pages/terms.page.ts',
  'apps/web/src/app/pages/website-home.page.ts',
]);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith('.page.ts')) files.push(full);
  }
  return files;
}

function stylesBlock(src) {
  const start = src.search(/styles\s*:\s*\[/);
  if (start < 0) return '';
  return src.slice(start);
}

/** Everything before `styles:` — template literals and class strings live here. */
function templateBlock(src) {
  const start = src.search(/styles\s*:\s*\[/);
  return start < 0 ? src : src.slice(0, start);
}

function hexHits(styles) {
  return styles.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g) ?? [];
}

/**
 * Tailwind arbitrary colour values: bg-[#0f172a], text-[rgb(...)],
 * border-[hsl(...)], ring-[oklch(...)], and the same inside a variant
 * (hover:bg-[#…]). Matches the bracket payload, not the utility name, so a
 * new utility prefix cannot sneak past it.
 */
function arbitraryColourHits(template) {
  return template.match(/-\[\s*(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\()/g) ?? [];
}

function toRepoPath(file) {
  return relative(process.cwd(), file).split('\\').join('/');
}

const root = join(process.cwd(), SCAN_DIR);
const violations = [];
const templateViolations = [];
for (const file of walk(root)) {
  const src = readFileSync(file, 'utf8');
  const hits = hexHits(stylesBlock(src));
  if (hits.length) violations.push({ file: toRepoPath(file), count: hits.length });

  const arb = arbitraryColourHits(templateBlock(src));
  if (arb.length) templateViolations.push({ file: toRepoPath(file), count: arb.length });
}

const novel = violations.filter((v) => !KNOWN_OPEN.has(v.file));
const stale = [...KNOWN_OPEN].filter((file) => !violations.some((v) => v.file === file));

if (violations.length) {
  console.error(`Page hex: ${violations.length} file(s) with style hex (${novel.length} novel):`);
  for (const v of violations) {
    const tag = KNOWN_OPEN.has(v.file) ? 'known' : 'NEW';
    console.error(`  [${tag}] ${v.file} (${v.count})`);
  }
}

if (templateViolations.length) {
  console.error('Template arbitrary colour values are not allowed — use an @theme alias:');
  for (const v of templateViolations) console.error(`  ${v.file} (${v.count})`);
}

if (novel.length || templateViolations.length) {
  if (novel.length) console.error('Hex literals in new or newly dirty page styles are not allowed.');
  process.exit(1);
}

if (stale.length) {
  console.warn('KNOWN_OPEN lists files that no longer have style hex — remove them:');
  for (const file of stale) console.warn(`  ${file}`);
}

if (violations.length) {
  console.warn('Known open page-hex sites remain — clear KNOWN_OPEN when fixed.');
  process.exit(0);
}

console.log('Page hex check passed.');
