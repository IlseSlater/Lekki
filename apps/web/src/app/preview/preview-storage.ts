/**
 * Guest preview (Studio's phone) runs the real guest app at /preview.
 *
 * It must never read or change a real guest's table on the same browser, so the
 * preview page gets its own throwaway storage. Only the staff sign-in is copied
 * in, so the preview can read the venue the owner is editing.
 */

export const PREVIEW_PATH = '/preview';

/** Studio and staff sign-in — the only keys the preview may see. */
export const PREVIEW_SHARED_KEYS = [
  'leos.staff.session',
  'leos.studio.operateStaff',
  'leos.studio.auth',
] as const;

export function isPreviewPath(pathname: string | null | undefined): boolean {
  const path = (pathname || '').split(/[?#]/)[0].replace(/\/+$/, '');
  return path === PREVIEW_PATH || path.startsWith(`${PREVIEW_PATH}/`);
}

/** In-memory Storage: gone when the preview frame reloads. */
export class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(String(key), String(value));
  }
}

type StorageWindow = {
  localStorage: Storage;
  sessionStorage: Storage;
};

let previewActive = false;

/** True once installPreviewStorage ran in this page. */
export function guestPreviewActive(): boolean {
  return previewActive;
}

/**
 * Swap localStorage / sessionStorage for memory copies before the app boots.
 * Returns the storages so tests can inspect them.
 */
export function installPreviewStorage(win: StorageWindow): { local: MemoryStorage; session: MemoryStorage } {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  let real: Storage | null = null;
  try {
    real = win.localStorage;
  } catch {
    real = null;
  }
  for (const key of PREVIEW_SHARED_KEYS) {
    try {
      const value = real?.getItem(key);
      if (value != null) local.setItem(key, value);
    } catch {
      /* storage blocked — preview just starts signed out */
    }
  }
  Object.defineProperty(win, 'localStorage', { configurable: true, value: local });
  Object.defineProperty(win, 'sessionStorage', { configurable: true, value: session });
  previewActive = true;
  return { local, session };
}

/** Tests only. */
export function resetPreviewFlagForTests() {
  previewActive = false;
}
