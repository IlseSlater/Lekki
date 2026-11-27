/**
 * Pilot tender write-back: post a payment and tip against a Pilot check, then close it.
 *
 * Pilot has not published the call, so nothing here talks to Pilot. The port keeps one place
 * to wire it in when their docs exist (see docs/go-to-market/pilot-integration-blocked.md).
 * Until then the waiter closes the Pilot check by hand after guests pay.
 */

export interface PilotTender {
  /** Pilot's own check reference. */
  checkRef: string;
  /** Minor units (cents). */
  paidMinor: number;
  tipMinor: number;
  currency: string;
}

export type PilotTenderReadiness =
  | { ready: true }
  | { ready: false; reason: string };

/** Flips to ready only with Pilot's documented call and a certified test environment. */
export function pilotTenderReadiness(): PilotTenderReadiness {
  return {
    ready: false,
    reason: 'Pilot has not shared how to post a payment and close a check yet.',
  };
}

export class PilotTenderUnavailableError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'PilotTenderUnavailableError';
  }
}

/** Refuses while the call is unknown. Never reaches the network. */
export async function postPilotTender(_tender: PilotTender): Promise<never> {
  const readiness = pilotTenderReadiness();
  throw new PilotTenderUnavailableError(readiness.ready ? 'Not wired.' : readiness.reason);
}
