import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canManage } from './staff-admin';
import { canTakeTable } from './waiter-alerts';
import { shiftStart, tipsByWaiter } from './tip-shift';
import { toMinor } from './money';
import { eveningSentence } from './owner-evening';

export type WaiterIdentity = {
  sub: string;
  org: string;
  name: string;
  permissions: string[];
};

/** One waiter has a table. Ready alerts, help, and tips follow that person. */
@Injectable()
export class WaiterTablesService {
  constructor(private readonly prisma: PrismaService) {}

  /** "I've got this table". A manager can take a table from someone else. */
  async take(sessionId: string, staff: WaiterIdentity) {
    const session = await this.load(sessionId, staff.org);
    const manager = canManage(staff.permissions);
    if (!canTakeTable(session.waiterId, staff.sub, manager)) {
      throw new ConflictException(
        `${session.waiterName || 'Another waiter'} already has this table.`,
      );
    }
    return this.assign(session.id, staff);
  }

  /**
   * Acknowledging help or serving a table quietly takes it when nobody has it.
   * A table that already has a waiter stays with them.
   */
  async takeIfFree(sessionId: string, staff: WaiterIdentity | undefined) {
    if (!staff) return null;
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, organisationId: true, waiterId: true },
    });
    if (!session || session.organisationId !== staff.org || session.waiterId) return null;
    return this.assign(session.id, staff);
  }

  /** Tips this shift, per waiter. */
  async tipsThisShift(organisationId: string, now = new Date()) {
    const since = shiftStart(now);
    const payments = await this.prisma.payment.findMany({
      where: {
        organisationId,
        tipWaiterId: { not: null },
        createdAt: { gte: since },
        status: { in: ['completed', 'settled'] },
      },
      select: {
        status: true,
        tipAmount: true,
        tipWaiterId: true,
        tipWaiterName: true,
        createdAt: true,
      },
    });
    return { since: since.toISOString(), waiters: tipsByWaiter(payments, since) };
  }

  /** One calm sentence about tonight, or null while the averages are not real yet. */
  async eveningSentence(organisationId: string, now = new Date()): Promise<string | null> {
    const since = shiftStart(now);
    const [visits, payments] = await Promise.all([
      this.prisma.experienceSession.findMany({
        where: { organisationId, completedAt: { gte: since } },
        select: { startedAt: true, completedAt: true },
      }),
      this.prisma.payment.findMany({
        where: {
          organisationId,
          createdAt: { gte: since },
          status: { in: ['completed', 'settled'] },
        },
        select: { tipAmount: true, currency: true },
      }),
    ]);
    let tipMinor = 0;
    let tipCount = 0;
    for (const p of payments) {
      const tip = toMinor(p.tipAmount ?? 0);
      if (tip > 0) {
        tipMinor += tip;
        tipCount += 1;
      }
    }
    return eveningSentence({
      visits,
      tipMinor,
      tipCount,
      currency: payments[0]?.currency || 'ZAR',
    });
  }

  private async load(sessionId: string, organisationId: string) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, organisationId: true, waiterId: true, waiterName: true },
    });
    if (!session || session.organisationId !== organisationId) {
      throw new NotFoundException('Table not found');
    }
    return session;
  }

  private assign(sessionId: string, staff: WaiterIdentity) {
    return this.prisma.experienceSession.update({
      where: { id: sessionId },
      data: { waiterId: staff.sub, waiterName: staff.name },
      select: { id: true, waiterId: true, waiterName: true },
    });
  }
}
