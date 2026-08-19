/**
 * Guest experience design — human language for Studio Setup Experience.
 * Conversation controls: Browse · Order · Call Staff · Pay · Book · Request Service.
 * Never surface as “capabilities” in UI.
 */

import {
  type ParityChoiceGroup,
  projectionChoiceSignals,
  sampleThumbDataUri,
} from '../leos/catalogue-parity';

export type GuestDesignKey =
  | 'browseMenu'
  | 'orderFood'
  | 'drinks'
  | 'specials'
  | 'callStaff'
  | 'specialRequests'
  | 'book'
  | 'allergies'
  | 'payAtTable'
  | 'splitBill'
  | 'tipStaff'
  | 'loyalty'
  | 'promotions'
  | 'feedback';

export type GuestExperienceDesign = Record<GuestDesignKey, boolean>;

export type DesignGroup = {
  id: string;
  title: string;
  items: Array<{ key: GuestDesignKey; label: string }>;
};

/** Primary journey toggles from lekki-Conversation (S3). */
export const DESIGN_GROUPS: DesignGroup[] = [
  {
    id: 'guests-can',
    title: 'What guests can do',
    items: [
      { key: 'browseMenu', label: 'Browse' },
      { key: 'orderFood', label: 'Order' },
      { key: 'callStaff', label: 'Call Staff' },
      { key: 'payAtTable', label: 'Pay' },
      { key: 'book', label: 'Book' },
      { key: 'specialRequests', label: 'Request Service' },
    ],
  },
  {
    id: 'menu',
    title: 'What they see',
    items: [
      { key: 'drinks', label: 'Drinks' },
      { key: 'specials', label: 'Specials' },
      { key: 'allergies', label: 'Allergies' },
    ],
  },
  {
    id: 'extras',
    title: 'Extras for guests',
    items: [
      { key: 'loyalty', label: 'Loyalty' },
      { key: 'promotions', label: 'Promotions' },
      { key: 'feedback', label: 'Feedback' },
    ],
  },
];

export const DEFAULT_GUEST_DESIGN: GuestExperienceDesign = {
  browseMenu: true,
  orderFood: true,
  drinks: true,
  specials: false,
  callStaff: true,
  specialRequests: true,
  book: false,
  allergies: false,
  payAtTable: true,
  splitBill: true,
  tipStaff: true,
  loyalty: false,
  promotions: false,
  feedback: false,
};

export type ProjectionItem = {
  id: string;
  label: string;
  category: string;
  price: string;
  description?: string;
  /** Human choice hint for Live Experience (G-04) — never schema terms. */
  choiceHint?: string;
  /** Required / optional rule line — e.g. Required · Choose 1 */
  choiceRule?: string;
  /** Optional guest-safe image (https / path / data:image). Absence is also truth. */
  imageUrl?: string;
  /** Same option groups guests get on G-04. */
  choiceGroups?: ParityChoiceGroup[];
};

const BURGER_THUMB = sampleThumbDataUri('#d7a14a');
const COFFEE_THUMB = sampleThumbDataUri('#c4a574');
const OAT_THUMB = sampleThumbDataUri('#e8d9c4');

function withParitySignals(item: ProjectionItem): ProjectionItem {
  const sig = projectionChoiceSignals(item);
  return { ...item, choiceHint: sig.hint, choiceRule: sig.rule };
}

/** Sample catalogue for Experience Shell projection (not a builder). */
export const PROJECTION_ITEMS: ProjectionItem[] = [
  {
    id: 'burger',
    label: 'Classic Burger',
    category: 'Food',
    price: 'R120',
    description: 'Angus beef, cheddar',
    imageUrl: BURGER_THUMB,
    choiceGroups: [
      {
        id: 'side',
        label: 'Choose your side',
        required: true,
        max: 1,
        options: [
          { id: 'fries', label: 'Fries' },
          { id: 'salad', label: 'Side salad' },
        ],
      },
      {
        id: 'extras',
        label: 'Add extras',
        required: false,
        max: 2,
        options: [
          { id: 'bacon', label: 'Bacon' },
          { id: 'egg', label: 'Fried egg' },
        ],
      },
    ],
  },
  { id: 'pasta', label: 'Pasta', category: 'Food', price: 'R95' },
  { id: 'steak', label: 'Steak', category: 'Food', price: 'R185' },
  { id: 'lager', label: 'Craft Lager', category: 'Drinks', price: 'R45' },
  { id: 'flatwhite', label: 'Flat White', category: 'Drinks', price: 'R35' },
  { id: 'special', label: 'Chef’s Special', category: 'Specials', price: 'R140' },
].map(withParitySignals);

/** Pack-flavoured Live catalogue — mirrors registry experienceCategories + seed feel. */
export function projectionCatalogueForType(typeId: string): {
  categories: string[];
  items: ProjectionItem[];
} {
  switch (typeId) {
    case 'cafe':
      return {
        categories: ['Coffee & treats', 'Sizes & milk', 'Extras'],
        items: [
          {
            id: 'cafe-fw',
            label: 'Flat white',
            category: 'Coffee & treats',
            price: 'R38',
            description: 'Double shot, silky milk',
            imageUrl: COFFEE_THUMB,
            choiceGroups: [
              {
                id: 'milk',
                label: 'Choose your milk',
                required: true,
                max: 1,
                options: [
                  { id: 'dairy', label: 'Dairy' },
                  { id: 'oat', label: 'Oat milk', imageUrl: OAT_THUMB },
                  { id: 'almond', label: 'Almond' },
                ],
              },
            ],
          },
          { id: 'cafe-cap', label: 'Cappuccino', category: 'Coffee & treats', price: 'R40' },
          { id: 'cafe-cro', label: 'Butter croissant', category: 'Coffee & treats', price: 'R42' },
          { id: 'cafe-gra', label: 'Granola bowl', category: 'Coffee & treats', price: 'R75' },
          { id: 'cafe-oat', label: 'Oat milk', category: 'Sizes & milk', price: 'R8' },
          { id: 'cafe-shot', label: 'Extra shot', category: 'Extras', price: 'R12' },
        ].map(withParitySignals),
      };
    case 'hotel':
      return {
        categories: ['Room service', 'Spa', 'Laundry'],
        items: [
          {
            id: 'hotel-bf',
            label: 'In-room breakfast',
            category: 'Room service',
            price: 'R280',
            description: 'Continental tray for two',
          },
          { id: 'hotel-club', label: 'Club sandwich', category: 'Room service', price: 'R165' },
          { id: 'hotel-spa', label: 'Spa treatment', category: 'Spa', price: 'R650' },
          { id: 'hotel-laun', label: 'Express laundry', category: 'Laundry', price: 'R180' },
        ],
      };
    case 'festival':
      return {
        categories: ['Bars', 'Food', 'Tickets'],
        items: [
          {
            id: 'fest-fries',
            label: 'Loaded fries',
            category: 'Food',
            price: 'R95',
            description: 'Cheese, jalapeño, festival sauce',
          },
          { id: 'fest-burger', label: 'Stage burger', category: 'Food', price: 'R140' },
          { id: 'fest-lager', label: 'Craft lager', category: 'Bars', price: 'R55' },
          { id: 'fest-soft', label: 'Soft drink', category: 'Bars', price: 'R30' },
          { id: 'fest-tee', label: 'Festival tee', category: 'Tickets', price: 'R250' },
        ],
      };
    case 'airport':
      return {
        categories: ['Lounges', 'Retail', 'Boarding'],
        items: [
          { id: 'air-latte', label: 'Gate latte', category: 'Lounges', price: 'R42' },
          { id: 'air-wrap', label: 'Travel wrap', category: 'Lounges', price: 'R85' },
          { id: 'air-water', label: 'Still water', category: 'Retail', price: 'R25' },
          { id: 'air-assist', label: 'Boarding assist', category: 'Boarding', price: '—' },
        ],
      };
    case 'healthcare':
      return {
        categories: ['Refreshments', 'Comfort', 'Assistance'],
        items: [
          { id: 'hc-tea', label: 'Tea & biscuit', category: 'Refreshments', price: 'R28' },
          { id: 'hc-water', label: 'Still water', category: 'Refreshments', price: 'R18' },
          { id: 'hc-blanket', label: 'Warm blanket', category: 'Comfort', price: '—' },
          { id: 'hc-help', label: 'Ask reception', category: 'Assistance', price: '—' },
        ],
      };
    default:
      return {
        categories: ['Food', 'Drinks', 'Specials'],
        items: PROJECTION_ITEMS,
      };
  }
}

export function defaultDesignForType(typeId: string): GuestExperienceDesign {
  const base = { ...DEFAULT_GUEST_DESIGN };
  if (typeId === 'cafe') {
    base.specials = false;
    base.splitBill = false;
    base.orderFood = true;
    base.drinks = true;
    base.book = false;
  }
  if (typeId === 'hotel') {
    base.drinks = true;
    base.splitBill = false;
    base.payAtTable = false;
    base.loyalty = true;
    base.book = true;
  }
  if (typeId === 'festival' || typeId === 'airport') {
    base.splitBill = false;
    base.tipStaff = false;
    base.allergies = false;
    base.book = false;
  }
  if (typeId === 'healthcare') {
    base.orderFood = false;
    base.drinks = false;
    base.specials = false;
    base.payAtTable = false;
    base.splitBill = false;
    base.tipStaff = false;
    base.callStaff = true;
    base.book = true;
  }
  return base;
}

/** Categories string[] for legacy Places/preview compatibility. */
export function categoriesFromDesign(d: GuestExperienceDesign, typeId = 'restaurant'): string[] {
  if (typeId !== 'restaurant') {
    const canBrowse =
      d.browseMenu || d.orderFood || d.drinks || d.specialRequests || d.book || d.specials;
    return canBrowse ? projectionCatalogueForType(typeId).categories : [];
  }
  const cats: string[] = [];
  if (d.browseMenu || d.orderFood) cats.push('Food');
  if (d.drinks) cats.push('Drinks');
  if (d.specials) cats.push('Specials');
  return cats;
}

export function countEnabled(d: GuestExperienceDesign): number {
  return (Object.keys(d) as GuestDesignKey[]).filter((k) => d[k]).length;
}

/** Human summary for confidence strip. */
export function guestCanSummary(d: GuestExperienceDesign): string {
  const parts: string[] = [];
  if (d.browseMenu) parts.push('Browse');
  if (d.orderFood) parts.push('Order');
  if (d.callStaff) parts.push('Call Staff');
  if (d.payAtTable) parts.push('Pay');
  if (d.book) parts.push('Book');
  if (d.specialRequests) parts.push('Request');
  return parts.join(' · ') || 'Nothing on yet';
}

export function visibleProjectionItems(
  d: GuestExperienceDesign,
  typeId = 'restaurant',
): ProjectionItem[] {
  const { items } = projectionCatalogueForType(typeId);
  if (typeId === 'restaurant') {
    return items.filter((item) => {
      if (item.category === 'Food') return d.browseMenu || d.orderFood;
      if (item.category === 'Drinks') return d.drinks;
      if (item.category === 'Specials') return d.specials;
      return false;
    });
  }
  const canBrowse =
    d.browseMenu || d.orderFood || d.drinks || d.specialRequests || d.book || d.specials;
  return canBrowse ? items : [];
}
