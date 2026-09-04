/**
 * Pack nouns must not drive Platform authorization.
 * Scans identifiers in decisions (===, includes, return) — not comments,
 * route strings, or allowlists.
 */
const FORBIDDEN_NOUNS = new Set(['table', 'menu_item', 'waiter', 'kitchen']);

/** Empty after Batch 4 — any decision-site hit fails CI. */
const KNOWN_OPEN = new Set();

const SCAN_DIRS = [
  'packages/contracts/src',
  'packages/domain/src',
  'packages/profile-engine/src',
  'packages/runtime/entry/src',
  'packages/runtime/context/src',
  'packages/runtime/experience/src',
  'packages/runtime/capability/src',
  'apps/runtime/src',
];

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
}

/** Nouns used in comparisons, .includes(), or return — core logic, not copy. */
function decisionNouns(src) {
  const found = new Set();
  const patterns = [
    /\.includes\s*\(\s*['"`](\w+)['"`]/gi,
    /(?:===|!==|==|!=)\s*['"`](\w+)['"`]/gi,
    /['"`](\w+)['"`]\s*(?:===|!==|==|!=)/gi,
    /\breturn\s+['"`](\w+)['"`]/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) {
      const word = m[1].toLowerCase();
      if (FORBIDDEN_NOUNS.has(word)) found.add(word);
    }
  }
  return found;
}

function toRepoPath(file) {
  return relative(process.cwd(), file).split('\\').join('/');
}

const violations = [];
for (const dir of SCAN_DIRS) {
  const fullDir = join(process.cwd(), dir);
  try {
    for (const file of walk(fullDir)) {
      const nouns = decisionNouns(stripComments(readFileSync(file, 'utf8')));
      for (const noun of nouns) {
        violations.push({ file: toRepoPath(file), noun });
      }
    }
  } catch {
    // directory may not exist yet during early scaffold
  }
}

const novel = violations.filter((v) => !KNOWN_OPEN.has(v.file));

if (violations.length > 0) {
  console.error(
    `Noun separation: ${violations.length} decision-site hit(s) (${novel.length} novel):`,
  );
  for (const v of violations) {
    const tag = KNOWN_OPEN.has(v.file) ? 'known' : 'NEW';
    console.error(
      `  [${tag}] ${v.file} uses '${v.noun}' in an authorization/decision expression`,
    );
  }
}

if (novel.length > 0) {
  console.error(
    'Decision-site pack nouns are not allowed in Platform paths.',
  );
  process.exit(1);
}

if (violations.length > 0) {
  console.warn('Known open sites remain — clear KNOWN_OPEN when fixed.');
  process.exit(0);
}

console.log('Noun separation check passed.');
