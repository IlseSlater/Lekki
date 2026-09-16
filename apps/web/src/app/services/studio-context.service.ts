import { Injectable, inject, signal } from '@angular/core';
import { LeosApiService } from './leos-api.service';
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
import type { LiveFactsInput } from '../studio/live-facts';
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
  /** Runtime venue id — set after identity / go live context resolve */
  venueId?: string;
  organisationId?: string;
  /** Runtime physical context for entry token minting. */
  physicalContextId?: string;
  /** Durable /assets or https URL — never Base64 */
  logoUrl: string;
  /** Brand accent (#hex) — Live Experience morph */
  brandColour: string;
  /** Guest menu half-moon brand band (above filters) */
  menuBrandEnabled: boolean;
  /** Durable cover URL — never Base64 */
  menuCoverUrl: string;
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

const SERVER_BRAND_KEYS: Array<keyof WorkspaceExperience> = [
  'venueName',
  'logoUrl',
  'brandColour',
  'menuBrandEnabled',
  'menuCoverUrl',
  'location',
  'guestDesign',
];

function stripDataUrl(url: string | undefined): string {
  const u = (url ?? '').trim();
  if (!u) return '';
  if (u.toLowerCase().startsWith('data:')) return '';
  return u;
}

/** Shared Studio context — Venue API is source of truth for brand presentation. */
@Injectable({ providedIn: 'root' })
export class StudioContextService {
  private readonly api = inject(LeosApiService);
  private serverPatchTimer?: ReturnType<typeof setTimeout>;
  private hydratingVenueId: string | null = null;

  readonly mode = signal<StudioMode>('setup');
  readonly liveRevision = signal(0);
  readonly liveFocusPlace = signal<string | null>(null);
  readonly livePayMethods = signal<{ card: boolean; applePay: boolean; googlePay: boolean }>({
    card: true,
    applePay: true,
    googlePay: true,
  });
  /** Connector install active for the hydrated venue. */
  readonly livePaymentsActive = signal(false);
  readonly liveFullscreenOpen = signal(false);
  readonly workspaceHydrated = signal(false);
  /** Server facts for the minted token — never localStorage. */
  readonly liveSession = signal<LiveFactsInput['session']>(null);
  private liveSessionKey = '';

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

  setLivePaymentsActive(active: boolean) {
    this.livePaymentsActive.set(!!active);
    this.touchLive();
  }

  openLiveExperience() {
    this.liveFullscreenOpen.set(true);
  }

  closeLiveExperience() {
    this.liveFullscreenOpen.set(false);
  }

  /** Hydrate brand + guestDesign from GET /studio/workspace/:venueId. */
  initWorkspace(venueId: string) {
    const id = venueId?.trim();
    if (!id) return;
    if (this.hydratingVenueId === id && this.workspaceHydrated()) return;
    this.hydratingVenueId = id;
    this.api.getWorkspace(id).subscribe({
      next: (ws) => {
        const guestDesign =
          ws.guestDesign && typeof ws.guestDesign === 'object'
            ? ({
                ...defaultDesignForType(this.activeExperience()?.typeId || 'restaurant'),
                ...(ws.guestDesign as Partial<GuestExperienceDesign>),
              } as GuestExperienceDesign)
            : undefined;
        this.upsertActive(
          {
            venueId: ws.venueId,
            organisationId: ws.organisationId,
            venueName: ws.venueName || undefined,
            brandColour: ws.brandColour || '#d7a14a',
            menuBrandEnabled: !!ws.menuBrandEnabled,
            logoUrl: stripDataUrl(ws.logoUrl),
            menuCoverUrl: stripDataUrl(ws.menuCoverUrl),
            location: ws.location || '',
            ...(guestDesign ? { guestDesign } : {}),
          },
          { syncServer: false },
        );
        this.workspaceHydrated.set(true);
        this.setLivePaymentsActive(ws.paymentsActive === true);
      },
      error: () => {
        this.hydratingVenueId = null;
        this.workspaceHydrated.set(false);
      },
    });
  }

  setLiveSession(session: LiveFactsInput['session']) {
    this.liveSession.set(session);
    this.touchLive();
  }

  /**
   * Load venue, place and catalogue from the server for this venue / minted place.
   * Does not call /entry/resolve — that would open a guest session.
   */
  loadLiveSession(input: { venueId?: string; placeCode?: string } = {}) {
    const venueId = input.venueId?.trim() || this.activeExperience()?.venueId?.trim() || '';
    const knownPlace = input.placeCode?.trim() || this.activeExperience()?.placeCode?.trim() || '';
    if (!venueId) return;
    const key = `${venueId}|${knownPlace}`;
    if (this.liveSessionKey === key && this.liveSession()) return;
    this.liveSessionKey = key;

    const apply = (
      venueName: string,
      placeCode: string,
      catalogue: Array<{ label: string; priceMinor: number }> | null,
    ) => {
      this.liveSession.set({ venueName, placeCode, catalogue });
      this.touchLive();
    };

    const loadCatalogue = (id: string, venueName: string, placeCode: string) => {
      this.api.getCatalogue(id).subscribe({
        next: (rows) =>
          apply(
            venueName,
            placeCode,
            rows
              .filter((row) => row.available !== false)
              .map((row) => ({
                label: row.label,
                priceMinor: Math.round(Number(row.unitPrice) * 100),
              })),
          ),
        error: () => apply(venueName, placeCode, null),
      });
    };

    this.api.getWorkspace(venueId).subscribe({
      next: (ws) => {
        if (knownPlace) {
          loadCatalogue(venueId, ws.venueName, knownPlace);
          return;
        }
        this.api.resolveSetupEntryContext().subscribe({
          next: (ctx) => loadCatalogue(venueId, ws.venueName, ctx.placeCode),
          error: () => loadCatalogue(venueId, ws.venueName, ''),
        });
      },
      error: () => {
        if (knownPlace) loadCatalogue(venueId, '', knownPlace);
      },
    });
  }

  /** Resolve venueId if needed, then hydrate. */
  ensureWorkspaceHydrated() {
    const active = this.activeExperience();
    const venueId = active?.venueId?.trim();
    if (venueId) {
      this.initWorkspace(venueId);
      return;
    }
    this.api.getGrowOverview().subscribe({
      next: (overview) => {
        if (overview.venueId) {
          this.upsertActive({ venueId: overview.venueId }, { syncServer: false });
          this.initWorkspace(overview.venueId);
        }
      },
      error: () => undefined,
    });
  }

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
      venueName: venueName || def?.defaults.venueName || 'Your place',
      logoUrl: '',
      brandColour: '#d7a14a',
      menuBrandEnabled: false,
      menuCoverUrl: '',
      location: '',
      placeCode: placeCode || codes[0] || def?.defaults.placeCode || 'Table 12',
      placeCodes: placeCode ? [placeCode] : codes,
      placeSections: sections,
      experienceNotes: (def?.defaults.experienceCategories ?? []).join(', '),
      categories: categoriesFromDesign(design, typeId || 'restaurant'),
      guestDesign: design,
      experienceUpdatedAt: null,
        token: token || '',
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
    for (const e of ws.experiences) {
      e.logoUrl = stripDataUrl(e.logoUrl);
      e.menuCoverUrl = stripDataUrl(e.menuCoverUrl);
    }
    localStorage.setItem(WS_KEY, JSON.stringify(ws));
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

  upsertActive(
    patch: Partial<WorkspaceExperience>,
    opts?: { syncServer?: boolean },
  ) {
    const syncServer = opts?.syncServer !== false;
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
        menuBrandEnabled: false,
        menuCoverUrl: '',
        location: '',
        placeCode: def?.defaults.placeCode ?? '',
        placeCodes: [def?.defaults.placeCode ?? ''],
        placeSections: sections,
        experienceNotes: (def?.defaults.experienceCategories ?? []).join(', '),
        categories: categoriesFromDesign(design, typeId),
        guestDesign: design,
        experienceUpdatedAt: null,
        token: '',
        paymentsDone: false,
        live: false,
        steps: {},
      };
      ws.experiences = [active];
      ws.activeId = active.id;
    }
    if (patch.logoUrl !== undefined) patch.logoUrl = stripDataUrl(patch.logoUrl);
    if (patch.menuCoverUrl !== undefined) {
      patch.menuCoverUrl = stripDataUrl(patch.menuCoverUrl);
    }
    Object.assign(active, patch);
    if (patch.steps) {
      active.steps = { ...active.steps, ...patch.steps };
    }
    if (patch.guestDesign) {
      active.categories = categoriesFromDesign(active.guestDesign, active.typeId);
    }
    this.saveWorkspace(ws);
    if (syncServer && SERVER_BRAND_KEYS.some((k) => k in patch)) {
      this.scheduleServerPatch();
    }
  }

  private scheduleServerPatch() {
    if (this.serverPatchTimer) clearTimeout(this.serverPatchTimer);
    this.serverPatchTimer = setTimeout(() => this.flushServerPatch(), 500);
  }

  private flushServerPatch() {
    const active = this.activeExperience();
    const venueId = active?.venueId?.trim();
    if (!active || !venueId) return;
    this.api
      .patchWorkspace(venueId, {
        venueName: active.venueName,
        brandColour: active.brandColour,
        menuBrandEnabled: active.menuBrandEnabled,
        logoUrl: stripDataUrl(active.logoUrl),
        menuCoverUrl: stripDataUrl(active.menuCoverUrl),
        location: active.location,
        guestDesign: active.guestDesign as unknown as Record<string, unknown>,
      })
      .subscribe({ error: () => undefined });
  }

  startExperience(typeId: ExperienceTypeId) {
    const def = getExperience(typeId);
    if (!def) return;
    const design = defaultDesignForType(typeId);
    const sections = defaultPlaceSections(typeId);
    const ws = this.readWorkspace();
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
      logoUrl: inherit ? stripDataUrl(source?.logoUrl) : '',
      brandColour: inherit && source?.brandColour ? source.brandColour : '#d7a14a',
      menuBrandEnabled: false,
      menuCoverUrl: '',
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
      venueId: inherit ? source?.venueId : undefined,
      organisationId: inherit ? source?.organisationId : undefined,
    };
    const live = ws.experiences.filter((e) => e.live);
    ws.experiences = [...live, exp];
    ws.activeId = exp.id;
    this.saveWorkspace(ws);
    if (exp.venueId) this.initWorkspace(exp.venueId);
  }

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
    this.upsertActive(
      {
        steps: { ...active.steps, [step]: done },
        ...(step === 'payments' ? { paymentsDone: done } : {}),
        ...(step === 'golive' && done ? { live: true } : {}),
      },
      { syncServer: false },
    );
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
    menuBrandEnabled?: boolean;
    menuCoverUrl?: string;
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
    logoUrl: stripDataUrl(e.logoUrl),
    brandColour: e.brandColour || '#d7a14a',
    menuBrandEnabled: !!e.menuBrandEnabled,
    menuCoverUrl: stripDataUrl(e.menuCoverUrl),
    location: e.location ?? '',
    guestDesign,
    placeSections,
    placeCodes: fromSections.length ? fromSections : e.placeCodes ?? [],
    placeCode: e.placeCode || fromSections[0] || def?.defaults.placeCode || '',
    categories,
    experienceUpdatedAt: e.experienceUpdatedAt ?? null,
  };
}
