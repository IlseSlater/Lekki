import assert from 'node:assert/strict';
import test from 'node:test';
import {
  composeFeedbackCopy,
  encodeFeedbackMessage,
  parseFeedbackMessage,
} from './grow-feedback';

test('quiet night when no tones', () => {
  const copy = composeFeedbackCopy({ tones: [], participantNounPlural: 'Guests' });
  assert.equal(copy.sentiment, 'quiet');
  assert.match(copy.sentimentLine, /Quiet night — no feedback yet/);
  assert.equal(copy.flaggedLine, '');
});

test('all delighted reads as one calm sentence', () => {
  const copy = composeFeedbackCopy({
    tones: ['delighted', 'delighted'],
    participantNounPlural: 'Guests',
  });
  assert.equal(copy.sentiment, 'delighted');
  assert.equal(copy.sentimentLine, 'Guests were delighted.');
});

test('any concern → mixed — never a star breakdown', () => {
  const copy = composeFeedbackCopy({
    tones: ['delighted', 'concern'],
    participantNounPlural: 'Guests',
    flagged: {
      id: 'asst_1',
      text: 'Fries were cold',
      guestFirstName: 'Sam',
      canReply: true,
    },
  });
  assert.equal(copy.sentiment, 'mixed');
  assert.match(copy.sentimentLine, /mixed feelings/);
  assert.match(copy.flaggedLine, /Sam said/);
  assert.match(copy.flaggedLine, /Fries were cold/);
  assert.doesNotMatch(copy.sentimentLine, /star|rating|\/5/i);
});

test('encode/parse round-trip — no vendor nouns', () => {
  const raw = encodeFeedbackMessage('concern', 'Wait felt long');
  assert.doesNotMatch(raw, /PayFast|Stripe|Uber/i);
  const parsed = parseFeedbackMessage(raw);
  assert.deepEqual(parsed, { tone: 'concern', text: 'Wait felt long' });
});

test('delighted encode has no empty review list shape', () => {
  const raw = encodeFeedbackMessage('delighted');
  assert.equal(parseFeedbackMessage(raw)?.tone, 'delighted');
  assert.doesNotMatch(raw, /reviews|0 reviews/i);
});
