import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RephraseMessageDto {
  @ApiProperty({ description: 'The message to analyze and rephrase' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @ApiProperty({
    description: 'Role of the sender',
    enum: ['buyer', 'seller', 'moderator'],
  })
  @IsEnum(['buyer', 'seller', 'moderator'])
  senderRole: 'buyer' | 'seller' | 'moderator';

  @ApiPropertyOptional({ description: 'Optional dispute context' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  disputeContext?: string;
}

export class RephraseResponseDto {
  @ApiProperty({ description: 'Original message' })
  original: string;

  @ApiProperty({
    description: 'Rephrased message (same if already professional)',
  })
  rephrased: string;

  @ApiProperty({ description: 'Whether the original was professional' })
  isProfessional: boolean;

  @ApiProperty({ description: 'Issues found in the message', type: [String] })
  issues: string[];

  @ApiProperty({
    description: 'Suggestions for better communication',
    type: [String],
  })
  suggestions: string[];
}
