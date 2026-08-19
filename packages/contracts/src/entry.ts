export interface EntryTokenPayload {
  token: string;
  entryMethod: 'qr';
}

export interface EntryResolutionRequest {
  token: string;
  entryMethod: 'qr';
}

export interface EntryResolutionResult {
  organisationId: string;
  venueId: string;
  physicalContextId: string;
  profileRef: { profileId: string; version: string };
}
