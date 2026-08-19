import type { ExperienceProfileDefinition } from '@lekki/contracts';

/** Festival Experience Pack — Pack nouns only; Platform unchanged. */
export const FESTIVAL_PHYSICAL_CONTEXT_TYPE = 'FESTIVAL_ZONE';
export const FESTIVAL_PROFILE_ID = 'profile-festival';
export const FESTIVAL_PROFILE_VERSION = '1.0.0';

export const festivalProfile: ExperienceProfileDefinition = {
  id: FESTIVAL_PROFILE_ID,
  version: FESTIVAL_PROFILE_VERSION,
  packId: 'pack-festival',
  label: 'Festival Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan zone to join' }],
  stations: [
    {
      id: 'station-food-truck',
      label: 'Food truck',
      routingTags: ['food', 'mains'],
    },
    {
      id: 'station-fest-bar',
      label: 'Festival bar',
      routingTags: ['beverage', 'drinks'],
    },
    {
      id: 'station-merch',
      label: 'Merch',
      routingTags: ['merch', 'retail'],
    },
  ],
  terminology: {
    session: 'Zone visit',
    transaction: 'Order',
    physicalContext: 'Zone',
    participant: 'Attendee',
    fulfilment: 'Prep ticket',
    payment: 'Tab',
    close: 'Leave zone',
    catalogue: 'Menu & merch',
  },
  workflows: [
    { id: 'join', label: 'Join zone', order: 1 },
    { id: 'order', label: 'Place order', order: 2 },
    { id: 'fulfil', label: 'Prepare / pick', order: 3 },
    { id: 'pay', label: 'Settle tab', order: 4 },
    { id: 'close', label: 'Leave zone', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['beverage', 'drinks'], stationId: 'station-fest-bar' },
    { matchTags: ['food', 'mains'], stationId: 'station-food-truck' },
    { matchTags: ['merch', 'retail'], stationId: 'station-merch' },
  ],
  surfaces: [
    'guest',
    'service',
    'station-food-truck',
    'station-fest-bar',
    'station-merch',
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
    'station-food-truck': ['fulfilment.read', 'fulfilment.update'],
    'station-fest-bar': ['fulfilment.read', 'fulfilment.update'],
    'station-merch': ['fulfilment.read', 'fulfilment.update'],
  },
};

export interface FestivalCatalogItem {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  currency: string;
  routingTags: string[];
  category: string;
}

export const festivalSeedCatalogue: FestivalCatalogItem[] = [
  {
    id: 'fest-loaded-fries',
    label: 'Loaded fries',
    description: 'Cheese, jalapeño, festival sauce',
    unitPrice: 95,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Food',
  },
  {
    id: 'fest-burger',
    label: 'Stage burger',
    unitPrice: 140,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Food',
  },
  {
    id: 'fest-craft-lager',
    label: 'Craft lager',
    unitPrice: 55,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Bar',
  },
  {
    id: 'fest-soft-drink',
    label: 'Soft drink',
    unitPrice: 30,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Bar',
  },
  {
    id: 'fest-tee',
    label: 'Event tee',
    unitPrice: 280,
    currency: 'ZAR',
    routingTags: ['merch', 'retail'],
    category: 'Merch',
  },
];

/** Pack Status Timeline labels — Festival (platform step ids unchanged). */
export const FESTIVAL_PROGRESS_LABELS = {
  submitted: 'Order in',
  accepted: 'Queued',
  in_progress: 'Making',
  ready: 'Ready to collect',
  completed: 'Collected',
} as const;

export function registerFestivalPack(store: {
  register: (profile: ExperienceProfileDefinition) => void;
}): void {
  store.register(festivalProfile);
}
