export const MAX_ASSISTANCE_MESSAGE = 160;

/** Guests send a few words ("Water for the table"). Keep them short and clean. */
export function cleanAssistanceMessage(message: string | undefined | null): string | undefined {
  const text = (message ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_ASSISTANCE_MESSAGE);
  return text || undefined;
}

/**
 * One open ask per kind and wording. Water and cutlery can both be open at one table,
 * while a second tap on the same ask returns the open one.
 */
export function isSameAsk(
  open: { kind: string; message?: string | null },
  next: { kind: string; message?: string },
): boolean {
  return open.kind === next.kind && (open.message ?? '') === (next.message ?? '');
}
