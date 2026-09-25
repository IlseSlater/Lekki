import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import type { VenueArrivalLook } from '../studio/venue-arrival';

/** Guest arrival + Studio Live phone — one renderer. */
@Component({
  standalone: true,
  selector: 'leos-venue-arrival',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="va"
      [class.va--live]="!interactive"
      [class.va--out]="exiting"
      [style.background]="look.background"
      [style.color]="look.ink"
      [attr.aria-label]="look.place ? look.headline + ', ' + look.place : look.headline"
    >
      <div class="va__cluster">
        @if (look.logos.length) {
          <div class="va__marks">
            @for (src of look.logos; track src) {
              <img class="va__logo" [src]="src" alt="" width="72" height="72" />
            }
          </div>
        }
        <h1 class="va__headline">{{ look.headline }}</h1>
        @if (look.place) {
          <p class="va__place">{{ look.place }}</p>
        }
        @if (look.line) {
          <p class="va__line" [style.color]="look.muted">{{ look.line }}</p>
        }
      </div>
      <button
        type="button"
        class="va__cta"
        [style.background]="look.ctaFill"
        [style.color]="look.ctaInk"
        [attr.tabindex]="interactive ? 0 : -1"
        (click)="onStart()"
      >
        {{ look.cta }}
      </button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      :host.leos-guest-arrival {
        position: fixed;
        inset: 0;
        z-index: 40;
      }
      .va {
        box-sizing: border-box;
        min-height: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        text-align: center;
        padding: 16vh 1.75rem max(2.25rem, env(safe-area-inset-bottom, 0px));
        font-family: var(--leos-font-interface, Sora, system-ui, sans-serif);
        animation: va-in var(--leos-duration-enter, 280ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1));
        transition: opacity var(--leos-duration, 220ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .va--live {
        padding-top: 12vh;
        min-height: 28rem;
      }
      .va--out {
        opacity: 0;
        pointer-events: none;
      }
      .va__cluster {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        justify-content: center;
        min-height: 0;
      }
      .va__marks {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .va__logo {
        width: 4.5rem;
        height: 4.5rem;
        object-fit: contain;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.16);
      }
      .va__headline {
        margin: 0;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 2rem;
        font-weight: 650;
        letter-spacing: -0.03em;
        line-height: 1.15;
        max-width: 16rem;
      }
      .va__place {
        margin: 0.65rem 0 0;
        font-size: 1.05rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        max-width: 16rem;
      }
      .va__line {
        margin: 0.45rem 0 0;
        font-size: 0.95rem;
        line-height: 1.45;
        max-width: 16rem;
      }
      .va__cta {
        flex-shrink: 0;
        margin-top: 1.5rem;
        min-height: 3rem;
        min-width: 12rem;
        padding: 0.85rem 1.75rem;
        border: none;
        border-radius: 999px;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
        transition: transform var(--leos-duration-fast, 160ms) var(--leos-ease, cubic-bezier(0.22, 1, 0.36, 1));
      }
      .va__cta:active {
        transform: scale(0.98);
      }
      .va--live .va__cta {
        pointer-events: none;
        cursor: default;
      }
      @keyframes va-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .va,
        .va--out,
        .va__cta {
          animation: none;
          transition: none;
        }
        .va__cta:active {
          transform: none;
        }
      }
    `,
  ],
})
export class VenueArrivalComponent implements OnDestroy {
  @Input({ required: true }) look!: VenueArrivalLook;
  @Input() interactive = true;
  @Output() started = new EventEmitter<void>();

  exiting = false;
  private exitTimer?: ReturnType<typeof setTimeout>;

  onStart() {
    if (!this.interactive || this.exiting) return;
    this.exiting = true;
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = reduce ? 0 : 200;
    this.exitTimer = setTimeout(() => this.started.emit(), wait);
  }

  ngOnDestroy() {
    if (this.exitTimer) clearTimeout(this.exitTimer);
  }
}
