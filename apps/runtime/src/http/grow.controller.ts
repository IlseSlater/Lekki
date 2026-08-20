import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Grow overview — calm Org Memory numbers (not BI). */
@Controller('grow')
export class GrowController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async overview(@Query('token') token?: string) {
    const entry = token
      ? await this.prisma.entryToken.findUnique({ where: { token } })
      : null;

    const venueId = entry?.venueId;
    const venue = venueId
      ? await this.prisma.venue.findUnique({ where: { id: venueId } })
      : null;

    const { start: yesterdayStart, end: yesterdayEnd } = dayBounds(-1);
    const { start: todayStart, end: todayEnd } = dayBounds(0);

    const venueFilter = venueId ? { venueId } : {};
    const sessionVenue = venueId ? { session: { venueId } } : {};

    const [
      guestsYesterday,
      guestsToday,
      fulfilmentsToday,
      fulfilmentsYesterday,
      paymentInstall,
      paymentsToday,
      paymentsYesterday,
      popularToday,
      popularYesterday,
    ] = await Promise.all([
      this.prisma.experienceSession.count({
        where: {
          ...venueFilter,
          startedAt: { gte: yesterdayStart, lt: yesterdayEnd },
        },
      }),
      this.prisma.experienceSession.count({
        where: {
          ...venueFilter,
          startedAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.fulfilment.findMany({
        where: {
          status: { in: ['ready', 'delivered'] },
          updatedAt: { gte: todayStart, lt: todayEnd },
          ...sessionVenue,
        },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.fulfilment.findMany({
        where: {
          status: { in: ['ready', 'delivered'] },
          updatedAt: { gte: yesterdayStart, lt: yesterdayEnd },
          ...sessionVenue,
        },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.paymentConnectorInstall.findFirst({
        where: { status: 'active' },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: {
          status: { in: ['completed', 'settled'] },
          createdAt: { gte: todayStart, lt: todayEnd },
          ...sessionVenue,
        },
        select: { amount: true, currency: true },
      }),
      this.prisma.payment.findMany({
        where: {
          status: { in: ['completed', 'settled'] },
          createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
          ...sessionVenue,
        },
        select: { amount: true, currency: true },
      }),
      this.prisma.transactionLine.groupBy({
        by: ['label'],
        where: {
          transaction: {
            createdAt: { gte: todayStart, lt: todayEnd },
            ...(venueId ? { session: { venueId } } : {}),
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      }),
      this.prisma.transactionLine.groupBy({
        by: ['label'],
        where: {
          transaction: {
            createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
            ...(venueId ? { session: { venueId } } : {}),
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 1,
      }),
    ]);

    const waitToday = averageWait(fulfilmentsToday);
    const waitYesterday = averageWait(fulfilmentsYesterday);
    const takingsToday = sumPayments(paymentsToday);
    const takingsYesterday = sumPayments(paymentsYesterday);
    /** Same window as Grow’s one-breath story (today if guests or lone takings). */
    const useToday =
      guestsToday > 0 || (takingsToday.amount > 0 && guestsYesterday === 0);
    const averageWaitMinutes = useToday ? waitToday : waitYesterday;

    const paymentsStatus: 'healthy' | 'setup' =
      paymentInstall?.status === 'active' ? 'healthy' : 'setup';

    const popularLabel =
      (useToday
        ? popularToday[0]?.label?.trim()
        : popularYesterday[0]?.label?.trim()) ||
      popularToday[0]?.label?.trim() ||
      popularYesterday[0]?.label?.trim() ||
      null;

    return {
      venueName: venue?.name ?? null,
      venueId: venueId ?? null,
      window: {
        yesterdayStart: yesterdayStart.toISOString(),
        yesterdayEnd: yesterdayEnd.toISOString(),
      },
      guestsYesterday,
      guestsToday,
      waitToday,
      waitYesterday,
      averageWaitMinutes,
      paymentsStatus,
      hasMemory: guestsYesterday > 0 || guestsToday > 0,
      /** Calm trading breath — one figure, not a revenue grid. */
      takingsToday: takingsToday.amount,
      takingsYesterday: takingsYesterday.amount,
      currency: takingsToday.currency || takingsYesterday.currency || 'ZAR',
      popularLabel,
    };
  }
}

function sumPayments(
  rows: Array<{ amount: number; currency: string }>,
): { amount: number; currency: string } {
  if (!rows.length) return { amount: 0, currency: 'ZAR' };
  const amount = rows.reduce((s, p) => s + (p.amount || 0), 0);
  return { amount, currency: rows[0]?.currency || 'ZAR' };
}

function averageWait(
  rows: Array<{ createdAt: Date; updatedAt: Date }>,
): number | null {
  if (!rows.length) return null;
  const totalMs = rows.reduce(
    (sum, f) => sum + Math.max(0, f.updatedAt.getTime() - f.createdAt.getTime()),
    0,
  );
  return Math.round(totalMs / rows.length / 60000);
}

/** Calendar day bounds in local server time, offsetDays = 0 today, -1 yesterday. */
function dayBounds(offsetDays: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays + 1);
  return { start, end };
}
