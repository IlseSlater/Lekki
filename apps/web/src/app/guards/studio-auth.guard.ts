import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OperateStaffSessionService } from '../services/operate-staff-session.service';

/** Studio routes require a staff Experience token (ADR-004). Welcome is open. */
export const studioAuthGuard: CanActivateFn = (_route, state) => {
  if (state.url.includes('/studio/welcome')) return true;
  const staff = inject(OperateStaffSessionService);
  const router = inject(Router);
  if (staff.isSignedIn()) return true;
  void router.navigate(['/signin'], { queryParams: { next: state.url || '/studio' } });
  return false;
};
