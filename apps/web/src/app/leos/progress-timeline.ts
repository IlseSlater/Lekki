import type { StationKind } from '../studio/operate-status';
import { stationKindFromId } from '../studio/operate-status';

/** Platform Status Timeline step ids (LEK-028 Frozen). */
export type PlatformProgressStep =
  | 'submitted'
  | 'accepted'
  | 'in_progress'
  | 'ready'
  | 'completed';

const PLATFORM_ORDER: PlatformProgressStep[] = [
  'submitted',
  'accepted',
  'in_progress',
  'ready',
  'completed',
];

/** Map Capability FulfilmentStatus → platform progress step. */
export function fulfilmentStatusToPlatformStep(status: string): PlatformProgressStep {
  const s = status.toLowerCase();
  switch (s) {
    case 'created':
      return 'submitted';
    case 'pending':
      return 'accepted';
    case 'preparing':
      return 'in_progress';
    case 'ready':
      return 'ready';
    case 'delivered':
    case 'completed':
      return 'completed';
    default:
      return 'submitted';
  }
}

/** Restaurant Pack labels — concierge language (who / what’s happening). */
export const RESTAURANT_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Order received',
  accepted: 'Order confirmed',
  in_progress: 'Preparing',
  ready: 'On the way',
  completed: 'Enjoy your meal',
};

/** Café Pack labels — counter pickup language. */
export const CAFE_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Order taken',
  accepted: 'Queued',
  in_progress: 'Making',
  ready: 'Ready for pickup',
  completed: 'Collected',
};

/** Hotel Pack labels. */
export const HOTEL_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Requested',
  accepted: 'Assigned',
  in_progress: 'In progress',
  ready: 'At door',
  completed: 'Delivered',
};

/** Festival Pack labels. */
export const FESTIVAL_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Order in',
  accepted: 'Queued',
  in_progress: 'Making',
  ready: 'Ready to collect',
  completed: 'Collected',
};

/** Airport Pack labels. */
export const AIRPORT_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Order placed',
  accepted: 'Received',
  in_progress: 'Preparing',
  ready: 'Ready at counter',
  completed: 'Collected',
};

/** Healthcare Pack labels. */
export const HEALTHCARE_PROGRESS_LABELS: Record<PlatformProgressStep, string> = {
  submitted: 'Requested',
  accepted: 'Received',
  in_progress: 'Preparing',
  ready: 'Ready for you',
  completed: 'Collected',
};

export function progressLabelsForProfile(
  profileId: string,
): Record<PlatformProgressStep, string> {
  if (profileId === 'profile-healthcare') return HEALTHCARE_PROGRESS_LABELS;
  if (profileId === 'profile-airport') return AIRPORT_PROGRESS_LABELS;
  if (profileId === 'profile-festival') return FESTIVAL_PROGRESS_LABELS;
  if (profileId === 'profile-hotel') return HOTEL_PROGRESS_LABELS;
  if (profileId === 'profile-cafe') return CAFE_PROGRESS_LABELS;
  return RESTAURANT_PROGRESS_LABELS;
}

export function buildStatusTimelineSteps(
  fulfilmentStatus: string,
  labels: Record<PlatformProgressStep, string> = RESTAURANT_PROGRESS_LABELS,
): Array<{ id: PlatformProgressStep; label: string; state: 'upcoming' | 'current' | 'done' }> {
  const current = fulfilmentStatusToPlatformStep(fulfilmentStatus);
  const currentIndex = PLATFORM_ORDER.indexOf(current);
  return PLATFORM_ORDER.map((id, index) => ({
    id,
    label: labels[id],
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
  }));
}

export function progressGuidance(
  fulfilmentStatus: string,
  labels: Record<PlatformProgressStep, string> = RESTAURANT_PROGRESS_LABELS,
  stationId?: string,
): string {
  const current = fulfilmentStatusToPlatformStep(fulfilmentStatus);
  const idx = PLATFORM_ORDER.indexOf(current);
  const kind: StationKind = stationKindFromId(stationId || '');

  if (current === 'completed') {
    if (labels.completed.toLowerCase().includes('deliver')) return 'All done — it’s with you.';
    return 'All done — enjoy.';
  }
  if (current === 'ready') {
    if (labels.ready.toLowerCase().includes('to collect')) {
      return 'They’re waiting for you at the stall.';
    }
    if (
      labels.ready.toLowerCase().includes('pickup') ||
      labels.ready.toLowerCase().includes('collect') ||
      labels.ready.toLowerCase().includes('at counter')
    ) {
      return 'They’re waiting for you at the counter.';
    }
    if (labels.ready.toLowerCase().includes('door')) {
      return 'It’s at your door — open when ready.';
    }
    if (labels.ready.toLowerCase().includes('ready for you')) {
      return 'It’s ready for you — collect when you’re called.';
    }
    if (kind === 'bar') return 'Your waiter is bringing your drinks.';
    if (kind === 'kitchen') return 'Your waiter is bringing your food.';
    return 'Your waiter is on the way with your order.';
  }
  if (current === 'in_progress') {
    if (labels.ready.toLowerCase().includes('door')) {
      return 'Room service is preparing your request.';
    }
    if (labels.ready.toLowerCase().includes('to collect')) {
      return 'The stall is making it now.';
    }
    if (labels.ready.toLowerCase().includes('at counter')) {
      return 'The gate café is preparing your order.';
    }
    if (labels.ready.toLowerCase().includes('ready for you')) {
      return 'They’re preparing your request now.';
    }
    if (kind === 'bar') return 'Bar is preparing your drinks.';
    if (kind === 'kitchen') return 'Kitchen is preparing your food.';
    if (kind === 'counter') return 'They’re making it now.';
    return 'Your order was placed successfully — staff can see it and they’re on it.';
  }
  if (current === 'accepted') {
    if (labels.accepted.toLowerCase().includes('queued')) {
      return 'Your order was placed successfully — staff can see it and they’re on it.';
    }
    return 'Your order was placed successfully — staff can see it and they’re on it.';
  }
  if (current === 'submitted') {
    if (labels.submitted.toLowerCase().includes('request')) {
      return 'Request received — the team can see it.';
    }
    if (labels.submitted.toLowerCase().includes('order in')) {
      return 'Your order was placed successfully — the stall can see it and they’re on it.';
    }
    if (labels.submitted.toLowerCase().includes('order placed')) {
      return 'Your order was placed successfully — the gate team can see it and they’re on it.';
    }
    return 'Your order was placed successfully — staff can see it and they’re on it.';
  }
  const next = PLATFORM_ORDER[idx + 1];
  return next ? `Next up: ${labels[next]}` : 'Hang tight — an update is coming.';
}
