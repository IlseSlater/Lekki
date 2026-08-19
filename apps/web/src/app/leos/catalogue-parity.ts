/**
 * Studio Live ↔ Guest meaning parity.
 * Same human facts as guest runtime — lighter rendering is allowed; different meaning is not.
 * Neo stays out of this surface.
 */

import { guestStatusLabel } from '../studio/operate-status';
import { progressGuidance, progressLabelsForProfile } from './progress-timeline';

export type ParityChoiceOption = {
  id: string;
  label: string;
  imageUrl?: string;
};

export type ParityChoiceGroup = {
  id: string;
  label: string;
  required: boolean;
  min?: number;
  max?: number;
  options: ParityChoiceOption[];
};

/** Setup steps that must not drift from guest trust. Frozen Setup UI — checklist only. */
export const STUDIO_GUEST_TRUST_CHECKLIST = [
  { step: 'Identity', question: 'Will guests recognise this place when they join?' },
  { step: 'Experience', question: 'Will they be able to do and see what I just chose?' },
  { step: 'Places', question: 'Will they know which place they joined?' },
  { step: 'Payments', question: 'Will they see the same ways to pay?' },
  { step: 'Go Live', question: 'Is this the same Experience Shell guests will use?' },
] as const;

/** Same rule line guests see on G-04 (`guest-choices-sheet`). */
export function choiceGroupHint(group: Pick<ParityChoiceGroup, 'required' | 'max'>): string {
  const max = group.max ?? (group.required ? 1 : 1);
  if (group.required) return max <= 1 ? 'Required · Choose 1' : `Required · Choose ${max}`;
  return max <= 1 ? 'Optional' : `Optional · Choose up to ${max}`;
}

export function projectionChoiceSignals(item: {
  choiceHint?: string;
  choiceRule?: string;
  choiceGroups?: ParityChoiceGroup[];
}): { hint?: string; rule?: string } {
  const groups = item.choiceGroups ?? [];
  if (!groups.length) {
    return { hint: item.choiceHint, rule: item.choiceRule };
  }
  const required = groups.find((g) => g.required) ?? groups[0];
  return {
    hint: item.choiceHint ?? required.label,
    rule: item.choiceRule ?? choiceGroupHint(required),
  };
}

/**
 * Guest-safe image src. Blocks mixed content and script URLs.
 * Allows https, same-origin paths, and curated data:image samples.
 */
export function safeGuestImageUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  if (!u) return null;
  const lower = u.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return null;
  if (u.startsWith('https://')) return u;
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  if (lower.startsWith('data:image/')) return u;
  return null;
}

export function profileIdForExperienceType(typeId: string): string {
  switch (typeId) {
    case 'cafe':
      return 'profile-cafe';
    case 'hotel':
      return 'profile-hotel';
    case 'festival':
      return 'profile-festival';
    case 'airport':
      return 'profile-airport';
    case 'healthcare':
      return 'profile-healthcare';
    default:
      return 'profile-restaurant';
  }
}

/** Order-state copy aligned with guest `progressGuidance` — never “all done” until complete. */
export function projectionOrderCopy(typeId: string, status = 'preparing') {
  const labels = progressLabelsForProfile(profileIdForExperienceType(typeId));
  return {
    statusLabel: guestStatusLabel(status, typeId),
    placed: progressGuidance('created', labels),
    current: progressGuidance(status, labels),
    completed: progressGuidance('completed', labels),
  };
}

export function sampleThumbDataUri(accent = '#d7a14a'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="#efe8dc" width="64" height="64" rx="8"/><circle cx="32" cy="32" r="16" fill="${accent}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
