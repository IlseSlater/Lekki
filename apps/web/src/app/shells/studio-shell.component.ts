import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService, type StudioMode } from '../services/studio-context.service';

const NAV_COLLAPSED_KEY = 'leos-studio-nav-collapsed';

type NavItem = {
  label: string;
  path: string;
  /** Paths that light this item. Exact for Home; otherwise the path and anything under it. */
  matches: string[];
  exact?: boolean;
  mode: StudioMode;
  /** One SVG path string (stroke icon, 24 grid). */
  icon: string;
};

/**
 * The Studio nav — modelled on the Uber Eats Manager rail: one flat list, two groups.
 * Every item points at a page that already exists.
 */
export const STUDIO_NAV_MAIN: NavItem[] = [
  {
    label: 'Home',
    path: '/studio',
    matches: ['/studio'],
    exact: true,
    mode: 'setup',
    icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  },
  {
    label: 'Your place',
    path: '/studio/setup/identity',
    matches: ['/studio/setup/identity', '/studio/setup/experience', '/studio/setup/places'],
    mode: 'setup',
    icon: 'M3 9l2-5h14l2 5M3 9h18M3 9v11h18V9M9 20v-6h6v6',
  },
  {
    label: 'Menu',
    path: '/studio/menu',
    matches: ['/studio/menu'],
    mode: 'setup',
    icon: 'M5 6h14M5 12h14M5 18h9',
  },
  {
    label: 'Operate',
    path: '/studio/operate',
    matches: ['/studio/operate'],
    mode: 'operate',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  },
  {
    label: 'Grow',
    path: '/studio/grow',
    matches: ['/studio/grow'],
    mode: 'grow',
    icon: 'M3 17l6-6 4 4 7-7M14 8h6v6',
  },
];

export const STUDIO_NAV_TOOLS: NavItem[] = [
  {
    label: 'Payments',
    path: '/studio/setup/payments',
    matches: ['/studio/setup/payments', '/studio/setup/payments/connect'],
    mode: 'setup',
    icon: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
  },
  {
    label: 'Guest QR',
    path: '/studio/setup/golive',
    matches: ['/studio/setup/golive'],
    mode: 'setup',
    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  },
  {
    label: 'Integrations',
    path: '/studio/integrations',
    matches: ['/studio/integrations'],
    mode: 'setup',
    icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  },
  {
    label: 'Team',
    path: '/studio/team',
    matches: ['/studio/team'],
    mode: 'team',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  },
];

/**
 * LEOS Studio Shell — permanent frame.
 * Left rail (Uber-style flat nav) · white top bar · calm canvas.
 */
@Component({
  standalone: true,
  selector: 'leos-studio-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div
      class="leos-studio-shell leos-register--ash"
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
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              @if (navCollapsed) {
                <path d="M14 10l3 2-3 2" />
              } @else {
                <path d="M15 10l-3 2 3 2" />
              }
            </svg>
          </button>
        </div>

        <nav class="leos-studio-shell__modes" aria-label="Studio sections">
          @for (item of mainNav; track item.path) {
            <a
              [routerLink]="item.path"
              [class.active]="isActive(item)"
              [attr.aria-current]="isActive(item) ? 'page' : null"
              (click)="setMode(item.mode)"
              [attr.title]="item.label"
            >
              <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icon" />
              </svg>
              <span class="leos-studio-shell__mode-label">{{ item.label }}</span>
            </a>
          }
          <span class="leos-studio-shell__divider" aria-hidden="true"></span>
          @for (item of toolsNav; track item.path) {
            <a
              [routerLink]="item.path"
              [class.active]="isActive(item)"
              [attr.aria-current]="isActive(item) ? 'page' : null"
              (click)="setMode(item.mode)"
              [attr.title]="item.label"
            >
              <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path [attr.d]="item.icon" />
              </svg>
              <span class="leos-studio-shell__mode-label">{{ item.label }}</span>
            </a>
          }
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
        @if (!setupEngine && !preEngine) {
          <header class="leos-studio-shell__bar">
            <h1 class="leos-studio-shell__bar-title">{{ title }}</h1>
            @if (venue) {
              <p class="leos-studio-shell__bar-status" [class.leos-studio-shell__bar-status--live]="live">
                <span class="leos-studio-shell__bar-dot" aria-hidden="true"></span>
                {{ venue }} · {{ live ? 'Live' : 'Setting up' }}
              </p>
            }
          </header>
        }
        <div class="leos-studio-shell__body" [class.leos-studio-shell__body--flush]="setupEngine || preEngine">
          <router-outlet />
        </div>
      </main>
    </div>
  `,
})
export class StudioShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ctx = inject(StudioContextService);
  private readonly auth = inject(StudioAuthService);
  private readonly staffSession = inject(OperateStaffSessionService);

  readonly mainNav = STUDIO_NAV_MAIN;
  readonly toolsNav = STUDIO_NAV_TOOLS;

  mode: StudioMode = 'setup';
  setupEngine = false;
  preEngine = false;
  venue = '';
  live = false;
  navCollapsed = false;
  title = 'Home';
  private currentPath = '/studio';

  ngOnInit() {
    try {
      this.navCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === '1';
    } catch {
      this.navCollapsed = false;
    }
    this.refresh();
    this.ctx.ensureWorkspaceHydrated();
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

  isActive(item: NavItem): boolean {
    const p = this.currentPath;
    return item.matches.some((m) => (item.exact ? p === m : p === m || p.startsWith(m + '/')));
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
    this.currentPath = url.split(/[?#]/)[0];
    this.mode = this.ctx.modeFromUrl(url);
    const active = [...STUDIO_NAV_MAIN, ...STUDIO_NAV_TOOLS].find((i) => this.isActive(i));
    this.title = active?.label ?? 'Studio';
    this.ctx.mode.set(this.mode);
    this.setupEngine = url.includes('/studio/setup/') || url.includes('/studio/create');
    this.preEngine = url.includes('/studio/welcome');
    this.venue = this.ctx.displayVenue();
    this.live = this.ctx.readConfig().live;
  }
}
