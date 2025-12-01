import { IsString, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConversationMessageDto {
  @ApiProperty({ enum: ['buyer', 'seller', 'moderator'] })
  @IsEnum(['buyer', 'seller', 'moderator'])
  sender: 'buyer' | 'seller' | 'moderator';

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  timestamp: string;
}

export class AnalyzeDisputeDto {
  @ApiProperty({ description: 'Dispute ID from Convex' })
  @IsString()
  disputeId: string;

  @ApiProperty({ description: 'ID of the user requesting the analysis' })
  @IsString()
  viewerId: string;

  @ApiProperty({ description: 'Role of the viewer in the dispute', enum: ['buyer', 'seller', 'moderator'] })
  @IsEnum(['buyer', 'seller', 'moderator'])
  viewerRole: 'buyer' | 'seller' | 'moderator';
}

export class GenerateResolutionMessageDto {
  @ApiProperty({ enum: ['full_refund', 'partial_refund', 'no_refund'] })
  @IsEnum(['full_refund', 'partial_refund', 'no_refund'])
  resolutionType: 'full_refund' | 'partial_refund' | 'no_refund';

  @ApiProperty()
  @IsString()
  disputeTitle: string;

  @ApiProperty({ enum: ['not_received', 'defective', 'not_as_described', 'other'] })
  @IsEnum(['not_received', 'defective', 'not_as_described', 'other'])
  category: 'not_received' | 'defective' | 'not_as_described' | 'other';

  @ApiProperty()
  @IsString()
  productTitle: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  orderAmount: number;

  @ApiPropertyOptional({ description: 'Refund amount for partial refunds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}

export class SuggestedResolutionDto {
  @ApiProperty({ enum: ['full_refund', 'partial_refund', 'no_refund', 'replacement', 'mutual_agreement'] })
  type: 'full_refund' | 'partial_refund' | 'no_refund' | 'replacement' | 'mutual_agreement';

  @ApiProperty()
  description: string;

  @ApiProperty({ description: 'Fairness score from 1-10' })
  fairnessScore: number;
}

export class DisputeAnalysisResponseDto {
  @ApiProperty()
  summary: string;

  @ApiProperty({ description: 'Personalized key points based on viewer role' })
  keyPoints: {
    yourClaims: string[];      // The viewer's claims (personalized)
    theirClaims: string[];     // The other party's claims (personalized)
    buyerClaims: string[];     // Original buyer claims (for reference)
    sellerClaims: string[];    // Original seller claims (for reference)
  };

  @ApiProperty()
  sentiment: {
    yours: 'cooperative' | 'frustrated' | 'hostile' | 'neutral';  // Viewer's sentiment
    theirs: 'cooperative' | 'frustrated' | 'hostile' | 'neutral'; // Other party's sentiment
    buyer: 'cooperative' | 'frustrated' | 'hostile' | 'neutral';
    seller: 'cooperative' | 'frustrated' | 'hostile' | 'neutral';
  };

  @ApiProperty({ type: [SuggestedResolutionDto] })
  suggestedResolutions: SuggestedResolutionDto[];

  @ApiProperty()
  recommendedAction: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  riskLevel: 'low' | 'medium' | 'high';

  @ApiProperty()
  additionalNotes: string;

  @ApiProperty({ description: 'Role of the viewer who requested this analysis' })
  viewerRole: 'buyer' | 'seller' | 'moderator';
}
