import assert from 'node:assert/strict';
import test from 'node:test';
import { answersDoorLabel, composeAnswersConfirm, ANSWERS_ERROR } from './grow-answers';

test('door labels are plain-term periods, never a date picker', () => {
  assert.equal(answersDoorLabel('week'), "Email last week's orders →");
  assert.equal(answersDoorLabel('month'), "Email this month's orders →");
});

test('confirmation is one calm line naming the destination', () => {
  assert.equal(composeAnswersConfirm('owner@venue.com'), 'On its way to owner@venue.com.');
});

test('confirmation never mentions a report, export, or CSV to the guest-facing owner copy', () => {
  const line = composeAnswersConfirm('owner@venue.com');
  assert.doesNotMatch(line, /report|export|csv|download/i);
});

test('error copy stays calm, not technical', () => {
  assert.doesNotMatch(ANSWERS_ERROR, /error|failed|exception/i);
});
