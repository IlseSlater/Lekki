/**
 * Who hears that food is ready: the table's waiter, and only when that waiter has a phone
 * registered. A table nobody has taken yet alerts every registered waiter, so ready food is never silent.
 */
export interface WaiterDevice {
  staffMemberId: string;
  endpoint: string;
}

export function readyAudience<T extends WaiterDevice>(
  tableWaiterId: string | null | undefined,
  devices: readonly T[],
): T[] {
  if (tableWaiterId) {
    const theirs = devices.filter((d) => d.staffMemberId === tableWaiterId);
    if (theirs.length) return theirs;
  }
  return [...devices];
}

export interface ReadyAlertInput {
  placeLabel: string | null | undefined;
  itemLabels: readonly string[];
  sessionId: string;
}

/**
 * Angular's service worker shows the `notification` object the moment the push arrives,
 * so the waiter sees it without opening the app.
 */
export function readyAlertPayload(input: ReadyAlertInput) {
  const place = input.placeLabel?.trim() || 'a table';
  const items = input.itemLabels.filter(Boolean);
  const body =
    items.length === 0
      ? 'Ready to collect'
      : items.length <= 3
        ? items.join(', ')
        : `${items.slice(0, 3).join(', ')} and ${items.length - 3} more`;
  return {
    notification: {
      title: `Ready for ${place}`,
      body,
      tag: `ready-${input.sessionId}`,
      renotify: true,
      data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: '/service' } } },
    },
  };
}

/** A table can be taken by one waiter. A manager can reassign. */
export function canTakeTable(
  currentWaiterId: string | null | undefined,
  staffId: string,
  isManager: boolean,
): boolean {
  return !currentWaiterId || currentWaiterId === staffId || isManager;
}

/** Bad subscriptions (gone, expired) are removed when the push service says so. */
export function isGoneStatus(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}
