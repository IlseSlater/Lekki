import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'leos-neo-dock',
  standalone: true,
  template: `
    <aside class="leos-neo-dock" aria-label="Neo assistance">
      @if (open()) {
        <div class="leos-neo-dock__drawer" role="complementary">
          <h3>Neo</h3>
          <p>{{ hint }}</p>
        </div>
      }
      <button
        type="button"
        class="leos-neo-dock__trigger"
        [attr.aria-expanded]="open()"
        aria-label="Open Neo suggestions"
        (click)="toggle()"
      ></button>
    </aside>
  `,
})
export class NeoDockComponent {
  readonly open = signal(false);

  @Input() hint =
    'Neo stays silent while things run smoothly. Suggestions appear here only when they can help — never as popups.';

  toggle() {
    this.open.update((v) => !v);
  }
}
