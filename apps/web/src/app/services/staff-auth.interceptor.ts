import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OperateStaffSessionService } from './operate-staff-session.service';

/** Attach staff Experience token to Operate / Staff API calls (ADR-004). */
export const staffAuthInterceptor: HttpInterceptorFn = (req, next) => {
  // Studio monitor mode is read-only — never send write credentials.
  if (typeof window !== 'undefined' && /(?:\?|&)monitor=1(?:&|$)/.test(window.location.search)) {
    return next(req);
  }
  const staff = inject(OperateStaffSessionService);
  const token = staff.token();
  if (!token) return next(req);
  const url = req.url;
  const needsStaff =
    url.includes('/fulfilments/') ||
    (url.includes('/assistance/') &&
      (url.includes('/acknowledge') || url.includes('/resolve'))) ||
    (url.includes('/sessions/') && url.includes('/close')) ||
    url.includes('/identity/staff/logout') ||
    url.includes('/identity/staff/sessions');
  if (!needsStaff) return next(req);
  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Staff-Token': token,
      },
    }),
  );
};
