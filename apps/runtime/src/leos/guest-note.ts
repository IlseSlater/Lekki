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
