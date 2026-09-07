import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { EventEnvelope, ResolvedContext } from '@lekki/contracts';
import { id } from '@lekki/contracts';
import { TransactionAggregate } from '@lekki/domain';
import { newCorrelationId, newEventId, newId } from '@lekki/shared';
import { ManualPaymentConnector } from '@lekki/connector-manual-payment';
import {
  PAYFAST_PAYMENT_CONNECTOR_ID,
  PayFastPaymentConnector,
} from '@lekki/connector-payfast';
import type { PaymentTenantRef } from '@lekki/runtime-capability';
import { LeosBootstrapService } from './leos-bootstrap.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../events/outbox.service';
import { SessionAccessService } from './session-access.service';
import { addMinor, fromMinor, subtractMinor, toMinor } from './money';
import {
  applyTipToBase,
  assertRemainingToPay,
} from './payment-invariants';
import {
  canReservePayment,
  paymentBaseMinor,
  paymentExpiresAt,
  sessionRemainingMinor,
  settlementCapacityAction,
} from './payment-session-cap';
import { equalShareForParticipant } from './equal-share-candidates';
import { MissingFieldError, PaymentConflictError, SessionNotActiveError } from './domain-errors';
import {
  assertExternalLineInput,
  externalLineBillMinorDelta,
  externalLineTotalMajor,
  type ExternalLineOrigin,
} from './append-external-line';
import {
  assertClaimLinesAllowed,
  resolveParticipantBySecret,
} from './participant-auth';
import { PaymentExpiryService } from './payment-expiry.service';

const RESTAURANT_PROFILE_FALLBACK = {
  profileId: 'profile-restaurant',
  profileVersion: '1.0.0',
};

@Injectable()
export class LeosService {
  private readonly logger = new Logger(LeosService.name);

  constructor(
    private readonly leos: LeosBootstrapService,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly sessionAccess: SessionAccessService,
    private readonly paymentExpiry: PaymentExpiryService,
  ) {}

  private paymentTenant(session: { organisationId: string; venueId: string }): PaymentTenantRef {
    return { organisationId: session.organisationId, venueId: session.venueId };
  }

  private envelope(
    eventName: string,
    organisationId: string,
    venueId: string | undefined,
    correlationId: string,
    payload: Record<string, unknown>,
  ): EventEnvelope {
    return {
      $schema: 'https://schemas.lekki.io/events/v1/envelope.json',
      eventId: newEventId(),
      eventName,
      version: '1.0.0',
      occurredAt: new Date().toISOString(),
      producer: 'lekki:runtime',
      correlationId: id.correlation(correlationId),
      organisationId: id.organisation(organisationId),
      venueId: venueId ? id.venue(venueId) : undefined,
      payload,
      privacy: { containsPii: false, classification: 'INTERNAL' },
    };
  }

  async resolveEntryAndStartSession(input: {
    token: string;
    displayName: string;
    identityId?: string;
    participantId?: string;
    participantSecret?: string;
  }) {
    const entry = await this.leos.entryRuntime.resolve({
      token: input.token,
      entryMethod: 'qr',
    });
    if (!entry.ok) throw new Error(entry.error);

    const context = await this.leos.contextRuntime.resolve(entry.value);
    if (!context.ok) throw new Error(context.error);

    const started = await this.leos.experienceRuntime.startOrResume(context.value, {
      displayName: input.displayName,
      identityId: input.identityId,
      resumeParticipantId: input.participantId,
      participantSecret: input.participantSecret,
    });
    if (!started.ok) throw new Error(started.error);
    const session = started.value.session;

    await this.prisma.$transaction(async (tx) => {
      await this.outbox.append(
        this.envelope(
          'ExperienceStarted',
          session.organisationId,
          session.venueId,
          session.correlationId,
          { sessionId: session.id },
        ),
        tx,
      );
      await this.outbox.append(
        this.envelope(
          'ExperienceContextResolved',
          session.organisationId,
          session.venueId,
          session.correlationId,
          {
            physicalContextId: session.physicalContextId,
            profileId: session.profileId,
          },
        ),
        tx,
      );
      if (started.value.joined) {
        await this.outbox.append(
          this.envelope(
            'ParticipantJoined',
            session.organisationId,
            session.venueId,
            session.correlationId,
            {
              sessionId: session.id,
              displayName: input.displayName,
            },
          ),
          tx,
        );
      }
    });

    const venue = await this.prisma.venue.findUnique({
      where: { id: session.venueId },
      select: {
        name: true,
        menuBrandEnabled: true,
        brandColour: true,
        guestDesignJson: true,
        currency: true,
      },
    });

    const guestDesign =
      venue?.guestDesignJson && typeof venue.guestDesignJson === 'object'
        ? venue.guestDesignJson
        : null;

    return {
      context: context.value,
      session,
      venueName: venue?.name ?? null,
      menuBrandEnabled: !!venue?.menuBrandEnabled,
      brandColour: venue?.brandColour || '#d7a14a',
      guestDesign,
      currency: venue?.currency ?? 'ZAR',
      joinedParticipantId: started.value.participantId,
      participantSecret: started.value.participantSecret,
    };
  }

  /** Studio Identity → Venue brand for Guest Continuity (menu half-moon). */
  async updateVenueBrand(input: {
    venueId: string;
    menuBrandEnabled?: boolean;
    brandColour?: string;
    venueName?: string;
    guestDesignJson?: Record<string, unknown>;
  }) {
    const colour = (input.brandColour || '').trim();
    const data: {
      menuBrandEnabled?: boolean;
      brandColour?: string;
      name?: string;
      guestDesignJson?: Prisma.InputJsonValue;
    } = {};
    if (typeof input.menuBrandEnabled === 'boolean') {
      data.menuBrandEnabled = input.menuBrandEnabled;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(colour)) {
      data.brandColour = colour;
    }
    const name = (input.venueName || '').trim();
    if (name) data.name = name;
    if (input.guestDesignJson) {
      data.guestDesignJson = input.guestDesignJson as Prisma.InputJsonValue;
    }
    const venue = await this.prisma.venue.update({
      where: { id: input.venueId },
      data,
      select: {
        id: true,
        name: true,
        menuBrandEnabled: true,
        brandColour: true,
        guestDesignJson: true,
      },
    });
    return venue;
  }

  /** Mint a unique entry token for Go Live — never reuse registry defaults. */
  async mintEntryToken(input: {
    organisationId: string;
    venueId: string;
    physicalContextId: string;
    profileId: string;
    profileVersion: string;
  }) {
    const token = `e_${newId('qr').replace(/^qr_/, '')}`;
    await this.prisma.entryToken.create({
      data: {
        token,
        organisationId: input.organisationId,
        venueId: input.venueId,
        physicalContextId: input.physicalContextId,
        profileId: input.profileId,
        profileVersion: input.profileVersion,
        active: true,
      },
    });
    return { token };
  }

  /** Resolve org venue + place for Studio Go Live mint. */
  async resolveMintContext(organisationId: string, placeCode?: string) {
    const venue = await this.prisma.venue.findFirst({
      where: { organisationId },
      orderBy: { createdAt: 'asc' },
    });
    if (!venue) throw new Error('Venue not found for organisation');

    const ctx =
      (placeCode
        ? await this.prisma.physicalContext.findFirst({
            where: { venueId: venue.id, code: placeCode.trim() },
          })
        : null) ??
      (await this.prisma.physicalContext.findFirst({
        where: { venueId: venue.id },
        orderBy: { code: 'asc' },
      }));
    if (!ctx) throw new Error('No place configured for this venue');

    const entry = await this.prisma.entryToken.findFirst({
      where: { venueId: venue.id },
      orderBy: { token: 'asc' },
    });

    return {
      organisationId,
      venueId: venue.id,
      physicalContextId: ctx.id,
      profileId: entry?.profileId ?? RESTAURANT_PROFILE_FALLBACK.profileId,
      profileVersion: entry?.profileVersion ?? RESTAURANT_PROFILE_FALLBACK.profileVersion,
      placeCode: ctx.code,
    };
  }

  async createTransaction(input: {
    sessionId: string;
    participantId?: string;
    participantSecret: string;
    lines: Array<{
      catalogueItemId: string;
      quantity: number;
      notes?: string;
      selectionsJson?: unknown;
    }>;
  }) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: input.sessionId },
      include: { participants: true },
    });
    if (!session) throw new Error('Session not found');
    if (session.status === 'completed' || session.status === 'archived') {
      throw new Error('Session is no longer active');
    }

    const participantId = input.participantId?.trim();
    if (!participantId) throw new Error('Participant required');
    await this.sessionAccess.assertGuestParticipant(
      input.sessionId,
      participantId,
      input.participantSecret,
    );

    const catalogueIds = [...new Set(input.lines.map((l) => l.catalogueItemId))];
    const catalogue = await this.prisma.restaurantCatalogItem.findMany({
      where: { venueId: session.venueId, id: { in: catalogueIds }, available: true },
    });
    const byId = new Map(catalogue.map((c) => [c.id, c]));

    const pricedLines = input.lines.map((line) => {
      if (line.quantity < 1) throw new Error('Invalid quantity');
      const item = byId.get(line.catalogueItemId);
      if (!item) throw new Error(`Unknown or unavailable item: ${line.catalogueItemId}`);
      return {
        catalogueItemId: item.id,
        label: item.label,
        quantity: line.quantity,
        unitPrice: Number(item.unitPrice),
        routingTags: item.routingTags,
        notes: line.notes?.trim() || undefined,
        selectionsJson: line.selectionsJson ?? undefined,
      };
    });

    const txId = newId('tx');
    const aggregate = TransactionAggregate.create({
      id: txId,
      sessionId: session.id,
      organisationId: session.organisationId,
      currency: catalogue[0]?.currency ?? 'ZAR',
      lines: pricedLines.map((line) => ({
        id: newId('txl'),
        catalogueItemId: line.catalogueItemId,
        label: line.label,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        routingTags: line.routingTags,
        participantId,
      })),
    });
    aggregate.commit();

    const fulfilments = await this.leos.capabilityRuntime.createFulfilmentsForTransaction({
      profileRef: {
        profileId: session.profileId,
        version: session.profileVersion,
      },
      transactionId: aggregate.id,
      sessionId: session.id,
      organisationId: session.organisationId,
      venueId: session.venueId,
      physicalContextId: session.physicalContextId,
      lines: aggregate.lines.map((line) => ({
        transactionLineId: line.id,
        quantity: line.quantity,
        routingTags: line.routingTags,
      })),
    });
    if (!fulfilments.ok) throw new Error(fulfilments.error);

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          id: aggregate.id,
          sessionId: session.id,
          organisationId: session.organisationId,
          status: aggregate.status,
          currency: aggregate.currency,
          total: aggregate.total,
          lines: {
            create: aggregate.lines.map((line, idx) => ({
              id: line.id,
              catalogueItemId: line.catalogueItemId,
              label: line.label,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              routingTags: line.routingTags,
              participantId: line.participantId ?? undefined,
              notes: pricedLines[idx]?.notes,
              selectionsJson: pricedLines[idx]?.selectionsJson ?? undefined,
            })),
          },
        },
      });

      for (const fulfilment of fulfilments.value) {
        await tx.fulfilment.create({
          data: {
            id: fulfilment.fulfilmentId,
            transactionId: aggregate.id,
            sessionId: session.id,
            organisationId: session.organisationId,
            stationId: fulfilment.stationId,
            status: fulfilment.status,
            lines: {
              create: fulfilment.lines.map((line) => ({
                id: newId('fl'),
                transactionLineId: line.transactionLineId,
                quantity: line.quantity,
                stationId: line.stationId,
              })),
            },
          },
        });
      }

      await tx.experienceSession.update({
        where: { id: session.id },
        data: {
          billMinor: { increment: toMinor(aggregate.total) },
          version: { increment: 1 },
        },
      });

      await this.outbox.append(
        this.envelope(
          'TransactionCreated',
          session.organisationId,
          session.venueId,
          session.correlationId,
          { transactionId: aggregate.id, total: aggregate.total, sessionId: session.id },
        ),
        tx,
      );

      for (const fulfilment of fulfilments.value) {
        await this.outbox.append(
          this.envelope(
            'FulfilmentCreated',
            session.organisationId,
            session.venueId,
            session.correlationId,
            {
              fulfilmentId: fulfilment.fulfilmentId,
              stationId: fulfilment.stationId,
              sessionId: session.id,
            },
          ),
          tx,
        );
      }
    });

    return { transactionId: aggregate.id, fulfilments: fulfilments.value };
  }

  /**
   * POS ingress — idempotent append of a till-punched line onto an open visit.
   * Does not create Fulfilment tickets: Pilot already owns kitchen for that punch.
   * Guest phone updates via TransactionCreated → existing Socket.IO rooms.
   */
  async appendExternalLine(input: {
    sessionId: string;
    externalRef: string;
    externalCheckId: string;
    catalogueItemId?: string | null;
    labelFallback: string;
    quantity: number;
    unitPrice: number;
    origin?: ExternalLineOrigin;
  }): Promise<{ transactionId: string; duplicated: boolean }> {
    assertExternalLineInput(input);
    const origin: ExternalLineOrigin = input.origin ?? 'staff_pos';
    const externalRef = input.externalRef.trim();
    const externalCheckId = input.externalCheckId.trim();
    const label = input.labelFallback.trim();
    const catalogueItemId = input.catalogueItemId?.trim() || null;

    const existing = await this.prisma.transactionLine.findUnique({
      where: { externalRef },
      select: { transactionId: true },
    });
    if (existing) {
      return { transactionId: existing.transactionId, duplicated: true };
    }

    const totalMajor = externalLineTotalMajor(input.quantity, input.unitPrice);
    const billDeltaMinor = externalLineBillMinorDelta(input.quantity, input.unitPrice);
    const txId = newId('tx');
    const lineId = newId('txl');
    let duplicated = false;
    let transactionId = txId;

    try {
      await this.prisma.$transaction(async (tx) => {
        const session = await tx.experienceSession.findUnique({
          where: { id: input.sessionId.trim() },
          select: {
            id: true,
            venueId: true,
            organisationId: true,
            status: true,
            correlationId: true,
          },
        });
        if (!session || session.status === 'completed' || session.status === 'archived') {
          throw new SessionNotActiveError();
        }

        // Re-check inside the txn in case two webhooks raced past the fast path.
        const raced = await tx.transactionLine.findUnique({
          where: { externalRef },
          select: { transactionId: true },
        });
        if (raced) {
          duplicated = true;
          transactionId = raced.transactionId;
          return;
        }

        await tx.transaction.create({
          data: {
            id: txId,
            sessionId: session.id,
            organisationId: session.organisationId,
            status: 'committed',
            currency: 'ZAR',
            total: totalMajor,
            lines: {
              create: {
                id: lineId,
                catalogueItemId,
                label,
                quantity: input.quantity,
                unitPrice: input.unitPrice,
                routingTags: [],
                origin,
                externalRef,
                externalCheckId,
              },
            },
          },
        });

        await tx.experienceSession.update({
          where: { id: session.id },
          data: {
            billMinor: { increment: billDeltaMinor },
            version: { increment: 1 },
          },
        });

        await this.outbox.append(
          this.envelope(
            'TransactionCreated',
            session.organisationId,
            session.venueId,
            session.correlationId,
            {
              transactionId: txId,
              total: totalMajor,
              sessionId: session.id,
              origin,
              externalCheckId,
              lines: [
                {
                  id: lineId,
                  label,
                  quantity: input.quantity,
                  unitPrice: input.unitPrice,
                  isUnmapped: catalogueItemId === null,
                },
              ],
            },
          ),
          tx,
        );
      });
    } catch (err) {
      // Concurrent webhook: unique(externalRef) won the race.
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        const again = await this.prisma.transactionLine.findUnique({
          where: { externalRef },
          select: { transactionId: true },
        });
        if (again) return { transactionId: again.transactionId, duplicated: true };
      }
      throw err;
    }

    return { transactionId, duplicated };
  }

  /**
   * Claim-from-table — re-stamp open lines to this guest (Minimum Decisions).
   * No allocation wizard · no new Payment.scope · Mine pay reuses participantId.
   */
  async claimLines(input: {
    sessionId: string;
    participantId: string | null;
    lineIds: string[];
    participantSecret: string;
  }) {
    const sessionId = input.sessionId?.trim();
    const participantId = input.participantId?.trim() || null;
    const lineIds = [...new Set((input.lineIds ?? []).map((id) => id?.trim()).filter(Boolean))];
    if (!sessionId) throw new Error('Session required');
    if (!lineIds.length) throw new Error('Pick at least one item');

    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        transactions: {
          where: { status: 'committed' },
          include: { lines: true },
        },
      },
    });
    if (!session) throw new Error('Session not found');

    const caller = resolveParticipantBySecret(session.participants, input.participantSecret);
    if (!caller) throw new Error('Invalid participant credentials');

    if (participantId && !session.participants.some((p) => p.id === participantId)) {
      throw new Error('Participant not on this visit');
    }

    const openLineIds = new Set(
      session.transactions.flatMap((t) => (t.lines ?? []).map((l) => l.id)),
    );
    const validIds = lineIds.filter((id) => openLineIds.has(id));
    if (!validIds.length) throw new Error('Those items aren’t on the open visit');

    const existing = await this.prisma.transactionLine.findMany({
      where: { id: { in: validIds } },
      select: { id: true, participantId: true },
    });
    assertClaimLinesAllowed(caller, participantId, existing);

    const undo = existing.map((row) => ({
      lineId: row.id,
      previousParticipantId: row.participantId ?? null,
    }));

    await this.prisma.transactionLine.updateMany({
      where: { id: { in: validIds } },
      data: { participantId },
    });

    const claimer = participantId
      ? session.participants.find((p) => p.id === participantId)
      : undefined;
    const claimerName = claimer?.displayName?.trim().split(/\s+/)[0] || (participantId ? 'Guest' : 'Unassigned');

    await this.outbox.append(
      this.envelope(
        'LinesClaimed',
        session.organisationId,
        session.venueId,
        session.correlationId,
        {
          sessionId: session.id,
          lineIds: validIds,
          participantId,
          claimerName,
          undo,
        },
      ),
    );

    return { ok: true as const, claimed: validIds.length, lineIds: validIds, undo };
  }

  async updateFulfilmentStatus(fulfilmentId: string, status: string) {
    const existing = await this.prisma.fulfilment.findUnique({
      where: { id: fulfilmentId },
      include: { session: true },
    });
    if (!existing) throw new Error('Fulfilment not found');

    const viaCapability = await this.leos.capabilityRuntime.updateFulfilmentStatus(
      {
        profileId: existing.session.profileId,
        version: existing.session.profileVersion,
      },
      fulfilmentId,
      status as 'created' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
    );
    if (!viaCapability.ok) throw new Error(viaCapability.error);

    const fulfilment = await this.prisma.fulfilment.update({
      where: { id: fulfilmentId },
      data: { status },
      include: { session: true },
    });

    await this.outbox.append(
      this.envelope(
        'FulfilmentStatusChanged',
        fulfilment.organisationId,
        fulfilment.session.venueId,
        fulfilment.session.correlationId,
        {
          fulfilmentId,
          status,
          sessionId: fulfilment.sessionId,
          stationId: fulfilment.stationId,
        },
      ),
    );

    return fulfilment;
  }

  async requestPayment(
    sessionId: string,
    options?: {
      tipAmount?: number;
      tipPercent?: number;
      scope?: 'visit' | 'mine' | 'equal';
      participantId?: string;
      participantSecret?: string;
    },
  ) {
    // Free abandoned gateway reservations before reading remaining capacity.
    await this.paymentExpiry.expireAbandoned();

    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      include: {
        participants: true,
        transactions: {
          where: { status: { in: ['committed', 'settled'] } },
          orderBy: { createdAt: 'desc' },
          include: { lines: true, payments: true },
        },
      },
    });
    if (!session) throw new Error('Session not found');

    const scope: 'visit' | 'mine' | 'equal' =
      options?.scope === 'mine' ? 'mine' : options?.scope === 'equal' ? 'equal' : 'visit';
    const participantId = options?.participantId?.trim() || '';
    if ((scope === 'mine' || scope === 'equal') && participantId) {
      const secret = options?.participantSecret?.trim();
      if (!secret) throw new MissingFieldError('participantSecret');
      await this.sessionAccess.assertGuestParticipant(sessionId, participantId, secret);
    }

    const tenant = this.paymentTenant(session);
    const committed = session.transactions.filter((t) => t.status === 'committed');
    if (!committed.length) throw new Error('No committed transaction');
    const transaction = committed[committed.length - 1];

    const remainingMinor = sessionRemainingMinor(session.billMinor, session.paidMinor);
    assertRemainingToPay(remainingMinor);

    const allPayments = committed.flatMap((t) => t.payments ?? []);
    const completed = allPayments.filter(
      (p) => p.status === 'completed' || p.status === 'settled',
    );

    let baseMinor = remainingMinor;
    if (scope === 'mine') {
      const allLines = committed.flatMap((t) => t.lines ?? []);
      const attributed = allLines.some((l) => !!l.participantId);
      if (attributed && participantId) {
        const mineOrderedMinor = addMinor(
          ...allLines
            .filter((l) => l.participantId === participantId)
            .map((l) => toMinor(Number(l.unitPrice)) * l.quantity),
        );
        const mineAlreadyPaidMinor = addMinor(
          ...completed
            .filter((p) => {
              if (p.scope !== 'mine') return false;
              const paidBy = (p as { participantId?: string | null }).participantId;
              return paidBy ? paidBy === participantId : false;
            })
            .map((p) => subtractMinor(Number(p.amount), Number(p.tipAmount ?? 0))),
        );
        baseMinor = Math.min(
          remainingMinor,
          Math.max(0, subtractMinor(mineOrderedMinor, mineAlreadyPaidMinor)),
        );
      }
      if (baseMinor <= 0) throw new Error('Nothing on your share to pay');
    } else if (scope === 'equal') {
      if (!participantId) throw new Error('Equal share needs a participant');
      const paidEqualIds = new Set(
        completed
          .filter(
            (p) =>
              p.scope === 'equal' && !!(p as { participantId?: string | null }).participantId,
          )
          .map((p) => (p as { participantId: string }).participantId),
      );
      const share = equalShareForParticipant(
        session.participants ?? [],
        committed,
        paidEqualIds,
        participantId,
      );
      if (share.distinct < 2) throw new Error('Equal share needs more than one guest');
      if (share.minePaid) throw new Error('Your equal share is already paid');
      const unpaidSlots = Math.max(1, share.unpaid);
      baseMinor = Math.min(
        remainingMinor,
        Math.round(remainingMinor / unpaidSlots),
      );
      if (baseMinor <= 0) throw new Error('Nothing left for an equal share');
    }

    if (
      !canReservePayment({
        billMinor: session.billMinor,
        paidMinor: session.paidMinor,
        version: session.version,
        versionRead: session.version,
        baseMinor,
      })
    ) {
      throw new PaymentConflictError();
    }

    const tipped = applyTipToBase(baseMinor, {
      tipPercent: options?.tipPercent,
      tipAmount: options?.tipAmount,
    });
    const tip = fromMinor(tipped.tipMinor);
    const baseAmount = fromMinor(tipped.baseMinor);
    const amount = fromMinor(tipped.chargeMinor);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const paymentResult = await this.leos.capabilityRuntime.createPayment(
      { profileId: session.profileId, version: session.profileVersion },
      {
        transactionId: id.transaction(transaction.id),
        amount,
        currency: transaction.currency,
        organisationId: session.organisationId,
        sessionId: session.id,
      },
      tenant,
    );
    if (!paymentResult.ok) throw new Error(paymentResult.error);

    const connector = await this.leos.capabilityRuntime.resolvePaymentConnector(
      {
        profileId: session.profileId,
        version: session.profileVersion,
      },
      tenant,
    );
    if (!connector.ok) throw new Error(connector.error);

    const scopedParticipant =
      (scope === 'mine' || scope === 'equal') && participantId ? participantId : null;

    await this.prisma.$transaction(async (tx) => {
      const reserved = await tx.$executeRaw`
        UPDATE "ExperienceSession"
        SET "paidMinor" = "paidMinor" + ${baseMinor},
            version = version + 1
        WHERE id = ${session.id}
          AND version = ${session.version}
          AND "paidMinor" + ${baseMinor} <= "billMinor"
      `;
      if (Number(reserved) === 0) throw new PaymentConflictError();

      await tx.payment.create({
        data: {
          id: paymentResult.value.paymentId,
          transactionId: transaction.id,
          sessionId: session.id,
          organisationId: session.organisationId,
          amount,
          tipAmount: tip,
          scope,
          participantId: scopedParticipant,
          currency: transaction.currency,
          status: paymentResult.value.status,
          reference: paymentResult.value.reference,
          connectorId: connector.value.connectorId,
          expiresAt:
            paymentResult.value.status === 'pending' ? paymentExpiresAt() : null,
        },
      });

      await this.outbox.append(
        this.envelope(
          'PaymentRequested',
          session.organisationId,
          session.venueId,
          session.correlationId,
          {
            paymentId: paymentResult.value.paymentId,
            transactionId: transaction.id,
            tipAmount: tip,
            scope,
            baseAmount,
            participantId: scopedParticipant,
          },
        ),
        tx,
      );
    });

    return paymentResult.value;
  }

  /** Release a reserved base when a pending payment fails or is refunded. */
  private async releaseSessionPaidMinor(
    tx: Prisma.TransactionClient,
    sessionId: string,
    baseMinor: number,
  ) {
    if (baseMinor <= 0) return;
    await tx.$executeRaw`
      UPDATE "ExperienceSession"
      SET "paidMinor" = GREATEST(0, "paidMinor" - ${baseMinor}),
          version = version + 1
      WHERE id = ${sessionId}
    `;
  }

  async completePayment(paymentId: string, options?: { fail?: boolean }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { session: true, transaction: true },
    });
    if (!payment) throw new Error('Payment not found');

    if (options?.fail) {
      const baseMinor = paymentBaseMinor(
        toMinor(Number(payment.amount)),
        toMinor(Number(payment.tipAmount ?? 0)),
      );
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: 'pending' },
          data: { status: 'failed' },
        });
        if (claimed.count === 1) {
          await this.releaseSessionPaidMinor(tx, payment.sessionId, baseMinor);
        } else {
          await tx.payment.updateMany({
            where: { id: paymentId, status: 'expired' },
            data: { status: 'failed' },
          });
        }
        await this.outbox.append(
          this.envelope(
            'PaymentFailed',
            payment.organisationId,
            payment.session.venueId,
            payment.session.correlationId,
            {
              paymentId,
              transactionId: payment.transactionId,
              sessionId: payment.sessionId,
              reason: 'Manual failure for proof path',
            },
          ),
          tx,
        );
      });
      return { paymentId, status: 'failed' };
    }

    if (payment.connectorId === PAYFAST_PAYMENT_CONNECTOR_ID) {
      throw new Error(
        'PayFast payments settle via ITN — do not call complete from the client',
      );
    }

    // In-process connectors (manual / fake) settle immediately.
    const connector = new ManualPaymentConnector();
    if (payment.connectorId === connector.connectorId) {
      await connector.completePayment(id.payment(paymentId));
    }

    return this.markPaymentSettled(paymentId, payment);
  }

  async refundPayment(paymentId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { session: true, transaction: true },
    });
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'completed' && payment.status !== 'settled') {
      throw new Error('Only completed payments can be refunded');
    }

    const refundAmount =
      typeof amount === 'number' && amount > 0 ? amount : Number(payment.amount);
    if (refundAmount <= 0) throw new Error('Refund amount must be positive');
    if (refundAmount > Number(payment.amount)) {
      throw new Error('Refund amount cannot exceed the payment');
    }

    const tenant = this.paymentTenant(payment.session);
    const result = await this.leos.capabilityRuntime.refundPayment(
      {
        profileId: payment.session.profileId,
        version: payment.session.profileVersion,
      },
      id.payment(paymentId),
      refundAmount,
      tenant,
    );
    if (!result.ok) throw new Error(result.error);
    if (result.value.status !== 'completed') {
      throw new Error('Refund was not completed by the payment connector');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'refunded' },
      });
      const baseMinor = paymentBaseMinor(
        toMinor(refundAmount),
        toMinor(Number(payment.tipAmount ?? 0)),
      );
      await this.releaseSessionPaidMinor(tx, payment.sessionId, baseMinor);
      await this.outbox.append(
        this.envelope(
          'PaymentFailed',
          payment.organisationId,
          payment.session.venueId,
          payment.session.correlationId,
          {
            paymentId,
            transactionId: payment.transactionId,
            sessionId: payment.sessionId,
            reason: `Refunded ${refundAmount}`,
          },
        ),
        tx,
      );
    });

    return {
      paymentId,
      refundedAmount: result.value.refundedAmount,
      status: 'refunded' as const,
    };
  }

  /**
   * PayFast ITN handler — signature + validate + settle/fail.
   * Idempotent: already-completed payments are acknowledged without re-emitting.
   */
  async handlePayFastItn(posted: Record<string, string>) {
    const paymentId = posted.m_payment_id;
    if (!paymentId) {
      return { ok: false, reason: 'Missing m_payment_id' };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { session: true, transaction: true },
    });
    if (!payment) {
      return { ok: false, reason: 'Payment not found' };
    }
    if (payment.connectorId !== PAYFAST_PAYMENT_CONNECTOR_ID) {
      return { ok: false, reason: 'Payment is not a PayFast payment' };
    }
    if (
      payment.status === 'completed' ||
      payment.status === 'failed' ||
      payment.status === 'needs_refund'
    ) {
      return { ok: true, status: payment.status, idempotent: true };
    }

    const resolved = await this.leos.capabilityRuntime.resolvePaymentConnector(
      {
        profileId: payment.session.profileId,
        version: payment.session.profileVersion,
      },
      this.paymentTenant(payment.session),
    );
    if (!resolved.ok) {
      return { ok: false, reason: resolved.error };
    }
    if (resolved.value.connectorId !== PAYFAST_PAYMENT_CONNECTOR_ID) {
      return { ok: false, reason: 'Active connector is not PayFast' };
    }

    const payfast = resolved.value as PayFastPaymentConnector;
    const itn = await payfast.handleItn(posted, Number(payment.amount));
    if (!itn.ok) {
      return { ok: false, reason: itn.reason };
    }

    if (itn.settlement === 'settled') {
      const settled = await this.markPaymentSettled(paymentId, payment);
      return { ok: true, status: settled.status };
    }

    if (itn.settlement === 'failed') {
      const baseMinor = paymentBaseMinor(
        toMinor(Number(payment.amount)),
        toMinor(Number(payment.tipAmount ?? 0)),
      );
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.payment.updateMany({
          where: { id: paymentId, status: 'pending' },
          data: { status: 'failed' },
        });
        if (claimed.count === 1) {
          await this.releaseSessionPaidMinor(tx, payment.sessionId, baseMinor);
        } else {
          await tx.payment.updateMany({
            where: { id: paymentId, status: 'expired' },
            data: { status: 'failed' },
          });
        }
        await this.outbox.append(
          this.envelope(
            'PaymentFailed',
            payment.organisationId,
            payment.session.venueId,
            payment.session.correlationId,
            {
              paymentId,
              transactionId: payment.transactionId,
              sessionId: payment.sessionId,
              reason: posted.payment_status ?? 'PayFast failed',
            },
          ),
          tx,
        );
      });
      return { ok: true, status: 'failed' };
    }

    return { ok: true, status: 'pending' };
  }

  private async markPaymentSettled(
    paymentId: string,
    payment: {
      organisationId: string;
      transactionId: string;
      sessionId: string;
      amount: number | { toString(): string };
      tipAmount?: number | null | { toString(): string };
      session: { venueId: string; correlationId: string };
    },
  ) {
    const baseMinor = paymentBaseMinor(
      toMinor(Number(payment.amount)),
      toMinor(Number(payment.tipAmount ?? 0)),
    );
    let status: 'completed' | 'needs_refund' = 'completed';

    await this.prisma.$transaction(async (tx) => {
      // Serialize concurrent late ITNs against the same payment.
      const locked = await tx.$queryRaw<Array<{ status: string }>>`
        SELECT status FROM "Payment" WHERE id = ${paymentId} FOR UPDATE
      `;
      const prior = locked[0];
      if (!prior) throw new Error('Payment not found');

      const sessionCap = await tx.experienceSession.findUnique({
        where: { id: payment.sessionId },
        select: { billMinor: true, paidMinor: true },
      });
      if (!sessionCap) throw new Error('Session not found');

      const action = settlementCapacityAction({
        priorStatus: prior.status,
        billMinor: sessionCap.billMinor,
        paidMinor: sessionCap.paidMinor,
        baseMinor,
      });
      if (action === 'idempotent') {
        status = prior.status === 'needs_refund' ? 'needs_refund' : 'completed';
        return;
      }

      // Expiry (or any release) already dropped the reservation — re-take it.
      // Pending still holds capacity; do not increment again.
      if (prior.status !== 'pending' && baseMinor > 0) {
        const rows = await tx.$executeRaw`
          UPDATE "ExperienceSession"
          SET "paidMinor" = "paidMinor" + ${baseMinor},
              version = version + 1
          WHERE id = ${payment.sessionId}
            AND "paidMinor" + ${baseMinor} <= "billMinor"
        `;
        if (Number(rows) === 0) {
          status = 'needs_refund';
        }
      } else if (action === 'overpayment') {
        status = 'needs_refund';
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: { status },
      });

      if (status === 'needs_refund') {
        this.logger.error(
          `Payment ${paymentId} settled at the gateway after reservation release, but session ${payment.sessionId} has no capacity left — flagged needs_refund (row 10)`,
        );
        await this.outbox.append(
          this.envelope(
            'PaymentOverpayment',
            payment.organisationId,
            payment.session.venueId,
            payment.session.correlationId,
            {
              paymentId,
              transactionId: payment.transactionId,
              sessionId: payment.sessionId,
              baseMinor,
              billMinor: sessionCap.billMinor,
              paidMinor: sessionCap.paidMinor,
              priorStatus: prior.status,
              reason:
                'Gateway settled after expiry release; session capacity already taken — manual refund required',
            },
          ),
          tx,
        );
        return;
      }

      const afterCap = await tx.experienceSession.findUnique({
        where: { id: payment.sessionId },
        select: { billMinor: true, paidMinor: true },
      });
      const pendingLeft = await tx.payment.count({
        where: { sessionId: payment.sessionId, status: 'pending' },
      });
      const fullyCovered =
        !!afterCap &&
        afterCap.billMinor > 0 &&
        afterCap.paidMinor >= afterCap.billMinor &&
        pendingLeft === 0;

      if (fullyCovered) {
        await tx.transaction.updateMany({
          where: { sessionId: payment.sessionId, status: 'committed' },
          data: { status: 'settled' },
        });
      }

      await this.outbox.append(
        this.envelope(
          'PaymentCompleted',
          payment.organisationId,
          payment.session.venueId,
          payment.session.correlationId,
          {
            paymentId,
            transactionId: payment.transactionId,
            sessionId: payment.sessionId,
            fullyCovered,
            retaken: prior.status !== 'pending',
          },
        ),
        tx,
      );
    });

    return { paymentId, status };
  }

  async requestAssistance(input: {
    sessionId: string;
    kind?: string;
    message?: string;
  }) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: input.sessionId },
    });
    if (!session) throw new Error('Session not found');

    const enabled = await this.leos.profileEngine.resolveCapability(
      { profileId: session.profileId, version: session.profileVersion },
      'assistance.request',
    );
    if (!enabled.ok || !enabled.value) {
      throw new Error('Assistance capability not enabled for profile');
    }

    const kind = normalizeAssistanceKind(input.kind);

    // One open assistance per kind per session (service and manager can coexist).
    const existingOpen = await this.prisma.assistanceRequest.findFirst({
      where: {
        sessionId: session.id,
        kind,
        status: { in: ['open', 'acknowledged'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existingOpen) return existingOpen;

    const request = await this.prisma.assistanceRequest.create({
      data: {
        id: newId('asst'),
        sessionId: session.id,
        organisationId: session.organisationId,
        venueId: session.venueId,
        kind,
        message: input.message,
        status: 'open',
      },
    });

    await this.outbox.append(
      this.envelope(
        'AssistanceRequested',
        session.organisationId,
        session.venueId,
        session.correlationId,
        {
          assistanceId: request.id,
          sessionId: session.id,
          kind: request.kind,
          status: 'open',
        },
      ),
    );

    return request;
  }

  async listAssistance(opts?: { sessionId?: string; kind?: string }) {
    const kind = opts?.kind ? normalizeAssistanceKind(opts.kind) : undefined;
    return this.prisma.assistanceRequest.findMany({
      where: {
        status: { in: ['open', 'acknowledged'] },
        ...(opts?.sessionId ? { sessionId: opts.sessionId } : {}),
        ...(kind ? { kind } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async acknowledgeAssistance(id: string, opts?: { staffPresent?: boolean }) {
    const existing = await this.prisma.assistanceRequest.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!existing) throw new Error('Assistance not found');
    if (!opts?.staffPresent && existing.kind !== 'manager') {
      throw new Error('Staff authentication required for service assistance');
    }
    if (existing.status === 'resolved') return existing;
    if (existing.status === 'acknowledged') return existing;

    const request = await this.prisma.assistanceRequest.update({
      where: { id },
      data: { status: 'acknowledged' },
    });

    if (existing.session) {
      await this.outbox.append(
        this.envelope(
          'AssistanceAcknowledged',
          existing.organisationId,
          existing.venueId,
          existing.session.correlationId,
          {
            assistanceId: id,
            sessionId: existing.sessionId,
            kind: existing.kind,
            status: 'acknowledged',
          },
        ),
      );
    }

    return request;
  }

  async resolveAssistance(id: string, opts?: { staffPresent?: boolean }) {
    const existing = await this.prisma.assistanceRequest.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!existing) throw new Error('Assistance not found');
    if (!opts?.staffPresent && existing.kind !== 'manager') {
      throw new Error('Staff authentication required for service assistance');
    }
    const request = await this.prisma.assistanceRequest.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date() },
    });

    if (existing.session) {
      await this.outbox.append(
        this.envelope(
          'AssistanceResolved',
          existing.organisationId,
          existing.venueId,
          existing.session.correlationId,
          {
            assistanceId: id,
            sessionId: existing.sessionId,
            kind: existing.kind,
          },
        ),
      );
    }

    return request;
  }

  async leaveSession(input: {
    sessionId: string;
    participantId: string;
    participantSecret: string;
  }) {
    await this.sessionAccess.assertGuestParticipant(
      input.sessionId,
      input.participantId,
      input.participantSecret,
    );
    const result = await this.leos.experienceRuntime.departParticipant(
      input.sessionId,
      input.participantId,
    );
    if (!result.ok) throw new Error(result.error);

    if (result.value.closed) {
      await this.outbox.append(
        this.envelope(
          'SessionCompleted',
          result.value.session.organisationId,
          result.value.session.venueId,
          result.value.session.correlationId,
          { sessionId: input.sessionId },
        ),
      );
    }

    return { closed: result.value.closed, session: result.value.session };
  }

  async closeSession(sessionId: string) {
    const completed = await this.leos.experienceRuntime.completeSession(sessionId);
    if (!completed.ok) throw new Error(completed.error);

    await this.outbox.append(
      this.envelope(
        'SessionCompleted',
        completed.value.organisationId,
        completed.value.venueId,
        completed.value.correlationId,
        { sessionId },
      ),
    );

    return completed.value;
  }

  getProfileEngine() {
    return this.leos.profileEngine;
  }
}

/** Locked assistance kinds for LEOS dual help (Waiter vs Manager). */
export type AssistanceKind = 'service' | 'manager';

export function normalizeAssistanceKind(kind?: string): AssistanceKind {
  const k = (kind ?? 'service').toLowerCase().trim();
  if (k === 'manager' || k === 'owner' || k === 'escalate') return 'manager';
  return 'service';
}
