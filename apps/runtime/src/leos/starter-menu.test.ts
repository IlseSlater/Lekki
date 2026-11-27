import assert from 'node:assert/strict';
import test from 'node:test';
import { planStarterMenu } from './starter-menu';

test('an empty menu gets a short priced starter', () => {
  const items = planStarterMenu(0, 'restaurant');
  assert.ok(items.length >= 4 && items.length <= 8);
  for (const item of items) {
    assert.ok(item.label.trim().length > 0);
    assert.ok(item.unitPrice > 0, item.label);
    assert.equal(item.currency, 'ZAR');
    assert.ok(item.routingTags.length > 0);
  }
});

test('the starter covers food and drinks so both stations have work', () => {
  const tags = new Set(planStarterMenu(0, 'restaurant').flatMap((i) => i.routingTags));
  assert.ok(tags.has('food'));
  assert.ok(tags.has('beverage'));
});

test('a venue with any dish is left alone', () => {
  assert.deepEqual(planStarterMenu(1, 'restaurant'), []);
  assert.deepEqual(planStarterMenu(12, 'cafe'), []);
});

test('cafe starter has no restaurant-only choice groups and no ids', () => {
  const items = planStarterMenu(0, 'cafe');
  assert.ok(items.length > 0);
  for (const item of items) {
    assert.equal((item as { id?: string }).id, undefined);
    assert.equal((item as { choiceGroups?: unknown }).choiceGroups, undefined);
  }
});

test('types without a starter get nothing', () => {
  assert.deepEqual(planStarterMenu(0, 'hotel'), []);
});

test('callers cannot mutate the shared starter', () => {
  const a = planStarterMenu(0, 'restaurant');
  a[0].routingTags.push('mutated');
  const b = planStarterMenu(0, 'restaurant');
  assert.ok(!b[0].routingTags.includes('mutated'));
});
