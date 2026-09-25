import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STUDIO_SIGNIN_SETTLE_MS,
  STUDIO_WELCOME_STAGGER_MS,
  studioWelcomeRevealOrder,
} from './studio-first-impression';

const here = dirname(fileURLToPath(import.meta.url));

test('sign-in settle uses frozen 360ms', () => {
  assert.equal(STUDIO_SIGNIN_SETTLE_MS, 360);
});

test('welcome reveal order is peak-end calm', () => {
  assert.deepEqual([...studioWelcomeRevealOrder()], [
    'greeting',
    'venue',
    'readiness',
    'remembered',
  ]);
  assert.deepEqual([...STUDIO_WELCOME_STAGGER_MS], [0, 60, 120, 180]);
});

test('sign-in does not prefill demo email', () => {
  const src = readFileSync(join(here, '../pages/studio-signin.page.ts'), 'utf8');
  assert.doesNotMatch(src, /email\s*=\s*'staff@rustyoak\.demo'/);
  assert.match(src, /email\s*=\s*''/);
});

test('welcome uses register halo and stagger classes', () => {
  const src = readFileSync(join(here, '../pages/studio-welcome.page.ts'), 'utf8');
  assert.match(src, /leos-register-halo/);
  assert.match(src, /studio-motion-appear-delay-3/);
});

test('create remounts confidence when selected', () => {
  const src = readFileSync(join(here, '../pages/studio-create.page.ts'), 'utf8');
  assert.match(src, /@if \(selected\)/);
  assert.match(src, /\[ready\]="true"/);
});
