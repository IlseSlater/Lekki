import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';

let horizonUid = 0;

/**
 * Layered horizon: one radial sky, four SVG ridges.
 * `hero` — homepage, content between ridges, light scroll lag.
 * `canvas` — static page background (no blur, no parallax, no entrance motion).
 */
@Component({
  standalone: true,
  selector: 'leos-website-horizon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-variant]': 'variant' },
  template: `
    <div class="ridge ridge--1" data-lag="0.62" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none">
        <defs>
          <linearGradient [attr.id]="uid + '-r1'" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--ridge-1)" stop-opacity=".42" />
            <stop offset="1" stop-color="var(--ridge-1)" stop-opacity=".16" />
          </linearGradient>
        </defs>
        <path
          [attr.fill]="'url(#' + uid + '-r1)'"
          d="M0 486
        C 140 440, 260 424, 400 452
        C 540 480, 660 496, 800 468
        C 940 440, 1060 414, 1200 442
        C 1340 470, 1460 488, 1600 462
        L1600 900 L0 900 Z"
        />
      </svg>
    </div>
    <div class="ridge ridge--2" data-lag="0.44" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none">
        <defs>
          <linearGradient [attr.id]="uid + '-r2'" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--ridge-2)" stop-opacity=".92" />
            <stop offset="1" stop-color="var(--ridge-2)" stop-opacity=".64" />
          </linearGradient>
        </defs>
        <path
          [attr.fill]="'url(#' + uid + '-r2)'"
          d="M0 588
        C 150 528, 270 512, 400 548
        C 530 584, 670 606, 800 566
        C 930 526, 1070 498, 1200 534
        C 1330 570, 1470 592, 1600 556
        L1600 900 L0 900 Z"
        />
      </svg>
    </div>
    <div class="ridge ridge--3" data-lag="0.28" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path
          fill="var(--ridge-3)"
          d="M0 676
        C 160 616, 290 596, 420 638
        C 550 680, 680 704, 810 660
        C 940 616, 1080 588, 1210 630
        C 1340 672, 1470 694, 1600 656
        L1600 900 L0 900 Z"
        />
      </svg>
    </div>

    <div class="horizon-copy">
      <ng-content select="[horizonCopy]" />
    </div>
    <div class="horizon-screen" data-lag="0.18">
      <ng-content select="[horizonScreen]" />
    </div>

    <div class="ridge ridge--4" data-lag="0.13" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path
          fill="var(--ridge-4)"
          d="M0 764
        C 150 722, 280 706, 410 740
        C 540 774, 680 792, 810 758
        C 940 724, 1080 704, 1210 736
        C 1340 768, 1470 784, 1600 754
        L1600 900 L0 900 Z"
        />
      </svg>
    </div>
  `,
  styles: [
    `
      :host {
        --page: #00070d;
        --sky-crown: #11151a;
        --sky-mid: #333b42;
        --sky-warm: #c2a184;
        --ridge-1: #5b6068;
        --ridge-2: #2b3036;
        --ridge-3: #14171b;
        --ridge-4: #05070a;
        --enter: cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        isolation: isolate;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: max(100dvh, 52rem);
        padding: 3.5rem 1.25rem 0;
        background: radial-gradient(190% 82% at 50% 0%, var(--sky-crown) 0%, var(--sky-mid) 44%, var(--sky-warm) 100%);
      }
      :host::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 26vh;
        z-index: 20;
        pointer-events: none;
        background: linear-gradient(rgba(0, 0, 0, 0), var(--page) 82%);
      }
      .ridge {
        position: absolute;
        left: -4%;
        right: -4%;
        bottom: 0;
        pointer-events: none;
      }
      .ridge svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
      .ridge--1 {
        height: 74vh;
        z-index: 11;
      }
      .ridge--2 {
        height: 66vh;
        z-index: 12;
      }
      .ridge--3 {
        height: 58vh;
        z-index: 13;
      }
      .ridge--4 {
        height: 50vh;
        z-index: 15;
      }
      .horizon-copy {
        position: relative;
        z-index: 30;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .horizon-screen {
        position: relative;
        z-index: 14;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-self: stretch;
        width: 100%;
      }
      @keyframes hz-fadein {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      :host([data-variant='hero']) {
        pointer-events: none;
      }
      :host([data-variant='hero']) .horizon-copy,
      :host([data-variant='hero']) .horizon-screen {
        pointer-events: auto;
      }
      :host([data-variant='hero']) .ridge--1 svg {
        filter: blur(1.5px);
      }
      :host([data-variant='hero']) .ridge--2 svg {
        filter: blur(0.6px);
      }
      :host([data-variant='canvas']) {
        position: fixed;
        inset: 0;
        z-index: 0;
        min-height: 100dvh;
        height: 100dvh;
        padding: 0;
        pointer-events: none;
        contain: layout paint;
      }
      :host([data-variant='canvas']) .horizon-copy,
      :host([data-variant='canvas']) .horizon-screen {
        display: none;
      }
      @media (max-width: 720px) {
        :host {
          min-height: 100dvh;
        }
      }
      @media (prefers-reduced-motion: no-preference) {
        :host([data-variant='hero']) .ridge {
          animation: hz-fadein 900ms var(--enter) both;
        }
        :host([data-variant='hero']) .ridge--1 {
          animation-delay: 40ms;
        }
        :host([data-variant='hero']) .ridge--2 {
          animation-delay: 90ms;
        }
        :host([data-variant='hero']) .ridge--3 {
          animation-delay: 140ms;
        }
        :host([data-variant='hero']) .ridge--4 {
          animation-delay: 190ms;
        }
      }
    `,
  ],
})
export class WebsiteHorizonComponent implements AfterViewInit, OnDestroy {
  @Input() variant: 'hero' | 'canvas' = 'hero';
  readonly uid = `hz${++horizonUid}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private ridges: Array<{ el: HTMLElement; lag: number }> = [];
  private copy?: HTMLElement;
  private unlisten: Array<() => void> = [];
  private queued = false;
  private raf = 0;

  ngAfterViewInit() {
    if (this.variant !== 'hero') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduce) return;

    const root = this.host.nativeElement;
    this.copy = root.querySelector('.horizon-copy') ?? undefined;
    const lagged = root.querySelectorAll('[data-lag]');
    this.ridges = [];
    for (let i = 0; i < lagged.length; i++) {
      const el = lagged.item(i) as HTMLElement;
      this.ridges.push({ el, lag: Number(el.dataset['lag'] || 0) });
    }

    this.zone.runOutsideAngular(() => {
      const onScroll = () => {
        if (this.queued) return;
        this.queued = true;
        this.raf = requestAnimationFrame(() => this.paint());
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      this.unlisten.push(() => window.removeEventListener('scroll', onScroll));
      this.unlisten.push(() => window.removeEventListener('resize', onScroll));
      this.paint();
    });
  }

  ngOnDestroy() {
    for (const off of this.unlisten) off();
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  private paint() {
    this.queued = false;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const vh = window.innerHeight || 800;
    const travel = Math.min(y, this.host.nativeElement.offsetHeight);

    for (const r of this.ridges) {
      r.el.style.transform = `translate3d(0, ${(travel * r.lag).toFixed(1)}px, 0)`;
    }

    if (this.copy) {
      this.copy.style.transform = `translate3d(0, ${(travel * 0.07).toFixed(1)}px, 0)`;
      this.copy.style.opacity = Math.max(0, 1 - Math.pow(y / (vh * 0.92), 2.1)).toFixed(3);
    }
  }
}
