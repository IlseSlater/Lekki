import assert from 'node:assert/strict';
import test from 'node:test';
import { composeLeaveOpenCopy } from './leave-open-continuity';

test('visit still open: affirm leave · no wizard · primary I’m finished', () => {
  const copy = composeLeaveOpenCopy(42.5, 'All done here?', 'Table 12');
  assert.equal(copy.title, 'You’re free to leave');
  assert.match(copy.lead, /Others can still settle/);
  assert.equal(copy.showVisitOpen, true);
  assert.equal(copy.primary, 'I’m finished');
  assert.doesNotMatch(`${copy.title} ${copy.lead}`, /cover|wizard|allocate/i);
});

test('visit cleared: keeps calm confirm title and stay lead', () => {
  const copy = composeLeaveOpenCopy(0, 'All done here?', 'Table 12');
  assert.equal(copy.title, 'All done here?');
  assert.equal(copy.lead, 'Stay if you still need anything.');
  assert.equal(copy.showVisitOpen, false);
  assert.match(copy.body, /Table 12/);
});

test('hotel pack cleared title preserved', () => {
  const copy = composeLeaveOpenCopy(null, 'End your stay?', 'Room 101');
  assert.equal(copy.title, 'End your stay?');
  assert.equal(copy.showVisitOpen, false);
});

test('tiny remainder still counts as visit open', () => {
  const copy = composeLeaveOpenCopy(0.01, 'All done here?', 'Counter');
  assert.equal(copy.showVisitOpen, true);
  assert.equal(copy.title, 'You’re free to leave');
});
