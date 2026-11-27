import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { LeosApiService } from './leos-api.service';
import { alertsAdvice, isIosUserAgent, type AlertsStatus } from '../leos/staff-alerts';

/** Ready alerts for waiters who added the site to their Home Screen. */
@Injectable({ providedIn: 'root' })
export class StaffAlertsService {
  private readonly api = inject(LeosApiService);
  private readonly push = inject(SwPush, { optional: true });

  readonly status = signal<AlertsStatus>('unsupported');
  private publicKey: string | null = null;

  get advice() {
    return alertsAdvice(this.status(), this.device());
  }

  private device() {
    if (typeof navigator === 'undefined') return { ios: false, standalone: false };
    const standalone =
      (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    return { ios: isIosUserAgent(navigator.userAgent), standalone };
  }

  async refresh(): Promise<void> {
    if (!this.push?.isEnabled || typeof Notification === 'undefined') {
      this.status.set('unsupported');
      return;
    }
    try {
      this.publicKey = (await firstValueFrom(this.api.getPushKey())).publicKey;
    } catch {
      this.publicKey = null;
    }
    if (!this.publicKey) {
      this.status.set('unconfigured');
      return;
    }
    if (Notification.permission === 'denied') {
      this.status.set('blocked');
      return;
    }
    const existing = await firstValueFrom(this.push.subscription);
    this.status.set(existing ? 'on' : 'off');
  }

  /** One tap. The phone asks permission, then the runtime remembers this phone. */
  async enable(): Promise<void> {
    if (!this.push?.isEnabled || !this.publicKey) return;
    try {
      const sub = await this.push.requestSubscription({ serverPublicKey: this.publicKey });
      await firstValueFrom(this.api.subscribePush(sub.toJSON()));
      this.status.set('on');
    } catch {
      this.status.set(Notification.permission === 'denied' ? 'blocked' : 'off');
    }
  }
}
