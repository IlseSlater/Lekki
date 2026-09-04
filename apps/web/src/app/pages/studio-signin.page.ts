import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LeosApiService } from '../services/leos-api.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService } from '../services/studio-context.service';

type GoogleGsi = {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (res: { access_token?: string; error?: string }) => void;
      }) => { requestAccessToken: () => void };
    };
  };
};

/**
 * Lekki website → LEOS Studio sign-in.
 * Staff token auth — owner signs in with email + PIN.
 */
@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  selector: 'leos-studio-signin',
  template: `
    <div class="si">
      <a class="si-back" routerLink="/">← Lekki</a>

      <section class="si-card">
        <div class="si-mark">
          <img src="/brand/lekki-mark.svg" width="28" height="28" alt="" />
        </div>
        <p class="si-wordmark">Lekki.</p>
        <h1 class="si-title">Sign into Studio</h1>
        <p class="si-lead">Use your operator email and PIN, or continue with Google or Apple.</p>

        <label class="si-field">
          <span class="visually-hidden">Work email</span>
          <input
            type="email"
            name="email"
            autocomplete="email"
            [(ngModel)]="email"
            placeholder="Work email"
            (keydown.enter)="signIn()"
          />
        </label>

        <label class="si-field">
          <span class="visually-hidden">PIN</span>
          <input
            type="password"
            name="pin"
            autocomplete="current-password"
            [(ngModel)]="pin"
            placeholder="PIN"
            (keydown.enter)="signIn()"
          />
        </label>

        @if (error) {
          <p class="si-error" role="alert">{{ error }}</p>
        }

        <hr class="si-rule" />

        <button type="button" class="si-btn" [disabled]="busy || !canSubmit" (click)="signIn()">
          @if (busy) {
            Signing in…
          } @else {
            Continue to Studio
          }
        </button>

        <p class="si-or"><span>or</span></p>

        <button type="button" class="si-social" [disabled]="busy" (click)="signInSocial('google')">
          <svg class="si-social__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
        <button type="button" class="si-social" [disabled]="busy" (click)="signInSocial('apple')">
          <svg class="si-social__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#fff"
              d="M16.7 12.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.9-3.5 2.2-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.6 2.2 2.7 2.1 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1 2.6-2 .8-1.2 1.1-2.3 1.1-2.4-.1 0-2.2-.8-2.2-3.5zM14.4 6.3c.6-.7 1-1.7.9-2.7-0.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.7-.9 2.6 1 .1 1.9-.5 2.5-1.2z"
            />
          </svg>
          Continue with Apple
        </button>

        <p class="si-legal">
          By continuing you agree to Lekki
          <a routerLink="/terms">Terms</a> and <a routerLink="/privacy">Privacy</a>.
          Guests joining via QR never see this screen.
        </p>
      </section>
    </div>
  `,
  styles: [
    `
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
      }
      .si {
        position: relative;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4.5rem 1.25rem 2.5rem;
        background: transparent;
        color: #fff;
        font-family: Inter, system-ui, sans-serif;
      }
      .si-back {
        position: absolute;
        top: 1.25rem;
        left: 1.25rem;
        z-index: 2;
        color: rgba(255, 255, 255, 0.62);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 550;
      }
      .si-back:hover {
        color: #fff;
      }
      .si-card {
        position: relative;
        z-index: 1;
        width: min(100%, 24rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.85rem;
        padding: 2rem 1.75rem 1.6rem;
        border-radius: 1.75rem;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(18, 18, 18, 0.82));
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      }
      .si-mark {
        display: grid;
        place-items: center;
        width: 3rem;
        height: 3rem;
        margin-bottom: 0.15rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }
      .si-mark img {
        display: block;
        border-radius: 8px;
      }
      .si-wordmark {
        margin: 0;
        font-size: 1.45rem;
        font-weight: 650;
        letter-spacing: -0.04em;
      }
      .si-title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 600;
        text-align: center;
        letter-spacing: -0.03em;
      }
      .si-lead {
        margin: 0 0 0.4rem;
        color: rgba(255, 255, 255, 0.58);
        line-height: 1.45;
        font-size: 0.875rem;
        text-align: center;
      }
      .si-field {
        display: block;
        width: 100%;
      }
      .si-field input {
        width: 100%;
        box-sizing: border-box;
        min-height: 3rem;
        border: 0;
        border-radius: 0.85rem;
        padding: 0.85rem 1.15rem;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font: inherit;
        font-size: 0.9rem;
      }
      .si-field input::placeholder {
        color: rgba(209, 213, 219, 0.9);
      }
      .si-field input:focus {
        outline: 2px solid rgba(156, 163, 175, 0.85);
        outline-offset: 1px;
      }
      .si-rule {
        width: 100%;
        margin: 0.15rem 0 0.1rem;
        border: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      .si-btn {
        width: 100%;
        min-height: 3rem;
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 550;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }
      .si-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }
      .si-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .si-or {
        width: 100%;
        margin: 0.15rem 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: rgba(255, 255, 255, 0.38);
        font-size: 0.75rem;
      }
      .si-or::before,
      .si-or::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }
      .si-social {
        width: 100%;
        min-height: 3rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(180deg, #232526, #2d2e30);
        color: #fff;
        font: inherit;
        font-size: 0.9rem;
        font-weight: 550;
        cursor: pointer;
      }
      .si-social:hover:not(:disabled) {
        filter: brightness(1.12);
      }
      .si-social:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .si-social__icon {
        width: 1.15rem;
        height: 1.15rem;
        flex-shrink: 0;
      }
      .si-error {
        width: 100%;
        margin: 0;
        color: #f87171;
        font-size: 0.8125rem;
        text-align: left;
      }
      .si-legal {
        margin: 0.15rem 0 0;
        font-size: 0.72rem;
        line-height: 1.45;
        color: rgba(156, 163, 175, 0.95);
        text-align: center;
      }
      .si-legal a {
        color: #d7a14a;
      }
    `,
  ],
})
export class StudioSignInPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(LeosApiService);
  private readonly staffSession = inject(OperateStaffSessionService);
  private readonly auth = inject(StudioAuthService);
  private readonly studio = inject(StudioContextService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = 'staff@rustyoak.demo';
  pin = '';
  busy = false;
  error = '';
  private googleClientId = '';
  private googleTokenClient?: { requestAccessToken: () => void };

  get canSubmit() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) && this.pin.trim().length >= 4;
  }

  ngOnInit() {
    this.api.googleOauthConfig().subscribe({
      next: (cfg) => {
        this.googleClientId = cfg.clientId || '';
      },
    });
  }

  ngOnDestroy() {
    this.googleTokenClient = undefined;
  }

  signIn() {
    if (!this.canSubmit) {
      this.error = 'Enter your email and PIN (4+ characters).';
      return;
    }
    this.busy = true;
    this.error = '';
    this.api.staffLogin({ email: this.email.trim(), password: this.pin.trim(), deviceLabel: 'Studio' }).subscribe({
      next: (res) => {
        this.staffSession.set({
          id: res.id,
          displayName: res.displayName,
          email: res.email,
          role: res.role,
          organisationId: res.organisationId,
          permissions: res.permissions,
          homePath: res.homePath,
          token: res.token,
          sessionId: res.sessionId,
        });
        this.auth.signIn({ email: res.email, name: res.displayName, provider: 'email' });
        this.busy = false;
        void this.enterStudio();
      },
      error: () => {
        this.busy = false;
        this.error = 'Invalid email or PIN — try again.';
      },
    });
  }

  signInSocial(provider: 'google' | 'apple') {
    if (provider === 'apple') {
      this.error = 'Apple sign-in isn’t connected on this workspace yet. Use Google, or email and PIN.';
      return;
    }
    if (!this.googleClientId) {
      this.error =
        'Google sign-in isn’t set up yet. Add LEOS_GOOGLE_CLIENT_ID to .env (Web client, origin http://localhost:4200) and restart the runtime.';
      return;
    }
    if (!this.googleTokenClient) {
      this.loadGoogle();
      this.error = 'Google is still loading — tap Continue with Google again in a moment.';
      return;
    }
    this.error = '';
    this.busy = true;
    this.googleTokenClient.requestAccessToken();
  }

  private loadGoogle() {
    const existing = document.getElementById('leos-google-gsi');
    if (existing) {
      this.initGoogleClient();
      return;
    }
    const script = document.createElement('script');
    script.id = 'leos-google-gsi';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initGoogleClient();
    script.onerror = () => {
      this.error = 'Couldn’t load Google sign-in. Check your connection and try again.';
    };
    document.head.appendChild(script);
  }

  private initGoogleClient() {
    const google = (window as unknown as { google?: GoogleGsi }).google;
    if (!google?.accounts?.oauth2 || !this.googleClientId) return;
    this.googleTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.googleClientId,
      scope: 'openid email profile',
      callback: (res) => {
        if (res.error || !res.access_token) {
          this.busy = false;
          this.error = 'Google sign-in was cancelled.';
          return;
        }
        this.finishGoogle(res.access_token);
      },
    });
  }

  private finishGoogle(accessToken: string) {
    this.api.googleStaffLogin({ accessToken, deviceLabel: 'Studio · Google' }).subscribe({
      next: (res) => {
        this.staffSession.set({
          id: res.id,
          displayName: res.displayName,
          email: res.email,
          role: res.role,
          organisationId: res.organisationId,
          permissions: res.permissions,
          homePath: res.homePath,
          token: res.token,
          sessionId: res.sessionId,
        });
        this.auth.signIn({ email: res.email, name: res.displayName, provider: 'google' });
        this.busy = false;
        void this.enterStudio();
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.busy = false;
        const raw = err?.error?.message;
        this.error = Array.isArray(raw) ? raw[0] : raw || 'Google sign-in failed.';
      },
    });
  }

  private enterStudio() {
    const next = this.route.snapshot.queryParamMap.get('next');
    const safeNext = next?.startsWith('/studio') ? next : null;
    const target = safeNext ?? (this.studio.hasExperiences() ? '/studio' : '/studio/welcome');
    const here = this.router.url.split('?')[0];
    if (here === target.split('?')[0]) return;
    void this.router.navigateByUrl(target);
  }
}
