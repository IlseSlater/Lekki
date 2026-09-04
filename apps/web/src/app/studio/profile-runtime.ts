import type { ExperienceTypeId } from './experience-registry';

/** Runtime profile ids for entry token minting (matches pack seeds). */
export function profileRuntimeForType(typeId: ExperienceTypeId): {
  profileId: string;
  profileVersion: string;
} {
  switch (typeId) {
    case 'cafe':
      return { profileId: 'profile-cafe', profileVersion: '1.0.0' };
    case 'hotel':
      return { profileId: 'profile-hotel', profileVersion: '1.0.0' };
    case 'festival':
      return { profileId: 'profile-festival', profileVersion: '1.0.0' };
    case 'airport':
      return { profileId: 'profile-airport', profileVersion: '1.0.0' };
    case 'healthcare':
      return { profileId: 'profile-healthcare', profileVersion: '1.0.0' };
    case 'restaurant':
    default:
      return { profileId: 'profile-restaurant', profileVersion: '1.0.0' };
  }
}
