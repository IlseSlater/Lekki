import { Injectable, Logger } from '@nestjs/common';
import type { EmailCapability, EmailConnectorBinding } from '@lekki/contracts';
import { assertBindableEmailConnector } from './email-connector-registry';

/**
 * Platform-level email binding — one connector for the whole process, bound once
 * from env at startup. Unlike payments, this is never per-venue and never goes
 * through Setup or the secrets vault: RESEND_API_KEY present → Resend; absent → Fake.
 */
@Injectable()
export class EmailRuntimeService {
  private readonly logger = new Logger(EmailRuntimeService.name);
  private readonly binding: EmailConnectorBinding;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromAddress = process.env.RESEND_FROM_ADDRESS?.trim();

    if (apiKey && fromAddress) {
      const definition = assertBindableEmailConnector('resend');
      this.binding = definition.createBinding({
        config: { fromAddress },
        resolveSecret: async (secretKey) => (secretKey === 'apiKey' ? apiKey : undefined),
      });
      this.logger.log('Email connector bound: resend');
    } else {
      const definition = assertBindableEmailConnector('fake');
      this.binding = definition.createBinding({ config: {}, resolveSecret: async () => undefined });
      this.logger.warn(
        'RESEND_API_KEY / RESEND_FROM_ADDRESS not set — email connector bound: fake (nothing will actually send)',
      );
    }
  }

  capability(): EmailCapability {
    return this.binding.capability;
  }
}
