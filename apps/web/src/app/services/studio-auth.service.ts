import { Injectable } from '@angular/core';

export type StudioAccount = {
  email: string;
  name: string;
  provider: 'google' | 'apple' | 'email' | '';
  signedIn: boolean;
  signedInAt: string;
};

const KEY = 'leos.studio.auth';

const EMPTY: StudioAccount = {
  email: '',
  name: '',
  provider: '',
  signedIn: false,
  signedInAt: '',
};

/** Website → LEOS Studio account session (social login UI proof). */
@Injectable({ providedIn: 'root' })
export class StudioAuthService {
  read(): StudioAccount {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...EMPTY };
      return { ...EMPTY, ...(JSON.parse(raw) as Partial<StudioAccount>) };
    } catch {
      return { ...EMPTY };
    }
  }

  isSignedIn(): boolean {
    return this.read().signedIn;
  }

  signIn(input: {
    email: string;
    name?: string;
    provider: 'google' | 'apple' | 'email';
  }): StudioAccount {
    const email = input.email.trim();
    const name =
      input.name?.trim() ||
      email
        .split('@')[0]
        ?.replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      'Operator';
    const account: StudioAccount = {
      email,
      name,
      provider: input.provider,
      signedIn: true,
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(account));
    return account;
  }

  signOut() {
    localStorage.removeItem(KEY);
  }
}
