import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toMinor } from './money';
import {
  isPendingReservationExpired,
  paymentBaseMinor,
} from './payment-session-cap';

/**
 * Releases abandoned pending payments so paidMinor and pending unique indexes
 * do not lock a visit session after a guest closes the PayFast tab.
 */
@Injectable()
export class PaymentExpiryService {
  private readonly logger = new Logger(PaymentExpiryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mark overdue pending rows expired and release their reserved base (ex-tip).
   * Idempotent: only rows still `pending` are claimed.
   */
  async expireAbandoned(now: Date = new Date()): Promise<number> {
    if (!this.prisma?.payment) return 0;

    const candidates = await this.prisma.payment.findMany({
      where: {
        status: 'pending',
        expiresAt: { lte: now },
      },
      orderBy: { expiresAt: 'asc' },
      take: 50,
    });

    let released = 0;
    for (const payment of candidates) {
      if (
        !isPendingReservationExpired({
          status: payment.status,
          expiresAt: payment.expiresAt,
          now,
        })
      ) {
        continue;
      }

      const baseMinor = paymentBaseMinor(
        toMinor(Number(payment.amount)),
        toMinor(Number(payment.tipAmount ?? 0)),
      );

      const claimed = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.payment.updateMany({
          where: { id: payment.id, status: 'pending' },
          data: { status: 'expired' },
        });
        if (updated.count === 0) return false;

        if (baseMinor > 0) {
          await tx.$executeRaw`
            UPDATE "ExperienceSession"
            SET "paidMinor" = GREATEST(0, "paidMinor" - ${baseMinor}),
                version = version + 1
            WHERE id = ${payment.sessionId}
          `;
        }
        return true;
      });

      if (claimed) {
        released += 1;
        this.logger.debug(
          `Expired abandoned payment ${payment.id} (released ${baseMinor} minor)`,
        );
      }
    }
    return released;
  }
}
