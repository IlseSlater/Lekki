import type { ExperienceProfileDefinition } from '@lekki/contracts';

export const RESTAURANT_PHYSICAL_CONTEXT_TYPE = 'DINING_SURFACE';
export const RESTAURANT_PROFILE_ID = 'profile-restaurant';
export const RESTAURANT_PROFILE_VERSION = '1.0.0';
export const CAFE_PROFILE_ID = 'profile-cafe';
export const CAFE_PROFILE_VERSION = '1.0.0';

export const restaurantProfile: ExperienceProfileDefinition = {
  id: RESTAURANT_PROFILE_ID,
  version: RESTAURANT_PROFILE_VERSION,
  packId: 'pack-restaurant',
  label: 'Restaurant Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan to join' }],
  stations: [
    { id: 'station-kitchen', label: 'Kitchen', routingTags: ['food', 'mains'] },
    { id: 'station-bar', label: 'Bar', routingTags: ['beverage', 'drinks'] },
    { id: 'station-service', label: 'Service', routingTags: ['service'] },
  ],
  terminology: {
    session: 'Table session',
    transaction: 'Order',
    physicalContext: 'Table',
    participant: 'Guest',
    fulfilment: 'Ticket',
    payment: 'Bill',
    close: 'Clear & close',
    catalogue: 'Menu',
    /** Guest preference — show/hide food thumbnails in the ordering experience. */
    showFoodImages: 'true',
  },
  workflows: [
    { id: 'join', label: 'Join session', order: 1 },
    { id: 'order', label: 'Place order', order: 2 },
    { id: 'fulfil', label: 'Prepare items', order: 3 },
    { id: 'pay', label: 'Settle bill', order: 4 },
    { id: 'close', label: 'Close session', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['beverage', 'drinks'], stationId: 'station-bar' },
    { matchTags: ['food', 'mains'], stationId: 'station-kitchen' },
    { matchTags: ['service'], stationId: 'station-service' },
  ],
  surfaces: ['guest', 'service', 'station-kitchen', 'station-bar'],
  permissions: {
    guest: ['session.read', 'transaction.create', 'transaction.read', 'payment.request'],
    service: [
      'session.read',
      'session.close',
      'transaction.read',
      'fulfilment.read',
      'payment.complete',
    ],
    'station-kitchen': ['fulfilment.read', 'fulfilment.update'],
    'station-bar': ['fulfilment.read', 'fulfilment.update'],
  },
};

/** Second profile proof — peer profile without core changes */
export const cafeProfile: ExperienceProfileDefinition = {
  id: CAFE_PROFILE_ID,
  version: CAFE_PROFILE_VERSION,
  packId: 'pack-restaurant',
  label: 'Café Experience',
  enabledCapabilities: [
    'commerce.transaction',
    'fulfilment.route',
    'payment.settle',
    'assistance.request',
  ],
  entryMethods: [{ type: 'qr', enabled: true, label: 'Scan counter to order' }],
  stations: [
    {
      id: 'station-counter',
      label: 'Counter',
      routingTags: ['food', 'beverage'],
    },
  ],
  terminology: {
    session: 'Counter visit',
    transaction: 'Order',
    physicalContext: 'Counter',
    participant: 'Guest',
    fulfilment: 'Prep ticket',
    payment: 'Tab',
    close: 'Complete visit',
    catalogue: 'Board',
    showFoodImages: 'true',
  },
  workflows: [
    { id: 'join', label: 'Start visit', order: 1 },
    { id: 'order', label: 'Order at counter', order: 2 },
    { id: 'fulfil', label: 'Make & call', order: 3 },
    { id: 'pay', label: 'Settle tab', order: 4 },
    { id: 'close', label: 'Complete visit', order: 5 },
  ],
  fulfilmentRouting: [
    { matchTags: ['food', 'beverage'], stationId: 'station-counter' },
  ],
  surfaces: ['guest', 'service', 'station-counter'],
  permissions: {
    guest: ['session.read', 'transaction.create', 'transaction.read', 'payment.request'],
    service: [
      'session.read',
      'session.close',
      'transaction.read',
      'fulfilment.read',
      'payment.complete',
    ],
    'station-counter': ['fulfilment.read', 'fulfilment.update', 'session.close'],
  },
};

export interface CatalogChoiceOption {
  id: string;
  label: string;
  /** Added to unit price when selected. */
  priceDelta?: number;
  /** Optional thumbnail for choice row rendering (guest-facing). */
  imageUrl?: string;
}

export interface CatalogChoiceGroup {
  id: string;
  /** Guest-facing legend, e.g. “Choose your side”. */
  label: string;
  required: boolean;
  /** Default 1 when required; 0 when optional. */
  min?: number;
  /** Default 1 for required single-choice; higher for “Choose up to N”. */
  max?: number;
  options: CatalogChoiceOption[];
}

export interface RestaurantCatalogItem {
  id: string;
  label: string;
  description?: string;
  /** Optional thumbnail for guest menu + order visuals. */
  imageUrl?: string;
  unitPrice: number;
  currency: string;
  routingTags: string[];
  category: string;
  choiceGroups?: CatalogChoiceGroup[];
}

/** Café Pack catalogue — Pack content for counter service. */
export const cafeSeedCatalogue: RestaurantCatalogItem[] = [
  {
    id: 'cafe-flat-white',
    label: 'Flat white',
    description: 'Double shot, silky milk',
    unitPrice: 38,
    currency: 'ZAR',
    routingTags: ['beverage', 'food'],
    category: 'Coffee',
    choiceGroups: [
      {
        id: 'milk',
        label: 'Choose your milk',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'dairy', label: 'Dairy' },
          { id: 'oat', label: 'Oat', priceDelta: 6 },
          { id: 'almond', label: 'Almond', priceDelta: 6 },
        ],
      },
    ],
  },
  {
    id: 'cafe-cappuccino',
    label: 'Cappuccino',
    unitPrice: 40,
    currency: 'ZAR',
    routingTags: ['beverage', 'food'],
    category: 'Coffee',
  },
  {
    id: 'cafe-croissant',
    label: 'Butter croissant',
    unitPrice: 42,
    currency: 'ZAR',
    routingTags: ['food', 'beverage'],
    category: 'Pastry',
  },
  {
    id: 'cafe-granola',
    label: 'Granola bowl',
    unitPrice: 75,
    currency: 'ZAR',
    routingTags: ['food', 'beverage'],
    category: 'Food',
  },
];

export const seedCatalogue: RestaurantCatalogItem[] = [
  {
    id: 'item-burger',
    label: 'Classic Burger',
    description: 'Angus beef, cheddar, pickles',
    unitPrice: 120,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Mains',
    choiceGroups: [
      {
        id: 'side',
        label: 'Choose your side',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'fries', label: 'Fries' },
          { id: 'salad', label: 'Salad' },
          { id: 'chips', label: 'Chips' },
        ],
      },
      {
        id: 'drink',
        label: 'Choose your drink',
        required: true,
        min: 1,
        max: 1,
        options: [
          { id: 'coke', label: 'Coke', priceDelta: 20 },
          { id: 'water', label: 'Water' },
          { id: 'juice', label: 'Juice', priceDelta: 10 },
        ],
      },
      {
        id: 'extras',
        label: 'Extras',
        required: false,
        min: 0,
        max: 3,
        options: [
          { id: 'cheese', label: 'Cheese', priceDelta: 15 },
          { id: 'bacon', label: 'Bacon', priceDelta: 25 },
          { id: 'avo', label: 'Avocado', priceDelta: 15 },
        ],
      },
    ],
  },
  {
    id: 'item-salad',
    label: 'Garden Salad',
    unitPrice: 85,
    currency: 'ZAR',
    routingTags: ['food', 'mains'],
    category: 'Mains',
  },
  {
    id: 'item-lager',
    label: 'Craft Lager',
    unitPrice: 45,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Drinks',
  },
  {
    id: 'item-coffee',
    label: 'Flat White',
    unitPrice: 35,
    currency: 'ZAR',
    routingTags: ['beverage', 'drinks'],
    category: 'Drinks',
  },
];

export function registerRestaurantPack(store: {
  register: (profile: ExperienceProfileDefinition) => void;
}): void {
  store.register(restaurantProfile);
  store.register(cafeProfile);
}
