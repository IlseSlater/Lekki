import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TimelineStepState = 'upcoming' | 'current' | 'done';

export type StatusTimelineStep = {
  id: string;
  label: string;
  state: TimelineStepState;
};

/**
 * LEK-028 Status Timeline (Frozen) — Experience Progress, not a kitchen board.
 * Pack supplies labels; platform step ids stay stable.
 */
@Component({
  selector: 'leos-status-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ol
      class="leos-status-timeline"
      [class.leos-status-timeline--stale]="stale"
      [attr.aria-busy]="stale ? 'true' : null"
    >
      @for (step of steps; track step.id) {
        <li
          class="leos-status-timeline__step"
          [class.leos-status-timeline__step--done]="step.state === 'done'"
          [class.leos-status-timeline__step--current]="step.state === 'current'"
          [class.leos-status-timeline__step--upcoming]="step.state === 'upcoming'"
          [attr.aria-current]="step.state === 'current' ? 'step' : null"
        >
          <span class="leos-status-timeline__marker" aria-hidden="true"></span>
          <span class="leos-status-timeline__label">{{ step.label }}</span>
        </li>
      }
    </ol>
    @if (guidance) {
      <p class="leos-status-timeline__guidance leos-muted">{{ guidance }}</p>
    }
    <p class="leos-sr-only" aria-live="polite">{{ liveAnnouncement }}</p>
  `,
})
export class StatusTimelineComponent {
  @Input({ required: true }) steps: StatusTimelineStep[] = [];
  @Input() guidance = '';
  @Input() stale = false;
  @Input() liveAnnouncement = '';
}
