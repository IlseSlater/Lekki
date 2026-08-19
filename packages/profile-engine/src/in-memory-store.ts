import type { ExperienceProfileDefinition, ProfileRef } from '@lekki/contracts';
import type { ProfileStore } from './index';

export class InMemoryProfileStore implements ProfileStore {
  private profiles = new Map<string, ExperienceProfileDefinition>();

  register(profile: ExperienceProfileDefinition): void {
    this.profiles.set(`${profile.id}@${profile.version}`, profile);
  }

  async get(ref: ProfileRef): Promise<ExperienceProfileDefinition | null> {
    return this.profiles.get(`${ref.profileId}@${ref.version}`) ?? null;
  }

  async list(): Promise<ExperienceProfileDefinition[]> {
    return [...this.profiles.values()];
  }
}
