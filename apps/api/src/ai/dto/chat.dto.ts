import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content: string;
}

class ChatContextDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentScreen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class ChatRequestDto {
  @ApiProperty({ description: 'The user message' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    type: [ChatMessageDto],
    description: 'Previous conversation messages',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[];

  @ApiPropertyOptional({
    type: ChatContextDto,
    description: 'Context about the current state',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChatContextDto)
  context?: ChatContextDto;
}

class ChatActionDto {
  @ApiProperty({ enum: ['navigate', 'search', 'filter'] })
  type: 'navigate' | 'search' | 'filter';

  @ApiProperty()
  label: string;

  @ApiProperty()
  payload: Record<string, string>;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'The AI response message' })
  message: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Suggested follow-up messages',
  })
  suggestions?: string[];

  @ApiPropertyOptional({
    type: [ChatActionDto],
    description: 'Suggested actions',
  })
  actions?: ChatActionDto[];
}

export class SuggestResponsesDto {
  @ApiProperty({ type: [Object], description: 'Conversation history' })
  @IsArray()
  conversationHistory: Array<{ sender: string; message: string }>;

  @ApiProperty({ enum: ['buyer', 'seller', 'moderator'] })
  @IsIn(['buyer', 'seller', 'moderator'])
  respondAs: 'buyer' | 'seller' | 'moderator';

  @ApiProperty({ description: 'Brief description of the dispute' })
  @IsString()
  disputeContext: string;
}

export class QuickActionsDto {
  @ApiProperty({ description: 'Current screen name' })
  @IsString()
  currentScreen: string;
}
