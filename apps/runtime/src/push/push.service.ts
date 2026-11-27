import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import webpush from 'web-push';
import { newId } from '@lekki/shared';
import type { EventEnvelope } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { isGoneStatus, readyAlertPayload, readyAudience } from '../leos/waiter-alerts';

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Waiters who added the site to their Home Screen hear when food is ready.
 * Needs VAPID keys. Without them the service stays quiet and the in-app floor still updates live.
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly log = new Logger(PushService.name);
  private readonly publicKey = process.env['VAPID_PUBLIC_KEY']?.trim() || '';
  private readonly privateKey = process.env['VAPID_PRIVATE_KEY']?.trim() || '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
  ) {}

  get enabled(): boolean {
    return !!this.publicKey && !!this.privateKey;
  }

  getPublicKey(): string | null {
    return this.enabled ? this.publicKey : null;
  }

  onModuleInit() {
    if (!this.enabled) {
      this.log.log('Web Push is off (set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to turn it on).');
      return;
    }
    webpush.setVapidDetails(
      process.env['VAPID_SUBJECT']?.trim() || 'mailto:hello@lekki.app',
      this.publicKey,
      this.privateKey,
    );
    this.bus.subscribe((envelope) => this.onEvent(envelope));
  }

  async subscribe(staff: { sub: string; org: string }, input: PushSubscriptionInput) {
    const endpoint = input.endpoint?.trim();
    const p256dh = input.keys?.p256dh?.trim();
    const auth = input.keys?.auth?.trim();
    if (!endpoint || !p256dh || !auth || !/^https:\/\//.test(endpoint)) {
      throw new Error('A valid push subscription is required');
    }
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        id: newId('push'),
        organisationId: staff.org,
        staffMemberId: staff.sub,
        endpoint,
        p256dh,
        auth,
      },
      update: { organisationId: staff.org, staffMemberId: staff.sub, p256dh, auth },
    });
    return { ok: true as const };
  }

  async unsubscribe(staff: { sub: string; org: string }, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, staffMemberId: staff.sub, organisationId: staff.org },
    });
    return { ok: true as const };
  }

  private async onEvent(envelope: EventEnvelope) {
    if (envelope.eventName !== 'FulfilmentStatusChanged') return;
    if (envelope.payload?.['status'] !== 'ready') return;
    const fulfilmentId = envelope.payload?.['fulfilmentId'] as string | undefined;
    if (!fulfilmentId) return;
    try {
      await this.notifyReady(fulfilmentId);
    } catch (err) {
      // An alert that cannot be sent never blocks the kitchen.
      this.log.warn(`Ready alert failed: ${(err as Error).message}`);
    }
  }

  /**
   * Tell the people who manage this place: orders paused, an order cancelled.
   * Never throws — an alert that cannot be sent must not block the floor.
   */
  async notifyManagers(organisationId: string, alert: { title: string; body: string; tag: string }) {
    if (!this.enabled) return 0;
    try {
      const managers = await this.prisma.staffMember.findMany({
        where: { organisationId, active: true, permissions: { hasSome: ['organisation.manage', 'team.manage'] } },
        select: { id: true },
      });
      if (!managers.length) return 0;
      const devices = await this.prisma.pushSubscription.findMany({
        where: { organisationId, staffMemberId: { in: managers.map((m) => m.id) } },
      });
      const payload = JSON.stringify({
        notification: { title: alert.title, body: alert.body, tag: alert.tag, renotify: true },
      });
      let sent = 0;
      await Promise.all(
        devices.map(async (device) => {
          try {
            await webpush.sendNotification(
              { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
              payload,
              { TTL: 600, urgency: 'normal' },
            );
            sent += 1;
          } catch (err) {
            if (isGoneStatus((err as { statusCode?: number }).statusCode)) {
              await this.prisma.pushSubscription
                .deleteMany({ where: { endpoint: device.endpoint } })
                .catch(() => null);
            }
          }
        }),
      );
      return sent;
    } catch (err) {
      this.log.warn(`Manager alert failed: ${(err as Error).message}`);
      return 0;
    }
  }

  async notifyReady(fulfilmentId: string) {
    const fulfilment = await this.prisma.fulfilment.findUnique({
      where: { id: fulfilmentId },
      include: {
        lines: true,
        transaction: { include: { lines: true } },
        session: { include: { physicalContext: true } },
      },
    });
    if (!fulfilment) return 0;

    const devices = await this.prisma.pushSubscription.findMany({
      where: { organisationId: fulfilment.organisationId },
    });
    const audience = readyAudience(fulfilment.session.waiterId, devices);
    if (!audience.length) return 0;

    const labelByLine = new Map(
      (fulfilment.transaction.lines ?? []).map((l) => [l.id, l.label] as const),
    );
    const payload = JSON.stringify(
      readyAlertPayload({
        placeLabel: fulfilment.session.physicalContext?.code ?? null,
        itemLabels: fulfilment.lines.map((l) => {
          const label = labelByLine.get(l.transactionLineId) ?? 'Item';
          return l.quantity > 1 ? `${l.quantity}× ${label}` : label;
        }),
        sessionId: fulfilment.sessionId,
      }),
    );

    let sent = 0;
    await Promise.all(
      audience.map(async (device) => {
        try {
          await webpush.sendNotification(
            { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
            payload,
            { TTL: 120, urgency: 'high' },
          );
          sent += 1;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (isGoneStatus(status)) {
            await this.prisma.pushSubscription
              .deleteMany({ where: { endpoint: device.endpoint } })
              .catch(() => null);
          }
        }
      }),
    );
    return sent;
  }
}
