import assert from 'node:assert/strict';
import test from 'node:test';
import { translatePilotLineWebhook } from './index';

test('Pilot stub: webhook JSON maps to LEOS append params', () => {
  const params = translatePilotLineWebhook({
    lineId: 'PILOT-991',
    checkId: 'CHK-12',
    sessionId: 'ses_demo',
    label: 'Castle Lite',
    quantity: 1,
    unitPrice: 28.5,
  });
  assert.equal(params.externalRef, 'PILOT-991');
  assert.equal(params.externalCheckId, 'CHK-12');
  assert.equal(params.sessionId, 'ses_demo');
  assert.equal(params.labelFallback, 'Castle Lite');
  assert.equal(params.origin, 'staff_pos');
  assert.equal(params.catalogueItemId, null);
});
