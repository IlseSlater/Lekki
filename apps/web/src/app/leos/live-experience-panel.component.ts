import { Component, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import {
  defaultDesignForType,
  projectionCatalogueForType,
  projectionItemsFromVenueCatalogue,
  type GuestExperienceDesign,
  type ProjectionItem,
} from '../studio/guest-experience-design';
import { getExperience, type SetupStepSlug } from '../studio/experience-registry';
import { StudioContextService } from '../services/studio-context.service';
import { LeosApiService } from '../services/leos-api.service';
import { GuestShellProjectionComponent } from './guest-shell-projection.component';
import { safeGuestImageUrl } from './catalogue-parity';
import { CatalogueLiveService } from '../services/catalogue-live.service';
import { guestPlaceSpoken } from '../studio/place-continuity';

/**
 * Live Experience — phone on the desk (Design System v1).
 * Arrival mirrors Guest Entry welcome — never a second UI.
 */
@Component({
  selector: 'leos-live-experience-panel',
  standalone: true,
  imports: [GuestShellProjectionComponent],
  template: `
    <div class="phone-desk" aria-label="Live Experience">
      <p class="phone-desk__label">Live Experience</p>
      <div class="phone" [class.phone--pulse]="pulse">
        <div class="phone__notch" aria-hidden="true"></div>
        <div class="phone__screen">
          @if (mode === 'arrival') {
            <div class="phone-arrival" [style.--brand]="brandColour">
              <p class="phone-arrival__eyebrow" [class.phone-venue--morph]="pulse">
                {{ arrivalEyebrow }}
              </p>
              @if (placeSpoken) {
                <p class="phone-arrival__place">
                  <strong>{{ placeSpoken }}</strong>
                </p>
              }
              <p class="phone-arrival__reassure">You’re in.</p>
              <p class="phone-arrival__muted">
                @if (placeSpoken) {
                  <strong>{{ placeSpoken }}</strong>
                  — the team can see you. Browse when you’re ready.
                } @else {
                  The team can see you. Browse when you’re ready.
                }
              </p>
              <button type="button" class="phone-arrival__cta" tabindex="-1">
                {{ catalogueLabel }}
              </button>
            </div>
          } @else if (mode === 'pay') {
            <div class="phone-pay" [style.--brand]="brandColour">
              @if (logoUrl) {
                <img class="phone-pay__logo" [src]="logoUrl" alt="" width="36" height="36" />
              }
              <h2 class="phone-pay__venue" [class.phone-venue--morph]="pulse">{{ venueName }}</h2>
              <p class="phone-pay__title">Your {{ paymentLabel.toLowerCase() }}</p>
              <p class="phone-pay__amount">{{ sampleVisitTotal }}</p>
              <ul class="phone-pay__methods">
                @if (payMethods.card) {
                  <li>Card</li>
                }
                @if (payMethods.applePay) {
                  <li>Apple Pay</li>
                }
                @if (payMethods.googlePay) {
                  <li>Google Pay</li>
                }
                @if (design.payAtTable) {
                  <li>Pay at {{ placeNoun }}</li>
                }
                @if (design.tipStaff) {
                  <li>Add a tip</li>
                }
                @if (design.splitBill) {
                  <li>Split {{ paymentLabel.toLowerCase() }}</li>
                }
              </ul>
              @if (!payMethods.card && !payMethods.applePay && !payMethods.googlePay && !design.payAtTable) {
                <p class="phone-pay__empty">No payment methods on yet.</p>
              }
            </div>
          } @else {
            <div class="phone-shell-wrap">
              <leos-guest-shell-projection
                [design]="design"
                [venueName]="venueName"
                [placeCode]="placeLabel"
                [greeting]="greeting"
                [brandColour]="brandColour"
                [logoUrl]="logoUrl"
                [menuBrandEnabled]="menuBrandEnabled"
                [menuCoverUrl]="menuCoverUrl"
                [catalogueLabel]="catalogueLabel"
                [paymentLabel]="paymentLabel"
                [placeNoun]="placeNoun"
                [transactionLabel]="transactionLabel"
                [leaveLabel]="leaveLabel"
                [sampleItemLabel]="sampleItemLabel"
                [venueCatalogue]="venueCatalogue"
                [experienceTypeId]="experienceTypeId"
                [payMethods]="payMethods"
              />
            </div>
          }
        </div>
      </div>
      @if (publicLive) {
        <p class="phone-desk__live" role="status">Live · guests can join</p>
      }
      <button type="button" class="phone-desk__fs" (click)="openFullscreen()">View larger</button>
    </div>

    @if (ctx.liveFullscreenOpen()) {
      <div class="phone-fs" role="dialog" aria-modal="true" aria-label="Live Experience">
        <button type="button" class="phone-fs__close" (click)="closeFullscreen()">Close</button>
        <div class="phone phone--fs">
          <div class="phone__notch" aria-hidden="true"></div>
          <div class="phone__screen">
            @if (mode === 'arrival') {
              <div class="phone-arrival" [style.--brand]="brandColour">
                <p class="phone-arrival__eyebrow" [class.phone-venue--morph]="pulse">
                  {{ arrivalEyebrow }}
                </p>
                @if (placeSpoken) {
                  <p class="phone-arrival__place">
                    <strong>{{ placeSpoken }}</strong>
                  </p>
                }
                <p class="phone-arrival__reassure">You’re in.</p>
                <p class="phone-arrival__muted">
                  @if (placeSpoken) {
                    <strong>{{ placeSpoken }}</strong>
                    — the team can see you. Browse when you’re ready.
                  } @else {
                    The team can see you. Browse when you’re ready.
                  }
                </p>
                <button type="button" class="phone-arrival__cta" tabindex="-1">
                  {{ catalogueLabel }}
                </button>
              </div>
            } @else if (mode === 'pay') {
              <div class="phone-pay" [style.--brand]="brandColour">
                @if (logoUrl) {
                  <img class="phone-pay__logo" [src]="logoUrl" alt="" width="36" height="36" />
                }
                <h2 class="phone-pay__venue" [class.phone-venue--morph]="pulse">{{ venueName }}</h2>
                <p class="phone-pay__title">Your {{ paymentLabel.toLowerCase() }}</p>
                <p class="phone-pay__amount">{{ sampleVisitTotal }}</p>
                <ul class="phone-pay__methods">
                  @if (payMethods.card) {
                    <li>Card</li>
                  }
                  @if (payMethods.applePay) {
                    <li>Apple Pay</li>
                  }
                  @if (payMethods.googlePay) {
                    <li>Google Pay</li>
                  }
                  @if (design.payAtTable) {
                    <li>Pay at {{ placeNoun }}</li>
                  }
                  @if (design.tipStaff) {
                    <li>Add a tip</li>
                  }
                  @if (design.splitBill) {
                    <li>Split {{ paymentLabel.toLowerCase() }}</li>
                  }
                </ul>
              </div>
            } @else {
              <div class="phone-shell-wrap">
                <leos-guest-shell-projection
                  [design]="design"
                  [venueName]="venueName"
                  [placeCode]="placeLabel"
                  [greeting]="greeting"
                  [brandColour]="brandColour"
                  [logoUrl]="logoUrl"
                  [menuBrandEnabled]="menuBrandEnabled"
                  [menuCoverUrl]="menuCoverUrl"
                  [fillFrame]="true"
                  [catalogueLabel]="catalogueLabel"
                  [paymentLabel]="paymentLabel"
                  [placeNoun]="placeNoun"
                  [transactionLabel]="transactionLabel"
                  [leaveLabel]="leaveLabel"
                  [sampleItemLabel]="sampleItemLabel"
                  [venueCatalogue]="venueCatalogue"
                  [experienceTypeId]="experienceTypeId"
                  [payMethods]="payMethods"
                />
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-width: 0;
      }
      .phone-desk {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: var(--studio-live-width, 420px);
        padding: 1.5rem 1rem 0;
        box-sizing: border-box;
      }
      .phone-desk__label {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .phone-desk__live {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #4f8a6b;
      }
      .phone {
        /* Fixed frame across Setup steps — never shrink with short pay/shell copy */
        width: 20.5rem;
        max-width: 100%;
        flex-shrink: 0;
        box-sizing: border-box;
        border-radius: 2rem;
        background: #1b2230;
        padding: 0.7rem;
        box-shadow: var(--studio-shadow-device, 0 4px 12px rgba(45, 30, 15, 0.1));
        transition:
          box-shadow var(--studio-duration, 220ms) var(--studio-ease),
          transform var(--studio-duration, 220ms) var(--studio-ease);
      }
      .phone--pulse {
        transform: translateY(-1px);
        box-shadow:
          0 0 0 2px rgba(215, 161, 74, 0.45),
          0 0 0 6px rgba(215, 161, 74, 0.12),
          0 8px 24px rgba(15, 23, 42, 0.1);
        animation: phone-sync-glow 360ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes phone-sync-glow {
        0% {
          box-shadow:
            0 0 0 0 rgba(215, 161, 74, 0.55),
            0 0 0 0 rgba(215, 161, 74, 0),
            0 4px 12px rgba(15, 23, 42, 0.08);
        }
        55% {
          box-shadow:
            0 0 0 2px rgba(215, 161, 74, 0.5),
            0 0 0 8px rgba(215, 161, 74, 0.16),
            0 8px 24px rgba(15, 23, 42, 0.1);
        }
        100% {
          box-shadow:
            0 0 0 2px rgba(215, 161, 74, 0.45),
            0 0 0 6px rgba(215, 161, 74, 0.12),
            0 8px 24px rgba(15, 23, 42, 0.1);
        }
      }
      .phone--pulse .phone__screen {
        opacity: 1;
      }
      .phone__notch {
        width: 5.5rem;
        height: 0.35rem;
        margin: 0.15rem auto 0.55rem;
        border-radius: 999px;
        background: #3a4150;
      }
      .phone__screen {
        border-radius: 1.45rem;
        overflow: hidden;
        background: #ffffff;
        min-height: 28rem;
        height: min(62dvh, 34rem);
        transition: opacity var(--studio-duration, 220ms) var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1));
      }
      .phone__screen leos-guest-shell-projection {
        display: block;
        height: 100%;
      }
      .phone-arrival {
        height: 100%;
        min-height: 28rem;
        padding: 1.75rem 1.25rem 1.5rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-family: 'Sora', system-ui, sans-serif;
        color: #1b2230;
        animation: phone-in var(--studio-duration, 220ms) var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1));
      }
      @keyframes phone-in {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .phone-venue--morph {
        animation: phone-morph var(--studio-duration, 220ms)
          var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1));
      }
      @keyframes phone-morph {
        from {
          opacity: 0.45;
        }
        to {
          opacity: 1;
        }
      }
      .phone-arrival__eyebrow {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 650;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #6b7280;
      }
      .phone-arrival__place {
        margin: 1rem 0 0;
        font-size: 1.65rem;
        line-height: 1.2;
        font-weight: 500;
        color: #1b2230;
      }
      .phone-arrival__place strong {
        font-weight: 650;
      }
      .phone-arrival__reassure {
        margin: 0.85rem 0 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.35rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: #1b2230;
      }
      .phone-arrival__muted {
        margin: 0.65rem 0 1.75rem;
        font-size: 0.875rem;
        line-height: 1.45;
        color: #6b7280;
      }
      .phone-arrival__muted strong {
        color: #1b2230;
        font-weight: 650;
      }
      .phone-arrival__cta {
        margin: 0 auto;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 999px;
        background: var(--brand, var(--leos-gold, #d7a14a));
        color: var(--leos-on-brand, #1b2230);
        font-size: 0.875rem;
        font-weight: 650;
        font-family: inherit;
        width: fit-content;
        cursor: default;
        pointer-events: none;
      }
      .phone-pay__logo {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 10px;
        object-fit: cover;
        margin-bottom: 0.25rem;
        border: 2px solid color-mix(in srgb, var(--brand, #d7a14a) 55%, #fff);
      }
      .phone-pay {
        height: 100%;
        min-height: 28rem;
        padding: 1.75rem 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        font-family: 'Sora', system-ui, sans-serif;
        color: #1b2230;
        animation: phone-in var(--studio-duration, 220ms) var(--studio-ease-soft, cubic-bezier(0.33, 1, 0.68, 1));
      }
      .phone-pay__brand {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b7280;
      }
      .phone-pay__venue {
        margin: 0.35rem 0 1.5rem;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.5rem;
        font-weight: 650;
      }
      .phone-pay__title {
        margin: 0;
        font-size: 0.8125rem;
        color: #6b7280;
      }
      .phone-pay__amount {
        margin: 0.35rem 0 1.5rem;
        font-size: 2rem;
        font-weight: 650;
        letter-spacing: -0.03em;
      }
      .phone-pay__methods {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .phone-pay__methods li {
        padding: 0.85rem 0;
        border-bottom: 1px solid #e7e2db;
        font-size: 0.9375rem;
        font-weight: 600;
      }
      .phone-pay__empty {
        margin: 1rem 0 0;
        font-size: 0.875rem;
        color: #6b7280;
      }
      .phone-shell-wrap {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
      }
      .phone-shell-wrap leos-guest-shell-projection {
        flex: 1;
        min-height: 0;
        display: block;
      }
      .phone-desk__fs {
        border: none;
        background: transparent;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 550;
        color: var(--studio-ink-tertiary, #8f96a3);
        cursor: pointer;
        letter-spacing: 0.02em;
      }
      .phone-desk__fs:hover {
        color: var(--studio-ink-secondary, #6b7280);
      }
      .phone-fs {
        position: fixed;
        inset: 0;
        z-index: 190;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(27, 34, 48, 0.45);
      }
      .phone-fs__close {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 210;
        border: none;
        border-radius: 999px;
        padding: 0.55rem 1rem;
        background: #fff;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
        box-shadow: var(--studio-shadow, 0 1px 3px rgba(45, 30, 15, 0.08));
      }
      .phone--fs {
        width: min(100%, 22rem);
      }
      .phone--fs .phone__screen {
        height: min(85dvh, 42rem);
      }
    `,
  ],
})
export class LiveExperiencePanelComponent implements OnInit, OnDestroy {
  readonly ctx = inject(StudioContextService);
  private readonly api = inject(LeosApiService);
  private readonly catalogueLive = inject(CatalogueLiveService);
  private readonly router = inject(Router);
  private navSub?: Subscription;
  private pulseTimer?: ReturnType<typeof setTimeout>;

  mode: 'shell' | 'arrival' | 'pay' = 'shell';
  /** Go Live — same shell, now public (never a different preview). */
  publicLive = false;
  venueName = 'Your place';
  logoUrl = '';
  brandColour = '#d7a14a';
  menuBrandEnabled = false;
  menuCoverUrl = '';
  location = '';
  placeLabel = '';
  /** Guest-spoken place — never “Table Table 1”. */
  placeSpoken = '';
  /** Entry eyebrow: venue when named, else Welcome. */
  arrivalEyebrow = 'Welcome';
  greeting = 'Hi there';
  design: GuestExperienceDesign = defaultDesignForType('restaurant');
  payMethods = { card: true, applePay: true, googlePay: true };
  pulse = false;
  catalogueLabel = 'Menu';
  paymentLabel = 'Bill';
  placeNoun = 'Table';
  transactionLabel = 'Order';
  sampleItemLabel = 'Classic Burger';
  sampleVisitTotal = '—';
  venueCatalogue: ProjectionItem[] | null = null;
  leaveLabel = 'Leave';
  experienceTypeId = 'restaurant';
  private lastFingerprint = '';

  constructor() {
    effect(() => {
      this.ctx.liveRevision();
      this.ctx.liveFocusPlace();
      this.ctx.livePayMethods();
      this.catalogueLive.revision();
      this.hydrate(true);
    });
  }

  ngOnInit() {
    this.hydrate(false);
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.hydrate(false));
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
  }

  openFullscreen() {
    this.ctx.openLiveExperience();
  }

  closeFullscreen() {
    this.ctx.closeLiveExperience();
  }

  private hydrate(fromLive: boolean) {
    const url = this.router.url;
    const match = /\/studio\/setup\/([^/?#]+)/.exec(url);
    const onCreate = url.includes('/studio/create');
    const slug = (match?.[1] ?? (onCreate ? 'experience' : 'identity')) as SetupStepSlug;

    // Identity + Places → arrival · Payments → pay · Go Live → public shell · else browse shell
    // When menu half-moon is on, show the shell on Identity so owners see brand immediately.
    if (slug === 'payments') {
      this.mode = 'pay';
      this.publicLive = false;
    } else if (
      (slug === 'identity' || slug === 'places') &&
      !this.ctx.activeExperience()?.menuBrandEnabled
    ) {
      this.mode = 'arrival';
      this.publicLive = false;
    } else if (slug === 'identity' || slug === 'places') {
      this.mode = 'shell';
      this.publicLive = false;
    } else {
      this.mode = 'shell';
      this.publicLive = slug === 'golive' || !!this.ctx.readConfig().live;
    }

    const active = this.ctx.activeExperience();
    const typeId = active?.typeId ?? 'restaurant';
    const def = getExperience(typeId);
    this.venueName = active?.venueName?.trim() || def?.defaults.venueName || 'Your place';
    this.logoUrl = safeGuestImageUrl(active?.logoUrl) ?? '';
    this.brandColour = active?.brandColour || '#d7a14a';
    this.menuBrandEnabled = !!active?.menuBrandEnabled;
    this.menuCoverUrl = safeGuestImageUrl(active?.menuCoverUrl) ?? '';
    this.location = active?.location?.trim() || '';
    this.design = active?.guestDesign
      ? { ...defaultDesignForType(typeId), ...active.guestDesign }
      : defaultDesignForType(typeId);
    this.payMethods = this.ctx.livePayMethods();
    this.catalogueLabel = def?.terminology.catalogue ?? 'Menu';
    this.paymentLabel = def?.terminology.payment ?? 'Bill';
    this.placeNoun = def?.terminology.place ?? 'Table';
    this.transactionLabel = def?.terminology.transaction ?? 'Order';
    this.leaveLabel = this.leaveLabelFor(typeId, this.placeNoun);
    this.loadVenueCatalogue(active?.venueId?.trim() || '');
    if (!this.venueCatalogue?.length) {
      this.sampleItemLabel = this.sampleItemFor(typeId);
      this.sampleVisitTotal = this.sampleTotalFor(typeId, this.sampleItemLabel);
    }
    this.experienceTypeId = typeId;
    this.greeting = this.venueName !== 'Your place' ? `Hi — welcome to ${this.venueName}` : 'Hi there';

    const focus = this.ctx.liveFocusPlace();
    const fallbackPlace =
      active?.placeCode || active?.placeCodes?.[0] || def?.defaults.placeCode || '';
    this.placeLabel = focus || fallbackPlace;
    this.placeSpoken = guestPlaceSpoken(this.placeNoun, this.placeLabel);
    this.arrivalEyebrow =
      this.venueName && this.venueName !== 'Your place' ? this.venueName : 'Welcome';

    const fp = `${this.venueName}|${this.logoUrl}|${this.brandColour}|${this.menuBrandEnabled}|${this.menuCoverUrl}|${this.location}|${this.placeSpoken}|${JSON.stringify(this.design)}|${JSON.stringify(this.payMethods)}|${this.mode}|${this.publicLive}|${this.sampleVisitTotal}`;
    if (fromLive && this.lastFingerprint && this.lastFingerprint !== fp) {
      this.pulse = true;
      if (this.pulseTimer) clearTimeout(this.pulseTimer);
      this.pulseTimer = setTimeout(() => {
        this.pulse = false;
      }, 360);
    }
    this.lastFingerprint = fp;
  }

  /** Match guest tab Leave / Complete from pack close terms. */
  private leaveLabelFor(typeId: string, placeNoun: string): string {
    if (typeId === 'restaurant' || typeId === 'cafe') return 'Complete';
    if (typeId === 'hotel') return 'End stay';
    if (typeId === 'healthcare') return 'Leave bay';
    if (typeId === 'festival') return 'Leave zone';
    if (typeId === 'airport') return 'Leave';
    const p = (placeNoun || '').toLowerCase();
    if (p.includes('room')) return 'End stay';
    if (p.includes('zone')) return 'Leave zone';
    if (p.includes('bay')) return 'Leave bay';
    if (p.includes('gate')) return 'Leave gate';
    return 'Leave';
  }

  private sampleItemFor(typeId: string): string {
    switch (typeId) {
      case 'cafe':
        return 'Flat white';
      case 'hotel':
        return 'In-room breakfast';
      case 'festival':
        return 'Loaded fries';
      case 'airport':
        return 'Gate latte';
      case 'healthcare':
        return 'Tea & biscuit';
      default:
        return 'Classic Burger';
    }
  }

  private sampleTotalFor(typeId: string, label: string): string {
    if (this.venueCatalogue?.length) {
      const hit = this.venueCatalogue.find((i) => i.label === label);
      return hit?.price ?? this.venueCatalogue[0]?.price ?? '—';
    }
    const items = projectionCatalogueForType(typeId).items;
    const hit = items.find((i) => i.label === label);
    return hit?.price ?? items[0]?.price ?? '—';
  }

  private loadVenueCatalogue(venueId: string) {
    if (!venueId) {
      this.venueCatalogue = null;
      return;
    }
    this.api.getCatalogue(venueId).subscribe({
      next: (rows) => {
        const mapped = projectionItemsFromVenueCatalogue(rows);
        if (!mapped.length) {
          this.venueCatalogue = null;
          return;
        }
        this.venueCatalogue = mapped;
        this.sampleItemLabel = mapped[0]?.label ?? this.sampleItemLabel;
        this.sampleVisitTotal = mapped[0]?.price ?? '—';
      },
      error: () => {
        this.venueCatalogue = null;
      },
    });
  }
}
