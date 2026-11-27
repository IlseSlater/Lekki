import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { StudioAuthService } from '../services/studio-auth.service';
import { StudioContextService, type StudioMode } from '../services/studio-context.service';
import {
  navGroupsFor,
  activeNavItem,
  type StudioNavItem,
} from '../studio/studio-nav';

const NAV_COLLAPSED_KEY = 'leos-studio-nav-collapsed';


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
          @for (group of navGroups; track group.label) {
            @if (group.label) {
              <span class="leos-studio-shell__divider" aria-hidden="true"></span>
              <p class="leos-studio-shell__group">{{ group.label }}</p>
            }
            @for (item of group.items; track item.path) {
              <a
                [routerLink]="item.path"
                [class.active]="item === activeItem"
                [attr.aria-current]="item === activeItem ? 'page' : null"
                (click)="setMode(item.mode)"
                [attr.title]="item.label"
              >
                <svg class="leos-studio-shell__mode-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                  <path [attr.d]="item.icon" />
                </svg>
                <span class="leos-studio-shell__mode-label">{{ item.label }}</span>
              </a>
            }
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

  /** Only the pages this person's Studio role opens. */
  get navGroups() {
    return navGroupsFor(this.staffSession.session()?.permissions);
  }
  activeItem: StudioNavItem | undefined;

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
    this.activeItem = activeNavItem(this.currentPath);
    this.title = this.activeItem?.label ?? 'Studio';
    this.ctx.mode.set(this.mode);
    this.setupEngine = url.includes('/studio/setup/') || url.includes('/studio/create');
    this.preEngine = url.includes('/studio/welcome');
    this.venue = this.ctx.displayVenue();
    this.live = this.ctx.readConfig().live;
  }
}
