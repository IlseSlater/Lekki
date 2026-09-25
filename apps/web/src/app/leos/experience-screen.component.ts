import { Component, Input } from '@angular/core';

/**
 * Studio page anatomy — Design System v1.
 * Hospitality (Guest): host is display:contents so it does not paint a second sheet
 * inside the Experience Shell.
 */
@Component({
  selector: 'leos-experience-screen',
  standalone: true,
  host: {
    class: 'leos-screen',
    '[class.leos-screen--docked]': 'docked',
    '[class.leos-screen--hospitality]': 'hospitality',
  },
  template: `
    <header
      class="leos-screen__header"
      [class.leos-screen__header--identity]="!!place && hospitality"
    >
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
      class="leos-screen__body"
      [class.leos-card]="!hospitality"
      [class.leos-card--compact]="!hospitality && compact"
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
  `,
  styles: [
    `
      :host.leos-screen--hospitality {
        display: contents;
      }
    `,
  ],
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
