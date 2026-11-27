/**
 * Small asks from the table. One tap, named to the table's waiter.
 * The message travels with the help request so the waiter sees exactly what to bring.
 */
export interface HelpPreset {
  id: 'water' | 'cutlery' | 'card-machine' | 'cash-bill';
  label: string;
  /** What the waiter reads. */
  message: string;
}

export const HELP_PRESETS: readonly HelpPreset[] = [
  { id: 'water', label: 'Water', message: 'Water for the table' },
  { id: 'cutlery', label: 'Cutlery', message: 'Cutlery for the table' },
  { id: 'card-machine', label: 'Card machine', message: 'Card machine to the table' },
  { id: 'cash-bill', label: 'Cash bill', message: 'Cash bill to the table' },
];

export const MAX_NOTE_LENGTH = 120;

/** A note is a few words of text. Empty notes are not sent. */
export function noteMessage(note: string): string | null {
  const text = note.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH);
  return text ? `Note: ${text}` : null;
}

/** Messages that name something to bring show on the waiter card. The generic ask does not. */
export function isSpecificAsk(message: string | undefined | null): boolean {
  const text = message?.trim();
  if (!text) return false;
  return !/^guest asked (for help|to speak)/i.test(text);
}
