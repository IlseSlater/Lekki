export type EntryMethodType = 'qr' | 'nfc' | 'ble' | 'passkey' | 'deeplink' | 'wallet' | 'geo';

export interface EntryMethodConfig {
  type: EntryMethodType;
  enabled: boolean;
  label: string;
}

export interface StationConfig {
  id: string;
  label: string;
  routingTags: string[];
}

export interface TerminologyMap {
  [key: string]: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  order: number;
}

export interface ExperienceProfileDefinition {
  id: string;
  version: string;
  packId: string;
  label: string;
  enabledCapabilities: string[];
  entryMethods: EntryMethodConfig[];
  stations: StationConfig[];
  terminology: TerminologyMap;
  workflows: WorkflowStep[];
  fulfilmentRouting: Array<{
    matchTags: string[];
    stationId: string;
  }>;
  surfaces: string[];
  permissions: Record<string, string[]>;
}

export interface ProfileRef {
  profileId: string;
  version: string;
}
