import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { StudioContextService, type StudioMode } from '../services/studio-context.service';
import { StudioAuthService } from '../services/studio-auth.service';

/**
 * LEOS Studio Shell — permanent frame (Design System v1 fidelity).
 * LEKKI top bar · quiet Setup → Operate → Grow · cream canvas.
 * Setup Engine adds progress story + Live column inside the host — never a second shell.
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
    >
      <header class="leos-studio-shell__topbar">
        <div class="leos-studio-shell__topbar-left">
          <a class="leos-studio-shell__brand" routerLink="/studio" aria-label="LEKKI Studio">
            <img class="leos-studio-shell__logo" src="/brand/lekki-mark.svg" alt="" width="28" height="28" />
            <span class="leos-studio-shell__mark">LEKKI</span>
          </a>
          <nav class="leos-studio-shell__modes" aria-label="Studio mode">
            <a
              routerLink="/studio"
              [class.active]="mode === 'setup' && setupEngine"
              (click)="setMode('setup')"
              >Setup</a
            >
            <a
              routerLink="/studio/operate"
              [class.active]="mode === 'operate'"
              (click)="setMode('operate')"
              >Operate</a
            >
            <a routerLink="/studio/grow" [class.active]="mode === 'grow'" (click)="setMode('grow')"
              >Grow</a
            >
            <a
              class="leos-studio-shell__mode--quiet"
              routerLink="/studio/team"
              [class.active]="mode === 'team'"
              (click)="setMode('team')"
              >Team</a
            >
          </nav>
        </div>
        <div class="leos-studio-shell__topbar-right">
          @if (setupEngine) {
            <p class="leos-studio-shell__live-pill" title="Live Experience is always on">
              <span class="leos-studio-shell__live-dot" aria-hidden="true"></span>
              Live Experience
            </p>
          } @else if (venue) {
            <p class="leos-studio-shell__venue-chip" [attr.title]="live ? 'Live' : 'Setup'">
              {{ venue }}
              <span class="leos-studio-shell__venue-state">{{ live ? 'Live' : 'Setup' }}</span>
            </p>
          }
          <button type="button" class="leos-studio-shell__signout" (click)="signOut()">Sign out</button>
        </div>
      </header>
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

  mode: StudioMode = 'setup';
  /** Identity → Go Live dual column host. */
  setupEngine = false;
  /** Welcome / Choose — same top frame, Live optional/calm. */
  preEngine = false;
  venue = '';
  live = false;

  ngOnInit() {
    if (!this.auth.isSignedIn()) {
      void this.router.navigate(['/signin'], { queryParams: { next: this.router.url } });
      return;
    }
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  setMode(m: StudioMode) {
    this.mode = m;
    this.ctx.mode.set(m);
  }

  signOut() {
    this.auth.signOut();
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
