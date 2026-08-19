import type { ExperienceProfileDefinition } from '@lekki/contracts';

/** Hotel Experience Pack — Pack nouns only; Platform unchanged. */
export const HOTEL_PHYSICAL_CONTEXT_TYPE = 'GUEST_ROOM';
export const HOTEL_PROFILE_ID = 'profile-hotel';
export const HOTEL_PROFILE_VERSION = '1.0.0';

export const hotelProfile: ExperienceProfileDefinition = {
  id: HOTEL_PROFILE_ID,
  version: HOTEL_PROFILE_VERSION,
  packId: 'pack-hotel',
  label: 'Hotel Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan room to join' }],
  stations: [
    {
      id: 'station-room-service',
      label: 'Room service',
      routingTags: ['food', 'beverage', 'room-service'],
    },
    {
      id: 'station-housekeeping',
      label: 'Housekeeping',
      routingTags: ['housekeeping', 'amenity'],
    },
    {
      id: 'station-reception',
      label: 'Reception',
      routingTags: ['service', 'reception'],
    },
  ],
  terminology: {
    session: 'In-room stay',
    transaction: 'Request',
    physicalContext: 'Room',
    participant: 'Guest',
    fulfilment: 'Work order',
    payment: 'Folio',
    close: 'End stay session',
    catalogue: 'Services',
  },
  workflows: [
    { id: 'join', label: 'Join room session', order: 1 },
    { id: 'request', label: 'Request service', order: 2 },
    { id: 'fulfil', label: 'Fulfil request', order: 3 },
    { id: 'pay', label: 'Settle folio', order: 4 },
    { id: 'close', label: 'End session', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['housekeeping', 'amenity'], stationId: 'station-housekeeping' },
    { matchTags: ['food', 'beverage', 'room-service'], stationId: 'station-room-service' },
    { matchTags: ['service', 'reception'], stationId: 'station-reception' },
  ],
  surfaces: ['guest', 'service', 'station-room-service', 'station-housekeeping', 'station-reception'],
  permissions: {
    guest: ['session.read', 'transaction.create', 'transaction.read', 'payment.request'],
    service: [
      'session.read',
      'session.close',
      'transaction.read',
      'fulfilment.read',
      'payment.complete',
    ],
    'station-room-service': ['fulfilment.read', 'fulfilment.update'],
    'station-housekeeping': ['fulfilment.read', 'fulfilment.update'],
    'station-reception': ['fulfilment.read', 'fulfilment.update', 'session.close'],
  },
};

export interface HotelCatalogItem {
  id: string;
  label: string;
  description?: string;
  unitPrice: number;
  currency: string;
  routingTags: string[];
  category: string;
}

export const hotelSeedCatalogue: HotelCatalogItem[] = [
  {
    id: 'hotel-breakfast',
    label: 'In-room breakfast',
    description: 'Continental tray for two',
    unitPrice: 280,
    currency: 'ZAR',
    routingTags: ['food', 'room-service'],
    category: 'Room service',
  },
  {
    id: 'hotel-club-sandwich',
    label: 'Club sandwich',
    unitPrice: 165,
    currency: 'ZAR',
    routingTags: ['food', 'room-service'],
    category: 'Room service',
  },
  {
    id: 'hotel-wine',
    label: 'House wine (bottle)',
    unitPrice: 320,
    currency: 'ZAR',
    routingTags: ['beverage', 'room-service'],
    category: 'Room service',
  },
  {
    id: 'hotel-towels',
    label: 'Extra towels',
    unitPrice: 0,
    currency: 'ZAR',
    routingTags: ['housekeeping', 'amenity'],
    category: 'Housekeeping',
  },
  {
    id: 'hotel-turndown',
    label: 'Turndown service',
    unitPrice: 0,
    currency: 'ZAR',
    routingTags: ['housekeeping', 'amenity'],
    category: 'Housekeeping',
  },
];

/** Pack Status Timeline labels — Hotel (platform step ids unchanged). */
export const HOTEL_PROGRESS_LABELS = {
  submitted: 'Requested',
  accepted: 'Assigned',
  in_progress: 'In progress',
  ready: 'At door',
  completed: 'Delivered',
} as const;

export function registerHotelPack(store: {
  register: (profile: ExperienceProfileDefinition) => void;
}): void {
  store.register(hotelProfile);
}
