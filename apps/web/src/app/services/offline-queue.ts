/**
 * Offline action queue stub (Phase 1 quality bar).
 * Full sync/conflict resolution lands in a later Offline LEK.
 */
export type OfflineActionType =
  | 'transaction.create'
  | 'fulfilment.status'
  | 'payment.request'
  | 'assistance.request'
  | 'session.close';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

const STORAGE_KEY = 'leos.offline.queue';

export class OfflineQueue {
  private read(): OfflineAction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: OfflineAction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  enqueue(type: OfflineActionType, payload: Record<string, unknown>): OfflineAction {
    const action: OfflineAction = {
      id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    const items = this.read();
    items.push(action);
    this.write(items);
    return action;
  }

  peek(): OfflineAction[] {
    return this.read();
  }

  async flush(
    handler: (action: OfflineAction) => Promise<void>,
  ): Promise<{ flushed: number; failed: number }> {
    const items = this.read();
    const remaining: OfflineAction[] = [];
    let flushed = 0;
    let failed = 0;

    for (const action of items) {
      try {
        await handler(action);
        flushed += 1;
      } catch {
        remaining.push({ ...action, attempts: action.attempts + 1 });
        failed += 1;
      }
    }

    this.write(remaining);
    return { flushed, failed };
  }

  clear() {
    this.write([]);
  }

  hasPending(type?: OfflineActionType): boolean {
    const items = this.read();
    if (!type) return items.length > 0;
    return items.some((a) => a.type === type);
  }
}

export const offlineQueue = new OfflineQueue();
