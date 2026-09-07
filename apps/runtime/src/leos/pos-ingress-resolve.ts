/**
 * POS place/SKU resolution decisions — pure, no Prisma.
 * Runtime loads rows; this names the bail vs continue outcomes.
 */

export type PosPlaceResolution =
  | { kind: 'session'; sessionId: string; physicalContextId: string }
  | { kind: 'ignored'; reason: 'no_active_session_for_place' };

export type PosSkuResolution = {
  catalogueItemId: string | null;
  unmapped: boolean;
};

/** Open-visit statuses that still accept a trailing till punch. */
export const POS_OPEN_SESSION_STATUSES = ['created', 'active', 'settling'] as const;

export function resolvePosPlace(input: {
  placeMapping: { physicalContextId: string } | null;
  openSession: { id: string } | null;
}): PosPlaceResolution {
  if (!input.placeMapping || !input.openSession) {
    return { kind: 'ignored', reason: 'no_active_session_for_place' };
  }
  return {
    kind: 'session',
    sessionId: input.openSession.id,
    physicalContextId: input.placeMapping.physicalContextId,
  };
}

export function resolvePosSku(input: {
  skuMapping: { catalogueItemId: string } | null;
}): PosSkuResolution {
  const catalogueItemId = input.skuMapping?.catalogueItemId?.trim() || null;
  return {
    catalogueItemId,
    unmapped: catalogueItemId === null,
  };
}
