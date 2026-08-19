import { Injectable, signal } from '@angular/core';

export type OperateStaffRole = 'kitchen' | 'bar' | 'waiter' | 'staff' | 'counter';

export type OperateStaffSession = {
  id: string;
  displayName: string;
  email: string;
  role: OperateStaffRole | string;
  organisationId: string;
  permissions: string[];
  homePath: string;
  token: string;
  sessionId: string;
  at: number;
};

const KEY = 'leos.staff.session';
const LEGACY_KEY = 'leos.studio.operateStaff';

const ROLE_HOME: Record<string, string> = {
  kitchen: '/staff/station/kitchen',
  bar: '/staff/station/bar',
  waiter: '/staff/service',
  staff: '/staff/service',
  counter: '/staff/station/counter',
};

@Injectable({ providedIn: 'root' })
export class OperateStaffSessionService {
  readonly session = signal<OperateStaffSession | null>(this.read());

  read(): OperateStaffSession | null {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as OperateStaffSession;
      // API gates need a signed token — drop pre-auth / wiped-session leftovers.
      if (!parsed?.token || !parsed?.sessionId) {
        localStorage.removeItem(KEY);
        localStorage.removeItem(LEGACY_KEY);
        return null;
      }
      // Migrate legacy key
      if (!localStorage.getItem(KEY) && localStorage.getItem(LEGACY_KEY)) {
        localStorage.setItem(KEY, JSON.stringify(parsed));
        localStorage.removeItem(LEGACY_KEY);
      }
      return parsed;
    } catch {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
      return null;
    }
  }

  /** Auth headers for Operate mutations (also attached by interceptor). */
  authHeaders(): Record<string, string> {
    const token = this.token();
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      'X-Staff-Token': token,
    };
  }

  set(
    session: Omit<OperateStaffSession, 'at' | 'homePath'> & {
      homePath?: string;
      token: string;
      sessionId: string;
    },
  ) {
    const next: OperateStaffSession = {
      ...session,
      homePath: session.homePath || ROLE_HOME[session.role] || ROLE_HOME['staff'],
      token: session.token,
      sessionId: session.sessionId,
      at: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_KEY);
    this.session.set(next);
    return next;
  }

  clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
    this.session.set(null);
  }

  token(): string | null {
    return this.read()?.token || null;
  }

  isSignedIn() {
    return !!this.read()?.token;
  }

  homePathFor(role: string) {
    return ROLE_HOME[role] || ROLE_HOME['staff'];
  }

  canAccessRole(doorRole: string): boolean {
    const s = this.read();
    if (!s) return false;
    if (s.role === 'staff') return true;
    if (s.role === 'waiter' && (doorRole === 'floor' || doorRole === 'waiter')) return true;
    return s.role === doorRole;
  }

  /** Kitchen / Bar hand off Ready tickets on the Waiter board. */
  canOpenWaiterBoard(): boolean {
    const role = this.read()?.role;
    return role === 'waiter' || role === 'staff' || role === 'kitchen' || role === 'bar';
  }

  roleLabel(role?: string): string {
    const r = role || this.read()?.role || '';
    if (r === 'kitchen') return 'Kitchen';
    if (r === 'bar') return 'Bar';
    if (r === 'waiter') return 'Waiter';
    if (r === 'counter') return 'Counter';
    if (r === 'staff') return 'Staff';
    return r || 'Staff';
  }
}
