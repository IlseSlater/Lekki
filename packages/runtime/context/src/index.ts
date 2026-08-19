import type { EntryResolutionResult, ResolvedContext } from '@lekki/contracts';
import type { ProfileEngine } from '@lekki/profile-engine';
import { err, ok, type Result } from '@lekki/shared';

export interface PhysicalContextRecord {
  id: string;
  organisationId: string;
  venueId: string;
  code: string;
  type: string;
  activeSessionId?: string | null;
}

export interface PhysicalContextRepository {
  findById(id: string): Promise<PhysicalContextRecord | null>;
}

export class ContextRuntime {
  constructor(
    private readonly contexts: PhysicalContextRepository,
    private readonly profiles: ProfileEngine,
  ) {}

  async resolve(
    entry: EntryResolutionResult,
    principalRole = 'guest',
  ): Promise<Result<ResolvedContext>> {
    const context = await this.contexts.findById(entry.physicalContextId);
    if (!context) {
      return err('Physical context not found');
    }

    const profile = await this.profiles.load(entry.profileRef);
    if (!profile.ok) {
      return err(profile.error);
    }

    const permissions = await this.profiles.resolvePermissions(
      entry.profileRef,
      principalRole,
    );
    if (!permissions.ok) {
      return err(permissions.error);
    }

    return ok({
      organisationId: entry.organisationId,
      venueId: entry.venueId,
      physicalContextId: entry.physicalContextId,
      physicalContextCode: context.code,
      physicalContextType: context.type,
      profile: profile.value,
      permissions: permissions.value,
    });
  }
}
