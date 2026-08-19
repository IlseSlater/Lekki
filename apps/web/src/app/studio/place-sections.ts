/**
 * Places design — where guests join (human language, Pack nouns via terminology).
 */

export type PlaceItem = {
  id: string;
  label: string;
  enabled: boolean;
};

export type PlaceSection = {
  id: string;
  name: string;
  places: PlaceItem[];
};

function id() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function tables(prefix: string, from: number, to: number): PlaceItem[] {
  const out: PlaceItem[] = [];
  for (let n = from; n <= to; n++) {
    out.push({ id: id(), label: `${prefix} ${n}`, enabled: true });
  }
  return out;
}

export function defaultPlaceSections(typeId: string): PlaceSection[] {
  if (typeId === 'cafe') {
    return [
      {
        id: id(),
        name: 'Pickup Counter',
        places: [
          { id: id(), label: 'Counter', enabled: true },
          { id: id(), label: 'Window', enabled: true },
        ],
      },
      {
        id: id(),
        name: 'Table Stands',
        places: tables('Stand', 1, 6),
      },
      {
        id: id(),
        name: 'Outdoor Seating',
        places: tables('Patio', 1, 4),
      },
    ];
  }
  if (typeId === 'hotel') {
    return [
      {
        id: id(),
        name: 'Rooms',
        places: tables('Room', 101, 106),
      },
      {
        id: id(),
        name: 'Suites',
        places: [
          { id: id(), label: 'Suite 201', enabled: true },
          { id: id(), label: 'Suite 202', enabled: true },
        ],
      },
      {
        id: id(),
        name: 'Lobby',
        places: [{ id: id(), label: 'Lobby Desk', enabled: true }],
      },
      {
        id: id(),
        name: 'Pool',
        places: [{ id: id(), label: 'Pool Cabana 1', enabled: true }],
      },
    ];
  }
  if (typeId === 'festival') {
    return [
      {
        id: id(),
        name: 'Main Stage',
        places: [
          { id: id(), label: 'Main Stage Bar', enabled: true },
          { id: id(), label: 'VIP Lawn', enabled: true },
        ],
      },
      {
        id: id(),
        name: 'Food Court',
        places: [
          { id: id(), label: 'North Food Court', enabled: true },
          { id: id(), label: 'South Food Court', enabled: true },
        ],
      },
    ];
  }
  if (typeId === 'airport') {
    return [
      {
        id: id(),
        name: 'Gates',
        places: [
          { id: id(), label: 'Gate B12', enabled: true },
          { id: id(), label: 'Gate B14', enabled: true },
        ],
      },
      {
        id: id(),
        name: 'Lounges',
        places: [{ id: id(), label: 'Lounge A', enabled: true }],
      },
    ];
  }
  if (typeId === 'healthcare') {
    return [
      {
        id: id(),
        name: 'Waiting',
        places: [
          { id: id(), label: 'Bay A', enabled: true },
          { id: id(), label: 'Bay B', enabled: true },
        ],
      },
      {
        id: id(),
        name: 'Reception',
        places: [{ id: id(), label: 'Reception', enabled: true }],
      },
    ];
  }
  // restaurant default
  return [
    {
      id: id(),
      name: 'Main Dining',
      places: tables('Table', 1, 4),
    },
    {
      id: id(),
      name: 'Patio',
      places: tables('Table', 20, 21),
    },
    {
      id: id(),
      name: 'Bar',
      places: [
        { id: id(), label: 'Bar Seat 1', enabled: true },
        { id: id(), label: 'Bar Seat 2', enabled: true },
      ],
    },
  ];
}

export function enabledPlaces(sections: PlaceSection[]): Array<{ section: string; label: string }> {
  const out: Array<{ section: string; label: string }> = [];
  for (const s of sections) {
    for (const p of s.places) {
      if (p.enabled) out.push({ section: s.name, label: p.label });
    }
  }
  return out;
}

export function placeCodesFromSections(sections: PlaceSection[]): string[] {
  return enabledPlaces(sections).map((p) => p.label);
}

export function findPlaceContext(
  sections: PlaceSection[],
  label: string,
): { section: string; label: string } | null {
  for (const s of sections) {
    const hit = s.places.find((p) => p.label === label && p.enabled);
    if (hit) return { section: s.name, label: hit.label };
  }
  const all = enabledPlaces(sections);
  return all[0] ?? null;
}

export function generateNumberedPlaces(
  noun: string,
  from: number,
  to: number,
): PlaceItem[] {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const out: PlaceItem[] = [];
  for (let n = lo; n <= hi; n++) {
    out.push({ id: id(), label: `${noun} ${n}`, enabled: true });
  }
  return out;
}

export function newSection(name: string, places: PlaceItem[] = []): PlaceSection {
  return { id: id(), name, places };
}

export function newPlace(label: string): PlaceItem {
  return { id: id(), label, enabled: true };
}
