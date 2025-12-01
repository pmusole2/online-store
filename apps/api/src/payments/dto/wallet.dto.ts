import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Mobile money providers
export type MobileMoneyProvider = 'mtn' | 'airtel' | 'zamtel';

// Withdrawal request - Mobile Money
export class WithdrawToMobileMoneyDto {
  @ApiProperty({ description: 'User ID from Convex' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount to withdraw in ZMW' })
  @IsNumber()
  @Min(1, { message: 'Minimum withdrawal amount is K1' })
  amount: number;

  @ApiProperty({ description: 'Mobile money phone number' })
  @IsString()
  @Matches(/^260[0-9]{9}$/, {
    message: 'Phone number must be in format 260XXXXXXXXX',
  })
  phone: string;

  @ApiProperty({ enum: ['mtn', 'airtel', 'zamtel'] })
  @IsEnum(['mtn', 'airtel', 'zamtel'])
  provider: MobileMoneyProvider;

  @ApiPropertyOptional({ description: 'Description for the withdrawal' })
  @IsOptional()
  @IsString()
  description?: string;
}

// Withdrawal request - Bank Account
export class WithdrawToBankDto {
  @ApiProperty({ description: 'User ID from Convex' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount to withdraw in ZMW' })
  @IsNumber()
  @Min(1, { message: 'Minimum withdrawal amount is K1' })
  amount: number;

  @ApiProperty({ description: 'Bank code' })
  @IsString()
  bankCode: string;

  @ApiProperty({ description: 'Bank account number' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  accountName: string;

  @ApiPropertyOptional({ description: 'Description for the withdrawal' })
  @IsOptional()
  @IsString()
  description?: string;
}

// Top-up wallet request
export class TopUpWalletDto {
  @ApiProperty({ description: 'User ID from Convex' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Amount to top up in ZMW' })
  @IsNumber()
  @Min(1, { message: 'Minimum top-up amount is K1' })
  amount: number;

  @ApiProperty({ enum: ['mobile_money', 'card'] })
  @IsEnum(['mobile_money', 'card'])
  paymentMethod: 'mobile_money' | 'card';

  // Card payment specific
  @ApiPropertyOptional({ description: 'Email for card payment receipt' })
  @IsOptional()
  @IsString()
  email?: string;

  // Mobile money specific
  @ApiPropertyOptional({ description: 'Mobile money phone number' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ enum: ['mtn', 'airtel', 'zamtel'] })
  @IsOptional()
  @IsEnum(['mtn', 'airtel', 'zamtel'])
  provider?: MobileMoneyProvider;
}

// Pay with wallet request
export class PayWithWalletDto {
  @ApiProperty({ description: 'User ID from Convex' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Order ID from Convex' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Amount to pay in ZMW' })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

// Withdrawal response
export class WithdrawalResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  reference: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'] })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  newBalance?: number;
}

// Wallet balance response
export class WalletBalanceDto {
  @ApiProperty()
  balance: number;

  @ApiProperty()
  pendingBalance: number;

  @ApiProperty()
  totalEarned: number;

  @ApiProperty()
  totalWithdrawn: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  hasWallet: boolean;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  isFrozen?: boolean;
}

// Wallet transaction item
export class WalletTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: 'credit' | 'debit' | 'hold' | 'release' | 'refund';

  @ApiProperty()
  source: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  @ApiProperty()
  description: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  createdAt: number;

  @ApiPropertyOptional()
  completedAt?: number;
}

// Wallet activity response
export class WalletActivityDto {
  @ApiProperty({ type: [WalletTransactionDto] })
  recentTransactions: WalletTransactionDto[];

  @ApiProperty()
  pendingWithdrawals: number;

  @ApiProperty()
  thisMonthEarnings: number;

  @ApiProperty()
  thisMonthWithdrawals: number;
}
