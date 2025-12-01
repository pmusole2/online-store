/**
 * Wallet Service - Handles wallet-related API calls
 */

import { apiService } from './api';

// Types
export type MobileMoneyProvider = 'mtn' | 'airtel' | 'zamtel';

export interface WalletBalance {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  totalSpent: number;
  hasWallet: boolean;
  isActive?: boolean;
  isFrozen?: boolean;
}

export interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit' | 'hold' | 'release' | 'refund';
  source: string;
  amount: number;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  createdAt: number;
  completedAt?: number;
  orderId?: string;
}

export interface WalletActivity {
  recentTransactions: WalletTransaction[];
  pendingWithdrawals: number;
  thisMonthEarnings: number;
  thisMonthWithdrawals: number;
}

export interface WithdrawalResponse {
  success: boolean;
  reference: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
  transactionId?: string;
  newBalance?: number;
}

export interface TopUpResponse {
  success: boolean;
  reference: string;
  message: string;
  checkoutUrl?: string;
}

export interface WalletPaymentResponse {
  success: boolean;
  reference: string;
  message: string;
  newBalance: number;
}

// Helper functions
export function formatWalletAmount(amount: number): string {
  return `K${amount.toLocaleString('en-ZM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getTransactionTypeLabel(type: WalletTransaction['type']): string {
  const labels: Record<WalletTransaction['type'], string> = {
    credit: 'Received',
    debit: 'Sent',
    hold: 'Held',
    release: 'Released',
    refund: 'Refunded',
  };
  return labels[type] || type;
}

export function getTransactionSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    sale: 'Sale Earnings',
    top_up_mobile_money: 'Mobile Money Top-up',
    top_up_card: 'Card Top-up',
    top_up_bank: 'Bank Transfer Top-up',
    refund: 'Order Refund',
    withdrawal_reversal: 'Withdrawal Reversed',
    admin_adjustment: 'Admin Adjustment',
    purchase: 'Purchase',
    withdrawal_mobile_money: 'Mobile Money Withdrawal',
    withdrawal_bank: 'Bank Withdrawal',
    escrow_hold: 'Escrow Hold',
    escrow_release: 'Sale Complete',
  };
  return labels[source] || source.replace(/_/g, ' ');
}

export function getTransactionIcon(
  type: WalletTransaction['type'],
  source: string,
): string {
  if (source.includes('withdrawal')) return 'bank-transfer-out';
  if (source.includes('top_up')) return 'bank-transfer-in';
  if (source === 'sale' || source === 'escrow_release') return 'cash-plus';
  if (source === 'purchase') return 'shopping';
  if (source === 'refund') return 'cash-refund';

  const icons: Record<WalletTransaction['type'], string> = {
    credit: 'arrow-down-circle',
    debit: 'arrow-up-circle',
    hold: 'lock',
    release: 'lock-open',
    refund: 'cash-refund',
  };
  return icons[type] || 'cash';
}

export function getTransactionColor(
  type: WalletTransaction['type'],
  status: WalletTransaction['status'],
): string {
  if (status === 'failed' || status === 'cancelled') return '#EF4444';
  if (status === 'pending') return '#F59E0B';

  const colors: Record<WalletTransaction['type'], string> = {
    credit: '#10B981',
    debit: '#EF4444',
    hold: '#F59E0B',
    release: '#10B981',
    refund: '#10B981',
  };
  return colors[type] || '#6B7280';
}

// Wallet service class
class WalletService {
  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    return apiService.get<WalletBalance>(`/wallet/balance/${userId}`);
  }

  /**
   * Get wallet activity (recent transactions + stats)
   */
  async getActivity(userId: string): Promise<WalletActivity> {
    return apiService.get<WalletActivity>(`/wallet/activity/${userId}`);
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(
    userId: string,
    limit?: number,
    type?: WalletTransaction['type'],
  ): Promise<WalletTransaction[]> {
    let url = `/wallet/transactions/${userId}`;
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (type) params.append('type', type);
    if (params.toString()) url += `?${params.toString()}`;
    return apiService.get<WalletTransaction[]>(url);
  }

  /**
   * Withdraw to mobile money
   */
  async withdrawToMobileMoney(
    userId: string,
    amount: number,
    phone: string,
    provider: MobileMoneyProvider,
    description?: string,
  ): Promise<WithdrawalResponse> {
    return apiService.post<WithdrawalResponse>('/wallet/withdraw/mobile-money', {
      userId,
      amount,
      phone,
      provider,
      description,
    });
  }

  /**
   * Withdraw to bank account
   */
  async withdrawToBank(
    userId: string,
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string,
    description?: string,
  ): Promise<WithdrawalResponse> {
    return apiService.post<WithdrawalResponse>('/wallet/withdraw/bank', {
      userId,
      amount,
      bankCode,
      accountNumber,
      accountName,
      description,
    });
  }

  /**
   * Top up wallet
   */
  async topUp(
    userId: string,
    amount: number,
    paymentMethod: 'mobile_money' | 'card',
    mobileNumber?: string,
    provider?: MobileMoneyProvider,
    email?: string,
  ): Promise<TopUpResponse> {
    return apiService.post<TopUpResponse>('/wallet/top-up', {
      userId,
      amount,
      paymentMethod,
      mobileNumber,
      provider,
      email,
    });
  }

  /**
   * Pay for order using wallet
   */
  async payWithWallet(
    userId: string,
    orderId: string,
    amount: number,
  ): Promise<WalletPaymentResponse> {
    return apiService.post<WalletPaymentResponse>('/wallet/pay', {
      userId,
      orderId,
      amount,
    });
  }

  /**
   * Ensure wallet exists
   */
  async ensureWallet(userId: string): Promise<{ walletId: string }> {
    return apiService.post<{ walletId: string }>(`/wallet/ensure/${userId}`, {});
  }

  /**
   * Check if user can pay with wallet
   */
  async canPayWithWallet(
    userId: string,
    amount: number,
  ): Promise<{
    canPay: boolean;
    reason?: string;
    currentBalance?: number;
    shortfall?: number;
    balanceAfterPayment?: number;
  }> {
    // This is handled via Convex directly for real-time data
    const balance = await this.getBalance(userId);
    if (!balance.hasWallet) {
      return { canPay: false, reason: 'No wallet found' };
    }
    if (balance.isFrozen) {
      return { canPay: false, reason: 'Wallet is frozen' };
    }
    if (balance.balance < amount) {
      return {
        canPay: false,
        reason: 'Insufficient balance',
        currentBalance: balance.balance,
        shortfall: amount - balance.balance,
      };
    }
    return {
      canPay: true,
      currentBalance: balance.balance,
      balanceAfterPayment: balance.balance - amount,
    };
  }
}

export const walletService = new WalletService();
