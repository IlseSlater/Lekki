import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root — no shared business nav. Shells own chrome. */
@Component({
  selector: 'lekki-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}
