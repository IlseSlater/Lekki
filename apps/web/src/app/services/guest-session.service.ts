import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GuestBillComponent, type BillDisplayLine, type BillLine } from '../leos/guest-bill.component';
import { type GuestOrder } from '../leos/guest-orders.component';
import { type GuestTabId } from '../leos/guest-tab-bar.component';
import { type GuestHelpKind } from '../leos/guest-help-sheet.component';
import {
  type CatalogChoiceGroup,
  type ChoiceSheetResult,
} from '../leos/guest-choices-sheet.component';
import type { StatusTimelineStep } from '../leos/status-timeline.component';
import {
  buildStatusTimelineSteps,
  progressGuidance,
  progressLabelsForProfile,
  type PlatformProgressStep,
} from '../leos/progress-timeline';
import { guestServiceAssistCopy, guestManagerAssistCopy } from '../studio/operate-status';
import { safeGuestImageUrl } from '../leos/catalogue-parity';
import {
  applyCatalogueItemChange,
  formatAllergenLine,
  formatDietaryLine,
  guestVisibleCatalogueItems,
} from '../studio/catalogue-guest-visibility';
import { LeosApiService, SessionStateService } from './leos-api.service';
import type { PlatformEventEnvelope } from './leos-api.service';
import { TerminologyService } from './terminology.service';
import { OnboardingService } from './onboarding.service';
import { resolveAllowTip } from '../studio/tip-continuity';
import { resolveAllowPay } from '../studio/pay-continuity';
import { resolveAllowHelp } from '../studio/help-continuity';
import { resolveShowSpecials } from '../studio/specials-continuity';
import { offlineQueue } from './offline-queue';
import { hasOpenBalance, isCleared, isGreaterMinor, toMinor, fromMinor } from '../leos/money';
import { composeStillInBanner } from '../studio/mid-visit-resume';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';


export type GuestPhase = 'browse' | 'specials' | 'cart' | 'live' | 'payment' | 'receipt' | 'leave';

export type CatalogueItem = {
  id: string;
  label: string;
  category: string;
  unitPrice: number;
  routingTags: string[];
  description?: string;
  choiceGroups?: CatalogChoiceGroup[];
  imageUrl?: string;
  available?: boolean;
  allergens?: string[];
  dietaryTags?: string[];
  ageRestricted?: boolean;
};

export type CartLine = {
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  routingTags: string[];
  choiceSummary?: string;
  specialRequest?: string;
  selections?: Record<string, string[]>;
  imageUrl?: string;
};

export type FulfilmentRow = {
  id: string;
  status: string;
  stationId: string;
  lines: Array<{ label?: string; quantity: number }>;
};

type SessionGuest = {
  id: string;
  displayName?: string;
  identityId?: string | null;
  role?: string;
};

const TERMINAL_FULFILMENT_STATUSES = new Set(['served', 'delivered', 'completed', 'cancelled']);

function guestShareKey(guest: SessionGuest): string {
  const identity = guest.identityId?.trim();
  if (identity) return `id:${identity}`;
  const name = (guest.displayName ?? '').trim().toLowerCase();
  return name ? `name:${name}` : `row:${guest.id}`;
}

/** Distinct people at the table — QR re-entries of the same guest count once. */
export function equalShareState(
  participants: SessionGuest[],
  paidEqualParticipantIds: Set<string>,
  myParticipantId?: string,
): { distinct: number; unpaid: number; minePaid: boolean } {
  const keys = new Set<string>();
  const paidKeys = new Set<string>();
  let myKey = '';
  for (const guest of participants) {
    if (guest.role && guest.role !== 'guest') continue;
    const key = guestShareKey(guest);
    keys.add(key);
    if (paidEqualParticipantIds.has(guest.id)) paidKeys.add(key);
    if (myParticipantId && guest.id === myParticipantId) myKey = key;
  }
  return {
    distinct: keys.size,
    unpaid: Math.max(0, keys.size - paidKeys.size),
    minePaid: !!myKey && paidKeys.has(myKey),
  };
}

/**
 * Guest domain state engine — cart, live, bill, pay, help, leave, catalogue.
 * Provided on GuestPageComponent (not root) so splash/entry do not share cart.
 */
@Injectable()
export class GuestSessionService {

  private readonly api = inject(LeosApiService);
  private readonly router = inject(Router);
  private readonly onboarding = inject(OnboardingService);
  readonly state = inject(SessionStateService);
  readonly terms = inject(TerminologyService);

  private bill?: GuestBillComponent;

  attachBill(bill: GuestBillComponent | undefined) {
    this.bill = bill;
  }

  phase: GuestPhase = 'browse';
  /** Tip Continuity — false until refresh; never flash tips when Setup Tips is off. */
  allowTip = false;
  /** Pay Continuity — false until refresh; never flash Bill when Studio Pay is off. */
  allowPay = false;
  /** Call Staff Continuity — false until refresh; never flash Help when Call Staff is off. */
  allowHelp = false;
  /** Specials Continuity — Studio guestDesign.specials. */
  showSpecials = false;
  catalogue: CatalogueItem[] = [];
  catalogueLoading = false;
  cart: CartLine[] = [];
  editingCartIndex: number | null = null;
  billLines: BillLine[] = [];
  mineBillLines: BillLine[] = [];
  /** Remaining visit / mine / equal balances after completed payments (Continuity polish). */
  visitRemaining: number | null = null;
  mineRemaining: number | null = null;
  equalRemaining: number | null = null;
  /** Open tx lines with ids — inline Claim on Visit tab. */
  billDetailLines: BillDisplayLine[] | null = null;
  claimingLineId: string | null = null;
  recentlyClaimedIds: string[] = [];
  mineScopePulse = false;
  claimUndo: {
    lineId: string;
    label: string;
    previousParticipantId: string | null;
  } | null = null;
  private claimUndoTimer?: ReturnType<typeof setTimeout>;
  private claimFlashTimer?: ReturnType<typeof setTimeout>;
  private minePulseTimer?: ReturnType<typeof setTimeout>;
  private participantCount = 0;
  tablePeople: string[] = [];
  /** One-shot: open bill preferring Mine when shares differ. */
  private preferMineScope = false;
  /** Land on Specials once when Studio has Specials on for this visit. */
  private preferSpecialsLanding = true;
  orderRecordedFlash = false;
  paymentMethodHint = 'You’ll confirm on a secure payment page if needed.';
  paymentMethodsPanelOpen = false;
  savedPaymentMethodStatus: 'none' | 'locked' | 'ready' = 'none';
  paymentMethodLabel = 'Card';
  awaitingPaymentConfirm = false;
  /** Continuity — calm moment after Mine pay while visit still open. */
  shareSettledMoment = false;
  /** Set after payment request — refreshLive decides settle vs receipt. */
  private pendingMineSettleCheck = false;
  /** Honest receipt — sum of completed payments only. */
  receiptPaidTotal = 0;
  /** Restore Stay from leave confirm. */
  private phaseBeforeLeave: GuestPhase = 'browse';
  search = '';
  searchOpen = false;
  categoryFilter = '';
  fulfilments: FulfilmentRow[] = [];
  timelineSteps: StatusTimelineStep[] = [];
  timelineGuidance = '';
  timelineAnnouncement = '';
  offline = false;
  liveError = '';
  balanceDue = true;
  submitting = false;
  helpSheetOpen = false;
  helpBusy = false;
  /** G-04 — catalogue item open in choices sheet (null = closed). */
  choicesItem: CatalogueItem | null = null;
  serviceHelpPending = false;
  managerHelpPending = false;
  paying = false;
  paymentError = '';
  message = '';
  error = '';
  lastOrderTotal = 0;
  private poll?: ReturnType<typeof setInterval>;
  private unsubPlatform?: () => void;
  private lastAnnouncedStep: PlatformProgressStep | '' = '';
  private onlineHandler = () => this.onConnectivityChange(true);
  private offlineHandler = () => this.onConnectivityChange(false);

  get primaryFulfilment(): FulfilmentRow | null {
    return (
      this.fulfilments.find(
        (f) => !TERMINAL_FULFILMENT_STATUSES.has((f.status || '').toLowerCase()),
      ) ??
      this.fulfilments[0] ??
      null
    );
  }

  get guestOrders(): GuestOrder[] {
    if (!this.fulfilments.length) {
      if (this.lastOrderTotal > 0 || this.offlinePending) {
        return [
          {
            id: 'pending-local',
            status: 'pending',
            createdAt: new Date(),
            lines: this.billLines.length
              ? this.billLines.map((l) => ({
                  label: l.label,
                  quantity: l.quantity,
                  status: 'pending',
                }))
              : [{ label: 'Your order', quantity: 1, status: 'pending' }],
          },
        ];
      }
      return [];
    }
    return this.fulfilments.map((f) => ({
      id: f.id,
      status: f.status,
      lines: (f.lines ?? []).map((l) => ({
        label: l.label ?? 'Item',
        quantity: l.quantity,
        status: f.status,
      })),
    }));
  }

  get offlinePending(): boolean {
    return offlineQueue.hasPending('transaction.create');
  }

  get isReady(): boolean {
    const s = this.primaryFulfilment?.status?.toLowerCase() ?? '';
    return s === 'ready' || s === 'delivered' || s === 'completed';
  }





  get serviceAssist() {
    return guestServiceAssistCopy(this.state.profileId);
  }

  get managerAssist() {
    return guestManagerAssistCopy(this.state.profileId);
  }














  get cartCount(): number {
    return this.cart.reduce((n, l) => n + l.quantity, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
  }



















  get editingCartLine(): CartLine | null {
    if (this.editingCartIndex == null) return null;
    return this.cart[this.editingCartIndex] ?? null;
  }

  onTabSelect(tab: GuestTabId) {
    if (tab === 'specials') {
      this.phase = 'specials';
      return;
    }
    if (tab === 'menu') {
      this.phase = 'browse';
      return;
    }
    if (tab === 'orders') {
      this.shareSettledMoment = false;
      this.phase = 'live';
      this.bindLiveSocket();
      this.refreshLive();
      this.startLivePoll();
      return;
    }
    if (tab === 'bill') {
      if (!this.allowPay) return;
      this.openBill();
    }
  }

  requestLeave() {
    this.phaseBeforeLeave = this.phase;
    this.phase = 'leave';
  }

  stayFromLeave() {
    this.phase = this.phaseBeforeLeave === 'leave' ? 'live' : this.phaseBeforeLeave;
  }

  openHelpSheet() {
    this.refreshAllowHelp();
    if (!this.allowHelp || !this.state.sessionId) return;
    this.helpSheetOpen = true;
    this.refreshHelpStatus();
  }

  bootstrap(opts: {
    paymentResult: string | null;
    welcomeBack: boolean;
    welcomeStill: boolean;
    justJoined: boolean;
  }) {
    this.state.restore();
    this.refreshAllowTip();
    this.refreshAllowPay();
    this.refreshAllowHelp();
    this.refreshShowSpecials();
    this.offline = typeof navigator !== 'undefined' && !navigator.onLine;
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    const paymentResult = opts.paymentResult;
    const welcomeBack = opts.welcomeBack;
    const welcomeStill = opts.welcomeStill;
    const justJoined = opts.justJoined;
    if (paymentResult === 'return') {
      this.message = 'Confirming your payment…';
      this.phase = 'live';
      this.awaitingPaymentConfirm = true;
    } else if (paymentResult === 'cancel') {
      this.error = 'Payment cancelled — nothing was taken. You can try again.';
      this.phase = 'payment';
    } else if (welcomeBack && this.onboarding.consumeReturnGreeting()) {
      this.showWelcomeBack();
    } else if (
      (welcomeStill ||
        (!!this.state.sessionId &&
          !!this.state.participantId &&
          this.onboarding.isKnownOpenSession(this.state.sessionId))) &&
      this.onboarding.consumeResumeGreeting()
    ) {
      this.showStillIn();
    } else if (this.onboarding.isReturningGuest() && this.onboarding.consumeReturnGreeting()) {
      this.showWelcomeBack();
    } else if (
      (justJoined || !this.onboarding.isReturningGuest()) &&
      this.onboarding.consumeJoinGreeting()
    ) {
      this.showJoined();
    }
    if (this.state.sessionId) {
      this.restoreGuestPersist();
      this.onboarding.noteOpenSession(this.state.sessionId);
      this.refreshLive();
      this.bindLiveSocket();
      this.startLivePoll();
      this.api.getSession(this.state.sessionId, this.state.participantSecret).subscribe({
        next: (session) => {
          if (session.guestDesign && typeof session.guestDesign === 'object') {
            this.state.guestDesign = session.guestDesign;
            this.state.persist();
          }
          this.refreshAllowPay();
          this.refreshAllowTip();
          this.refreshAllowHelp();
          this.refreshShowSpecials();
        },
        error: () => this.resetStaleSession(),
      });
    }
    if (this.state.venueId) {
      this.catalogueLoading = true;
      this.api.getCatalogue(this.state.venueId).subscribe({
        next: (items) => {
          this.catalogue = guestVisibleCatalogueItems(
            items.map((item) => ({
              ...item,
              imageUrl: safeGuestImageUrl(item.imageUrl) ?? undefined,
              choiceGroups: this.normalizeChoiceGroups(item.choiceGroups),
            })),
          );
          this.catalogueLoading = false;
        },
        error: () => {
          this.catalogueLoading = false;
          this.error = `Could not load ${this.terms.term('catalogue', 'menu')} — retry from Entry.`;
        },
      });
    }
  }

  private showWelcomeBack() {
    const first =
      this.onboarding.firstName() ||
      (this.state.displayName || '').trim().split(/\s+/)[0] ||
      '';
    const venue = (
      this.state.venueName ||
      this.onboarding.read().lastVenueLabel ||
      ''
    ).trim();
    this.message = first
      ? venue
        ? `Welcome back, ${first} — good to see you at ${venue}.`
        : `Welcome back, ${first}.`
      : venue
        ? `Welcome back — good to see you at ${venue}.`
        : 'Welcome back — good to see you again.';
    setTimeout(() => {
      if (this.message.startsWith('Welcome back')) this.message = '';
    }, 4500);
  }

  private showJoined() {
    const place = (this.state.physicalContextCode || '').trim();
    const term = this.terms.term('physicalContext', 'table');
    this.message = place
      ? `You’re in — ${term} ${place}. Browse when you’re ready.`
      : 'You’re in — browse when you’re ready.';
    setTimeout(() => {
      if (this.message.startsWith('You’re in')) this.message = '';
    }, 4500);
  }

  private showStillIn() {
    const first =
      this.onboarding.firstName() ||
      (this.state.displayName || '').trim().split(/\s+/)[0] ||
      '';
    const banner = composeStillInBanner({
      firstName: first,
      placeTerm: this.terms.term('physicalContext', 'Place'),
      placeCode: this.state.physicalContextCode,
    });
    this.message = banner.message;
    setTimeout(() => {
      if (this.message === banner.message || this.message === banner.quiet) {
        this.message = this.message === banner.message ? banner.quiet : '';
      }
    }, 2800);
    setTimeout(() => {
      if (this.message === banner.quiet || this.message.startsWith('You’re still in')) {
        this.message = '';
      }
    }, 4500);
  }

  tearDown() {
    if (this.poll) clearInterval(this.poll);
    this.clearClaimUndoTimer();
    this.clearClaimFlashTimer();
    this.clearMinePulseTimer();
    this.unsubPlatform?.();
    this.unsubPlatform = undefined;
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
  }




  private onConnectivityChange(online: boolean) {
    this.offline = !online;
    if (online) {
      void this.flushOfflineQueue();
      if (this.phase === 'live') this.retryConnection();
    }
  }

  private async flushOfflineQueue() {
    if (!offlineQueue.hasPending()) return;
    const result = await offlineQueue.flush(async (action) => {
      if (action.type === 'transaction.create') {
        const payload = action.payload as {
          sessionId: string;
          participantId?: string;
          lines: Array<{
            catalogueItemId: string;
            quantity: number;
            notes?: string;
            selectionsJson?: unknown;
          }>;
        };
        await firstValueFrom(
          this.api.createTransaction({
            sessionId: payload.sessionId,
            participantId: payload.participantId || this.state.participantId || undefined,
            participantSecret: this.state.participantSecret,
            lines: payload.lines,
          }),
        );
        return;
      }
      throw new Error(`Unsupported offline action: ${action.type}`);
    });
    if (result.flushed > 0) {
      this.message = `${this.terms.term('transaction', 'Order')} sent — you’re back online`;
      this.bindLiveSocket();
      this.refreshLive();
      this.startLivePoll();
    } else if (result.failed > 0) {
      this.message = 'Still syncing — we’ll retry when the connection settles';
    }
  }

  retryConnection() {
    this.liveError = '';
    this.offline = typeof navigator !== 'undefined' && !navigator.onLine;
    this.bindLiveSocket();
    this.refreshLive();
  }

  private bindLiveSocket() {
    if (!this.state.sessionId || !this.state.organisationId) return;
    this.unsubPlatform?.();
    this.api.ensureSocket(this.state.organisationId, this.state.sessionId, this.state.participantSecret);
    this.unsubPlatform = this.api.onPlatformEvent((envelope) => this.onLiveEvent(envelope));
  }

  private onLiveEvent(envelope: PlatformEventEnvelope) {
    const name = envelope?.eventName ?? '';
    const sessionInPayload = envelope?.payload?.['sessionId'] as string | undefined;
    if (sessionInPayload && sessionInPayload !== this.state.sessionId) return;

    if (name === 'CatalogueItemChanged') {
      this.applyLiveCatalogueChange(envelope);
      return;
    }

    if (name === 'ParticipantJoined') {
      const joinedName = (envelope?.payload?.['displayName'] as string | undefined)?.trim();
      const myName = (this.state.displayName || '').trim();
      if (joinedName && joinedName.toLowerCase() !== myName.toLowerCase()) {
        const first = joinedName.split(/\s+/)[0];
        const notice = `${first} joined`;
        this.message = notice;
        setTimeout(() => {
          if (this.message === notice) this.message = '';
        }, 4200);
      }
      this.refreshLive();
      return;
    }

    const refreshOn = new Set([
      'FulfilmentCreated',
      'FulfilmentStatusChanged',
      'TransactionCreated',
      'LinesClaimed',
      'PaymentRequested',
      'PaymentCompleted',
      'PaymentFailed',
      'SessionCompleted',
      'AssistanceRequested',
      'AssistanceAcknowledged',
      'AssistanceResolved',
    ]);
    if (!refreshOn.has(name)) return;

    if (name === 'AssistanceAcknowledged') {
      const kind = this.assistanceKindFromPayload(envelope);
      this.applyHelpBanner(kind, 'acknowledged');
    }
    if (name === 'AssistanceResolved') {
      const kind = this.assistanceKindFromPayload(envelope);
      if (kind === 'manager') this.managerHelpPending = false;
      else this.serviceHelpPending = false;
      this.message = 'Help resolved — you’re all set';
      setTimeout(() => {
        if (this.message === 'Help resolved — you’re all set') this.message = '';
      }, 2200);
    }
    if (name === 'AssistanceRequested') {
      this.refreshHelpStatus();
    }

    if (this.phase === 'live' || this.phase === 'payment' || this.awaitingPaymentConfirm) {
      this.refreshLive();
    }
  }

  private isStale(err: { status?: number; error?: { message?: string } }): boolean {
    const message = err?.error?.message ?? '';
    return err?.status === 404 || /not found/i.test(message);
  }

  private resetStaleSession() {
    this.state.clear();
    this.message = '';
    this.error = 'Your session expired. Start fresh from Entry.';
    this.phase = 'browse';
  }

  goToEntry() {
    void this.router.navigate(['/entry']);
  }

  /** Qty of this catalogue item already in Your order. */
  lineQty(catalogueItemId: string): number {
    return this.cart
      .filter((l) => l.catalogueItemId === catalogueItemId)
      .reduce((n, l) => n + l.quantity, 0);
  }

  allergenLine(item: CatalogueItem): string {
    return formatAllergenLine(item.allergens);
  }

  dietaryLine(item: CatalogueItem): string {
    return formatDietaryLine(item.dietaryTags);
  }

  private applyLiveCatalogueChange(envelope: PlatformEventEnvelope) {
    const payload = envelope?.payload ?? {};
    const venueId = payload['venueId'] as string | undefined;
    if (venueId && this.state.venueId && venueId !== this.state.venueId) return;
    const itemId = (payload['itemId'] as string | undefined) || '';
    if (!itemId) return;

    const change: CatalogueItem = {
      id: itemId,
      label: String(payload['label'] ?? ''),
      category: String(payload['category'] ?? 'More'),
      unitPrice: Number(payload['unitPrice']) || 0,
      routingTags: Array.isArray(payload['routingTags'])
        ? (payload['routingTags'] as string[])
        : [],
      description: (payload['description'] as string | null | undefined) || undefined,
      imageUrl: safeGuestImageUrl(payload['imageUrl'] as string | undefined) ?? undefined,
      available: payload['available'] !== false,
      allergens: Array.isArray(payload['allergens'])
        ? (payload['allergens'] as string[])
        : [],
      dietaryTags: Array.isArray(payload['dietaryTags'])
        ? (payload['dietaryTags'] as string[])
        : [],
      ageRestricted: payload['ageRestricted'] === true,
      choiceGroups: this.catalogue.find((c) => c.id === itemId)?.choiceGroups,
    };
    this.catalogue = applyCatalogueItemChange(this.catalogue, change);
  }

  hasChoices(item: CatalogueItem): boolean {
    return Array.isArray(item.choiceGroups) && item.choiceGroups.length > 0;
  }

  private normalizeChoiceGroups(
    raw: CatalogueItem['choiceGroups'] | unknown,
  ): CatalogChoiceGroup[] | undefined {
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    const groups: CatalogChoiceGroup[] = [];
    for (const g of raw) {
      if (!g || typeof g !== 'object') continue;
      const group = g as CatalogChoiceGroup;
      if (!group.id || !group.label || !Array.isArray(group.options)) continue;
      groups.push({
        id: String(group.id),
        label: String(group.label),
        required: !!group.required,
        min: typeof group.min === 'number' ? group.min : undefined,
        max: typeof group.max === 'number' ? group.max : undefined,
        options: group.options
          .filter((o) => o && o.id && o.label)
          .map((o) => ({
            id: String(o.id),
            label: String(o.label),
            priceDelta: typeof o.priceDelta === 'number' ? o.priceDelta : undefined,
            imageUrl: safeGuestImageUrl(
              typeof (o as { imageUrl?: unknown }).imageUrl === 'string'
                ? (o as { imageUrl: string }).imageUrl
                : undefined,
            ) ?? undefined,
          })),
      });
    }
    return groups.length ? groups : undefined;
  }

  /** One-tap add on Browse — or G-04 sheet when the item needs choices. */
  addFromMenu(item: CatalogueItem) {
    if (this.hasChoices(item)) {
      this.editingCartIndex = null;
      this.choicesItem = item;
      return;
    }
    const existing = this.cart.find(
      (l) => l.catalogueItemId === item.id && !l.choiceSummary,
    );
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        catalogueItemId: item.id,
        label: item.label,
        quantity: 1,
        unitPrice: item.unitPrice,
        routingTags: item.routingTags,
        imageUrl: item.imageUrl,
      });
    }
    this.flashAdded();
  }

  onChoicesAdd(result: ChoiceSheetResult) {
    const item = this.choicesItem;
    this.choicesItem = null;
    if (!item) return;
    const next: CartLine = {
      catalogueItemId: item.id,
      label: item.label,
      quantity: result.quantity,
      unitPrice: result.unitPrice,
      routingTags: item.routingTags,
      choiceSummary: result.choiceSummary || undefined,
      specialRequest: result.specialRequest || undefined,
      selections: result.selections,
      imageUrl: item.imageUrl,
    };
    if (this.editingCartIndex != null && this.cart[this.editingCartIndex]) {
      this.cart[this.editingCartIndex] = next;
      this.editingCartIndex = null;
      this.message = 'Updated';
      setTimeout(() => {
        if (this.message === 'Updated') this.message = '';
      }, 1400);
      return;
    }
    this.cart.push(next);
    this.flashAdded();
  }

  setMenuQty(item: CatalogueItem, qty: number) {
    if (this.hasChoices(item)) {
      this.addFromMenu(item);
      return;
    }
    const line = this.cart.find(
      (l) => l.catalogueItemId === item.id && !l.choiceSummary,
    );
    if (!line) {
      if (qty >= 1) this.addFromMenu(item);
      return;
    }
    if (qty < 1) {
      this.removeFromMenu(item);
      return;
    }
    line.quantity = qty;
  }

  removeFromMenu(item: CatalogueItem) {
    this.cart = this.cart.filter((l) => l.catalogueItemId !== item.id);
  }

  editCartLine(index: number) {
    const line = this.cart[index];
    if (!line) return;
    const item = this.catalogue.find((entry) => entry.id === line.catalogueItemId);
    if (!item || !this.hasChoices(item)) return;
    this.editingCartIndex = index;
    this.choicesItem = item;
  }

  closeChoicesSheet() {
    this.choicesItem = null;
    this.editingCartIndex = null;
  }

  private flashAdded() {
    this.message = 'Added';
    setTimeout(() => {
      if (this.message === 'Added') this.message = '';
    }, 1400);
  }

  setLineQty(index: number, qty: number) {
    if (!this.cart[index]) return;
    this.cart[index].quantity = Math.max(1, qty);
  }

  removeLine(index: number) {
    this.cart.splice(index, 1);
  }

  submitOrder() {
    this.error = '';
    if (!this.cart.length || this.submitting) return;
    this.submitting = true;
    if (!navigator.onLine) {
      offlineQueue.enqueue('transaction.create', {
        sessionId: this.state.sessionId,
        participantId: this.state.participantId || undefined,
        lines: this.cart.map((line) => ({
          catalogueItemId: line.catalogueItemId,
          quantity: line.quantity,
          notes: line.specialRequest?.trim() || undefined,
          selectionsJson: line.selections ?? undefined,
        })),
      });
      this.message = `Offline — ${this.terms.term('transaction', 'order')} queued for sync`;
      this.lastOrderTotal = this.cartTotal;
      this.billLines = this.cart.map((l) => ({
        label: l.choiceSummary ? `${l.label} · ${l.choiceSummary}` : l.label,
        quantity: l.quantity,
        total: l.quantity * l.unitPrice,
      }));
      this.mineBillLines = [...this.billLines];
      this.orderRecordedFlash = true;
      setTimeout(() => (this.orderRecordedFlash = false), 5000);
      this.cart = [];
      this.phase = 'live';
      this.submitting = false;
      return;
    }
    const total = this.cartTotal;
    this.api
      .createTransaction({
        sessionId: this.state.sessionId,
        participantId: this.state.participantId || undefined,
        participantSecret: this.state.participantSecret,
        lines: this.cart.map((line) => ({
          catalogueItemId: line.catalogueItemId,
          quantity: line.quantity,
          notes: line.specialRequest?.trim() || undefined,
          selectionsJson: line.selections ?? undefined,
        })),
      })
      .pipe(timeout(20000))
      .subscribe({
      next: () => {
        this.message = `${this.terms.term('transaction', 'Order')} received — the team can see it`;
        this.lastOrderTotal = total;
        this.cart = [];
        this.persistGuestState();
        this.phase = 'live';
        this.submitting = false;
        this.orderRecordedFlash = true;
        setTimeout(() => (this.orderRecordedFlash = false), 4000);
        this.bindLiveSocket();
        this.refreshLive();
        this.startLivePoll();
      },
      error: (err) => {
        this.submitting = false;
        if (this.isStale(err)) {
          this.resetStaleSession();
          return;
        }
        const timedOut = err?.name === 'TimeoutError' || err?.message?.includes?.('Timeout');
        this.error = timedOut
          ? 'Taking too long — check the connection and try again'
          : 'Could not submit — try again';
      },
    });
  }

  refreshLive() {
    if (!this.state.sessionId) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.offline = true;
      return;
    }
    this.api.getSession(this.state.sessionId, this.state.participantSecret).subscribe({
      next: (session) => {
        this.offline = false;
        this.liveError = '';
        if (typeof session.menuBrandEnabled === 'boolean') {
          this.state.menuBrandEnabled = session.menuBrandEnabled;
          this.state.brandColour = session.brandColour || this.state.brandColour || '#d7a14a';
          if (session.venueName) this.state.venueName = session.venueName;
          if (typeof session.logoUrl === 'string') this.state.logoUrl = session.logoUrl;
          if (typeof session.menuCoverUrl === 'string') {
            this.state.menuCoverUrl = session.menuCoverUrl;
          }
          if (typeof session.location === 'string') this.state.location = session.location;
          this.state.persist();
        }
        if (session.guestDesign && typeof session.guestDesign === 'object') {
          this.state.guestDesign = session.guestDesign;
          this.state.persist();
        }
        this.refreshAllowPay();
        this.refreshAllowTip();
        this.refreshAllowHelp();
        this.refreshShowSpecials();
        const lineLabels = new Map<string, string>();
        let orderTotal = 0;
        let openTotal = 0;
        const visitAgg = new Map<string, BillLine>();
        const mineAgg = new Map<string, BillLine>();
        const detailRows: BillDisplayLine[] = [];
        const myPart = this.state.participantId;
        const guests = session.participants ?? [];
        const share = equalShareState(guests, new Set(), myPart);
        const multiGuest = share.distinct >= 2;
        const participantFirstName = new Map<string, string>();
        const peopleSeen = new Set<string>();
        const peopleNames: string[] = [];
        for (const p of session.participants ?? []) {
          if (p.role && p.role !== 'guest') continue;
          const first = p.displayName?.trim().split(/\s+/)[0];
          if (first) participantFirstName.set(p.id, first);
          const key = guestShareKey(p);
          if (!first || peopleSeen.has(key)) continue;
          peopleSeen.add(key);
          peopleNames.push(first);
        }
        this.tablePeople = peopleNames;
        for (const tx of session.transactions ?? []) {
          orderTotal += Number(tx.total) || 0;
          if (tx.status === 'settled') continue;
          openTotal += Number(tx.total) || 0;
          for (const line of tx.lines ?? []) {
            lineLabels.set(line.id, line.label);
            const key = line.label || 'Item';
            const qty = Number(line.quantity) || 0;
            const lineTotal = qty * (Number(line.unitPrice) || 0);
            const bump = (map: Map<string, BillLine>) => {
              const existing = map.get(key);
              if (existing) {
                existing.quantity += qty;
                existing.total += lineTotal;
              } else {
                map.set(key, {
                  label: key,
                  quantity: qty,
                  total: lineTotal,
                });
              }
            };
            bump(visitAgg);
            const ownerGuest = line.participantId
              ? guests.find((g) => g.id === line.participantId)
              : undefined;
            const myGuest = myPart ? guests.find((g) => g.id === myPart) : undefined;
            const isMine = multiGuest
              ? !!myGuest &&
                !!ownerGuest &&
                guestShareKey(myGuest) === guestShareKey(ownerGuest)
              : true;
            if (isMine) bump(mineAgg);
            const ownerParticipantId = line.participantId ?? null;
            const ownerName =
              !isMine && ownerParticipantId
                ? participantFirstName.get(ownerParticipantId)
                : undefined;
            detailRows.push({
              id: line.id,
              label: key,
              quantity: qty,
              total: lineTotal,
              mine: isMine,
              ownerParticipantId,
              ownerName,
            });
          }
        }
        this.participantCount = share.distinct;
        this.billDetailLines =
          this.participantCount >= 2 && detailRows.length ? detailRows : null;
        this.billLines = [...visitAgg.values()];
        this.mineBillLines = [...mineAgg.values()];
        const mineOrdered = this.mineBillLines.reduce((n, l) => n + l.total, 0);
        const visitOrdered = this.billLines.reduce((n, l) => n + l.total, 0);
        if (orderTotal > 0) this.lastOrderTotal = orderTotal;
        const fulfilments = session.fulfilments ?? [];
        this.fulfilments = fulfilments.map((f) => ({
          id: f.id,
          status: f.status,
          stationId: f.stationId,
          lines: (f.lines ?? []).map((l) => ({
            quantity: l.quantity,
            label: lineLabels.get(l.transactionLineId ?? '') ?? l.label ?? 'Item',
          })),
        }));
        const completedPays = (session.payments ?? []).filter(
          (p) => p.status === 'completed' || p.status === 'settled',
        );
        const paidToward = completedPays.reduce(
          (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.tipAmount ?? 0)),
          0,
        );
        const minePaidToward = completedPays
          .filter(
            (p) =>
              p.scope === 'mine' &&
              !!myPart &&
              (p.participantId ? p.participantId === myPart : false),
          )
          .reduce(
            (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.tipAmount ?? 0)),
            0,
          );
        this.receiptPaidTotal = paidToward;
        const visitOpen = Math.max(0, fromMinor(toMinor(openTotal) - toMinor(paidToward)));
        const mineOpen = Math.max(
          0,
          fromMinor(
            Math.min(toMinor(visitOpen), toMinor(mineOrdered) - toMinor(minePaidToward)),
          ),
        );
        const paidEqualIds = new Set(
          completedPays
            .filter((p) => p.scope === 'equal' && !!p.participantId)
            .map((p) => p.participantId as string),
        );
        const equal = equalShareState(guests, paidEqualIds, myPart);
        let equalOpen: number | null = null;
        if (equal.distinct >= 2 && hasOpenBalance(visitOpen) && myPart) {
          if (equal.minePaid) {
            equalOpen = 0;
          } else {
            const unpaidSlots = Math.max(1, equal.unpaid);
            equalOpen = fromMinor(
              Math.min(toMinor(visitOpen), Math.round(toMinor(visitOpen) / unpaidSlots)),
            );
          }
        }
        this.visitRemaining = visitOrdered > 0 ? visitOpen : null;
        this.mineRemaining = mineOrdered > 0 ? mineOpen : null;
        this.equalRemaining = equalOpen;
        this.balanceDue =
          hasOpenBalance(visitOpen) && (this.lastOrderTotal > 0 || fulfilments.length > 0);
        this.rebuildTimeline();
        if (this.awaitingPaymentConfirm && isCleared(visitOpen)) {
          this.awaitingPaymentConfirm = false;
          this.message = 'You’re all set';
          this.phase = 'receipt';
        }
        if (this.pendingMineSettleCheck) {
          this.pendingMineSettleCheck = false;
          if (isCleared(visitOpen)) {
            this.message = 'You’re all set';
            this.balanceDue = false;
            this.shareSettledMoment = false;
            this.phase = 'receipt';
          } else {
            this.message = '';
            this.shareSettledMoment = true;
            this.phase = 'payment';
          }
        }
        // After mine/equal share is covered, keep guest on visit for the remainder.
        if (this.phase === 'payment' && this.bill && !this.shareSettledMoment) {
          if (
            (isCleared(mineOpen) && this.bill.scope === 'mine') ||
            (equalOpen != null && isCleared(equalOpen) && this.bill.scope === 'equal')
          ) {
            if (hasOpenBalance(visitOpen)) this.bill.setScope('visit');
          } else if (
            this.preferMineScope &&
            hasOpenBalance(mineOpen) &&
            isGreaterMinor(visitOpen, mineOpen)
          ) {
            this.bill.setScope('mine');
            this.preferMineScope = false;
          }
        }
        this.refreshHelpStatus();
      },
      error: (err) => {
        if (this.isStale(err)) this.resetStaleSession();
        else {
          this.liveError = 'Couldn’t refresh — tap Retry. Your order is still with the team.';
        }
      },
    });
  }

  private refreshHelpStatus() {
    if (!this.state.sessionId) return;
    this.api.listAssistance({ sessionId: this.state.sessionId }).subscribe({
      next: (rows) => {
        const open = rows.filter((r) => r.status === 'open' || r.status === 'acknowledged');
        this.serviceHelpPending = open.some((r) => this.asHelpKind(r.kind) === 'service');
        this.managerHelpPending = open.some((r) => this.asHelpKind(r.kind) === 'manager');
        const preferred =
          open.find((r) => this.asHelpKind(r.kind) === 'manager') ??
          open.find((r) => this.asHelpKind(r.kind) === 'service');
        if (!preferred) return;
        this.applyHelpBanner(this.asHelpKind(preferred.kind), preferred.status as 'open' | 'acknowledged');
      },
      error: () => undefined,
    });
  }

  private asHelpKind(kind?: string): GuestHelpKind {
    return kind === 'manager' ? 'manager' : 'service';
  }

  private assistanceKindFromPayload(envelope: PlatformEventEnvelope): GuestHelpKind {
    return this.asHelpKind(envelope?.payload?.['kind'] as string | undefined);
  }

  private applyHelpBanner(kind: GuestHelpKind, status: 'open' | 'acknowledged') {
    if (kind === 'manager') {
      this.managerHelpPending = true;
      const m = this.managerAssist;
      this.message = status === 'acknowledged' ? m.onWay : m.notified;
      return;
    }
    this.serviceHelpPending = true;
    const assist = this.serviceAssist;
    this.message = status === 'acknowledged' ? assist.onWay : assist.notified;
  }

  private rebuildTimeline() {
    const f = this.primaryFulfilment;
    if (!f) {
      this.timelineSteps = [];
      this.timelineGuidance = '';
      return;
    }
    const labels = progressLabelsForProfile(this.state.profileId);
    this.timelineSteps = buildStatusTimelineSteps(f.status, labels);
    this.timelineGuidance = progressGuidance(f.status, labels, f.stationId);
    const current = this.timelineSteps.find((s) => s.state === 'current');
    if (current && current.id !== this.lastAnnouncedStep) {
      this.lastAnnouncedStep = current.id as PlatformProgressStep;
      this.timelineAnnouncement = `Status: ${current.label}. ${this.timelineGuidance}`;
    }
  }

  private startLivePoll() {
    if (this.poll) clearInterval(this.poll);
    // Socket is primary; poll is a calm fallback (outbox can lag ~1s).
    const ms = this.api.isSocketConnected() ? 8000 : 3000;
    this.poll = setInterval(() => {
      if (this.phase === 'live' || this.phase === 'payment') this.refreshLive();
      else if (this.poll) clearInterval(this.poll);
    }, ms);
  }

  openBill() {
    this.refreshAllowTip();
    this.refreshAllowPay();
    this.refreshShowSpecials();
    if (!this.allowPay) {
      this.phase = 'live';
      return;
    }
    if (!this.billLines.length && this.cart.length) {
      this.billLines = this.cart.map((l) => ({
        label: l.choiceSummary ? `${l.label} · ${l.choiceSummary}` : l.label,
        quantity: l.quantity,
        total: l.quantity * l.unitPrice,
      }));
      this.mineBillLines = [...this.billLines];
    }
    this.shareSettledMoment = false;
    this.phase = 'payment';
    this.refreshLive();
    this.startLivePoll();
    // See → Claim: Visit tab when others’ lines exist; else Mine when shares differ.
    setTimeout(() => {
      if (!this.bill) return;
      const hasUnclaimed = this.billDetailLines?.some((l) => !l.mine && !l.ownerName);
      if (hasUnclaimed) this.bill.setScope('visit');
      else if (this.preferMineScope) this.bill.setScope('mine');
    }, 0);
  }

  /** Studio Tips → Guest Bill (Blueprint tip example · No Drift). */
  private refreshAllowTip() {
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    this.allowTip = resolveAllowTip(this.state.token, [], sessionDesign);
  }

  /** Studio Pay → Guest Bill / dock (Pay Continuity · No Drift). */
  private refreshAllowPay() {
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    const next = resolveAllowPay(this.state.token, [], sessionDesign);
    this.allowPay = next;
    if (!next && this.phase === 'payment') {
      this.phase = 'live';
    }
  }

  /** Studio Call Staff → Guest Help (Help Continuity · No Drift). */
  private refreshAllowHelp() {
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    this.allowHelp = resolveAllowHelp(this.state.token, [], sessionDesign);
    if (!this.allowHelp) this.helpSheetOpen = false;
  }

  /** Studio Specials → Guest Specials tab (add/remove without new architecture). */
  private refreshShowSpecials() {
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    const next = resolveShowSpecials(this.state.token, [], sessionDesign);
    this.showSpecials = next;
    if (!next && this.phase === 'specials') {
      this.phase = 'browse';
    }
    if (next && this.phase === 'browse' && this.preferSpecialsLanding) {
      this.phase = 'specials';
      this.preferSpecialsLanding = false;
    }
  }

  /** Inline claim — one tap, item becomes yours; undo toast + Mine pulse (no extra screens). */
  claimOneLine(lineId: string) {
    if (!this.state.sessionId || !this.state.participantId || this.claimingLineId) return;
    this.claimingLineId = lineId;
    this.paymentError = '';
    const lineLabel = this.billDetailLines?.find((l) => l.id === lineId)?.label ?? 'Item';
    this.api
      .claimLines(this.state.sessionId, {
        participantId: this.state.participantId,
        lineIds: [lineId],
        participantSecret: this.state.participantSecret,
      })
      .subscribe({
        next: (res) => {
          this.claimingLineId = null;
          const undoEntry = res.undo?.find((u) => u.lineId === lineId);
          this.showClaimUndo(lineId, lineLabel, undoEntry?.previousParticipantId ?? null);
          this.flashClaimedLine(lineId);
          this.pulseMineScope();
          this.preferMineScope = true;
          this.refreshLive();
        },
        error: (err) => {
          this.claimingLineId = null;
          if (this.isStale(err)) this.resetStaleSession();
          else this.paymentError = 'Couldn’t claim that item — try again.';
        },
      });
  }

  undoClaim() {
    if (!this.claimUndo || !this.state.sessionId || this.claimingLineId) return;
    const { lineId, previousParticipantId } = this.claimUndo;
    this.clearClaimUndoTimer();
    this.claimUndo = null;
    this.claimingLineId = lineId;
    this.paymentError = '';
    this.api
      .claimLines(this.state.sessionId, {
        participantId: previousParticipantId,
        lineIds: [lineId],
        participantSecret: this.state.participantSecret,
      })
      .subscribe({
        next: () => {
          this.claimingLineId = null;
          this.recentlyClaimedIds = this.recentlyClaimedIds.filter((id) => id !== lineId);
          this.refreshLive();
        },
        error: (err) => {
          this.claimingLineId = null;
          if (this.isStale(err)) this.resetStaleSession();
          else this.paymentError = 'Couldn’t undo — try again.';
        },
      });
  }

  private showClaimUndo(
    lineId: string,
    label: string,
    previousParticipantId: string | null,
  ) {
    this.clearClaimUndoTimer();
    this.claimUndo = { lineId, label, previousParticipantId };
    this.claimUndoTimer = setTimeout(() => {
      this.claimUndo = null;
      this.claimUndoTimer = undefined;
    }, 4000);
  }

  private flashClaimedLine(lineId: string) {
    if (!this.recentlyClaimedIds.includes(lineId)) {
      this.recentlyClaimedIds = [...this.recentlyClaimedIds, lineId];
    }
    this.clearClaimFlashTimer();
    this.claimFlashTimer = setTimeout(() => {
      this.recentlyClaimedIds = this.recentlyClaimedIds.filter((id) => id !== lineId);
      this.claimFlashTimer = undefined;
    }, 2200);
  }

  private pulseMineScope() {
    this.mineScopePulse = true;
    this.clearMinePulseTimer();
    this.minePulseTimer = setTimeout(() => {
      this.mineScopePulse = false;
      this.minePulseTimer = undefined;
    }, 220);
  }

  private clearClaimUndoTimer() {
    if (this.claimUndoTimer) {
      clearTimeout(this.claimUndoTimer);
      this.claimUndoTimer = undefined;
    }
  }

  private clearClaimFlashTimer() {
    if (this.claimFlashTimer) {
      clearTimeout(this.claimFlashTimer);
      this.claimFlashTimer = undefined;
    }
  }

  private clearMinePulseTimer() {
    if (this.minePulseTimer) {
      clearTimeout(this.minePulseTimer);
      this.minePulseTimer = undefined;
    }
  }

  requestHelp(kind: GuestHelpKind) {
    this.refreshAllowHelp();
    if (!this.allowHelp || !this.state.sessionId || this.helpBusy) return;
    this.helpBusy = true;
    this.error = '';
    const message =
      kind === 'manager'
        ? 'Guest asked to speak with the manager'
        : `Guest asked for help at the ${this.serviceAssist.staffNoun}`;
    this.api
      .requestAssistance({
        sessionId: this.state.sessionId,
        kind,
        message,
      })
      .subscribe({
        next: (req) => {
          this.helpBusy = false;
          this.helpSheetOpen = false;
          const status = (req.status === 'acknowledged' ? 'acknowledged' : 'open') as
            | 'open'
            | 'acknowledged';
          this.applyHelpBanner(kind, status);
        },
        error: (err) => {
          this.helpBusy = false;
          if (this.isStale(err)) this.resetStaleSession();
          else this.error = 'Couldn’t reach the team — try again';
        },
      });
  }

  /** @deprecated Prefer openHelpSheet / requestHelp — kept for any leftover call sites. */
  callService() {
    this.openHelpSheet();
  }

  pay() {
    this.error = '';
    this.paymentError = '';
    if (this.paying || this.offline) return;
    this.paying = true;
    const tipAmount = this.bill?.tipAmount ?? 0;
    const tipPercent = this.bill?.customTip ? undefined : this.bill?.tipPercent;
    const scope = this.bill?.scope ?? 'visit';
    this.api
      .requestPayment(this.state.sessionId, {
        tipAmount: this.bill?.customTip ? tipAmount : undefined,
        tipPercent,
        scope,
        participantId: this.state.participantId || undefined,
        participantSecret: this.state.participantSecret,
      })
      .subscribe({
      next: (res) => {
        if (res.checkout?.method === 'form_post') {
          this.paymentMethodHint = 'Opening a secure payment page…';
          this.paying = false;
          this.submitGatewayCheckout(res.checkout);
          return;
        }
        this.paymentMethodHint = 'Confirming your payment…';
        this.awaitingPaymentConfirm = true;
        this.pollPaymentUntilSettled(res.paymentId, scope);
      },
      error: (err) => {
        this.paying = false;
        this.pendingMineSettleCheck = false;
        if (this.isStale(err)) this.resetStaleSession();
        else this.paymentError = 'Couldn’t start payment — try again when you’re ready.';
      },
    });
  }

  private pollPaymentUntilSettled(
    paymentId: string,
    scope: 'visit' | 'mine' | 'equal',
    attempt = 0,
  ) {
    if (!this.state.sessionId) {
      this.paying = false;
      return;
    }
    this.api.getSession(this.state.sessionId, this.state.participantSecret).subscribe({
      next: (session) => {
        const payment = session.payments?.find((p) => p.id === paymentId);
        const status = payment?.status ?? '';
        if (status === 'completed' || status === 'settled') {
          this.paying = false;
          this.awaitingPaymentConfirm = false;
          if (scope === 'visit') {
            this.message = 'You’re all set';
            this.balanceDue = false;
            this.shareSettledMoment = false;
            this.pendingMineSettleCheck = false;
            this.phase = 'receipt';
            this.refreshLive();
            return;
          }
          this.pendingMineSettleCheck = true;
          this.refreshLive();
          return;
        }
        if (status === 'failed') {
          this.paying = false;
          this.awaitingPaymentConfirm = false;
          this.pendingMineSettleCheck = false;
          this.paymentError =
            'Payment didn’t go through — nothing was taken. You can try again.';
          return;
        }
        if (attempt >= 30) {
          this.paying = false;
          this.paymentError =
            'Waiting for payment confirmation — ask the team if this takes a while.';
          return;
        }
        setTimeout(() => this.pollPaymentUntilSettled(paymentId, scope, attempt + 1), 2000);
      },
      error: () => {
        if (attempt >= 30) {
          this.paying = false;
          this.paymentError = 'Couldn’t confirm payment — try again.';
          return;
        }
        setTimeout(() => this.pollPaymentUntilSettled(paymentId, scope, attempt + 1), 2000);
      },
    });
  }

  returnToOrdersAfterShare() {
    this.shareSettledMoment = false;
    this.pendingMineSettleCheck = false;
    this.message = 'Equal share is paid — thanks';
    this.phase = 'live';
    this.refreshLive();
    setTimeout(() => {
      if (this.message === 'Equal share is paid — thanks') this.message = '';
    }, 4500);
  }

  coverVisitAfterShare() {
    this.shareSettledMoment = false;
    this.pendingMineSettleCheck = false;
    this.preferMineScope = false;
    this.phase = 'payment';
    this.refreshLive();
    setTimeout(() => this.bill?.setScope('visit'), 50);
  }

  leave() {
    const venue =
      this.state.venueName ||
      this.state.profileLabel ||
      this.onboarding.read().lastVenueLabel ||
      '';
    if (!this.state.participantId) {
      this.error = 'Couldn’t leave just yet — try again';
      return;
    }
    this.message = 'Leaving your seat…';
    this.api.leaveSession(this.state.sessionId, this.state.participantId, this.state.participantSecret).subscribe({
      next: (res) => {
        this.onboarding.recordVisit(venue);
        this.onboarding.clearReturnGreetingFlag();
        this.clearGuestPersist();
        this.state.clear();
        this.message = '';
        this.error = '';
        this.serviceHelpPending = false;
        this.managerHelpPending = false;
        void this.router.navigate(['/entry'], {
          queryParams: res.closed ? { done: '1' } : {},
        });
      },
      error: () => (this.error = 'Couldn’t leave just yet — try again'),
    });
  }

  private guestPersistKey() {
    return `leos.guest.visit.${this.state.sessionId}`;
  }

  private persistGuestState() {
    if (!this.state.sessionId || typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(
      this.guestPersistKey(),
      JSON.stringify({ cart: this.cart, phase: this.phase }),
    );
  }

  private restoreGuestPersist() {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(this.guestPersistKey());
      if (!raw) return;
      const parsed = JSON.parse(raw) as { cart?: CartLine[]; phase?: GuestPhase };
      if (Array.isArray(parsed.cart)) this.cart = parsed.cart;
      if (parsed.phase && parsed.phase !== 'leave' && parsed.phase !== 'receipt') {
        this.phase = parsed.phase;
      }
    } catch {
      /* ignore */
    }
  }

  private clearGuestPersist() {
    if (typeof sessionStorage === 'undefined' || !this.state.sessionId) return;
    sessionStorage.removeItem(this.guestPersistKey());
  }

  private submitGatewayCheckout(checkout: {
    actionUrl: string;
    fields: Record<string, string>;
  }) {
    this.message = 'Opening secure payment…';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkout.actionUrl;
    form.style.display = 'none';
    for (const [name, value] of Object.entries(checkout.fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

}
