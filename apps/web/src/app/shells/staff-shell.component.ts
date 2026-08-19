import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { StudioContextService } from '../services/studio-context.service';
import { STAFF_LOGIN } from '../studio/staff-paths';

/**
 * LEOS Staff Experience shell — ADR-004.
 * No Setup · Grow · Team · Payments. Person → Experience only.
 */
@Component({
  standalone: true,
  selector: 'leos-staff-shell',
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="leos-staff-shell" [attr.data-monitor]="monitor ? 'true' : null" [attr.data-board]="board ? 'true' : null">
      <header class="leos-staff-shell__bar">
        <p class="leos-staff-shell__brand">
          <img src="/brand/lekki-mark.svg" alt="" width="22" height="22" />
          <span>LEOS</span>
        </p>
        <div class="leos-staff-shell__who">
          @if (monitor) {
            <span class="leos-staff-shell__pill">Monitoring</span>
          }
          @if (staffName) {
            <span>{{ staffName }} · {{ roleLabel }}</span>
            <a class="leos-staff-shell__action" [routerLink]="STAFF_LOGIN">Switch</a>
          } @else if (monitor) {
            <a class="leos-staff-shell__action" routerLink="/studio/operate">Back to Operate</a>
          }
        </div>
      </header>
      <main class="leos-staff-shell__main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .leos-staff-shell {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        background:
          radial-gradient(100% 70% at 50% -20%, rgba(215, 161, 74, 0.12), transparent 50%),
          #f6f3ee;
        color: #1b2230;
      }
      .leos-staff-shell__bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1.25rem;
        border-bottom: 1px solid rgba(27, 34, 48, 0.08);
      }
      .leos-staff-shell__brand {
        margin: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.875rem;
        font-weight: 650;
        letter-spacing: -0.02em;
      }
      .leos-staff-shell__brand img {
        display: block;
      }
      .leos-staff-shell__who {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.8125rem;
        color: #5c6573;
      }
      .leos-staff-shell__pill {
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: rgba(27, 34, 48, 0.08);
        font-size: 0.7rem;
        font-weight: 650;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .leos-staff-shell__action {
        color: #1b2230;
        font-weight: 600;
        text-decoration: none;
      }
      .leos-staff-shell__action:hover {
        text-decoration: underline;
      }
      .leos-staff-shell__main {
        flex: 1;
        width: 100%;
        max-width: 40rem;
        margin: 0 auto;
        padding: 0 1rem 2rem;
      }
      .leos-staff-shell[data-monitor='true'] .leos-staff-shell__main,
      .leos-staff-shell[data-board='true'] .leos-staff-shell__main {
        max-width: 72rem;
      }
    `,
  ],
})
export class StaffShellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly staffSession = inject(OperateStaffSessionService);
  private readonly ctx = inject(StudioContextService);

  readonly STAFF_LOGIN = STAFF_LOGIN;
  staffName = '';
  roleLabel = '';
  monitor = false;
  board = false;
  venue = '';

  ngOnInit() {
    this.refresh();
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.refresh());
  }

  private refresh() {
    const url = this.router.url;
    this.monitor = url.includes('monitor=1');
    this.board = /\/staff\/(station\/|service)/.test(url);
    this.venue = this.ctx.displayVenue();
    const who = this.staffSession.read();
    this.staffName = who?.displayName || '';
    this.roleLabel = this.staffSession.roleLabel(who?.role);
  }
}
