import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { UPDATE_COPY, noticeForVersionEvent, type UpdateNotice } from './update-notice';

/**
 * A long shift on one tab keeps the old bundle until the phone reloads.
 * When a newer version is ready this says so once and refreshes on a tap.
 * The update applies on reload, never mid-screen.
 */
@Component({
  selector: 'leos-app-update',
  standalone: true,
  template: `
    @if (notice(); as n) {
      <div class="upd" role="status" aria-live="polite">
        <span>{{ copy[n] }}</span>
        <button type="button" class="leos-btn leos-btn--secondary" (click)="refresh()">Refresh</button>
      </div>
    }
  `,
  styles: [
    `
      .upd {
        position: fixed;
        left: 0.75rem;
        right: 0.75rem;
        bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.65rem 0.9rem;
        border-radius: var(--leos-radius-button, 0.75rem);
        background: var(--leos-surface, var(--leos-table-glass-bg, transparent));
        color: var(--leos-ink, var(--leos-table-glass-ink, inherit));
        border: 1px solid var(--leos-table-glass-ink-muted, currentColor);
        backdrop-filter: blur(12px);
        font-size: 0.9375rem;
      }
    `,
  ],
})
export class AppUpdateComponent {
  private readonly updates = inject(SwUpdate, { optional: true });
  readonly copy = UPDATE_COPY;
  readonly notice = signal<UpdateNotice>(null);

  constructor() {
    const sw = this.updates;
    if (!sw?.isEnabled) return;
    sw.versionUpdates.pipe(takeUntilDestroyed()).subscribe((evt) => {
      const next = noticeForVersionEvent(evt);
      if (next) this.notice.set(next);
    });
    sw.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => this.notice.set('broken'));
  }

  refresh() {
    document.location.reload();
  }
}
