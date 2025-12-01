/**
 * useWallet Hook - Wallet state management and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAppAuth } from '../context/AuthProvider';
import {
  walletService,
  WalletBalance,
  WalletTransaction,
  WalletActivity,
  WithdrawalResponse,
  TopUpResponse,
  WalletPaymentResponse,
  MobileMoneyProvider,
} from '../services/wallet';

interface UseWalletReturn {
  // State
  balance: WalletBalance | null;
  activity: WalletActivity | null;
  transactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshBalance: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  refreshTransactions: (limit?: number) => Promise<void>;
  withdrawToMobileMoney: (
    amount: number,
    phone: string,
    provider: MobileMoneyProvider,
  ) => Promise<WithdrawalResponse>;
  withdrawToBank: (
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string,
  ) => Promise<WithdrawalResponse>;
  topUp: (
    amount: number,
    paymentMethod: 'mobile_money' | 'card',
    mobileNumber?: string,
    provider?: MobileMoneyProvider,
    email?: string,
  ) => Promise<TopUpResponse>;
  payWithWallet: (orderId: string, amount: number) => Promise<WalletPaymentResponse>;
  canPayWithWallet: (amount: number) => Promise<{
    canPay: boolean;
    reason?: string;
    currentBalance?: number;
    shortfall?: number;
  }>;
  ensureWallet: () => Promise<void>;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const { user } = useAppAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [activity, setActivity] = useState<WalletActivity | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex queries for real-time data
  const convexBalance = useQuery(
    api.wallet.getWalletBalance,
    user?._id ? { userId: user._id } : 'skip',
  );

  const convexActivity = useQuery(
    api.wallet.getWalletActivity,
    user?._id ? { userId: user._id } : 'skip',
  );

  const convexTransactions = useQuery(
    api.wallet.getWalletTransactions,
    user?._id ? { userId: user._id, limit: 50 } : 'skip',
  );

  // Convex mutations
  const ensureWalletMutation = useMutation(api.wallet.ensureWallet);
  const debitWalletMutation = useMutation(api.wallet.debitWallet);

  // Sync Convex data to local state
  useEffect(() => {
    if (convexBalance) {
      setBalance(convexBalance as WalletBalance);
    }
  }, [convexBalance]);

  useEffect(() => {
    if (convexActivity) {
      setActivity(convexActivity as unknown as WalletActivity);
    }
  }, [convexActivity]);

  useEffect(() => {
    if (convexTransactions) {
      setTransactions(convexTransactions as unknown as WalletTransaction[]);
    }
  }, [convexTransactions]);

  // Refresh balance from API
  const refreshBalance = useCallback(async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const data = await walletService.getBalance(user._id);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh balance');
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  // Refresh activity from API
  const refreshActivity = useCallback(async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      const data = await walletService.getActivity(user._id);
      setActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh activity');
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  // Refresh transactions from API
  const refreshTransactions = useCallback(
    async (limit?: number) => {
      if (!user?._id) return;
      try {
        setIsLoading(true);
        const data = await walletService.getTransactions(user._id, limit);
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh transactions');
      } finally {
        setIsLoading(false);
      }
    },
    [user?._id],
  );

  // Withdraw to mobile money
  const withdrawToMobileMoney = useCallback(
    async (
      amount: number,
      phone: string,
      provider: MobileMoneyProvider,
    ): Promise<WithdrawalResponse> => {
      if (!user?._id) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        setError(null);
        const result = await walletService.withdrawToMobileMoney(
          user._id,
          amount,
          phone,
          provider,
        );
        // Refresh balance after withdrawal
        await refreshBalance();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?._id, refreshBalance],
  );

  // Withdraw to bank
  const withdrawToBank = useCallback(
    async (
      amount: number,
      bankCode: string,
      accountNumber: string,
      accountName: string,
    ): Promise<WithdrawalResponse> => {
      if (!user?._id) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        setError(null);
        const result = await walletService.withdrawToBank(
          user._id,
          amount,
          bankCode,
          accountNumber,
          accountName,
        );
        // Refresh balance after withdrawal
        await refreshBalance();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?._id, refreshBalance],
  );

  // Top up wallet
  const topUp = useCallback(
    async (
      amount: number,
      paymentMethod: 'mobile_money' | 'card',
      mobileNumber?: string,
      provider?: MobileMoneyProvider,
      email?: string,
    ): Promise<TopUpResponse> => {
      if (!user?._id) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        setError(null);
        const result = await walletService.topUp(
          user._id,
          amount,
          paymentMethod,
          mobileNumber,
          provider,
          email,
        );
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Top-up failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?._id],
  );

  // Pay with wallet
  const payWithWallet = useCallback(
    async (orderId: string, amount: number): Promise<WalletPaymentResponse> => {
      if (!user?._id) throw new Error('User not authenticated');
      try {
        setIsLoading(true);
        setError(null);
        const result = await walletService.payWithWallet(user._id, orderId, amount);
        // Refresh balance after payment
        await refreshBalance();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Payment failed';
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [user?._id, refreshBalance],
  );

  // Check if can pay with wallet
  const canPayWithWallet = useCallback(
    async (amount: number) => {
      if (!user?._id) {
        return { canPay: false, reason: 'User not authenticated' };
      }
      if (!balance) {
        return { canPay: false, reason: 'Wallet not loaded' };
      }
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
      };
    },
    [user?._id, balance],
  );

  // Ensure wallet exists
  const ensureWallet = useCallback(async () => {
    if (!user?._id) return;
    try {
      await ensureWalletMutation({ userId: user._id });
      await refreshBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    }
  }, [user?._id, ensureWalletMutation, refreshBalance]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    balance,
    activity,
    transactions,
    isLoading,
    error,
    refreshBalance,
    refreshActivity,
    refreshTransactions,
    withdrawToMobileMoney,
    withdrawToBank,
    topUp,
    payWithWallet,
    canPayWithWallet,
    ensureWallet,
    clearError,
  };
}
