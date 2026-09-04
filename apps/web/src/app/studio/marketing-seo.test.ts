import assert from 'node:assert/strict';
import test from 'node:test';
import { lekkiJsonLd, seoForPath } from './marketing-seo';

test('Batch 7: home, privacy, and terms have distinct titles', () => {
  const home = seoForPath('/');
  const privacy = seoForPath('/privacy');
  const terms = seoForPath('/terms');
  assert.notEqual(home.title, privacy.title);
  assert.notEqual(home.title, terms.title);
  assert.match(home.title, /Lekki/);
  assert.match(home.description, /menu/i);
});

test('Batch 7: JSON-LD includes Organization and SoftwareApplication', () => {
  const ld = lekkiJsonLd();
  const graph = ld['@graph'] as Array<Record<string, unknown>>;
  assert.ok(Array.isArray(graph));
  const types = graph.map((n) => n['@type']);
  assert.ok(types.includes('Organization'));
  assert.ok(types.includes('SoftwareApplication'));
});
