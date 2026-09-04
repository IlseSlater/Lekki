/**
 * Pay Continuity — Studio Pay (`payAtTable`) must match Guest Bill / dock.
 * Live Experience already reads guestDesign; Guest must not hardcode Pay on.
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

/**
 * Resolve whether Guest may open Bill / show Pay primary.
 * Prefer workspace design for the entry token; else pack default for that token.
 */
export function resolveAllowPay(
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
