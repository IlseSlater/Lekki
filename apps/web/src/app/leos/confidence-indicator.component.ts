import { Component, Input } from '@angular/core';

/**
 * Confidence block — Design System v1 signature.
 * Guest confidence, not checklist completion. Calm by Default.
 */
@Component({
  selector: 'leos-confidence-indicator',
  standalone: true,
  template: `
    <div class="ci" [class.ci--ready]="ready" role="status">
      @if (ready) {
        <p class="ci__ok">{{ okLabel }}</p>
      }
      <p class="ci__eyebrow">{{ eyebrow }}</p>
      @if (fact) {
        <p class="ci__fact">{{ fact }}</p>
      }
      @if (detail) {
        <p class="ci__detail">{{ detail }}</p>
      }
      @if (!ready && waiting) {
        <p class="ci__wait">{{ waiting }}</p>
      }
    </div>
  `,
  styles: [
    `
      .ci {
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
      }
      .ci--ready {
        animation: ci-settle var(--studio-duration-settle, 360ms) var(--studio-ease, cubic-bezier(0.22, 1, 0.36, 1))
          both;
      }
      @keyframes ci-settle {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .ci__ok {
        margin: 0 0 0.5rem;
        font-size: 0.9375rem;
        font-weight: 650;
        color: var(--studio-success, #4f8a6b);
      }
      .ci__ok::before {
        content: '✓ ';
      }
      .ci__eyebrow {
        margin: 0;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
      .ci__fact {
        margin: 0.35rem 0 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 1.35rem;
        font-weight: 650;
        letter-spacing: -0.02em;
        color: var(--studio-ink, #1b2230);
      }
      .ci__detail {
        margin: 0.2rem 0 0;
        font-size: 0.9375rem;
        color: var(--studio-ink-secondary, #6b7280);
      }
      .ci__wait {
        margin: 0.5rem 0 0;
        font-size: 0.875rem;
        color: var(--studio-ink-tertiary, #8f96a3);
      }
    `,
  ],
})
export class ConfidenceIndicatorComponent {
  @Input() eyebrow = 'Guests will see';
  @Input() fact = '';
  @Input() detail = '';
  @Input() ready = false;
  @Input() okLabel = 'Looks good';
  @Input() waiting = '';
}
