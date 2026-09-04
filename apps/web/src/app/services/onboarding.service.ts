import { Injectable } from '@angular/core';
import { canEnterWithToken, isReturningByVisits } from '../studio/guest-entry-gate';

/** @deprecated Kept for localStorage shape only — never collected in Batch 6+. */
export type GuestGender = 'man' | 'woman' | 'nonbinary' | 'prefer_not' | '';

export type OnboardingProfile = {
  email: string;
  name: string;
  phone: string;
  /** @deprecated Unused — ageRestricted is checked at order time. */
  birthday: string;
  /** @deprecated Unused — never collected. */
  gender: GuestGender;
  verified: boolean;
  /** Guest has entered an experience at least once (not a signup wall). */
  completed: boolean;
  /** Venue QR token captured from Scan or deep link. */
  entryToken: string;
  /** Completed visits (bumped on Leave) — drives Welcome back. */
  visitCount: number;
  /** ISO timestamp of last Leave. */
  lastVisitAt: string;
  /** Last venue label remembered for Continuity. */
  lastVenueLabel: string;
};

const KEY = 'leos.onboarding';
const RETURN_SHOWN_KEY = 'leos.return.shown';
const JOIN_SHOWN_KEY = 'leos.join.shown';
const RESUME_SHOWN_KEY = 'leos.resume.shown';
const KNOWN_SESSION_KEY = 'leos.session.known';

const EMPTY: OnboardingProfile = {
  email: '',
  name: '',
  phone: '',
  birthday: '',
  gender: '',
  verified: false,
  completed: false,
  entryToken: '',
  visitCount: 0,
  lastVisitAt: '',
  lastVenueLabel: '',
};

/**
 * Guest continuity memory — visitCount / Welcome back.
 * Batch 6: no account wall. A QR token is enough to see the menu.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  read(): OnboardingProfile {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...EMPTY };
      return { ...EMPTY, ...(JSON.parse(raw) as Partial<OnboardingProfile>) };
    } catch {
      return { ...EMPTY };
    }
  }

  save(patch: Partial<OnboardingProfile>) {
    const next = { ...this.read(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  isComplete(): boolean {
    return this.read().completed;
  }

  /** @deprecated Personal signup wall removed — always false for gate purposes. */
  hasPersonalDetails(): boolean {
    return !!this.read().name.trim();
  }

  /** Ready to load an experience — token only (menu first). */
  canEnterExperience(): boolean {
    return canEnterWithToken(this.read().entryToken);
  }

  /** Returning guest — completed at least one Leave. */
  isReturningGuest(): boolean {
    return isReturningByVisits(this.read().visitCount);
  }

  firstName(): string {
    const raw = this.read().name.trim();
    if (!raw) return '';
    return raw.split(/\s+/)[0] ?? '';
  }

  /** Call after a successful Leave — Continuity memory. */
  recordVisit(venueLabel?: string) {
    const p = this.read();
    return this.save({
      visitCount: (p.visitCount ?? 0) + 1,
      lastVisitAt: new Date().toISOString(),
      lastVenueLabel: (venueLabel || p.lastVenueLabel || '').trim(),
    });
  }

  /** Once per browser tab session — avoid re-banner on refresh. */
  consumeReturnGreeting(): boolean {
    if (!this.isReturningGuest()) return false;
    try {
      if (sessionStorage.getItem(RETURN_SHOWN_KEY) === '1') return false;
      sessionStorage.setItem(RETURN_SHOWN_KEY, '1');
      return true;
    } catch {
      return true;
    }
  }

  /** Once per tab session — first-visit Join confidence. */
  consumeJoinGreeting(): boolean {
    if (this.isReturningGuest()) return false;
    try {
      if (sessionStorage.getItem(JOIN_SHOWN_KEY) === '1') return false;
      sessionStorage.setItem(JOIN_SHOWN_KEY, '1');
      return true;
    } catch {
      return true;
    }
  }

  /** Once per tab — mid-visit “You’re still in” (not Welcome back / Join). */
  consumeResumeGreeting(): boolean {
    try {
      if (sessionStorage.getItem(RESUME_SHOWN_KEY) === '1') return false;
      sessionStorage.setItem(RESUME_SHOWN_KEY, '1');
      return true;
    } catch {
      return true;
    }
  }

  /** Remember open session so refresh can show still-in, not Join. */
  noteOpenSession(sessionId: string | null | undefined) {
    const id = (sessionId ?? '').trim();
    if (!id) return;
    try {
      sessionStorage.setItem(KNOWN_SESSION_KEY, id);
    } catch {
      /* ignore */
    }
  }

  knownOpenSessionId(): string {
    try {
      return sessionStorage.getItem(KNOWN_SESSION_KEY)?.trim() || '';
    } catch {
      return '';
    }
  }

  /** True when this tab already knew this open session (refresh / re-open). */
  isKnownOpenSession(sessionId: string | null | undefined): boolean {
    const id = (sessionId ?? '').trim();
    return !!id && this.knownOpenSessionId() === id;
  }

  clearReturnGreetingFlag() {
    try {
      sessionStorage.removeItem(RETURN_SHOWN_KEY);
      sessionStorage.removeItem(JOIN_SHOWN_KEY);
      sessionStorage.removeItem(RESUME_SHOWN_KEY);
      sessionStorage.removeItem(KNOWN_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  reset() {
    localStorage.removeItem(KEY);
    this.clearReturnGreetingFlag();
  }
}
