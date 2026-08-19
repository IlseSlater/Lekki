import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LeosApiService } from '../services/leos-api.service';
import { StudioContextService } from '../services/studio-context.service';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';

type StaffPick = {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organisationId: string;
  homePath: string;
};

/**
 * Staff Experience entry — PIN → assigned Experience.
 * Shared device: logout → next PIN → different Experience.
 */
@Component({
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="staff-entry studio-motion-appear">
      <header class="staff-entry__header">
        <p class="staff-entry__eyebrow">Staff</p>
        <h1 class="staff-entry__venue">{{ venue }}</h1>
        <p class="staff-entry__calm">
          @if (current) {
            Welcome back, {{ current.displayName }}.
          } @else if (selected) {
            Enter your PIN
          } @else {
            Who’s working this device?
          }
        </p>
      </header>

      @if (error) {
        <p class="staff-entry__alert" role="alert">{{ error }}</p>
      }

      @if (current && !selected) {
        <div class="staff-entry__doors">
          <a class="leos-btn leos-btn--primary" [routerLink]="current.homePath">Open my view</a>
          <button type="button" class="leos-btn" (click)="signOut()">Switch person</button>
        </div>
      }

      @if (!selected && (!current || picking)) {
        <section class="staff-entry__list" aria-label="Staff accounts">
          @for (s of staff; track s.id) {
            <button type="button" class="staff-entry__card" (click)="select(s)">
              <span class="staff-entry__name">{{ s.displayName }}</span>
              <span class="staff-entry__role">{{ roleBlurb(s.role) }}</span>
            </button>
          } @empty {
            <p class="staff-entry__calm">
              @if (loading) {
                Loading…
              } @else {
                No staff yet — create them in Studio → Team.
              }
            </p>
          }
        </section>
      }

      @if (selected) {
        <section class="staff-entry__pin" aria-label="Enter PIN">
          <p class="staff-entry__name">{{ selected.displayName }}</p>
          <label class="staff-entry__label" for="staff-pin">PIN</label>
          <input
            id="staff-pin"
            class="staff-entry__input"
            type="password"
            inputmode="numeric"
            autocomplete="current-password"
            maxlength="6"
            [(ngModel)]="pin"
            (keydown.enter)="login()"
            placeholder="••••"
          />
          <div class="staff-entry__doors">
            <button
              type="button"
              class="leos-btn leos-btn--primary"
              [disabled]="busy || pin.length < 4"
              (click)="login()"
            >
              {{ busy ? 'Signing in…' : 'Continue' }}
            </button>
            <button type="button" class="leos-btn" [disabled]="busy" (click)="back()">Back</button>
          </div>
        </section>
      }

      <p class="staff-entry__foot">
        Enter PIN — device stays, experience changes.
      </p>
    </div>
  `,
  styles: [
    `
      .staff-entry {
        padding: 1.5rem 0 2rem;
      }
      .staff-entry__eyebrow {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 650;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b7280;
      }
      .staff-entry__venue {
        margin: 0.35rem 0 0;
        font-size: 1.75rem;
        font-weight: 650;
        letter-spacing: -0.03em;
      }
      .staff-entry__calm,
      .staff-entry__alert {
        margin: 0.5rem 0 0;
        color: #5c6573;
        line-height: 1.45;
      }
      .staff-entry__alert {
        color: #b42318;
      }
      .staff-entry__list {
        display: grid;
        gap: 0.65rem;
        margin-top: 1.5rem;
      }
      .staff-entry__card {
        display: grid;
        gap: 0.15rem;
        width: 100%;
        text-align: left;
        padding: 1rem 1.1rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(27, 34, 48, 0.1);
        background: #fff;
        font: inherit;
        cursor: pointer;
      }
      .staff-entry__card:hover {
        border-color: rgba(215, 161, 74, 0.55);
      }
      .staff-entry__name {
        font-weight: 650;
      }
      .staff-entry__role {
        font-size: 0.8125rem;
        color: #6b7280;
      }
      .staff-entry__pin {
        display: grid;
        gap: 0.65rem;
        max-width: 18rem;
        margin-top: 1.25rem;
      }
      .staff-entry__label {
        font-size: 0.75rem;
        font-weight: 650;
        color: #6b7280;
      }
      .staff-entry__input {
        min-height: 3rem;
        padding: 0 0.9rem;
        border-radius: 0.75rem;
        border: 1px solid #e7e2db;
        font: inherit;
        font-size: 1.25rem;
        letter-spacing: 0.35em;
      }
      .staff-entry__doors {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        margin-top: 1rem;
      }
      .staff-entry__foot {
        margin: 2rem 0 0;
        font-size: 0.8125rem;
      }
      .staff-entry__foot a {
        color: #6b7280;
      }
    `,
  ],
})
export class StaffEntryPageComponent implements OnInit {
  private readonly api = inject(LeosApiService);
  private readonly ctx = inject(StudioContextService);
  private readonly staffSession = inject(OperateStaffSessionService);
  private readonly router = inject(Router);

  venue = 'Your experience';
  staff: StaffPick[] = [];
  selected: StaffPick | null = null;
  pin = '';
  error = '';
  busy = false;
  loading = true;
  picking = false;
  current = this.staffSession.read();

  ngOnInit() {
    this.venue = this.ctx.displayVenue();
    this.api.listOperateStaff().subscribe({
      next: (rows) => {
        this.staff = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Couldn’t load staff — is the API running?';
      },
    });
  }

  roleBlurb(role: string): string {
    if (role === 'kitchen') return 'Kitchen';
    if (role === 'bar') return 'Bar';
    if (role === 'waiter') return 'Waiter';
    if (role === 'counter') return 'Counter';
    return 'Floor lead';
  }

  select(s: StaffPick) {
    this.selected = s;
    this.picking = true;
    this.pin = '';
    this.error = '';
  }

  back() {
    this.selected = null;
    this.pin = '';
    this.error = '';
    this.picking = !!this.current;
  }

  login() {
    if (!this.selected || this.pin.length < 4) return;
    this.busy = true;
    this.error = '';
    this.api
      .staffLogin({
        email: this.selected.email,
        password: this.pin,
        deviceLabel: localStorage.getItem('leos.staff.deviceLabel') || undefined,
      })
      .subscribe({
      next: (res) => {
        this.busy = false;
        const session = this.staffSession.set({
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
        this.current = session;
        this.selected = null;
        this.picking = false;
        const next = new URLSearchParams(window.location.search).get('next');
        void this.router.navigateByUrl(next || session.homePath);
      },
      error: () => {
        this.busy = false;
        this.error = 'Invalid PIN — try again.';
        this.pin = '';
      },
    });
  }

  signOut() {
    const cur = this.staffSession.read();
    if (cur?.token) {
      this.api.staffLogout({ sessionId: cur.sessionId, token: cur.token }).subscribe({
        error: () => undefined,
      });
    }
    this.staffSession.clear();
    this.current = null;
    this.selected = null;
    this.picking = false;
    this.pin = '';
  }
}
