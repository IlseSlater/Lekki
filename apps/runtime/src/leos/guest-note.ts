export const MAX_GUEST_NOTE_LENGTH = 1000;

export class GuestNoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuestNoteError';
  }
}

/** Text only. Trimmed, bounded, never empty. */
export function normaliseGuestNote(input: unknown): string {
  if (typeof input !== 'string') throw new GuestNoteError('Write a few words for the manager');
  const body = input.replace(/\s+/g, ' ').trim();
  if (!body) throw new GuestNoteError('Write a few words for the manager');
  return body.length > MAX_GUEST_NOTE_LENGTH ? body.slice(0, MAX_GUEST_NOTE_LENGTH) : body;
}

export const MAX_NOTE_REPLY_LENGTH = 500;

/** A reply: text only, trimmed, bounded, never empty. */
export function normaliseNoteReply(input: unknown): string {
  if (typeof input !== 'string') throw new GuestNoteError('Write a reply first');
  const body = input.replace(/\s+/g, ' ').trim();
  if (!body) throw new GuestNoteError('Write a reply first');
  return body.length > MAX_NOTE_REPLY_LENGTH ? body.slice(0, MAX_NOTE_REPLY_LENGTH) : body;
}

/**
 * One reply per note, so a guest never sees it change under them and the team
 * never double-answers. Later thoughts go to the guest in person.
 */
export function replyRefusal(note: { repliedAt: Date | null } | null): string | null {
  if (!note) return 'Note not found';
  if (note.repliedAt) return 'This note already has a reply.';
  return null;
}

/** What the guest sees: the newest reply to their own notes, or nothing. */
export function replyForGuest(
  notes: readonly { replyBody: string | null; repliedAt: Date | null; repliedByName: string | null }[],
): { reply: string; repliedAt: string; by: string } | null {
  const replied = notes
    .filter((n) => n.replyBody && n.repliedAt)
    .sort((a, b) => b.repliedAt!.getTime() - a.repliedAt!.getTime());
  const top = replied[0];
  if (!top) return null;
  // First name only — the guest is told who, without the full name of a staff member.
  const by = (top.repliedByName ?? '').trim().split(/\s+/)[0] || 'The manager';
  return { reply: top.replyBody!, repliedAt: top.repliedAt!.toISOString(), by };
}
