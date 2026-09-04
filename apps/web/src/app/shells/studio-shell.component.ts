import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService, type StudioMode } from '../services/studio-context.service';

const NAV_COLLAPSED_KEY = 'leos-studio-nav-collapsed';

/**
 * LEOS Studio Shell — permanent frame.
 * Collapsible icon mode rail · Setup progress lives in-page · Surgical White canvas.
 */
@Component({
  standalone: true,
  selector: 'leos-studio-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div
      class="leos-studio-shell"
      [attr.data-mode]="mode"
      [attr.data-setup-engine]="setupEngine ? 'true' : null"
      [attr.data-pre-engine]="preEngine ? 'true' : null"
      [attr.data-nav-collapsed]="navCollapsed ? 'true' : null"
    >
      <aside class="leos-studio-shell__nav" aria-label="Studio">
        <div class="leos-studio-shell__nav-head">
          <a class="leos-studio-shell__brand" routerLink="/studio" aria-label="LEKKI Studio">
            <img class="leos-studio-shell__logo" src="/brand/lekki-mark.svg" alt="" width="28" height="28" />
            <span class="leos-studio-shell__mark">LEKKI</span>
          </a>
          <button
            type="button"
            class="leos-studio-shell__nav-toggle"
            (click)="toggleNav()"
            [attr.aria-expanded]="!navCollapsed"
            [attr.aria-label]="navCollapsed ? 'Expand navigation' : 'Collapse navigation'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              @if (navCollapsed) {
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d="M14 10l3 2-3 2" />
              } @else {
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
                <path d="M15 10l-3 2 3 2" />
              }
            </svg>
          </button>
        </div>

        <nav class="leos-studio-shell__modes" aria-label="Studio mode">
          <a
            routerLink="/studio"
            [class.active]="mode === 'setup'"
            (click)="setMode('setup')"
            title="Setup"
          >
            <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
              <path d="M18 14l.9 2.6L21.5 17.5l-2.6.9L18 21l-.9-2.6L14.5 17.5l2.6-.9L18 14z" />
            </svg>
            <span class="leos-studio-shell__mode-label">Setup</span>
          </a>
          <a
            routerLink="/studio/operate"
            [class.active]="mode === 'operate'"
            (click)="setMode('operate')"
            title="Operate"
          >
            <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span class="leos-studio-shell__mode-label">Operate</span>
          </a>
          <a
            routerLink="/studio/grow"
            [class.active]="mode === 'grow'"
            (click)="setMode('grow')"
            title="Grow"
          >
            <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 17l6-6 4 4 7-7" />
              <path d="M14 8h6v6" />
            </svg>
            <span class="leos-studio-shell__mode-label">Grow</span>
          </a>
          <a
            class="leos-studio-shell__mode--quiet"
            routerLink="/studio/team"
            [class.active]="mode === 'team'"
            (click)="setMode('team')"
            title="Team"
          >
            <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span class="leos-studio-shell__mode-label">Team</span>
          </a>
        </nav>

        <div class="leos-studio-shell__nav-foot">
          @if (setupEngine) {
            <p class="leos-studio-shell__live-pill" title="Live Experience is always on">
              <span class="leos-studio-shell__live-dot" aria-hidden="true"></span>
              <span class="leos-studio-shell__live-label">Live Experience</span>
            </p>
          } @else if (venue) {
            <p class="leos-studio-shell__venue-chip" [attr.title]="venue + (live ? ' · Live' : ' · Setup')">
              <span class="leos-studio-shell__venue-name">{{ venue }}</span>
              <span class="leos-studio-shell__venue-state">{{ live ? 'Live' : 'Setup' }}</span>
            </p>
          }
          <button type="button" class="leos-studio-shell__signout" (click)="signOut()" title="Sign out">
            <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span class="leos-studio-shell__mode-label">Sign out</span>
          </button>
        </div>
      </aside>

      <main class="leos-studio-shell__main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class StudioShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);
  private readonly staffSession = inject(OperateStaffSessionService);

  mode: StudioMode = 'setup';
  setupEngine = false;
  preEngine = false;
  venue = '';
  live = false;
  navCollapsed = false;

  ngOnInit() {
    try {
      this.navCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === '1';
    } catch {
      this.navCollapsed = false;
    }
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  toggleNav() {
    this.navCollapsed = !this.navCollapsed;
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, this.navCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  setMode(m: StudioMode) {
    this.mode = m;
    this.ctx.mode.set(m);
  }

  signOut() {
    this.auth.signOut();
    this.staffSession.clear();
    void this.router.navigate(['/']);
  }

  private refresh() {
    const url = this.router.url;
    this.mode = this.ctx.modeFromUrl(url);
    this.ctx.mode.set(this.mode);
    this.setupEngine = url.includes('/studio/setup/') || url.includes('/studio/create');
    this.preEngine = url.includes('/studio/welcome');
    this.venue = this.ctx.displayVenue();
    this.live = this.ctx.readConfig().live;
  }
}
