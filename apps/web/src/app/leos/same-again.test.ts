import assert from 'node:assert/strict';
import test from 'node:test';
import { sameAgainLines, sameAgainSummary, type MenuEntry, type PastTransaction } from './same-again';

const menu: MenuEntry[] = [
  { id: 'cola', label: 'Cola', unitPrice: 30, routingTags: ['cold'] },
  { id: 'lager', label: 'Lager', unitPrice: 45, routingTags: ['cold'] },
  { id: 'burger', label: 'Burger', unitPrice: 120, routingTags: ['hot'], needsChoices: true },
  { id: 'sold', label: 'Soup', unitPrice: 60, routingTags: ['hot'], available: false },
];

const tx = (id: string, createdAt: string, lines: PastTransaction['lines']): PastTransaction => ({
  id,
  createdAt,
  lines,
});

test('the latest round comes back at today’s prices', () => {
  const lines = sameAgainLines(
    [
      tx('1', '2026-01-01T18:00:00Z', [{ catalogueItemId: 'lager', label: 'Lager', quantity: 1 }]),
      tx('2', '2026-01-01T19:00:00Z', [
        { catalogueItemId: 'cola', label: 'Cola', quantity: 2 },
        { catalogueItemId: 'lager', label: 'Lager', quantity: 1 },
      ]),
    ],
    null,
    menu,
    false,
  );
  assert.deepEqual(lines.map((l) => [l.catalogueItemId, l.quantity, l.unitPrice]), [
    ['cola', 2, 30],
    ['lager', 1, 45],
  ]);
});

test('at a shared table only my lines come back', () => {
  const lines = sameAgainLines(
    [
      tx('1', '2026-01-01T19:00:00Z', [
        { catalogueItemId: 'cola', label: 'Cola', quantity: 1, participantId: 'a' },
        { catalogueItemId: 'lager', label: 'Lager', quantity: 1, participantId: 'b' },
      ]),
    ],
    'b',
    menu,
    true,
  );
  assert.deepEqual(lines.map((l) => l.catalogueItemId), ['lager']);
});

test('dishes that need choices, sold-out dishes, and customised lines stay out', () => {
  const lines = sameAgainLines(
    [
      tx('1', '2026-01-01T19:00:00Z', [
        { catalogueItemId: 'burger', label: 'Burger', quantity: 1 },
        { catalogueItemId: 'sold', label: 'Soup', quantity: 1 },
        { catalogueItemId: 'cola', label: 'Cola', quantity: 1, selectionsJson: [{ groupId: 'ice' }] },
        { catalogueItemId: 'lager', label: 'Lager', quantity: 1 },
      ]),
    ],
    null,
    menu,
    false,
  );
  assert.deepEqual(lines.map((l) => l.catalogueItemId), ['lager']);
});

test('no past order means no button', () => {
  assert.deepEqual(sameAgainLines([], 'a', menu, true), []);
});

test('summary reads like a drinks order', () => {
  assert.equal(
    sameAgainSummary([
      { catalogueItemId: 'cola', label: 'Cola', quantity: 2, unitPrice: 30, routingTags: [] },
      { catalogueItemId: 'lager', label: 'Lager', quantity: 1, unitPrice: 45, routingTags: [] },
    ]),
    '2 Cola, Lager',
  );
});
