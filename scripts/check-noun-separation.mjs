const FORBIDDEN = [
  /\btable\b/i,
  /\bmenu_item\b/i,
  /\bwaiter\b/i,
  /\bkitchen\b/i,
];

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
import { join } from 'node:path';

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

let violations = [];
for (const dir of SCAN_DIRS) {
  const fullDir = join(process.cwd(), dir);
  try {
    for (const file of walk(fullDir)) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN) {
        if (pattern.test(content)) {
          violations.push({ file, pattern: pattern.toString() });
        }
      }
    }
  } catch {
    // directory may not exist yet during early scaffold
  }
}

if (violations.length > 0) {
  console.error('Noun separation violations found:');
  for (const v of violations) {
    console.error(`  ${v.file} matches ${v.pattern}`);
  }
  process.exit(1);
}

console.log('Noun separation check passed.');
