import { Injectable } from '@nestjs/common';
import type { EventEnvelope, ResolvedContext } from '@lekki/contracts';
import { id } from '@lekki/contracts';
import { TransactionAggregate, equalShareState } from '@lekki/domain';
import { newCorrelationId, newEventId, newId } from '@lekki/shared';
import { ManualPaymentConnector } from '@lekki/connector-manual-payment';
import {
  PAYFAST_PAYMENT_CONNECTOR_ID,
  PayFastPaymentConnector,
} from '@lekki/connector-payfast';
import { LeosBootstrapService } from './leos-bootstrap.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxService } from '../events/outbox.service';

@Injectable()
export class LeosService {
  constructor(
    private readonly leos: LeosBootstrapService,
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

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
      select: { name: true },
    });

    return {
      context: context.value,
      session,
      venueName: venue?.name ?? null,
      joinedParticipantId: started.value.participantId,
    };
  }

  async createTransaction(input: {
    sessionId: string;
    participantId?: string;
    lines: Array<{
      catalogueItemId: string;
      label: string;
      quantity: number;
      unitPrice: number;
      routingTags: string[];
    }>;
  }) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: input.sessionId },
      include: { participants: true },
    });
    if (!session) throw new Error('Session not found');

    const participantId =
      input.participantId &&
      session.participants.some((p) => p.id === input.participantId)
        ? input.participantId
        : session.participants[0]?.id ?? null;

    const txId = newId('tx');
    const aggregate = TransactionAggregate.create({
      id: txId,
      sessionId: session.id,
      organisationId: session.organisationId,
      currency: 'ZAR',
      lines: input.lines.map((line) => ({
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
            create: aggregate.lines.map((line) => ({
              id: line.id,
              catalogueItemId: line.catalogueItemId,
              label: line.label,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              routingTags: line.routingTags,
              participantId: line.participantId ?? undefined,
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
   * Claim-from-table — re-stamp open lines to this guest (Minimum Decisions).
   * No allocation wizard · no new Payment.scope · Mine pay reuses participantId.
   */
  async claimLines(input: { sessionId: string; participantId: string | null; lineIds: string[] }) {
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
      scope?: 'visit' | 'mine' | 'equal';
      participantId?: string;
    },
  ) {
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
    const transaction = session.transactions.find((t) => t.status === 'committed') ?? session.transactions[0];
    if (!transaction) throw new Error('No committed transaction');
    if (transaction.status === 'settled') throw new Error('Already settled');

    const tip = Math.max(0, Number(options?.tipAmount) || 0);
    const rawScope = options?.scope;
    const scope: 'visit' | 'mine' | 'equal' =
      rawScope === 'mine' ? 'mine' : rawScope === 'equal' ? 'equal' : 'visit';
    const participantId = options?.participantId?.trim() || '';

    const completed = (transaction.payments ?? []).filter(
      (p) => p.status === 'completed' || p.status === 'settled',
    );
    const paidTowardTx = completed.reduce(
      (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.tipAmount ?? 0)),
      0,
    );
    const remainingVisit = Math.max(
      0,
      Math.round((Number(transaction.total) - paidTowardTx) * 100) / 100,
    );
    if (remainingVisit <= 0) throw new Error('Nothing left to pay');

    let base = remainingVisit;
    if (scope === 'mine') {
      const attributed = transaction.lines.some((l) => !!l.participantId);
      if (attributed && participantId) {
        const mineOrdered = transaction.lines
          .filter((l) => l.participantId === participantId)
          .reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitPrice), 0);
        const mineAlreadyPaid = completed
          .filter((p) => {
            if (p.scope !== 'mine') return false;
            const paidBy = (p as { participantId?: string | null }).participantId;
            // Attributed table: only this guest’s mine payments count toward their share.
            if (paidBy) return paidBy === participantId;
            // Legacy mine rows without participantId — ignore when lines are attributed.
            return false;
          })
          .reduce(
            (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.tipAmount ?? 0)),
            0,
          );
        const mineRemaining = Math.max(
          0,
          Math.round((mineOrdered - mineAlreadyPaid) * 100) / 100,
        );
        base = Math.min(remainingVisit, mineRemaining);
      }
      // else: legacy / unattributed lines → mine ≡ remaining visit (single-guest calm)
      if (base <= 0) throw new Error('Nothing on your share to pay');
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
      const share = equalShareState(session.participants ?? [], paidEqualIds, participantId);
      if (share.distinct < 2) throw new Error('Equal share needs more than one guest');
      if (share.minePaid) {
        throw new Error('Your equal share is already paid');
      }
      const unpaidSlots = Math.max(1, share.unpaid);
      base = Math.min(
        remainingVisit,
        Math.round((remainingVisit / unpaidSlots) * 100) / 100,
      );
      if (base <= 0) throw new Error('Nothing left for an equal share');
    }

    const amount = Math.round((base + tip) * 100) / 100;

    const paymentResult = await this.leos.capabilityRuntime.createPayment(
      { profileId: session.profileId, version: session.profileVersion },
      {
        transactionId: id.transaction(transaction.id),
        amount,
        currency: transaction.currency,
        organisationId: session.organisationId,
        sessionId: session.id,
      },
    );
    if (!paymentResult.ok) throw new Error(paymentResult.error);

    const connector = await this.leos.capabilityRuntime.resolvePaymentConnector({
      profileId: session.profileId,
      version: session.profileVersion,
    });
    if (!connector.ok) throw new Error(connector.error);

    const scopedParticipant =
      (scope === 'mine' || scope === 'equal') && participantId ? participantId : null;

    await this.prisma.$transaction(async (tx) => {
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
            baseAmount: base,
            participantId: scopedParticipant,
          },
        ),
        tx,
      );
    });

    return paymentResult.value;
  }

  async completePayment(paymentId: string, options?: { fail?: boolean }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { session: true, transaction: true },
    });
    if (!payment) throw new Error('Payment not found');

    if (options?.fail) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'failed' },
        });
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
    if (payment.status === 'completed' || payment.status === 'failed') {
      return { ok: true, status: payment.status, idempotent: true };
    }

    const resolved = await this.leos.capabilityRuntime.resolvePaymentConnector({
      profileId: payment.session.profileId,
      version: payment.session.profileVersion,
    });
    if (!resolved.ok) {
      return { ok: false, reason: resolved.error };
    }
    if (resolved.value.connectorId !== PAYFAST_PAYMENT_CONNECTOR_ID) {
      return { ok: false, reason: 'Active connector is not PayFast' };
    }

    const payfast = resolved.value as PayFastPaymentConnector;
    const itn = await payfast.handleItn(posted, payment.amount);
    if (!itn.ok) {
      return { ok: false, reason: itn.reason };
    }

    if (itn.settlement === 'settled') {
      await this.markPaymentSettled(paymentId, payment);
      return { ok: true, status: 'completed' };
    }

    if (itn.settlement === 'failed') {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'failed' },
        });
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
      amount: number;
      tipAmount?: number | null;
      session: { venueId: string; correlationId: string };
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'completed' },
      });

      const siblings = await tx.payment.findMany({
        where: {
          transactionId: payment.transactionId,
          status: { in: ['completed', 'settled'] },
        },
      });
      const transaction = await tx.transaction.findUnique({
        where: { id: payment.transactionId },
      });
      const paidTowardTx = siblings.reduce(
        (sum, p) => sum + Math.max(0, Number(p.amount) - Number(p.tipAmount ?? 0)),
        0,
      );
      const fullyCovered =
        !!transaction && paidTowardTx + 0.001 >= Number(transaction.total);

      if (fullyCovered) {
        await tx.transaction.update({
          where: { id: payment.transactionId },
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
          },
        ),
        tx,
      );
    });

    return { paymentId, status: 'completed' };
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
