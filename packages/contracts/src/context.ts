import type { ExperienceProfileDefinition } from './profile';

export interface ResolvedContext {
  organisationId: string;
  venueId: string;
  physicalContextId: string;
  physicalContextCode: string;
  physicalContextType: string;
  profile: ExperienceProfileDefinition;
  permissions: string[];
}
