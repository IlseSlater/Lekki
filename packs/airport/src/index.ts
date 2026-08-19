import type { ExperienceProfileDefinition } from '@lekki/contracts';

/** Airport Experience Pack — Pack nouns only; Platform unchanged. */
export const AIRPORT_PHYSICAL_CONTEXT_TYPE = 'GATE_SEAT';
export const AIRPORT_PROFILE_ID = 'profile-airport';
export const AIRPORT_PROFILE_VERSION = '1.0.0';

export const airportProfile: ExperienceProfileDefinition = {
  id: AIRPORT_PROFILE_ID,
  version: AIRPORT_PROFILE_VERSION,
  packId: 'pack-airport',
  label: 'Airport Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan gate seat to join' }],
  stations: [
    {
      id: 'station-gate-cafe',
      label: 'Gate café',
      routingTags: ['food', 'mains'],
    },
    {
      id: 'station-lounge-bar',
      label: 'Lounge bar',
      routingTags: ['beverage', 'drinks'],
    },
    {
      id: 'station-gate-service',
      label: 'Gate service',
      routingTags: ['service', 'assist'],
    },
  ],
  terminology: {
    session: 'Gate wait',
    transaction: 'Order',
    physicalContext: 'Gate seat',
    participant: 'Traveller',
    fulfilment: 'Prep ticket',
    payment: 'Bill',
    close: 'Board / leave',
    catalogue: 'Gate menu',
  },
  workflows: [
    { id: 'join', label: 'Join gate', order: 1 },
    { id: 'order', label: 'Place order', order: 2 },
    { id: 'fulfil', label: 'Prepare', order: 3 },
    { id: 'pay', label: 'Settle bill', order: 4 },
    { id: 'close', label: 'Board / leave', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['beverage', 'drinks'], stationId: 'station-lounge-bar' },
    { matchTags: ['food', 'mains'], stationId: 'station-gate-cafe' },
    { matchTags: ['service', 'assist'], stationId: 'station-gate-service' },
  ],
  surfaces: [
    'guest',
    'service',
    'station-gate-cafe',
    'station-lounge-bar',
    'station-gate-service',
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
    'station-gate-cafe': ['fulfilment.read', 'fulfilment.update'],
    'station-lounge-bar': ['fulfilment.read', 'fulfilment.update'],
    'station-gate-service': ['fulfilment.read', 'fulfilment.update', 'session.close'],
  },
};

export interface AirportCatalogItem {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  currency: string;
  routingTags: string[];
  category: string;
}

export const airportSeedCatalogue: AirportCatalogItem[] = [
  {
    id: 'air-croissant',
    label: 'Butter croissant',
    description: 'Fresh from gate café',
    unitPrice: 45,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Café',
  },
  {
    id: 'air-wrap',
    label: 'Chicken wrap',
    unitPrice: 95,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Café',
  },
  {
    id: 'air-flat-white',
    label: 'Flat white',
    unitPrice: 42,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Bar',
  },
  {
    id: 'air-sparkling',
    label: 'Sparkling water',
    unitPrice: 28,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Bar',
  },
];

/** Pack Status Timeline labels — Airport (platform step ids unchanged). */
export const AIRPORT_PROGRESS_LABELS = {
  submitted: 'Order placed',
  accepted: 'Received',
  in_progress: 'Preparing',
  ready: 'Ready at counter',
  completed: 'Collected',
} as const;

export function registerAirportPack(store: {
  register: (profile: ExperienceProfileDefinition) => void;
}): void {
  store.register(airportProfile);
}
