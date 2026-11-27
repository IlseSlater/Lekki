import { whatsappShareUrl } from './review-links';

export interface ReceiptLine {
  quantity: number;
  label: string;
  /** Major units (rand). */
  total: number;
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** WhatsApp clips long pre-filled messages, so the receipt stays well inside this. */
export const RECEIPT_CHAR_BUDGET = 800;
const MAX_LABEL = 40;

function clip(label: string): string {
  const t = label.trim();
  return t.length > MAX_LABEL ? `${t.slice(0, MAX_LABEL - 1)}…` : t;
}

/**
 * The receipt as plain text the guest sends to themselves. Only real amounts appear.
 * A big check shows its first lines and "and N more", and the amount paid always stays at the bottom.
 */
export function receiptText(input: {
  place: string;
  lines: ReceiptLine[];
  paid: number;
  currency: string;
  when?: Date;
}): string {
  const place = input.place.trim();
  const when = input.when ?? new Date();
  const date = when.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  const head = [place ? `Your receipt from ${place.slice(0, 60)}` : 'Your receipt', date];
  const foot: string[] = [];
  if (input.paid > 0) foot.push('', `Paid ${money(input.paid, input.currency)}`);
  foot.push('', 'Thank you.');

  const lines = input.lines.filter((l) => l.quantity > 0 && l.label.trim());
  const rows = lines.map((l) => `${l.quantity}× ${clip(l.label)} — ${money(l.total, input.currency)}`);

  const fixed = [...head, ...foot].join('\n').length + 40; // room for the "and N more" line
  const kept: string[] = [];
  let used = fixed;
  for (const row of rows) {
    if (used + row.length + 1 > RECEIPT_CHAR_BUDGET) break;
    kept.push(row);
    used += row.length + 1;
  }
  const hidden = rows.length - kept.length;
  const body = rows.length ? ['', ...kept, ...(hidden > 0 ? [`…and ${hidden} more`] : [])] : [];
  return [...head, ...body, ...foot].join('\n');
}

/** WhatsApp opens its share sheet; the guest picks the chat. */
export function whatsappReceiptUrl(text: string): string {
  return whatsappShareUrl(text, '');
}