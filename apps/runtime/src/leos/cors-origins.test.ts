import assert from 'node:assert/strict';
import test from 'node:test';
import { isOriginAllowed, resolveCorsOrigins } from './cors-origins';

test('Batch 2: WEB_ORIGIN list is the CORS allowlist', () => {
  assert.deepEqual(
    resolveCorsOrigins({
      WEB_ORIGIN: 'http://localhost:4200, https://app.lekki.example',
    }),
    ['http://localhost:4200', 'https://app.lekki.example'],
  );
});

test('Batch 2: production refuses empty WEB_ORIGIN', () => {
  assert.throws(
    () => resolveCorsOrigins({ WEB_ORIGIN: '', NODE_ENV: 'production' }),
    /WEB_ORIGIN/,
  );
});

test('Batch 2: unlisted origin is refused', () => {
  const list = resolveCorsOrigins({ WEB_ORIGIN: 'http://localhost:4200' });
  assert.equal(isOriginAllowed('http://evil.example', list), false);
  assert.equal(isOriginAllowed('http://localhost:4200', list), true);
});
