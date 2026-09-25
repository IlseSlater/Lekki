/**
 * @keyframes are GLOBAL. Angular's emulated view encapsulation scopes selectors
 * by attribute, but it does not rename keyframes — so two components that define
 * the same animation name ship two rules with one identity, and the stylesheet
 * injected last wins for both. Because every route is lazy, which one that is
 * depends on the path the user navigated. The symptom is a component animating
 * with another component's motion, intermittently.
 *
 * Found in the wild 16 Sep 2026: `leos-help-up` was defined in both
 * guest-help-sheet (translateY 1rem) and guest-payment-methods-panel
 * (translateY 0.75rem). Renamed the latter to `leos-pay-up`.
 *
 * Empty by design — there is no KNOWN_OPEN. The tree is clean; keep it clean.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SCAN_DIRS = ['apps/web/src/app', 'apps/web/src/styles'];
const CODE = /\.ts$/;
const STYLE = /\.(css|scss)$/;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (CODE.test(entry) ? !entry.endsWith('.test.ts') : STYLE.test(entry)) files.push(full);
  }
  return files;
}

function toRepoPath(file) {
  return relative(process.cwd(), file).split('\\').join('/');
}

/** Component CSS lives inside `styles: [...]`; a .css/.scss file is all CSS. */
function cssOf(file, src) {
  if (!CODE.test(file)) return src;
  const start = src.search(/styles\s*:\s*\[/);
  return start < 0 ? '' : src.slice(start);
}

/** Normalised so whitespace differences do not read as a conflict. */
function keyframesIn(css) {
  const found = [];
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\s*\}/g)) {
    found.push({ name: m[1], body: m[2].replace(/\s+/g, ' ').trim() });
  }
  return found;
}

const byName = new Map();
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(process.cwd(), dir))) {
    const repoPath = toRepoPath(file);
    for (const { name, body } of keyframesIn(cssOf(file, readFileSync(file, 'utf8')))) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push({ file: repoPath, body });
    }
  }
}

const shared = [...byName.entries()].filter(([, defs]) => defs.length > 1);
const conflicts = shared.filter(([, defs]) => new Set(defs.map((d) => d.body)).size > 1);
const duplicates = shared.filter(([, defs]) => new Set(defs.map((d) => d.body)).size === 1);

for (const [name, defs] of conflicts) {
  console.error(`Keyframe conflict: @keyframes ${name} has ${defs.length} definitions with different bodies.`);
  for (const d of defs) console.error(`  ${d.file}`);
}

for (const [name, defs] of duplicates) {
  console.warn(`Keyframe @keyframes ${name} is defined in ${defs.length} files with identical bodies — hoist it to a shared stylesheet, or delete the stale copy:`);
  for (const d of defs) console.warn(`  ${d.file}`);
}

if (conflicts.length) {
  console.error('');
  console.error('Keyframes are global. Prefix component animations with the component name');
  console.error('(leos-help-up, leos-pay-up) so two components can never share an identity.');
  process.exit(1);
}

const total = [...byName.values()].reduce((n, defs) => n + defs.length, 0);
console.log(`Keyframe check passed — ${total} definition(s), ${byName.size} distinct name(s), 0 conflicts.`);
