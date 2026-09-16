import assert from 'node:assert/strict';
import test from 'node:test';
import { paymentsActiveFromStatus, venueHasActivePaymentInstall } from './payments-active';

test('only active status is paymentsActive', () => {
  assert.equal(paymentsActiveFromStatus('active'), true);
  assert.equal(paymentsActiveFromStatus('ACTIVE'), true);
  assert.equal(paymentsActiveFromStatus('verified'), false);
  assert.equal(paymentsActiveFromStatus(''), false);
});

test('empty venueId fails closed without a query', async () => {
  let called = false;
  const prisma = {
    paymentConnectorInstall: {
      findFirst: async () => {
        called = true;
        return { id: 'pci_x' };
      },
    },
  };
  assert.equal(await venueHasActivePaymentInstall(prisma, '  '), false);
  assert.equal(called, false);
});

test('venueHasActivePaymentInstall is true only when a row is returned', async () => {
  const prisma = {
    paymentConnectorInstall: {
      findFirst: async (args: { where: { venueId: string; status: string } }) => {
        assert.equal(args.where.status, 'active');
        assert.equal(args.where.venueId, 'ven_1');
        return { id: 'pci_1' };
      },
    },
  };
  assert.equal(await venueHasActivePaymentInstall(prisma, 'ven_1'), true);
});

test('no install row → not active', async () => {
  const prisma = {
    paymentConnectorInstall: {
      findFirst: async () => null,
    },
  };
  assert.equal(await venueHasActivePaymentInstall(prisma, 'ven_1'), false);
});
