import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { StudioContextService } from '../services/studio-context.service';
import { everydayPathForSetupUrl } from './guided-setup-paths';

/** Once live, there is no wizard: setup links open the everyday page. */
export const guidedSetupOnlyBeforeLive: CanActivateFn = (_route, state) => {
  const ctx = inject(StudioContextService);
  if (!ctx.readConfig().live) return true;
  const target = everydayPathForSetupUrl(state.url);
  return target ? inject(Router).parseUrl(target) : true;
};
