import assert from 'node:assert/strict';
import test from 'node:test';
import { translatePilotLineWebhook } from './translate';

test('Pilot stub: place + sku normalize without session or catalogue ids', () => {
  const payload = translatePilotLineWebhook({
    lineId: 'PILOT-991',
    placeId: 'TBL-12',
    checkId: 'CHK-88',
    sku: 'BEER-01',
    label: 'Castle Lite',
    quantity: 1,
    unitPrice: 28.5,
  });
  assert.equal(payload.externalRef, 'PILOT-991');
  assert.equal(payload.externalPlaceId, 'TBL-12');
  assert.equal(payload.externalCheckId, 'CHK-88');
  assert.equal(payload.externalSkuId, 'BEER-01');
  assert.equal(payload.labelFallback, 'Castle Lite');
  assert.equal(payload.quantity, 1);
  assert.equal(payload.unitPrice, 28.5);
});

test('Pilot stub: checkId alone is the place when table fields are absent', () => {
  const payload = translatePilotLineWebhook({
    lineId: 'PILOT-1',
    checkId: 'TBL-12',
    label: 'Castle Lite',
    quantity: 2,
    unitPrice: 28.5,
  });
  assert.equal(payload.externalPlaceId, 'TBL-12');
  assert.equal(payload.externalCheckId, 'TBL-12');
  assert.equal(payload.externalSkuId, null);
});
