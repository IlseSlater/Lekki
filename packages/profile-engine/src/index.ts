import type {
  EntryMethodConfig,
  ExperienceProfileDefinition,
  ProfileRef,
  StationConfig,
  TerminologyMap,
  WorkflowStep,
} from '@lekki/contracts';
import { err, ok, type Result } from '@lekki/shared';

export interface ProfileStore {
  get(ref: ProfileRef): Promise<ExperienceProfileDefinition | null>;
  list(): Promise<ExperienceProfileDefinition[]>;
}

export class ProfileEngine {
  private cache = new Map<string, ExperienceProfileDefinition>();

  constructor(private readonly store: ProfileStore) {}

  private key(ref: ProfileRef): string {
    return `${ref.profileId}@${ref.version}`;
  }

  async load(ref: ProfileRef): Promise<Result<ExperienceProfileDefinition>> {
    const cached = this.cache.get(this.key(ref));
    if (cached) {
      return ok(cached);
    }
    const profile = await this.store.get(ref);
    if (!profile) {
      return err(`Profile not found: ${ref.profileId}@${ref.version}`);
    }
    this.cache.set(this.key(ref), profile);
    return ok(profile);
  }

  async resolveCapability(
    ref: ProfileRef,
    capability: string,
  ): Promise<Result<boolean>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok(loaded.value.enabledCapabilities.includes(capability));
  }

  async resolveStation(
    ref: ProfileRef,
    stationId: string,
  ): Promise<Result<StationConfig>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    const station = loaded.value.stations.find((s) => s.id === stationId);
    if (!station) {
      return err(`Station not found: ${stationId}`);
    }
    return ok(station);
  }

  resolveStationForTags(
    profile: ExperienceProfileDefinition,
    tags: string[],
  ): string | null {
    for (const rule of profile.fulfilmentRouting) {
      if (rule.matchTags.some((tag) => tags.includes(tag))) {
        return rule.stationId;
      }
    }
    return profile.stations[0]?.id ?? null;
  }

  async resolveTerminology(
    ref: ProfileRef,
    key: string,
  ): Promise<Result<string>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok(loaded.value.terminology[key] ?? key);
  }

  async resolveWorkflow(ref: ProfileRef): Promise<Result<WorkflowStep[]>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok([...loaded.value.workflows].sort((a, b) => a.order - b.order));
  }

  async resolveEntryMethods(
    ref: ProfileRef,
  ): Promise<Result<EntryMethodConfig[]>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok(loaded.value.entryMethods.filter((m) => m.enabled));
  }

  async resolvePermissions(
    ref: ProfileRef,
    role: string,
  ): Promise<Result<string[]>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok(loaded.value.permissions[role] ?? []);
  }

  async resolveTerminologyMap(ref: ProfileRef): Promise<Result<TerminologyMap>> {
    const loaded = await this.load(ref);
    if (!loaded.ok) {
      return loaded;
    }
    return ok(loaded.value.terminology);
  }
}

export * from './in-memory-store';
