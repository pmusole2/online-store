import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  LencoApiError,
  LencoCardCollectionRequest,
  LencoCollectionResponse,
  LencoMobileMoneyCollectionRequest,
} from '../dto/payment.dto';

interface LencoConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  accountId: string;
  webhookSecret: string;
  isConfigured: boolean;
}

@Injectable()
export class LencoService implements OnModuleInit {
  private config: LencoConfig = {
    apiKey: '',
    secretKey: '',
    baseUrl: 'https://api.lenco.co/access/v2',
    accountId: '',
    webhookSecret: '',
    isConfigured: false,
  };

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('LENCO_API_KEY');
    const secretKey = this.configService.get<string>('LENCO_SECRET_KEY');
    const accountId = this.configService.get<string>('LENCO_ACCOUNT_ID');
    const webhookSecret = this.configService.get<string>('LENCO_SECRET_KEY');

    if (apiKey && secretKey && accountId) {
      this.config = {
        apiKey,
        secretKey,
        baseUrl:
          this.configService.get<string>('LENCO_BASE_URL') ||
          'https://api.lenco.co/access/v2',
        accountId,
        webhookSecret: webhookSecret || '',
        isConfigured: true,
      };
      console.log('✅ Lenco payment gateway configured');
    } else {
      console.warn(
        '⚠️ Lenco payment gateway not configured - missing credentials',
      );
    }
  }

  isConfigured(): boolean {
    return this.config.isConfigured;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.config.isConfigured) {
      throw new HttpException(
        'Payment gateway not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      console.log(`📤 [Lenco] ${method} ${endpoint}`);
      if (body) {
        console.log(`📤 [Lenco] Request Body:`, JSON.stringify(body, null, 2));
      }

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      console.log(`📥 [Lenco] Status: ${response.status}`);
      console.log(`📥 [Lenco] Response:`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        const error = data as LencoApiError;
        console.error(`❌ [Lenco] Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          error: error,
        });
        throw new HttpException(
          error.message || 'Payment request failed',
          response.status,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        console.error(`❌ [Lenco] HTTP Exception:`, error.message);
        throw error;
      }

      console.error('❌ [Lenco] API error:', error);
      throw new HttpException(
        'Payment service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Initiate mobile money collection
   * POST /collections/mobile-money
   */
  async collectMobileMoney(
    request: Omit<LencoMobileMoneyCollectionRequest, 'accountId'>,
  ): Promise<LencoCollectionResponse> {
    return this.makeRequest<LencoCollectionResponse>(
      'POST',
      '/collections/mobile-money',
      {
        accountId: this.config.accountId,
        ...request,
      },
    );
  }

  /**
   * Initiate card payment collection
   * POST /collections/card
   */
  async collectCard(
    request: Omit<LencoCardCollectionRequest, 'accountId'>,
  ): Promise<LencoCollectionResponse> {
    return this.makeRequest<LencoCollectionResponse>(
      'POST',
      '/collections/card',
      {
        accountId: this.config.accountId,
        ...request,
      },
    );
  }

  /**
   * Get collection by ID
   * GET /collections/:id
   */
  async getCollection(collectionId: string): Promise<LencoCollectionResponse> {
    return this.makeRequest<LencoCollectionResponse>(
      'GET',
      `/collections/${collectionId}`,
    );
  }

  /**
   * Get collection status by reference
   * GET /collections/status/:reference
   */
  async getCollectionByReference(
    reference: string,
  ): Promise<LencoCollectionResponse> {
    return this.makeRequest<LencoCollectionResponse>(
      'GET',
      `/collections/status/${reference}`,
    );
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn('🔐 Webhook secret not configured - skipping verification');
      return true;
    }

    if (!signature) {
      console.warn('🔐 No signature provided in webhook header');
      return false;
    }

    // Lenco uses HMAC SHA512 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha512', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.warn('🔐 Signature mismatch');
      console.log('🔐 Payload length:', payload.length);
      console.log(
        '🔐 Expected signature:',
        expectedSignature.substring(0, 32) + '...',
      );
      console.log('🔐 Received signature:', signature.substring(0, 32) + '...');
    } else {
      console.log('🔐 Webhook signature verified ✓');
    }

    return isValid;
  }

  /**
   * Get available banks
   * GET /banks
   */
  async getBanks(): Promise<{
    status: boolean;
    data: Array<{ code: string; name: string }>;
  }> {
    return this.makeRequest<{
      status: boolean;
      data: Array<{ code: string; name: string }>;
    }>('GET', '/banks');
  }

  /**
   * Resolve bank account for verification
   * POST /resolve/bank-account
   */
  async resolveBankAccount(
    bankCode: string,
    accountNumber: string,
  ): Promise<{
    status: boolean;
    data: { accountNumber: string; accountName: string; bankCode: string };
  }> {
    return this.makeRequest('POST', '/resolve/bank-account', {
      bankCode,
      accountNumber,
    });
  }

  /**
   * Resolve mobile money account
   * POST /resolve/mobile-money
   */
  async resolveMobileMoney(
    phoneNumber: string,
    network: 'mtn' | 'airtel' | 'zamtel',
  ): Promise<{
    status: boolean;
    data: { phoneNumber: string; accountName: string; network: string };
  }> {
    return this.makeRequest('POST', '/resolve/mobile-money', {
      phoneNumber,
      network,
    });
  }

  // ============================================================================
  // TRANSFER (PAYOUT) METHODS
  // ============================================================================

  /**
   * Transfer to mobile money account (payout/withdrawal)
   * POST /transfers/mobile-money
   */
  async transferToMobileMoney(request: {
    phone: string;
    operator: 'mtn' | 'airtel' | 'zamtel';
    amount: number;
    currency?: string;
    reference: string;
    narration?: string;
  }): Promise<LencoTransferResponse> {
    return this.makeRequest<LencoTransferResponse>(
      'POST',
      '/transfers/mobile-money',
      {
        accountId: this.config.accountId,
        phone: request.phone,
        operator: request.operator,
        amount: request.amount,
        currency: request.currency || 'ZMW',
        reference: request.reference,
        narration: request.narration || 'Wallet withdrawal',
      },
    );
  }

  /**
   * Transfer to bank account (payout/withdrawal)
   * POST /transfers/bank
   */
  async transferToBank(request: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    currency?: string;
    reference: string;
    narration?: string;
  }): Promise<LencoTransferResponse> {
    return this.makeRequest<LencoTransferResponse>('POST', '/transfers/bank', {
      accountId: this.config.accountId,
      bankCode: request.bankCode,
      accountNumber: request.accountNumber,
      accountName: request.accountName,
      amount: request.amount,
      currency: request.currency || 'ZMW',
      reference: request.reference,
      narration: request.narration || 'Wallet withdrawal',
    });
  }

  /**
   * Get transfer status by ID
   * GET /transfers/:id
   */
  async getTransfer(transferId: string): Promise<LencoTransferResponse> {
    return this.makeRequest<LencoTransferResponse>(
      'GET',
      `/transfers/${transferId}`,
    );
  }

  /**
   * Get transfer status by reference
   * GET /transfers/status/:reference
   */
  async getTransferByReference(
    reference: string,
  ): Promise<LencoTransferResponse> {
    return this.makeRequest<LencoTransferResponse>(
      'GET',
      `/transfers/status/${reference}`,
    );
  }

  /**
   * Get account balance
   * GET /accounts/:accountId/balance
   */
  async getAccountBalance(): Promise<{
    status: boolean;
    data: {
      accountId: string;
      balance: number;
      currency: string;
      availableBalance: number;
    };
  }> {
    return this.makeRequest(
      'GET',
      `/accounts/${this.config.accountId}/balance`,
    );
  }
}

// Transfer response type
export interface LencoTransferResponse {
  status: boolean;
  message?: string;
  data: {
    id: string;
    reference: string;
    amount: number;
    fee: number;
    currency: string;
    status: 'pending' | 'processing' | 'successful' | 'failed';
    narration?: string;
    recipient?: {
      name?: string;
      accountNumber?: string;
      bankCode?: string;
      phone?: string;
      operator?: string;
    };
    createdAt?: string;
    completedAt?: string;
  };
}
