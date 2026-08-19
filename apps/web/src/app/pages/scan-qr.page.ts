import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/** Scan QR — join an experience from a venue QR. */
@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'leos-scan-qr-page',
  template: `
    <div class="scan">
      <header class="scan__header">
        <button type="button" class="scan__back" aria-label="Back" (click)="back()">←</button>
        <h1 class="scan__title">Scan QR code</h1>
      </header>

      <div class="scan__stage">
        <div class="scan__viewport" [class.scan__viewport--live]="cameraOn">
          <video #video class="scan__video" playsinline muted autoplay></video>
          <div class="scan__frame" aria-hidden="true"></div>
          @if (!cameraOn && !cameraError) {
            <p class="scan__hint">Starting camera…</p>
          }
          @if (cameraError) {
            <p class="scan__hint">{{ cameraError }}</p>
          }
        </div>
        <p class="scan__lead">Point your camera at the QR on your table or place.</p>
      </div>

      @if (error) {
        <p class="scan__error" role="alert">{{ error }}</p>
      }

      <div class="scan__manual">
        <label class="scan__label" for="scan-token">Or paste a link / token</label>
        <input
          id="scan-token"
          class="scan__input"
          [(ngModel)]="manual"
          placeholder="entry?token=… or qr-demo-restaurant"
          (keydown.enter)="submitManual()"
        />
        <button type="button" class="scan__btn" [disabled]="!manual.trim()" (click)="submitManual()">
          Continue
        </button>
      </div>

      @if (showDemos) {
        <div class="scan__demos" aria-label="Demo tokens">
          <p class="scan__label">Try a demo</p>
          <div class="scan__demo-row">
            @for (d of demos; track d.token) {
              <button type="button" class="scan__chip" (click)="joinToken(d.token)">{{ d.label }}</button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .scan {
        --scan-bg: var(--leos-warm-sand, #faf7f2);
        --scan-ink: var(--leos-ink, #1b2230);
        --scan-muted: var(--leos-ink-secondary, #6b7280);
        --scan-brand: var(--leos-gold, #d7a14a);
        --scan-line: var(--leos-warm-sand-dark, #e7e2db);
        --scan-surface: #fff;
        min-height: 100dvh;
        background:
          radial-gradient(120% 80% at 50% -10%, rgba(215, 161, 74, 0.14), transparent 55%),
          var(--scan-bg);
        color: var(--scan-ink);
        font-family: var(--leos-font-sans, 'Sora', system-ui, sans-serif);
        padding: 1.25rem 1.25rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .scan__header {
        display: grid;
        grid-template-columns: 2.75rem 1fr 2.75rem;
        align-items: center;
      }
      .scan__back {
        width: 2.75rem;
        height: 2.75rem;
        border: 0;
        border-radius: 999px;
        background: var(--scan-surface);
        border: 1px solid var(--scan-line);
        color: var(--scan-ink);
        font-size: 1.15rem;
        cursor: pointer;
      }
      .scan__title {
        margin: 0;
        text-align: center;
        font-family: var(--leos-font-display, Fraunces, Georgia, serif);
        font-size: 1.35rem;
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .scan__stage {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .scan__viewport {
        position: relative;
        aspect-ratio: 1;
        max-height: min(68vw, 22rem);
        margin: 0 auto;
        width: min(100%, 22rem);
        border-radius: 1.5rem;
        overflow: hidden;
        background: var(--leos-surface-secondary, #f4efe8);
        border: 1px solid var(--scan-line);
        display: grid;
        place-items: center;
      }
      .scan__viewport--live .scan__video {
        opacity: 1;
      }
      .scan__video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 200ms ease;
      }
      .scan__frame {
        position: absolute;
        inset: 18%;
        border: 2px solid rgba(215, 161, 74, 0.9);
        border-radius: 1rem;
        box-shadow: 0 0 0 999px rgba(250, 247, 242, 0.45);
        pointer-events: none;
      }
      .scan__hint {
        position: relative;
        z-index: 1;
        margin: 0;
        padding: 1rem;
        text-align: center;
        color: var(--scan-muted);
        font-size: 0.9375rem;
      }
      .scan__lead {
        margin: 0;
        text-align: center;
        color: var(--scan-muted);
        font-size: 0.9375rem;
      }
      .scan__error {
        margin: 0;
        color: var(--leos-danger, #c65b52);
        text-align: center;
        font-size: 0.875rem;
      }
      .scan__manual {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .scan__label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--scan-muted);
      }
      .scan__input {
        width: 100%;
        min-height: 3rem;
        border: 1px solid var(--scan-line);
        border-radius: 12px;
        background: var(--scan-surface);
        color: var(--scan-ink);
        padding: 0.75rem 1rem;
        font: inherit;
      }
      .scan__input:focus {
        outline: none;
        border-color: var(--scan-brand);
        box-shadow: 0 0 0 3px rgba(215, 161, 74, 0.2);
      }
      .scan__btn {
        min-height: 3rem;
        border: 0;
        border-radius: 999px;
        background: var(--scan-brand);
        color: #fff;
        font: inherit;
        font-weight: 650;
        cursor: pointer;
      }
      .scan__btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .scan__demo-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .scan__chip {
        border: 1px solid var(--scan-line);
        border-radius: 999px;
        background: var(--scan-surface);
        color: var(--scan-ink);
        padding: 0.45rem 0.85rem;
        font: inherit;
        font-size: 0.875rem;
        cursor: pointer;
      }
      .scan__chip:hover {
        border-color: var(--scan-brand);
        background: rgba(215, 161, 74, 0.1);
      }
    `,
  ],
})
export class ScanQrPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly onboarding = inject(OnboardingService);

  manual = '';
  error = '';
  cameraOn = false;
  cameraError = '';
  /** IA: demo gallery only with ?demo=1 */
  showDemos = false;
  readonly demos = [
    { token: 'qr-demo-restaurant', label: 'Restaurant' },
    { token: 'qr-demo-cafe', label: 'Café' },
    { token: 'qr-demo-hotel', label: 'Hotel' },
  ];

  private stream?: MediaStream;
  private raf = 0;
  private detector?: BarcodeDetectorLike;
  private joining = false;

  ngAfterViewInit() {
    this.showDemos = this.route.snapshot.queryParamMap.get('demo') === '1';
    void this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  back() {
    void this.router.navigate(['/']);
  }

  submitManual() {
    const token = this.extractToken(this.manual.trim());
    if (!token) {
      this.error = 'That doesn’t look like a LEOS QR link or token.';
      return;
    }
    this.joinToken(token);
  }

  joinToken(token: string) {
    if (this.joining) return;
    this.joining = true;
    this.error = '';
    this.onboarding.save({ entryToken: token });
    this.stopCamera();
    void this.router.navigate(['/splash'], { queryParams: { token } });
  }

  private async startCamera() {
    this.cameraError = '';
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.cameraError = 'Camera isn’t available here — paste a link or pick a demo below.';
        return;
      }
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      const video = this.videoRef?.nativeElement;
      if (!video) return;
      video.srcObject = this.stream;
      await video.play();
      this.cameraOn = true;

      if (window.BarcodeDetector) {
        this.detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        this.scanLoop();
      } else {
        this.cameraError = 'Live decode isn’t supported in this browser — paste a link or use a demo.';
      }
    } catch {
      this.cameraError = 'Allow camera access to scan, or paste a link below.';
      this.cameraOn = false;
    }
  }

  private scanLoop() {
    const tick = async () => {
      if (!this.detector || !this.cameraOn || this.joining) return;
      const video = this.videoRef?.nativeElement;
      if (video && video.readyState >= 2) {
        try {
          const codes = await this.detector.detect(video);
          const raw = codes[0]?.rawValue?.trim();
          if (raw) {
            const token = this.extractToken(raw);
            if (token) {
              this.joinToken(token);
              return;
            }
          }
        } catch {
          /* keep scanning */
        }
      }
      this.raf = requestAnimationFrame(() => void tick());
    };
    this.raf = requestAnimationFrame(() => void tick());
  }

  private stopCamera() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
    this.cameraOn = false;
  }

  private extractToken(raw: string): string | null {
    if (!raw) return null;
    try {
      if (raw.includes('://') || raw.startsWith('/')) {
        const url = new URL(raw, window.location.origin);
        const q = url.searchParams.get('token');
        if (q) return q.trim();
        const path = url.pathname.match(/\/e\/([^/]+)/);
        if (path?.[1]) return decodeURIComponent(path[1]);
      }
    } catch {
      /* not a URL */
    }
    if (/^qr-[\w-]+$/i.test(raw) || /^[a-z0-9-]{6,}$/i.test(raw)) return raw;
    return null;
  }
}
