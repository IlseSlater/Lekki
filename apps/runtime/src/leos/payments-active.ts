/**
 * Guest-safe payment readiness — boolean only, never connector or vault details.
 * Fail closed: missing venue or non-active install is not active.
 */

export function paymentsActiveFromStatus(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'active';
}

export async function venueHasActivePaymentInstall(
  prisma: {
    paymentConnectorInstall: {
      findFirst: (args: {
        where: { venueId: string; status: string };
        select?: { id?: boolean };
      }) => Promise<{ id: string } | null>;
    };
  },
  venueId: string,
): Promise<boolean> {
  const id = venueId.trim();
  if (!id) return false;
  const row = await prisma.paymentConnectorInstall.findFirst({
    where: { venueId: id, status: 'active' },
    select: { id: true },
  });
  return !!row;
}
