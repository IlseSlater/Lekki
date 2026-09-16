/**
 * Pay Continuity — Studio Pay (`payAtTable`) must match Guest Bill / dock.
 * allowPay is design-intent ∧ install-active. Fail closed if install is unknown.
 */

import { experienceTypeIdForToken } from './experience-registry';
import {
  defaultDesignForType,
  type GuestExperienceDesign,
} from './guest-experience-design';

export type PayContinuityExperience = {
  token: string;
  typeId: string;
  guestDesign?: Partial<GuestExperienceDesign> | null;
};

export function paymentsActiveFromStatus(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'active';
}

export function paymentsCardState(paymentsActive: boolean): { value: string; ok: boolean } {
  return paymentsActive
    ? { value: 'Connected', ok: true }
    : { value: 'Guests can pay in person', ok: false };
}

/** Design intent only — never grant Guest Pay by itself. */
export function resolvePayIntent(
  token: string | null | undefined,
  experiences: PayContinuityExperience[] = [],
  sessionDesign?: Partial<GuestExperienceDesign> | null,
): boolean {
  if (sessionDesign && typeof sessionDesign.payAtTable === 'boolean') {
    return sessionDesign.payAtTable;
  }
  const t = (token ?? '').trim();
  if (!t) {
    return !!defaultDesignForType('restaurant').payAtTable;
  }

  const match = experiences.find((e) => e.token.trim() === t);
  if (match) {
    const design = match.guestDesign
      ? { ...defaultDesignForType(match.typeId), ...match.guestDesign }
      : defaultDesignForType(match.typeId);
    return !!design.payAtTable;
  }

  const typeId = experienceTypeIdForToken(t) ?? 'restaurant';
  return !!defaultDesignForType(typeId).payAtTable;
}

/**
 * Resolve whether Guest may open Bill / show Pay primary.
 * Prefer workspace design for the entry token; else pack default for that token.
 * paymentsActive must be true (connector install status === active).
 */
export function resolveAllowPay(
  token: string | null | undefined,
  experiences: PayContinuityExperience[] = [],
  sessionDesign?: Partial<GuestExperienceDesign> | null,
  paymentsActive = false,
): boolean {
  return resolvePayIntent(token, experiences, sessionDesign) && paymentsActive === true;
}
