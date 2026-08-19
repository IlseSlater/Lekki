import { Injectable, signal } from '@angular/core';
import {
  SETUP_STEPS,
  experienceLabel,
  getExperience,
  type ExperienceTypeId,
  type SetupStepSlug,
} from '../studio/experience-registry';
import {
  categoriesFromDesign,
  defaultDesignForType,
  type GuestExperienceDesign,
} from '../studio/guest-experience-design';
import {
  defaultPlaceSections,
  placeCodesFromSections,
  type PlaceSection,
} from '../studio/place-sections';

export type StudioMode = 'setup' | 'operate' | 'grow' | 'team';

export type WorkspaceExperience = {
  id: string;
  typeId: ExperienceTypeId;
  venueName: string;
  /** Optional brand mark shown on Live Experience splash / arrival */
  logoUrl: string;
  /** Brand accent (#hex) — Live Experience morph */
  brandColour: string;
  /** Where guests find you (city / suburb / address line) */
  location: string;
  placeCode: string;
  placeCodes: string[];
  /** Sections of join places (tables / rooms / zones…) */
  placeSections: PlaceSection[];
  experienceNotes: string;
  /** Categories guests can choose — derived from guestDesign */
  categories: string[];
  /** Human-language guest experience design */
  guestDesign: GuestExperienceDesign;
  experienceUpdatedAt: string | null;
  token: string;
  paymentsDone: boolean;
  live: boolean;
  steps: Partial<Record<SetupStepSlug, boolean>>;
};

const WS_KEY = 'leos.studio.workspace';
const LAST_SEEN_KEY = 'leos.studio.lastSeenAt';
const LEGACY_PACK = 'leos.studio.pack';
const LEGACY_CONFIG = 'leos.studio.config';
const LEGACY_PAYMENTS = 'leos.studio.payments';

/** Shared Studio context — Never Ask a Human to Remember (lite). */
@Injectable({ providedIn: 'root' })
export class StudioContextService {
  readonly mode = signal<StudioMode>('setup');

  /** Bumps whenever workspace mutates — Live Experience reacts. */
  readonly liveRevision = signal(0);
  /** Place label currently highlighted in Live Experience (Places step). */
  readonly liveFocusPlace = signal<string | null>(null);
  /** Guest pay methods shown in Live Experience (How guests pay). */
  readonly livePayMethods = signal<{ card: boolean; applePay: boolean; googlePay: boolean }>({
    card: true,
    applePay: true,
    googlePay: true,
  });
  /** Studio nav / Open full → Live Experience fullscreen. */
  readonly liveFullscreenOpen = signal(false);

  touchLive() {
    this.liveRevision.update((n) => n + 1);
  }

  setLiveFocusPlace(label: string | null) {
    this.liveFocusPlace.set(label);
    this.touchLive();
  }

  setLivePayMethods(methods: { card: boolean; applePay: boolean; googlePay: boolean }) {
    this.livePayMethods.set(methods);
    this.touchLive();
  }

  openLiveExperience() {
    this.liveFullscreenOpen.set(true);
  }

  closeLiveExperience() {
    this.liveFullscreenOpen.set(false);
  }

  /** Migrate legacy keys once into workspace model. */
  private migrateLegacy(): void {
    if (localStorage.getItem(WS_KEY)) return;
    const typeId = (localStorage.getItem(LEGACY_PACK) ?? '') as ExperienceTypeId | '';
    let venueName = '';
    let placeCode = '';
    let token = '';
    try {
      const raw = localStorage.getItem(LEGACY_CONFIG);
      if (raw) {
        const cfg = JSON.parse(raw) as {
          venueName?: string;
          placeCode?: string;
          token?: string;
          packId?: string;
        };
        venueName = cfg.venueName ?? '';
        placeCode = cfg.placeCode ?? '';
        token = cfg.token ?? '';
      }
    } catch {
      /* ignore */
    }
    if (!typeId && !venueName && !token) return;
    const def = getExperience(typeId || 'restaurant');
    const paymentsDone = localStorage.getItem(LEGACY_PAYMENTS) === '1';
    const live = !!token;
    const design = defaultDesignForType(typeId || 'restaurant');
    const sections = defaultPlaceSections(typeId || 'restaurant');
    const codes = placeCodesFromSections(sections);
    const exp: WorkspaceExperience = {
      id: `exp-${Date.now()}`,
      typeId: (typeId || 'restaurant') as ExperienceTypeId,
      venueName: venueName || def?.defaults.venueName || 'Blue Door',
      logoUrl: '',
      brandColour: '#d7a14a',
      location: '',
      placeCode: placeCode || codes[0] || def?.defaults.placeCode || 'Table 12',
      placeCodes: placeCode ? [placeCode] : codes,
      placeSections: sections,
      experienceNotes: (def?.defaults.experienceCategories ?? []).join(', '),
      categories: categoriesFromDesign(design, typeId || 'restaurant'),
      guestDesign: design,
      experienceUpdatedAt: null,
      token: token || def?.defaults.token || 'qr-demo-restaurant',
      paymentsDone,
      live,
      steps: {
        identity: !!(venueName || def),
        experience: true,
        places: !!(placeCode || def),
        payments: paymentsDone,
        golive: live,
      },
    };
    this.saveWorkspace({ experiences: [exp], activeId: exp.id });
  }

  readWorkspace(): { experiences: WorkspaceExperience[]; activeId: string | null } {
    this.migrateLegacy();
    try {
      const raw = localStorage.getItem(WS_KEY);
      if (!raw) return { experiences: [], activeId: null };
      const parsed = JSON.parse(raw) as {
        experiences?: WorkspaceExperience[];
        activeId?: string | null;
      };
      const experiences = (parsed.experiences ?? []).map((e) => normalizeExperience(e));
      return {
        experiences,
        activeId: parsed.activeId ?? experiences[0]?.id ?? null,
      };
    } catch {
      return { experiences: [], activeId: null };
    }
  }

  saveWorkspace(ws: { experiences: WorkspaceExperience[]; activeId: string | null }) {
    localStorage.setItem(WS_KEY, JSON.stringify(ws));
    // Keep legacy keys in sync for older pages during transition
    const active = ws.experiences.find((e) => e.id === ws.activeId) ?? ws.experiences[0];
    if (active) {
      localStorage.setItem(LEGACY_PACK, active.typeId);
      localStorage.setItem(
        LEGACY_CONFIG,
        JSON.stringify({
          venueName: active.venueName,
          placeCode: active.placeCode,
          packId: active.typeId,
          token: active.token,
        }),
      );
      localStorage.setItem(LEGACY_PAYMENTS, active.paymentsDone ? '1' : '0');
    }
    this.touchLive();
  }

  activeExperience(): WorkspaceExperience | null {
    const ws = this.readWorkspace();
    if (!ws.activeId) return ws.experiences[0] ?? null;
    return ws.experiences.find((e) => e.id === ws.activeId) ?? ws.experiences[0] ?? null;
  }

  hasExperiences(): boolean {
    return this.readWorkspace().experiences.length > 0;
  }

  upsertActive(patch: Partial<WorkspaceExperience>) {
    const ws = this.readWorkspace();
    let active = ws.experiences.find((e) => e.id === ws.activeId) ?? ws.experiences[0];
    if (!active) {
      const typeId = (patch.typeId ?? 'restaurant') as ExperienceTypeId;
      const def = getExperience(typeId);
      const design = defaultDesignForType(typeId);
      const sections = defaultPlaceSections(typeId);
      active = {
        id: `exp-${Date.now()}`,
        typeId,
        venueName: def?.defaults.venueName ?? '',
        logoUrl: '',
        brandColour: '#d7a14a',
        location: '',
        placeCode: def?.defaults.placeCode ?? '',
        placeCodes: [def?.defaults.placeCode ?? ''],
        placeSections: sections,
        experienceNotes: (def?.defaults.experienceCategories ?? []).join(', '),
        categories: categoriesFromDesign(design, typeId),
        guestDesign: design,
        experienceUpdatedAt: null,
        token: def?.defaults.token ?? 'qr-demo-restaurant',
        paymentsDone: false,
        live: false,
        steps: {},
      };
      ws.experiences = [active];
      ws.activeId = active.id;
    }
    Object.assign(active, patch);
    if (patch.steps) {
      active.steps = { ...active.steps, ...patch.steps };
    }
    this.saveWorkspace(ws);
  }

  startExperience(typeId: ExperienceTypeId) {
    const def = getExperience(typeId);
    if (!def) return;
    const design = defaultDesignForType(typeId);
    const sections = defaultPlaceSections(typeId);
    const ws = this.readWorkspace();
    // Inherit identity · brand · payments from prior live (or last) experience — Never Ask a Human to Remember.
    const source =
      ws.experiences.find((e) => e.id === ws.activeId && e.live) ||
      ws.experiences.find((e) => e.live) ||
      ws.experiences.find((e) => e.id === ws.activeId) ||
      ws.experiences[0];
    const inherit = !!(source?.venueName?.trim() || source?.logoUrl || source?.location?.trim());
    const exp: WorkspaceExperience = {
      id: `exp-${Date.now()}`,
      typeId,
      venueName: inherit && source?.venueName?.trim() ? source.venueName : def.defaults.venueName,
      logoUrl: inherit ? source?.logoUrl || '' : '',
      brandColour: inherit && source?.brandColour ? source.brandColour : '#d7a14a',
      location: inherit ? source?.location || '' : '',
      placeCode: def.defaults.placeCode,
      placeCodes: placeCodesFromSections(sections),
      placeSections: sections,
      experienceNotes: def.defaults.experienceCategories.join(', '),
      categories: categoriesFromDesign(design, typeId),
      guestDesign: design,
      experienceUpdatedAt: null,
      token: def.defaults.token,
      paymentsDone: inherit ? !!source?.paymentsDone : false,
      live: false,
      steps: {
        identity: inherit && !!source?.venueName?.trim(),
        payments: inherit && !!source?.paymentsDone,
      },
    };
    const live = ws.experiences.filter((e) => e.live);
    // Replace unfinished draft(s); keep every live experience
    ws.experiences = [...live, exp];
    ws.activeId = exp.id;
    this.saveWorkspace(ws);
  }

  /** Continuity — Studio remembers the owner returned. */
  touchLastSeen() {
    try {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
  }

  lastSeenAt(): string | null {
    try {
      return localStorage.getItem(LAST_SEEN_KEY);
    } catch {
      return null;
    }
  }

  markStep(step: SetupStepSlug, done = true) {
    const active = this.activeExperience();
    if (!active) return;
    this.upsertActive({
      steps: { ...active.steps, [step]: done },
      ...(step === 'payments' ? { paymentsDone: done } : {}),
      ...(step === 'golive' && done ? { live: true } : {}),
    });
  }

  nextIncompleteStep(): SetupStepSlug | 'done' {
    const active = this.activeExperience();
    if (!active) return 'identity';
    for (const s of SETUP_STEPS) {
      if (!active.steps[s.slug]) return s.slug;
    }
    return 'done';
  }

  setupProgress(): { done: number; total: number; current: SetupStepSlug | 'done' } {
    const active = this.activeExperience();
    const total = SETUP_STEPS.length;
    if (!active) return { done: 0, total, current: 'identity' };
    const done = SETUP_STEPS.filter((s) => active.steps[s.slug]).length;
    return { done, total, current: this.nextIncompleteStep() };
  }

  /** Compatibility for older pages */
  readConfig(): {
    packId: string;
    typeId: string;
    venueName: string;
    placeCode: string;
    token: string;
    paymentsDone: boolean;
    live: boolean;
  } {
    const active = this.activeExperience();
    if (!active) {
      return {
        packId: '',
        typeId: '',
        venueName: '',
        placeCode: '',
        token: '',
        paymentsDone: false,
        live: false,
      };
    }
    return {
      packId: active.typeId,
      typeId: active.typeId,
      venueName: active.venueName,
      placeCode: active.placeCode,
      token: active.token,
      paymentsDone: active.paymentsDone,
      live: active.live,
    };
  }

  displayVenue(): string {
    const active = this.activeExperience();
    if (active?.venueName) return active.venueName;
    if (active?.typeId) return experienceLabel(active.typeId);
    return 'Your experience';
  }

  displayTypeLabel(): string {
    return experienceLabel(this.activeExperience()?.typeId);
  }

  modeFromUrl(url: string): StudioMode {
    if (url.includes('/studio/operate')) return 'operate';
    if (url.includes('/studio/grow')) return 'grow';
    if (url.includes('/studio/team')) return 'team';
    return 'setup';
  }

  pathForStep(slug: SetupStepSlug): string {
    return `/studio/setup/${slug}`;
  }

  /** First incomplete Setup step — for Live Experience entry from Studio Home. */
  nextIncompleteSetupPath(): string {
    const active = this.activeExperience();
    if (!active) return '/studio/create';
    for (const step of SETUP_STEPS) {
      if (!active.steps[step.slug]) return this.pathForStep(step.slug);
    }
    return this.pathForStep('golive');
  }
}

function normalizeExperience(
  e: WorkspaceExperience & {
    categories?: string[];
    guestDesign?: GuestExperienceDesign;
    placeSections?: PlaceSection[];
    logoUrl?: string;
    brandColour?: string;
    location?: string;
  },
): WorkspaceExperience {
  const def = getExperience(e.typeId);
  const guestDesign = e.guestDesign
    ? { ...defaultDesignForType(e.typeId), ...e.guestDesign }
    : defaultDesignForType(e.typeId);
  const placeSections =
    e.placeSections?.length
      ? e.placeSections
      : e.placeCodes?.length
        ? [
            {
              id: `legacy-${e.id}`,
              name: def?.defaults.placeLabel ?? 'Places',
              places: e.placeCodes.map((label, i) => ({
                id: `legacy-p-${i}`,
                label,
                enabled: true,
              })),
            },
          ]
        : defaultPlaceSections(e.typeId);
  const fromSections = placeCodesFromSections(placeSections);
  const categories =
    e.categories?.length
      ? e.categories
      : categoriesFromDesign(guestDesign, e.typeId).length
        ? categoriesFromDesign(guestDesign, e.typeId)
        : e.experienceNotes
          ? e.experienceNotes
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [...(def?.defaults.experienceCategories ?? [])];
  return {
    ...e,
    logoUrl: e.logoUrl ?? '',
    brandColour: e.brandColour || '#d7a14a',
    location: e.location ?? '',
    guestDesign,
    placeSections,
    placeCodes: fromSections.length ? fromSections : e.placeCodes ?? [],
    placeCode: e.placeCode || fromSections[0] || def?.defaults.placeCode || '',
    categories,
    experienceUpdatedAt: e.experienceUpdatedAt ?? null,
  };
}
