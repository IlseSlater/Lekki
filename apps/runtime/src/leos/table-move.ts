export type MoveRefusal =
  | 'not_manager'
  | 'session_closed'
  | 'target_missing'
  | 'same_place'
  | 'target_busy';

export interface MoveInput {
  isManager: boolean;
  sessionStatus: string;
  fromCode: string;
  /** The place the manager chose, or null when no such place exists. */
  target: { code: string; activeSessionId: string | null } | null;
  sessionId: string;
}

const OPEN_STATUSES = new Set(['created', 'active', 'settling']);

/**
 * A manager moves an open bill from one table to another.
 * The bill, the guests, and the payments travel with the session. No POS call is made.
 */
export function planTableMove(input: MoveInput): { ok: true } | { ok: false; reason: MoveRefusal } {
  if (!input.isManager) return { ok: false, reason: 'not_manager' };
  if (!OPEN_STATUSES.has(input.sessionStatus)) return { ok: false, reason: 'session_closed' };
  if (!input.target) return { ok: false, reason: 'target_missing' };
  if (input.target.code.toLowerCase() === input.fromCode.toLowerCase()) {
    return { ok: false, reason: 'same_place' };
  }
  if (input.target.activeSessionId && input.target.activeSessionId !== input.sessionId) {
    return { ok: false, reason: 'target_busy' };
  }
  return { ok: true };
}

export function moveRefusalMessage(reason: MoveRefusal, targetCode?: string): string {
  switch (reason) {
    case 'not_manager':
      return 'Only a manager can move a bill.';
    case 'session_closed':
      return 'This bill is already closed.';
    case 'target_missing':
      return 'That table is not set up here.';
    case 'same_place':
      return 'The bill is already at that table.';
    case 'target_busy':
      return `${targetCode ? `Table ${targetCode}` : 'That table'} already has guests.`;
  }
}

export class TableMoveRefusedError extends Error {
  constructor(
    readonly reason: MoveRefusal,
    message: string,
  ) {
    super(message);
    this.name = 'TableMoveRefusedError';
  }
}

export function moveRefusalStatus(reason: MoveRefusal): number {
  if (reason === 'not_manager') return 403;
  if (reason === 'target_missing') return 404;
  return 409;
}
