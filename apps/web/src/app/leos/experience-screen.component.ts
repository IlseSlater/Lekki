import { Component, Input } from '@angular/core';

/**
 * Studio page anatomy — Design System v1.
 * Question · why-sentence · configuration card · confidence · Back/Continue
 * Hospitality mode (Guest): place hero · Fraunces purpose · open field (no card wall).
 */
@Component({
  selector: 'leos-experience-screen',
  standalone: true,
  template: `
    <article
      class="leos-screen"
      [class.leos-screen--docked]="docked"
      [class.leos-screen--hospitality]="hospitality"
    >
      <header class="leos-screen__header">
        @if (place) {
          <p class="leos-screen__place">{{ place }}</p>
        }
        <h1 class="leos-screen__purpose">{{ purpose }}</h1>
        @if (lead) {
          <p class="leos-screen__lead">{{ lead }}</p>
        }
        @if (help) {
          <p class="leos-screen__help">{{ help }}</p>
        }
      </header>

      <div
        class="leos-card"
        [class.leos-card--compact]="compact"
        [class.leos-card--open]="hospitality"
      >
        <ng-content select="[config]" />
        <ng-content />
      </div>

      <div class="leos-screen__confidence">
        <ng-content select="[confidence]" />
      </div>

      @if (showFooter) {
        <footer class="leos-screen__footer">
          <ng-content select="[escape]" />
          <ng-content select="[primary]" />
        </footer>
      }
    </article>
  `,
})
export class ExperienceScreenComponent {
  @Input() purpose = '';
  @Input() lead = '';
  @Input() help = '';
  /** Spoken place confidence — Guest hospitality hero (e.g. Table 12). */
  @Input() place = '';
  /** Guest Experience: place → Fraunces purpose → open Warm Sand field. */
  @Input() hospitality = false;
  @Input() compact = false;
  @Input() showFooter = false;
  /** When true, screen content pads for the fixed guest tab dock. */
  @Input() docked = false;
}
