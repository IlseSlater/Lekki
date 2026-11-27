import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';
import { studioLandingFor, studioPathAllowed } from '../studio/studio-nav';

/** A page outside someone's Studio role sends them to their first page. The server checks too. */
export const studioRoleGuard: CanActivateChildFn = (_route, state) => {
  const perms = inject(OperateStaffSessionService).read()?.permissions ?? [];
  if (studioPathAllowed(perms, state.url)) return true;
  return inject(Router).parseUrl(studioLandingFor(perms));
};
