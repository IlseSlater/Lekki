/**
 * Tip Continuity — Studio Tips (`tipStaff`) must match Guest Bill.
 * Live Experience already reads guestDesign; Guest must not hardcode tips on.
 */

import { experienceTypeIdForToken } from './experience-registry';
import {
  defaultDesignForType,
  type GuestExperienceDesign,
} from './guest-experience-design';

export type TipContinuityExperience = {
  token: string;
  typeId: string;
  guestDesign?: Partial<GuestExperienceDesign> | null;
};

/**
 * Resolve whether Guest Bill may show tip chips.
 * Prefer workspace design for the entry token; else pack default for that token.
 */
export function resolveAllowTip(
  token: string | null | undefined,
  experiences: TipContinuityExperience[] = [],
): boolean {
  const t = (token ?? '').trim();
  if (!t) {
    return !!defaultDesignForType('restaurant').tipStaff;
  }

  const match = experiences.find((e) => e.token.trim() === t);
  if (match) {
    const design = match.guestDesign
      ? { ...defaultDesignForType(match.typeId), ...match.guestDesign }
      : defaultDesignForType(match.typeId);
    return !!design.tipStaff;
  }

  const typeId = experienceTypeIdForToken(t) ?? 'restaurant';
  return !!defaultDesignForType(typeId).tipStaff;
}
