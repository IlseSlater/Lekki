import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { CartSummaryComponent } from '../leos/cart-summary.component';
import { MenuCardComponent } from '../leos/menu-card.component';
import { GuestBillComponent } from '../leos/guest-bill.component';
import { GuestOrdersComponent } from '../leos/guest-orders.component';
import { GuestTabBarComponent, type GuestTabId } from '../leos/guest-tab-bar.component';
import {
  GuestHelpSheetComponent,
  type GuestHelpKind,
} from '../leos/guest-help-sheet.component';
import { GuestFeedbackSheetComponent } from '../leos/guest-feedback-sheet.component';
import {
  GuestChoicesSheetComponent,
  type ChoiceSheetResult,
} from '../leos/guest-choices-sheet.component';
import { guestReadyBanner } from '../studio/operate-status';
import { SessionStateService } from '../services/leos-api.service';
import { TerminologyService } from '../services/terminology.service';
import {
  GuestSessionService,
  type CatalogueItem,
  type CartLine,
  type GuestPhase,
} from '../services/guest-session.service';
import { GuestMenuListComponent } from './guest-menu-list.component';
import { GuestCartDrawerComponent } from './guest-cart-drawer.component';
import { livePayCtaLabel, liveReadyLead } from '../studio/ready-pay-continuity';
import { payConfidenceSentence } from '../studio/pay-confidence';
import { composeLeaveOpenCopy } from '../studio/leave-open-continuity';
import {
  leavePrompt as leavePromptFor,
  leaveConfirmTitle as leaveConfirmTitleFor,
  leaveLabelShort as leaveLabelShortFor,
  receiptTitle as receiptTitleFor,
} from '../studio/receipt-leave-terms';
import { hasOpenBalance } from '../leos/money';
import { guestPlaceSpoken } from '../studio/place-continuity';
import { draftOrderWhisper } from '../studio/order-state-calm';
import {
  featuredMenuItems,
  menuWithoutSpecialsSurface,
  specialsCarouselItems,
} from '../studio/specials-continuity';
import { LeosMoneyPipe } from '../leos/leos-money.pipe';
import { VenueArrivalComponent } from '../leos/venue-arrival.component';
import { parseVenueArrival } from '../studio/venue-arrival';

/**
 * LEOS Experience Heartbeat — Guest surface (Restaurant Pack as reference implementation).
 * Phases: Arrival → Browse → Cart → Live → Payment → Receipt.
 * Domain state lives in GuestSessionService (component-scoped).
 */

@Component({
  standalone: true,
  providers: [GuestSessionService],
  imports: [
    CommonModule,
    FormsModule,
    ExperienceScreenComponent,
    CartSummaryComponent,
    MenuCardComponent,
    GuestOrdersComponent,
    GuestTabBarComponent,
    GuestHelpSheetComponent,
    GuestFeedbackSheetComponent,
    GuestChoicesSheetComponent,
    GuestMenuListComponent,
    GuestCartDrawerComponent,
    LeosMoneyPipe,
    VenueArrivalComponent,
  ],
  template: `
    <div
      class="leos-guest-chrome leos-guest-chrome--atmosphere"
      [class.leos-guest-chrome--browse]="phase === 'browse' && !!state.sessionId"
      [class.leos-guest-chrome--specials]="phase === 'specials'"
      [class.leos-guest-chrome--with-chip]="showCartChip"
      [class.leos-guest-chrome--with-cart-actions]="phase === 'cart'"
      [class.leos-guest-chrome--with-live-actions]="phase === 'live'"
      [style.--brand]="state.brandColour || '#d7a14a'"
    >
    @if (phase === 'arrival' && state.sessionId) {
      <leos-venue-arrival class="leos-guest-arrival" [look]="arrivalLook" (started)="session.enterMenu()" />
    }
    <leos-experience-screen
      [purpose]="purpose"
      [lead]="screenLead"
      [help]="help"
      [place]="placeSpoken"
      [hospitality]="true"
      [compact]="true"
      [showFooter]="showFooter"
      [docked]="!!state.sessionId && phase !== 'arrival'"
      [hidden]="phase === 'arrival'"
    >
      @if (!state.sessionId) {
        <p class="leos-muted">Start from Entry to rejoin the right place.</p>
        <button type="button" class="leos-btn leos-btn--primary" style="margin-top:0.75rem;" (click)="goToEntry()">
          Go to Entry
        </button>
      } @else {
        @if (phase === 'browse' || phase === 'specials') {
          @if (phase === 'browse' && catalogueLoading) {
            <p class="leos-muted" aria-live="polite">
              Getting {{ terms.term('catalogue', 'menu') }} ready…
            </p>
          }

          @if (phase === 'browse' && guestNames.length >= 2) {
            <div
              class="leos-chip-row leos-chip-row--scroll leos-chip-row--calm leos-browse-tools__chips"
              role="status"
              aria-label="People at your table"
            >
              @for (name of guestNames; track name) {
                <span class="leos-chip leos-chip--readonly">{{ name }}</span>
              }
            </div>
          }
        }

        @if (phase === 'browse') {
          <div class="leos-browse-tools">
            @if (categories.length > 1) {
              <div
                class="leos-chip-row leos-chip-row--scroll leos-chip-row--calm leos-browse-tools__chips"
                role="toolbar"
                aria-label="Categories"
              >
                <button
                  type="button"
                  class="leos-chip"
                  [class.leos-chip--active]="!categoryFilter"
                  (click)="categoryFilter = ''"
                >
                  All
                </button>
                @for (cat of categories; track cat) {
                  <button
                    type="button"
                    class="leos-chip"
                    [class.leos-chip--active]="categoryFilter === cat"
                    (click)="categoryFilter = cat"
                  >
                    {{ cat }}
                  </button>
                }
              </div>
            }

            @if (!searchOpen && !search.trim()) {
              <button
                type="button"
                class="leos-browse-search-toggle"
                (click)="openBrowseSearch()"
              >
                Search {{ terms.term('catalogue', 'menu').toLowerCase() }}
              </button>
            } @else {
              <div class="leos-field leos-browse-tools__search" role="search">
                <div class="leos-browse-search">
                  <input
                    class="leos-field__input leos-browse-search__input"
                    [(ngModel)]="search"
                    [placeholder]="'Search the ' + terms.term('catalogue', 'menu') + '…'"
                    [attr.aria-label]="'Search the ' + terms.term('catalogue', 'menu')"
                    autocomplete="off"
                  />
                  <button
                    type="button"
                    class="leos-browse-search__clear"
                    (click)="closeBrowseSearch()"
                    [attr.aria-label]="search.trim() ? 'Clear search' : 'Close search'"
                  >
                    {{ search.trim() ? 'Clear' : 'Close' }}
                  </button>
                </div>
              </div>
            }
          </div>

          <lekki-guest-menu-list
            [sections]="browseSections"
            [cartQuantities]="session.cartItemCounts"
            [showSectionTitles]="showSectionTitles"
            [showFoodImages]="showFoodImages"
            [catalogueLoading]="catalogueLoading"
            [catalogueEmpty]="!catalogue.length"
            [catalogueNoun]="terms.term('catalogue', 'menu')"
            (selectItem)="addFromMenu($event)"
            (quantityChange)="setMenuQty($event.item, $event.quantity)"
            (removeItem)="removeFromMenu($event)"
            (clearFilters)="clearBrowseFilters()"
          />
        }

        @if (phase === 'specials') {
          @if (catalogueLoading) {
            <p class="leos-muted" aria-live="polite">Getting today’s specials ready…</p>
          } @else {
            <section class="leos-specials" aria-label="Specials">
              @if (specialsCarousel.length) {
                <h2 class="leos-specials__eyebrow">Today</h2>
                <div
                  class="leos-specials-carousel"
                  role="list"
                  aria-label="Current specials"
                >
                  @for (item of specialsCarousel; track item.id) {
                    <article class="leos-specials-card" role="listitem">
                      @if (item.imageUrl) {
                        <div class="leos-specials-card__media">
                          <img [src]="item.imageUrl" alt="" />
                        </div>
                      }
                      <div class="leos-specials-card__body">
                        <h3 class="leos-specials-card__title">{{ item.label }}</h3>
                        @if (item.description) {
                          <p class="leos-specials-card__desc">{{ item.description }}</p>
                        }
                        @if (allergenLine(item)) {
                          <p class="leos-muted leos-menu-card__meta">{{ allergenLine(item) }}</p>
                        }
                        @if (dietaryLine(item)) {
                          <p class="leos-muted leos-menu-card__meta">{{ dietaryLine(item) }}</p>
                        }
                        <p class="leos-specials-card__price">
                          {{ item.unitPrice <= 0 ? 'Free' : (item.unitPrice | leosMoney) }}
                        </p>
                      </div>
                      <button
                        type="button"
                        class="leos-specials-card__add"
                        (click)="addFromMenu(item)"
                        [attr.aria-label]="'Add ' + item.label"
                      >
                        +
                      </button>
                    </article>
                  }
                </div>
              } @else {
                <p class="leos-muted leos-specials__empty">
                  No specials on the board right now — here are favourites from the
                  {{ terms.term('catalogue', 'menu').toLowerCase() }}.
                </p>
              }

              @if (featuredSpecials.length) {
                <h2 class="leos-specials__section">Most ordered</h2>
                <div class="leos-menu-grid leos-menu-grid--hero" role="list">
                  @for (item of featuredSpecials; track item.id) {
                    <leos-menu-card
                      [label]="item.label"
                      [category]="item.category"
                      [unitPrice]="item.unitPrice"
                      [description]="item.description || ''"
                      [allergenLine]="allergenLine(item)"
                      [dietaryLine]="dietaryLine(item)"
                      [imageUrl]="item.imageUrl || null"
                      [showFoodImages]="showFoodImages"
                      [quantity]="lineQty(item.id)"
                      [requiresChoices]="hasChoices(item)"
                      (add)="addFromMenu(item)"
                      (quantityChange)="setMenuQty(item, $event)"
                      (remove)="removeFromMenu(item)"
                    />
                  }
                </div>
              }
            </section>
          }
        }

        @if (phase === 'cart') {
          <lekki-guest-cart-drawer
            cartPhase="draft"
            [cartLines]="cart"
            [cartTotal]="cartTotal"
            [orderNoun]="terms.term('transaction', 'order').toLowerCase()"
            [catalogueNoun]="terms.term('catalogue', 'menu')"
            (updateCartQty)="setLineQty($event.index, $event.quantity)"
            (removeCartLine)="removeLine($event)"
            (editCartLine)="editCartLine($event)"
          />
        }

        @if (phase === 'live') {
          @if (offline) {
            <div class="leos-offline-banner" role="status">
              You’re offline — we’ll show the last update we have.
              <button type="button" class="leos-btn leos-btn--secondary" style="margin-left:0.5rem;" (click)="retryConnection()">
                Retry
              </button>
            </div>
          }
          @if (liveError) {
            <p class="leos-error-banner" role="alert">{{ liveError }}</p>
            <button type="button" class="leos-btn leos-btn--secondary" (click)="retryConnection()">Retry</button>
          }
          <leos-guest-orders
            [orders]="guestOrders"
            [readyHint]="readyHint"
            [profileId]="state.profileId"
            [offlinePending]="offlinePending"
            [sending]="submitting"
            [recordedFlash]="orderRecordedFlash"
          />
        }

        @if (phase === 'payment' && allowPay) {
          <lekki-guest-cart-drawer
            cartPhase="paying"
            [billLines]="billLines"
            [mineBillLines]="mineBillLines"
            [detailLines]="billDetailLines"
            [claimingLineId]="claimingLineId"
            [recentlyClaimedIds]="recentlyClaimedIds"
            [mineScopePulse]="mineScopePulse"
            [visitRemaining]="visitRemaining"
            [mineRemaining]="mineRemaining"
            [equalRemaining]="equalRemaining"
            [visitLabel]="billVisitLabel"
          [allowTip]="allowTip"
          [allowHelp]="allowHelp"
          [trustLine]="''"
          [savedPaymentMethodStatus]="savedPaymentMethodStatus"
            [paymentMethodLabel]="paymentMethodLabel"
            [serviceHelpLabel]="serviceAssist.label"
            [managerHelpLabel]="managerAssist.label"
            [paying]="paying"
            [offline]="offline"
            [paymentError]="paymentError"
            [claimUndo]="claimUndo"
            [shareSettledMoment]="shareSettledMoment"
            [visitHasOpenBalance]="visitHasOpenBalance"
            (initiatePayment)="pay()"
            (serviceHelp)="requestHelp('service')"
            (managerHelp)="requestHelp('manager')"
            (claimLine)="claimOneLine($event)"
            (unclaimLine)="undoClaim()"
            (billAttached)="onBillAttached($event)"
          />
        }

        @if (phase === 'receipt') {
          <div class="leos-leave-moment" role="status">
            <p class="leos-leave-moment__title">{{ receiptTitle }}</p>
            <p class="leos-leave-moment__thanks">
              Thanks for joining us today.
              @if (state.displayName && state.displayName !== 'Guest') {
                {{ state.displayName }}, we hope to see you again soon.
              } @else {
                We hope to see you again soon.
              }
            </p>
            @if (receiptPaidTotal > 0) {
              <p class="leos-muted">Paid {{ receiptPaidTotal | leosMoney: state.currency }}</p>
            } @else {
              <p class="leos-muted">Settle with the team before you go.</p>
            }
            <p class="leos-muted" style="margin-top:0.75rem;">
              When you’re ready, {{ leavePrompt }} and return to the welcome screen.
            </p>
          </div>
        }

        @if (phase === 'leave') {
          <div class="leos-leave-confirm" role="dialog" aria-labelledby="leave-title">
            <h2 id="leave-title" class="leos-leave-confirm__title">{{ leaveOpenCopy.title }}</h2>
            @if (leaveOpenCopy.showVisitOpen && visitHasOpenBalance) {
              <p class="leos-muted" style="margin-top:0.75rem;">
                Visit still open: {{ visitRemaining | leosMoney: 'ZAR' }}
              </p>
            }
            @if (leaveOpenCopy.body) {
              <p class="leos-muted">{{ leaveOpenCopy.body }}</p>
            }
          </div>
        }

        @if (message) {
          <p class="leos-success-banner" role="status" style="margin-top:1rem;">{{ message }}</p>
        }
        @if (error) {
          <p class="leos-error-banner" role="alert" style="margin-top:1rem;">{{ error }}</p>
        }
      }

      @if (state.sessionId && phase === 'live' && allowPay && balanceDue) {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="openBill()">
          {{ livePayLabel }}
        </button>
      }
      @if (state.sessionId && phase === 'live' && !balanceDue && (lastOrderTotal > 0 || fulfilments.length)) {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="phase = 'receipt'">
          Finish
        </button>
      }
      @if (state.sessionId && phase === 'live' && !allowPay && balanceDue) {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="phase = 'receipt'">
          Finish
        </button>
      }

      @if (state.sessionId && phase === 'payment' && shareSettledMoment) {
        <button
          escape
          type="button"
          class="leos-btn leos-btn--secondary"
          (click)="coverVisitAfterShare()"
        >
          Cover the visit
        </button>
      }
      @if (state.sessionId && phase === 'payment' && shareSettledMoment) {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="returnToOrdersAfterShare()">
          Back to your {{ ordersNoun }}
        </button>
      }
      @if (state.sessionId && phase === 'payment' && !shareSettledMoment) {
        <button escape type="button" class="leos-btn leos-btn--secondary" (click)="phase = 'live'">Back</button>
      }

      @if (state.sessionId && phase === 'leave') {
        <button escape type="button" class="leos-btn leos-btn--secondary" (click)="stayFromLeave()">
          Stay
        </button>
      }
      @if (state.sessionId && phase === 'leave') {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="leave()">
          {{ leaveOpenCopy.primary }}
        </button>
      }

      @if (state.sessionId && phase === 'receipt') {
        <button primary type="button" class="leos-btn leos-btn--primary" (click)="requestLeave()">
          {{ leaveCta }}
        </button>
      }
    </leos-experience-screen>

    <div class="leos-guest-chrome__dock" [hidden]="!state.sessionId || phase === 'arrival'">
      @if (phase === 'cart') {
        <div class="leos-cart-dock-actions">
          <button type="button" class="leos-btn leos-btn--secondary" (click)="phase = 'browse'">
            Add more items
          </button>
          <button
            type="button"
            class="leos-btn leos-btn--primary"
            [disabled]="!cart.length || submitting"
            (click)="submitOrder()"
          >
            {{ submitting ? 'Placing…' : 'Place ' + terms.term('transaction', 'order') }}
          </button>
        </div>
      }
      @if (showCartChip) {
        <leos-cart-summary
          [count]="cartCount"
          [total]="cartTotal"
          [orderNoun]="terms.term('transaction', 'order')"
          (open)="phase = 'cart'"
        />
      }
      <leos-guest-tab-bar
        [active]="activeTab"
        [showSpecials]="showSpecials"
        [showPay]="allowPay"
        [showHelp]="allowHelp"
        (tabSelect)="onTabSelect($event)"
        (help)="openHelpSheet()"
      />
    </div>

    <leos-guest-help-sheet
      [open]="helpSheetOpen && allowHelp"
      [busy]="helpBusy"
      [servicePending]="serviceHelpPending"
      [managerPending]="managerHelpPending"
      [serviceLabel]="serviceAssist.label"
      [serviceIdleHint]="serviceAssist.idleHint"
      [servicePendingHint]="serviceAssist.pendingHint"
      [managerLabel]="managerAssist.label"
      [managerIdleHint]="managerAssist.idleHint"
      [managerPendingHint]="managerAssist.pendingHint"
      (choose)="requestHelp($event)"
      (dismiss)="helpSheetOpen = false"
    />

    <leos-guest-feedback-sheet
      [open]="feedbackSheetOpen"
      [busy]="feedbackBusy"
      (delight)="onFeedbackDelight()"
      (concern)="onFeedbackConcern($event)"
      (skip)="skipFeedback()"
    />

    <leos-guest-choices-sheet
      [open]="!!choicesItem"
      [itemLabel]="choicesItem?.label || ''"
      [itemDescription]="choicesItem?.description || ''"
      [basePrice]="choicesItem?.unitPrice || 0"
      [groups]="choicesItem?.choiceGroups || []"
      [showFoodImages]="showFoodImages"
      [confirmVerb]="editingCartIndex != null ? 'Update' : 'Add'"
      [editQuantity]="editingCartLine?.quantity ?? null"
      [editSpecialRequest]="editingCartLine?.specialRequest || ''"
      [editSelections]="editingCartLine?.selections || null"
      (dismiss)="closeChoicesSheet()"
      (add)="onChoicesAdd($event)"
    />
    </div>
  `,
})

export class GuestPageComponent implements OnInit, OnDestroy {
  readonly session = inject(GuestSessionService);
  readonly state = inject(SessionStateService);
  readonly terms = inject(TerminologyService);
  private readonly route = inject(ActivatedRoute);

  onBillAttached(bill: GuestBillComponent | undefined) {
    this.session.attachBill(bill);
  }

  // --- Domain field forwarding (zero template churn) ---
  get phase() { return this.session.phase; }
  set phase(v: GuestPhase) { this.session.phase = v; }
  get allowTip() { return this.session.allowTip; }
  set allowTip(v: boolean) { this.session.allowTip = v; }
  get allowPay() { return this.session.allowPay; }
  set allowPay(v: boolean) { this.session.allowPay = v; }
  get allowHelp() { return this.session.allowHelp; }
  set allowHelp(v: boolean) { this.session.allowHelp = v; }
  get showSpecials() { return this.session.showSpecials; }
  set showSpecials(v: boolean) { this.session.showSpecials = v; }
  get catalogue() { return this.session.catalogue; }
  set catalogue(v: CatalogueItem[]) { this.session.catalogue = v; }
  get catalogueLoading() { return this.session.catalogueLoading; }
  set catalogueLoading(v: boolean) { this.session.catalogueLoading = v; }
  get cart() { return this.session.cart; }
  set cart(v: CartLine[]) { this.session.cart = v; }
  get editingCartIndex() { return this.session.editingCartIndex; }
  set editingCartIndex(v: number | null) { this.session.editingCartIndex = v; }
  get billLines() { return this.session.billLines; }
  set billLines(v) { this.session.billLines = v; }
  get mineBillLines() { return this.session.mineBillLines; }
  set mineBillLines(v) { this.session.mineBillLines = v; }
  get visitRemaining() { return this.session.visitRemaining; }
  set visitRemaining(v: number | null) { this.session.visitRemaining = v; }
  get mineRemaining() { return this.session.mineRemaining; }
  set mineRemaining(v: number | null) { this.session.mineRemaining = v; }
  get equalRemaining() { return this.session.equalRemaining; }
  set equalRemaining(v: number | null) { this.session.equalRemaining = v; }
  get billDetailLines() { return this.session.billDetailLines; }
  set billDetailLines(v) { this.session.billDetailLines = v; }
  get claimingLineId() { return this.session.claimingLineId; }
  set claimingLineId(v: string | null) { this.session.claimingLineId = v; }
  get recentlyClaimedIds() { return this.session.recentlyClaimedIds; }
  set recentlyClaimedIds(v: string[]) { this.session.recentlyClaimedIds = v; }
  get mineScopePulse() { return this.session.mineScopePulse; }
  set mineScopePulse(v: boolean) { this.session.mineScopePulse = v; }
  get claimUndo() { return this.session.claimUndo; }
  set claimUndo(v) { this.session.claimUndo = v; }
  get tablePeople() { return this.session.tablePeople; }
  set tablePeople(v: string[]) { this.session.tablePeople = v; }
  get orderRecordedFlash() { return this.session.orderRecordedFlash; }
  set orderRecordedFlash(v: boolean) { this.session.orderRecordedFlash = v; }
  get paymentMethodHint() { return this.session.paymentMethodHint; }
  set paymentMethodHint(v: string) { this.session.paymentMethodHint = v; }
  get paymentMethodsPanelOpen() { return this.session.paymentMethodsPanelOpen; }
  set paymentMethodsPanelOpen(v: boolean) { this.session.paymentMethodsPanelOpen = v; }
  get savedPaymentMethodStatus() { return this.session.savedPaymentMethodStatus; }
  set savedPaymentMethodStatus(v: 'none' | 'locked' | 'ready') { this.session.savedPaymentMethodStatus = v; }
  get paymentMethodLabel() { return this.session.paymentMethodLabel; }
  set paymentMethodLabel(v: string) { this.session.paymentMethodLabel = v; }
  get awaitingPaymentConfirm() { return this.session.awaitingPaymentConfirm; }
  set awaitingPaymentConfirm(v: boolean) { this.session.awaitingPaymentConfirm = v; }
  get shareSettledMoment() { return this.session.shareSettledMoment; }
  set shareSettledMoment(v: boolean) { this.session.shareSettledMoment = v; }
  get receiptPaidTotal() { return this.session.receiptPaidTotal; }
  set receiptPaidTotal(v: number) { this.session.receiptPaidTotal = v; }
  get search() { return this.session.search; }
  set search(v: string) { this.session.search = v; }
  get searchOpen() { return this.session.searchOpen; }
  set searchOpen(v: boolean) { this.session.searchOpen = v; }
  get categoryFilter() { return this.session.categoryFilter; }
  set categoryFilter(v: string) { this.session.categoryFilter = v; }
  get fulfilments() { return this.session.fulfilments; }
  set fulfilments(v) { this.session.fulfilments = v; }
  get timelineSteps() { return this.session.timelineSteps; }
  set timelineSteps(v) { this.session.timelineSteps = v; }
  get timelineGuidance() { return this.session.timelineGuidance; }
  set timelineGuidance(v: string) { this.session.timelineGuidance = v; }
  get timelineAnnouncement() { return this.session.timelineAnnouncement; }
  set timelineAnnouncement(v: string) { this.session.timelineAnnouncement = v; }
  get offline() { return this.session.offline; }
  set offline(v: boolean) { this.session.offline = v; }
  get liveError() { return this.session.liveError; }
  set liveError(v: string) { this.session.liveError = v; }
  get balanceDue() { return this.session.balanceDue; }
  set balanceDue(v: boolean) { this.session.balanceDue = v; }
  get submitting() { return this.session.submitting; }
  set submitting(v: boolean) { this.session.submitting = v; }
  get helpSheetOpen() { return this.session.helpSheetOpen; }
  set helpSheetOpen(v: boolean) { this.session.helpSheetOpen = v; }
  get helpBusy() { return this.session.helpBusy; }
  set helpBusy(v: boolean) { this.session.helpBusy = v; }
  get choicesItem() { return this.session.choicesItem; }
  set choicesItem(v) { this.session.choicesItem = v; }
  get serviceHelpPending() { return this.session.serviceHelpPending; }
  set serviceHelpPending(v: boolean) { this.session.serviceHelpPending = v; }
  get managerHelpPending() { return this.session.managerHelpPending; }
  set managerHelpPending(v: boolean) { this.session.managerHelpPending = v; }
  get paying() { return this.session.paying; }
  set paying(v: boolean) { this.session.paying = v; }
  get paymentError() { return this.session.paymentError; }
  set paymentError(v: string) { this.session.paymentError = v; }
  get message() { return this.session.message; }
  set message(v: string) { this.session.message = v; }
  get error() { return this.session.error; }
  set error(v: string) { this.session.error = v; }
  get lastOrderTotal() { return this.session.lastOrderTotal; }
  set lastOrderTotal(v: number) { this.session.lastOrderTotal = v; }

  get guestOrders() { return this.session.guestOrders; }
  get offlinePending() { return this.session.offlinePending; }
  get isReady() { return this.session.isReady; }
  get serviceAssist() { return this.session.serviceAssist; }
  get managerAssist() { return this.session.managerAssist; }
  get cartCount() { return this.session.cartCount; }
  get cartTotal() { return this.session.cartTotal; }
  get editingCartLine() { return this.session.editingCartLine; }

  // --- Domain method forwarding ---
  onTabSelect(tab: GuestTabId) { this.session.onTabSelect(tab); }
  feedbackSheetOpen = false;
  feedbackBusy = false;
  private feedbackOffered = false;

  get allowGuestFeedback(): boolean {
    const d = this.state.guestDesign as { feedback?: boolean } | null;
    return !!d?.feedback;
  }

  requestLeave() {
    if (this.allowGuestFeedback && !this.feedbackOffered && this.phase === 'receipt') {
      this.feedbackOffered = true;
      this.feedbackSheetOpen = true;
      return;
    }
    this.session.requestLeave();
  }

  onFeedbackDelight() {
    this.feedbackBusy = true;
    this.session.submitFeedback('delighted');
    this.feedbackBusy = false;
    this.feedbackSheetOpen = false;
    this.session.requestLeave();
  }

  onFeedbackConcern(text: string) {
    this.feedbackBusy = true;
    this.session.submitFeedback('concern', text);
    this.feedbackBusy = false;
    this.feedbackSheetOpen = false;
    this.session.requestLeave();
  }

  skipFeedback() {
    this.feedbackSheetOpen = false;
    this.session.requestLeave();
  }
  stayFromLeave() { this.session.stayFromLeave(); }
  openHelpSheet() { this.session.openHelpSheet(); }
  goToEntry() { this.session.goToEntry(); }
  lineQty(catalogueItemId: string) { return this.session.lineQty(catalogueItemId); }
  allergenLine(item: CatalogueItem) { return this.session.allergenLine(item); }
  dietaryLine(item: CatalogueItem) { return this.session.dietaryLine(item); }
  hasChoices(item: CatalogueItem) { return this.session.hasChoices(item); }
  addFromMenu(item: CatalogueItem) { this.session.addFromMenu(item); }
  onChoicesAdd(result: ChoiceSheetResult) { this.session.onChoicesAdd(result); }
  setMenuQty(item: CatalogueItem, qty: number) { this.session.setMenuQty(item, qty); }
  removeFromMenu(item: CatalogueItem) { this.session.removeFromMenu(item); }
  editCartLine(index: number) { this.session.editCartLine(index); }
  closeChoicesSheet() { this.session.closeChoicesSheet(); }
  setLineQty(index: number, qty: number) { this.session.setLineQty(index, qty); }
  removeLine(index: number) { this.session.removeLine(index); }
  submitOrder() { this.session.submitOrder(); }
  refreshLive() { this.session.refreshLive(); }
  retryConnection() { this.session.retryConnection(); }
  openBill() { this.session.openBill(); }
  claimOneLine(lineId: string) { this.session.claimOneLine(lineId); }
  undoClaim() { this.session.undoClaim(); }
  requestHelp(kind: GuestHelpKind) { this.session.requestHelp(kind); }
  callService() { this.session.callService(); }
  pay() { this.session.pay(); }
  returnToOrdersAfterShare() { this.session.returnToOrdersAfterShare(); }
  coverVisitAfterShare() { this.session.coverVisitAfterShare(); }
  leave() { this.session.leave(); }

  // --- Presentation (stays on page) ---
  get readyHint(): string {
    return guestReadyBanner(this.state.profileId);
  }

  get livePayLabel(): string {
    return livePayCtaLabel(this.isReady);
  }

  get leaveCta(): string {
    return `Thanks — leave ${this.terms.term('physicalContext', 'place').toLowerCase()}`;
  }

  get leavePrompt(): string {
    return leavePromptFor(this.terms.term('close', 'leave'));
  }

  get ordersNoun(): string {
    const t = this.terms.term('transaction', 'order').toLowerCase();
    return /s$/i.test(t) ? t : `${t}s`;
  }

  get leaveConfirmTitle(): string {
    return leaveConfirmTitleFor(this.terms.term('close', 'leave'));
  }

  get receiptTitle(): string {
    return receiptTitleFor(this.terms.term('close', 'leave'));
  }

  get leaveOpenCopy() {
    const place =
      this.state.physicalContextCode || this.terms.term('physicalContext', 'this place');
    return composeLeaveOpenCopy(this.visitRemaining, this.leaveConfirmTitle, place);
  }

  get categories(): string[] {
    const base = menuWithoutSpecialsSurface(this.catalogue, this.showSpecials);
    return [...new Set(base.map((i) => i.category))].sort();
  }

  get filteredCatalogue(): CatalogueItem[] {
    const q = this.search.trim().toLowerCase();
    const base = menuWithoutSpecialsSurface(this.catalogue, this.showSpecials);
    return base.filter((i) => {
      if (this.categoryFilter && i.category !== this.categoryFilter) return false;
      if (!q) return true;
      return i.label.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    });
  }

  get specialsCarousel(): CatalogueItem[] {
    return specialsCarouselItems(this.catalogue);
  }

  get featuredSpecials(): CatalogueItem[] {
    return featuredMenuItems(this.catalogue);
  }

  get browseSections(): Array<{ category: string; items: CatalogueItem[] }> {
    const items = this.filteredCatalogue;
    if (!items.length) return [];
    if (this.categoryFilter) {
      return [{ category: this.categoryFilter, items }];
    }
    const map = new Map<string, CatalogueItem[]>();
    for (const item of items) {
      const cat = (item.category || 'More').trim() || 'More';
      const list = map.get(cat) ?? [];
      list.push(item);
      map.set(cat, list);
    }
    return [...map.entries()].map(([category, sectionItems]) => ({
      category,
      items: sectionItems,
    }));
  }

  get showSectionTitles(): boolean {
    return !this.categoryFilter && this.browseSections.length > 1;
  }

  clearBrowseFilters() {
    this.search = '';
    this.searchOpen = false;
    this.categoryFilter = '';
  }

  openBrowseSearch() {
    this.searchOpen = true;
    queueMicrotask(() => {
      const el = document.querySelector(
        '.leos-browse-search__input',
      ) as HTMLInputElement | null;
      el?.focus();
    });
  }

  closeBrowseSearch() {
    this.search = '';
    this.searchOpen = false;
  }

  get guestNames(): string[] {
    return this.tablePeople.filter(
      (name) => !/^(pos|staff|waiter|kitchen|host)$/i.test(name.trim()),
    );
  }

  get screenLead(): string {
    if (this.phase === 'specials') return 'What’s on tonight.';
    if (this.phase === 'browse') {
      return draftOrderWhisper(
        this.cartCount,
        this.terms.term('transaction', 'order').toLowerCase(),
      );
    }
    return this.browseDenseLead;
  }

  get browseDenseLead(): string {
    if (this.phase === 'browse' || this.phase === 'specials') return '';
    return this.lead;
  }

  get billVisitLabel(): string {
    const place = this.terms.term('physicalContext', 'Visit');
    return place === 'Table' ? 'Table order' : 'This visit';
  }

  get arrivalLook() {
    return parseVenueArrival({
      venueName: this.state.venueName,
      location: this.state.location,
      placeSpoken: this.placeSpoken,
      brandColour: this.state.brandColour,
      logoUrl: this.state.logoUrl,
      guestDesign: this.state.guestDesign,
    });
  }

  get showCartChip(): boolean {
    return (
      !!this.state.sessionId &&
      this.cart.length > 0 &&
      this.phase !== 'cart' &&
      this.phase !== 'leave' &&
      this.phase !== 'arrival'
    );
  }

  get showFoodImages(): boolean {
    const raw = (this.state.terminology as Record<string, unknown> | undefined)?.[
      'showFoodImages'
    ];
    if (raw === undefined || raw === null) return true;
    if (typeof raw === 'boolean') return raw;
    const s = String(raw).toLowerCase().trim();
    return !['0', 'false', 'off', 'no', 'hide'].includes(s);
  }

  get activeTab(): GuestTabId {
    switch (this.phase) {
      case 'specials':
        return 'specials';
      case 'live':
      case 'receipt':
        return 'orders';
      case 'payment':
        return this.allowPay ? 'bill' : 'orders';
      default:
        return 'menu';
    }
  }

  get placeSpoken(): string {
    return guestPlaceSpoken(
      this.terms.term('physicalContext', 'Table'),
      this.state.physicalContextCode,
    );
  }

  get purpose(): string {
    const txn = this.terms.term('transaction', 'order');
    const pay = this.terms.term('payment', 'bill');
    switch (this.phase) {
      case 'specials':
        return 'Specials';
      case 'cart':
        return `Your ${txn.toLowerCase()}`;
      case 'live':
        return this.isReady ? 'Ready for you' : `Your ${txn.toLowerCase()}s`;
      case 'payment':
        return this.shareSettledMoment ? 'You’re settled' : `Your ${pay.toLowerCase()}`;
      case 'receipt':
        return 'You’re all set';
      case 'leave':
        return this.leaveLabelShort;
      default:
        return this.browseGreeting;
    }
  }

  get leaveLabelShort(): string {
    return leaveLabelShortFor(this.terms.term('close', 'Leave'));
  }

  get browseGreeting(): string {
    const raw = (this.state.displayName || '').trim();
    if (!raw || raw === 'Guest') return this.terms.term('catalogue', 'Menu');
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    return `Hi ${name}!`;
  }

  get paymentTrustLine(): string {
    return payConfidenceSentence({
      mineRemaining: this.mineRemaining,
      visitRemaining: this.visitRemaining,
      equalRemaining: this.equalRemaining,
      shareSettled: this.shareSettledMoment,
      visitHasOpenBalance: this.visitHasOpenBalance,
    });
  }

  get visitHasOpenBalance(): boolean {
    return hasOpenBalance(this.visitRemaining);
  }

  get lead(): string {
    const txn = this.terms.term('transaction', 'order').toLowerCase();
    switch (this.phase) {
      case 'specials':
        return 'Today’s picks — add anything you like.';
      case 'cart':
        return 'Looks right? Place when you’re ready — the team will see it straight away.';
      case 'live':
        return this.isReady
          ? liveReadyLead(this.readyHint, this.balanceDue)
          : this.timelineGuidance ||
              `We’ve got your ${txn} — we’ll let you know when it’s ready.`;
      case 'payment':
        // One confidence sentence as lead — never duplicated under the total.
        return this.paymentTrustLine;
      case 'receipt':
        return 'Thanks for joining us today.';
      case 'leave':
        return this.leaveOpenCopy.lead;
      default:
        return `Add what you’d like — the team sees your ${txn} when you place it.`;
    }
  }

  get help(): string {
    return '';
  }

  get showFooter(): boolean {
    if (!this.state.sessionId) return false;
    return (
      this.phase === 'cart' ||
      this.phase === 'live' ||
      this.phase === 'payment' ||
      this.phase === 'leave' ||
      this.phase === 'receipt'
    );
  }

  ngOnInit() {
    const paymentResult = this.route.snapshot.queryParamMap.get('payment');
    const welcomeBack = this.route.snapshot.queryParamMap.get('welcome') === 'back';
    const welcomeStill = this.route.snapshot.queryParamMap.get('welcome') === 'still';
    const justJoined = this.route.snapshot.queryParamMap.get('joined') === '1';
    this.session.bootstrap({ paymentResult, welcomeBack, welcomeStill, justJoined });
  }

  ngOnDestroy() {
    this.session.tearDown();
  }
}

