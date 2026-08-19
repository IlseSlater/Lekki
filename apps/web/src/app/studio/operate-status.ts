/**
 * Operate + guest status language — aligned with Restaurant App rules.
 *
 * Kitchen / Bar: PENDING → PREPARING → READY (waiter serves)
 * Waiter (Floor): READY → SERVED (delivered)
 * Counter (café): PENDING → PREPARING → READY → COLLECTED (self-serve end)
 * Guest: Pending · Preparing · Ready · Served (+ ready banner)
 */

export type StationKind = 'kitchen' | 'bar' | 'counter' | 'generic';

export type FulfilmentStatus =
  | 'created'
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export function stationKindFromId(stationId: string): StationKind {
  const id = (stationId || '').toLowerCase();
  if (id.includes('bar') && !id.includes('barista')) return 'bar';
  if (id.includes('counter') || id.includes('cafe') || id.includes('café')) return 'counter';
  if (id.includes('kitchen') || id.includes('food-truck') || id.includes('room-service')) {
    return 'kitchen';
  }
  if (id.includes('clinic-cafe') || id.includes('gate-cafe')) return 'counter';
  return 'generic';
}

export function normStatus(status: string): string {
  return (status || '').toLowerCase();
}

/** Station board status chip */
export function stationStatusLabel(status: string, kind: StationKind): string {
  const s = normStatus(status);
  if (kind === 'counter') {
    if (s === 'preparing') return 'Making';
    if (s === 'ready') return 'Pickup';
    if (s === 'pending' || s === 'created') return 'Queued';
  }
  if (kind === 'bar') {
    if (s === 'preparing') return 'Pouring';
    if (s === 'ready') return 'Ready';
    if (s === 'pending' || s === 'created') return 'New';
  }
  if (s === 'preparing') return 'Preparing';
  if (s === 'ready') return 'Ready';
  if (s === 'pending' || s === 'created') return 'New';
  return status;
}

/**
 * Next action on station.
 * Kitchen/Bar stop at Ready (Waiter serves). Counter collects.
 */
export function stationActionHint(status: string, kind: StationKind): string {
  const s = normStatus(status);
  if (kind === 'bar') {
    if (s === 'pending' || s === 'created') return 'Start pouring ›';
    if (s === 'preparing') return 'Drinks ready ›';
    if (s === 'ready') return 'Waiter serves ›';
  }
  if (kind === 'counter') {
    if (s === 'pending' || s === 'created') return 'Start ›';
    if (s === 'preparing') return 'Ready ›';
    if (s === 'ready') return 'Collected ›';
  }
  // kitchen + generic
  if (s === 'pending' || s === 'created') return 'Start prep ›';
  if (s === 'preparing') return 'Mark ready ›';
  if (s === 'ready') return 'Waiter serves ›';
  return '›';
}

export function stationPrimaryCta(status: string | null, kind: StationKind): string {
  if (!status) return 'All clear';
  const s = normStatus(status);
  if (kind === 'bar') {
    if (s === 'pending' || s === 'created') return 'Start pouring';
    if (s === 'preparing') return 'Drinks ready';
    if (s === 'ready') return 'Waiting for waiter';
  }
  if (kind === 'counter') {
    if (s === 'pending' || s === 'created') return 'Start next';
    if (s === 'preparing') return 'Mark next ready';
    if (s === 'ready') return 'Mark next collected';
  }
  if (s === 'pending' || s === 'created') return 'Start next prep';
  if (s === 'preparing') return 'Mark next ready';
  if (s === 'ready') return 'Waiting for waiter';
  return 'All clear';
}

/** Can this station advance this status? Kitchen/bar cannot mark served. */
export function stationCanAdvance(status: string, kind: StationKind): boolean {
  const s = normStatus(status);
  if (s === 'pending' || s === 'created' || s === 'preparing') return true;
  if (s === 'ready') return kind === 'counter';
  return false;
}

export function nextStationStatus(status: string, kind: StationKind): string | null {
  const s = normStatus(status);
  if (s === 'pending' || s === 'created') return 'preparing';
  if (s === 'preparing') return 'ready';
  if (s === 'ready' && kind === 'counter') return 'delivered';
  return null;
}

export function stationFlash(statusWritten: string, kind: StationKind): string {
  if (statusWritten === 'preparing') {
    return kind === 'bar' ? 'Pouring — guests can see it.' : 'In progress — guests can see it.';
  }
  if (statusWritten === 'ready') {
    return kind === 'counter'
      ? 'Ready for pickup — guests can see it.'
      : 'Ready — waiter can serve.';
  }
  if (statusWritten === 'delivered') {
    return kind === 'counter' ? 'Collected.' : 'Done for this ticket.';
  }
  return 'Updated.';
}

/** Waiter / Floor role label — restaurant = Waiter, café = Floor */
export function floorRoleLabel(kindHint: 'cafe' | 'restaurant' | 'generic' = 'restaurant'): string {
  return kindHint === 'cafe' ? 'Floor' : 'Waiter';
}

export function stationHandOffFlash(kind: StationKind): string {
  return kind === 'counter'
    ? 'Ready — open Floor to collect.'
    : 'Ready — open Waiter to serve.';
}

/** Floor / Waiter ready-to-serve */
export function floorServeHint(kindHint: 'cafe' | 'restaurant' | 'generic' = 'restaurant'): string {
  return kindHint === 'cafe' ? 'Collected ›' : 'Served ›';
}

export function floorServeCta(kindHint: 'cafe' | 'restaurant' | 'generic' = 'restaurant'): string {
  return kindHint === 'cafe' ? 'Mark next collected' : 'Mark next served';
}

export function floorServeFlash(kindHint: 'cafe' | 'restaurant' | 'generic' = 'restaurant'): string {
  return kindHint === 'cafe'
    ? 'Collected — guest can see it.'
    : 'Served — guest can see it.';
}

/** Guest chip labels — concierge calm (not backend nouns). */
export function guestStatusLabel(status: string, profileIdOrType?: string): string {
  const id = (profileIdOrType || '').toLowerCase();
  const hotel = id.includes('hotel');
  const healthcare = id.includes('healthcare');
  const festival = id.includes('festival');
  const airport = id.includes('airport');
  const cafe = id.includes('cafe') || id.includes('café');
  const s = normStatus(status);
  if (s === 'pending' || s === 'created') {
    if (hotel || healthcare) return 'Requested';
    if (festival) return 'Order in';
    if (airport) return 'Order placed';
    return cafe ? 'Order taken' : 'Order received';
  }
  if (s === 'preparing' || s === 'confirmed') {
    if (hotel) return 'In progress';
    if (healthcare || airport) return 'Preparing';
    if (festival || cafe) return 'Making';
    return 'Preparing';
  }
  if (s === 'ready') {
    if (hotel) return 'At door';
    if (healthcare) return 'Ready for you';
    if (festival) return 'Ready to collect';
    if (airport) return 'Ready at counter';
    return cafe ? 'Ready for pickup' : 'On the way';
  }
  if (s === 'served' || s === 'delivered' || s === 'completed' || s === 'collected') {
    if (hotel) return 'Delivered';
    if (festival || cafe || airport || healthcare) return 'Collected';
    return 'Enjoy';
  }
  if (s === 'cancelled') return 'Cancelled';
  if (hotel) return status || 'Requested';
  if (healthcare) return status || 'Requested';
  if (festival) return status || 'Order in';
  if (airport) return status || 'Order placed';
  return status || (cafe ? 'Order taken' : 'Order received');
}

/** Orders legend — same nouns as chips for the active profile. */
export function guestOrdersLegend(profileIdOrType?: string): {
  pending: string;
  prep: string;
  ready: string;
  done: string;
} {
  const id = (profileIdOrType || '').toLowerCase();
  if (id.includes('hotel')) {
    return { pending: 'Requested', prep: 'In progress', ready: 'At door', done: 'Delivered' };
  }
  if (id.includes('healthcare')) {
    return {
      pending: 'Requested',
      prep: 'Preparing',
      ready: 'Ready for you',
      done: 'Collected',
    };
  }
  if (id.includes('festival')) {
    return {
      pending: 'Order in',
      prep: 'Making',
      ready: 'Ready to collect',
      done: 'Collected',
    };
  }
  if (id.includes('airport')) {
    return {
      pending: 'Order placed',
      prep: 'Preparing',
      ready: 'Ready at counter',
      done: 'Collected',
    };
  }
  if (id.includes('cafe') || id.includes('café')) {
    return {
      pending: 'Order taken',
      prep: 'Making',
      ready: 'Ready for pickup',
      done: 'Collected',
    };
  }
  return { pending: 'Received', prep: 'Preparing', ready: 'On the way', done: 'Enjoy' };
}

/** Guest help — staff role language by profile. */
export function guestServiceAssistCopy(profileIdOrType?: string): {
  label: string;
  idleHint: string;
  pendingHint: string;
  onWay: string;
  notified: string;
  staffNoun: string;
} {
  const id = (profileIdOrType || '').toLowerCase();
  if (id.includes('cafe') || id.includes('café')) {
    return {
      label: 'Ask the counter',
      idleHint: 'Something at the counter',
      pendingHint: 'Counter notified',
      onWay: 'Someone from the counter is on the way',
      notified: 'Counter notified — hang tight',
      staffNoun: 'counter',
    };
  }
  if (id.includes('hotel')) {
    return {
      label: 'Ask reception',
      idleHint: 'Something in your room',
      pendingHint: 'Reception notified',
      onWay: 'Reception is on the way',
      notified: 'Reception notified — hang tight',
      staffNoun: 'reception',
    };
  }
  if (id.includes('healthcare')) {
    return {
      label: 'Ask reception',
      idleHint: 'Something in the waiting bay',
      pendingHint: 'Reception notified',
      onWay: 'Reception is on the way',
      notified: 'Reception notified — hang tight',
      staffNoun: 'reception',
    };
  }
  if (id.includes('festival')) {
    return {
      label: 'Ask crew',
      idleHint: 'Something in this zone',
      pendingHint: 'Crew notified',
      onWay: 'Crew is on the way',
      notified: 'Crew notified — hang tight',
      staffNoun: 'crew',
    };
  }
  if (id.includes('airport')) {
    return {
      label: 'Ask gate service',
      idleHint: 'Something at your seat',
      pendingHint: 'Gate service notified',
      onWay: 'Gate service is on the way',
      notified: 'Gate service notified — hang tight',
      staffNoun: 'gate',
    };
  }
  return {
    label: 'Request Waiter',
    idleHint: 'Something at the table',
    pendingHint: 'Waiter notified',
    onWay: 'Your waiter is on the way',
    notified: 'Waiter notified — hang tight',
    staffNoun: 'waiter',
  };
}

/** Guest help — manager / private matter language by profile. */
export function guestManagerAssistCopy(profileIdOrType?: string): {
  label: string;
  idleHint: string;
  pendingHint: string;
  onWay: string;
  notified: string;
} {
  const id = (profileIdOrType || '').toLowerCase();
  if (id.includes('cafe') || id.includes('café')) {
    return {
      label: 'Speak to the manager',
      idleHint: 'A private matter',
      pendingHint: 'Manager notified',
      onWay: 'The manager is on the way',
      notified: 'Manager notified — hang tight',
    };
  }
  if (id.includes('hotel') || id.includes('healthcare')) {
    return {
      label: 'Speak to the manager',
      idleHint: 'A private matter',
      pendingHint: 'Manager notified',
      onWay: 'The manager is on the way',
      notified: 'Manager notified — hang tight',
    };
  }
  if (id.includes('festival')) {
    return {
      label: 'Speak to the lead',
      idleHint: 'A private matter',
      pendingHint: 'Lead notified',
      onWay: 'The lead is on the way',
      notified: 'Lead notified — hang tight',
    };
  }
  if (id.includes('airport')) {
    return {
      label: 'Speak to gate lead',
      idleHint: 'A private matter',
      pendingHint: 'Gate lead notified',
      onWay: 'Gate lead is on the way',
      notified: 'Gate lead notified — hang tight',
    };
  }
  return {
    label: 'Speak to the manager',
    idleHint: 'A private matter',
    pendingHint: 'Manager notified',
    onWay: 'The manager is on the way',
    notified: 'Manager notified — hang tight',
  };
}

/** Guest ready banner — restaurant vs café */
export function guestReadyBanner(profileIdOrType?: string): string {
  const id = (profileIdOrType || '').toLowerCase();
  if (id.includes('festival')) return 'Collect at the stall when you’re called.';
  if (id.includes('airport')) return 'Collect at the gate counter when you’re called.';
  if (id.includes('healthcare')) {
    return 'It’s ready for you — collect when you’re called.';
  }
  if (id.includes('cafe') || id.includes('café')) {
    return 'Head to the counter when you’re called.';
  }
  if (id.includes('hotel')) return 'It’s at your door.';
  // restaurant default — matches Restaurant App waiter-collect moment
  return 'Your waiter is on the way with your order.';
}
