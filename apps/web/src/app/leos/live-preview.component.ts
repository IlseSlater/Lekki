import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter, type Subscription } from 'rxjs';
import { StudioContextService } from '../services/studio-context.service';
import { CatalogueLiveService } from '../services/catalogue-live.service';
import { PreviewFocusService } from '../services/preview-focus.service';
import { resolvePublicWebOrigin } from '../services/public-origin';
import { EntryQrComponent } from './entry-qr.component';
import {
  PREVIEW_SCREENS,
  PREVIEW_SCREEN_LABELS,
  previewUrl,
  screenForStudioUrl,
  type PreviewMessage,
  type PreviewScreen,
  type PreviewVenueSnapshot,
} from '../preview/preview-protocol';

/**
 * Studio's live preview — the real guest app in a phone, on a sample table.
 * Follows edits as they happen; nothing done in the phone is sent anywhere.
 */
@Component({
  selector: 'leos-live-preview',
  standalone: true,
  imports: [EntryQrComponent],
  template: `
    <section class="lp" aria-label="What guests see">
      <p class="lp__label">What guests see</p>
      @if (src) {
        <div class="lp__phone">
          <iframe
            #frame
            class="lp__screen"
            title="Your guest app, as guests will see it"
            [src]="src"
            (load)="onFrameLoad()"
          ></iframe>
        </div>
        <div class="lp__chips" role="group" aria-label="Show a guest screen">
          @for (s of screens; track s) {
            <button
              type="button"
              class="lp__chip"
              [class.lp__chip--on]="s === screen"
              [attr.aria-pressed]="s === screen"
              (click)="choose(s)"
            >
              {{ labels[s] }}
            </button>
          }
        </div>
        @if (screen === 'pay' && !paymentsActive) {
          <p class="lp__hint lp__hint--gap" role="note">
            Guests can’t pay on their phones yet, so they see their orders and ask for the bill.
            Connect payments in Payments to turn this on.
          </p>
        }
        <p class="lp__hint">Live, as guests see it. Nothing you tap here is sent.</p>
        <button
          type="button"
          class="lp__phone-link"
          [attr.aria-expanded]="phoneLinkOpen"
          (click)="togglePhoneLink()"
        >
          {{ phoneLinkOpen ? 'Hide the code' : 'Open on my phone' }}
        </button>
        @if (phoneLinkOpen && phoneLink) {
          <div class="lp__qr">
            <leos-entry-qr [value]="phoneLink" label="Scan to try your guest app" [size]="148" />
            <p class="lp__hint">A preview with sample guests. Nothing is ordered or paid.</p>
          </div>
        }
      } @else {
        <div class="lp__phone lp__phone--empty">
          <p class="lp__empty">Your guest app appears here once your place has a name.</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .lp {
        position: sticky;
        top: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
      }
      .lp__label {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--studio-ink-secondary, #64748b);
      }
      .lp__phone {
        width: min(100%, 21.5rem);
        aspect-ratio: 390 / 800;
        max-height: min(80dvh, 44rem);
        border-radius: 2.6rem;
        padding: 0.6rem;
        box-sizing: border-box;
        background: #1b2230;
        box-shadow:
          0 4px 12px rgba(15, 23, 42, 0.08),
          0 24px 48px rgba(15, 23, 42, 0.1);
      }
      .lp__screen {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        border-radius: 2.1rem;
        background: #ffffff;
      }
      .lp__phone--empty {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lp__empty {
        margin: 0;
        padding: 1.5rem;
        border-radius: 2.1rem;
        background: #ffffff;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        text-align: center;
        color: #475569;
        font-size: 0.9rem;
        line-height: 1.45;
      }
      .lp__chips {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.4rem;
        max-width: 22rem;
      }
      .lp__chip {
        min-height: 2.75rem;
        padding: 0 0.9rem;
        border-radius: 999px;
        border: 1px solid var(--studio-line, #eae6e1);
        background: #ffffff;
        color: var(--studio-ink, #0f172a);
        font: 500 0.82rem/1 var(--studio-font, Sora, system-ui, sans-serif);
        cursor: pointer;
      }
      .lp__chip--on {
        background: var(--studio-ink, #0f172a);
        border-color: var(--studio-ink, #0f172a);
        color: #ffffff;
      }
      .lp__chip:focus-visible {
        outline: 2px solid var(--studio-accent, #d7a14a);
        outline-offset: 2px;
      }
      .lp__phone-link {
        min-height: 2.75rem;
        padding: 0 1rem;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: var(--studio-ink, #0f172a);
        font: 600 0.85rem/1 var(--studio-font, Sora, system-ui, sans-serif);
        text-decoration: underline;
        text-underline-offset: 3px;
        cursor: pointer;
      }
      .lp__phone-link:focus-visible {
        outline: 2px solid var(--studio-accent, #d7a14a);
        outline-offset: 2px;
      }
      .lp__qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border: 1px solid var(--studio-line, #eae6e1);
        border-radius: 1rem;
        background: #ffffff;
      }
      .lp__hint--gap {
        padding: 0.6rem 0.8rem;
        border-radius: 0.75rem;
        background: #f3f1ed;
        color: #334155;
      }
      .lp__hint {
        margin: 0;
        max-width: 20rem;
        text-align: center;
        font-size: 0.78rem;
        line-height: 1.4;
        color: var(--studio-ink-secondary, #64748b);
      }
    `,
  ],
})
export class LivePreviewComponent implements OnInit, OnDestroy {
  @ViewChild('frame') private frame?: ElementRef<HTMLIFrameElement>;

  private readonly ctx = inject(StudioContextService);
  private readonly catalogueLive = inject(CatalogueLiveService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly focus = inject(PreviewFocusService);
  private navSub?: Subscription;

  readonly screens = PREVIEW_SCREENS;
  readonly labels = PREVIEW_SCREEN_LABELS;
  screen: PreviewScreen = 'arrive';
  src: SafeResourceUrl | null = null;

  get paymentsActive(): boolean {
    return this.ctx.livePaymentsActive();
  }

  phoneLinkOpen = false;
  phoneLink = '';

  async togglePhoneLink() {
    this.phoneLinkOpen = !this.phoneLinkOpen;
    if (!this.phoneLinkOpen || !this.venueId) return;
    const origin = await resolvePublicWebOrigin();
    this.phoneLink = `${origin}${previewUrl({
      venueId: this.venueId,
      screen: this.screen,
      placeCode: this.placeCode() || undefined,
      snapshot: this.snapshot(),
    })}`;
  }
  private venueId = '';
  private ready = false;
  /** The owner picked a screen on this page — don't move it under them. */
  private picked = false;
  private lastCatalogueRevision = -1;

  private readonly onMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.source !== this.frame?.nativeElement.contentWindow) return;
    if ((event.data as { type?: string } | null)?.type !== 'lekki-preview-ready') return;
    this.ready = true;
    this.post({ type: 'lekki-preview', venue: this.snapshot(), screen: this.screen });
  };

  constructor() {
    // Edits in Studio reach the phone as they happen.
    effect(() => {
      this.ctx.liveRevision();
      this.ctx.liveFocusPlace();
      this.ctx.livePaymentsActive();
      untracked(() => this.syncVenue());
    });
    // A page asked for the screen its setting affects.
    effect(() => {
      const req = this.focus.request();
      if (!req) return;
      untracked(() => {
        this.screen = req.screen;
        this.post({ type: 'lekki-preview', screen: req.screen });
      });
    });
    // Menu saves: the phone reloads the menu.
    effect(() => {
      const rev = this.catalogueLive.revision();
      untracked(() => {
        if (this.lastCatalogueRevision >= 0 && rev !== this.lastCatalogueRevision) {
          this.post({ type: 'lekki-preview', refresh: true });
        }
        this.lastCatalogueRevision = rev;
      });
    });
  }

  ngOnInit() {
    window.addEventListener('message', this.onMessage);
    this.screen = screenForStudioUrl(this.router.url);
    this.syncVenue();
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.picked = false;
        const next = screenForStudioUrl(e.urlAfterRedirects);
        if (next !== this.screen) this.choose(next, false);
      });
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.onMessage);
    this.navSub?.unsubscribe();
  }

  choose(screen: PreviewScreen, byOwner = true) {
    if (!byOwner && this.picked) return;
    if (byOwner) this.picked = true;
    this.screen = screen;
    this.post({ type: 'lekki-preview', screen });
  }

  onFrameLoad() {
    // The phone also says "ready"; this covers a reload of the same page.
    this.post({ type: 'lekki-preview', venue: this.snapshot(), screen: this.screen });
  }

  private syncVenue() {
    const active = this.ctx.activeExperience();
    const venueId = active?.venueId?.trim() || '';
    if (venueId !== this.venueId) {
      this.venueId = venueId;
      this.ready = false;
      this.src = venueId
        ? this.sanitizer.bypassSecurityTrustResourceUrl(
            previewUrl({ venueId, screen: this.screen, placeCode: this.placeCode() }),
          )
        : null;
      return;
    }
    if (this.ready) this.post({ type: 'lekki-preview', venue: this.snapshot() });
  }

  private placeCode(): string {
    return this.ctx.liveFocusPlace()?.trim() || this.ctx.activeExperience()?.placeCode?.trim() || '';
  }

  private snapshot(): PreviewVenueSnapshot {
    const a = this.ctx.activeExperience();
    return {
      venueName: a?.venueName ?? '',
      brandColour: a?.brandColour || '#d7a14a',
      logoUrl: a?.logoUrl ?? '',
      location: a?.location ?? '',
      guestDesign: (a?.guestDesign as Record<string, unknown> | undefined) ?? null,
      paymentsActive: this.ctx.livePaymentsActive(),
      placeCode: this.placeCode() || undefined,
    };
  }

  private post(msg: PreviewMessage) {
    const win = this.frame?.nativeElement.contentWindow;
    if (!win) return;
    win.postMessage(msg, window.location.origin);
  }
}
