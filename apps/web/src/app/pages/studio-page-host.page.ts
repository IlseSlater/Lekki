import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StudioWorkspaceComponent } from '../leos/studio-workspace.component';

/**
 * Frame for the "What guests see" pages and Payments: the page on the left,
 * the real guest app in a phone on the right. Edits save as you go.
 */
@Component({
  standalone: true,
  selector: 'leos-studio-page-host',
  imports: [RouterOutlet, StudioWorkspaceComponent],
  template: `
    <leos-studio-workspace>
      <router-outlet />
    </leos-studio-workspace>
  `,
})
export class StudioPageHostComponent {}
