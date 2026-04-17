import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { LencoService } from './lenco.service';

describe('LencoService', () => {
  const createConfigService = (
    overrides: Partial<Record<string, string>> = {},
  ): ConfigService => {
    const values: Record<string, string | undefined> = {
      LENCO_API_KEY: 'api-key',
      LENCO_SECRET_KEY: 'secret-key',
      LENCO_ACCOUNT_ID: 'account-id',
      LENCO_WEBHOOK_SECRET: 'webhook-secret',
      LENCO_BASE_URL: 'https://api.lenco.co/access/v2',
      ...overrides,
    };

    return {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
  };

  it('verifies webhook signatures with LENCO_WEBHOOK_SECRET', () => {
    const service = new LencoService(createConfigService());
    service.onModuleInit();

    const payload = JSON.stringify({ event: 'collection.successful' });
    const signature = crypto
      .createHmac('sha512', 'webhook-secret')
      .update(payload)
      .digest('hex');

    expect(service.verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it('returns false when the provided signature is invalid', () => {
    const service = new LencoService(createConfigService());
    service.onModuleInit();

    expect(
      service.verifyWebhookSignature(
        JSON.stringify({ event: 'transfer.successful' }),
        'invalid-signature',
      ),
    ).toBe(false);
  });
});
