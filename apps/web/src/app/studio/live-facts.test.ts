import assert from 'node:assert/strict';
import test from 'node:test';
import { bar4bDeskPublicParity, resolveLiveFacts, spokenPlaceLine } from './live-facts';

const sessionComplete = {
  venueName: 'Rusty Oak',
  placeCode: 'T1',
  catalogue: [
    { label: 'Chef’s Bowl', priceMinor: 14500 },
    { label: 'Still water', priceMinor: 0 },
  ],
};

test('session complete → resolved from session verbatim', () => {
  const result = resolveLiveFacts({
    session: sessionComplete,
    workspace: { venueName: 'Other', placeCode: 'T9', placeCodes: ['T9'] },
  });
  assert.equal(result.resolved, true);
  if (!result.resolved) return;
  assert.equal(result.source, 'session');
  assert.equal(result.facts.venueName, 'Rusty Oak');
  assert.equal(result.facts.placeCode, 'T1');
  assert.deepEqual(result.facts.catalogue, sessionComplete.catalogue);
});

test('session venue wins over a different workspace venue', () => {
  const result = resolveLiveFacts({
    session: sessionComplete,
    workspace: { venueName: 'Workspace Oak', placeCode: 'T2' },
  });
  assert.equal(result.resolved, true);
  if (!result.resolved) return;
  assert.equal(result.facts.venueName, 'Rusty Oak');
});

test('session null, workspace complete → unresolved, all three missing', () => {
  const result = resolveLiveFacts({
    session: null,
    workspace: { venueName: 'Rusty Oak', placeCode: 'T1', placeCodes: ['T1'] },
  });
  assert.equal(result.resolved, false);
  if (result.resolved) return;
  assert.deepEqual(result.missing, ['venueName', 'placeCode', 'catalogue']);
  assert.equal(result.partial.venueName, 'Rusty Oak');
  assert.equal(result.partial.placeCode, 'T1');
});

test('session catalogue [] → catalogue missing', () => {
  const result = resolveLiveFacts({
    session: { venueName: 'Rusty Oak', placeCode: 'T1', catalogue: [] },
    workspace: null,
  });
  assert.equal(result.resolved, false);
  if (result.resolved) return;
  assert.ok(result.missing.includes('catalogue'));
});

test('session catalogue null → catalogue missing', () => {
  const result = resolveLiveFacts({
    session: { venueName: 'Rusty Oak', placeCode: 'T1', catalogue: null },
    workspace: null,
  });
  assert.equal(result.resolved, false);
  if (result.resolved) return;
  assert.ok(result.missing.includes('catalogue'));
});

test('zero-priced-only catalogue is missing (a priced item is required to open)', () => {
  const result = resolveLiveFacts({
    session: {
      venueName: 'Rusty Oak',
      placeCode: 'T1',
      catalogue: [{ label: 'Comped water', priceMinor: 0 }],
    },
    workspace: null,
  });
  assert.equal(result.resolved, false);
  if (result.resolved) return;
  assert.ok(result.missing.includes('catalogue'));
});

test('no session and no workspace venue → missing venueName, no registry literals', () => {
  const result = resolveLiveFacts({ session: null, workspace: null });
  assert.equal(result.resolved, false);
  if (result.resolved) return;
  assert.ok(result.missing.includes('venueName'));
  const dumped = JSON.stringify(result);
  assert.equal(dumped.includes('Table 12'), false);
  assert.equal(dumped.includes('Your place'), false);
});

test('4b identical missing-copy is not a pass — unresolved is 4c', () => {
  const gap = 'No priced menu yet · Add an item guests can order';
  const bothMissing = {
    resolved: false,
    venueName: 'Rusty Oak',
    placeCode: 'T1',
    firstCatalogueLine: gap,
  };
  const r = bar4bDeskPublicParity(bothMissing, bothMissing);
  assert.equal(r.id, '4c');
  assert.equal(r.pass, false);
});

test('4b passes only when both resolved and first lines match', () => {
  const side = {
    resolved: true,
    venueName: 'Rusty Oak',
    placeCode: 'T1',
    firstCatalogueLine: 'Chef’s Bowl · R140',
  };
  const r = bar4bDeskPublicParity(side, side);
  assert.equal(r.id, '4b');
  assert.equal(r.pass, true);
});

test('spokenPlaceLine joins with exactly one separator', () => {
  assert.equal(spokenPlaceLine({ venueName: 'Rusty Oak', placeCode: 'T1', catalogue: [] }), 'Rusty Oak · T1');
  assert.equal(spokenPlaceLine({ venueName: 'Rusty Oak', placeCode: '', catalogue: [] }), 'Rusty Oak');
  assert.equal(spokenPlaceLine({ venueName: '', placeCode: 'T1', catalogue: [] }), 'T1');
  assert.equal(spokenPlaceLine({ venueName: 'Rusty Oak', placeCode: 'T1', catalogue: [] }).endsWith(' ·'), false);
});
