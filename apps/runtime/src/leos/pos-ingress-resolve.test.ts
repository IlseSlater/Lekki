import assert from 'node:assert/strict';
import test from 'node:test';
import {
  posLineExternalRef,
  POS_OPEN_SESSION_STATUSES,
  resolvePosPlace,
  resolvePosSku,
} from './pos-ingress-resolve';

test('POS place: missing map or open session → ignored (no Pilot retry storm)', () => {
  assert.deepEqual(
    resolvePosPlace({ placeMapping: null, openSession: null }),
    { kind: 'ignored', reason: 'no_active_session_for_place' },
  );
  assert.deepEqual(
    resolvePosPlace({
      placeMapping: { physicalContextId: 'ctx_1' },
      openSession: null,
    }),
    { kind: 'ignored', reason: 'no_active_session_for_place' },
  );
});

test('POS place: map + open session → session id for appendExternalLine', () => {
  assert.deepEqual(
    resolvePosPlace({
      placeMapping: { physicalContextId: 'ctx_1' },
      openSession: { id: 'ses_open' },
    }),
    {
      kind: 'session',
      sessionId: 'ses_open',
      physicalContextId: 'ctx_1',
    },
  );
});

test('POS SKU: miss stays unmapped (label on bill; Operate exception later)', () => {
  assert.deepEqual(resolvePosSku({ skuMapping: null }), {
    catalogueItemId: null,
    unmapped: true,
  });
});

test('POS SKU: hit passes opaque catalogueItemId', () => {
  assert.deepEqual(
    resolvePosSku({ skuMapping: { catalogueItemId: 'cat_beer' } }),
    { catalogueItemId: 'cat_beer', unmapped: false },
  );
});

test('POS open statuses include settling so trailing punches during pay land', () => {
  assert.deepEqual([...POS_OPEN_SESSION_STATUSES], [
    'created',
    'active',
    'settling',
  ]);
});

test('POS line ref: same Pilot line id at two venues stays distinct', () => {
  const a = posLineExternalRef('pilot', 'ven_a', '1001');
  const b = posLineExternalRef('pilot', 'ven_b', '1001');
  assert.notEqual(a, b);
  // Retry at the same venue maps to the same key (idempotent).
  assert.equal(posLineExternalRef('pilot', ' ven_a ', ' 1001 '), a);
  assert.throws(() => posLineExternalRef('pilot', 'ven_a', '  '));
});
