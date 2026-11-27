/**
 * Which guest-app requests the preview answers itself — pure, no Angular.
 *
 * Reads of the venue and menu go to the real API. The table, orders, help and
 * payments are answered from the sample table. No write ever leaves the preview.
 */
import {
  PREVIEW_SESSION_ID,
  addOrder,
  askForHelp,
  claimLines,
  pay,
  previewSessionView,
  shareLine,
  type PreviewTable,
} from './preview-table';

export type PreviewAnswer = { handled: false } | { handled: true; status: number; body: unknown };

const S = `/sessions/${PREVIEW_SESSION_ID}`;

export function previewPath(url: string): string {
  try {
    return new URL(url, 'http://preview.local').pathname.replace(/\/+$/, '');
  } catch {
    return url.split(/[?#]/)[0].replace(/\/+$/, '');
  }
}

export function answerPreviewRequest(
  table: PreviewTable | null,
  method: string,
  url: string,
  body: unknown,
): PreviewAnswer {
  const path = previewPath(url);
  const m = method.toUpperCase();
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  if (m === 'GET' || m === 'HEAD') {
    if (path.endsWith(S)) {
      return table
        ? { handled: true, status: 200, body: previewSessionView(table) }
        : { handled: true, status: 404, body: { message: 'Preview not ready' } };
    }
    if (path.endsWith('/assistance')) {
      return { handled: true, status: 200, body: table ? table.help.map((h) => ({ ...h })) : [] };
    }
    // Venue, menu, brand assets — real.
    return { handled: false };
  }

  // Everything below is a write. It never leaves the preview.
  if (!table) return { handled: true, status: 200, body: { ok: true, preview: true } };

  if (path.endsWith('/transactions')) {
    return { handled: true, status: 200, body: addOrder(table, b as Parameters<typeof addOrder>[1]) };
  }
  if (path.endsWith(`/payments/request/${PREVIEW_SESSION_ID}`)) {
    return { handled: true, status: 200, body: pay(table, b as Parameters<typeof pay>[1]) };
  }
  if (path.endsWith(`${S}/claim-lines`)) {
    return { handled: true, status: 200, body: claimLines(table, b as Parameters<typeof claimLines>[1]) };
  }
  if (path.endsWith(`${S}/share-line`)) {
    return { handled: true, status: 200, body: shareLine(table, b as Parameters<typeof shareLine>[1]) };
  }
  if (path.endsWith(`${S}/leave`)) {
    return { handled: true, status: 200, body: { closed: false } };
  }
  if (path.endsWith('/note/reply')) {
    // No manager in the preview, so no reply.
    return { handled: true, status: 200, body: { reply: null } };
  }
  if (path.endsWith('/assistance')) {
    return { handled: true, status: 200, body: askForHelp(table, b as Parameters<typeof askForHelp>[1]) };
  }
  return { handled: true, status: 200, body: { ok: true, preview: true } };
}
