/**
 * Studio Experience registry — Packs stay internal.
 * UI speaks Experience only.
 */

export type ExperienceTypeId =
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'festival'
  | 'airport'
  | 'healthcare';

export type ExperienceTerminology = {
  item: string;
  place: string;
  station: string;
  participant: string;
  transaction: string;
  /** Guest catalogue tab — Menu · Board · Services · … */
  catalogue: string;
  /** Guest payment tab — Bill · Tab · Folio · Account · … */
  payment: string;
};

export type ExperienceDefaults = {
  venueName: string;
  placeLabel: string;
  placeCode: string;
  /** Helpful starter set for Places setup */
  placeSuggestions: string[];
  /** Seed entry token for demo runtime */
  token: string;
  /** Categories shown on Experience step (lite shell) */
  experienceCategories: string[];
  /** Default station labels on Places/Services lite */
  stations: string[];
};

export type ExperienceCapabilities = {
  billSplit: boolean;
  tipping: boolean;
  orderAhead: boolean;
  roomCharge: boolean;
};

export type ExperienceSetupHints = {
  identityLead: string;
  experienceLead: string;
  placesLead: string;
  paymentsLead: string;
  goliveLead: string;
};

export type ExperienceDefinition = {
  id: ExperienceTypeId;
  /** Internal pack mapping — never show in UI */
  packId: string;
  label: string;
  blurb: string;
  terminology: ExperienceTerminology;
  defaults: ExperienceDefaults;
  capabilities: ExperienceCapabilities;
  setupHints: ExperienceSetupHints;
};

export const EXPERIENCE_REGISTRY: ExperienceDefinition[] = [
  {
    id: 'restaurant',
    packId: 'pack-restaurant',
    label: 'Restaurant',
    blurb: 'Guests scan, browse, order and enjoy.',
    terminology: {
      item: 'Dish',
      place: 'Table',
      station: 'Kitchen',
      participant: 'Guest',
      transaction: 'Order',
      catalogue: 'Menu',
      payment: 'Bill',
    },
    defaults: {
      venueName: 'Blue Door',
      placeLabel: 'Tables',
      placeCode: 'Table 12',
      placeSuggestions: ['Table 10', 'Table 11', 'Table 12', 'Table 14'],
      token: 'qr-demo-restaurant',
      experienceCategories: ['Food', 'Drinks', 'Extras'],
      stations: ['Kitchen', 'Bar'],
    },
    capabilities: { billSplit: true, tipping: true, orderAhead: false, roomCharge: false },
    setupHints: {
      identityLead: 'Name the restaurant guests will recognise.',
      experienceLead: 'What will your guests experience?',
      placesLead: 'Where will guests join your experience?',
      paymentsLead: 'Guests can pay with confidence.',
      goliveLead: 'Guests can join by scanning this QR.',
    },
  },
  {
    id: 'cafe',
    packId: 'pack-restaurant',
    label: 'Café',
    blurb: 'Guests scan for coffee and quick bites.',
    terminology: {
      item: 'Drink',
      place: 'Pickup',
      station: 'Barista',
      participant: 'Guest',
      transaction: 'Order',
      catalogue: 'Board',
      payment: 'Tab',
    },
    defaults: {
      venueName: 'Harbor Roast',
      placeLabel: 'Pickup / stands',
      placeCode: 'Counter',
      placeSuggestions: ['Counter', 'Window', 'Patio', 'Bar'],
      token: 'qr-demo-cafe',
      experienceCategories: ['Coffee & treats', 'Sizes & milk', 'Extras'],
      stations: ['Barista'],
    },
    capabilities: { billSplit: false, tipping: true, orderAhead: true, roomCharge: false },
    setupHints: {
      identityLead: 'Name the café and how guests find you.',
      experienceLead: 'Express menu — drinks, sizes, milk choices.',
      placesLead: 'Pickup counter or table stands for QR.',
      paymentsLead: 'Express checkout for fast throughput.',
      goliveLead: 'Guests scan at the counter or stand.',
    },
  },
  {
    id: 'hotel',
    packId: 'pack-hotel',
    label: 'Hotel',
    blurb: 'Guests join from rooms and lobby.',
    terminology: {
      item: 'Service',
      place: 'Room',
      station: 'Housekeeping',
      participant: 'Guest',
      transaction: 'Request',
      catalogue: 'Services',
      payment: 'Folio',
    },
    defaults: {
      venueName: 'Coastal Lodge',
      placeLabel: 'Rooms',
      placeCode: 'Room 101',
      placeSuggestions: ['Room 101', 'Room 102', 'Room 103', 'Room 201'],
      token: 'qr-demo-hotel',
      experienceCategories: ['Room service', 'Spa', 'Laundry'],
      stations: ['Kitchen', 'Housekeeping', 'Concierge'],
    },
    capabilities: { billSplit: false, tipping: true, orderAhead: false, roomCharge: true },
    setupHints: {
      identityLead: 'Name the property guests stay in.',
      experienceLead: 'In-room directory — service, spa, laundry.',
      placesLead: 'Room range so each bedside QR is unique.',
      paymentsLead: 'Cards or room charge when ready.',
      goliveLead: 'Guests scan from the room.',
    },
  },
  {
    id: 'festival',
    packId: 'pack-festival',
    label: 'Festival',
    blurb: 'Guests scan across stages and vendors.',
    terminology: {
      item: 'Item',
      place: 'Zone',
      station: 'Bar',
      participant: 'Guest',
      transaction: 'Order',
      catalogue: 'Menu & merch',
      payment: 'Tab',
    },
    defaults: {
      venueName: 'Summer Fields',
      placeLabel: 'Zones',
      placeCode: 'Main Stage Bar',
      placeSuggestions: ['Main Stage Bar', 'North Food Court', 'VIP Lawn', 'Gate A'],
      token: 'qr-demo-festival',
      experienceCategories: ['Bars', 'Food', 'Tickets'],
      stations: ['Bar 1', 'Food truck'],
    },
    capabilities: { billSplit: false, tipping: false, orderAhead: false, roomCharge: false },
    setupHints: {
      identityLead: 'Name the event guests are attending.',
      experienceLead: 'High-speed offerings — bars, food, tickets.',
      placesLead: 'Zones and vendor spots for QR banners.',
      paymentsLead: 'High-volume payment flow.',
      goliveLead: 'Large-format QR for pillars and banners.',
    },
  },
  {
    id: 'airport',
    packId: 'pack-airport',
    label: 'Airport',
    blurb: 'Travellers scan at gates and lounges.',
    terminology: {
      item: 'Item',
      place: 'Gate',
      station: 'Counter',
      participant: 'Traveller',
      transaction: 'Order',
      catalogue: 'Gate menu',
      payment: 'Bill',
    },
    defaults: {
      venueName: 'Gate Café',
      placeLabel: 'Gates / lounges',
      placeCode: 'Gate B12',
      placeSuggestions: ['Gate B12', 'Gate B14', 'Lounge A', 'Gate C3'],
      token: 'qr-demo-airport',
      experienceCategories: ['Lounges', 'Retail', 'Boarding'],
      stations: ['Counter'],
    },
    capabilities: { billSplit: false, tipping: false, orderAhead: true, roomCharge: false },
    setupHints: {
      identityLead: 'Name the traveller-facing venue.',
      experienceLead: 'Lounges, retail, boarding assistance.',
      placesLead: 'Gates and seats guests scan from.',
      paymentsLead: 'Fast settle before boarding.',
      goliveLead: 'QR at the gate or lounge seat.',
    },
  },
  {
    id: 'healthcare',
    packId: 'pack-healthcare',
    label: 'Healthcare',
    blurb: 'Calm wait, care support, clear next steps.',
    terminology: {
      item: 'Item',
      place: 'Bay',
      station: 'Service',
      participant: 'Patient',
      transaction: 'Request',
      catalogue: 'Amenities',
      payment: 'Account',
    },
    defaults: {
      venueName: 'Clinic Café',
      placeLabel: 'Waiting bays',
      placeCode: 'Bay A',
      placeSuggestions: ['Bay A', 'Bay B', 'Pediatrics', 'Reception'],
      token: 'qr-demo-healthcare',
      experienceCategories: ['Refreshments', 'Comfort', 'Assistance'],
      stations: ['Service'],
    },
    capabilities: { billSplit: false, tipping: false, orderAhead: false, roomCharge: false },
    setupHints: {
      identityLead: 'Name the care environment.',
      experienceLead: 'Support offerings while people wait.',
      placesLead: 'Waiting bays and seats.',
      paymentsLead: 'Simple settlement when needed.',
      goliveLead: 'QR at the waiting bay.',
    },
  },
];

export const SETUP_STEPS = [
  {
    slug: 'identity',
    title: 'Who you are',
    why: 'Guests will recognise your business.',
    index: 1,
  },
  {
    slug: 'experience',
    title: 'What guests experience',
    why: 'Guests will choose what you’d like to offer.',
    index: 2,
  },
  {
    slug: 'places',
    title: 'Where guests join',
    why: 'Guests will know exactly where they are.',
    index: 3,
  },
  {
    slug: 'payments',
    title: 'How guests pay',
    why: 'Guests can pay with confidence.',
    index: 4,
  },
  {
    slug: 'golive',
    title: 'Go Live',
    why: 'You’re ready to welcome your first guest.',
    index: 5,
  },
] as const;

export type SetupStepSlug = (typeof SETUP_STEPS)[number]['slug'];

export function getExperience(id: string | null | undefined): ExperienceDefinition | undefined {
  if (!id) return undefined;
  return EXPERIENCE_REGISTRY.find((e) => e.id === id);
}

/** Demo / seed token → experience type (Continuity with Entry QR). */
export function experienceTypeIdForToken(
  token: string | null | undefined,
): ExperienceTypeId | undefined {
  const t = token?.trim();
  if (!t) return undefined;
  return EXPERIENCE_REGISTRY.find((e) => e.defaults.token === t)?.id;
}

export function experienceLabel(id: string | null | undefined): string {
  return getExperience(id)?.label ?? 'Experience';
}
