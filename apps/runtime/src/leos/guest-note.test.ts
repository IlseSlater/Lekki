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

test('a reply is text, trimmed and bounded', async () => {
  const { normaliseNoteReply, MAX_NOTE_REPLY_LENGTH } = await import('./guest-note');
  assert.equal(normaliseNoteReply('  Thank   you!  '), 'Thank you!');
  assert.equal(normaliseNoteReply('x'.repeat(900)).length, MAX_NOTE_REPLY_LENGTH);
  assert.throws(() => normaliseNoteReply('   '));
  assert.throws(() => normaliseNoteReply(42));
});

test('one reply per note', async () => {
  const { replyRefusal } = await import('./guest-note');
  assert.equal(replyRefusal(null), 'Note not found');
  assert.equal(replyRefusal({ repliedAt: new Date() }), 'This note already has a reply.');
  assert.equal(replyRefusal({ repliedAt: null }), null);
});

test('the guest sees the newest reply, signed with a first name', async () => {
  const { replyForGuest } = await import('./guest-note');
  assert.equal(replyForGuest([{ replyBody: null, repliedAt: null, repliedByName: null }]), null);
  const got = replyForGuest([
    { replyBody: 'old', repliedAt: new Date('2026-11-27T10:00:00Z'), repliedByName: 'Thandi M' },
    { replyBody: 'new', repliedAt: new Date('2026-11-27T11:00:00Z'), repliedByName: 'Sipho Dlamini' },
  ]);
  assert.deepEqual(got, { reply: 'new', repliedAt: '2026-11-27T11:00:00.000Z', by: 'Sipho' });
  assert.equal(replyForGuest([{ replyBody: 'x', repliedAt: new Date(), repliedByName: '' }])?.by, 'The manager');
});
