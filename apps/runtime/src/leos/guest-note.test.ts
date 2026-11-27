import assert from 'node:assert/strict';
import test from 'node:test';
import { GuestNoteError, MAX_GUEST_NOTE_LENGTH, normaliseGuestNote } from './guest-note';

test('a note is trimmed and its whitespace collapsed', () => {
  assert.equal(normaliseGuestNote('  The   soup was cold \n'), 'The soup was cold');
});

test('empty and non-text notes are refused', () => {
  for (const bad of ['', '   ', 42, null, undefined, {}]) {
    assert.throws(() => normaliseGuestNote(bad), GuestNoteError);
  }
});

test('a long note is cut at the limit', () => {
  const note = normaliseGuestNote('a'.repeat(MAX_GUEST_NOTE_LENGTH + 50));
  assert.equal(note.length, MAX_GUEST_NOTE_LENGTH);
});
