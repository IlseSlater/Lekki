import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ExperienceScreenComponent } from '../leos/experience-screen.component';
import { LineItemRowComponent } from '../leos/line-item-row.component';
import { OrderTotalComponent } from '../leos/order-total.component';
import { MenuCardComponent } from '../leos/menu-card.component';
import { CartSummaryComponent } from '../leos/cart-summary.component';
import { GuestBillComponent, type BillDisplayLine, type BillLine } from '../leos/guest-bill.component';
import { GuestOrdersComponent, type GuestOrder } from '../leos/guest-orders.component';
import { GuestTabBarComponent, type GuestTabId } from '../leos/guest-tab-bar.component';
import {
  GuestHelpSheetComponent,
  type GuestHelpKind,
} from '../leos/guest-help-sheet.component';
import {
  GuestChoicesSheetComponent,
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
import { guestReadyBanner, guestServiceAssistCopy, guestManagerAssistCopy } from '../studio/operate-status';
import { safeGuestImageUrl } from '../leos/catalogue-parity';
import {
  applyCatalogueItemChange,
  formatAllergenLine,
  formatDietaryLine,
  guestVisibleCatalogueItems,
} from '../studio/catalogue-guest-visibility';
import { LeosApiService, SessionStateService } from '../services/leos-api.service';
import type { PlatformEventEnvelope } from '../services/leos-api.service';
import { TerminologyService } from '../services/terminology.service';
import { OnboardingService } from '../services/onboarding.service';
import { StudioContextService } from '../services/studio-context.service';
import { resolveAllowTip } from '../studio/tip-continuity';
import { resolveAllowPay } from '../studio/pay-continuity';
import { resolveAllowHelp } from '../studio/help-continuity';
import { livePayCtaLabel, liveReadyLead } from '../studio/ready-pay-continuity';
import { composeLeaveOpenCopy } from '../studio/leave-open-continuity';
import { hasOpenBalance, isCleared, isGreaterMinor, toMinor, fromMinor } from '../leos/money';
import { composeStillInBanner } from '../studio/mid-visit-resume';
import { guestPlaceSpoken } from '../studio/place-continuity';
import {
  featuredMenuItems,
  menuWithoutSpecialsSurface,
  resolveShowSpecials,
  specialsCarouselItems,
} from '../studio/specials-continuity';
import { resolveMenuBrand } from '../studio/menu-brand-continuity';
import { offlineQueue } from '../services/offline-queue';
import { LeosMoneyPipe } from '../leos/leos-money.pipe';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

type GuestPhase = 'browse' | 'specials' | 'cart' | 'live' | 'payment' | 'receipt' | 'leave';

type CatalogueItem = {
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

type CartLine = {
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

type FulfilmentRow = {
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
function equalShareState(
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
 * LEOS Experience Heartbeat — Guest surface (Restaurant Pack as reference implementation).
 * Phases follow LEK-029 Guest UX contract: Browse → Cart → Live → Payment → Receipt.
 * Simple catalogue items add on Browse (no separate item page). Required choices open a sheet over Browse (G-04).
 */
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExperienceScreenComponent,
    LineItemRowComponent,
    OrderTotalComponent,
    CartSummaryComponent,
    MenuCardComponent,
    GuestBillComponent,
    GuestOrdersComponent,
    GuestTabBarComponent,
    GuestHelpSheetComponent,
    GuestChoicesSheetComponent,
    LeosMoneyPipe,
  ],
  template: `
    <div
      class="leos-guest-chrome leos-guest-chrome--atmosphere"
      [class.leos-guest-chrome--browse]="(phase === 'browse' || phase === 'specials') && !!state.sessionId"
      [class.leos-guest-chrome--specials]="phase === 'specials'"
      [class.leos-guest-chrome--with-chip]="showCartChip"
      [class.leos-guest-chrome--with-cart-actions]="phase === 'cart'"
      [class.leos-guest-chrome--with-live-actions]="phase === 'live'"
    >
    <leos-experience-screen
      [purpose]="purpose"
      [lead]="browseDenseLead"
      [help]="help"
      [place]="placeSpoken"
      [hospitality]="true"
      [compact]="true"
      [showFooter]="showFooter"
      [docked]="!!state.sessionId"
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

          @if (tablePeople.length >= 2) {
            <div
              class="leos-chip-row leos-chip-row--scroll leos-chip-row--calm leos-browse-tools__chips"
              role="status"
              aria-label="People at your table"
            >
              @for (name of tablePeople; track name) {
                <span class="leos-chip leos-chip--readonly">{{ name }}</span>
              }
            </div>
          }
        }

        @if (phase === 'browse') {
          <div class="leos-browse-tools">
            @if (showMenuBrand) {
              <div
                class="leos-menu-brand"
                [style.--menu-brand-progress]="menuBrandProgress"
                [style.--menu-brand-colour]="menuBrandColour"
                aria-hidden="true"
              >
                <div class="leos-menu-brand__fill">
                  @if (menuBrandCover) {
                    <img class="leos-menu-brand__cover" [src]="menuBrandCover" alt="" />
                  }
                  <span class="leos-menu-brand__shade"></span>
                  @if (menuBrandLogo) {
                    <img class="leos-menu-brand__logo" [src]="menuBrandLogo" alt="" />
                  }
                </div>
              </div>
            }
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

          @for (section of browseSections; track section.category) {
            <section class="leos-menu-section" [attr.aria-label]="section.category">
              @if (showSectionTitles) {
                <h2 class="leos-menu-section__title">{{ section.category }}</h2>
              }
              <div class="leos-menu-grid leos-menu-grid--hero" role="list">
                @for (item of section.items; track item.id) {
                  <leos-menu-card
                    [label]="item.label"
                    [category]="showSectionTitles ? '' : item.category"
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
            </section>
          } @empty {
            @if (!catalogueLoading) {
              <div class="leos-empty">
                @if (!catalogue.length) {
                  <p class="leos-muted">Nothing is on the {{ terms.term('catalogue', 'menu') }} yet.</p>
                  <p class="leos-muted">Ask a team member if this experience should already be live.</p>
                } @else {
                  <p class="leos-muted">Nothing matches that.</p>
                  <p class="leos-muted">Try another category or clear search.</p>
                  <button
                    type="button"
                    class="leos-btn leos-btn--secondary"
                    style="margin-top:0.75rem;"
                    (click)="clearBrowseFilters()"
                  >
                    Show everything
                  </button>
                }
              </div>
            }
          }
        }

        @if (phase === 'specials') {
          @if (showMenuBrand) {
            <div
              class="leos-menu-brand"
              [style.--menu-brand-progress]="menuBrandProgress"
              [style.--menu-brand-colour]="menuBrandColour"
              aria-hidden="true"
            >
              <div class="leos-menu-brand__fill">
                @if (menuBrandCover) {
                  <img class="leos-menu-brand__cover" [src]="menuBrandCover" alt="" />
                }
                <span class="leos-menu-brand__shade"></span>
                @if (menuBrandLogo) {
                  <img class="leos-menu-brand__logo" [src]="menuBrandLogo" alt="" />
                }
              </div>
            </div>
          }
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
                      <div
                        class="leos-specials-card__media"
                        [attr.data-has-image]="item.imageUrl ? 'true' : 'false'"
                      >
                        @if (item.imageUrl) {
                          <img [src]="item.imageUrl" alt="" />
                        }
                      </div>
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
                          {{ item.unitPrice | leosMoney }}
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
          @if (!cart.length) {
            <div class="leos-empty">
              <p class="leos-muted">Your {{ terms.term('transaction', 'order').toLowerCase() }} is empty.</p>
              <p class="leos-muted">
                Pick something from the {{ terms.term('catalogue', 'menu') }} — it only takes a tap.
              </p>
            </div>
          } @else {
            <h2 class="leos-cart-heading">Your {{ terms.term('transaction', 'order').toLowerCase() }}</h2>
            <div
              class="leos-cart-lines"
              role="list"
              [attr.aria-label]="'Your ' + terms.term('transaction', 'order').toLowerCase()"
            >
              @for (line of cart; track $index) {
                <leos-line-item-row
                  [label]="line.label"
                  [choiceSummary]="line.choiceSummary || null"
                  [imageUrl]="line.imageUrl || null"
                  [quantity]="line.quantity"
                  [unitPrice]="line.unitPrice"
                  [editable]="true"
                  [showEdit]="!!line.selections"
                  (quantityChange)="setLineQty($index, $event)"
                  (remove)="removeLine($index)"
                  (edit)="editCartLine($index)"
                />
              }
            </div>
            <leos-order-total [total]="cartTotal" label="Total" />
          }
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
          @if (timelineGuidance) {
            <p class="leos-muted" role="status" aria-live="polite">{{ timelineGuidance }}</p>
          }
        }

        @if (phase === 'payment' && allowPay) {
          @if (offline) {
            <div class="leos-offline-banner" role="status">You’re offline — pay when you’re back online.</div>
          }
          @if (shareSettledMoment) {
            <div class="leos-leave-moment" role="status">
              <p class="leos-leave-moment__title">Equal share is paid</p>
              <p class="leos-leave-moment__thanks">
                Thanks — you’re settled for your part.
                @if (visitHasOpenBalance) {
                  The rest of the visit can stay open for others, or you can cover it if you like.
                }
              </p>
              @if (visitHasOpenBalance) {
                <p class="leos-muted" style="margin-top:0.75rem;">
                  Visit still open: {{ visitRemaining | leosMoney: 'ZAR' }}
                </p>
              }
            </div>
          } @else {
            <leos-guest-bill
              #bill
              [lines]="billLines"
              [mineLines]="mineBillLines"
              [detailLines]="billDetailLines"
              [claimingLineId]="claimingLineId"
              [recentlyClaimedIds]="recentlyClaimedIds"
              [mineScopePulse]="mineScopePulse"
              [visitRemaining]="visitRemaining"
              [mineRemaining]="mineRemaining"
              [equalRemaining]="equalRemaining"
              [visitLabel]="billVisitLabel"
              [showScope]="true"
              [allowTip]="allowTip"
              [allowHelp]="allowHelp"
              [trustLine]="paymentTrustLine"
              [savedPaymentMethodStatus]="savedPaymentMethodStatus"
              [paymentMethodLabel]="paymentMethodLabel"
              [serviceHelpLabel]="serviceAssist.label"
              [managerHelpLabel]="managerAssist.label"
              [busy]="paying"
              [offline]="offline"
              [error]="paymentError"
              (pay)="pay()"
              (serviceHelp)="requestHelp('service')"
              (managerHelp)="requestHelp('manager')"
              (claimLine)="claimOneLine($event)"
            />

            @if (claimUndo) {
              <div class="leos-claim-undo" role="status" aria-live="polite">
                <span>{{ claimUndo.label }} added to your share.</span>
                <button type="button" class="leos-claim-undo__action" (click)="undoClaim()">Undo</button>
              </div>
            }

          }
        }

        @if (phase === 'receipt') {
          <div class="leos-leave-moment" role="status">
            <p class="leos-leave-moment__title">You’re finished</p>
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

    <div class="leos-guest-chrome__dock" [hidden]="!state.sessionId">
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
  private readonly api = inject(LeosApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(OnboardingService);
  private readonly studio = inject(StudioContextService);
  readonly state = inject(SessionStateService);
  readonly terms = inject(TerminologyService);

  @ViewChild('bill') bill?: GuestBillComponent;

  phase: GuestPhase = 'browse';
  /** Tip Continuity — false until refresh; never flash tips when Setup Tips is off. */
  allowTip = false;
  /** Pay Continuity — false until refresh; never flash Bill when Studio Pay is off. */
  allowPay = false;
  /** Call Staff Continuity — false until refresh; never flash Help when Call Staff is off. */
  allowHelp = false;
  /** Specials Continuity — Studio guestDesign.specials. */
  showSpecials = false;
  /** Menu half-moon brand — Identity toggle. */
  menuBrandProgress = 0;
  private menuBrandScrollBound = false;
  private readonly onMenuBrandScroll = () => this.updateMenuBrandProgress();
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

  get readyHint(): string {
    return guestReadyBanner(this.state.profileId);
  }

  /** Ready → Pay Continuity — settle only when balance due; never “finish”. */
  get livePayLabel(): string {
    return livePayCtaLabel(this.isReady);
  }

  get leaveCta(): string {
    return `Thanks — leave ${this.terms.term('physicalContext', 'place').toLowerCase()}`;
  }

  /** Receipt leave prompt — pack close language, not table-only. */
  get leavePrompt(): string {
    const close = this.terms.term('close', 'leave').toLowerCase();
    if (close.includes('complete')) return 'complete your visit';
    if (close.includes('clear')) return 'clear your table';
    if (close.includes('end') || close.includes('stay')) return 'end your stay session';
    if (close.includes('zone')) return 'leave your zone';
    if (close.includes('board')) return 'board or leave when you’re ready';
    if (close.includes('bay')) return 'leave the waiting bay';
    return close;
  }

  get serviceAssist() {
    return guestServiceAssistCopy(this.state.profileId);
  }

  get managerAssist() {
    return guestManagerAssistCopy(this.state.profileId);
  }

  get ordersNoun(): string {
    const t = this.terms.term('transaction', 'order').toLowerCase();
    return /s$/i.test(t) ? t : `${t}s`;
  }

  get leaveConfirmTitle(): string {
    const close = this.terms.term('close', 'leave').toLowerCase();
    if (close.includes('complete')) return 'Visit complete?';
    if (close.includes('end') || close.includes('stay')) return 'End your stay?';
    if (close.includes('zone')) return 'Leave this zone?';
    if (close.includes('bay')) return 'Leave the bay?';
    return 'All done here?';
  }

  /** Leave Continuity — free to leave even when visit still open for others. */
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

  /** Grouped menu for Browse confidence (sections when All). */
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

  /** Browse yields vertical space to the catalogue — lead stays on other phases. */
  get browseDenseLead(): string {
    if (this.phase === 'browse' || this.phase === 'specials') return '';
    return this.lead;
  }

  get cartCount(): number {
    return this.cart.reduce((n, l) => n + l.quantity, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((n, l) => n + l.quantity * l.unitPrice, 0);
  }

  get billVisitLabel(): string {
    const place = this.terms.term('physicalContext', 'Visit');
    return place === 'Table' ? 'Table order' : 'This visit';
  }

  get showCartChip(): boolean {
    return (
      !!this.state.sessionId &&
      this.cart.length > 0 &&
      this.phase !== 'cart' &&
      this.phase !== 'leave'
    );
  }

  /** Global guest setting — hide all menu food thumbnails when turned off. */
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

  /** Place confidence hero — same spoken form Kitchen sees. */
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
    const close = this.terms.term('close', 'Leave');
    if (/complete/i.test(close)) return 'Complete';
    if (/end/i.test(close) && /stay/i.test(close)) return 'End stay';
    if (/zone/i.test(close)) return 'Leave zone';
    if (/bay/i.test(close)) return 'Leave bay';
    return 'Leave';
  }

  /** Menu screen purpose — “Hi {Name}!” when we know who they are. */
  get browseGreeting(): string {
    const raw = (this.state.displayName || '').trim();
    if (!raw || raw === 'Guest') return this.terms.term('catalogue', 'Menu');
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    return `Hi ${name}!`;
  }

  get showMenuBrand(): boolean {
    return !!(this.menuBrand.enabled && this.state.sessionId);
  }

  get menuBrandColour(): string {
    return this.menuBrand.brandColour || '#d7a14a';
  }

  get menuBrandCover(): string | null {
    return safeGuestImageUrl(this.menuBrand.coverUrl);
  }

  get menuBrandLogo(): string | null {
    return safeGuestImageUrl(this.menuBrand.logoUrl);
  }

  private get menuBrand() {
    const ws = this.studio.readWorkspace();
    return resolveMenuBrand(this.state.token, ws.experiences, {
      enabled: this.state.menuBrandEnabled,
      brandColour: this.state.brandColour,
      logoUrl: '',
      coverUrl: '',
    });
  }

  get paymentTrustLine(): string {
    const mine = this.mineRemaining;
    const visit = this.visitRemaining;
    const equal = this.equalRemaining;
    if (equal != null && isCleared(equal) && hasOpenBalance(visit)) {
      return 'Your equal share is paid — you can still cover the visit if you like.';
    }
    if (mine != null && visit != null && isCleared(mine) && hasOpenBalance(visit)) {
      return 'Equal share is paid — you can still cover the visit if you like.';
    }
    if (equal != null && hasOpenBalance(equal) && visit != null && isGreaterMinor(visit, equal)) {
      return 'Pay an equal share, your items, or the whole visit — nothing until you confirm.';
    }
    if (mine != null && visit != null && hasOpenBalance(mine) && isGreaterMinor(visit, mine)) {
      return 'Pay for your items, or the whole visit — nothing until you confirm.';
    }
    return 'Nothing is charged until you confirm.';
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
        if (this.shareSettledMoment) {
          return this.visitHasOpenBalance
            ? 'Others can still settle the visit — or you can cover it.'
            : 'You’re all set for this visit.';
        }
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

  ngOnInit() {
    this.state.restore();
    this.refreshAllowTip();
    this.refreshAllowPay();
    this.refreshAllowHelp();
    this.refreshShowSpecials();
    this.offline = typeof navigator !== 'undefined' && !navigator.onLine;
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
    this.bindMenuBrandScroll();
    const paymentResult = this.route.snapshot.queryParamMap.get('payment');
    const welcomeBack = this.route.snapshot.queryParamMap.get('welcome') === 'back';
    const welcomeStill = this.route.snapshot.queryParamMap.get('welcome') === 'still';
    const justJoined = this.route.snapshot.queryParamMap.get('joined') === '1';
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

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
    this.clearClaimUndoTimer();
    this.clearClaimFlashTimer();
    this.clearMinePulseTimer();
    this.unsubPlatform?.();
    this.unsubPlatform = undefined;
    window.removeEventListener('online', this.onlineHandler);
    window.removeEventListener('offline', this.offlineHandler);
    this.unbindMenuBrandScroll();
  }

  private bindMenuBrandScroll() {
    if (this.menuBrandScrollBound || typeof window === 'undefined') return;
    window.addEventListener('scroll', this.onMenuBrandScroll, { passive: true });
    this.menuBrandScrollBound = true;
    this.updateMenuBrandProgress();
  }

  private unbindMenuBrandScroll() {
    if (!this.menuBrandScrollBound || typeof window === 'undefined') return;
    window.removeEventListener('scroll', this.onMenuBrandScroll);
    this.menuBrandScrollBound = false;
  }

  private updateMenuBrandProgress() {
    if (!this.showMenuBrand || (this.phase !== 'browse' && this.phase !== 'specials')) {
      this.menuBrandProgress = 0;
      return;
    }
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    this.menuBrandProgress = Math.min(1, Math.max(0, y / 140));
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
    const ws = this.studio.readWorkspace();
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    this.allowTip = resolveAllowTip(this.state.token, ws.experiences, sessionDesign);
  }

  /** Studio Pay → Guest Bill / dock (Pay Continuity · No Drift). */
  private refreshAllowPay() {
    const ws = this.studio.readWorkspace();
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    const next = resolveAllowPay(this.state.token, ws.experiences, sessionDesign);
    this.allowPay = next;
    if (!next && this.phase === 'payment') {
      this.phase = 'live';
    }
  }

  /** Studio Call Staff → Guest Help (Help Continuity · No Drift). */
  private refreshAllowHelp() {
    const ws = this.studio.readWorkspace();
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    this.allowHelp = resolveAllowHelp(this.state.token, ws.experiences, sessionDesign);
    if (!this.allowHelp) this.helpSheetOpen = false;
  }

  /** Studio Specials → Guest Specials tab (add/remove without new architecture). */
  private refreshShowSpecials() {
    const ws = this.studio.readWorkspace();
    const sessionDesign = this.state.guestDesign as Partial<import('../studio/guest-experience-design').GuestExperienceDesign> | null;
    const next = resolveShowSpecials(this.state.token, ws.experiences, sessionDesign);
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
