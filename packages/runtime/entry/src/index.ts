import type { EntryResolutionRequest, EntryResolutionResult } from '@lekki/contracts';
import { err, ok, type Result } from '@lekki/shared';

export interface EntryTokenRecord {
  token: string;
  organisationId: string;
  venueId: string;
  physicalContextId: string;
  profileId: string;
  profileVersion: string;
  active: boolean;
}

export interface EntryTokenRepository {
  findByToken(token: string): Promise<EntryTokenRecord | null>;
}

export class EntryRuntime {
  constructor(private readonly tokens: EntryTokenRepository) {}

  async resolve(request: EntryResolutionRequest): Promise<Result<EntryResolutionResult>> {
    if (request.entryMethod !== 'qr') {
      return err(`Unsupported entry method: ${request.entryMethod}`);
    }

    const record = await this.tokens.findByToken(request.token);
    if (!record || !record.active) {
      return err('Invalid or inactive entry token');
    }

    return ok({
      organisationId: record.organisationId,
      venueId: record.venueId,
      physicalContextId: record.physicalContextId,
      profileRef: {
        profileId: record.profileId,
        version: record.profileVersion,
      },
    });
  }
}
