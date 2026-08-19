import type { ExperienceProfileDefinition } from '@lekki/contracts';

/**
 * Healthcare Experience Pack — waiting-bay amenities & reception (Pack nouns only).
 * Not clinical care / EHR — Platform unchanged.
 */
export const HEALTHCARE_PHYSICAL_CONTEXT_TYPE = 'WAITING_BAY';
export const HEALTHCARE_PROFILE_ID = 'profile-healthcare';
export const HEALTHCARE_PROFILE_VERSION = '1.0.0';

export const healthcareProfile: ExperienceProfileDefinition = {
  id: HEALTHCARE_PROFILE_ID,
  version: HEALTHCARE_PROFILE_VERSION,
  packId: 'pack-healthcare',
  label: 'Healthcare Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan bay to join' }],
  stations: [
    {
      id: 'station-clinic-cafe',
      label: 'Clinic café',
      routingTags: ['food', 'beverage'],
    },
    {
      id: 'station-clinic-pharmacy',
      label: 'Pharmacy counter',
      routingTags: ['pharmacy', 'retail'],
    },
    {
      id: 'station-clinic-reception',
      label: 'Reception',
      routingTags: ['service', 'reception'],
    },
  ],
  terminology: {
    session: 'Bay wait',
    transaction: 'Request',
    physicalContext: 'Waiting bay',
    participant: 'Visitor',
    fulfilment: 'Work order',
    payment: 'Account',
    close: 'Leave bay',
    catalogue: 'Amenities',
  },
  workflows: [
    { id: 'join', label: 'Join bay', order: 1 },
    { id: 'request', label: 'Request amenity', order: 2 },
    { id: 'fulfil', label: 'Fulfil request', order: 3 },
    { id: 'pay', label: 'Settle account', order: 4 },
    { id: 'close', label: 'Leave bay', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['pharmacy', 'retail'], stationId: 'station-clinic-pharmacy' },
    { matchTags: ['food', 'beverage'], stationId: 'station-clinic-cafe' },
    { matchTags: ['service', 'reception'], stationId: 'station-clinic-reception' },
  ],
  surfaces: [
    'guest',
    'service',
    'station-clinic-cafe',
    'station-clinic-pharmacy',
    'station-clinic-reception',
  ],
  permissions: {
    guest: ['session.read', 'transaction.create', 'transaction.read', 'payment.request'],
    service: [
      'session.read',
      'session.close',
      'transaction.read',
      'fulfilment.read',
      'payment.complete',
    ],
    'station-clinic-cafe': ['fulfilment.read', 'fulfilment.update'],
    'station-clinic-pharmacy': ['fulfilment.read', 'fulfilment.update'],
    'station-clinic-reception': ['fulfilment.read', 'fulfilment.update', 'session.close'],
  },
};

export interface HealthcareCatalogItem {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  currency: string;
  routingTags: string[];
  category: string;
}

export const healthcareSeedCatalogue: HealthcareCatalogItem[] = [
  {
    id: 'hc-tea',
    label: 'Hot tea',
    description: 'Waiting-bay refreshment',
    unitPrice: 25,
    currency: 'ZAR',
    routingTags: ['beverage', 'food'],
    category: 'Café',
  },
  {
    id: 'hc-sandwich',
    label: 'Visitor sandwich',
    unitPrice: 65,
    currency: 'ZAR',
    routingTags: ['food', 'beverage'],
    category: 'Café',
  },
  {
    id: 'hc-water',
    label: 'Still water',
    unitPrice: 18,
    currency: 'ZAR',
    routingTags: ['beverage', 'food'],
    category: 'Café',
  },
  {
    id: 'hc-otc-pack',
    label: 'Comfort pack (OTC retail)',
    description: 'Tissue, balm — counter retail only',
    unitPrice: 85,
    currency: 'ZAR',
    routingTags: ['pharmacy', 'retail'],
    category: 'Pharmacy',
  },
];

/** Pack Status Timeline labels — Healthcare (platform step ids unchanged). */
export const HEALTHCARE_PROGRESS_LABELS = {
  submitted: 'Requested',
  accepted: 'Received',
  in_progress: 'Preparing',
  ready: 'Ready for you',
  completed: 'Collected',
} as const;

export function registerHealthcarePack(store: {
  register: (profile: ExperienceProfileDefinition) => void;
}): void {
  store.register(healthcareProfile);
}
