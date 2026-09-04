/**
 * Call Staff Continuity — Studio Call Staff (`callStaff`) must match Guest Help.
 * Live Experience already reads guestDesign; Guest must not hardcode Help on.
 */

import { experienceTypeIdForToken } from './experience-registry';
import {
  defaultDesignForType,
  type GuestExperienceDesign,
} from './guest-experience-design';

export type HelpContinuityExperience = {
  token: string;
  typeId: string;
  guestDesign?: Partial<GuestExperienceDesign> | null;
};

/**
 * Resolve whether Guest may show Help / request assistance.
 * Prefer workspace design for the entry token; else pack default for that token.
 */
export function resolveAllowHelp(
  token: string | null | undefined,
  experiences: HelpContinuityExperience[] = [],
  sessionDesign?: Partial<GuestExperienceDesign> | null,
): boolean {
  if (sessionDesign && typeof sessionDesign.callStaff === 'boolean') {
    return sessionDesign.callStaff;
  }
  const t = (token ?? '').trim();
  if (!t) {
    return !!defaultDesignForType('restaurant').callStaff;
  }

  const match = experiences.find((e) => e.token.trim() === t);
  if (match) {
    const design = match.guestDesign
      ? { ...defaultDesignForType(match.typeId), ...match.guestDesign }
      : defaultDesignForType(match.typeId);
    return !!design.callStaff;
  }

  const typeId = experienceTypeIdForToken(t) ?? 'restaurant';
  return !!defaultDesignForType(typeId).callStaff;
}
